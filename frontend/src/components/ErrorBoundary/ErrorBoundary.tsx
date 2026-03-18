/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child component tree and displays a fallback UI.
 * Logs errors via the logger utility for debugging.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { logger } from "../../utils/logger";
import { looperTheme } from "../../theme/paperTheme";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("[ErrorBoundary] Caught error:", error);
    logger.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: looperTheme.colors.background,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: looperTheme.colors.onBackground,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: looperTheme.colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: looperTheme.colors.errorContainer,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: looperTheme.roundness,
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: looperTheme.colors.onErrorContainer,
    fontSize: 16,
    fontWeight: "600",
  },
});
