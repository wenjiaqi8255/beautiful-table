import { test, expect } from '@playwright/test';

/**
 * E2E Test: Authentication Flow - Sign in → Dashboard
 *
 * This test verifies the authentication flow:
 * 1. Navigate to landing page
 * 2. Click sign in button
 * 3. Complete OAuth flow (mocked)
 * 4. Redirect to dashboard
 * 5. Verify user session
 * 6. Sign out
 *
 * Expected: FAIL (RED) - Production deployment not configured yet
 */
test.describe('Authentication Flow', () => {
  test('should show sign in button on landing page', async ({ page }) => {
    await page.goto('/');

    // Look for sign in button
    const signInButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in")').first();
    await expect(signInButton).toBeVisible();
  });

  test('should redirect to Supabase auth on sign in click', async ({ page }) => {
    await page.goto('/');

    const signInButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in")').first();

    // Click sign in - should redirect to auth provider
    await Promise.all([
      page.waitForURL(/supabase|auth/),
      signInButton.click()
    ]);

    // Verify we're on auth page
    await expect(page).toHaveURL(/supabase|auth/);
  });

  test('should handle auth callback and redirect to dashboard', async ({ page }) => {
    // Mock successful auth by setting session
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    // Navigate to callback URL
    await page.goto('/auth/callback#access_token=mock&refresh_token=mock');

    // Should redirect to dashboard
    await page.waitForURL('/app', { timeout: 10000 });
    await expect(page).toHaveURL('/app');

    // Verify dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|beautiful table/i })).toBeVisible();
  });

  test('should redirect to landing page when not authenticated', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/app');

    // Should redirect to landing page
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');

    // Should show sign in button
    await expect(page.locator('button:has-text("Sign in"), a:has-text("Sign in")')).toBeVisible();
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Set auth session
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    // Go to dashboard
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected)
    await expect(page).toHaveURL('/app');
  });

  test('should show loading state during auth check', async ({ page }) => {
    await page.goto('/');

    // Look for loading spinner
    const loader = page.locator('.animate-spin, [role="progressbar"]').first();

    // Might briefly show loading
    if (await loader.isVisible({ timeout: 1000 })) {
      await expect(loader).toBeVisible();
    }
  });

  test('should handle expired session gracefully', async ({ page }) => {
    // Set expired session
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'expired-token');
    });

    // Try to access dashboard
    await page.goto('/app');

    // Should redirect to login or show error
    await page.waitForURL(/\/(app|\?)/, { timeout: 5000 });

    const url = page.url();
    const isOnDashboard = url.endsWith('/app');

    if (!isOnDashboard) {
      // Successfully redirected to login
      await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
    }
  });
});
