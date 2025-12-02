import { MD3DarkTheme } from "react-native-paper";

/**
 * Custom dark theme for React Native Paper matching Android Looper app
 *
 * Color choices (from android-looper/app/src/main/res/values/colors.xml):
 * - Primary (#3F51B5): Indigo blue - used for primary actions and emphasis
 * - Accent (#FA2818): Red - used for record button and important actions
 * - Background (#423939): Dark brown/gray - main app background
 * - Primary Background (#EF5555): Coral red - used for highlighted surfaces
 *
 * Based on Material Design 3 Dark Theme with customizations
 * to match the original Android Looper app visual design
 */
export const looperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary brand color - indigo blue from Android app
    primary: "#3F51B5",
    primaryContainer: "#3F51B5",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#FFFFFF",

    // Background and surfaces - dark brown/gray from Android app
    background: "#423939",
    onBackground: "#FFFFFF",
    surface: "#423939",
    onSurface: "#FFFFFF",
    surfaceVariant: "#524949",
    onSurfaceVariant: "#E1E1E1",

    // Error/Accent states - red from Android app
    error: "#FA2818",
    onError: "#FFFFFF",
    errorContainer: "#EF5555",
    onErrorContainer: "#FFFFFF",

    // Outline and borders
    outline: "#938F99",
    outlineVariant: "#6A5F5F",

    // Other accents - using teal from Android app
    secondary: "#03DAC5",
    tertiary: "#03DAC5",
  },
  // Round corners for modern Material Design
  roundness: 8,
};

export type LooperTheme = typeof looperTheme;
