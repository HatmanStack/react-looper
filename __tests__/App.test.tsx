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
    const { getByLabelText } = render(<App />);
    expect(getByLabelText("Record first loop track")).toBeTruthy();
  });

  it("renders top control buttons", () => {
    const { getByLabelText } = render(<App />);
    expect(getByLabelText("Record first loop track")).toBeTruthy();
    expect(getByLabelText("Stop")).toBeTruthy();
  });

  it("renders bottom control buttons", () => {
    const { getByLabelText } = render(<App />);
    expect(getByLabelText("Import")).toBeTruthy();
    expect(getByLabelText("Save")).toBeTruthy();
  });

  it("renders MainScreen component", () => {
    const { getByLabelText } = render(<App />);
    // Verify core UI elements are present
    expect(getByLabelText("Record first loop track")).toBeTruthy();
    expect(getByLabelText("Import")).toBeTruthy();
  });
});
