/**
 * E2E Test: Recording Flow (Native - iOS/Android)
 *
 * Tests the complete recording user journey on native platforms
 * using Detox
 *
 * Note: Requires Detox setup and running simulator/emulator
 */

describe("Recording Flow (Native)", () => {
  beforeAll(async () => {
    // Launch app
    await device.launchApp({
      permissions: { microphone: "YES" },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should complete full recording flow", async () => {
    // Tap Record button
    await element(by.text("Record")).tap();

    // Verify recording state
    await expect(element(by.text("Recording..."))).toBeVisible();

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Tap Stop button
    await element(by.text("Stop")).tap();

    // Verify track appears in list
    await expect(element(by.text(/Recording 1/))).toBeVisible();

    // Verify play button is available
    await expect(element(by.id("play-button-track-0"))).toBeVisible();
  });

  it("should handle permission denial gracefully", async () => {
    // Relaunch with denied permissions
    await device.launchApp({
      permissions: { microphone: "NO" },
      delete: true,
    });

    // Tap Record button
    await element(by.text("Record")).tap();

    // Verify error message appears
    await expect(element(by.text(/permission/i))).toBeVisible();
  });

  it("should support multiple recordings", async () => {
    // Record first track
    await element(by.text("Record")).tap();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await element(by.text("Stop")).tap();

    // Verify first track
    await expect(element(by.text("Recording 1"))).toBeVisible();

    // Record second track
    await element(by.text("Record")).tap();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await element(by.text("Stop")).tap();

    // Verify both tracks
    await expect(element(by.text("Recording 1"))).toBeVisible();
    await expect(element(by.text("Recording 2"))).toBeVisible();
  });

  it("should scroll through track list", async () => {
    // Record 5 tracks
    for (let i = 0; i < 5; i++) {
      await element(by.text("Record")).tap();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await element(by.text("Stop")).tap();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Scroll track list
    await element(by.id("track-list")).scrollTo("bottom");

    // Verify last track visible
    await expect(element(by.text("Recording 5"))).toBeVisible();
  });
});
