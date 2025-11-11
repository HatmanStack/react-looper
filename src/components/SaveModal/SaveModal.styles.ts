/**
 * SaveModal Styles
 *
 * Styles for the save modal dialog matching Material Design
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "#1E1E1E", // Surface color from theme
    marginHorizontal: 20,
    marginVertical: "auto",
    padding: 24,
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: "center",
  },
  content: {
    gap: 16,
  },
  trackLabel: {
    color: "#E1E1E1",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1E1E1E",
  },
  errorText: {
    color: "#CF6679", // Error color from MD3 dark theme
    fontSize: 12,
    marginTop: -8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
});
