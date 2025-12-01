/**
 * Navigation Tests
 *
 * Tests for navigation between Main and Settings screens
 */

import React from "react";
import { render } from "@testing-library/react-native";
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
    const { getByLabelText } = render(<TestNavigator />);

    // MainScreen should be visible (has Record button with accessibility label)
    expect(getByLabelText("Record first loop track")).toBeTruthy();
  });
});
