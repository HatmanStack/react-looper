/**
 * SettingsScreen Component
 *
 * Comprehensive settings screen for looping, export, and recording preferences.
 * Organized into logical sections with clear labels and descriptions.
 */

import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import {
  Text,
  Switch,
  Button,
  Surface,
  Divider,
  SegmentedButtons,
  Appbar,
} from "react-native-paper";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../App";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationDialog } from "@components/ConfirmationDialog";
import { useSettingsStore } from "../../store/useSettingsStore";
import type { AudioFormat, QualityLevel } from "../../store/useSettingsStore";
import { styles } from "./SettingsScreen.styles";

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  // Settings state from store
  const {
    loopCrossfadeDuration,
    defaultLoopMode,
    defaultLoopCount,
    defaultFadeout,
    exportFormat,
    exportQuality,
    recordingFormat,
    recordingQuality,
    updateSettings,
    resetToDefaults,
  } = useSettingsStore();

  // Confirmation dialog state
  const [resetConfirmVisible, setResetConfirmVisible] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle reset confirmation
  const handleResetConfirm = () => {
    resetToDefaults();
    setResetConfirmVisible(false);
  };

  const handleResetCancel = () => {
    setResetConfirmVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleBack} testID="back-button" />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView style={styles.container}>
        {/* Looping Behavior Section */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Looping Behavior</Text>

          {/* Crossfade Duration */}
          <View style={styles.settingItem}>
            <Text
              style={styles.settingLabel}
              accessibilityLabel="Loop crossfade duration"
            >
              Loop Crossfade
            </Text>
            <Text style={styles.settingDescription}>
              Smooth transition at loop boundaries (0ms = gapless)
            </Text>
            <View style={styles.sliderContainer}>
              <Slider
                testID="crossfade-slider"
                style={styles.slider}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={loopCrossfadeDuration}
                onValueChange={(value) =>
                  updateSettings({ loopCrossfadeDuration: value })
                }
                minimumTrackTintColor="#3F51B5"
                maximumTrackTintColor="#CCCCCC"
                thumbTintColor="#3F51B5"
              />
              <Text style={styles.sliderValue}>{loopCrossfadeDuration}ms</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Default Loop Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text
                  style={styles.settingLabel}
                  accessibilityLabel="Default loop mode"
                >
                  Default Loop Mode
                </Text>
                <Text style={styles.settingDescription}>
                  Enable looping by default when app starts
                </Text>
              </View>
              <Switch
                testID="loop-mode-switch"
                value={defaultLoopMode}
                onValueChange={(value) =>
                  updateSettings({ defaultLoopMode: value })
                }
                color="#3F51B5"
              />
            </View>
          </View>
        </Surface>

        {/* Export Settings Section */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Export Settings</Text>

          {/* Default Loop Count */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Loop Repetitions</Text>
            <Text style={styles.settingDescription}>
              Number of loops to include in exported audio
            </Text>
            <SegmentedButtons
              value={defaultLoopCount.toString()}
              onValueChange={(value) =>
                updateSettings({ defaultLoopCount: parseInt(value) })
              }
              buttons={[
                {
                  value: "1",
                  label: "1",
                  testID: "loop-count-1",
                },
                {
                  value: "2",
                  label: "2",
                  testID: "loop-count-2",
                },
                {
                  value: "4",
                  label: "4",
                  testID: "loop-count-4",
                },
                {
                  value: "8",
                  label: "8",
                  testID: "loop-count-8",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Default Fadeout Duration */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Fadeout Duration</Text>
            <Text style={styles.settingDescription}>
              Apply fadeout at end of export
            </Text>
            <SegmentedButtons
              value={defaultFadeout.toString()}
              onValueChange={(value) =>
                updateSettings({ defaultFadeout: parseInt(value) })
              }
              buttons={[
                {
                  value: "0",
                  label: "None",
                  testID: "fadeout-0",
                },
                {
                  value: "1000",
                  label: "1s",
                  testID: "fadeout-1000",
                },
                {
                  value: "2000",
                  label: "2s",
                  testID: "fadeout-2000",
                },
                {
                  value: "5000",
                  label: "5s",
                  testID: "fadeout-5000",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Export Format */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Export Format</Text>
            <SegmentedButtons
              value={exportFormat}
              onValueChange={(value) =>
                updateSettings({ exportFormat: value as AudioFormat })
              }
              buttons={[
                {
                  value: "mp3",
                  label: "MP3",
                  testID: "export-format-mp3",
                },
                {
                  value: "wav",
                  label: "WAV",
                  testID: "export-format-wav",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Export Quality */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Export Quality</Text>
            <SegmentedButtons
              value={exportQuality}
              onValueChange={(value) =>
                updateSettings({ exportQuality: value as QualityLevel })
              }
              buttons={[
                {
                  value: "low",
                  label: "Low",
                  testID: "export-quality-low",
                },
                {
                  value: "medium",
                  label: "Medium",
                  testID: "export-quality-medium",
                },
                {
                  value: "high",
                  label: "High",
                  testID: "export-quality-high",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Surface>

        {/* Recording Settings Section */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Recording Settings</Text>

          {/* Recording Format */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Recording Format</Text>
            <SegmentedButtons
              value={recordingFormat}
              onValueChange={(value) =>
                updateSettings({ recordingFormat: value as AudioFormat })
              }
              buttons={[
                {
                  value: "m4a",
                  label: "M4A",
                  testID: "recording-format-m4a",
                },
                {
                  value: "wav",
                  label: "WAV",
                  testID: "recording-format-wav",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Recording Quality */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Recording Quality</Text>
            <SegmentedButtons
              value={recordingQuality}
              onValueChange={(value) =>
                updateSettings({ recordingQuality: value as QualityLevel })
              }
              buttons={[
                {
                  value: "low",
                  label: "Low",
                  testID: "recording-quality-low",
                },
                {
                  value: "medium",
                  label: "Medium",
                  testID: "recording-quality-medium",
                },
                {
                  value: "high",
                  label: "High",
                  testID: "recording-quality-high",
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Surface>

        {/* Actions Section */}
        <Surface style={styles.section} elevation={0}>
          <Button
            mode="outlined"
            onPress={() => setResetConfirmVisible(true)}
            style={styles.resetButton}
            textColor="#FF5252"
          >
            Reset to Defaults
          </Button>
        </Surface>

        {/* Bottom padding for scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        visible={resetConfirmVisible}
        title="Reset Settings?"
        message="This will reset all settings to default values. This cannot be undone."
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        destructive={true}
      />
    </SafeAreaView>
  );
};
