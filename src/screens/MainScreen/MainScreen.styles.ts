/**
 * MainScreen Styles
 *
 * StyleSheet for MainScreen component matching Android layout:
 * - Dark background
 * - Flexbox layout with three sections
 * - Responsive button sizing
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212', // Match theme background
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  trackListContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Surface color from theme
  },
});
