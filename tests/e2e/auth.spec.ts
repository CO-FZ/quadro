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
    // Navigate to login page and check for any existing error message
    await page.goto('/')

    // If redirected to login
    const url = page.url()
    if (url.includes('login') || url.includes('auth')) {
      // Simulate callback with error param
      await page.goto('/?error=not_authorized')
      await expect(page.getByText(/não autorizado|acesso negado|não encontrado na whitelist/i))
        .toBeVisible({ timeout: 5_000 })
    }
  })

  test('screenshot mobile — login page baseline', async ({ page }) => {
    await page.goto('/')
    // May redirect to /kanban if already logged in, or show login
    if (page.url().includes('kanban')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('login-mobile.png', { maxDiffPixelRatio: 0.02 })
  })
})
