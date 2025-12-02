// jest.mocks.js - Module mocks that run before environment setup
/* eslint-disable no-undef */

// Mock react-native-safe-area-context for react-native-paper compatibility
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) => children(insets),
    SafeAreaView: ({ children }) => React.createElement('View', null, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
    initialWindowMetrics: {
      insets,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

// Mock react-native-paper to avoid Dimensions.get issue at module load time
jest.mock('react-native-paper', () => {
  const React = require('react');
  const RN = require('react-native');

  const MockProvider = ({ children }) => React.createElement(React.Fragment, null, children);
  const MockPortal = ({ children }) => React.createElement(React.Fragment, null, children);

  return {
    Provider: MockProvider,
    PaperProvider: MockProvider,
    Portal: MockPortal,
    Button: RN.TouchableOpacity,
    Card: RN.View,
    Checkbox: RN.View,
    Chip: RN.View,
    Dialog: Object.assign(RN.View, {
      Title: RN.Text,
      Content: RN.View,
      Actions: RN.View,
    }),
    Divider: RN.View,
    FAB: RN.TouchableOpacity,
    IconButton: (props) =>
      React.createElement(
        RN.TouchableOpacity,
        { testID: props.testID || 'icon-button', onPress: props.onPress },
        React.createElement(RN.View, { pointerEvents: 'none' })
      ),
    List: {
      Item: RN.View,
      Section: RN.View,
    },
    Menu: Object.assign(RN.View, {
      Item: RN.View,
    }),
    Modal: RN.View,
    ProgressBar: RN.View,
    RadioButton: RN.View,
    Searchbar: RN.TextInput,
    Slider: RN.View,
    Snackbar: RN.View,
    Surface: RN.View,
    Switch: RN.View,
    Text: RN.Text,
    TextInput: RN.TextInput,
    Title: RN.Text,
    useTheme: () => ({
      colors: {
        primary: '#3F51B5',
        secondary: '#03DAC6',
        background: '#121212',
        surface: '#1E1E1E',
        error: '#CF6679',
        text: '#FFFFFF',
        onSurface: '#FFFFFF',
        disabled: '#666666',
        placeholder: '#888888',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        notification: '#FF80AB',
      },
    }),
    configureFonts: jest.fn(() => ({})),
    MD3DarkTheme: {},
    adaptNavigationTheme: () => ({ DarkTheme: {} }),
  };
});

// Mock @react-native-community/slider
jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const RN = require('react-native');
  return (props) =>
    React.createElement(RN.View, {
      testID: props.testID || 'slider',
      onValueChange: props.onValueChange,
    });
});

// Mock PixelRatio module
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  __esModule: true,
  default: {
    get: () => 2,
    getFontScale: () => 1,
    getPixelSizeForLayoutSize: (size) => size * 2,
    roundToNearestPixel: (size) => Math.round(size),
  },
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => size * 2,
  roundToNearestPixel: (size) => Math.round(size),
}));

// Mock react-native's Dimensions early
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
}));
