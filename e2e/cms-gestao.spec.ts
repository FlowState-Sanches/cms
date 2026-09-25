import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { SeedUsersFile } from "./setup/seed-users";

/**
 * E2E da gestão operacional (spec 2026-09-24-cms-gestao-design.md §7 e §9):
 * o admin vê o painel, tira e devolve a verificação de um professor (o
 * catálogo do app acompanha), bloqueia um aluno (login recusado com
 * ACCOUNT_BLOCKED e sessão aberta derrubada com 401), desbloqueia, concede
 * e revoga admin por e-mail e tem a autorrevogação recusada; o professor
 * verificado não entra nas áreas de gestão (CMS e API).
 *
 * Os testes dependem da ordem (mesmos usuários do seed) e rodam em série.
 * O afterAll desfaz o que um teste interrompido pode ter deixado.
 */

const API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

const USERS_FILE = path.resolve(__dirname, ".auth/users.json");

type Credentials = { email: string; password: string };

function readSeedUsers(): SeedUsersFile {
  return JSON.parse(readFileSync(USERS_FILE, "utf8")) as SeedUsersFile;
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function login(page: Page, user: Credentials): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function apiLogin(request: APIRequestContext, user: Credentials): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { accessToken: string }).accessToken;
}

test.describe.configure({ mode: "serial" });

test.afterAll(async ({ request }) => {
  const { admin, professor, surfista } = readSeedUsers();
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: admin.email, password: admin.password },
  });
  if (!response.ok()) {
    return;
  }
  const headers = bearer(((await response.json()) as { accessToken: string }).accessToken);
  // Best-effort: falha aqui não deve mascarar a falha original do teste.
  await Promise.allSettled([
    request.patch(`${API_BASE_URL}/cms/users/${surfista.userId}/unblock`, { headers }),
    request.patch(`${API_BASE_URL}/cms/professors/${professor.userId}/verification`, {
      headers,
      data: { verified: true },
    }),
    request.delete(`${API_BASE_URL}/cms/admins/${surfista.userId}`, { headers }),
  ]);
});

test("admin vê o painel com resumo, calendário do mês e agenda do dia", async ({ page }) => {
  const { admin } = readSeedUsers();
  await login(page, admin);
  await expect(page).toHaveURL(/\/painel$/);

  await expect(page.getByRole("heading", { level: 1, name: "Painel" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Pessoas" }).getByRole("link", { name: /^Alunos/ }),
  ).toBeVisible();

  const calendar = page.getByRole("table", { name: /^Calendário de / });
  await expect(calendar).toBeVisible();
  await expect(calendar.getByRole("link", { name: /\(hoje\)/ })).toHaveAttribute(
    "aria-current",
    "date",
  );

  await calendar.getByRole("link", { name: /^1 de / }).click();
  await expect(page).toHaveURL(/\/painel\?mes=\d{4}-\d{2}&dia=\d{4}-\d{2}-01$/);
  await expect(calendar.getByRole("link", { name: /^1 de / })).toHaveAttribute(
    "aria-current",
    "date",
  );
  await expect(page.getByRole("heading", { name: /^Agenda de / })).toBeVisible();

  await logout(page);
});

test("admin tira e devolve a verificação do professor; o catálogo acompanha", async ({
  page,
  request,
}) => {
  const { admin, professor, surfista } = readSeedUsers();
  const surferToken = await apiLogin(request, surfista);
  const inCatalog = async (): Promise<boolean> => {
    const response = await request.get(`${API_BASE_URL}/professors`, {
      headers: bearer(surferToken),
    });
    expect(response.ok()).toBe(true);
    const list = (await response.json()) as { id: string }[];
    return list.some((item) => item.id === professor.userId);
  };
  expect(await inCatalog()).toBe(true);

  await login(page, admin);
  await page.goto(`/professores?q=${encodeURIComponent(professor.email)}`);
  await page.getByRole("link", { name: professor.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/professores/${professor.userId}$`));
  await expect(page.getByText("Verificado", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Remover verificação", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Remover verificação" })
    .getByRole("button", { name: "Confirmar remoção" })
    .click();
  await expect(page.getByText("Pendente", { exact: true })).toBeVisible();
  await expect.poll(inCatalog).toBe(false);

  await page.getByRole("button", { name: "Verificar professor", exact: true }).click();
  await expect(page.getByText("Verificado", { exact: true })).toBeVisible();
  await expect.poll(inCatalog).toBe(true);

  await logout(page);
});

test("admin bloqueia o aluno: login recusado e sessão aberta cai; desbloquear restaura", async ({
  page,
  request,
}) => {
  const { admin, surfista } = readSeedUsers();
  const openSession = await apiLogin(request, surfista);

  await login(page, admin);
  await page.goto(`/alunos?q=${encodeURIComponent(surfista.email)}`);
  await page.getByRole("link", { name: surfista.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/alunos/${surfista.userId}$`));

  await page.getByRole("button", { name: "Bloquear", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Bloquear conta" })
    .getByRole("button", { name: "Confirmar bloqueio" })
    .click();
  await expect(page.getByText("Bloqueado", { exact: true })).toBeVisible();

  const blockedLogin = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: surfista.email, password: surfista.password },
  });
  expect(blockedLogin.status()).toBe(403);
  expect(((await blockedLogin.json()) as { code?: string }).code).toBe("ACCOUNT_BLOCKED");

  const me = await request.get(`${API_BASE_URL}/auth/me`, { headers: bearer(openSession) });
  expect(me.status()).toBe(401);

  await page.getByRole("button", { name: "Desbloquear", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Desbloquear conta" })
    .getByRole("button", { name: "Confirmar desbloqueio" })
    .click();
  await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
  await apiLogin(request, surfista);

  await logout(page);
});

test("admin concede e revoga admin por e-mail; revogar a si mesmo é recusado", async ({
  page,
}) => {
  const { admin, surfista } = readSeedUsers();
  await login(page, admin);
  await page.goto("/admins");

  await page.getByLabel("E-mail da conta").fill(surfista.email);
  await page.getByRole("button", { name: "Conceder acesso" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: `${surfista.name} agora é admin.` }),
  ).toBeVisible();

  const grantedRow = page.getByRole("row").filter({ hasText: surfista.email });
  await expect(grantedRow).toBeVisible();

  // Autorrevogação recusada: a API confere LAST_ADMIN antes de CANNOT_TARGET_SELF
  // (cms-admins.service.ts), então isto só devolve CANNOT_TARGET_SELF enquanto
  // o surfista ainda é admin (dois admins). Depois de revogar o surfista, o
  // mesmo clique bateria em LAST_ADMIN em vez disso.
  const ownRow = page.getByRole("row").filter({ hasText: admin.email });
  await ownRow.getByRole("button", { name: "Revogar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Revogar acesso de admin" });
  await dialog.getByRole("button", { name: "Confirmar revogação" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Você não pode aplicar esta ação à sua própria conta.",
  );
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(ownRow).toBeVisible();

  await grantedRow.getByRole("button", { name: "Revogar", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Revogar acesso de admin" })
    .getByRole("button", { name: "Confirmar revogação" })
    .click();
  await expect(grantedRow).toHaveCount(0);

  await logout(page);
});

test("professor verificado não entra nas áreas de gestão (CMS e API)", async ({
  page,
  request,
}) => {
  const { professor } = readSeedUsers();
  await login(page, professor);
  await expect(page).toHaveURL(/\/treinos$/);
  await expect(
    page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Painel" }),
  ).toHaveCount(0);

  for (const route of ["/painel", "/professores", "/alunos", "/fotografos", "/admins", "/midias"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
  }

  const token = await apiLogin(request, professor);
  for (const apiPath of ["/cms/dashboard/summary", "/cms/students", "/cms/admins", "/cms/media"]) {
    const response = await request.get(`${API_BASE_URL}${apiPath}`, { headers: bearer(token) });
    expect(response.status(), apiPath).toBe(403);
  }

  await logout(page);
});
