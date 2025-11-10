/**
 * Playwright Configuration for Web E2E Testing
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/web',

  // Timeout for each test
  timeout: 30 * 1000,

  // Test timeout includes all hooks and fixtures
  expect: {
    timeout: 5000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html'], ['list'], ...(process.env.CI ? [['github'] as ['github']] : [])],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8081',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        permissions: ['microphone'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        permissions: ['microphone'],
      },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        permissions: ['microphone'],
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        permissions: ['microphone'],
      },
    },
  ],

  // Run web server before starting the tests
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
