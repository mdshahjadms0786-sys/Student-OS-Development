import { test, expect } from '@playwright/test';

test.describe('Phase 2 Productivity Workflows', () => {
  test('registers student, completes profile, and exercises Phase 2 tasks, calendar, and notifications', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `e2e_student_${timestamp}@example.com`,
      password: 'Password123!',
      name: `Student ${timestamp}`,
    };

    // 1. Register new student
    await page.goto('/#register');
    await expect(page.getByText('Create an account')).toBeVisible();

    await page.getByLabel(/Full Name/i).fill(testUser.name);
    await page.getByLabel(/Email/i).fill(testUser.email);
    await page.getByLabel(/Password/i).fill(testUser.password);
    await page.getByRole('button', { name: /^Register$/i }).click();

    // 2. Complete Profile
    await expect(page.getByText('Complete Your Profile')).toBeVisible();
    await page.getByLabel(/Program \/ Major/i).fill('Computer Science');
    await page.getByLabel(/Semester/i).fill('4');
    await page.getByRole('button', { name: /Save Profile/i }).click();

    // 3. Lands on Home Dashboard
    await expect(
      page.getByRole('heading', { name: /(Welcome back|Good morning|Good afternoon|Good evening)/i })
    ).toBeVisible();
    await expect(page.getByText("Today's Classes")).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pending Tasks' })).toBeVisible();

    // 4. Navigate to Tasks page
    await page.goto('/#tasks');
    await expect(page.getByRole('heading', { name: /Tasks & Assignments/i })).toBeVisible();

    // 5. Create a new task
    await page.getByRole('button', { name: /Add Task/i }).first().click();
    await expect(page.getByText('Create New Task')).toBeVisible();

    await page.getByPlaceholder(/Complete Chapter 4 Exercises/i).fill('Algorithms Dynamic Programming Assignment');
    await page.getByRole('button', { name: /Create Task/i }).click();

    // Verify task is visible in task list
    await expect(page.getByText('Algorithms Dynamic Programming Assignment')).toBeVisible();

    // 6. Toggle task complete
    await page.locator('button:has(svg.lucide-circle)').first().click();
    await expect(page.locator('svg.lucide-check-circle-2')).toBeVisible();

    // 7. Navigate to Calendar
    await page.goto('/#calendar');
    await expect(page.getByRole('heading', { name: /Academic Calendar/i })).toBeVisible();
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Sun')).toBeVisible();

    // 8. Navigate to Notifications
    await page.goto('/#notifications');
    await expect(page.getByRole('heading', { name: /^Notifications$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Preferences/i })).toBeVisible();

    // Open preferences and toggle
    await page.getByRole('button', { name: /Preferences/i }).click();
    await expect(page.getByText('Reminder Preferences')).toBeVisible();

    // 9. Return to Home and verify integration
    await page.goto('/#home');
    await expect(page.getByRole('heading', { name: 'Pending Tasks' })).toBeVisible();
  });
});
