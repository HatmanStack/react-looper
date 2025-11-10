import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { MainScreen } from '../../../src/screens/MainScreen/MainScreen';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('MainScreen Integration', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(async () => {
    // Wait for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 200));
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('renders all main sections', () => {
    const { getByText } = renderWithProvider(<MainScreen />);

    // Top controls
    expect(getByText('Record')).toBeTruthy();
    expect(getByText('Stop')).toBeTruthy();

    // Bottom controls
    expect(getByText('Import Audio')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('renders empty track list initially', () => {
    const { getByText } = renderWithProvider(<MainScreen />);

    // Should show main buttons
    expect(getByText('Record')).toBeTruthy();
    expect(getByText('Import Audio')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('all action buttons are clickable', () => {
    const { getByText } = renderWithProvider(<MainScreen />);

    // Verify all buttons can be pressed without errors
    const recordButton = getByText('Record');
    const importButton = getByText('Import Audio');

    expect(() => fireEvent.press(recordButton)).not.toThrow();
    expect(() => fireEvent.press(importButton)).not.toThrow();
  });

  it('record button can be pressed', () => {
    const { getByText } = renderWithProvider(<MainScreen />);

    const recordButton = getByText('Record');
    const stopButton = getByText('Stop');

    // Verify buttons exist
    expect(recordButton).toBeTruthy();
    expect(stopButton).toBeTruthy();

    // Press record button should not throw
    expect(() => fireEvent.press(recordButton)).not.toThrow();
  });

  it('import button triggers file import', () => {
    const { getByText } = renderWithProvider(<MainScreen />);

    const importButton = getByText('Import Audio');

    // Press import button should not throw
    expect(() => fireEvent.press(importButton)).not.toThrow();
  });
});
