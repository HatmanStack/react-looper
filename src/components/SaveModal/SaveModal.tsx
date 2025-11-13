/**
 * SaveModal Component
 *
 * Modal dialog for saving/exporting tracks with configuration options:
 * - Filename input and validation
 * - Loop count selection (1, 2, 4, 8, custom)
 * - Fadeout duration (None, 1s, 2s, 5s, custom)
 * - Estimated duration calculation
 * Uses React Native Paper Portal and Modal for overlay
 */

import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import {
  Portal,
  Modal,
  TextInput,
  Button,
  Text,
  SegmentedButtons,
} from "react-native-paper";
import { styles } from "./SaveModal.styles";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTrackStore } from "../../store/useTrackStore";
import { calculateMasterLoopDuration } from "../../utils/loopUtils";

export interface SaveModalProps {
  visible: boolean;
  trackId?: string;
  trackNumber?: number;
  onDismiss: () => void;
  onSave: (
    filename: string,
    loopCount: number,
    fadeoutDuration: number,
  ) => void;
}

// Preset options for loop count
const LOOP_COUNT_PRESETS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "8", label: "8" },
  { value: "custom", label: "Custom" },
];

// Preset options for fadeout (in milliseconds)
const FADEOUT_PRESETS = [
  { value: "0", label: "None" },
  { value: "1000", label: "1s" },
  { value: "2000", label: "2s" },
  { value: "5000", label: "5s" },
  { value: "custom", label: "Custom" },
];

export const SaveModal: React.FC<SaveModalProps> = ({
  visible,
  trackId: _trackId,
  trackNumber,
  onDismiss,
  onSave,
}) => {
  const { defaultLoopCount, defaultFadeout } = useSettingsStore();
  const tracks = useTrackStore((state) => state.tracks);

  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  // Loop count state
  const [loopCountPreset, setLoopCountPreset] = useState<string>("4");
  const [customLoopCount, setCustomLoopCount] = useState("");
  const [loopCountError, setLoopCountError] = useState("");

  // Fadeout state
  const [fadeoutPreset, setFadeoutPreset] = useState<string>("2000");
  const [customFadeout, setCustomFadeout] = useState("");
  const [fadeoutError, setFadeoutError] = useState("");

  // Initialize with defaults when modal opens
  useEffect(() => {
    if (visible) {
      // Set loop count preset or custom
      const loopCountStr = String(defaultLoopCount);
      if (["1", "2", "4", "8"].includes(loopCountStr)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoopCountPreset(loopCountStr);

        setCustomLoopCount("");
      } else {
        setLoopCountPreset("custom");

        setCustomLoopCount(loopCountStr);
      }

      // Set fadeout preset or custom
      const fadeoutStr = String(defaultFadeout);
      if (["0", "1000", "2000", "5000"].includes(fadeoutStr)) {
        setFadeoutPreset(fadeoutStr);
        setCustomFadeout("");
      } else {
        setFadeoutPreset("custom");
        setCustomFadeout(String(defaultFadeout / 1000)); // Convert ms to seconds for display
      }
    }
  }, [visible, defaultLoopCount, defaultFadeout]);

  const sanitizeFilename = (input: string): string => {
    // Remove invalid characters for filenames
    return input.replace(/[<>:"/\\|?*]/g, "").trim();
  };

  const validateFilename = (input: string): boolean => {
    const sanitized = sanitizeFilename(input);
    if (!sanitized) {
      setError("Filename cannot be empty");
      return false;
    }
    setError("");
    return true;
  };

  const getLoopCount = (): number => {
    if (loopCountPreset === "custom") {
      const value = parseInt(customLoopCount, 10);
      if (isNaN(value) || value < 1) {
        setLoopCountError("Loop count must be at least 1");
        return 1;
      }
      if (value > 100) {
        setLoopCountError("Loop count cannot exceed 100");
        return 100;
      }
      setLoopCountError("");
      return value;
    } else {
      return parseInt(loopCountPreset, 10);
    }
  };

  const getFadeoutDuration = (): number => {
    if (fadeoutPreset === "custom") {
      const seconds = parseFloat(customFadeout);
      if (isNaN(seconds) || seconds < 0) {
        setFadeoutError("Fadeout must be non-negative");
        return 0;
      }
      if (seconds > 10) {
        setFadeoutError("Fadeout cannot exceed 10 seconds");
        return 10000;
      }
      setFadeoutError("");
      return Math.round(seconds * 1000); // Convert seconds to milliseconds
    } else {
      return parseInt(fadeoutPreset, 10);
    }
  };

  const calculateEstimatedDuration = (): string => {
    const masterLoopDuration = calculateMasterLoopDuration(tracks); // in milliseconds
    if (masterLoopDuration === 0) {
      return "No tracks available";
    }

    const loopCount = getLoopCount();
    const fadeout = getFadeoutDuration();
    const totalMs = masterLoopDuration * loopCount + fadeout;
    const totalSeconds = Math.round(totalMs / 1000);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const showWarning = (): string | null => {
    const masterLoopDuration = calculateMasterLoopDuration(tracks);
    if (masterLoopDuration === 0) return null;

    const loopCount = getLoopCount();
    const fadeout = getFadeoutDuration();
    const totalMs = masterLoopDuration * loopCount + fadeout;
    const totalMinutes = totalMs / 60000;

    if (totalMinutes > 10) {
      return "⚠️ Export duration is very long. Consider reducing loop count.";
    }

    return null;
  };

  const handleSave = () => {
    // Validate filename
    if (!validateFilename(filename)) {
      return;
    }

    // Get and validate loop count
    const loopCount = getLoopCount();
    if (loopCountError) {
      return;
    }

    // Get and validate fadeout
    const fadeout = getFadeoutDuration();
    if (fadeoutError) {
      return;
    }

    const sanitized = sanitizeFilename(filename);
    onSave(sanitized, loopCount, fadeout);

    // Reset state on successful save
    setFilename("");
    setError("");
    setLoopCountError("");
    setFadeoutError("");
    onDismiss();
  };

  const handleCancel = () => {
    // Reset state on cancel
    setFilename("");
    setError("");
    setLoopCountError("");
    setFadeoutError("");
    onDismiss();
  };

  const warning = showWarning();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView style={styles.scrollContent}>
          <View style={styles.content}>
            {/* Track Label */}
            {trackNumber !== undefined && (
              <Text style={styles.trackLabel} accessibilityRole="header">
                Export {trackNumber} {trackNumber === 1 ? "Track" : "Tracks"}
              </Text>
            )}

            {/* Filename Input */}
            <TextInput
              label="File Name"
              value={filename}
              onChangeText={setFilename}
              style={styles.input}
              mode="outlined"
              error={!!error}
              autoFocus
              onSubmitEditing={handleSave}
              accessibilityLabel="File name"
              accessibilityHint="Enter a name for the saved audio file"
              testID="filename-input"
            />

            {/* Filename Error Message */}
            {error ? (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {error}
              </Text>
            ) : null}

            {/* Loop Count Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Loop Repetitions</Text>
              <SegmentedButtons
                value={loopCountPreset}
                onValueChange={setLoopCountPreset}
                buttons={LOOP_COUNT_PRESETS}
                density="small"
                testID="loop-count-selector"
              />
              {loopCountPreset === "custom" && (
                <TextInput
                  label="Custom Loop Count"
                  value={customLoopCount}
                  onChangeText={setCustomLoopCount}
                  keyboardType="number-pad"
                  style={styles.customInput}
                  mode="outlined"
                  error={!!loopCountError}
                  placeholder="1-100"
                  testID="loop-count-custom-input"
                />
              )}
              {loopCountError ? (
                <Text style={styles.errorText}>{loopCountError}</Text>
              ) : null}
            </View>

            {/* Fadeout Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Fadeout Duration</Text>
              <SegmentedButtons
                value={fadeoutPreset}
                onValueChange={setFadeoutPreset}
                buttons={FADEOUT_PRESETS}
                density="small"
                testID="fadeout-selector"
              />
              {fadeoutPreset === "custom" && (
                <TextInput
                  label="Custom Fadeout (seconds)"
                  value={customFadeout}
                  onChangeText={setCustomFadeout}
                  keyboardType="decimal-pad"
                  style={styles.customInput}
                  mode="outlined"
                  error={!!fadeoutError}
                  placeholder="0-10"
                  testID="fadeout-custom-input"
                />
              )}
              {fadeoutError ? (
                <Text style={styles.errorText}>{fadeoutError}</Text>
              ) : null}
            </View>

            {/* Estimated Duration */}
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Estimated Duration:</Text>
              <Text style={styles.infoValue} testID="estimated-duration">
                {calculateEstimatedDuration()}
              </Text>
            </View>

            {/* Warning Message */}
            {warning ? (
              <Text
                style={styles.warningText}
                accessibilityRole="alert"
                testID="duration-warning"
              >
                {warning}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
                accessibilityLabel="Cancel"
                accessibilityHint="Close dialog without saving"
                accessibilityRole="button"
                testID="cancel-button"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
                disabled={!filename.trim()}
                accessibilityLabel="Save"
                accessibilityHint="Save audio file with entered name"
                accessibilityRole="button"
                accessibilityState={{ disabled: !filename.trim() }}
                testID="save-button"
              >
                Export
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};
