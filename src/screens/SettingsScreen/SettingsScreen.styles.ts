/**
 * SettingsScreen Styles
 *
 * StyleSheet for SettingsScreen component with clean, organized layout
 */

import { StyleSheet } from "react-native";

// Static styles that don't change
const staticStyles = StyleSheet.create({
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
  sectionBase: {
    backgroundColor: "#5A4F4F", // Slightly lighter than background
    borderRadius: 8,
    alignSelf: "center",
    width: "100%",
  },
  settingLabel: StyleSheet.create({
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
      marginBottom: 4,
    },
  }).settingLabel,
  settingDescription: StyleSheet.create({
    settingDescription: {
      fontSize: 13,
      color: "#CCCCCC",
    },
  }).settingDescription,
  settingRow: StyleSheet.create({
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  }).settingRow,
  settingTextContainer: StyleSheet.create({
    settingTextContainer: {
      flex: 1,
    },
  }).settingTextContainer,
  sliderContainer: StyleSheet.create({
    sliderContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
  }).sliderContainer,
  slider: StyleSheet.create({
    slider: {
      flex: 1,
      height: 40,
    },
  }).slider,
  sliderValue: StyleSheet.create({
    sliderValue: {
      fontSize: 14,
      color: "#FFFFFF",
      minWidth: 50,
      textAlign: "right",
    },
  }).sliderValue,
  versionText: StyleSheet.create({
    versionText: {
      fontSize: 14,
      color: "#CCCCCC",
    },
  }).versionText,
  helpAccordion: StyleSheet.create({
    helpAccordion: {
      backgroundColor: "transparent",
      paddingHorizontal: 0,
    },
  }).helpAccordion,
  helpAccordionTitle: StyleSheet.create({
    helpAccordionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  }).helpAccordionTitle,
});

export const getStyles = (responsive: {
  maxContentWidth: number;
  isDesktop: boolean;
  getSpacing: (size: "xs" | "sm" | "md" | "lg" | "xl") => number;
}) => {
  const { maxContentWidth, isDesktop: isLargeScreen, getSpacing } = responsive;

  return {
    safeArea: staticStyles.safeArea,
    header: staticStyles.header,
    container: staticStyles.container,
    // Use inline styles for dynamic values
    section: [
      staticStyles.sectionBase,
      {
        marginHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("md"),
        marginTop: getSpacing("md"),
        paddingVertical: getSpacing("md"),
        paddingHorizontal: isLargeScreen ? getSpacing("lg") : getSpacing("md"),
        maxWidth: isLargeScreen ? maxContentWidth : undefined,
      }
    ],
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold" as const,
      color: "#FFFFFF",
      marginBottom: getSpacing("md"),
    },
    settingItem: {
      marginVertical: getSpacing("sm"),
    },
    settingRow: staticStyles.settingRow,
    settingTextContainer: [
      staticStyles.settingTextContainer,
      { marginRight: getSpacing("md") }
    ],
    settingLabel: staticStyles.settingLabel,
    settingDescription: [
      staticStyles.settingDescription,
      { marginBottom: getSpacing("sm") }
    ],
    sliderContainer: [
      staticStyles.sliderContainer,
      { gap: getSpacing("md") }
    ],
    slider: staticStyles.slider,
    sliderValue: staticStyles.sliderValue,
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
    versionText: staticStyles.versionText,
    helpAccordion: staticStyles.helpAccordion,
    helpAccordionTitle: staticStyles.helpAccordionTitle,
    helpText: {
      fontSize: 14,
      color: "#CCCCCC",
      lineHeight: 20,
      paddingHorizontal: getSpacing("sm"),
      paddingVertical: getSpacing("sm"),
    },
    linkButton: {
      marginTop: getSpacing("sm"),
    },
    bottomPadding: {
      height: getSpacing("xl"),
    },
  };
};
