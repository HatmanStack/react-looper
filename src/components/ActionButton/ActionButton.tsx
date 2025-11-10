/**
 * ActionButton Component
 *
 * Reusable action button with icon support for main app operations
 * Supports primary and secondary button styles with disabled states
 */

import React from 'react';
import { Button } from 'react-native-paper';
import { styles } from './ActionButton.styles';

export interface ActionButtonProps {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  mode?: 'contained' | 'outlined' | 'text';
  style?: object;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onPress,
  disabled = false,
  mode = 'contained',
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
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
