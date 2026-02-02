/**
 * Root Layout for Expo Router
 *
 * Sets up the app providers and navigation structure.
 * Wraps app in ErrorBoundary for graceful error handling.
 * Initializes global error handlers for uncaught exceptions.
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { looperTheme } from "../src/theme/paperTheme";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { logger } from "../src/utils/logger";
import { initGlobalErrorHandlers } from "../src/utils/globalErrorHandler";
import { initializeStores } from "../src/store/initializeStores";

export default function RootLayout() {
  useEffect(() => {
    initGlobalErrorHandlers();
    initializeStores();
  }, []);

  const handleError = (error: Error) => {
    logger.error("[RootLayout] Unhandled error:", error);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <PaperProvider theme={looperTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: looperTheme.colors.background },
          }}
        />
        <StatusBar style="light" />
      </PaperProvider>
    </ErrorBoundary>
  );
}
