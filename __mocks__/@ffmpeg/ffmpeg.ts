/**
 * Mock for @ffmpeg/ffmpeg
 */

export const createFFmpeg = jest.fn(() => ({
  load: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
  FS: jest.fn(),
  setProgress: jest.fn(),
  exit: jest.fn(),
}));

export const fetchFile = jest.fn().mockResolvedValue(new Uint8Array());
