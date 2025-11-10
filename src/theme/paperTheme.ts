import { MD3DarkTheme } from 'react-native-paper';

/**
 * Custom dark theme for React Native Paper matching Android app aesthetic
 *
 * Color choices:
 * - Primary (#BB86FC): Material Design dark theme purple - used for primary actions and emphasis
 * - Background (#121212): Deep dark background for OLED-friendly dark mode
 * - Surface (#1E1E1E): Elevated surfaces like cards and modals
 * - Error (#CF6679): Material Design dark error color
 *
 * Based on Material Design 3 Dark Theme with customizations
 * to match the original Looper Android app visual design
 */
export const looperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary brand color - purple accent
    primary: '#BB86FC',
    primaryContainer: '#3700B3',
    onPrimary: '#000000',
    onPrimaryContainer: '#FFFFFF',

    // Background and surfaces
    background: '#121212',
    onBackground: '#E1E1E1',
    surface: '#1E1E1E',
    onSurface: '#E1E1E1',
    surfaceVariant: '#2C2C2C',
    onSurfaceVariant: '#CACACA',

    // Error states
    error: '#CF6679',
    onError: '#000000',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',

    // Outline and borders
    outline: '#938F99',
    outlineVariant: '#49454F',

    // Other accents
    secondary: '#03DAC6',
    tertiary: '#03DAC6',
  },
  // Round corners for modern Material Design
  roundness: 8,
};

export type LooperTheme = typeof looperTheme;
