import { test, expect } from './test.fixture';
import { createTestId } from '../src/utils/utils';

test.describe('Inbox Page', () => {
  test.beforeEach(async ({ page }) => {
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

    // Navigate to home page
    await page.getByRole('link', { name: 'Home' }).click();

    // Wait for 3 seconds
    await page.waitForTimeout(3000);

    // Navigate to inbox page
    await page.getByRole('link', { name: 'Inbox' }).click();

    // Wait for inbox page to load
    await expect(page.getByText('Your Listings')).toBeVisible();
  });

  test('should display user listings with actions', async ({ page, testListings }) => {
    // Wait for listings to load
    await page.waitForTimeout(5000);

    // Check if both test listings are visible
    const firstListingId = createTestId(testListings['test-listing-1'].title!);
    const secondListingId = createTestId(testListings['test-listing-2'].title!);

    await expect(page.getByTestId(`listing-card-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-card-${secondListingId}`)).toBeVisible();

    // Test view functionality for first listing
    await page.getByTestId(`listing-view-button-${firstListingId}`).click();
    await expect(page.getByTestId('page-title')).toBeVisible();
    await page.getByTestId('back-button').click();
    await expect(page.getByText('Your Listings')).toBeVisible();

    // Test listing card menu (3 dots)
    const actionsButton = page.getByTestId(`listing-actions-${firstListingId}`);
    await expect(actionsButton).toBeVisible();

    // Click the actions button and wait for animation
    await actionsButton.click();
    await page.waitForTimeout(1000);

    // Use evaluate to force click the edit button
    await page.evaluate((testId) => {
      const editButton = document.querySelector(`[data-testid="listing-edit-${testId}"]`);
      if (editButton) {
        (editButton as HTMLElement).click();
      }
    }, firstListingId);

    // Wait for edit page to load
    await expect(page.getByText('Edit Listing')).toBeVisible();

    // Check edit form fields match listing data
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
      testListings['test-listing-1'].title!
    );
    await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
      testListings['test-listing-1'].description!
    );

    // Go back to inbox
    await page.getByTestId('back-button').click();
    await expect(page.getByText('Your Listings')).toBeVisible();

    // Test delete dialog
    await actionsButton.click();
    await page.waitForTimeout(1000);

    // Use evaluate to force click the delete button
    await page.evaluate((testId) => {
      const deleteButton = document.querySelector(`[data-testid="listing-delete-${testId}"]`);
      if (deleteButton) {
        (deleteButton as HTMLElement).click();
      }
    }, firstListingId);

    // Check delete dialog
    await expect(page.getByText('Delete Listing')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this listing?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('should display matches with actions', async ({ page }) => {
    // Wait for matches section to load
    await page.waitForTimeout(1000);
    await expect(page.getByText('Matches')).toBeVisible();

    // Check if match exists
    const matchCard = page.locator('.chakra-button').filter({ hasText: 'Resolve' }).first();
    await expect(matchCard).toBeVisible();

    // Test resolve functionality
    await matchCard.click();
    await expect(page.getByText('Resolve Listing')).toBeVisible();
    await expect(page.getByText('Why Take a Photo?')).toBeVisible();

    // Check match card toggle in resolve page
    await page.getByText('View Match').click();
    await expect(page.getByText('Your listing')).toBeVisible();

    // Go back to inbox
    await page.getByTestId('back-button').click();
    await expect(page.getByText('Matches')).toBeVisible();

    // Test reject dialog
    const rejectButton = page.locator('.chakra-button').filter({ hasText: 'Reject' }).first();
    await rejectButton.click();
    await expect(page.getByText('Reject Match')).toBeVisible();
    await expect(page.getByText('Are you sure you want to reject this match?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('should handle notifications', async ({ page }) => {
    // Wait for notifications section to load
    await page.waitForTimeout(1000);
    await expect(page.getByText('Notifications')).toBeVisible();

    // Check if Mark All as Read button exists
    await expect(page.getByRole('button', { name: 'Mark All as Read' })).toBeVisible();

    // Click on a notification if exists
    const notification = page
      .locator('div')
      .filter({ hasText: /^New Match/ })
      .first();
    if (await notification.isVisible()) {
      // Click notification
      await notification.click();
      await page.waitForTimeout(1000); // Wait for dialog animation

      // Check if notification dialog appears
      await expect(page.getByTestId('notification-dialog')).toBeVisible();

      // Check dialog buttons
      await expect(page.getByTestId('notification-mark-read')).toBeVisible();
      await expect(page.getByTestId('notification-close')).toBeVisible();

      // Close dialog
      await page.getByTestId('notification-close').click();

      // Test notification menu (3 dots)
      const menuButton = notification.getByRole('button', { name: 'Actions' });
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for menu animation

      // Check menu items
      await expect(page.getByRole('menuitem', { name: /Mark as/ })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Remove' })).toBeVisible();
    }
  });
});
