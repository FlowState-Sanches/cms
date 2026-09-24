import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { SeedUsersFile } from "./setup/seed-users";

/**
 * E2E local (FLOW-438 / Task B7): professor verificado cria e submete um
 * treino, admin publica, e o app (`GET /trilha`) enxerga o treino publicado.
 * Cobre também os dois desvios de acesso: papel sem permissão e sessão
 * ausente.
 *
 * Pré-requisito: API local rodando em `API_BASE_URL` (ver `playwright.config.ts`)
 * e o container docker `flowstate-postgres` disponível (usado só pelo
 * `globalSetup`, `e2e/setup/seed-users.ts`).
 */

const API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

const USERS_FILE = path.resolve(__dirname, ".auth/users.json");

function readSeedUsers(): SeedUsersFile {
  return JSON.parse(readFileSync(USERS_FILE, "utf8")) as SeedUsersFile;
}

function uniqueCode(): string {
  // "E2E" + 6 caracteres alfanuméricos aleatórios: 9 caracteres, dentro do
  // limite de 10 do campo `code` (`^[A-Za-z0-9]{1,10}$`).
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `E2E${suffix}`;
}

async function login(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function apiLogin(
  request: APIRequestContext,
  user: { email: string; password: string },
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}

async function archiveTraining(
  request: APIRequestContext,
  adminToken: string,
  trainingId: string,
): Promise<void> {
  await request.post(
    `${API_BASE_URL}/cms/trilha/treinos/${trainingId}/arquivar`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
}

test.describe("professor cria e submete, admin publica, app vê (FLOW-438)", () => {
  let trainingId: string | undefined;
  let adminToken: string | undefined;

  test.afterAll(async ({ request }) => {
    // Limpeza: arquiva o treino de E2E mesmo se o teste falhar no meio do
    // caminho, para não poluir a trilha local. Best-effort: se o treino
    // nunca chegou a existir, ou o admin nunca logou, não há o que limpar.
    if (trainingId && adminToken) {
      await archiveTraining(request, adminToken, trainingId).catch(() => {
        // Best-effort: falha aqui não deve mascarar a falha original do teste.
      });
    }
  });

  test("professor cria e submete, admin publica, app vê", async ({ page, request }) => {
    const users = readSeedUsers();
    const code = uniqueCode();
    const title = `Treino E2E ${code}`;

    await login(page, users.professor);
    await expect(page).toHaveURL(/\/treinos$/);

    await page.getByRole("link", { name: "Novo treino" }).click();
    await expect(page).toHaveURL(/\/treinos\/novo/);

    await page.getByLabel("Código").fill(code);
    await page.getByLabel("Nível").fill("Iniciante");
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel("Subtítulo").fill("Verificação ponta a ponta do CMS");
    await page.getByLabel("Duração (minutos)").fill("15");
    await page
      .getByLabel("Resumo")
      .fill("Treino criado pelo teste E2E para validar o fluxo completo do CMS.");
    await page
      .getByLabel(/^aprendizado 1$/i)
      .fill("Validar a esteira de criação, revisão e publicação.");
    await page.getByLabel("Frase do coach").fill("Continue evoluindo a cada sessão.");
    await page.getByLabel("Autor da frase").fill("Coach E2E");
    await page.getByLabel("Dica de desbloqueio").fill("Complete o treino anterior.");
    await page
      .getByLabel(/^pergunta 1$/i)
      .fill("Você concluiu o treino com atenção plena?");

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page).toHaveURL(/\/treinos\/[a-z0-9-]+$/);
    trainingId = new URL(page.url()).pathname.split("/").pop();
    await expect(page.getByText("Rascunho", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Enviar para revisão" }).click();
    await expect(
      page.getByText("Em revisão", { exact: true }).first(),
    ).toBeVisible();

    await logout(page);

    await login(page, users.admin);
    await expect(page).toHaveURL(/\/treinos$/);

    // Captura o token do admin assim que ele loga (antes de publicar): se o
    // teste falhar a partir daqui, o `afterAll` ainda consegue arquivar o
    // treino de teste em vez de deixar debris na trilha local.
    adminToken = await apiLogin(request, users.admin);

    await page.getByRole("link", { name: /Fila de revisão/ }).click();
    await expect(page).toHaveURL(/\/revisao$/);
    await page.getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`/treinos/${trainingId}$`));

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(
      page.getByText("Publicado", { exact: true }).first(),
    ).toBeVisible();

    const professorToken = await apiLogin(request, users.professor);
    const trilhaResponse = await request.get(`${API_BASE_URL}/trilha`, {
      headers: { Authorization: `Bearer ${professorToken}` },
    });
    expect(trilhaResponse.ok()).toBe(true);
    const trilha = (await trilhaResponse.json()) as {
      trainings: { title: string }[];
    };
    expect(trilha.trainings.some((t) => t.title === title)).toBe(true);
  });
});

test("surfista não entra no CMS", async ({ page, request }) => {
  const stamp = Date.now();
  const email = `e2e-surfista-${stamp}@flowstate.test`;
  const password = "E2eSurfista!9";

  const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { name: "Surfista E2E", email, password },
  });
  expect(registerResponse.ok()).toBe(true);

  await login(page, { email, password });

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Sua conta não tem acesso ao CMS da Trilha. Fale com a curadoria FlowState."),
  ).toBeVisible();
});

test("sem cookie redireciona para /login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/treinos");
  await expect(page).toHaveURL(/\/login$/);
});
