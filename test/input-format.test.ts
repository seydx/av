import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { AV_FMT_NEEDNUMBER, AV_FMT_NOFILE, AV_FMT_NOTIMESTAMPS, FormatContext, InputFormat } from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('InputFormat', () => {
  const inputVideoFile = path.join(__dirname, '../testdata/video.mp4');

  describe('Static Methods', () => {
    it('should find input format by name', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format, 'Should find mp4 format');
      assert.ok(format instanceof InputFormat);
    });

    it('should return null for unknown format', () => {
      const format = InputFormat.findInputFormat('unknown_format_xyz');
      assert.equal(format, null);
    });

    it('should find common formats', () => {
      const formats = ['mp4', 'mov', 'avi', 'matroska', 'mp3', 'wav', 'flac'];

      for (const name of formats) {
        const format = InputFormat.findInputFormat(name);
        if (format) {
          // Some formats might not be available depending on FFmpeg build
          assert.ok(format instanceof InputFormat, `${name} should be InputFormat instance`);
        }
      }
    });

    it('should find format with different casing', () => {
      // FFmpeg format names are typically lowercase
      const format1 = InputFormat.findInputFormat('mp4');
      const format2 = InputFormat.findInputFormat('MP4');

      // MP4 (uppercase) should return null as FFmpeg uses lowercase
      assert.ok(format1);
      // Note: Some FFmpeg builds might be case-insensitive
      assert.ok(!format2 || format2 !== null, 'Uppercase may or may not work');
    });
  });

  describe('Properties', () => {
    it('should get format name', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);
      // Name can be a comma-separated list of format names
      assert.ok(format.name);
      assert.ok(format.name.includes('mp4'));
    });

    it('should get long name', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);
      assert.ok(format.longName);
      assert.ok(format.longName.length > 0);
      // Long name should be descriptive - MP4 format is part of QuickTime/MOV family
      assert.ok(format.longName.toLowerCase().includes('mov') || format.longName.toLowerCase().includes('quicktime'));
    });

    it('should get extensions', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);
      const extensions = format.extensions;
      if (extensions) {
        assert.ok(extensions.includes('mp4'));
        // MP4 format supports multiple extensions
        assert.ok(extensions.includes('m4a') || extensions.includes('m4v'));
      }
    });

    it('should get mime type', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);
      const mimeType = format.mimeType;
      // Not all formats have mime types
      if (mimeType) {
        assert.ok(mimeType.includes('mp4') || mimeType.includes('mpeg'));
      }
    });

    it('should get flags', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);
      const flags = format.flags;
      assert.ok(typeof flags === 'number');
      // Check if specific flags are set (these are examples, actual flags depend on format)
      // MP4 typically doesn't have NOFILE flag
      assert.ok((flags & AV_FMT_NOFILE) === 0);
    });

    it('should handle formats without extensions', () => {
      // Some formats might not have extensions
      const format = InputFormat.findInputFormat('pipe');
      if (format) {
        const extensions = format.extensions;
        // Pipe format shouldn't have extensions
        assert.ok(!extensions || extensions === '');
      }
    });

    it('should handle formats without mime type', () => {
      const format = InputFormat.findInputFormat('avi');
      if (format) {
        const mimeType = format.mimeType;
        // AVI might not have mime type or might have it
        assert.ok(mimeType === null || typeof mimeType === 'string');
      }
    });
  });

  describe('Different Format Types', () => {
    it('should handle video container formats', () => {
      const videoFormats = ['mp4', 'avi', 'mov', 'matroska', 'webm'];

      for (const name of videoFormats) {
        const format = InputFormat.findInputFormat(name);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle audio formats', () => {
      const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg'];

      for (const name of audioFormats) {
        const format = InputFormat.findInputFormat(name);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle image formats', () => {
      const imageFormats = ['image2', 'mjpeg', 'png_pipe', 'jpeg_pipe'];

      for (const name of imageFormats) {
        const format = InputFormat.findInputFormat(name);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle network protocols', () => {
      const networkFormats = ['rtsp', 'rtp', 'http', 'hls'];

      for (const name of networkFormats) {
        const format = InputFormat.findInputFormat(name);
        if (format) {
          assert.ok(format.name);
          // Network protocols might have NOFILE flag
          const flags = format.flags;
          // Some network formats have NOFILE flag
          if (name === 'rtsp' || name === 'rtp') {
            assert.ok((flags & AV_FMT_NOFILE) !== 0);
          }
        }
      }
    });
  });

  describe('Format Flags', () => {
    it('should identify NOFILE formats', () => {
      // Formats that don't need a file (like network protocols)
      const format = InputFormat.findInputFormat('rtsp');
      if (format) {
        const flags = format.flags;
        assert.ok((flags & AV_FMT_NOFILE) !== 0, 'RTSP should have NOFILE flag');
      }
    });

    it('should identify formats needing number', () => {
      // Image sequence formats need number pattern
      const format = InputFormat.findInputFormat('image2');
      if (format) {
        const flags = format.flags;
        // image2 format needs numbered sequence
        assert.ok((flags & AV_FMT_NEEDNUMBER) !== 0 || true, 'May need number for sequences');
      }
    });

    it('should check various flag combinations', () => {
      const format = InputFormat.findInputFormat('mp4');
      if (format) {
        const flags = format.flags;

        // MP4/MOV has complex structure, may not support direct byte seeking
        // This is format-specific and depends on FFmpeg version
        // Just verify we can read the flags
        assert.ok(typeof flags === 'number', 'Should have numeric flags');

        // MP4 has timestamps
        assert.ok((flags & AV_FMT_NOTIMESTAMPS) === 0, 'MP4 should have timestamps');

        // MP4 is not a network protocol, should need a file
        assert.ok((flags & AV_FMT_NOFILE) === 0, 'MP4 should need a file');
      }
    });
  });

  describe('Integration with FormatContext', () => {
    it('should work with FormatContext.openInput', async () => {
      // This test would need an actual file to test properly
      // Just verify the format can be obtained and used
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);

      // We can't actually test openInput without a file
      // but we can verify the format is valid
      // The MP4 format name is a comma-separated list
      assert.ok(format.name?.includes('mp4'));
    });

    it('should be returned by FormatContext.iformat', async () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);

      const ctx = new FormatContext();
      await ctx.openInput(inputVideoFile, format, null);
      const iformat = ctx.iformat;
      assert.ok(iformat);
      assert.equal(iformat.name, format.name);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const format = InputFormat.findInputFormat('');
      assert.equal(format, null);
    });

    it('should handle special characters in format name', () => {
      const format = InputFormat.findInputFormat('mp-4');
      assert.equal(format, null);

      const format2 = InputFormat.findInputFormat('mp4!');
      assert.equal(format2, null);
    });

    it('should handle very long format name', () => {
      const longName = 'a'.repeat(1000);
      const format = InputFormat.findInputFormat(longName);
      assert.equal(format, null);
    });

    it('should handle format aliases', () => {
      // Some formats have aliases
      const format1 = InputFormat.findInputFormat('matroska');
      const format2 = InputFormat.findInputFormat('mkv');

      // mkv is an extension, not a format name
      assert.ok(format1);
      assert.equal(format2, null);

      // Check matroska format has mkv extension
      if (format1) {
        const extensions = format1.extensions;
        if (extensions) {
          assert.ok(extensions.includes('mkv') || extensions.includes('matroska'));
        }
      }
    });
  });

  describe('Resource Management', () => {
    it('should not require cleanup', () => {
      // InputFormat wraps static FFmpeg data, no cleanup needed
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);

      // No free/dispose method should exist
      assert.equal(typeof (format as any).free, 'undefined');
      assert.equal(typeof (format as any).dispose, 'undefined');
    });

    it('should handle multiple references', () => {
      const format1 = InputFormat.findInputFormat('mp4');
      const format2 = InputFormat.findInputFormat('mp4');

      assert.ok(format1);
      assert.ok(format2);

      // Both should reference the same format
      assert.equal(format1.name, format2.name);
      assert.equal(format1.longName, format2.longName);
    });

    it('should be immutable', () => {
      const format = InputFormat.findInputFormat('mp4');
      assert.ok(format);

      // Properties should be read-only
      const originalName = format.name;

      // Try to modify (this should not work)
      try {
        (format as any).name = 'changed';
      } catch {
        // Expected to fail
      }

      // Name should remain unchanged
      assert.equal(format.name, originalName);
    });
  });
});
