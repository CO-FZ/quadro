import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

test.use({ storageState: storageStatePath('admin') })

test.describe('Histórico — admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/historico')
    await page.waitForLoadState('networkidle')
  })

  test('nav link "Histórico" visível na barra principal', async ({ page }) => {
    await expect(page.getByRole('link', { name: /histórico/i })).toBeVisible()
  })

  test('tabela exibe os 5 cabeçalhos corretos', async ({ page }) => {
    for (const header of ['Título', 'Setor', 'Status', 'Entrega', 'Responsáveis']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }
  })

  test('busca atualiza URL com parâmetro q', async ({ page }) => {
    const input = page.getByPlaceholder(/pesquisar/i)
    await input.fill('teste')
    // Debounce 400ms + transition — aguarda URL mudar
    await page.waitForURL(/q=teste/, { timeout: 3_000 })
    expect(page.url()).toContain('q=teste')
    expect(page.url()).toContain('page=1')
  })

  test('limpar busca remove parâmetro q da URL', async ({ page }) => {
    await page.goto('/historico?q=termo&page=1')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await page.waitForURL(/\/historico(?!\?q=)/, { timeout: 3_000 })

    expect(page.url()).not.toContain('q=')
  })

  test('estado vazio exibe mensagem "Nenhuma tarefa encontrada"', async ({ page }) => {
    await page.goto('/historico?q=zzz_busca_que_nao_existe_xkcd')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/nenhuma tarefa encontrada/i)).toBeVisible()
  })

  test('screenshot — historico baseline (desktop)', async ({ page }) => {
    await expect(page).toHaveScreenshot('historico-desktop.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
