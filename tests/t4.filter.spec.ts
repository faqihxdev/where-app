import { test, expect } from './test.fixture';

test.describe('Filter Listings', () => {
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

    // Wait for listings to load
    await expect(page.getByText('All Listings')).toBeVisible();
  });

  test('should open and close search drawer', async ({ page }) => {
    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Wait for search drawer to open
    await page.waitForTimeout(1000);

    await expect(page.getByText('Search Listings')).toBeVisible({
      timeout: 5000,
    });

    // Check if form elements are visible
    await expect(page.getByRole('textbox', { name: 'Keyword' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Category' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sort By' })).toBeVisible();

    // Close using close button
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Search Listings')).not.toBeVisible();
  });

  test('should filter listings by keyword', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Wait for search drawer to open
    await page.waitForTimeout(1000);

    // Search for first listing
    await page.getByRole('textbox', { name: 'Keyword' }).fill('Test 1');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Check active filter
    await page.waitForTimeout(1000);
    await expect(page.getByText('Keyword: Test 1', { exact: true })).toBeVisible();

    // Verify only first listing is visible
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).not.toBeVisible();

    // Remove keyword filter using the X button
    await page.getByTestId('remove-keyword-filter').click();

    // Verify both listings are visible again
    await page.waitForTimeout(1000);
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).toBeVisible();
  });

  test('should filter listings by category and status', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Wait for search drawer to open
    await page.waitForTimeout(1000);

    // Select category and status
    await page.getByRole('combobox', { name: 'Category' }).selectOption('Other');
    await page.getByRole('combobox', { name: 'Status' }).selectOption('Active');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Check active filters
    await expect(page.getByText('Category: Other', { exact: true })).toBeVisible();
    await expect(page.getByText('Status: Active', { exact: true })).toBeVisible();

    // Verify both listings are still visible (as they're both Other category and Active)
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).toBeVisible();
  });

  test('should sort listings', async ({ page }) => {
    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Wait for search drawer to open
    await page.waitForTimeout(1000);

    // Change sort options
    await page.getByTestId('sort-by-select').selectOption('title');
    await page.getByTestId('sort-order-select').selectOption('ascending');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify sort filter is visible with the correct icon
    await expect(page.getByText('Sort: Title', { exact: true })).toBeVisible();
  });

  test('should reset all filters', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Apply multiple filters
    await page.getByRole('textbox', { name: 'Keyword' }).fill('Test 1');
    await page.getByRole('combobox', { name: 'Category' }).selectOption('Other');
    await page.getByRole('combobox', { name: 'Status' }).selectOption('Active');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify filters are active
    await expect(page.getByText('Keyword: Test 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Category: Other', { exact: true })).toBeVisible();
    await expect(page.getByText('Status: Active', { exact: true })).toBeVisible();

    // Open drawer again and reset
    await page.getByRole('button', { name: 'Advanced search' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    // Verify all filters are removed and both listings are visible
    await expect(page.getByText('Keyword:', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Category: Other', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Status: Active', { exact: true })).not.toBeVisible();
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).toBeVisible();
  });

  test('should show no results when search matches nothing', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Open search drawer
    await page.getByRole('button', { name: 'Advanced search' }).click();

    // Wait for 3 seconds
    await page.waitForTimeout(3000);

    // Search for non-existent listing
    await page.getByRole('textbox', { name: 'Keyword' }).fill('NonexistentListing');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify no listings are visible and "No Listings Found" message appears
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).not.toBeVisible();
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).not.toBeVisible();
    await expect(page.getByText('No Listings Found', { exact: true })).toBeVisible();
  });
});
