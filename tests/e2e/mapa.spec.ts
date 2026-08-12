import { test, expect, type Page } from '@playwright/test'
import { storageStatePath } from './fixtures/auth'

// Google Maps é carregado de verdade a partir do CDN da Google — em ambientes
// sem saída de rede para maps.googleapis.com o mapa nunca fica interativo.
// Os testes que dependem de clicar no mapa fazem skip gracioso nesse caso,
// em vez de travar/derrubar a suíte inteira.
async function waitForMapReady(page: Page): Promise<boolean> {
  try {
    await page.getByTestId('mapa-map-loading').waitFor({ state: 'detached', timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

// Depois da primeira obra, o mapa recentraliza em buildings[0] (zoom 15) — sem
// limpeza, cada nova obra criada na mesma posição de clique cairia em cima do
// pin anterior (o clique atingiria o marcador, não o mapa). Por isso os testes
// variam a posição de clique entre obras e sempre excluem o que criam.
async function createBuilding(page: Page, name: string, position = { x: 200, y: 200 }) {
  await page.getByRole('button', { name: '+ Nova obra' }).click()
  await expect(page.getByRole('button', { name: /clique no mapa para marcar/i })).toBeVisible()

  await page.getByTestId('mapa-map-container').click({ position })

  await expect(page.getByRole('heading', { name: 'Nova obra' })).toBeVisible({ timeout: 5_000 })
  await page.getByPlaceholder('Nome da obra').fill(name)
  await page.getByRole('button', { name: 'Criar' }).click()

  await expect(page.getByText('Obra criada.')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: `Obra ${name}` })).toBeVisible({ timeout: 5_000 })
}

async function deleteBuildingByName(page: Page, name: string) {
  await page.getByRole('button', { name: `Obra ${name}` }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5_000 })
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Excluir obra' }).click()
  await expect(page.getByText('Obra excluída.')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: `Obra ${name}` })).toHaveCount(0)
}

test.describe('Mapa — admin gerencia obras', () => {
  test.use({ storageState: storageStatePath('admin') })

  test.beforeEach(async ({ page }) => {
    await page.goto('/mapa')
    await expect(page.getByRole('heading', { name: 'Mapa' })).toBeVisible({ timeout: 10_000 })
  })

  test('admin cria obra por clique no mapa', async ({ page }) => {
    test.skip(!(await waitForMapReady(page)), 'Google Maps não carregou neste ambiente (sem rede para maps.googleapis.com)')

    const name = `E2E Obra ${Date.now()}`
    await createBuilding(page, name)
    await deleteBuildingByName(page, name)
  })

  test('admin renomeia e exclui obra', async ({ page }) => {
    test.skip(!(await waitForMapReady(page)), 'Google Maps não carregou neste ambiente (sem rede para maps.googleapis.com)')

    const name = `E2E Renomear ${Date.now()}`
    await createBuilding(page, name)

    await page.getByRole('button', { name: `Obra ${name}` }).click()
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5_000 })

    const renamed = `${name} (renomeada)`
    await page.getByRole('button', { name: 'Renomear obra' }).click()
    const nameInput = page.getByRole('dialog').locator('input').first()
    await nameInput.fill(renamed)
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Obra renomeada.')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('heading', { name: renamed })).toBeVisible({ timeout: 5_000 })

    // Excluir já a partir do modal aberto (cobre o critério e limpa os dados do teste)
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Excluir obra' }).click()

    await expect(page.getByText('Obra excluída.')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: `Obra ${renamed}` })).toHaveCount(0)
  })

  test('admin atribui e remove membro — reflete nos avatares do marcador', async ({ page }) => {
    test.skip(!(await waitForMapReady(page)), 'Google Maps não carregou neste ambiente (sem rede para maps.googleapis.com)')

    const name = `E2E Alocação ${Date.now()}`
    await createBuilding(page, name)

    const marker = page.getByRole('button', { name: `Obra ${name}` })
    await marker.click()
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5_000 })

    const row = page.getByRole('dialog').locator('ul li').first()
    await expect(row.getByRole('button', { name: 'Alocar' })).toBeVisible({ timeout: 5_000 })
    await row.getByRole('button', { name: 'Alocar' }).click()
    await expect(row.getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape')
    await expect(marker.getByTestId('marker-avatars')).toBeVisible({ timeout: 5_000 })

    await marker.click()
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5_000 })
    await row.getByRole('button', { name: 'Remover' }).click()
    await expect(row.getByRole('button', { name: 'Alocar' })).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape')
    await expect(marker.getByTestId('marker-avatars')).toHaveCount(0, { timeout: 5_000 })

    await deleteBuildingByName(page, name)
  })

  test('mesmo fiscal alocado em duas obras aparece corretamente em ambas', async ({ page }) => {
    test.skip(!(await waitForMapReady(page)), 'Google Maps não carregou neste ambiente (sem rede para maps.googleapis.com)')

    const ts = Date.now()
    const nameA = `E2E Obra A ${ts}`
    const nameB = `E2E Obra B ${ts}`
    await createBuilding(page, nameA, { x: 150, y: 150 })
    // Após a obra A existir, o mapa recentraliza nela — usa outro canto do
    // container para não clicar em cima do pin de A.
    await createBuilding(page, nameB, { x: 280, y: 280 })

    await page.getByRole('button', { name: `Obra ${nameA}` }).click()
    await expect(page.getByRole('heading', { name: nameA })).toBeVisible({ timeout: 5_000 })
    const rowA = page.getByRole('dialog').locator('ul li').first()
    const assigneeName = (await rowA.locator('span').innerText()).trim()
    await rowA.getByRole('button', { name: 'Alocar' }).click()
    await expect(rowA.getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: `Obra ${nameB}` }).click()
    await expect(page.getByRole('heading', { name: nameB })).toBeVisible({ timeout: 5_000 })
    const rowB = page.getByRole('dialog').locator('ul li').filter({ hasText: assigneeName }).first()
    await rowB.getByRole('button', { name: 'Alocar' }).click()
    await expect(rowB.getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')

    // Confirma que o mesmo fiscal aparece como alocado em ambas as obras
    await page.getByRole('button', { name: `Obra ${nameA}` }).click()
    await expect(page.getByRole('dialog').locator('ul li').filter({ hasText: assigneeName }).getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: `Obra ${nameB}` }).click()
    await expect(page.getByRole('dialog').locator('ul li').filter({ hasText: assigneeName }).getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })
    await page.keyboard.press('Escape')

    await deleteBuildingByName(page, nameA)
    await deleteBuildingByName(page, nameB)
  })
})

test.describe('Mapa — efetivo (somente leitura)', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  // Fixture própria (criada/alocada como admin numa context separada) em vez de
  // depender de dados deixados por "Mapa — admin gerencia obras" — aquele bloco
  // limpa tudo que cria, então não haveria obra/avatar sobrando para checar aqui.
  const fixtureName = `E2E Fixture Efetivo ${Date.now()}`
  let fixtureReady = false

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath('admin') })
    const page = await context.newPage()
    await page.goto('/mapa')
    await expect(page.getByRole('heading', { name: 'Mapa' })).toBeVisible({ timeout: 10_000 })

    if (await waitForMapReady(page)) {
      await createBuilding(page, fixtureName)
      await page.getByRole('button', { name: `Obra ${fixtureName}` }).click()
      await expect(page.getByRole('heading', { name: fixtureName })).toBeVisible({ timeout: 5_000 })
      const row = page.getByRole('dialog').locator('ul li').first()
      await row.getByRole('button', { name: 'Alocar' }).click()
      await expect(row.getByRole('button', { name: 'Remover' })).toBeVisible({ timeout: 5_000 })
      fixtureReady = true
    }

    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    if (!fixtureReady) return
    const context = await browser.newContext({ storageState: storageStatePath('admin') })
    const page = await context.newPage()
    await page.goto('/mapa')
    const marker = page.getByRole('button', { name: `Obra ${fixtureName}` })
    if (await marker.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBuildingByName(page, fixtureName)
    }
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/mapa')
    await expect(page.getByRole('heading', { name: 'Mapa' })).toBeVisible({ timeout: 10_000 })
  })

  test('efetivo não vê o botão de criar obra', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Nova obra' })).toHaveCount(0)
  })

  test('efetivo vê o mapa e os avatares, mas não vê botões de gestão', async ({ page }) => {
    test.skip(!fixtureReady, 'Fixture da obra não foi criada (Google Maps indisponível neste ambiente)')

    const marker = page.getByRole('button', { name: `Obra ${fixtureName}` })
    await expect(marker).toBeVisible({ timeout: 10_000 })
    await expect(marker.getByTestId('marker-avatars')).toBeVisible({ timeout: 5_000 })

    await marker.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Alocar' })).toHaveCount(0)
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Remover' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Renomear obra' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Excluir obra' })).toHaveCount(0)
  })
})

test.describe('Mapa — estado vazio quando o Google Maps não carrega', () => {
  test.use({ storageState: storageStatePath('efetivo') })

  // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY está sempre configurada neste ambiente de
  // teste, então o branch "chave não configurada" (!googleMapsApiKey) não é
  // alcançável sem reiniciar o server com outro env. Este teste cobre o branch
  // irmão de degradação graciosa (loadError), bloqueando a rede até o CDN do
  // Google Maps — mesmo espírito do critério: nunca fica em branco/quebrado.
  test('bloqueando o script do Google Maps, mostra mensagem amigável em vez de tela em branco', async ({ page }) => {
    await page.route('**maps.googleapis.com/**', (route) => route.abort())
    await page.route('**maps.google.com/**', (route) => route.abort())

    await page.goto('/mapa')
    await expect(page.getByRole('heading', { name: 'Mapa' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/não foi possível carregar o google maps/i)).toBeVisible({ timeout: 15_000 })
  })
})
