/**
 * ConfirmationDialog Component
 *
 * Reusable confirmation dialog for destructive or important actions.
 * Supports custom labels, destructive styling, and accessibility.
 */

import React from "react";
import { Dialog, Portal, Button, Text } from "react-native-paper";

export interface ConfirmationDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/explanation */
  message: string;
  /** Callback when confirm button is pressed */
  onConfirm: () => void;
  /** Callback when cancel button is pressed */
  onCancel: () => void;
  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string;
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  /** If true, confirm button uses destructive (error) color */
  destructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}) => {
  const confirmButtonColor = destructive ? "#FA2818" : "#3F51B5"; // Error or Primary

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        testID="confirmation-dialog"
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} testID="cancel-button">
            {cancelLabel}
          </Button>
          <Button
            onPress={onConfirm}
            buttonColor={confirmButtonColor}
            textColor="#FFFFFF"
            mode="contained"
            testID="confirm-button"
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
