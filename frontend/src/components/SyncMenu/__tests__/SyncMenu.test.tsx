/**
 * Tests for SyncMenu component
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SyncMenu } from "../SyncMenu";

// Override the react-native-paper mock for Menu to support testing
jest.mock("react-native-paper", () => {
  const React = require("react");
  const RN = require("react-native");

  const MenuItem = (props: {
    onPress?: () => void;
    title?: string;
    testID?: string;
    leadingIcon?: string;
    titleStyle?: object;
  }) =>
    React.createElement(
      RN.TouchableOpacity,
      { testID: props.testID || "menu-item", onPress: props.onPress },
      React.createElement(RN.Text, null, props.title),
    );

  const MenuComponent = (props: {
    visible?: boolean;
    children?: React.ReactNode;
    anchor?: React.ReactNode;
    onDismiss?: () => void;
  }) =>
    React.createElement(
      RN.View,
      { testID: "menu" },
      props.anchor,
      props.visible
        ? React.createElement(
            RN.View,
            { testID: "menu-content" },
            props.children,
          )
        : null,
    );

  MenuComponent.Item = MenuItem;

  return {
    Menu: MenuComponent,
    IconButton: (props: {
      testID?: string;
      onPress?: () => void;
      icon?: string;
      iconColor?: string;
      size?: number;
      accessibilityLabel?: string;
      accessibilityHint?: string;
    }) =>
      React.createElement(
        RN.TouchableOpacity,
        {
          testID: props.testID || "icon-button",
          onPress: props.onPress,
          accessibilityLabel: props.accessibilityLabel || props.icon,
        },
        React.createElement(RN.Text, null, props.icon),
      ),
  };
});

describe("SyncMenu", () => {
  const defaultProps = {
    trackDuration: 10000,
    masterLoopDuration: 10000,
    syncMultiplier: null as number | null | undefined,
    onSyncSelect: jest.fn(),
    onSyncClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sync button", () => {
    const { getByTestId } = render(<SyncMenu {...defaultProps} />);
    expect(getByTestId("sync-button")).toBeTruthy();
  });

  it("shows 'link-off' icon when not synced", () => {
    const { getByText } = render(
      <SyncMenu {...defaultProps} syncMultiplier={null} />,
    );
    expect(getByText("link-off")).toBeTruthy();
  });

  it("shows 'link' icon when synced", () => {
    const { getByText } = render(
      <SyncMenu {...defaultProps} syncMultiplier={1} />,
    );
    expect(getByText("link")).toBeTruthy();
  });

  it("opens menu with multiplier options on press", () => {
    const { getByTestId, queryByTestId } = render(
      <SyncMenu {...defaultProps} />,
    );

    // Menu content should not be visible initially
    expect(queryByTestId("menu-content")).toBeNull();

    // Press the sync button
    fireEvent.press(getByTestId("sync-button"));

    // Menu content should now be visible
    expect(getByTestId("menu-content")).toBeTruthy();
  });

  it("shows only valid multipliers", () => {
    // Track 20s, master 10s: base ratio = 2.0
    // 1/4x => 0.5, 1/3x => 0.67, 1/2x => 1.0, 1x => 2.0 are valid
    // 2x => 4.0, 3x => 6.0, 4x => 8.0 are out of range
    const { getByTestId, queryByText } = render(
      <SyncMenu
        {...defaultProps}
        trackDuration={20000}
        masterLoopDuration={10000}
        syncMultiplier={null}
      />,
    );

    fireEvent.press(getByTestId("sync-button"));

    expect(queryByText("1/4x")).toBeTruthy();
    expect(queryByText("1/3x")).toBeTruthy();
    expect(queryByText("1/2x")).toBeTruthy();
    expect(queryByText("1x")).toBeTruthy();
    expect(queryByText("2x")).toBeNull();
    expect(queryByText("3x")).toBeNull();
    expect(queryByText("4x")).toBeNull();
  });

  it("calls onSyncSelect with multiplier value when a menu item is selected", () => {
    const onSyncSelect = jest.fn();
    const { getByTestId, getByText } = render(
      <SyncMenu {...defaultProps} onSyncSelect={onSyncSelect} />,
    );

    fireEvent.press(getByTestId("sync-button"));
    fireEvent.press(getByText("1x"));

    expect(onSyncSelect).toHaveBeenCalledWith(1);
  });

  it("calls onSyncClear when 'Unsync' is selected", () => {
    const onSyncClear = jest.fn();
    const { getByTestId, getByText } = render(
      <SyncMenu
        {...defaultProps}
        syncMultiplier={1}
        onSyncClear={onSyncClear}
      />,
    );

    fireEvent.press(getByTestId("sync-button"));
    fireEvent.press(getByText("Unsync"));

    expect(onSyncClear).toHaveBeenCalled();
  });

  it("does not show 'Unsync' option when not synced", () => {
    const { getByTestId, queryByText } = render(
      <SyncMenu {...defaultProps} syncMultiplier={null} />,
    );

    fireEvent.press(getByTestId("sync-button"));

    expect(queryByText("Unsync")).toBeNull();
  });

  it("closes menu after selecting a multiplier", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <SyncMenu {...defaultProps} />,
    );

    fireEvent.press(getByTestId("sync-button"));
    expect(queryByTestId("menu-content")).toBeTruthy();

    fireEvent.press(getByText("1x"));
    expect(queryByTestId("menu-content")).toBeNull();
  });
});
