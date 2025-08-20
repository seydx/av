import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { Decoder, Encoder, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP } from '../src/lib/constants.js';
import { Packet } from '../src/lib/packet.js';

import type { IOOutputCallbacks } from '../src/api/types.js';

describe('MediaOutput', () => {
  let tempFiles: string[] = [];

  const cleanup = async () => {
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
    tempFiles = [];
  };

  const getTempFile = (extension: string) => {
    const file = join(tmpdir(), `test-output-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
    tempFiles.push(file);
    return file;
  };

  describe('open', () => {
    it('should open output file', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      assert(output instanceof MediaOutput);
      assert.equal(output.isHeaderWritten(), false);
      assert.equal(output.isTrailerWritten(), false);

      await output.close();
      await cleanup();
    });

    it('should open output file with explicit format', async () => {
      const outputFile = getTempFile('mkv');
      const output = await MediaOutput.open(outputFile, { format: 'matroska' });

      assert(output instanceof MediaOutput);
      const formatContext = output.getFormatContext();
      assert(formatContext.oformat);
      assert(formatContext.oformat.name?.includes('matroska'));

      await output.close();
      await cleanup();
    });

    it('should open with custom IO callbacks', async () => {
      const chunks: Buffer[] = [];

      const callbacks: IOOutputCallbacks = {
        write: (buffer: Buffer) => {
          chunks.push(Buffer.from(buffer));
          return buffer.length;
        },
        seek: (offset: bigint) => {
          // Simple seek implementation for testing
          return offset;
        },
      };

      const output = await MediaOutput.open(callbacks, { format: 'mp4' });
      assert(output instanceof MediaOutput);

      await output.close();
    });

    it('should require format for custom IO', async () => {
      const callbacks: IOOutputCallbacks = {
        write: (buffer: Buffer) => buffer.length,
      };

      await assert.rejects(async () => await MediaOutput.open(callbacks), /Format must be specified for custom IO/);
    });

    it('should support custom buffer size for custom IO', async () => {
      const callbacks: IOOutputCallbacks = {
        write: (buffer: Buffer) => buffer.length,
      };

      const output = await MediaOutput.open(callbacks, {
        format: 'mp4',
        bufferSize: 8192,
      });

      assert(output instanceof MediaOutput);
      await output.close();
    });
  });

  describe('addStream', () => {
    it('should add stream from encoder', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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
        },
      );

      const streamIndex = output.addStream(encoder);
      assert.equal(typeof streamIndex, 'number');
      assert.equal(streamIndex, 0);

      const streamInfo = output.getStreamInfo(streamIndex);
      assert(streamInfo);
      assert.equal(streamInfo.isStreamCopy, false);

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should add stream for copy from input stream', async () => {
      const input = await MediaInput.open('testdata/demux.mp4');
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const inputStream = input.video();
      assert(inputStream);

      const streamIndex = output.addStream(inputStream);
      assert.equal(typeof streamIndex, 'number');

      const streamInfo = output.getStreamInfo(streamIndex);
      assert(streamInfo);
      assert.equal(streamInfo.isStreamCopy, true);

      await output.close();
      await input.close();
      await cleanup();
    });

    it('should support custom timebase override', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      const customTimeBase = { num: 1, den: 60 };
      const streamIndex = output.addStream(encoder, {
        timeBase: customTimeBase,
      });

      const streamInfo = output.getStreamInfo(streamIndex);
      assert(streamInfo);
      assert.equal(streamInfo.timeBase.num, customTimeBase.num);
      assert.equal(streamInfo.timeBase.den, customTimeBase.den);

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should add multiple streams', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const videoEncoder = await Encoder.create(
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

      const audioEncoder = await Encoder.create(
        'aac',
        {
          type: 'audio',
          sampleRate: 48000,
          channelLayout: { nbChannels: 2, order: 1, mask: 3n }, // order: 1 for native layout
          sampleFormat: AV_SAMPLE_FMT_FLTP,
          timeBase: { num: 1, den: 48000 },
        },
        {},
      );

      const videoIdx = output.addStream(videoEncoder);
      const audioIdx = output.addStream(audioEncoder);

      assert.equal(videoIdx, 0);
      assert.equal(audioIdx, 1);
      assert.deepEqual(output.getStreamIndices(), [0, 1]);

      videoEncoder.close();
      audioEncoder.close();
      await output.close();
      await cleanup();
    });

    it('should throw when adding stream after header', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      output.addStream(encoder);
      await output.writeHeader();

      await assert.rejects(async () => output.addStream(encoder), /Cannot add streams after header is written/);

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should throw when output is closed', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);
      await output.close();

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

      await assert.rejects(async () => output.addStream(encoder), /MediaOutput is closed/);

      encoder.close();
      await cleanup();
    });
  });

  describe('writeHeader/writeTrailer', () => {
    it('should write header and trailer', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      output.addStream(encoder);

      assert.equal(output.isHeaderWritten(), false);
      await output.writeHeader();
      assert.equal(output.isHeaderWritten(), true);

      assert.equal(output.isTrailerWritten(), false);
      await output.writeTrailer();
      assert.equal(output.isTrailerWritten(), true);

      encoder.close();
      await output.close();

      // Verify file was created
      const stats = await fs.stat(outputFile);
      assert(stats.isFile());

      await cleanup();
    });

    it('should throw when writing header twice', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      output.addStream(encoder);
      await output.writeHeader();

      await assert.rejects(async () => await output.writeHeader(), /Header already written/);

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should throw when writing trailer without header', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      await assert.rejects(async () => await output.writeTrailer(), /Cannot write trailer without header/);

      await output.close();
      await cleanup();
    });

    it('should auto-write trailer on close if header was written', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      output.addStream(encoder);
      await output.writeHeader();

      // Close without explicit writeTrailer
      await output.close();

      // File should still be valid
      const stats = await fs.stat(outputFile);
      assert(stats.isFile());

      encoder.close();
      await cleanup();
    });
  });

  describe('writePacket', () => {
    it('should write packet to stream', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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
          gopSize: 12,
        },
      );

      const streamIdx = output.addStream(encoder);
      await output.writeHeader();

      // Create a test packet
      const packet = new Packet();
      packet.alloc();
      packet.data = Buffer.from([0, 0, 0, 1]); // Minimal H.264 NAL unit
      packet.pts = 0n;
      packet.dts = 0n;

      await output.writePacket(packet, streamIdx);
      packet.free();

      await output.writeTrailer();
      encoder.close();
      await output.close();

      const stats = await fs.stat(outputFile);
      assert(stats.size > 0);

      await cleanup();
    });

    it('should throw when writing packet before header', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      const streamIdx = output.addStream(encoder);

      const packet = new Packet();
      packet.alloc();

      await assert.rejects(async () => await output.writePacket(packet, streamIdx), /Header must be written before packets/);

      packet.free();
      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should throw for invalid stream index', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

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

      output.addStream(encoder);
      await output.writeHeader();

      const packet = new Packet();
      packet.alloc();

      await assert.rejects(async () => await output.writePacket(packet, 999), /Invalid stream index: 999/);

      packet.free();
      encoder.close();
      await output.close();
      await cleanup();
    });
  });

  describe('AsyncDisposable', () => {
    it('should support await using syntax', async () => {
      const outputFile = getTempFile('mp4');
      let output: MediaOutput | null = null;

      // Use async context to test disposal
      await (async () => {
        await using o = await MediaOutput.open(outputFile);
        output = o;
        assert(output instanceof MediaOutput);

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

        output.addStream(encoder);
        await output.writeHeader();
        encoder.close();
      })();

      // Output should be closed after the block
      // Try to use it should throw
      await assert.rejects(async () => await output!.writeTrailer(), /MediaOutput is closed/);

      await cleanup();
    });
  });

  describe('Integration', () => {
    it('should transcode video with MediaInput/Output', async () => {
      const input = await MediaInput.open('testdata/demux.mp4');
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      // Get video stream for timebase
      const videoStream = input.video();
      assert(videoStream);

      // Setup decoder and encoder
      const decoder = await Decoder.create(videoStream);
      const encoder = await Encoder.create(
        'libx264',
        {
          type: 'video',
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: videoStream.timeBase, // Use input stream timebase
          frameRate: { num: 25, den: 1 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {
          bitrate: '500k',
          maxBFrames: 0, // Disable B-frames to simplify timing
        },
      );

      const streamIdx = output.addStream(encoder);
      await output.writeHeader();

      // Process some packets
      let packetCount = 0;
      for await (const packet of input.packets()) {
        if (packet.streamIndex === 0 && packetCount < 10) {
          const frame = await decoder.decode(packet);
          if (frame) {
            const encoded = await encoder.encode(frame);
            if (encoded) {
              await output.writePacket(encoded, streamIdx);
              encoded.free();
              packetCount++;
            }
            frame.free();
          }
        }
      }

      // Flush encoder
      let flushPacket;
      while ((flushPacket = await encoder.flush()) !== null) {
        await output.writePacket(flushPacket, streamIdx);
        flushPacket.free();
      }

      await output.writeTrailer();

      decoder.close();
      encoder.close();
      await output.close();
      await input.close();

      // Verify output file exists and has content
      const stats = await fs.stat(outputFile);
      assert(stats.size > 0);

      await cleanup();
    });

    it('should support stream copy', async () => {
      const input = await MediaInput.open('testdata/demux.mp4');
      const outputFile = getTempFile('mkv');
      const output = await MediaOutput.open(outputFile);

      // Copy video stream directly
      const videoStream = input.video();
      assert(videoStream);

      // Save codec parameters before closing input
      const originalWidth = videoStream.codecpar?.width;
      const originalHeight = videoStream.codecpar?.height;

      const streamIdx = output.addStream(videoStream);
      await output.writeHeader();

      // Copy packets without decoding/encoding
      let packetCount = 0;
      for await (const packet of input.packets()) {
        if (packet.streamIndex === videoStream.index && packetCount < 20) {
          await output.writePacket(packet, streamIdx);
          packetCount++;
        }
      }

      await output.writeTrailer();
      await output.close();
      await input.close();

      // Verify output
      const stats = await fs.stat(outputFile);
      assert(stats.size > 0);

      // Verify we can open and read the copied file
      const verifyInput = await MediaInput.open(outputFile);
      const verifyVideo = verifyInput.video();
      assert(verifyVideo);
      assert.equal(verifyVideo.codecpar?.width, originalWidth);
      assert.equal(verifyVideo.codecpar?.height, originalHeight);
      await verifyInput.close();

      await cleanup();
    });
  });
});
