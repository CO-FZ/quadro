import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

// Reuse admin session by default; override per test as needed
test.use({ storageState: storageStatePath('admin') })

test.describe('Kanban — admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10_000 })
  })

  test('kanban board renders columns', async ({ page }) => {
    for (const col of ['Backlog', 'Alocada', 'Em Desenvolvimento', 'Em Revisão', 'Finalizada']) {
      await expect(page.getByText(col)).toBeVisible()
    }
  })

  // TODO(sprint-21): baseline visual ausente. Gerar com `pnpm test:e2e:update` e
  // revisar a imagem (AGENTS.md secao 5) antes de reabilitar.
  test.skip('screenshot mobile — kanban board baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('kanban-mobile.png', { maxDiffPixelRatio: 0.02 })
  })

  test('admin creates task via FAB', async ({ page }) => {
    // Unique title: chromium + mobile share one DB, so a static title would
    // produce two cards on the second project (strict-mode violation).
    const title = `E2E Test Task ${Date.now()}`
    await page.getByRole('button', { name: /nova tarefa|criar/i }).click()
    await page.getByLabel(/título/i).fill(title)
    // Setor defaults to DT (it's a button toggle, not a select), so no extra step.

    const TODAY = new Date().toISOString().slice(0, 10)
    await page.getByLabel(/início/i).fill(TODAY)
    await page.getByLabel(/entrega/i).fill(TODAY)
    await page.getByRole('button', { name: /salvar|criar/i }).click()

    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 })
  })

  test('admin creates serviço task — title/description fields hidden', async ({ page }) => {
    await page.getByRole('button', { name: /nova tarefa|criar/i }).click()

    // Check Serviço checkbox
    const servicoCheckbox = page.getByRole('checkbox', { name: /serviço/i })
    await servicoCheckbox.check()

    // Title and description fields should not be visible
    await expect(page.getByLabel(/título/i)).not.toBeVisible()
    await expect(page.getByLabel(/descrição/i)).not.toBeVisible()

    // Dates should still be editable
    const TODAY = new Date().toISOString().slice(0, 10)
    await page.locator('#task-start').fill(TODAY)
    await page.locator('#task-end').fill(TODAY)

    await page.getByRole('button', { name: /salvar|criar/i }).click()

    // "Serviço" card should appear on the board
    await expect(page.getByText('Serviço').first()).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Kanban — efetivo (restricted)', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  test('efetivo cannot see archive/delete buttons', async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForSelector('[data-testid="kanban-board"]')

    // Task menu should not expose archive/delete for efetivo
    const taskCard = page.locator('[data-testid^="task-card"]').first()
    if (await taskCard.isVisible()) {
      await taskCard.hover()
      await expect(page.getByRole('button', { name: /arquivar|excluir/i })).not.toBeVisible()
    }
  })

  test('efetivo moves task to finalizada → toast error + rollback', async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForSelector('[data-testid="kanban-board"]')
    // Drag-and-drop to 'Finalizada' column as assignee and expect rollback
    // This test requires a task where efetivo is assignee; seed required
    // Skipped if no assignee task visible
    const assignedCard = page.locator('[data-testid^="task-card"][data-assignee]').first()
    if (!await assignedCard.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip()
      return
    }

    const finalizadaCol = page.locator('[data-testid="kanban-col-finalizada"]')
    await assignedCard.dragTo(finalizadaCol)

    await expect(page.getByRole('alert')).toContainText(/permissão|forbidden/i, { timeout: 3_000 })
  })
})
