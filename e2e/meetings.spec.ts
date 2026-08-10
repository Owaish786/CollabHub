import { test, expect } from '@playwright/test';

test.describe('Meetings Feature', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test User';

  // We need to register, login, and create a workspace before testing meetings
  test.beforeAll(async ({ request }) => {
    // 1. Register a test user via API
    const response = await request.post('/api/auth/register', {
      data: {
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }
    });
    expect(response.status()).toBe(201);
  });

  test('should allow scheduling and viewing an instant meeting', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByPlaceholder(/you@example.com/i).fill(testEmail);
    await page.getByPlaceholder(/••••••••/i).fill(testPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Verify successful login by waiting for dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/i);
    await expect(page.locator('h1')).not.toContainText(/Welcome back/i);

    // 2. Create a new Workspace
    await page.getByLabel(/Workspace name/i).fill('Meeting Test Workspace');
    await page.getByRole('button', { name: /Create/i, exact: true }).click();

    // Verify workspace creation
    await expect(page.locator('h1')).toContainText('Meeting Test Workspace');

    // 3. Navigate to Meetings
    await page.getByRole('link', { name: /Meetings/i }).click();
    await expect(page.locator('h1')).toContainText(/Meetings/i);

    // 4. Schedule Instant Meeting
    // The modal trigger has text "Instant Meeting"
    await page.getByRole('button', { name: /Instant Meeting/i }).click();
    
    // Fill the modal form
    await expect(page.getByRole('dialog')).toBeVisible();
    const titleInput = page.getByLabel(/Meeting Title/i);
    await titleInput.fill('Daily Standup');
    
    // Submit
    await page.getByRole('button', { name: /Start Now/i }).click();

    // 5. Verify redirection to Meeting Detail page
    // The page should eventually show the meeting title "Daily Standup"
    // Wait for the URL to change to the meeting room
    await page.waitForURL(/\/workspace\/[a-f0-9]+\/meetings\/.+/);
    
    // Verify Meeting Detail Page UI
    await expect(page.locator('h1')).toContainText('Daily Standup');
    
    // Click the new "Join Call" button before verifying in-meeting UI
    await page.getByRole('button', { name: /Join Call/i }).click();

    // Verify UI components in the dark room UI are visible
    await expect(page.getByText('Live')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Leave' })).toBeVisible();
    
    // Verify Participant Sidebar
    await expect(page.getByText('Participants')).toBeVisible();
    await expect(page.getByText('Organizer')).toBeVisible();
    await expect(page.getByText(testName).first()).toBeVisible();
  });
});
