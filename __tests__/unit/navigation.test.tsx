/**
 * Navigation Tests
 *
 * Tests for navigation between Main and Settings screens
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";
import { MainScreen } from "../../src/screens/MainScreen";
import { SettingsScreen } from "../../src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();

const TestNavigator = () => (
  <PaperProvider>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </PaperProvider>
);

describe("Navigation", () => {
  it("renders Main screen by default", () => {
    const { getByText } = render(<TestNavigator />);

    // MainScreen should be visible (has Record button)
    expect(getByText("Record")).toBeTruthy();
  });

  it("navigates to Settings screen when settings button pressed", async () => {
    const { getByTestId, getByText } = render(<TestNavigator />);

    // Find and press settings button
    const settingsButton = getByTestId("settings-button");
    fireEvent.press(settingsButton);

    // Wait for navigation and verify Settings screen is visible
    expect(getByText("Looping Behavior")).toBeTruthy();
    expect(getByText("Export Settings")).toBeTruthy();
  });

  it("navigates back to Main screen from Settings", async () => {
    const { getByTestId, getByText, queryByText } = render(<TestNavigator />);

    // Navigate to Settings
    const settingsButton = getByTestId("settings-button");
    fireEvent.press(settingsButton);

    // Verify on Settings screen
    expect(getByText("Looping Behavior")).toBeTruthy();

    // Press back button
    const backButton = getByTestId("back-button");
    fireEvent.press(backButton);

    // Verify back on Main screen
    expect(getByText("Record")).toBeTruthy();
    expect(queryByText("Looping Behavior")).toBeNull();
  });
});
