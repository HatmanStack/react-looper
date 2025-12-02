/**
 * Root Layout for Expo Router
 *
 * Sets up the app providers and navigation structure.
 */

import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { looperTheme } from "../src/theme/paperTheme";

export default function RootLayout() {
  return (
    <PaperProvider theme={looperTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: looperTheme.colors.background },
        }}
      />
      <StatusBar style="light" />
    </PaperProvider>
  );
}
