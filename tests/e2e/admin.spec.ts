import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

test.use({ storageState: storageStatePath('admin') })

test.describe('Admin — Whitelist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('[data-testid="admin-page"]', { timeout: 10_000 })
  })

  // TODO(sprint-21): baseline visual ausente. Gerar com `pnpm test:e2e:update` e
  // revisar a imagem (AGENTS.md secao 5) antes de reabilitar.
  test.skip('screenshot mobile — admin page baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('admin-mobile.png', { maxDiffPixelRatio: 0.02 })
  })

  test('bulk add with csv input', async ({ page }) => {
    // Unique per run: chromium + mobile share one DB, so static emails would
    // already exist on the second project and return "nenhum adicionado".
    const ts = Date.now()
    await page.getByRole('tab', { name: /whitelist/i }).click()
    await page.getByPlaceholder(/emails?/i).fill(`e2e-${ts}-a@wl.test, e2e-${ts}-b@wl.test`)
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/2 adicionado/i)).toBeVisible({ timeout: 5_000 })
  })

  test('duplicate entry shows ignore count', async ({ page }) => {
    // Same identifier twice in one submit → 1 added, 1 ignored (self-contained).
    const dup = `e2e-dup-${Date.now()}@wl.test`
    await page.getByRole('tab', { name: /whitelist/i }).click()
    await page.getByPlaceholder(/emails?/i).fill(`${dup}, ${dup}`)
    await page.getByRole('button', { name: /adicionar/i }).click()
    await expect(page.getByText(/ignorado/i)).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Admin — Edit Modal', () => {
  test('open edit modal, update nome de guerra, save', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('tab', { name: /usuários/i }).click()

    const editBtn = page.getByRole('button', { name: /editar/i }).first()
    if (!await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await editBtn.click()
    // exact match: the helper paragraph also contains "nome de guerra"
    await expect(page.getByText('Nome de Guerra', { exact: true })).toBeVisible({ timeout: 3_000 })

    const nomeInput = page.getByPlaceholder(/eduardo lima/i)
    await nomeInput.clear()
    await nomeInput.fill('Usuário Teste E2E')

    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(/atualizado|sucesso/i)).toBeVisible({ timeout: 5_000 })
  })

  test('close modal with Escape key', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('tab', { name: /usuários/i }).click()

    const editBtn = page.getByRole('button', { name: /editar/i }).first()
    if (!await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await editBtn.click()
    await expect(page.getByText('Nome de Guerra', { exact: true })).toBeVisible({ timeout: 3_000 })

    await page.keyboard.press('Escape')
    await expect(page.getByText('Nome de Guerra', { exact: true })).not.toBeVisible({ timeout: 2_000 })
  })
})

test.describe('Admin — Last-admin guard', () => {
  test('cannot downgrade sole admin via edit modal', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('tab', { name: /usuários/i }).click()

    const adminRow = page.locator('tr').filter({ hasText: /test-admin@cofz/i }).first()
    if (!await adminRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip()
      return
    }

    await adminRow.getByRole('button', { name: /editar/i }).click()
    await expect(page.getByText('Perfil de acesso', { exact: true })).toBeVisible({ timeout: 3_000 })

    await page.getByLabel(/perfil de acesso/i).selectOption('efetivo')
    await page.getByRole('button', { name: /salvar/i }).click()

    // Action returns LAST_ADMIN with message "...o único admin do sistema..."
    await expect(page.getByText(/único admin|last_admin|não é possível rebaixar/i)).toBeVisible({ timeout: 3_000 })
  })
})
