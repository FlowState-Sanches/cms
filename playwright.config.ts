import { defineConfig, devices } from "@playwright/test";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";

export default defineConfig({
  testDir: "./e2e",
  // Task B7 (FLOW-438): o cenário principal (professor cria/submete, admin
  // publica) usa sessões (cookies) sequenciais na mesma máquina; não roda em
  // paralelo consigo mesmo nem com os outros specs.
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/setup/seed-users.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    env: { API_BASE_URL },
    timeout: 180_000,
  },
});
