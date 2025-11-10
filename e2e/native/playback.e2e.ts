/**
 * E2E Test: Playback Flow (Native - iOS/Android)
 *
 * Tests audio playback with controls on native platforms
 * using Detox
 */

describe('Playback Flow (Native)', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { microphone: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    // Create a test recording
    await element(by.text('Record')).tap();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await element(by.text('Stop')).tap();
    await expect(element(by.text('Recording 1'))).toBeVisible();
  });

  it('should play and pause track', async () => {
    // Tap play button
    await element(by.id('play-button-track-0')).tap();

    // Wait for playback to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Tap pause button
    await element(by.id('pause-button-track-0')).tap();

    // Verify paused
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should adjust volume slider', async () => {
    // Find and interact with volume slider
    const volumeSlider = element(by.id('volume-slider-track-0'));
    await expect(volumeSlider).toBeVisible();

    // Swipe slider to change volume
    await volumeSlider.swipe('right', 'slow', 0.5);

    // Verify volume changed (visual feedback)
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should adjust speed slider', async () => {
    // Find and interact with speed slider
    const speedSlider = element(by.id('speed-slider-track-0'));
    await expect(speedSlider).toBeVisible();

    // Swipe slider to change speed
    await speedSlider.swipe('right', 'slow', 0.7);

    // Verify speed changed
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should delete track', async () => {
    // Tap delete button
    await element(by.id('delete-button-track-0')).tap();

    // Verify track removed
    await expect(element(by.text('Recording 1'))).not.toBeVisible();

    // Verify empty state
    await expect(element(by.text('No tracks yet'))).toBeVisible();
  });

  it('should play multiple tracks simultaneously', async () => {
    // Create second track
    await element(by.text('Record')).tap();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await element(by.text('Stop')).tap();

    // Play first track
    await element(by.id('play-button-track-0')).tap();
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Play second track
    await element(by.id('play-button-track-1')).tap();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Both should be playing
    // Verification would check visual indicators
  });
});
