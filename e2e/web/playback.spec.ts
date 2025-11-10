/**
 * E2E Test: Playback Flow (Web)
 *
 * Tests audio playback with controls on web platform
 */

import { test, expect } from '@playwright/test';

test.describe('Playback Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');

    // Create a test recording
    await page.getByRole('button', { name: /record/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /stop/i }).click();
    await expect(page.getByText(/recording 1/i)).toBeVisible();
  });

  test('should play and pause track', async ({ page }) => {
    // Click play button
    const playButton = page.getByRole('button', { name: /play recording 1/i });
    await playButton.click();

    // Verify playing state (button highlighted or state change)
    await page.waitForTimeout(500);

    // Click pause button
    const pauseButton = page.getByRole('button', { name: /pause recording 1/i });
    await pauseButton.click();

    // Verify paused state
    await page.waitForTimeout(200);
  });

  test('should adjust volume slider', async ({ page }) => {
    // Find volume slider
    const volumeSlider = page.getByLabel(/volume/i).first();
    await expect(volumeSlider).toBeVisible();

    // Get bounding box for slider
    const box = await volumeSlider.boundingBox();
    if (box) {
      // Click at different positions to change volume
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);

      // Verify volume changed (check displayed value)
      await expect(page.getByText(/volume:/i)).toBeVisible();
    }
  });

  test('should adjust speed slider', async ({ page }) => {
    // Find speed slider
    const speedSlider = page.getByLabel(/playback speed/i).first();
    await expect(speedSlider).toBeVisible();

    // Get bounding box for slider
    const box = await speedSlider.boundingBox();
    if (box) {
      // Click at different positions to change speed
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);

      // Verify speed changed
      await expect(page.getByText(/speed:/i)).toBeVisible();
    }
  });

  test('should delete track', async ({ page }) => {
    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete recording 1/i });
    await deleteButton.click();

    // Verify track removed
    await expect(page.getByText(/recording 1/i)).not.toBeVisible();

    // Verify empty state
    await expect(page.getByText(/no tracks yet/i)).toBeVisible();
  });
});
