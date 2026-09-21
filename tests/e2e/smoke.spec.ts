import { test, expect } from '@playwright/test';

test.describe('Student OS Smoke Tests', () => {
  test('landing page loads layout, header, sidebar and foundation cards', async ({ page }) => {
    await page.goto('/');

    // Verify Title and Header
    await expect(page).toHaveTitle(/Student OS/);
    await expect(page.locator('header')).toContainText('Student OS');

    // Verify Navigation and Shell
    await expect(page.getByText('Phase 0: Project Foundation')).toBeVisible();
    await expect(page.getByText('Backend Status')).toBeVisible();
    await expect(page.getByText('Database Layer')).toBeVisible();
    await expect(page.getByText('Security & Session')).toBeVisible();
    await expect(page.getByText('Design System')).toBeVisible();
  });
});
