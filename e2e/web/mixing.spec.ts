/**
 * E2E Test: Mixing Flow (Web)
 *
 * Tests audio mixing and export on web platform
 */

import { test, expect } from "@playwright/test";

test.describe("Mixing Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);
    await page.goto("http://localhost:8081");
    await page.waitForLoadState("networkidle");

    // Create two test recordings
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: /^record$/i }).click();
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: /stop/i }).click();
      await page.waitForTimeout(500);
    }

    // Verify both tracks exist
    await expect(page.getByText(/recording 1/i)).toBeVisible();
    await expect(page.getByText(/recording 2/i)).toBeVisible();
  });

  test("should mix two tracks", async ({ page }) => {
    // Click Save button to start mixing
    const saveButton = page.getByRole("button", { name: /^save$/i });
    await saveButton.click();

    // Enter filename in modal
    const filenameInput = page.getByLabel(/file name/i);
    await expect(filenameInput).toBeVisible();
    await filenameInput.fill("test-mix");

    // Click Save in modal
    const modalSaveButton = page
      .getByRole("button", { name: /^save$/i })
      .last();
    await modalSaveButton.click();

    // Verify mixing progress appears
    await expect(page.getByText(/mixing audio/i)).toBeVisible();

    // Wait for mixing to complete (with timeout)
    await expect(page.getByText(/mixing audio/i)).not.toBeVisible({
      timeout: 60000,
    });

    // Verify success message or download
    // Note: Download verification would require page.on('download') handler
  });

  test("should show mixing progress", async ({ page }) => {
    // Start mixing
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.getByLabel(/file name/i).fill("progress-test");
    await page
      .getByRole("button", { name: /^save$/i })
      .last()
      .click();

    // Verify progress bar appears
    await expect(page.getByRole("progressbar")).toBeVisible();

    // Verify progress percentage updates
    await expect(page.getByText(/%/)).toBeVisible();

    // Wait for completion
    await page.waitForTimeout(30000);
  });

  test("should validate filename input", async ({ page }) => {
    // Click Save button
    await page.getByRole("button", { name: /^save$/i }).click();

    // Try to save with empty filename
    const modalSaveButton = page
      .getByRole("button", { name: /^save$/i })
      .last();

    // Verify save button is disabled or shows validation error
    await expect(modalSaveButton).toBeDisabled();

    // Enter valid filename
    await page.getByLabel(/file name/i).fill("valid-name");

    // Verify save button enabled
    await expect(modalSaveButton).toBeEnabled();
  });

  test("should cancel mixing modal", async ({ page }) => {
    // Open mixing modal
    await page.getByRole("button", { name: /^save$/i }).click();

    // Verify modal visible
    await expect(page.getByLabel(/file name/i)).toBeVisible();

    // Click Cancel
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // Verify modal closed
    await expect(page.getByLabel(/file name/i)).not.toBeVisible();

    // Verify tracks still present
    await expect(page.getByText(/recording 1/i)).toBeVisible();
  });
});
