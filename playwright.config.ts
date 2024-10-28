import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // Run tests in files in parallel
  forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test.only in the source code.
  retries: process.env.CI ? 2 : 0, // Retry on CI only
  workers: 1, // Force sequential execution
  reporter: 'html', // Reporter to use. See https://playwright.dev/docs/test-reporters
  timeout: 60000, // Global timeout of 60 seconds

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'main',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
