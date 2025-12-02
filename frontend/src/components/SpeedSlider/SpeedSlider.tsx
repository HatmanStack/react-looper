/**
 * SpeedSlider Component
 *
 * Slider for controlling track speed (0.05x - 2.50x)
 * Uses range 3-102 internally, divided by 41 to get speed value
 * Matches Android implementation
 */

import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { styles } from "./SpeedSlider.styles";

export interface SpeedSliderProps {
  value: number; // Speed multiplier (0.05 - 2.50)
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

// Android formula: speed = progress / 41
// where progress range is 3-102
const SPEED_MIN = 3;
const SPEED_MAX = 102;
const SPEED_DIVISOR = 41;

// Convert speed (0.05-2.50) to slider value (3-102)
const speedToSliderValue = (speed: number): number => {
  return Math.round(speed * SPEED_DIVISOR);
};

// Convert slider value (3-102) to speed (0.05-2.50)
const sliderValueToSpeed = (value: number): number => {
  return value / SPEED_DIVISOR;
};

export const SpeedSlider: React.FC<SpeedSliderProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const handleSliderChange = (sliderValue: number) => {
    const speed = sliderValueToSpeed(sliderValue);
    onValueChange(speed);
  };

  const sliderValue = speedToSliderValue(value);

  // Format display value
  // Match Android behavior: if formatted value is "2.44" or higher, display "2.50"
  // Android code: if (holder.equals("2.44")) speedText.setText("2.50")
  let displayValue = value.toFixed(2);
  if (parseFloat(displayValue) >= 2.44) {
    displayValue = "2.50";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Speed: {displayValue}x</Text>
      <Slider
        testID="slider"
        style={styles.slider}
        minimumValue={SPEED_MIN}
        maximumValue={SPEED_MAX}
        step={1}
        value={sliderValue}
        onValueChange={handleSliderChange}
        disabled={disabled}
        minimumTrackTintColor="#EF5555" // Red accent color from Android app
        maximumTrackTintColor="#666"
        thumbTintColor="#FFFFFF"
        accessibilityLabel="Playback speed"
        accessibilityValue={{ text: `${displayValue} times` }}
        accessibilityHint="Adjust playback speed from 0.05 to 2.50 times"
        accessibilityRole="adjustable"
      />
    </View>
  );
};
