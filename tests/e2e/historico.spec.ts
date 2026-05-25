import { test, expect } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

test.use({ storageState: storageStatePath('admin') })

// Helper: navega para /historico e aguarda o RSC terminar de fazer stream.
// networkidle é frágil com App Router streaming — espera pelo h1 em vez disso.
async function gotoHistorico(page: import('@playwright/test').Page, qs = '') {
  await page.goto(`/historico${qs}`)
  await expect(page.getByRole('heading', { name: /histórico de tarefas/i })).toBeVisible({
    timeout: 10_000,
  })
}

test.describe('Histórico — admin', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHistorico(page)
  })

  test('nav link "Histórico" visível na barra de navegação', async ({ page }, testInfo) => {
    // TODO(sprint-21): no mobile a navbar colapsa em menu; o link nao fica visivel
    // diretamente. Cobrir mobile abrindo o menu antes. Por ora valida so no desktop.
    test.skip(testInfo.project.name === 'mobile', 'nav colapsada no mobile — abrir menu antes (TODO)')
    await expect(page.getByRole('link', { name: /histórico/i })).toBeVisible()
  })

  test('tabela exibe os 5 cabeçalhos corretos', async ({ page }) => {
    for (const header of ['Título', 'Setor', 'Status', 'Entrega', 'Responsáveis']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }
  })

  test('busca: digitar atualiza URL com q= e page=1', async ({ page }) => {
    const input = page.getByPlaceholder(/pesquisar/i)
    await input.fill('relatório')
    // Debounce 400ms + startTransition + router.push
    await page.waitForURL(/q=relat/, { timeout: 5_000 })
    expect(page.url()).toContain('q=relat')
    expect(page.url()).toContain('page=1')
  })

  test('clear button remove q= da URL', async ({ page }) => {
    // Navega com query preexistente
    await gotoHistorico(page, '?q=termo&page=1')

    // Botão X só aparece quando inputValue não é vazio
    const clearBtn = page.getByRole('button', { name: 'Limpar busca' })
    await expect(clearBtn).toBeVisible({ timeout: 3_000 })
    await clearBtn.click()

    // Debounce + router.push → URL não tem mais q=
    await page.waitForURL((url) => !url.searchParams.has('q'), { timeout: 5_000 })
    expect(page.url()).not.toContain('q=')
  })

  test('busca sem resultado exibe mensagem de estado vazio', async ({ page }) => {
    // String impossível de existir como título/descrição/setor
    await gotoHistorico(page, '?q=xkcd_zzz_not_found_42')
    await expect(page.getByText(/nenhuma tarefa encontrada/i)).toBeVisible({ timeout: 5_000 })
  })

  // TODO(sprint-21): baseline visual ausente. Gerar com `pnpm test:e2e:update`
  // e revisar a imagem (AGENTS.md secao 5) antes de reabilitar.
  test.skip('screenshot baseline — desktop (atualizar com --update-snapshots na primeira execução)', async ({
    page,
  }) => {
    await expect(page).toHaveScreenshot('historico-desktop.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
