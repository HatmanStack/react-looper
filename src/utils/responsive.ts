/**
 * Responsive Layout Utilities
 *
 * Helpers for responsive design across different screen sizes
 */

import { Dimensions, useWindowDimensions } from "react-native";

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
 * Get screen width (reactive - call within component)
 */
function getScreenWidth(): number {
  return Dimensions.get("window").width;
}

/**
 * Get current breakpoint based on given width
 */
export function getCurrentBreakpoint(width?: number): keyof typeof BREAKPOINTS {
  const screenWidth = width ?? getScreenWidth();
  if (screenWidth >= BREAKPOINTS.xl) return "xl";
  if (screenWidth >= BREAKPOINTS.lg) return "lg";
  if (screenWidth >= BREAKPOINTS.md) return "md";
  if (screenWidth >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

/**
 * Check if screen is tablet or larger
 */
export function isTablet(width?: number): boolean {
  const screenWidth = width ?? getScreenWidth();
  return screenWidth >= BREAKPOINTS.sm;
}

/**
 * Check if screen is desktop or larger
 */
export function isDesktop(width?: number): boolean {
  const screenWidth = width ?? getScreenWidth();
  return screenWidth >= BREAKPOINTS.md;
}

/**
 * Check if screen is large desktop
 */
export function isLargeDesktop(width?: number): boolean {
  const screenWidth = width ?? getScreenWidth();
  return screenWidth >= BREAKPOINTS.lg;
}

/**
 * Get max content width for centered layouts
 * Optimized for audio looper UI - keeps controls readable and compact
 */
export function getMaxContentWidth(width?: number): number {
  const screenWidth = width ?? getScreenWidth();
  const breakpoint = getCurrentBreakpoint(screenWidth);

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
      return screenWidth;
  }
}

/**
 * Get responsive spacing
 */
export function getSpacing(size: "xs" | "sm" | "md" | "lg" | "xl", width?: number): number {
  const baseSpacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  // Scale up spacing on larger screens
  const multiplier = isDesktop(width) ? 1.5 : 1;
  return baseSpacing[size] * multiplier;
}

/**
 * Get responsive font size
 */
export function getFontSize(size: "xs" | "sm" | "md" | "lg" | "xl", width?: number): number {
  const baseFontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  };

  // Slightly scale up fonts on larger screens
  const multiplier = isDesktop(width) ? 1.1 : 1;
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
}, width?: number): T {
  const breakpoint = getCurrentBreakpoint(width);

  return values[breakpoint] ?? values.default;
}

/**
 * Get number of columns for grid layouts
 */
export function getGridColumns(width?: number): number {
  return responsive({
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    default: 1,
  }, width);
}

/**
 * Hook to get reactive window dimensions
 * Use this in components to get dimensions that update on resize
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    breakpoint: getCurrentBreakpoint(width),
    isTablet: isTablet(width),
    isDesktop: isDesktop(width),
    isLargeDesktop: isLargeDesktop(width),
    maxContentWidth: getMaxContentWidth(width),
    getSpacing: (size: "xs" | "sm" | "md" | "lg" | "xl") => getSpacing(size, width),
    getFontSize: (size: "xs" | "sm" | "md" | "lg" | "xl") => getFontSize(size, width),
  };
}
