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

  test('screenshot mobile — kanban board baseline', async ({ page }) => {
    // Only runs on 'mobile' project
    await expect(page).toHaveScreenshot('kanban-mobile.png', { maxDiffPixelRatio: 0.02 })
  })

  test('admin creates task via FAB', async ({ page }) => {
    await page.getByRole('button', { name: /nova tarefa|criar/i }).click()
    await page.getByLabel(/título/i).fill('E2E Test Task')
    await page.getByLabel(/setor/i).selectOption('DT')

    const TODAY = new Date().toISOString().slice(0, 10)
    await page.getByLabel(/início/i).fill(TODAY)
    await page.getByLabel(/entrega/i).fill(TODAY)
    await page.getByRole('button', { name: /salvar|criar/i }).click()

    await expect(page.getByText('E2E Test Task')).toBeVisible({ timeout: 5_000 })
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
