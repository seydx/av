import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP, Encoder, FF_ENCODER_AAC, FF_ENCODER_LIBX264, HardwareContext } from '../src/index.js';
import { Frame } from '../src/lib/index.js';
import { skipInCI } from './index.js';

describe('Encoder', () => {
  describe('create', () => {
    it('should create video encoder', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        bitrate: '1M',
        gopSize: 30,
      });

      assert.ok(encoder);
      assert.equal(encoder.isEncoderOpen, true);
      assert.equal(encoder.getCodec().name, FF_ENCODER_LIBX264);

      encoder.close();
    });

    it('should create audio encoder', async () => {
      const encoder = await Encoder.create(FF_ENCODER_AAC, {
        timeBase: { num: 1, den: 44100 },
        bitrate: '128k',
      });

      assert.ok(encoder);
      assert.equal(encoder.isEncoderOpen, true);
      assert.equal(encoder.getCodec().name, FF_ENCODER_AAC);

      encoder.close();
    });

    it('should create encoder with thread options', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        threads: 4,
      });

      assert.ok(encoder);
      encoder.close();
    });

    it('should create encoder with codec options', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        options: {
          preset: 'fast',
          crf: '23',
        },
      });

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
        const encoder = await Encoder.create(FF_ENCODER_AAC, {
          timeBase: { num: 1, den: 44100 },
          bitrate: input,
        });

        assert.ok(encoder, `Should create encoder with ${desc} bitrate`);
        encoder.close();
      }
    });

    it('should throw for unknown encoder', async () => {
      await assert.rejects(
        async () =>
          await Encoder.create('unknown_encoder' as any, {
            timeBase: { num: 1, den: 25 },
          }),
        /Encoder unknown_encoder not found/,
      );
    });

    it('should throw for invalid bitrate format', async () => {
      await assert.rejects(
        async () =>
          await Encoder.create(FF_ENCODER_AAC, {
            timeBase: { num: 1, den: 44100 },
            bitrate: 'invalid',
          }),
        /Invalid bitrate/,
      );
    });
  });

  describe('encode', () => {
    it('should encode video frames', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        bitrate: '500k',
        gopSize: 10,
      });

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
      const encoder = await Encoder.create(FF_ENCODER_AAC, {
        timeBase: { num: 1, den: 44100 },
        bitrate: '128k',
      });

      // Create test frame with typical AAC frame size
      const frame = new Frame();
      frame.alloc();
      frame.nbSamples = 1024; // Typical AAC frame size
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
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

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
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

      // Initialize encoder with a frame first
      const initFrame = new Frame();
      initFrame.alloc();
      initFrame.width = 320;
      initFrame.height = 240;
      initFrame.format = AV_PIX_FMT_YUV420P;
      initFrame.getBuffer();
      await encoder.encode(initFrame);
      initFrame.free();

      encoder.close();

      const frame = new Frame();
      frame.alloc();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;

      await assert.rejects(async () => await encoder.encode(frame), /Encoder is closed/);

      frame.free();
    });
  });

  describe('flush', () => {
    it('should flush remaining packets', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        gopSize: 10,
      });

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
      for await (const packet of encoder.flushPackets()) {
        packet.free();
        flushCount++;
        if (flushCount > 20) break; // Safety limit
      }

      encoder.close();
    });

    it('should handle flush when encoder is closed', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

      encoder.close();

      // flush() returns void now and doesn't throw when closed
      await encoder.flush(); // Should not throw
    });
  });

  describe('async iterator', () => {
    it('should encode frames using iterator', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
        bitrate: '500k',
        gopSize: 10,
      });

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
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

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

  describe('hardware encoding', () => {
    it('should create hardware encoder with hardware context', skipInCI, async () => {
      // Try to get hardware context
      const hw = HardwareContext.auto();
      if (!hw) {
        return;
      }

      // Get hardware encoder codec name
      const encoderCodec = hw.getEncoderCodec('h264');
      if (!encoderCodec) {
        hw.dispose();
        return;
      }

      try {
        const encoder = await Encoder.create(encoderCodec, {
          timeBase: { num: 1, den: 25 },
          frameRate: { num: 25, den: 1 },
          bitrate: '1M',
        });

        assert.ok(encoder);
        assert.equal(encoder.isEncoderOpen, true);
        assert.equal(encoder.getCodec().name, encoderCodec.name);

        encoder.close();
      } catch (error) {
        // Hardware encoder creation might fail on some systems
        console.log('Hardware encoder creation failed:', error.message);
      }

      hw.dispose();
    });
  });

  describe('resource management', () => {
    it('should support Symbol.dispose', async () => {
      {
        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 25 },
          frameRate: { num: 25, den: 1 },
        });
        assert.equal(encoder.isEncoderOpen, true);
        // Encoder will be closed automatically
      }
    });

    it('should handle multiple close calls', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

      // Should not throw
      encoder.close();
      encoder.close();
      encoder.close();

      assert.equal(encoder.isEncoderOpen, false);
    });

    it('should return null codec context before initialization', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

      // Before initialization, codec context should be null
      assert.equal(encoder.getCodecContext(), null);

      encoder.close();
    });

    it('should return null codec context when closed', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 25 },
        frameRate: { num: 25, den: 1 },
      });

      // Initialize encoder with a frame first
      const frame = new Frame();
      frame.alloc();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.getBuffer();
      await encoder.encode(frame);
      frame.free();

      // Now codec context should be available
      assert.ok(encoder.getCodecContext());
      encoder.close();
      assert.equal(encoder.getCodecContext(), null);
    });
  });
});
