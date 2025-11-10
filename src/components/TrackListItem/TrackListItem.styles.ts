/**
 * TrackListItem Styles
 *
 * Styles matching the Android track control layout:
 * - Gradient background
 * - Track name at top center
 * - Play button on left, pause/delete on right
 * - Sliders in the middle
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E', // Surface color from theme
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    // Simulate gradient with border
    borderLeftWidth: 3,
    borderLeftColor: '#BB86FC',
  },
  trackName: {
    color: '#E1E1E1',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
