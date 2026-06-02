import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for Moonsbow Core Dashboard.
 *
 * To run tests:
 *   1. Ensure backend is running: docker compose up
 *   2. Ensure frontend dev server is running: cd frontend && npm run dev
 *   3. Run tests: cd frontend && npx playwright test
 *
 * To run with visible browser (headed):
 *   npx playwright test --headed
 *
 * To run a single test:
 *   npx playwright test --grep "login"
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 60 * 1000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
