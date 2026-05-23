import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // single user session at a time to avoid auth conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Seed: create persona users via admin API (must run before login)
    { name: 'seed', testMatch: /seed\.setup\.ts/ },

    // Setup: create storageState files per persona
    { name: 'setup', testMatch: /auth\.setup\.ts/, dependencies: ['seed'] },

    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Mobile — 360×740 (Galaxy S8) — screenshot diff baseline
    {
      name: 'mobile',
      use: {
        ...devices['Galaxy S8'],
        viewport: { width: 360, height: 740 },
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    // CI: reuse the pre-built .next output via `pnpm start` (faster, consistent).
    // Local: `pnpm dev` with hot reload.
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
