import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { SeedUsersFile } from "./setup/seed-users";

/**
 * E2E do CMS responsivo (spec 2026-09-25-cms-responsivo-design.md §4 e §6).
 * Roda no chromium do projeto, trocando só o viewport: 390 x 844 (celular),
 * 768 x 1024 (tablet) e 360 x 740 (celular estreito, calendário e diálogo).
 * Só lê dados: o diálogo de bloqueio é aberto e cancelado, nada é salvo.
 *
 * Elementos com display: none e o conteúdo de <details> fechado ficam fora
 * de getByRole, então cada consulta por papel acha só a versão visível
 * (tabela ou cartões, barra ou menu).
 */

const USERS_FILE = path.resolve(__dirname, ".auth/users.json");

type Credentials = { email: string; password: string };

function readSeedUsers(): SeedUsersFile {
  return JSON.parse(readFileSync(USERS_FILE, "utf8")) as SeedUsersFile;
}

async function login(page: Page, user: Credentials): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  // Sem esperar o redirect, um page.goto logo em seguida sai antes do cookie de sessão.
  await page.waitForURL((url) => url.pathname !== "/login");
}

async function expectNoPageOverflow(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `${route}: a página rola na horizontal`).toBeLessThanOrEqual(innerWidth);
}

async function expectTouchTarget(locator: Locator, label: string): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`${label}: sem caixa (elemento oculto?)`);
  }
  expect(box.height, `${label}: altura`).toBeGreaterThanOrEqual(44);
  expect(box.width, `${label}: largura`).toBeGreaterThanOrEqual(44);
}

/** Primeiro treino da lista, se houver (a trilha local pode estar vazia). */
async function firstTrainingHref(page: Page): Promise<string | null> {
  await page.goto("/treinos");
  const link = page.locator('a[href^="/treinos/"]:not([href^="/treinos/novo"])').first();
  if ((await link.count()) === 0) {
    return null;
  }
  return link.getAttribute("href");
}

async function expectBlockDialogFits(
  page: Page,
  viewport: { width: number; height: number },
  stacked: boolean,
): Promise<void> {
  const { admin, surfista } = readSeedUsers();
  await login(page, admin);
  await page.goto(`/alunos/${surfista.userId}`);

  await page.getByRole("button", { name: "Bloquear", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Bloquear conta" });
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  if (!box) {
    throw new Error("diálogo sem caixa");
  }
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

  const cancel = dialog.getByRole("button", { name: "Cancelar" });
  const confirm = dialog.getByRole("button", { name: "Confirmar bloqueio" });
  await expectTouchTarget(cancel, "Cancelar");
  await expectTouchTarget(confirm, "Confirmar bloqueio");

  if (stacked) {
    const cancelBox = await cancel.boundingBox();
    const confirmBox = await confirm.boundingBox();
    if (!cancelBox || !confirmBox) {
      throw new Error("botões do diálogo sem caixa");
    }
    expect(confirmBox.y, "Confirmar fica abaixo de Cancelar").toBeGreaterThan(cancelBox.y);
    expect(Math.abs(confirmBox.width - cancelBox.width)).toBeLessThanOrEqual(1);
  }

  await cancel.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
}

async function expectCalendarFits(page: Page): Promise<void> {
  const { admin } = readSeedUsers();
  await login(page, admin);
  await expect(page).toHaveURL(/\/painel$/);

  const calendar = page.getByRole("table", { name: /^Calendário de / });
  await expect(calendar).toBeVisible();
  const region = page.getByRole("region", { name: "Calendário do mês" });
  expect(await region.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
  for (const day of await calendar.getByRole("link").all()) {
    await expectTouchTarget(day, (await day.getAttribute("aria-label")) ?? "dia do calendário");
  }
}

const VIEWPORTS = [
  { name: "celular", width: 390, height: 844, cards: true },
  { name: "tablet", width: 768, height: 1024, cards: false },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width} x ${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("login não rola na horizontal", async ({ page }) => {
      await expectNoPageOverflow(page, "/login");
    });

    test("admin: nenhuma rota rola na horizontal", async ({ page }) => {
      const { admin, professor, surfista } = readSeedUsers();
      await login(page, admin);
      const training = await firstTrainingHref(page);
      const routes = [
        "/painel",
        "/treinos",
        "/treinos/novo",
        "/revisao",
        "/pilares/tecnico/ordem",
        "/professores",
        `/professores/${professor.userId}`,
        "/alunos",
        `/alunos/${surfista.userId}`,
        "/fotografos",
        "/admins",
        "/midias",
        ...(training ? [training] : []),
      ];
      for (const route of routes) {
        await expectNoPageOverflow(page, route);
      }
    });

    test("professor: nenhuma rota rola na horizontal", async ({ page }) => {
      const { professor } = readSeedUsers();
      await login(page, professor);
      const training = await firstTrainingHref(page);
      for (const route of ["/treinos", "/treinos/novo", "/painel", ...(training ? [training] : [])]) {
        await expectNoPageOverflow(page, route);
      }
    });

    test("admin: o menu abre por teclado, mostra os 8 itens, navega e fecha", async ({ page }) => {
      const { admin } = readSeedUsers();
      await login(page, admin);
      await expect(page).toHaveURL(/\/painel$/);

      const details = page.locator("header details");
      const summary = details.locator("summary");
      await expect(summary).toHaveText("Menu");
      await expectTouchTarget(summary, "botão Menu");
      // Playwright 1.63 não tem matcher toBeExpanded: <details> reflete o estado
      // na propriedade JS `open` (o atributo booleano equivalente no DOM).
      await expect(details).toHaveJSProperty("open", false);
      await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);

      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveJSProperty("open", true);

      const nav = page.getByRole("navigation", { name: "Principal" });
      await expect(nav).toHaveCount(1);
      const links = nav.getByRole("link");
      await expect(links).toHaveCount(8);
      await expect(nav.getByRole("link", { name: "Painel" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      for (const link of await links.all()) {
        await expectTouchTarget(link, `menu: ${(await link.textContent()) ?? ""}`);
      }
      await expect(details.getByText(admin.name, { exact: true })).toBeVisible();
      await expect(details.getByText("Curadoria", { exact: true })).toBeVisible();
      await expectTouchTarget(page.getByRole("button", { name: "Sair" }), "Sair");

      await nav.getByRole("link", { name: "Professores" }).click();
      await expect(page).toHaveURL(/\/professores$/);
      await expect(page.getByRole("heading", { level: 1, name: "Professores" })).toBeVisible();
      await expect(details).toHaveJSProperty("open", false);

      await summary.click();
      await expect(details).toHaveJSProperty("open", true);
      await page.keyboard.press("Escape");
      await expect(details).toHaveJSProperty("open", false);
      await expect(summary).toBeFocused();
    });

    test("professor: o menu mostra só Treinos", async ({ page }) => {
      const { professor } = readSeedUsers();
      await login(page, professor);
      await page.locator("header details summary").click();
      const nav = page.getByRole("navigation", { name: "Principal" });
      await expect(nav.getByRole("link")).toHaveCount(1);
      await expect(nav.getByRole("link", { name: "Treinos" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    if (viewport.cards) {
      test("listas viram cartões com o nome como link e os mesmos dados e ações", async ({
        page,
      }) => {
        const { admin, professor, surfista } = readSeedUsers();
        await login(page, admin);

        await page.goto(`/professores?q=${encodeURIComponent(professor.email)}`);
        await expect(page.getByRole("table", { name: "Professores" })).toHaveCount(0);
        const professorCard = page
          .getByRole("list", { name: "Professores" })
          .getByRole("listitem")
          .filter({ hasText: professor.email });
        await expect(
          professorCard.getByRole("link", { name: professor.name, exact: true }),
        ).toHaveAttribute("href", `/professores/${professor.userId}`);
        await expect(professorCard.getByRole("term")).toHaveText([
          "E-mail",
          "Verificação",
          "Aulas",
          "Status",
          "Cadastro",
        ]);

        await page.goto(`/alunos?q=${encodeURIComponent(surfista.email)}`);
        await expect(
          page
            .getByRole("list", { name: "Alunos" })
            .getByRole("link", { name: surfista.name, exact: true }),
        ).toBeVisible();

        await page.goto("/admins");
        await expect(page.getByRole("table", { name: "Admins do CMS" })).toHaveCount(0);
        const adminCard = page
          .getByRole("list", { name: "Admins do CMS" })
          .getByRole("listitem")
          .filter({ hasText: admin.email });
        await expect(adminCard).toContainText("(você)");
        await expectTouchTarget(
          adminCard.getByRole("button", { name: "Revogar", exact: true }),
          "Revogar no cartão",
        );
      });

      test("calendário: 7 colunas cabem e cada dia tem 44 x 44", async ({ page }) => {
        await expectCalendarFits(page);
      });
    } else {
      test("listas continuam tabela a partir de 768 px", async ({ page }) => {
        const { admin, professor } = readSeedUsers();
        await login(page, admin);

        await page.goto(`/professores?q=${encodeURIComponent(professor.email)}`);
        await expect(page.getByRole("list", { name: "Professores" })).toHaveCount(0);
        await expect(
          page
            .getByRole("table", { name: "Professores" })
            .getByRole("link", { name: professor.name, exact: true }),
        ).toBeVisible();

        await page.goto("/admins");
        await expect(page.getByRole("list", { name: "Admins do CMS" })).toHaveCount(0);
        await expect(
          page.getByRole("table", { name: "Admins do CMS" }).getByRole("row").filter({
            hasText: admin.email,
          }),
        ).toBeVisible();
      });
    }

    test("o diálogo de bloqueio cabe na tela", async ({ page }) => {
      await expectBlockDialogFits(page, viewport, viewport.cards);
    });
  });
}

test.describe("celular estreito 360 x 740", () => {
  const viewport = { width: 360, height: 740 };
  test.use({ viewport });

  test("calendário: 7 colunas cabem e cada dia tem 44 x 44", async ({ page }) => {
    await expectCalendarFits(page);
  });

  test("o diálogo de bloqueio cabe na tela, com botões empilhados", async ({ page }) => {
    await expectBlockDialogFits(page, viewport, true);
  });

  test("painel e listas não rolam na horizontal", async ({ page }) => {
    const { admin } = readSeedUsers();
    await login(page, admin);
    for (const route of ["/painel", "/treinos", "/professores", "/admins", "/midias"]) {
      await expectNoPageOverflow(page, route);
    }
  });
});
