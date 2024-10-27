import { test as setup, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to auth page
  await page.goto('http://localhost:5173/auth');

  // Fill in login credentials
  await page.getByLabel('Email').fill('akmalaqil12345@gmail.com');
  await page.getByLabel('Password').fill('admin123');

  // Click login button
  await page.locator('form').getByRole('button', { name: 'Login' }).click();

  // Wait for successful login
  await expect(page.getByText('Login Successful')).toBeVisible();
  await expect(page.getByText('Welcome back!')).toBeVisible();

  // Verify we're actually logged in by checking profile page
  await page.goto('http://localhost:5173/profile');
  await expect(page.getByText('Your Profile')).toBeVisible();

  // Save the signed-in state
  // Create auth directory if it doesn't exist
  const authDir = path.dirname(authFile);
  await fs.mkdir(authDir, { recursive: true });
  await page.context().storageState({ path: authFile });
});
