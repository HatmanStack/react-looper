/**
 * Responsive Layout Utilities
 *
 * Helpers for responsive design across different screen sizes
 */

import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Breakpoints following Material Design guidelines
 */
export const BREAKPOINTS = {
  xs: 0, // Extra small (phone portrait)
  sm: 600, // Small (phone landscape, small tablet)
  md: 960, // Medium (tablet portrait)
  lg: 1280, // Large (tablet landscape, desktop)
  xl: 1920, // Extra large (large desktop)
} as const;

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  if (SCREEN_WIDTH >= BREAKPOINTS.xl) return "xl";
  if (SCREEN_WIDTH >= BREAKPOINTS.lg) return "lg";
  if (SCREEN_WIDTH >= BREAKPOINTS.md) return "md";
  if (SCREEN_WIDTH >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

/**
 * Check if screen is tablet or larger
 */
export function isTablet(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.sm;
}

/**
 * Check if screen is desktop or larger
 */
export function isDesktop(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.md;
}

/**
 * Check if screen is large desktop
 */
export function isLargeDesktop(): boolean {
  return SCREEN_WIDTH >= BREAKPOINTS.lg;
}

/**
 * Get max content width for centered layouts
 * Optimized for audio looper UI - keeps controls readable and compact
 */
export function getMaxContentWidth(): number {
  const breakpoint = getCurrentBreakpoint();

  switch (breakpoint) {
    case "xl":
      return 900; // Reduced from 1400 for better UX on large screens
    case "lg":
      return 800; // Reduced from 1200
    case "md":
      return 720; // Reduced from 960
    case "sm":
      return 600; // Reduced from 720
    default:
      return SCREEN_WIDTH;
  }
}

/**
 * Get responsive spacing
 */
export function getSpacing(size: "xs" | "sm" | "md" | "lg" | "xl"): number {
  const baseSpacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  // Scale up spacing on larger screens
  const multiplier = isDesktop() ? 1.5 : 1;
  return baseSpacing[size] * multiplier;
}

/**
 * Get responsive font size
 */
export function getFontSize(size: "xs" | "sm" | "md" | "lg" | "xl"): number {
  const baseFontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  };

  // Slightly scale up fonts on larger screens
  const multiplier = isDesktop() ? 1.1 : 1;
  return baseFontSize[size] * multiplier;
}

/**
 * Responsive values helper
 * Returns different values based on screen size
 */
export function responsive<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}): T {
  const breakpoint = getCurrentBreakpoint();

  return values[breakpoint] ?? values.default;
}

/**
 * Get number of columns for grid layouts
 */
export function getGridColumns(): number {
  return responsive({
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    default: 1,
  });
}

export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
