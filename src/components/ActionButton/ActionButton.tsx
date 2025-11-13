/**
 * ActionButton Component
 *
 * Reusable action button with icon support for main app operations
 * Supports primary and secondary button styles with disabled states
 * Can show icon-only on small screens
 */

import React from "react";
import { Button, IconButton } from "react-native-paper";
import { styles } from "./ActionButton.styles";

export interface ActionButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  mode?: "contained" | "outlined" | "text";
  style?: object;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  iconOnly?: boolean; // New prop to show icon only
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onPress,
  disabled = false,
  mode = "contained",
  style,
  accessibilityLabel,
  accessibilityHint,
  iconOnly = false,
}) => {
  // If iconOnly mode and icon exists, use IconButton
  if (iconOnly && icon) {
    return (
      <IconButton
        icon={icon}
        onPress={onPress}
        disabled={disabled}
        style={[styles.iconButton, style]}
        iconColor={disabled ? "#999" : "#FFFFFF"}
        containerColor={disabled ? "#555" : "#3F51B5"}
        size={24}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      />
    );
  }

  // Otherwise use regular Button
  return (
    <Button
      mode={mode}
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, style]}
      contentStyle={styles.buttonContent}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {label}
    </Button>
  );
};
