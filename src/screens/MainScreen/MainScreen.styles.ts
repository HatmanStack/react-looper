/**
 * MainScreen Styles
 *
 * StyleSheet for MainScreen component matching Android layout:
 * - Dark brown/gray background (#423939) from Android app
 * - Flexbox layout with three sections
 * - Responsive layout for large screens
 */

import { StyleSheet } from "react-native";

// Static styles that don't change
const staticStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#423939", // Match Android app background
  },
  containerBase: {
    flex: 1,
    backgroundColor: "#423939",
    alignSelf: "center",
    width: "100%",
  },
  trackListContainerBase: {
    flex: 1,
    backgroundColor: "#423939", // Match Android app background
  },
});

export const getStyles = (responsive: {
  maxContentWidth: number;
  isDesktop: boolean;
  getSpacing: (size: "xs" | "sm" | "md" | "lg" | "xl") => number;
}) => {
  const { maxContentWidth, isDesktop: isLargeScreen, getSpacing } = responsive;

  return {
    safeArea: staticStyles.safeArea,
    // Use inline style for dynamic maxWidth to avoid StyleSheet caching
    container: [
      staticStyles.containerBase,
      { maxWidth: isLargeScreen ? maxContentWidth : undefined }
    ],
    topControls: {
      flexDirection: "row" as const,
      justifyContent: "space-evenly" as const,
      alignItems: "center" as const,
      paddingHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("sm"),
      paddingVertical: getSpacing("md"),
      backgroundColor: "transparent",
      gap: isLargeScreen ? 16 : 4,
      flexWrap: "nowrap" as const,
    },
    trackListContainer: [
      staticStyles.trackListContainerBase,
      { paddingHorizontal: isLargeScreen ? getSpacing("md") : 0 }
    ],
  };
};
