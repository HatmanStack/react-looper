// Setup file for Jest tests
// Built-in matchers are included in @testing-library/react-native v12.4+

// Mock Expo modules
jest.mock('expo', () => ({
  __ExpoImportMetaRegistry: {},
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    requestPermissionsAsync: jest.fn(() =>
      Promise.resolve({
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      })
    ),
    getPermissionsAsync: jest.fn(() =>
      Promise.resolve({
        status: 'granted',
        canAskAgain: true,
        granted: true,
        expires: 'never',
      })
    ),
    Recording: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() =>
        Promise.resolve({ uri: 'file:///mock/recording.m4a', durationMillis: 5000 })
      ),
      getStatusAsync: jest.fn(() =>
        Promise.resolve({
          isRecording: false,
          isDoneRecording: true,
          durationMillis: 5000,
        })
      ),
    })),
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            getStatusAsync: jest.fn(() =>
              Promise.resolve({
                isLoaded: true,
                durationMillis: 120000,
                positionMillis: 0,
                isPlaying: false,
                didJustFinish: false,
                isLooping: true,
              })
            ),
            unloadAsync: jest.fn(() => Promise.resolve()),
            playAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            stopAsync: jest.fn(() => Promise.resolve()),
            setPositionAsync: jest.fn(() => Promise.resolve()),
            setRateAsync: jest.fn(() => Promise.resolve()),
            setVolumeAsync: jest.fn(() => Promise.resolve()),
            setIsLoopingAsync: jest.fn(() => Promise.resolve()),
            setOnPlaybackStatusUpdate: jest.fn(),
          },
        })
      ),
    },
    AndroidOutputFormat: {
      MPEG_4: 2,
    },
    AndroidAudioEncoder: {
      AAC: 3,
    },
    IOSOutputFormat: {
      MPEG4AAC: 'kAudioFileM4AType',
    },
    IOSAudioQuality: {
      MIN: 0,
      LOW: 32,
      MEDIUM: 64,
      HIGH: 96,
      MAX: 127,
    },
  },
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({
      type: 'success',
      canceled: false,
      assets: [
        {
          uri: 'file:///mock/imported-audio.mp3',
          name: 'imported-audio.mp3',
          size: 1024000,
          mimeType: 'audio/mpeg',
        },
      ],
    })
  ),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  Paths: {
    document: {
      uri: 'file:///mock/document/',
      exists: true,
      create: jest.fn(),
    },
    cache: {
      uri: 'file:///mock/cache/',
      exists: true,
      create: jest.fn(),
    },
    totalDiskSpace: 10000000000,
    availableDiskSpace: 5000000000,
  },
  Directory: jest.fn(function (base, name) {
    this.uri = `${base.uri}${name}/`;
    this.exists = true;
    this.create = jest.fn();
    this.list = jest.fn(() => []);
  }),
  File: jest.fn(function (...paths) {
    const pathStr = paths
      .map((p) => (typeof p === 'string' ? p : p.uri || ''))
      .join('/')
      .replace(/\/+/g, '/');
    this.uri = pathStr.startsWith('file://') ? pathStr : `file:///${pathStr}`;
    this.exists = true;
    this.info = jest.fn(() => ({ size: 1024, exists: true }));
    this.create = jest.fn(() => Promise.resolve());
    this.copy = jest.fn();
    this.move = jest.fn();
    this.delete = jest.fn();
    this.text = jest.fn(() => Promise.resolve('{}'));
    this.write = jest.fn(() => Promise.resolve());
  }),
}));

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      canAskAgain: true,
      granted: true,
      expires: 'never',
    })
  ),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      canAskAgain: true,
      granted: true,
      expires: 'never',
    })
  ),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  openSettings: jest.fn(() => Promise.resolve()),
}));
