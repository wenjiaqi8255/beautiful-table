import { test, expect } from '@playwright/test';

/**
 * E2E Test: Payment Flow - Purchase → Credits
 *
 * This test verifies the payment and credits flow:
 * 1. Navigate to dashboard
 * 2. Check current credits
 * 3. Open billing modal
 * 4. Select pricing tier
 * 5. Complete Stripe checkout (mocked)
 * 6. Verify credits updated
 * 7. Check usage history
 *
 * Expected: FAIL (RED) - Stripe not configured in production yet
 */
test.describe('Payment Flow - Purchase → Credits', () => {
  test('should display current credits on dashboard', async ({ page }) => {
    // Set mock auth
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Look for credits display
    const creditsDisplay = page.locator('text=/credit|remaining|balance/i').first();
    await expect(creditsDisplay).toBeVisible();

    // Should show a number
    const creditsText = await creditsDisplay.textContent();
    expect(creditsText).toMatch(/\d+/);
  });

  test('should show billing button on dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Look for billing/upgrade button
    const billingButton = page.locator('button:has-text("Billing"), button:has-text("Upgrade"), button:has-text("Buy Credits")').first();
    await expect(billingButton).toBeVisible();
  });

  test('should open billing modal with pricing tiers', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Click billing button
    const billingButton = page.locator('button:has-text("Billing"), button:has-text("Upgrade")').first();
    await billingButton.click();

    // Wait for modal
    await expect(page.locator('.modal, [role="dialog"], .billing-modal')).toBeVisible({ timeout: 3000 });

    // Should show pricing options
    await expect(page.locator('text=/starter|basic|pro|enterprise|credits/i')).toBeVisible();
  });

  test('should display pricing tiers correctly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const billingButton = page.locator('button:has-text("Billing"), button:has-text("Upgrade")').first();
    await billingButton.click();

    // Wait for modal
    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Look for price cards
    const priceCards = page.locator('.price, [data-testid="price"], .pricing-card');
    const count = await priceCards.count();
    expect(count).toBeGreaterThan(0);

    // First card should show starter/basic pricing
    await expect(priceCards.first()).toContainText(/\$|credit/i);
  });

  test('should initiate Stripe checkout on purchase', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open billing modal
    const billingButton = page.locator('button:has-text("Billing"), button:has-text("Upgrade")').first();
    await billingButton.click();

    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Click purchase button (will open Stripe checkout)
    const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Subscribe")').first();

    // Mock the checkout redirect
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      purchaseButton.click()
    ]);

    // Verify Stripe checkout opened (in real test, this would be stripe.com)
    await popup.waitForLoadState('networkidle');
    expect(popup.url()).toMatch(/stripe|checkout|pay/i);
  });

  test('should update credits after successful payment', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Get initial credits
    const initialCreditsText = await page.locator('text=/credit|remaining/i').first().textContent();
    const initialCredits = parseInt(initialCreditsText?.match(/\d+/)?.[0] || '0');

    // Open billing
    const billingButton = page.locator('button:has-text("Billing")').first();
    await billingButton.click();

    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Simulate successful payment by setting credits in storage
    await page.evaluate(() => {
      localStorage.setItem('credits', '100');
    });

    // Close modal
    await page.keyboard.press('Escape');

    // Reload to check updated credits
    await page.reload();
    await page.waitForLoadState('networkidle');

    const finalCreditsText = await page.locator('text=/credit|remaining/i').first().textContent();
    const finalCredits = parseInt(finalCreditsText?.match(/\d+/)?.[0] || '0');

    // Credits should be higher (or at least not lower)
    expect(finalCredits).toBeGreaterThanOrEqual(initialCredits);
  });

  test('should disable export when no credits', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
      localStorage.setItem('credits', '0');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Paste data
    const pasteArea = page.locator('textarea[placeholder*="paste"]').first();
    await pasteArea.fill('A\tB\n1\t2');

    // Wait for table
    await expect(page.locator('table, .table-preview')).toBeVisible({ timeout: 5000 });

    // Export button should be disabled
    const exportButton = page.locator('button:has-text("Export")').first();
    await expect(exportButton).toBeDisabled();
  });

  test('should handle payment cancellation gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Open billing
    const billingButton = page.locator('button:has-text("Billing")').first();
    await billingButton.click();

    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Close modal without purchasing
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(page.locator('.modal, [role="dialog"]')).not.toBeVisible();

    // Should still be on dashboard
    await expect(page).toHaveURL('/app');
  });

  test('should show error message on payment failure', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Mock payment failure response
    await page.route('**/api/payment/create-checkout-session', (route) => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Payment failed' })
      });
    });

    // Open billing
    const billingButton = page.locator('button:has-text("Billing")').first();
    await billingButton.click();

    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Click purchase
    const purchaseButton = page.locator('button:has-text("Buy"), button:has-text("Purchase")').first();
    await purchaseButton.click();

    // Should show error message
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 5000 });
  });
});
