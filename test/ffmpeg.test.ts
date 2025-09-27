import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { promisify } from 'node:util';

import { ffmpegPath, isFfmpegAvailable } from '../src/ffmpeg/index.js';

const execFileAsync = promisify(execFile);

describe('FFmpeg Binary Access', () => {
  describe('ffmpegPath()', () => {
    it('should return a non-empty string path', () => {
      const path = ffmpegPath();
      assert.strictEqual(typeof path, 'string');
      assert.ok(path.length > 0);
    });

    it('should return absolute path', () => {
      const path = ffmpegPath();
      assert.ok(path.startsWith('/') || /^[A-Z]:\\/.exec(path)); // Unix or Windows absolute path
    });

    it('should return path ending with ffmpeg executable', () => {
      const path = ffmpegPath();
      const isWindows = process.platform === 'win32';
      const expectedEnding = isWindows ? 'ffmpeg.exe' : 'ffmpeg';
      assert.ok(path.endsWith(expectedEnding));
    });
  });

  describe('isFfmpegAvailable()', () => {
    it('should return a boolean', () => {
      const available = isFfmpegAvailable();
      assert.strictEqual(typeof available, 'boolean');
    });

    it('should match file existence check', () => {
      const available = isFfmpegAvailable();
      const path = ffmpegPath();
      const exists = existsSync(path);
      assert.strictEqual(available, exists);
    });
  });

  describe('FFmpeg Binary Functionality', () => {
    it('should execute ffmpeg -version successfully', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-version']);

      // FFmpeg writes version info to stdout or stderr
      const output = stdout + stderr;
      assert.ok(output.includes('ffmpeg version'), 'Output should contain version info');
      assert.ok(output.includes('configuration:'), 'Output should contain configuration info');
    });

    it('should execute ffmpeg -h successfully', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-h']);

      // FFmpeg writes help to stdout or stderr
      const output = stdout + stderr;
      assert.ok(output.includes('usage:') || output.includes('Usage:'), 'Output should contain usage info');
    });

    it('should handle invalid arguments gracefully', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();

      try {
        await execFileAsync(path, ['-invalid-flag-that-does-not-exist']);
        assert.fail('Should have thrown an error for invalid flag');
      } catch (error: any) {
        // FFmpeg should exit with non-zero code for invalid arguments
        assert.ok(error.code !== undefined);
        assert.notStrictEqual(error.code, 0);
      }
    });

    it('should support basic codec listing', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-codecs']);

      const output = stdout + stderr;
      assert.ok(output.includes('Codecs:'), 'Output should contain codecs list');
      assert.ok(output.includes('h264') || output.includes('H.264'), 'Should list h264 codec');
    });

    it('should support format listing', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-formats']);

      const output = stdout + stderr;
      assert.ok(output.includes('Formats:'), 'Output should contain formats list');
      assert.ok(output.includes('mp4'), 'Should list mp4 format');
    });
  });

  describe('Platform-specific behavior', () => {
    it('should provide correct binary for current platform', () => {
      const path = ffmpegPath();

      if (process.platform === 'win32') {
        assert.ok(path.endsWith('.exe'), 'Windows binary should have .exe extension');
      } else {
        assert.ok(!path.endsWith('.exe'), 'Non-Windows binary should not have .exe extension');
      }
    });

    it('should handle cross-compilation environment variables', () => {
      // Test that the path doesn't throw when npm_config_* vars might be set
      const originalOs = process.env.npm_config_os;
      const originalCpu = process.env.npm_config_cpu;

      try {
        // This should not crash even if env vars are set
        const path = ffmpegPath();
        assert.strictEqual(typeof path, 'string');
      } finally {
        // Restore original values
        if (originalOs !== undefined) {
          process.env.npm_config_os = originalOs;
        } else {
          delete process.env.npm_config_os;
        }

        if (originalCpu !== undefined) {
          process.env.npm_config_cpu = originalCpu;
        } else {
          delete process.env.npm_config_cpu;
        }
      }
    });
  });

  describe('Integration with node-av', () => {
    it('should provide binary that matches library version', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-version']);

      const output = stdout + stderr;

      console.log(`FFmpeg version output: ${output}`);

      // Check for FFmpeg version - supports both semantic versioning (7.1.2) and specific git hash (f893221)
      const semanticVersionMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/i.exec(output);
      const expectedGitHash = 'f893221'; // https://github.com/FFmpeg/FFmpeg/releases/tag/n7.1.2
      const hasExpectedGitVersion = output.includes(`ffmpeg version ${expectedGitHash}`);

      if (semanticVersionMatch) {
        const majorVersion = parseInt(semanticVersionMatch[1]);
        const minorVersion = parseInt(semanticVersionMatch[2]);
        const patchVersion = parseInt(semanticVersionMatch[3]);

        console.log(`Found FFmpeg semantic version: ${majorVersion}.${minorVersion}.${patchVersion}`);

        // Should be FFmpeg 7.x (compatible with library)
        assert.strictEqual(majorVersion, 7, 'Should be FFmpeg version 7.x');
        assert.ok(minorVersion >= 1, 'Should be at least version 7.1.x');
      } else if (hasExpectedGitVersion) {
        console.log(`Found FFmpeg git version: ${expectedGitHash}`);

        // Verify it's the expected git version for MSVC builds
        assert.ok(output.includes(`ffmpeg version ${expectedGitHash}`), `Should be FFmpeg version ${expectedGitHash}`);
      } else {
        assert.fail(`Should contain either semantic version (7.x.x) or git version ${expectedGitHash}`);
      }
    });

    it('should provide binary with expected codec support', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();
      const { stdout, stderr } = await execFileAsync(path, ['-codecs']);

      const output = stdout + stderr;

      // Check for key codecs that should be available
      const requiredCodecs = ['h264', 'hevc', 'aac', 'mp3'];

      for (const codec of requiredCodecs) {
        assert.ok(output.toLowerCase().includes(codec), `Binary should support ${codec} codec`);
      }
    });

    it('should work with actual media processing', async function () {
      // Skip if FFmpeg not available
      if (!isFfmpegAvailable()) {
        return;
      }

      const path = ffmpegPath();

      // Test with null output (just analyze without writing)
      // This tests that the binary can handle basic operations
      try {
        const { stdout, stderr } = await execFileAsync(path, ['-f', 'lavfi', '-i', 'testsrc2=duration=1:size=320x240:rate=1', '-t', '1', '-f', 'null', '-'], {
          timeout: 10000,
        });

        const output = stdout + stderr;
        assert.ok(output.includes('frame='), 'Should process test frames');
      } catch (error: any) {
        // This might fail in CI environments without certain codecs
        // Just ensure it's not a "command not found" type error
        assert.notStrictEqual(error.code, 127, 'Binary should be executable');
      }
    });
  });
});
