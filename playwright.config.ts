// @ts-expect-error - @next/env typings are not in the current typescript paths
import { loadEnvConfig } from '@next/env'
import { defineConfig, devices } from '@playwright/test'
import { execSync } from 'node:child_process'

// Load environment variables from .env.local
loadEnvConfig(process.cwd())

// Local development override: if running locally and local Supabase is active,
// override Next.js env variables to point to the local Supabase CLI instance.
if (!process.env.CI) {
  try {
    const statusOutput = execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' })
    const statusJson = JSON.parse(statusOutput)
    
    const localUrl = statusJson.API_URL || statusJson.api_url
    const localAnonKey = statusJson.ANON_KEY || statusJson.anon_key
    const localServiceKey = statusJson.SERVICE_ROLE_KEY || statusJson.service_role_key

    if (localUrl) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = localUrl
      process.env.SUPABASE_URL = localUrl
    }
    if (localAnonKey) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = localAnonKey
    }
    if (localServiceKey) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = localServiceKey
    }
  } catch {
    // If local Supabase is not running or failed to fetch status, fall back to .env.local values
  }
}

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
