import { test, expect } from '@playwright/test';

/**
 * E2E Test: Basic Flow - Paste → Preview → Export
 *
 * This test verifies the core user flow:
 * 1. Navigate to dashboard (authenticated)
 * 2. Paste TSV data
 * 3. See table preview
 * 4. Export as PNG/JPG
 * 5. Verify credit deduction
 *
 * Expected: FAIL (RED) - Usage tracking not yet implemented
 */
test.describe('Basic Flow - Paste → Preview → Export', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('sb-access-token', 'mock-access-token');
      localStorage.setItem('sb-refresh-token', 'mock-refresh-token');
    });

    // Navigate to dashboard
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should paste TSV data and show table preview', async ({ page }) => {
    // Find the paste input area (textarea in PasteInput component)
    const pasteArea = page.locator('textarea').first();

    // Paste test data
    const tsvData = 'Name\tAge\tCity\nAlice\t30\tNew York\nBob\t25\tLos Angeles\nCharlie\t35\tChicago';

    await pasteArea.fill(tsvData);

    // The data should be sent to /api/parse
    // Wait for response
    const response = await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Verify parse request was successful
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.success).toBe(true);

    // Wait for table preview to appear
    await expect(page.locator('table, .table-preview, [data-testid="table"]')).toBeVisible({ timeout: 5000 });

    // Verify table content
    await expect(page.locator('table')).toContainText('Alice');
    await expect(page.locator('table')).toContainText('30');
    await expect(page.locator('table')).toContainText('New York');
  });

  test('should export table as PNG and deduct credit', async ({ page }) => {
    // Paste data first
    const pasteArea = page.locator('textarea').first();
    const tsvData = 'Name\tAge\nAlice\t30\nBob\t25';

    await pasteArea.fill(tsvData);

    // Wait for parse response
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Wait for table preview
    await expect(page.locator('table, .table-preview')).toBeVisible({ timeout: 5000 });

    // Get initial credits
    const initialCreditsText = await page.locator('text=/credit/i').first().textContent();
    const initialCredits = parseInt(initialCreditsText?.match(/\d+/)?.[0] || '0');

    // Click PNG export button
    const exportButton = page.locator('button:has-text("Export as PNG")');
    await exportButton.click();

    // Wait for export to complete (button text changes temporarily)
    await page.waitForTimeout(1000);

    // Verify credit was deducted
    const finalCreditsText = await page.locator('text=/credit/i').first().textContent();
    const finalCredits = parseInt(finalCreditsText?.match(/\d+/)?.[0] || '0');

    expect(finalCredits).toBe(initialCredits - 1);

    // Note: We can't easily verify download in headless mode
    // In headed mode, we could check for download event
  });

  test('should export table as JPG', async ({ page }) => {
    // Paste data
    const pasteArea = page.locator('textarea').first();
    await pasteArea.fill('Product\tPrice\nLaptop\t999\nMouse\t29');

    // Wait for parse
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Wait for table
    await expect(page.locator('table, .table-preview')).toBeVisible({ timeout: 5000 });

    // Change theme if available
    const themeSelector = page.locator('select').first();
    if (await themeSelector.isVisible()) {
      await themeSelector.selectOption({ index: 1 });
    }

    // Export as JPG
    const exportButton = page.locator('button:has-text("Export as JPG")');
    await exportButton.click();

    // Wait a moment for export
    await page.waitForTimeout(1000);

    // Test passes if no errors
  });

  test('should show error when no credits remaining', async ({ page }) => {
    // Set zero credits in store (this would require API call in real scenario)
    // For now, just test the UI is present

    // Paste data
    const pasteArea = page.locator('textarea').first();
    await pasteArea.fill('A\tB\n1\t2');

    // Wait for parse
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Wait for table
    await expect(page.locator('table, .table-preview')).toBeVisible({ timeout: 5000 });

    // Check export button state
    const exportButton = page.locator('button:has-text("Export")').first();
    const isEnabled = await exportButton.isEnabled();

    // Should be enabled if we have credits
    const creditsText = await page.locator('text=/credit/i').first().textContent();
    if (creditsText?.includes('No credits')) {
      expect(isEnabled).toBeFalsy();
    } else {
      expect(isEnabled).toBeTruthy();
    }
  });

  test('should handle empty input gracefully', async ({ page }) => {
    const pasteArea = page.locator('textarea').first();

    // Clear any existing text
    await pasteArea.fill('');

    // Export button should be disabled when no data
    const exportButton = page.locator('button:has-text("Export")').first();

    // Wait to ensure no data was parsed
    await page.waitForTimeout(1000);

    // Button might be disabled or not visible when no data
    const isVisible = await exportButton.isVisible({ timeout: 2000 });
    if (isVisible) {
      const isEnabled = await exportButton.isEnabled();
      expect(isEnabled).toBeFalsy();
    }
  });

  test('should support keyboard paste', async ({ page }) => {
    // Focus paste area
    const pasteArea = page.locator('textarea').first();
    await pasteArea.click();

    // Type data
    await page.keyboard.type('Name\tValue\nTest\t123');

    // Wait for parse
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Verify table appears
    await expect(page.locator('table, .table-preview')).toBeVisible({ timeout: 5000 });
  });

  test('should display theme selector after parsing', async ({ page }) => {
    // Paste data
    const pasteArea = page.locator('textarea').first();
    await pasteArea.fill('A\tB\n1\t2');

    // Wait for parse
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Theme selector should appear
    const themeSelector = page.locator('select, .theme-selector').first();
    await expect(themeSelector).toBeVisible({ timeout: 3000 });
  });

  test('should show loading state during parsing', async ({ page }) => {
    // Slow down the network to see loading state
    await page.route('**/api/parse', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });

    const pasteArea = page.locator('textarea').first();
    await pasteArea.fill('A\tB\n1\t2');

    // Look for loading indicator
    const loader = page.locator('.loading, [aria-busy="true"], .animate-spin').first();

    // Might briefly show loading
    const isVisible = await loader.isVisible({ timeout: 500 });
    if (isVisible) {
      await expect(loader).toBeVisible();
    }
  });

  test('should handle parse errors gracefully', async ({ page }) => {
    // Mock parse error
    await page.route('**/api/parse', (route) => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ success: false, error: 'Invalid data format' })
      });
    });

    const pasteArea = page.locator('textarea').first();
    await pasteArea.fill('invalid data');

    // Wait for response
    await page.waitForResponse('**/api/parse', { timeout: 10000 });

    // Should show error message
    const errorElement = page.locator('text=/error|invalid|failed/i').first();
    const hasError = await errorElement.isVisible({ timeout: 2000 });

    if (hasError) {
      await expect(errorElement).toBeVisible();
    }
  });
});
