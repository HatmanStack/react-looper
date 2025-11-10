// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript path aliases
config.resolver.extraNodeModules = {
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@theme': path.resolve(__dirname, 'src/theme'),
};

module.exports = config;
