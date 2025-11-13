/**
 * MainScreen Styles
 *
 * StyleSheet for MainScreen component matching Android layout:
 * - Dark brown/gray background (#423939) from Android app
 * - Flexbox layout with three sections
 * - Responsive layout for large screens
 */

import { StyleSheet } from "react-native";
import {
  getMaxContentWidth,
  isDesktop,
  getSpacing,
} from "../../utils/responsive";

const maxWidth = getMaxContentWidth();
const isLargeScreen = isDesktop();

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#423939", // Match Android app background
  },
  container: {
    flex: 1,
    backgroundColor: "#423939",
    alignSelf: "center",
    width: "100%",
    maxWidth: isLargeScreen ? maxWidth : "100%",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("sm"),
    paddingVertical: getSpacing("md"),
    backgroundColor: "transparent",
    gap: isLargeScreen ? 16 : 8,
  },
  trackListContainer: {
    flex: 1,
    backgroundColor: "#423939", // Match Android app background
    paddingHorizontal: isLargeScreen ? getSpacing("md") : 0,
  },
});
