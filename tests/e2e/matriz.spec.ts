import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

test.use({ storageState: storageStatePath('admin') })

test.describe('Matriz de Atividades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/matriz')
    // Wait for table to render
    await page.waitForSelector('table', { timeout: 10_000 })
  })

  test('screenshot mobile — matriz baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('matriz-mobile.png', { maxDiffPixelRatio: 0.02 })
  })

  test('renders page title and table', async ({ page }) => {
    await expect(page.getByText(/matriz de atividades/i)).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('today row is highlighted', async ({ page }) => {
    // Today label should appear in the frozen date column
    await expect(page.getByText('Hoje')).toBeVisible()
  })

  test('navigating to /matriz from nav works', async ({ page }) => {
    await page.goto('/kanban')
    await page.getByRole('link', { name: /matriz/i }).click()
    await expect(page).toHaveURL(/\/matriz/)
    await expect(page.getByText(/matriz de atividades/i)).toBeVisible({ timeout: 5_000 })
  })

  test('week navigation updates URL and exposes "Hoje"', async ({ page }) => {
    // On the current window there is no "Ir para hoje" control.
    await expect(page.getByRole('link', { name: 'Ir para hoje' })).toHaveCount(0)

    // Advance one week → URL gains a ?ref= anchor and "Ir para hoje" appears.
    await page.getByRole('link', { name: 'Próxima semana' }).click()
    await expect(page).toHaveURL(/\/matriz\?ref=\d{4}-\d{2}-\d{2}/)
    await expect(page.getByRole('link', { name: 'Ir para hoje' })).toBeVisible()

    // Back to today clears the anchor.
    await page.getByRole('link', { name: 'Ir para hoje' }).click()
    await expect(page).toHaveURL(/\/matriz$/)
    await expect(page.getByRole('link', { name: 'Ir para hoje' })).toHaveCount(0)
  })
})

test.describe('Matriz — efetivo access', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  test('efetivo can view matriz', async ({ page }) => {
    await page.goto('/matriz')
    await page.waitForSelector('table', { timeout: 10_000 })
    await expect(page.getByText(/matriz de atividades/i)).toBeVisible()
  })
})
