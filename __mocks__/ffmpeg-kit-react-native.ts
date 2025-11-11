/**
 * Mock for ffmpeg-kit-react-native
 */

export const ReturnCode = {
  isSuccess: jest.fn().mockReturnValue(true),
};

export const FFmpegKit = {
  execute: jest.fn().mockResolvedValue({
    getSessionId: jest.fn().mockReturnValue(1),
    getReturnCode: jest.fn().mockResolvedValue({ getValue: () => 0 }),
    getOutput: jest.fn().mockResolvedValue(""),
    getFailStackTrace: jest.fn().mockResolvedValue(""),
  }),
  cancel: jest.fn().mockResolvedValue(undefined),
};

export const FFmpegKitConfig = {
  enableStatisticsCallback: jest.fn(),
};

export class Statistics {
  getTime() {
    return 0;
  }
}
