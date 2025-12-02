/**
 * TrackList Styles
 *
 * Styles for the track list and empty state
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    color: "#E1E1E1",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#CACACA",
    fontSize: 14,
    textAlign: "center",
  },
});
