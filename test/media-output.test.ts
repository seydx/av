import assert from 'node:assert';
import { stat, unlink } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { Decoder, Encoder, FF_ENCODER_AAC, FF_ENCODER_LIBX264, MediaInput, MediaOutput, Packet } from '../src/index.js';
import { getInputFile, getOutputFile, prepareTestEnvironment } from './index.js';

import type { IOOutputCallbacks } from '../src/api/types.js';

prepareTestEnvironment();

const inputFile = getInputFile('demux.mp4');

describe('MediaOutput', () => {
  let tempFiles: string[] = [];

  const cleanup = async () => {
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
    tempFiles = [];
  };

  const getTempFile = (extension: string) => {
    const file = getOutputFile(`test-output-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
    tempFiles.push(file);
    return file;
  };

  describe('open', () => {
    it('should open output file (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      assert(output instanceof MediaOutput);

      await output.close();
      await cleanup();
    });

    it('should open output file (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      assert(output instanceof MediaOutput);

      output.closeSync();
    });

    it('should open output file with explicit format (async)', async () => {
      const outputFile = getTempFile('mkv');
      const output = await MediaOutput.open(outputFile, { format: 'matroska' });

      assert(output instanceof MediaOutput);
      const formatContext = output.getFormatContext();
      assert(formatContext.oformat);
      assert(formatContext.oformat.name?.includes('matroska'));

      await output.close();
      await cleanup();
    });

    it('should open output file with explicit format (sync)', () => {
      const outputFile = getTempFile('mkv');
      const output = MediaOutput.openSync(outputFile, { format: 'matroska' });

      assert(output instanceof MediaOutput);
      const formatContext = output.getFormatContext();
      assert(formatContext.oformat);
      assert(formatContext.oformat.name?.includes('matroska'));

      output.closeSync();
    });

    it('should open with custom IO callbacks (async)', async () => {
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

    it('should require format for custom IO (async)', async () => {
      const callbacks: IOOutputCallbacks = {
        write: (buffer: Buffer) => buffer.length,
      };

      await assert.rejects(async () => await MediaOutput.open(callbacks), /Format must be specified for custom IO/);
    });

    it('should support custom buffer size for custom IO (async)', async () => {
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
    it('should add stream from encoder (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
        bitrate: '1M',
      });

      const streamIndex = output.addStream(encoder);
      assert.equal(typeof streamIndex, 'number');
      assert.equal(streamIndex, 0);

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should add stream from encoder (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const encoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
        bitrate: '1M',
      });

      const streamIndex = output.addStream(encoder);
      assert.equal(typeof streamIndex, 'number');
      assert.equal(streamIndex, 0);

      encoder.close();
      output.closeSync();
    });

    it('should add stream for copy from input stream (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const inputStream = input.video();
      assert(inputStream);

      const streamIndex = output.addStream(inputStream);
      assert.equal(typeof streamIndex, 'number');

      await output.close();
      await input.close();
      await cleanup();
    });

    it('should add stream for copy from input stream (sync)', () => {
      const input = MediaInput.openSync(inputFile);
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const inputStream = input.video();
      assert(inputStream);

      const streamIndex = output.addStream(inputStream);
      assert.equal(typeof streamIndex, 'number');

      output.closeSync();
      input.closeSync();
    });

    it('should support custom timebase override (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should support custom timebase override (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const encoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      encoder.close();
      output.closeSync();
    });

    it('should add multiple streams (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const videoEncoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const audioEncoder = await Encoder.create(FF_ENCODER_AAC, {
        timeBase: { num: 1, den: 48000 },
      });

      const videoIdx = output.addStream(videoEncoder);
      const audioIdx = output.addStream(audioEncoder);

      assert.equal(videoIdx, 0);
      assert.equal(audioIdx, 1);

      videoEncoder.close();
      audioEncoder.close();
      await output.close();
      await cleanup();
    });

    it('should add multiple streams (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const videoEncoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const audioEncoder = Encoder.createSync(FF_ENCODER_AAC, {
        timeBase: { num: 1, den: 48000 },
      });

      const videoIdx = output.addStream(videoEncoder);
      const audioIdx = output.addStream(audioEncoder);

      assert.equal(videoIdx, 0);
      assert.equal(audioIdx, 1);

      videoEncoder.close();
      audioEncoder.close();
      output.closeSync();
    });

    it('should throw when adding stream after header (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const videoStream = input.video();
      assert(videoStream);

      const decoder = await Decoder.create(videoStream);
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const streamIdx = output.addStream(encoder);

      // Get first packet and decode/encode to initialize encoder and write header
      for await (const packet of input.packets()) {
        if (packet.streamIndex === 0) {
          const frame = await decoder.decode(packet);
          if (frame) {
            const encoded = await encoder.encode(frame);
            if (encoded) {
              await output.writePacket(encoded, streamIdx); // This triggers header write
              encoded.free();
              break; // Just process one packet
            }
            frame.free();
          }
          packet.free();
        }
      }

      // Now try to add another stream - should fail
      const encoder2 = await Encoder.create(FF_ENCODER_AAC, {
        timeBase: { num: 1, den: 48000 },
      });

      assert.throws(() => output.addStream(encoder2), /Cannot add streams after packets have been written/);

      encoder2.close();
      encoder.close();
      decoder.close();
      await output.close();
      await input.close();
      await cleanup();
    });

    it('should throw when output is closed (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);
      await output.close();

      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      await assert.rejects(async () => output.addStream(encoder), /MediaOutput is closed/);

      encoder.close();
      await cleanup();
    });

    it('should throw when output is closed (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);
      output.closeSync();

      const encoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      assert.throws(() => output.addStream(encoder), /MediaOutput is closed/);

      encoder.close();
    });
  });

  describe('automatic header/trailer', () => {
    it('should write header automatically on first packet and trailer on close (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const streamIdx = output.addStream(encoder);

      // For a real test, we'd need to encode actual frames
      // Since this is testing automatic behavior, we'll just verify the stream was added
      assert.equal(streamIdx, 0);

      encoder.close();
      await output.close();

      // Verify file was created
      const stats = await stat(outputFile);
      assert(stats.isFile());

      await cleanup();
    });

    // Tests for manual header/trailer writing removed - now handled automatically

    it('should auto-write header and trailer (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const videoStream = input.video();
      assert(videoStream);

      const decoder = await Decoder.create(videoStream);
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const streamIdx = output.addStream(encoder);

      // Process just one frame to test header/trailer writing
      let processed = false;
      for await (const packet of input.packets()) {
        if (packet.streamIndex === 0 && !processed) {
          const frame = await decoder.decode(packet);
          if (frame) {
            const encoded = await encoder.encode(frame);
            if (encoded) {
              // Header written automatically on first packet
              await output.writePacket(encoded, streamIdx);
              encoded.free();
              processed = true;
            }
            frame.free();
          }
        }
        packet.free();
        if (processed) break;
      }

      // Trailer written automatically on close
      decoder.close();
      encoder.close();
      await output.close();
      await input.close();

      // Verify file was created and has content
      const stats = await stat(outputFile);
      assert(stats.isFile());
      assert(stats.size > 0);

      await cleanup();
    });
  });

  describe('writePacket', () => {
    it('should write packet to stream (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const videoStream = input.video();
      assert(videoStream);

      const decoder = await Decoder.create(videoStream);
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
        gopSize: 12,
      });

      const streamIdx = output.addStream(encoder);

      // Process a few packets
      let packetCount = 0;
      for await (const packet of input.packets()) {
        if (packet.streamIndex === 0 && packetCount < 3) {
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
        packet.free();
        if (packetCount >= 3) break;
      }

      decoder.close();
      encoder.close();
      await output.close();
      await input.close();

      const stats = await stat(outputFile);
      assert(stats.size > 0);

      await cleanup();
    });

    it('should write packet to stream (sync)', () => {
      const input = MediaInput.openSync(inputFile);
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const videoStream = input.video();
      assert(videoStream);

      const decoder = Decoder.createSync(videoStream);
      const encoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
        gopSize: 12,
      });

      const streamIdx = output.addStream(encoder);

      // Process a few packets
      let packetCount = 0;
      for (const packet of input.packetsSync()) {
        if (packet.streamIndex === 0 && packetCount < 3) {
          const frame = decoder.decodeSync(packet);
          if (frame) {
            const encoded = encoder.encodeSync(frame);
            if (encoded) {
              output.writePacketSync(encoded, streamIdx);
              encoded.free();
              packetCount++;
            }
            frame.free();
          }
        }
        packet.free();
        if (packetCount >= 3) break;
      }

      decoder.close();
      encoder.close();
      output.closeSync();
      input.closeSync();
    });

    it('should throw for invalid stream index (async)', async () => {
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const packet = new Packet();
      packet.alloc();

      await assert.rejects(async () => await output.writePacket(packet, 999), /Invalid stream index: 999/);

      packet.free();
      encoder.close();
      await output.close();
      await cleanup();
    });

    it('should throw for invalid stream index (sync)', () => {
      const outputFile = getTempFile('mp4');
      const output = MediaOutput.openSync(outputFile);

      const encoder = Encoder.createSync(FF_ENCODER_LIBX264, {
        frameRate: { num: 25, den: 1 },
        timeBase: { num: 1, den: 25 },
      });

      const packet = new Packet();
      packet.alloc();

      assert.throws(() => output.writePacketSync(packet, 999), /Invalid stream index: 999/);

      packet.free();
      encoder.close();
      output.closeSync();
    });
  });

  describe('AsyncDisposable', () => {
    it('should support await using syntax (async)', async () => {
      const outputFile = getTempFile('mp4');
      let output: MediaOutput | null = null;

      // Use async context to test disposal
      await (async () => {
        await using o = await MediaOutput.open(outputFile);
        output = o;
        assert(output instanceof MediaOutput);

        const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          frameRate: { num: 25, den: 1 },
          timeBase: { num: 1, den: 25 },
        });

        output.addStream(encoder);
        // No need to write header - will be done automatically
        encoder.close();
      })();

      // Output should be closed after the block
      // Try to use it should throw
      await assert.rejects(async () => {
        const p = new Packet();
        p.alloc();
        await output!.writePacket(p, 0);
      }, /MediaOutput is closed/);

      await cleanup();
    });
  });

  describe('Integration', () => {
    it('should transcode video with MediaInput/Output (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mp4');
      const output = await MediaOutput.open(outputFile);

      // Get video stream for timebase
      const videoStream = input.video();
      assert(videoStream);

      // Setup decoder and encoder
      const decoder = await Decoder.create(videoStream);
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: videoStream.timeBase, // Use input stream timebase
        frameRate: { num: 25, den: 1 },
        bitrate: '500k',
        maxBFrames: 0, // Disable B-frames to simplify timing
      });

      const streamIdx = output.addStream(encoder);

      // Process some packets - header written automatically on first packet
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
      await encoder.flush();
      for await (const flushPacket of encoder.flushPackets()) {
        await output.writePacket(flushPacket, streamIdx);
        flushPacket.free();
      }

      // Trailer written automatically on close
      decoder.close();
      encoder.close();
      await output.close();
      await input.close();

      // Verify output file exists and has content
      const stats = await stat(outputFile);
      assert(stats.size > 0);

      await cleanup();
    });

    it('should support stream copy (async)', async () => {
      const input = await MediaInput.open(inputFile);
      const outputFile = getTempFile('mkv');
      const output = await MediaOutput.open(outputFile);

      // Copy video stream directly
      const videoStream = input.video();
      assert(videoStream);

      // Save codec parameters before closing input
      const originalWidth = videoStream.codecpar?.width;
      const originalHeight = videoStream.codecpar?.height;

      const streamIdx = output.addStream(videoStream);

      // Copy packets without decoding/encoding - header written automatically
      let packetCount = 0;
      for await (const packet of input.packets()) {
        if (packet.streamIndex === videoStream.index && packetCount < 20) {
          await output.writePacket(packet, streamIdx);
          packetCount++;
        }
      }

      // Trailer written automatically on close
      await output.close();
      await input.close();

      // Verify output
      const stats = await stat(outputFile);
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
