import { test, expect } from '@playwright/test';

test.describe('Landing & Generic Pages', () => {
  test('should render 404 page for unknown routes', async ({ page }) => {
    // Navigate to a random route
    const res = await page.goto('/unknown-route-that-doesnt-exist');
    
    // Should return 404 status
    expect(res?.status()).toBe(404);
    
    // Our custom 404 page should render
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('text=Page not found')).toBeVisible();
    await expect(page.locator('text=Back to Dashboard')).toBeVisible();
  });
});
