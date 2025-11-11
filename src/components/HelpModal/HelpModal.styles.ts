/**
 * HelpModal Styles
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#524949",
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 8,
    maxHeight: "80%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#E1E1E1",
    lineHeight: 24,
  },
});
