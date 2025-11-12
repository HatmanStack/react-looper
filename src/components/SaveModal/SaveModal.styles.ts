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
    maxWidth: 500,
    maxHeight: "90%",
    alignSelf: "center",
  },
  scrollContent: {
    flexGrow: 1,
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
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: "#E1E1E1",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  customInput: {
    backgroundColor: "#1E1E1E",
    marginTop: 8,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
  },
  infoLabel: {
    color: "#B0B0B0",
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    color: "#E1E1E1",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningText: {
    color: "#FFA726", // Warning/amber color
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 8,
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
