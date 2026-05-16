// Runs as 'setup' project in playwright.config.ts (before all tests).
// Creates storageState per persona so tests can reuse sessions.
import { test as setup } from '@playwright/test'
import { loginAs, storageStatePath } from './fixtures/auth'

for (const persona of ['admin', 'coord', 'efetivo'] as const) {
  setup(`create ${persona} session`, async ({ page }) => {
    await loginAs(page, persona)
    await page.goto('/')
    // Wait for auth to propagate
    await page.waitForURL(/kanban|dashboard/, { timeout: 10_000 })
    await page.context().storageState({ path: storageStatePath(persona) })
  })
}
