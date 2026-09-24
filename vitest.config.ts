import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "src/test/empty.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // e2e/ roda só pelo Playwright (npm run e2e), nunca pelo vitest.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
