import { test, expect } from './test.fixture';
import { createTestId } from '../src/utils/utils';

test.describe('Map Page', () => {
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

    // Navigate to map page
    await page.getByRole('link', { name: 'Map' }).click();

    // Wait for map page to load
    await page.waitForTimeout(3000);
    await expect(page.getByText('Map View')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should load map with basic controls', async ({ page }) => {
    // Check if map controls are present
    await expect(page.getByLabel('Zoom in')).toBeVisible();
    await expect(page.getByLabel('Zoom out')).toBeVisible();

    // Test zoom controls
    await page.getByLabel('Zoom in').click();
    await page.getByLabel('Zoom out').click();

    // Check if attribution is present
    await expect(page.getByText('OpenStreetMap contributors')).toBeVisible();
  });

  test('should display and interact with test listings on map', async ({ page, testListings }) => {
    // Wait for markers to load
    await page.waitForTimeout(2000);

    // Get the marker elements
    const firstListingId = createTestId(testListings['test-listing-1'].title!);
    const markerSelector = `img[data-testid="listing-marker-${firstListingId}"]`;

    // Wait for the marker to be present and visible
    await page.waitForSelector(markerSelector, { state: 'visible', timeout: 10000 });

    // Force click the marker using page.evaluate
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        (element as HTMLElement).click();
      }
    }, markerSelector);

    // Wait for popup to appear and check its content
    await page.waitForTimeout(1000);
    await expect(page.getByText(testListings['test-listing-1'].title!)).toBeVisible();
    await expect(page.getByText(testListings['test-listing-1'].type!)).toBeVisible();

    // Check View Details button
    const viewDetailsButton = page.getByRole('button', { name: 'View Details' });
    await expect(viewDetailsButton).toBeVisible();

    // Click View Details and verify navigation
    await viewDetailsButton.click();
    await expect(page.getByTestId('page-title')).toBeVisible();

    // Go back to map
    await page.getByTestId('back-button').click();
    await expect(page.getByText('Map View')).toBeVisible();
  });

  test('should display police station markers', async ({ page }) => {
    // Wait for police station markers to load
    await page.waitForTimeout(1000);

    // Check if police station markers exist
    const policeStationMarkers = page.locator('[data-testid="police-station-marker"]');
    await expect(policeStationMarkers.first()).toBeVisible();

    // Force click the first police station marker using evaluate
    await page.evaluate(() => {
      const markers = document.querySelectorAll('[data-testid="police-station-marker"]');
      if (markers.length > 0) {
        (markers[0] as HTMLElement).click();
      }
    });

    // Check if popup contains police station information
    await expect(page.locator('.leaflet-popup-content')).toBeVisible();
  });

  test('should show listing details in popup', async ({ page, testListings }) => {
    // Wait for markers to load
    await page.waitForTimeout(2000);

    // Get the second listing marker
    const secondListingId = createTestId(testListings['test-listing-2'].title!);
    const markerSelector = `img[data-testid="listing-marker-${secondListingId}"]`;

    // Wait for the marker to be present and visible
    await page.waitForSelector(markerSelector, { state: 'visible', timeout: 10000 });

    // Force click using evaluate
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        (element as HTMLElement).click();
      }
    }, markerSelector);

    // Wait for popup content to load
    await page.waitForTimeout(1000);

    // Check popup content
    await expect(page.getByText(testListings['test-listing-2'].title!)).toBeVisible();
    await expect(page.getByText(testListings['test-listing-2'].type!)).toBeVisible();

    // Check if listing image is displayed
    if (testListings['test-listing-2'].images?.main.data) {
      await expect(
        page.locator('img[alt="' + testListings['test-listing-2'].title + '"]')
      ).toBeVisible();
    }

    // Check user info in popup
    await expect(page.locator('.chakra-avatar')).toBeVisible();

    // Close popup by clicking elsewhere on the map
    await page.evaluate(() => {
      // Find the map container and click in the center
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer) {
        const rect = mapContainer.getBoundingClientRect();
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        });
        mapContainer.dispatchEvent(clickEvent);
      }
    });

    // Wait for popup to close
    await page.waitForTimeout(500);

    // Verify popup is closed
    await expect(page.getByText(testListings['test-listing-2'].title!)).not.toBeVisible();
  });
});
