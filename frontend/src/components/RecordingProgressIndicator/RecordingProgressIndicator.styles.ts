/**
 * RecordingProgressIndicator Styles
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },

  timerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "monospace",
  },

  progressBar: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
    alignSelf: "center",
  },

  instructionText: {
    fontSize: 14,
    color: "#BBBBBB",
    textAlign: "center",
    marginTop: 4,
  },
});
