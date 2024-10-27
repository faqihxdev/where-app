import { test, expect } from './test.fixture';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: authentication dont persisist as Firebase uses IndexeDB
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

    // Increase timeout and add retry for initial navigation
    await test.step('Navigate to profile page', async () => {
      await page.goto('/profile', { timeout: 30000 });
      await expect(page.getByText('Your Profile')).toBeVisible({ timeout: 10000 });
    });
  });

  test('should display all UI elements', async ({ page }) => {
    await expect(page.getByText('Your Profile')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByRole('img')).toBeVisible();
    await expect(page.locator('button.bg-gray-100')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Account' })).toBeVisible();
  });

  test('edit display name validation and functionality', async ({ page, testUser }) => {
    const editNameButton = page.locator('button.bg-gray-100');
    await editNameButton.click();

    const nameInput = page.getByRole('textbox');

    // Test validations
    await nameInput.fill('');
    await nameInput.blur();
    await expect(page.getByText('Name is required')).toBeVisible();

    await nameInput.fill('ab');
    await nameInput.blur();
    await expect(page.getByText('Name must be at least 3 characters long')).toBeVisible();

    await nameInput.fill('ThisNameIsTooLongForTheSystem');
    await nameInput.blur();
    await expect(page.getByText('Name cannot exceed 15 characters')).toBeVisible();

    // Test name change
    const originalName = testUser.preferences!.name;
    const newName = 'New Name';

    await nameInput.fill(newName);
    await page.getByRole('button', { name: 'Update Name' }).click();
    await expect(page.getByText(newName)).toBeVisible();

    await editNameButton.click();
    await nameInput.fill(originalName!);
    await page.getByRole('button', { name: 'Update Name' }).click();
    await expect(page.getByText(originalName!)).toBeVisible();
  });

  test('change password validation', async ({ page }) => {
    await page.getByRole('button', { name: 'Change Password' }).click();

    const currentPasswordInput = page.getByPlaceholder('Enter current password');
    const newPasswordInput = page.getByPlaceholder('Enter new password');
    const confirmPasswordInput = page.getByPlaceholder('Confirm new password');

    // Test validations
    await currentPasswordInput.fill('');
    await currentPasswordInput.blur();
    await expect(page.getByText('Current password is required')).toBeVisible();

    await newPasswordInput.fill('short');
    await newPasswordInput.blur();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();

    await newPasswordInput.fill('ValidPassword123');
    await confirmPasswordInput.fill('DifferentPassword123');
    await confirmPasswordInput.blur();
    await expect(page.getByText("Passwords don't match")).toBeVisible();

    // Test valid form
    await currentPasswordInput.fill('CurrentPass123');
    await newPasswordInput.fill('NewPassword123');
    await confirmPasswordInput.fill('NewPassword123');
    await confirmPasswordInput.blur();

    await expect(page.getByText('Current password is required')).not.toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).not.toBeVisible();
    await expect(page.getByText("Passwords don't match")).not.toBeVisible();
  });

  test('delete account validation', async ({ page }) => {
    await page.getByRole('button', { name: 'Delete Account' }).click();

    const deletePasswordInput = page.getByLabel(/Enter your password to confirm/);

    await deletePasswordInput.fill('');
    await deletePasswordInput.blur();
    await expect(page.getByText('Password is required to delete account')).toBeVisible();

    await deletePasswordInput.fill('ValidPassword123');
    await deletePasswordInput.blur();
    await expect(page.getByText('Password is required to delete account')).not.toBeVisible();
  });
});
