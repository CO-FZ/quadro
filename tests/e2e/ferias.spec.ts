import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

test.describe('Férias — admin gerencia e reflete na Matriz', () => {
  test.use({ storageState: storageStatePath('admin') })

  test('aba Férias: lançar período pelo nome do colaborador e refletir na Matriz', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('[data-testid="admin-page"]', { timeout: 10_000 })

    // Aba Férias visível após Auditoria
    await page.getByRole('tab', { name: /férias/i }).click()

    // Clicar no nome de um colaborador abre o modal de afastamentos
    await page.getByTitle('Gerenciar afastamentos').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })

    // Período que inclui hoje (para refletir na janela ±7d da Matriz)
    const start = ymd(-1)
    const end = ymd(5)
    await page.locator('#leave-start').fill(start)
    await page.locator('#leave-end').fill(end)
    await page.locator('#leave-type').selectOption('ferias')
    await page.getByRole('button', { name: /salvar período/i }).click()

    // Período aparece na lista "Períodos cadastrados" do modal
    await expect(page.getByRole('dialog').getByText('Férias', { exact: true }).first()).toBeVisible({ timeout: 5_000 })

    // Fechar modal → barra renderizada no Gantt
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // Reflexo na Matriz: badge "Férias" na janela atual
    await page.goto('/matriz')
    await page.waitForSelector('table', { timeout: 10_000 })
    await expect(page.getByText('Férias').first()).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Férias — coordenador vê apenas a aba Férias', () => {
  test.use({ storageState: storageStatePath('coord') })

  test('coordenador acessa /admin e vê só Férias', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForSelector('[data-testid="admin-page"]', { timeout: 10_000 })

    await expect(page.getByRole('tab', { name: /férias/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /usuários/i })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /whitelist/i })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: /auditoria/i })).toHaveCount(0)
  })
})

test.describe('Férias — efetivo sem acesso', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  test('efetivo é redirecionado de /admin para /kanban', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/kanban/, { timeout: 10_000 })
  })
})
