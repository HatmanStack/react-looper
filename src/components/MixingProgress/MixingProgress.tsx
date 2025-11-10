/**
 * Mixing Progress Modal Component
 *
 * Displays progress while FFmpeg is mixing audio tracks.
 * Shows progress bar, estimated time, and cancel button.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, ProgressBar, Text, Button, useTheme } from 'react-native-paper';

export interface MixingProgressProps {
  visible: boolean;
  progress: number; // 0-1
  currentTime?: number; // milliseconds
  totalDuration?: number; // milliseconds
  onCancel: () => void;
}

export const MixingProgress: React.FC<MixingProgressProps> = ({
  visible,
  progress,
  currentTime,
  totalDuration,
  onCancel,
}) => {
  const theme = useTheme();

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = (): string => {
    if (!totalDuration || !currentTime || progress === 0) {
      return 'Calculating...';
    }

    const elapsed = currentTime;
    const total = elapsed / progress;
    const remaining = Math.max(0, total - elapsed);
    return formatTime(remaining);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title} accessibilityRole="header">
            Mixing Audio
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Please wait while your tracks are being mixed...
          </Text>

          <View
            style={styles.progressContainer}
            accessibilityLabel={`Mixing progress: ${Math.round(progress * 100)} percent complete`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            accessibilityLiveRegion="polite"
          >
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text
              variant="labelLarge"
              style={styles.progressText}
              accessibilityLabel={`${Math.round(progress * 100)} percent`}
            >
              {Math.round(progress * 100)}%
            </Text>
          </View>

          {currentTime !== undefined && totalDuration !== undefined && (
            <View style={styles.timeContainer}>
              <Text
                variant="bodySmall"
                style={styles.timeText}
                accessibilityLabel={`Time elapsed: ${formatTime(currentTime)}`}
              >
                Time: {formatTime(currentTime)}
              </Text>
              <Text
                variant="bodySmall"
                style={styles.timeText}
                accessibilityLabel={`Time remaining: ${getEstimatedTimeRemaining()}`}
              >
                Remaining: {getEstimatedTimeRemaining()}
              </Text>
            </View>
          )}

          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
            textColor={theme.colors.error}
            accessibilityLabel="Cancel mixing"
            accessibilityHint="Stop the mixing process and return to main screen"
            accessibilityRole="button"
          >
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 24,
    borderRadius: 8,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  timeText: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 8,
  },
});
