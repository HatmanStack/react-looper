/**
 * FFmpegCommandBuilder Unit Tests
 *
 * Tests for FFmpeg command generation and filter building.
 */

import { FFmpegCommandBuilder } from '../../../src/services/ffmpeg/FFmpegCommandBuilder';
import type { MixTrack } from '../../../src/services/ffmpeg/types';

describe('FFmpegCommandBuilder', () => {
  describe('buildMixCommand', () => {
    it('should build command for single track', () => {
      const tracks: MixTrack[] = [{ uri: 'track1.mp3', speed: 1.0, volume: 75 }];

      const command = FFmpegCommandBuilder.buildMixCommand({
        inputFiles: ['input1.mp3'],
        outputFile: 'output.mp3',
        tracks,
      });

      expect(command).toContain('-i');
      expect(command).toContain('input1.mp3');
      expect(command).toContain('-filter_complex');
      expect(command).toContain('output.mp3');
      expect(command[command.length - 1]).toBe('output.mp3');
    });

    it('should build command for multiple tracks', () => {
      const tracks: MixTrack[] = [
        { uri: 'track1.mp3', speed: 1.0, volume: 75 },
        { uri: 'track2.mp3', speed: 1.5, volume: 50 },
        { uri: 'track3.mp3', speed: 0.5, volume: 100 },
      ];

      const command = FFmpegCommandBuilder.buildMixCommand({
        inputFiles: ['input1.mp3', 'input2.mp3', 'input3.mp3'],
        outputFile: 'output.mp3',
        tracks,
      });

      // Check inputs
      expect(command).toContain('input1.mp3');
      expect(command).toContain('input2.mp3');
      expect(command).toContain('input3.mp3');

      // Check amix filter
      const filterComplexIndex = command.indexOf('-filter_complex');
      expect(filterComplexIndex).toBeGreaterThan(-1);
      const filterComplex = command[filterComplexIndex + 1];
      expect(filterComplex).toContain('amix=inputs=3');
    });

    it('should include encoding parameters', () => {
      const tracks: MixTrack[] = [{ uri: 'track1.mp3', speed: 1.0, volume: 75 }];

      const command = FFmpegCommandBuilder.buildMixCommand({
        inputFiles: ['input1.mp3'],
        outputFile: 'output.mp3',
        tracks,
      });

      expect(command).toContain('-codec:a');
      expect(command).toContain('libmp3lame');
      expect(command).toContain('-b:a');
      expect(command).toContain('128k');
      expect(command).toContain('-ar');
      expect(command).toContain('44100');
      expect(command).toContain('-y');
    });
  });

  describe('buildAtempoFilter', () => {
    it('should return empty array for normal speed (1.0)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(1.0);
      expect(filters).toEqual([]);
    });

    it('should handle speed within atempo range (0.5-2.0)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(1.5);
      expect(filters).toEqual(['atempo=1.50']);
    });

    it('should chain filters for high speed (>2.0)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(4.0);
      // 4.0 = 2.0 * 2.0
      expect(filters).toContain('atempo=2.0');
      expect(filters.length).toBeGreaterThan(1);
    });

    it('should chain filters for low speed (<0.5)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(0.25);
      // 0.25 = 0.5 * 0.5
      expect(filters).toContain('atempo=0.5');
      expect(filters.length).toBeGreaterThan(1);
    });

    it('should handle minimum speed (0.05)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(0.05);
      // Should chain multiple 0.5x filters
      expect(filters.length).toBeGreaterThan(0);
      filters.forEach((filter) => {
        expect(filter).toMatch(/atempo=0\.\d+/);
      });
    });

    it('should handle maximum speed (2.5)', () => {
      const filters = FFmpegCommandBuilder.buildAtempoFilter(2.5);
      // 2.5 requires chaining: 2.0 * 1.25
      expect(filters.length).toBeGreaterThan(0);
    });
  });

  describe('calculateVolumeMultiplier', () => {
    it('should return 0 for volume 0', () => {
      const multiplier = FFmpegCommandBuilder.calculateVolumeMultiplier(0);
      expect(multiplier).toBe(0);
    });

    it('should return 1 for volume 100', () => {
      const multiplier = FFmpegCommandBuilder.calculateVolumeMultiplier(100);
      expect(multiplier).toBe(1.0);
    });

    it('should use logarithmic scaling for intermediate values', () => {
      const multiplier50 = FFmpegCommandBuilder.calculateVolumeMultiplier(50);
      const multiplier75 = FFmpegCommandBuilder.calculateVolumeMultiplier(75);

      // Logarithmic scaling means 75 should be significantly higher than 50
      expect(multiplier75).toBeGreaterThan(multiplier50);
      expect(multiplier50).toBeGreaterThan(0);
      expect(multiplier50).toBeLessThan(1);
      expect(multiplier75).toBeGreaterThan(0);
      expect(multiplier75).toBeLessThan(1);
    });

    it('should clamp values to 0-1 range', () => {
      for (let vol = 0; vol <= 100; vol += 10) {
        const multiplier = FFmpegCommandBuilder.calculateVolumeMultiplier(vol);
        expect(multiplier).toBeGreaterThanOrEqual(0);
        expect(multiplier).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('validation helpers', () => {
    it('should validate speed range', () => {
      expect(FFmpegCommandBuilder.isValidSpeed(0.05)).toBe(true);
      expect(FFmpegCommandBuilder.isValidSpeed(1.0)).toBe(true);
      expect(FFmpegCommandBuilder.isValidSpeed(2.5)).toBe(true);
      expect(FFmpegCommandBuilder.isValidSpeed(0.04)).toBe(false);
      expect(FFmpegCommandBuilder.isValidSpeed(2.51)).toBe(false);
      expect(FFmpegCommandBuilder.isValidSpeed(-1)).toBe(false);
      expect(FFmpegCommandBuilder.isValidSpeed(0)).toBe(false);
    });

    it('should validate volume range', () => {
      expect(FFmpegCommandBuilder.isValidVolume(0)).toBe(true);
      expect(FFmpegCommandBuilder.isValidVolume(50)).toBe(true);
      expect(FFmpegCommandBuilder.isValidVolume(100)).toBe(true);
      expect(FFmpegCommandBuilder.isValidVolume(-1)).toBe(false);
      expect(FFmpegCommandBuilder.isValidVolume(101)).toBe(false);
    });
  });
});
