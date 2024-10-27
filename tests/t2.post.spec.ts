import { test, expect } from './test.fixture';
import path from 'path';

test.describe('Post Page', () => {
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

    // Go to post page
    await page.goto('/post');
    await expect(page.getByText('Create a New Listing')).toBeVisible();
  });

  test('should show validation errors when submitting empty form', async ({ page }) => {
    // Click submit without filling anything
    await page.getByRole('button', { name: 'Create Listing' }).click();

    // Check validation errors
    await expect(page.getByText('Title must be at least 3 characters long')).toBeVisible();
    await expect(page.getByText('Description must be at least 10 characters long')).toBeVisible();
    await expect(page.getByText('At least one image is required')).toBeVisible();
    await expect(page.getByText('At least one location must be provided')).toBeVisible();
  });

  test('should create first test listing', async ({ page, testListings }) => {
    const listing = testListings['test-listing-1'];

    // Select listing type
    await page.getByRole('button', { name: 'Lost' }).click();

    // Fill in basic details
    await page.getByLabel('Title').fill(listing.title!);
    await page.getByLabel('Category').selectOption(listing.category!);
    await page.getByLabel('Description').fill(listing.description!);

    // Upload images
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button[aria-label="Add image"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([path.join(process.cwd(), 'test-images/test1.png')]);

    // Wait for images to be uploaded and previews to be visible
    await expect(page.locator('img[alt="Preview 1"]')).toBeVisible();

    // Add location
    // Wait for map to be fully loaded
    await page.waitForSelector('.leaflet-container');

    // Click the "Add Location" button instead of clicking directly on map
    await page.getByRole('button', { name: 'Add Location' }).click();

    // Wait for the location form to appear and geocoding to complete
    const locationInput = page.getByLabel('Location Name');
    await expect(locationInput).toBeVisible();
    await expect(page.getByLabel('Radius (meters)')).toBeVisible();

    // Wait for the loading state to finish
    await expect(locationInput).not.toHaveValue('Loading...');
    // Additional wait to ensure geocoding has completed
    await page.waitForTimeout(1000);

    // Submit the form
    await page.getByRole('button', { name: 'Create Listing' }).click();

    // Check for success toast
    await expect(page.getByText('Listing Created')).toBeVisible();
    await expect(page.getByText('Your listing has been successfully created.')).toBeVisible();

    // Should redirect to listings page
    await expect(page).toHaveURL('/');
  });

  test('should create second test listing', async ({ page, testListings }) => {
    const listing = testListings['test-listing-2'];

    // Select listing type
    await page.getByRole('button', { name: 'Found' }).click();

    // Fill in basic details
    await page.getByLabel('Title').fill(listing.title!);
    await page.getByLabel('Category').selectOption(listing.category!);
    await page.getByLabel('Description').fill(listing.description!);

    // Upload single image
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button[aria-label="Add image"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([path.join(process.cwd(), 'test-images/test2.png')]);

    // Wait for image to be uploaded and preview to be visible
    await expect(page.locator('img[alt="Preview 1"]')).toBeVisible();

    // Add location
    // Wait for map to be fully loaded
    await page.waitForSelector('.leaflet-container');

    // Click the "Add Location" button instead of clicking directly on map
    await page.getByRole('button', { name: 'Add Location' }).click();

    // Wait for the location form to appear and geocoding to complete
    const locationInput = page.getByLabel('Location Name');
    await expect(locationInput).toBeVisible();
    await expect(page.getByLabel('Radius (meters)')).toBeVisible();

    // Wait for the loading state to finish
    await expect(locationInput).not.toHaveValue('Loading...');
    // Additional wait to ensure geocoding has completed
    await page.waitForTimeout(1000);

    // Adjust radius
    await page.getByLabel('Radius (meters)').fill('200');

    // Submit the form
    await page.getByRole('button', { name: 'Create Listing' }).click();

    // Check for success toast
    await expect(page.getByText('Listing Created')).toBeVisible();
    await expect(page.getByText('Your listing has been successfully created.')).toBeVisible();

    // Should redirect to listings page
    await expect(page).toHaveURL('/');
  });
});
