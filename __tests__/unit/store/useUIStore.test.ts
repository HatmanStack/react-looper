/**
 * UI Store Tests
 */

import { useUIStore } from "../../../src/store/useUIStore";

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.getState().reset();
  });

  describe("modal state", () => {
    it("should show save modal", () => {
      const store = useUIStore.getState();

      expect(store.saveModalVisible).toBe(false);

      store.showSaveModal();

      expect(useUIStore.getState().saveModalVisible).toBe(true);
    });

    it("should hide save modal", () => {
      const store = useUIStore.getState();

      store.showSaveModal();
      expect(useUIStore.getState().saveModalVisible).toBe(true);

      store.hideSaveModal();

      expect(useUIStore.getState().saveModalVisible).toBe(false);
    });

    it("should show mixing modal", () => {
      const store = useUIStore.getState();

      expect(store.mixingModalVisible).toBe(false);

      store.showMixingModal();

      expect(useUIStore.getState().mixingModalVisible).toBe(true);
    });

    it("should hide mixing modal", () => {
      const store = useUIStore.getState();

      store.showMixingModal();
      expect(useUIStore.getState().mixingModalVisible).toBe(true);

      store.hideMixingModal();

      expect(useUIStore.getState().mixingModalVisible).toBe(false);
    });

    it("should handle multiple modals independently", () => {
      const store = useUIStore.getState();

      store.showSaveModal();
      store.showMixingModal();

      const state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(true);
      expect(state.mixingModalVisible).toBe(true);

      store.hideSaveModal();

      const newState = useUIStore.getState();
      expect(newState.saveModalVisible).toBe(false);
      expect(newState.mixingModalVisible).toBe(true);
    });
  });

  describe("selected track", () => {
    it("should set selected track", () => {
      const store = useUIStore.getState();

      store.setSelectedTrack("track-123");

      expect(useUIStore.getState().selectedTrackId).toBe("track-123");
    });

    it("should clear selected track", () => {
      const store = useUIStore.getState();

      store.setSelectedTrack("track-123");
      expect(useUIStore.getState().selectedTrackId).toBe("track-123");

      store.setSelectedTrack(null);

      expect(useUIStore.getState().selectedTrackId).toBeNull();
    });

    it("should update selected track", () => {
      const store = useUIStore.getState();

      store.setSelectedTrack("track-1");
      expect(useUIStore.getState().selectedTrackId).toBe("track-1");

      store.setSelectedTrack("track-2");

      expect(useUIStore.getState().selectedTrackId).toBe("track-2");
    });
  });

  describe("loading states", () => {
    it("should set recording state", () => {
      const store = useUIStore.getState();

      expect(store.isRecording).toBe(false);

      store.setRecording(true);
      expect(useUIStore.getState().isRecording).toBe(true);

      store.setRecording(false);
      expect(useUIStore.getState().isRecording).toBe(false);
    });

    it("should set mixing state", () => {
      const store = useUIStore.getState();

      expect(store.isMixing).toBe(false);

      store.setMixing(true);
      expect(useUIStore.getState().isMixing).toBe(true);

      store.setMixing(false);
      expect(useUIStore.getState().isMixing).toBe(false);
    });

    it("should set loading state", () => {
      const store = useUIStore.getState();

      expect(store.isLoading).toBe(false);

      store.setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });

    it("should handle multiple loading states independently", () => {
      const store = useUIStore.getState();

      store.setRecording(true);
      store.setMixing(true);
      store.setLoading(true);

      const state = useUIStore.getState();
      expect(state.isRecording).toBe(true);
      expect(state.isMixing).toBe(true);
      expect(state.isLoading).toBe(true);

      store.setRecording(false);

      const newState = useUIStore.getState();
      expect(newState.isRecording).toBe(false);
      expect(newState.isMixing).toBe(true);
      expect(newState.isLoading).toBe(true);
    });
  });

  describe("mixing progress", () => {
    it("should set mixing progress", () => {
      const store = useUIStore.getState();

      expect(store.mixingProgress).toBe(0);

      store.setMixingProgress(0.5);

      expect(useUIStore.getState().mixingProgress).toBe(0.5);
    });

    it("should clamp progress to 0-1 range", () => {
      const store = useUIStore.getState();

      // Test negative values
      store.setMixingProgress(-0.5);
      expect(useUIStore.getState().mixingProgress).toBe(0);

      // Test values > 1
      store.setMixingProgress(1.5);
      expect(useUIStore.getState().mixingProgress).toBe(1);

      // Test valid values
      store.setMixingProgress(0.75);
      expect(useUIStore.getState().mixingProgress).toBe(0.75);
    });

    it("should handle edge cases", () => {
      const store = useUIStore.getState();

      store.setMixingProgress(0);
      expect(useUIStore.getState().mixingProgress).toBe(0);

      store.setMixingProgress(1);
      expect(useUIStore.getState().mixingProgress).toBe(1);
    });

    it("should update progress incrementally", () => {
      const store = useUIStore.getState();

      for (let i = 0; i <= 10; i++) {
        store.setMixingProgress(i / 10);
        expect(useUIStore.getState().mixingProgress).toBe(i / 10);
      }
    });
  });

  describe("error handling", () => {
    it("should set error message", () => {
      const store = useUIStore.getState();

      expect(store.errorMessage).toBeNull();

      store.setError("Something went wrong");

      expect(useUIStore.getState().errorMessage).toBe("Something went wrong");
    });

    it("should clear error message", () => {
      const store = useUIStore.getState();

      store.setError("Error message");
      expect(useUIStore.getState().errorMessage).toBe("Error message");

      store.clearError();

      expect(useUIStore.getState().errorMessage).toBeNull();
    });

    it("should update error message", () => {
      const store = useUIStore.getState();

      store.setError("First error");
      expect(useUIStore.getState().errorMessage).toBe("First error");

      store.setError("Second error");

      expect(useUIStore.getState().errorMessage).toBe("Second error");
    });

    it("should allow setting error to null", () => {
      const store = useUIStore.getState();

      store.setError("Error");
      expect(useUIStore.getState().errorMessage).toBe("Error");

      store.setError(null);

      expect(useUIStore.getState().errorMessage).toBeNull();
    });
  });

  describe("store reset", () => {
    it("should reset all state to initial values", () => {
      const store = useUIStore.getState();

      // Set all values to non-default
      store.showSaveModal();
      store.showMixingModal();
      store.setSelectedTrack("track-123");
      store.setRecording(true);
      store.setMixing(true);
      store.setLoading(true);
      store.setMixingProgress(0.75);
      store.setError("Test error");

      // Verify state changed
      let state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(true);
      expect(state.mixingModalVisible).toBe(true);
      expect(state.selectedTrackId).toBe("track-123");
      expect(state.isRecording).toBe(true);
      expect(state.isMixing).toBe(true);
      expect(state.isLoading).toBe(true);
      expect(state.mixingProgress).toBe(0.75);
      expect(state.errorMessage).toBe("Test error");

      // Reset
      store.reset();

      // Verify reset to initial state
      state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(false);
      expect(state.mixingModalVisible).toBe(false);
      expect(state.selectedTrackId).toBeNull();
      expect(state.isRecording).toBe(false);
      expect(state.isMixing).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.mixingProgress).toBe(0);
      expect(state.errorMessage).toBeNull();
    });

    it("should allow normal operations after reset", () => {
      const store = useUIStore.getState();

      store.showSaveModal();
      store.setRecording(true);

      store.reset();

      store.showMixingModal();
      store.setMixing(true);

      const state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(false);
      expect(state.mixingModalVisible).toBe(true);
      expect(state.isRecording).toBe(false);
      expect(state.isMixing).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid state changes", () => {
      const store = useUIStore.getState();

      for (let i = 0; i < 100; i++) {
        store.showSaveModal();
        store.hideSaveModal();
        store.setRecording(i % 2 === 0);
        store.setMixingProgress(i / 100);
      }

      // Should not throw and state should be consistent
      const state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(false);
      expect(state.isRecording).toBe(false);
      expect(state.mixingProgress).toBe(0.99);
    });

    it("should handle concurrent modal operations", () => {
      const store = useUIStore.getState();

      // Open both modals
      store.showSaveModal();
      store.showMixingModal();

      expect(useUIStore.getState().saveModalVisible).toBe(true);
      expect(useUIStore.getState().mixingModalVisible).toBe(true);

      // Close both
      store.hideSaveModal();
      store.hideMixingModal();

      expect(useUIStore.getState().saveModalVisible).toBe(false);
      expect(useUIStore.getState().mixingModalVisible).toBe(false);
    });

    it("should handle empty string as error message", () => {
      const store = useUIStore.getState();

      store.setError("");

      expect(useUIStore.getState().errorMessage).toBe("");
    });
  });

  describe("typical user flows", () => {
    it("should handle recording flow", () => {
      const store = useUIStore.getState();

      // Start recording
      store.setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);

      store.setRecording(true);
      store.setLoading(false);

      let state = useUIStore.getState();
      expect(state.isRecording).toBe(true);
      expect(state.isLoading).toBe(false);

      // Stop recording
      store.setLoading(true);
      store.setRecording(false);
      store.setLoading(false);

      state = useUIStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should handle mixing flow", () => {
      const store = useUIStore.getState();

      // Start mixing
      store.showSaveModal();
      expect(useUIStore.getState().saveModalVisible).toBe(true);

      store.hideSaveModal();
      store.setMixing(true);
      store.showMixingModal();
      store.setMixingProgress(0);

      let state = useUIStore.getState();
      expect(state.saveModalVisible).toBe(false);
      expect(state.mixingModalVisible).toBe(true);
      expect(state.isMixing).toBe(true);

      // Update progress
      store.setMixingProgress(0.5);
      expect(useUIStore.getState().mixingProgress).toBe(0.5);

      // Complete mixing
      store.setMixingProgress(1);
      store.setMixing(false);
      store.hideMixingModal();

      state = useUIStore.getState();
      expect(state.mixingModalVisible).toBe(false);
      expect(state.isMixing).toBe(false);
      expect(state.mixingProgress).toBe(1);
    });

    it("should handle error flow", () => {
      const store = useUIStore.getState();

      // Set error
      store.setError("Recording failed");
      expect(useUIStore.getState().errorMessage).toBe("Recording failed");

      // User dismisses error
      store.clearError();
      expect(useUIStore.getState().errorMessage).toBeNull();
    });
  });
});
