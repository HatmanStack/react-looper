/**
 * VolumeSlider Component
 *
 * Slider for controlling track volume (0-100)
 */

import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { styles } from "./VolumeSlider.styles";

export interface VolumeSliderProps {
  value: number; // 0-100
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const volumePercent = Math.round(value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Volume: {volumePercent}</Text>
      <Slider
        testID="slider"
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        minimumTrackTintColor="#EF5555" // Red accent color from Android app
        maximumTrackTintColor="#666"
        thumbTintColor="#FFFFFF"
        accessibilityLabel="Volume"
        accessibilityValue={{ text: `${volumePercent} percent` }}
        accessibilityHint="Adjust track volume from 0 to 100 percent"
        accessibilityRole="adjustable"
      />
    </View>
  );
};
