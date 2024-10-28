import { test, expect } from './test.fixture';
import { createTestId } from '../src/utils/utils';

test.describe('Delete Listings', () => {
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

    // Navigate to home first to ensure listings are loaded
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    // Navigate to inbox
    await page.getByRole('link', { name: 'Inbox' }).click();
    await page.waitForTimeout(3000);
  });

  test('should delete first listing', async ({ page, testListings }) => {
    // Delete first listing
    const firstListingId = createTestId(testListings['test-listing-1'].title!);
    await expect(page.getByTestId(`listing-card-${firstListingId}`)).toBeVisible();

    // Open actions menu for first listing
    const firstActionsButton = page.getByTestId(`listing-actions-${firstListingId}`);
    await firstActionsButton.click();
    await page.waitForTimeout(1000);

    // Click delete option
    await page.getByTestId(`listing-delete-${firstListingId}`).click();

    // Verify delete dialog appears
    await expect(page.getByText('Delete Listing')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this listing?')).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click();

    // Wait for success toast
    await expect(page.getByText('Listing Deleted')).toBeVisible();

    // Verify first listing is removed
    await expect(page.getByTestId(`listing-card-${firstListingId}`)).not.toBeVisible();
  });

  test('should delete second listing', async ({ page, testListings }) => {
    // Delete second listing
    const secondListingId = createTestId(testListings['test-listing-2'].title!);
    await expect(page.getByTestId(`listing-card-${secondListingId}`)).toBeVisible();

    // Open actions menu for second listing
    const secondActionsButton = page.getByTestId(`listing-actions-${secondListingId}`);
    await secondActionsButton.click();
    await page.waitForTimeout(1000);

    // Click delete option
    await page.getByTestId(`listing-delete-${secondListingId}`).click();

    // Verify delete dialog appears
    await expect(page.getByText('Delete Listing')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this listing?')).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click();

    // Wait for success toast
    await expect(page.getByText('Listing Deleted')).toBeVisible();

    // Verify second listing is removed
    await expect(page.getByTestId(`listing-card-${secondListingId}`)).not.toBeVisible();
  });

  test('should verify listings are deleted', async ({ page, testListings }) => {
    // Get listing IDs
    const firstListingId = createTestId(testListings['test-listing-1'].title!);
    const secondListingId = createTestId(testListings['test-listing-2'].title!);

    // Navigate to home page
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    // Verify listings are not visible on home page
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).not.toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).not.toBeVisible();

    // Navigate to inbox
    await page.getByRole('link', { name: 'Inbox' }).click();
    await page.waitForTimeout(3000);

    // Verify listings are not visible in inbox
    await expect(page.getByTestId(`listing-card-${firstListingId}`)).not.toBeVisible();
    await expect(page.getByTestId(`listing-card-${secondListingId}`)).not.toBeVisible();

    // Check empty state in Your Listings section
    await expect(page.getByText('You have no listings')).toBeVisible();
  });
});
