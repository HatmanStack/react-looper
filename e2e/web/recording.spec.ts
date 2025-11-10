/**
 * E2E Test: Recording Flow (Web)
 *
 * Tests the complete recording user journey on web platform
 * using Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Recording Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    // Navigate to app
    await page.goto('http://localhost:8081');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full recording flow', async ({ page }) => {
    // Click Record button
    const recordButton = page.getByRole('button', { name: /record/i });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Verify recording state
    await expect(page.getByText(/recording/i)).toBeVisible();

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Click Stop button
    const stopButton = page.getByRole('button', { name: /stop/i });
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Verify track appears in list
    await expect(page.getByText(/recording 1/i)).toBeVisible();

    // Verify play button is available
    const playButton = page.getByRole('button', { name: /play/i }).first();
    await expect(playButton).toBeVisible();
  });

  test('should handle permission denial gracefully', async ({ page, context }) => {
    // Deny microphone permission
    await context.clearPermissions();

    // Click Record button
    const recordButton = page.getByRole('button', { name: /record/i });
    await recordButton.click();

    // Verify error message appears
    await expect(page.getByText(/permission/i)).toBeVisible();
  });

  test('should support multiple recordings', async ({ page }) => {
    // Record first track
    await page.getByRole('button', { name: /record/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /stop/i }).click();

    // Verify first track
    await expect(page.getByText(/recording 1/i)).toBeVisible();

    // Record second track
    await page.getByRole('button', { name: /^record$/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /stop/i }).click();

    // Verify both tracks
    await expect(page.getByText(/recording 1/i)).toBeVisible();
    await expect(page.getByText(/recording 2/i)).toBeVisible();
  });
});
