import { test, expect } from '@playwright/test';

test.describe('Student OS Smoke Tests', () => {
  test('unauthenticated visitor is redirected to login with title and authentication form', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify Title
    await expect(page).toHaveTitle(/Student OS/);

    // Verify redirect to login and presence of auth form
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Enter your credentials to login to Student OS')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Log in$/i })).toBeVisible();
  });
});
