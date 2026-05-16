import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

test.use({ storageState: storageStatePath('admin') })

test.describe('Admin — Whitelist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('[data-testid="admin-page"]', { timeout: 10_000 })
  })

  test('screenshot mobile — admin page baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('admin-mobile.png', { maxDiffPixelRatio: 0.02 })
  })

  test('bulk add with csv input', async ({ page }) => {
    await page.getByRole('tab', { name: /whitelist/i }).click()
    await page.getByPlaceholder(/emails?/i).fill('e2e-a@wl.test, e2e-b@wl.test')
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/2 adicionado/i)).toBeVisible({ timeout: 5_000 })
  })

  test('duplicate entry shows ignore count', async ({ page }) => {
    await page.getByRole('tab', { name: /whitelist/i }).click()
    await page.getByPlaceholder(/emails?/i).fill('e2e-a@wl.test, e2e-new@wl.test')
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/ignorado/i)).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Admin — Roles', () => {
  test('last-admin guard shows toast LAST_ADMIN', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('tab', { name: /usuários/i }).click()

    // Find admin row and try to demote
    const adminRow = page.locator('[data-testid^="user-row"][data-role="admin"]').first()
    if (!await adminRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await adminRow.getByRole('combobox').selectOption('efetivo')
    await adminRow.getByRole('button', { name: /salvar|aplicar/i }).click()

    await expect(page.getByRole('alert')).toContainText(/último admin|last_admin/i, { timeout: 3_000 })
  })
})

test.describe('Admin — Soft-delete', () => {
  test('archive and restore user', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('tab', { name: /usuários/i }).click()

    // Find coord row to archive
    const coordRow = page.locator('[data-testid^="user-row"][data-role="coordenador"]').first()
    if (!await coordRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await coordRow.getByRole('button', { name: /arquivar/i }).click()
    await expect(coordRow.getByText(/arquivado/i)).toBeVisible({ timeout: 3_000 })

    await coordRow.getByRole('button', { name: /restaurar/i }).click()
    await expect(coordRow.getByText(/arquivado/i)).not.toBeVisible({ timeout: 3_000 })
  })
})
