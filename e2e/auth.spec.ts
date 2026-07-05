import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // Because the actual authentication uses NextAuth and requires Google credentials, 
  // or Email credentials which are hard to mock in E2E without real email, 
  // we will just verify the login page UI renders correctly for now.
  test('should render login page with credentials form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/Welcome/i);
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });
});
