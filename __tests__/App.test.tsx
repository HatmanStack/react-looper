import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

describe("App", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(async () => {
    // Wait for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 200));
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("renders without crashing", () => {
    const { getByText } = render(<App />);
    expect(getByText("Record")).toBeTruthy();
  });

  it("renders top control buttons", () => {
    const { getByText } = render(<App />);
    expect(getByText("Record")).toBeTruthy();
    expect(getByText("Stop")).toBeTruthy();
  });

  it("renders bottom control buttons", () => {
    const { getByText } = render(<App />);
    expect(getByText("Import Audio")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
  });

  it("renders MainScreen component", () => {
    const { getByText } = render(<App />);
    // Verify core UI elements are present
    expect(getByText("Record")).toBeTruthy();
    expect(getByText("Import Audio")).toBeTruthy();
  });
});
