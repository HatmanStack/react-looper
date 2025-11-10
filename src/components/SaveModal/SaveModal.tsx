/**
 * SaveModal Component
 *
 * Modal dialog for saving tracks with filename input and validation
 * Uses React Native Paper Portal and Modal for overlay
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { Portal, Modal, TextInput, Button, Text } from 'react-native-paper';
import { styles } from './SaveModal.styles';

export interface SaveModalProps {
  visible: boolean;
  trackId?: string;
  trackNumber?: number;
  onDismiss: () => void;
  onSave: (filename: string) => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  visible,
  trackId: _trackId,
  trackNumber,
  onDismiss,
  onSave,
}) => {
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  const sanitizeFilename = (input: string): string => {
    // Remove invalid characters for filenames
    return input.replace(/[<>:"/\\|?*]/g, '').trim();
  };

  const validateFilename = (input: string): boolean => {
    const sanitized = sanitizeFilename(input);
    if (!sanitized) {
      setError('Filename cannot be empty');
      return false;
    }
    setError('');
    return true;
  };

  const handleSave = () => {
    if (validateFilename(filename)) {
      const sanitized = sanitizeFilename(filename);
      onSave(sanitized);
      // Reset state on successful save
      setFilename('');
      setError('');
      onDismiss();
    }
  };

  const handleCancel = () => {
    // Reset state on cancel
    setFilename('');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <View style={styles.content}>
          {/* Track Label */}
          {trackNumber !== undefined && (
            <Text style={styles.trackLabel} accessibilityRole="header">
              Track {trackNumber}
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
          />

          {/* Error Message */}
          {error ? (
            <Text
              style={styles.errorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              {error}
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
            >
              Save
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};
