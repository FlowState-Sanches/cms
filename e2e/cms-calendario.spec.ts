import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { SeedUsersFile } from "./setup/seed-users";

/**
 * E2E do calendário do painel (nota "base": clicar num dia ou em "Mês
 * anterior"/"Próximo mês" não pode levar a tela ao topo). A navegação do
 * `MonthCalendar` é client-side (`Link`), mas o calendário fica abaixo do
 * título "Painel"; sem `scroll={false}` o Next rola até o topo da Page a
 * cada clique.
 *
 * Roda nos dois viewports do bug relatado (celular e desktop). Só leitura:
 * nenhum dado é alterado.
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

/**
 * Rola até `target` ficar visível e garante `window.scrollY > 0`. Em
 * viewports altos o `scrollIntoViewIfNeeded` pode não precisar rolar a
 * página (o calendário já cabe): nesse caso força a rolagem até a posição
 * do próprio elemento, para o teste continuar significativo.
 */
async function ensureScrolled(page: Page, target: Locator): Promise<number> {
  await target.scrollIntoViewIfNeeded();
  let scrollY = await page.evaluate(() => window.scrollY);
  if (scrollY === 0) {
    const top = await target.evaluate((element) => {
      return element.getBoundingClientRect().top + window.scrollY;
    });
    await page.evaluate((y) => window.scrollTo(0, y), top);
    scrollY = await page.evaluate(() => window.scrollY);
  }
  return scrollY;
}

/**
 * Escolhe um dia do calendário diferente do selecionado, sem depender do
 * relógio da máquina: lê o `href` do link marcado com `aria-current="date"`
 * (o selecionado, hoje por padrão) e usa o dia 15, ou 14 se o selecionado
 * for justamente o 15. Como todo mês tem os dias 14 e 15, o link sempre
 * existe.
 */
async function pickAlternateDay(
  calendar: Locator,
): Promise<{ link: Locator; expectedUrl: RegExp }> {
  const selectedHref = await calendar.locator('a[aria-current="date"]').getAttribute("href");
  const selectedDayNumber = selectedHref?.match(/dia=\d{4}-\d{2}-(\d{2})/)?.[1];
  const dayNumber = selectedDayNumber === "15" ? "14" : "15";
  const link = calendar.getByRole("link", { name: new RegExp(`^${Number(dayNumber)} de `) });
  const expectedUrl = new RegExp(`dia=\\d{4}-\\d{2}-${dayNumber}$`);
  return { link, expectedUrl };
}

async function expectMonthNavKeepsScroll(
  page: Page,
  linkName: "Mês anterior" | "Próximo mês",
): Promise<void> {
  const { admin } = readSeedUsers();
  await login(page, admin);
  await expect(page).toHaveURL(/\/painel$/);

  const calendar = page.getByRole("table", { name: /^Calendário de / });
  await expect(calendar).toBeVisible();
  const titleBefore = await page.locator("#calendario-titulo").textContent();

  const navLink = page.getByRole("link", { name: linkName });
  const scrollBefore = await ensureScrolled(page, navLink);
  expect(scrollBefore).toBeGreaterThan(0);

  await navLink.click();
  await expect(page).toHaveURL(/\/painel\?mes=\d{4}-\d{2}$/);
  await expect(page.locator("#calendario-titulo")).not.toHaveText(titleBefore ?? "");

  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);
}

const VIEWPORTS = [
  { name: "celular", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 700 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width} x ${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("clicar num dia do calendário mantém a posição da tela", async ({ page }) => {
      const { admin } = readSeedUsers();
      await login(page, admin);
      await expect(page).toHaveURL(/\/painel$/);

      const calendar = page.getByRole("table", { name: /^Calendário de / });
      await expect(calendar).toBeVisible();

      const { link: dayLink, expectedUrl } = await pickAlternateDay(calendar);
      const scrollBefore = await ensureScrolled(page, dayLink);
      expect(scrollBefore).toBeGreaterThan(0);

      await dayLink.click();
      await expect(page).toHaveURL(expectedUrl);
      await expect(dayLink).toHaveAttribute("aria-current", "date");
      await expect(page.getByRole("heading", { name: /^Agenda de / })).toBeVisible();

      const scrollAfter = await page.evaluate(() => window.scrollY);
      expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);
    });

    test('clicar em "Mês anterior" mantém a posição da tela', async ({ page }) => {
      await expectMonthNavKeepsScroll(page, "Mês anterior");
    });

    test('clicar em "Próximo mês" mantém a posição da tela', async ({ page }) => {
      await expectMonthNavKeepsScroll(page, "Próximo mês");
    });
  });
}
