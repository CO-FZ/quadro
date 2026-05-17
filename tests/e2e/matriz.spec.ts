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
})

test.describe('Matriz — efetivo access', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  test('efetivo can view matriz', async ({ page }) => {
    await page.goto('/matriz')
    await page.waitForSelector('table', { timeout: 10_000 })
    await expect(page.getByText(/matriz de atividades/i)).toBeVisible()
  })
})
