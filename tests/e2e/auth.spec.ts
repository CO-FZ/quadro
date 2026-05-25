import { test, expect } from '@playwright/test'

// Auth callback tests — no storageState (testing login flows)

test.describe('Auth callback', () => {
  test('whitelisted email → redirected to /kanban', async () => {
    // We can't automate Google OAuth, so we verify the redirect behavior
    // by injecting a valid session directly (same as loginAs helper) and
    // navigating to the callback URL.
    // Full OAuth flow is validated manually / in staging.
    test.skip(true, 'Google OAuth flow requires manual validation or staging environment')
  })

  test('non-whitelisted email → friendly error on login page', async ({ page }) => {
    // The login page renders the callback error from ?error=not_authorized.
    // Message (lib/i18n/auth.ts): "Este e-mail não está autorizado a acessar o Quadro..."
    await page.goto('/login?error=not_authorized')
    await expect(page.getByRole('alert')).toContainText(
      /não está autorizado|não autorizado|acesso negado/i,
      { timeout: 5_000 },
    )
  })

  // TODO(sprint-21): baseline visual ausente. Gerar com `pnpm test:e2e:update`
  // e revisar a imagem (AGENTS.md secao 5) antes de reabilitar.
  test.skip('screenshot mobile — login page baseline', async ({ page }) => {
    await page.goto('/')
    // May redirect to /kanban if already logged in, or show login
    if (page.url().includes('kanban')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('login-mobile.png', { maxDiffPixelRatio: 0.02 })
  })
})
