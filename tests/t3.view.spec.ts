import { test, expect } from './test.fixture';

test.describe('View Listings', () => {
  test.beforeEach(async ({ page }) => {
    // Go to listings page
    await page.goto('http://localhost:5173/');

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

    // Wait for listings to load
    await expect(page.getByText('All Listings')).toBeVisible();
  });

  test('should display test listings on home page', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Test first listing visibility
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-description-${firstListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-type-badge-lost-${firstListingId}`)).toBeVisible();

    // Test second listing visibility
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-description-${secondListingId}`)).toBeVisible();
    await expect(page.getByTestId(`listing-type-badge-found-${secondListingId}`)).toBeVisible();

    // Test filtering using tabs
    await page.getByRole('button', { name: 'Lost', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: testListings['test-listing-1'].title! })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: testListings['test-listing-2'].title! })
    ).not.toBeVisible();

    await page.getByRole('button', { name: 'Found', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: testListings['test-listing-1'].title! })
    ).not.toBeVisible();
    await expect(
      page.getByRole('heading', { name: testListings['test-listing-2'].title! })
    ).toBeVisible();
  });

  test('should display first test listing details correctly', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Click the View button of the first listing
    await page.getByTestId(`listing-view-button-${firstListingId}`).click();

    // Check listing details page elements
    await expect(page.getByTestId('page-title')).toBeVisible();
    await expect(page.getByTestId('listing-title')).toBeVisible();
    await expect(page.getByTestId('listing-description')).toBeVisible();

    // Check user info
    await expect(page.getByTestId('user-email')).toBeVisible();
    await expect(page.getByTestId('user-name')).toBeVisible();

    // Check listing metadata
    await expect(page.getByTestId('listing-category')).toBeVisible();
    await expect(page.getByTestId('listing-type')).toBeVisible();
    await expect(page.getByTestId('listing-created-at')).toBeVisible();
    await expect(page.getByTestId('listing-expires-at')).toBeVisible();

    // Verify content
    await expect(page.getByTestId('listing-title')).toHaveText(
      testListings['test-listing-1'].title!
    );
    await expect(page.getByTestId('listing-description')).toHaveText(
      testListings['test-listing-1'].description!
    );
    await expect(page.getByTestId('listing-type')).toHaveText('lost');
    await expect(page.getByTestId('listing-category')).toHaveText('Other');

    // Check map
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should display second test listing details correctly', async ({ page, testListings }) => {
    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Click the View button of the second listing
    await page.getByTestId(`listing-view-button-${secondListingId}`).click();

    // Check listing details page elements
    await expect(page.getByTestId('page-title')).toBeVisible();
    await expect(page.getByTestId('listing-title')).toBeVisible();
    await expect(page.getByTestId('listing-description')).toBeVisible();

    // Check user info
    await expect(page.getByTestId('user-email')).toBeVisible();
    await expect(page.getByTestId('user-name')).toBeVisible();

    // Check listing metadata
    await expect(page.getByTestId('listing-category')).toBeVisible();
    await expect(page.getByTestId('listing-type')).toBeVisible();
    await expect(page.getByTestId('listing-created-at')).toBeVisible();
    await expect(page.getByTestId('listing-expires-at')).toBeVisible();

    // Verify content
    await expect(page.getByTestId('listing-title')).toHaveText(
      testListings['test-listing-2'].title!
    );
    await expect(page.getByTestId('listing-description')).toHaveText(
      testListings['test-listing-2'].description!
    );
    await expect(page.getByTestId('listing-type')).toHaveText('found');
    await expect(page.getByTestId('listing-category')).toHaveText('Other');

    // Check map
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should navigate back to listings page', async ({ page, testListings }) => {
    const firstListingId = testListings['test-listing-1']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Navigate to first listing using View button
    await page.getByTestId(`listing-view-button-${firstListingId}`).click();

    // Check we're on the view page
    await expect(page.getByTestId('page-title')).toBeVisible();

    // Click back button
    await page.getByTestId('back-button').click();

    // Verify we're back on listings page
    await expect(page.getByText('All Listings')).toBeVisible();

    // Verify both listings are visible using test IDs
    await expect(page.getByTestId(`listing-title-${firstListingId}`)).toBeVisible();

    const secondListingId = testListings['test-listing-2']
      .title!.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    await expect(page.getByTestId(`listing-title-${secondListingId}`)).toBeVisible();
  });
});
