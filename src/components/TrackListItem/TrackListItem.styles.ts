/**
 * TrackListItem Styles
 *
 * Styles matching the Android track control layout:
 * - Gradient background
 * - Track name at top center
 * - Play button on left, pause/delete on right
 * - Sliders in the middle
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#524949", // Slightly lighter than main background
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  masterTrackContainer: {
    borderWidth: 5, // Thicker border for master track
    borderColor: "#3F51B5", // Primary color (blue)
    backgroundColor: "rgba(63, 81, 181, 0.1)", // Subtle primary tint
  },
  selectedTrackContainer: {
    borderWidth: 2, // Thinner border for selected tracks
    borderColor: "#3F51B5", // Blue highlight for selected tracks (same as master)
  },
  trackName: {
    color: "#E1E1E1",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButton: {
    margin: 0,
  },
  pauseButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  slidersContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
});
