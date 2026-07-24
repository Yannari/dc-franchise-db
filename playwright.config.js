// Playwright config for the primary-journey E2E safety net (UX Plan Item 13).
//
// Run:   npm run test:e2e          (or: npx playwright test)
// Setup: npx playwright install chromium   (one-time, downloads the browser)
//
// The web server MUST be serve.py — it sends Cache-Control: no-store. Plain
// `python -m http.server` heuristically caches ES modules and poisons runs with
// stale "module does not provide an export" ghosts. reuseExistingServer lets you
// keep a serve.py already running on 4173; otherwise Playwright starts one.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,          // a full season sim + finale runs inside one test
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python serve.py 4173',
    url: 'http://localhost:4173/simulator.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
