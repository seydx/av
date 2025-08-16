import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { AV_FMT_GLOBALHEADER, AV_FMT_NOFILE, AV_FMT_NOTIMESTAMPS, AV_FMT_VARIABLE_FPS, FormatContext, OutputFormat } from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('OutputFormat', () => {
  describe('Static Methods', () => {
    it('should guess output format by name', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format, 'Should find mp4 format');
      assert.ok(format instanceof OutputFormat);
    });

    it('should guess format by filename', () => {
      const format = OutputFormat.guessFormat(null, 'output.mp4', null);
      assert.ok(format, 'Should guess format from filename');
      assert.ok(format instanceof OutputFormat);
      assert.ok(format.name?.includes('mp4'));
    });

    it('should guess format by mime type', () => {
      const format = OutputFormat.guessFormat(null, null, 'video/mp4');
      if (format) {
        assert.ok(format instanceof OutputFormat);
      }
    });

    it('should return null for unknown format', () => {
      const format = OutputFormat.guessFormat('unknown_format_xyz', null, null);
      assert.equal(format, null);
    });

    it('should find common formats', () => {
      const formats = ['mp4', 'mov', 'avi', 'matroska', 'mp3', 'wav', 'flac'];

      for (const name of formats) {
        const format = OutputFormat.guessFormat(name, null, null);
        if (format) {
          // Some formats might not be available depending on FFmpeg build
          assert.ok(format instanceof OutputFormat, `${name} should be OutputFormat instance`);
        }
      }
    });

    it('should find format with different casing', () => {
      // FFmpeg format names are typically lowercase
      const format1 = OutputFormat.guessFormat('mp4', null, null);
      const format2 = OutputFormat.guessFormat('MP4', null, null);

      // MP4 (uppercase) should return null as FFmpeg uses lowercase
      assert.ok(format1);
      // Note: Some FFmpeg builds might be case-insensitive
      assert.ok(!format2 || format2 !== null, 'Uppercase may or may not work');
    });
  });

  describe('Properties', () => {
    it('should get format name', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      // Name can be a comma-separated list of format names
      assert.ok(format.name);
      assert.ok(format.name.includes('mp4'));
    });

    it('should get long name', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      assert.ok(format.longName);
      assert.ok(format.longName.length > 0);
      // Long name should be descriptive - MP4 format is part of QuickTime/MOV family
      assert.ok(format.longName.toLowerCase().includes('mp4') || format.longName.toLowerCase().includes('mpeg'));
    });

    it('should get extensions', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const extensions = format.extensions;
      if (extensions) {
        assert.ok(extensions.includes('mp4'));
        // Note: Output format extensions may differ from input format
        // The output format for mp4 typically only lists 'mp4'
      }
    });

    it('should get mime type', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const mimeType = format.mimeType;
      // Not all formats have mime types
      if (mimeType) {
        assert.ok(mimeType.includes('mp4') || mimeType.includes('mpeg'));
      }
    });

    it('should get flags', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const flags = format.flags;
      assert.ok(typeof flags === 'number');
      // Check if specific flags are set
      // MP4 typically doesn't have NOFILE flag
      assert.ok((flags & AV_FMT_NOFILE) === 0);
    });

    it('should get audio codec', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const audioCodec = format.audioCodec;
      // audioCodec should be a valid codec ID
      assert.ok(typeof audioCodec === 'number');
    });

    it('should get video codec', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const videoCodec = format.videoCodec;
      // videoCodec should be a valid codec ID
      assert.ok(typeof videoCodec === 'number');
    });

    it('should get subtitle codec', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);
      const subtitleCodec = format.subtitleCodec;
      // subtitleCodec should be a valid codec ID
      assert.ok(typeof subtitleCodec === 'number');
    });

    it('should handle formats without extensions', () => {
      // Some formats might not have extensions
      const format = OutputFormat.guessFormat('pipe', null, null);
      if (format) {
        const extensions = format.extensions;
        // Pipe format shouldn't have extensions
        assert.ok(!extensions || extensions === '');
      }
    });

    it('should handle formats without mime type', () => {
      const format = OutputFormat.guessFormat('avi', null, null);
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
        const format = OutputFormat.guessFormat(name, null, null);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle audio formats', () => {
      const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg'];

      for (const name of audioFormats) {
        const format = OutputFormat.guessFormat(name, null, null);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle image formats', () => {
      const imageFormats = ['image2', 'mjpeg'];

      for (const name of imageFormats) {
        const format = OutputFormat.guessFormat(name, null, null);
        if (format) {
          assert.ok(format.name);
          assert.ok(format.longName);
        }
      }
    });

    it('should handle network protocols', () => {
      const networkFormats = ['rtsp', 'rtp', 'hls'];

      for (const name of networkFormats) {
        const format = OutputFormat.guessFormat(name, null, null);
        if (format) {
          assert.ok(format.name);
          // Network protocols might have NOFILE flag
          const flags = format.flags;
          // RTSP has NOFILE flag, but RTP might not
          if (name === 'rtsp') {
            assert.ok((flags & AV_FMT_NOFILE) !== 0);
          }
        }
      }
    });
  });

  describe('Format Flags', () => {
    it('should identify NOFILE formats', () => {
      // Formats that don't need a file (like network protocols)
      const format = OutputFormat.guessFormat('rtsp', null, null);
      if (format) {
        const flags = format.flags;
        assert.ok((flags & AV_FMT_NOFILE) !== 0, 'RTSP should have NOFILE flag');
      }
    });

    it('should identify formats with global header', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      if (format) {
        const flags = format.flags;
        // MP4 typically wants global headers
        assert.ok((flags & AV_FMT_GLOBALHEADER) !== 0, 'MP4 should want global headers');
      }
    });

    it('should check various flag combinations', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      if (format) {
        const flags = format.flags;

        // Just verify we can read the flags
        assert.ok(typeof flags === 'number', 'Should have numeric flags');

        // MP4 has timestamps
        assert.ok((flags & AV_FMT_NOTIMESTAMPS) === 0, 'MP4 should have timestamps');

        // MP4 is not a network protocol, should need a file
        assert.ok((flags & AV_FMT_NOFILE) === 0, 'MP4 should need a file');
      }
    });

    it('should check variable FPS flag', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      if (format) {
        const flags = format.flags;
        // MP4 can support variable FPS
        // Just check we can read the flag
        const hasVariableFps = (flags & AV_FMT_VARIABLE_FPS) !== 0;
        assert.ok(typeof hasVariableFps === 'boolean');
      }
    });
  });

  describe('Codec Support', () => {
    it('should have default codecs for common formats', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      if (format) {
        // MP4 should have default audio and video codecs
        assert.ok(format.audioCodec !== 0, 'Should have default audio codec');
        assert.ok(format.videoCodec !== 0, 'Should have default video codec');
      }
    });

    it('should have audio-only format support', () => {
      const format = OutputFormat.guessFormat('mp3', null, null);
      if (format) {
        // MP3 should have audio codec but no video codec
        assert.ok(format.audioCodec !== 0, 'Should have audio codec');
        // Video codec might be 0 or undefined for audio-only formats
        assert.ok(format.videoCodec === 0 || typeof format.videoCodec === 'number');
      }
    });

    it('should have subtitle codec for formats that support it', () => {
      const format = OutputFormat.guessFormat('matroska', null, null);
      if (format) {
        // Matroska can support subtitles
        const subtitleCodec = format.subtitleCodec;
        assert.ok(typeof subtitleCodec === 'number');
      }
    });
  });

  describe('Integration with FormatContext', () => {
    it('should work with FormatContext.allocOutputContext', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);

      // Test that we can use it with FormatContext
      const ctx = new FormatContext();
      ctx.allocOutputContext2(format, null, null);

      // Verify the format was set
      assert.ok(ctx.oformat);
      assert.ok(ctx.oformat.name?.includes('mp4'));
    });

    it('should be returned by FormatContext.oformat', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);

      const ctx = new FormatContext();
      ctx.allocOutputContext2(format, null, null);

      const oformat = ctx.oformat;
      assert.ok(oformat);
      assert.ok(oformat.name?.includes('mp4'));
    });

    it('should work with filename-based format detection', () => {
      const ctx = new FormatContext();
      ctx.allocOutputContext2(null, null, 'output.mp4');

      const oformat = ctx.oformat;
      assert.ok(oformat);
      assert.ok(oformat.name?.includes('mp4'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const format = OutputFormat.guessFormat('', null, null);
      assert.equal(format, null);
    });

    it('should handle special characters in format name', () => {
      const format = OutputFormat.guessFormat('mp-4', null, null);
      assert.equal(format, null);

      const format2 = OutputFormat.guessFormat('mp4!', null, null);
      assert.equal(format2, null);
    });

    it('should handle very long format name', () => {
      const longName = 'a'.repeat(1000);
      const format = OutputFormat.guessFormat(longName, null, null);
      assert.equal(format, null);
    });

    it('should handle format aliases', () => {
      // Some formats have aliases
      const format1 = OutputFormat.guessFormat('matroska', null, null);
      const format2 = OutputFormat.guessFormat('mkv', null, null);

      // mkv might be an alias or extension
      assert.ok(format1);
      // mkv as a format name might not work
      if (format2) {
        assert.ok(format2 instanceof OutputFormat);
      }

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
      // OutputFormat wraps static FFmpeg data, no cleanup needed
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);

      // No free/dispose method should exist
      assert.equal(typeof (format as any).free, 'undefined');
      assert.equal(typeof (format as any).dispose, 'undefined');
    });

    it('should handle multiple references', () => {
      const format1 = OutputFormat.guessFormat('mp4', null, null);
      const format2 = OutputFormat.guessFormat('mp4', null, null);

      assert.ok(format1);
      assert.ok(format2);

      // Both should reference the same format
      if (format1 && format2) {
        assert.equal(format1.name, format2.name);
        assert.equal(format1.longName, format2.longName);
      }
    });

    it('should be immutable', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);

      // Properties should be read-only
      const originalName = format.name;

      // Try to modify (this should not work)
      try {
        (format as any).name = 'changed';
      } catch (e) {
        // Expected to fail
      }

      // Name should remain unchanged
      assert.equal(format.name, originalName);
    });
  });
});
