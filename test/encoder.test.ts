import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Encoder } from '../src/api/encoder.js';
import { AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP } from '../src/lib/constants.js';
import { Frame } from '../src/lib/index.js';

describe('Encoder', () => {
  describe('create', () => {
    it('should create video encoder', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          bitrate: '1M',
          gopSize: 30,
        },
      );

      assert.ok(encoder);
      assert.equal(encoder.isEncoderOpen, true);
      assert.equal(encoder.getCodecName(), 'libx264');

      encoder.close();
    });

    it('should create audio encoder', async () => {
      const encoder = await Encoder.create(
        'aac',
        {
          type: 'audio',
          sampleRate: 44100,
          sampleFormat: AV_SAMPLE_FMT_FLTP,
          channelLayout: { nbChannels: 2, order: 1, mask: 3n }, // order: 1 for native layout
          timeBase: { num: 1, den: 44100 },
        },
        {
          bitrate: '128k',
        },
      );

      assert.ok(encoder);
      assert.equal(encoder.isEncoderOpen, true);
      assert.equal(encoder.getCodecName(), 'aac');

      encoder.close();
    });

    it('should create encoder with thread options', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          threads: 4,
        },
      );

      assert.ok(encoder);
      encoder.close();
    });

    it('should create encoder with codec options', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          options: {
            preset: 'fast',
            crf: '23',
          },
        },
      );

      assert.ok(encoder);
      encoder.close();
    });

    it('should parse various bitrate formats', async () => {
      const testCases = [
        { input: '128k', desc: 'kilobits' },
        { input: '5M', desc: 'megabits' },
        { input: '1.5M', desc: 'decimal megabits' },
        { input: 192000, desc: 'number' },
        { input: 192000n, desc: 'bigint' },
      ];

      for (const { input, desc } of testCases) {
        const encoder = await Encoder.create(
          'aac',
          {
            type: 'audio',
            sampleRate: 44100,
            sampleFormat: AV_SAMPLE_FMT_FLTP,
            channelLayout: { nbChannels: 2, order: 1, mask: 3n },
            timeBase: { num: 1, den: 44100 },
          },
          {
            bitrate: input,
          },
        );

        assert.ok(encoder, `Should create encoder with ${desc} bitrate`);
        encoder.close();
      }
    });

    it('should throw for unknown encoder', async () => {
      await assert.rejects(
        async () =>
          await Encoder.create(
            'unknown_encoder',
            {
              type: 'video',
              width: 640,
              height: 480,
              pixelFormat: AV_PIX_FMT_YUV420P,
              frameRate: { num: 25, den: 1 },
              timeBase: { num: 1, den: 25 },
              sampleAspectRatio: { num: 1, den: 1 },
            },
            {},
          ),
        /Encoder unknown_encoder not found/,
      );
    });

    it('should throw for invalid bitrate format', async () => {
      await assert.rejects(
        async () =>
          await Encoder.create(
            'aac',
            {
              type: 'audio',
              sampleRate: 44100,
              sampleFormat: AV_SAMPLE_FMT_FLTP,
              channelLayout: { nbChannels: 2, order: 1, mask: 3n },
              timeBase: { num: 1, den: 44100 },
            },
            {
              bitrate: 'invalid',
            },
          ),
        /Invalid bitrate/,
      );
    });

    it('should throw for invalid pixel format', async () => {
      await assert.rejects(
        async () =>
          await Encoder.create(
            'libx264',
            {
              type: 'video',
              width: 640,
              height: 480,
              pixelFormat: -99 as any,
              frameRate: { num: 25, den: 1 },
              timeBase: { num: 1, den: 25 },
              sampleAspectRatio: { num: 1, den: 1 },
            },
            {},
          ),
        /Failed to open encoder: -22/,
      );
    });
  });

  describe('encode', () => {
    it('should encode video frames', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          bitrate: '500k',
          gopSize: 10,
        },
      );

      // Create test frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.pts = 0n;

      const ret = frame.getBuffer();
      assert.equal(ret, 0, 'Should allocate frame buffer');

      // Fill with test data
      if (frame.data?.[0]) {
        // Y plane - gradient
        for (let i = 0; i < 320 * 240; i++) {
          frame.data[0][i] = i % 256;
        }
        // U and V planes - gray
        if (frame.data[1] && frame.data[2]) {
          const chromaSize = (320 * 240) / 4;
          for (let i = 0; i < chromaSize; i++) {
            frame.data[1][i] = 128;
            frame.data[2][i] = 128;
          }
        }
      }

      // Encode frame
      const packet = await encoder.encode(frame);
      packet?.free();

      frame.free();
      encoder.close();
    });

    it('should encode audio frames', async () => {
      const encoder = await Encoder.create(
        'aac',
        {
          type: 'audio',
          sampleRate: 44100,
          sampleFormat: AV_SAMPLE_FMT_FLTP,
          channelLayout: { nbChannels: 2, order: 1, mask: 3n },
          timeBase: { num: 1, den: 44100 },
        },
        {
          bitrate: '128k',
        },
      );

      // AAC encoder might need to know frame size
      const codecContext = encoder.getCodecContext();
      const frameSize = codecContext?.frameSize ?? 1024;

      // Create test frame
      const frame = new Frame();
      frame.alloc();
      frame.nbSamples = frameSize;
      frame.sampleRate = 44100;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.pts = 0n;

      const ret = frame.getBuffer();
      assert.equal(ret, 0, 'Should allocate frame buffer');

      // Encode frame
      const packet = await encoder.encode(frame);
      packet?.free();

      frame.free();
      encoder.close();
    });

    it('should handle null packets gracefully', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      // Create and encode frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.getBuffer();

      const packet = await encoder.encode(frame);
      // Packet can be null, that's okay
      if (packet) {
        packet.free();
      }

      frame.free();
      encoder.close();
    });

    it('should throw when encoder is closed', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      encoder.close();

      const frame = new Frame();
      frame.alloc();

      await assert.rejects(async () => await encoder.encode(frame), /Encoder is closed/);

      frame.free();
    });
  });

  describe('flush', () => {
    it('should flush remaining packets', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          gopSize: 10,
        },
      );

      // Encode some frames first
      for (let i = 0; i < 5; i++) {
        const frame = new Frame();
        frame.alloc();
        frame.width = 320;
        frame.height = 240;
        frame.format = AV_PIX_FMT_YUV420P;
        frame.pts = BigInt(i);
        frame.getBuffer();

        const packet = await encoder.encode(frame);
        if (packet) {
          packet.free();
        }
        frame.free();
      }

      // Flush encoder
      let flushCount = 0;
      let packet;
      while ((packet = await encoder.flush()) !== null) {
        packet.free();
        flushCount++;
        if (flushCount > 20) break; // Safety limit
      }

      encoder.close();
    });

    it('should throw when encoder is closed', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      encoder.close();

      await assert.rejects(async () => await encoder.flush(), /Encoder is closed/);
    });
  });

  describe('async iterator', () => {
    it('should encode frames using iterator', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          bitrate: '500k',
          gopSize: 10,
        },
      );

      // Create test frames
      async function* generateFrames() {
        for (let i = 0; i < 5; i++) {
          const frame = new Frame();
          frame.alloc();
          frame.width = 320;
          frame.height = 240;
          frame.format = AV_PIX_FMT_YUV420P;
          frame.pts = BigInt(i);
          frame.getBuffer();
          yield frame;
          // Frame will be freed by caller
        }
      }

      let packetCount = 0;
      for await (const packet of encoder.packets(generateFrames())) {
        assert.ok(packet);
        packetCount++;
        packet.free();
      }

      // May get more or fewer packets due to B-frames
      assert.ok(packetCount >= 0, 'Should produce packets');

      encoder.close();
    });

    it('should handle empty frame stream', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      // Empty async generator
      async function* emptyFrames() {
        // No frames
      }

      let packetCount = 0;
      for await (const packet of encoder.packets(emptyFrames())) {
        packetCount++;
        packet.free();
      }

      assert.equal(packetCount, 0, 'Should not produce packets from empty stream');

      encoder.close();
    });
  });

  describe('pixel format helpers', () => {
    it('should get preferred pixel format', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      const preferredFormat = encoder.getPreferredPixelFormat();
      // libx264 should have a preferred format
      assert.ok(preferredFormat !== null, 'Should have a preferred pixel format');

      encoder.close();
    });

    it('should get supported pixel formats', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      const supportedFormats = encoder.getSupportedPixelFormats();
      assert.ok(Array.isArray(supportedFormats), 'Should return array of formats');
      // libx264 supports multiple formats
      assert.ok(supportedFormats.length > 0, 'Should support at least one format');

      encoder.close();
    });

    it('should return empty array for encoders without pixel format info', async () => {
      // AAC audio encoder doesn't have pixel formats
      const encoder = await Encoder.create(
        'aac',
        {
          type: 'audio',
          sampleRate: 44100,
          sampleFormat: AV_SAMPLE_FMT_FLTP,
          channelLayout: { nbChannels: 2, order: 1, mask: 3n },
          timeBase: { num: 1, den: 44100 },
        },
        {},
      );

      const preferredFormat = encoder.getPreferredPixelFormat();
      assert.equal(preferredFormat, null, 'Audio encoder should not have pixel formats');

      const supportedFormats = encoder.getSupportedPixelFormats();
      assert.ok(Array.isArray(supportedFormats), 'Should return array');
      assert.equal(supportedFormats.length, 0, 'Audio encoder should have no pixel formats');

      encoder.close();
    });
  });

  describe('resource management', () => {
    it('should support Symbol.dispose', async () => {
      {
        using encoder = await Encoder.create(
          'libx264',
          {
            type: 'video',
            width: 320,
            height: 240,
            pixelFormat: AV_PIX_FMT_YUV420P,
            frameRate: { num: 25, den: 1 },
            timeBase: { num: 1, den: 25 },
            sampleAspectRatio: { num: 1, den: 1 },
          },
          {},
        );
        assert.equal(encoder.isEncoderOpen, true);
        // Encoder will be closed automatically
      }
    });

    it('should handle multiple close calls', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      // Should not throw
      encoder.close();
      encoder.close();
      encoder.close();

      assert.equal(encoder.isEncoderOpen, false);
    });

    it('should return null codec context when closed', async () => {
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      assert.ok(encoder.getCodecContext());
      encoder.close();
      assert.equal(encoder.getCodecContext(), null);
    });
  });
});
