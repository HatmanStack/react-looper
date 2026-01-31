/**
 * TopControlsSkeleton Component
 *
 * Skeleton placeholder for top controls to prevent layout shift during load.
 * Matches ActionButton appearance - pills on desktop, circles on mobile.
 */

import React, { useEffect, useMemo } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Surface } from "react-native-paper";
import { BREAKPOINTS } from "../../utils/responsive";

// IconButton size=24 renders to ~48px with padding
const ICON_BUTTON_SIZE = 48;
// Button height matches react-native-paper Button
const PILL_HEIGHT = 40;

interface TopControlsSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export const TopControlsSkeleton: React.FC<TopControlsSkeletonProps> = ({
  style,
}) => {
  // Check width directly to avoid timing issues with useWindowDimensions
  // Default to desktop (pills) if dimensions aren't ready yet
  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth === 0 || screenWidth >= BREAKPOINTS.md;
  const iconOnly = !isDesktop;

  const pulseAnim = useMemo(() => new Animated.Value(0.6), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const buttonStyle = iconOnly ? styles.iconButton : styles.pillButton;

  return (
    <Surface style={style} elevation={0}>
      <Animated.View style={[buttonStyle, { opacity: pulseAnim }]} />
      <Animated.View style={[buttonStyle, { opacity: pulseAnim }]} />
      <Animated.View style={[buttonStyle, { opacity: pulseAnim }]} />
      <Animated.View style={[buttonStyle, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.menuButton, { opacity: pulseAnim }]} />
    </Surface>
  );
};

const styles = StyleSheet.create({
  // Desktop: rounded rectangle buttons matching react-native-paper Button
  pillButton: {
    width: 130,
    height: PILL_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#3F51B5",
  },
  // Mobile: circular icon buttons
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    backgroundColor: "#3F51B5",
  },
  // Menu button is always circular
  menuButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
