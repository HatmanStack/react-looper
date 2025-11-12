/**
 * SettingsScreen Styles
 *
 * StyleSheet for SettingsScreen component with clean, organized layout
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
    backgroundColor: "#423939", // Match MainScreen background
  },
  header: {
    backgroundColor: "#3F51B5", // Primary color
  },
  container: {
    flex: 1,
    backgroundColor: "#423939",
  },
  section: {
    backgroundColor: "#5A4F4F", // Slightly lighter than background
    marginHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("md"),
    marginTop: getSpacing("md"),
    paddingVertical: getSpacing("md"),
    paddingHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("md"),
    borderRadius: 8,
    maxWidth: isLargeScreen ? maxWidth : undefined,
    alignSelf: "center",
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: getSpacing("md"),
  },
  settingItem: {
    marginVertical: getSpacing("sm"),
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: getSpacing("md"),
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#CCCCCC",
    marginBottom: getSpacing("sm"),
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: getSpacing("md"),
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    color: "#FFFFFF",
    minWidth: 50,
    textAlign: "right",
  },
  segmentedButtons: {
    marginTop: getSpacing("sm"),
  },
  divider: {
    backgroundColor: "#6A5F5F",
    marginVertical: getSpacing("md"),
  },
  resetButton: {
    marginTop: getSpacing("sm"),
    borderColor: "#FF5252",
  },
  bottomPadding: {
    height: getSpacing("xl"),
  },
});
