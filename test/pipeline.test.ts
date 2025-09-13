import assert from 'node:assert';
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import {
  AV_CODEC_ID_H264,
  AV_PIX_FMT_YUV420P,
  BitStreamFilterAPI,
  Decoder,
  Encoder,
  FF_ENCODER_AAC,
  FF_ENCODER_LIBX264,
  FilterAPI,
  Frame,
  HardwareContext,
  MediaInput,
  MediaOutput,
  Packet,
  pipeline,
} from '../src/index.js';
import { getInputFile, getOutputFile, getTmpDir, prepareTestEnvironment, skipInCI } from './index.js';

prepareTestEnvironment();

const inputFile = getInputFile('demux.mp4');
const inputFile2 = getInputFile('demux_perfect.mp4');

// Helper to create unique output filenames
let testFileCounter = 0;
function getTestOutputPath(name: string): string {
  return getOutputFile(`test-pipeline-${testFileCounter++}-${name}`);
}

// Cleanup function for test outputs
function cleanupTestFile(filepath: string): void {
  if (existsSync(filepath)) {
    try {
      unlinkSync(filepath);
    } catch {
      // Ignore errors
    }
  }
}

describe('Pipeline - Comprehensive Tests', () => {
  // Cleanup all test files after all tests
  after(() => {
    // Clean up any remaining test files
    const tmpDir = getTmpDir();
    if (existsSync(tmpDir)) {
      const files = readdirSync(tmpDir);
      files.forEach((file: string) => {
        if (file.startsWith('test-pipeline-')) {
          try {
            unlinkSync(join(tmpDir, file));
          } catch {
            // Ignore errors
          }
        }
      });
    }
  });

  describe('Simple Pipeline - Stream Copy', () => {
    it('should copy all streams from input to output', async () => {
      const outputFile = getTestOutputPath('copy.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        // Simple stream copy
        const control = pipeline(input, output);

        // Wait for completion
        await control.completion;

        // Verify output file exists
        assert.ok(existsSync(outputFile), 'Output file should exist');

        // Verify output has same streams as input
        await using verifyInput = await MediaInput.open(outputFile);
        assert.ok(verifyInput.video(), 'Output should have video stream');
        assert.ok(verifyInput.audio(), 'Output should have audio stream');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should support stopping the pipeline', async () => {
      const outputFile = getTestOutputPath('copy-stopped.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const control = pipeline(input, output);

        // Stop immediately
        control.stop();
        assert.ok(control.isStopped(), 'Pipeline should be stopped');

        // Wait for completion
        await control.completion;

        // File might exist but should be incomplete
      } finally {
        cleanupTestFile(outputFile);
      }
    });
  });

  describe('Simple Pipeline - Transcode', () => {
    it('should transcode with decoder and encoder', async () => {
      const outputFile = getTestOutputPath('transcode.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream);

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: videoStream.timeBase,
          frameRate: videoStream.avgFrameRate,
          bitrate: '1M',
          gopSize: 30,
        });

        const control = pipeline(input, decoder, encoder, output);
        await control.completion;

        // Verify output
        assert.ok(existsSync(outputFile), 'Output file should exist');

        await using verifyInput = await MediaInput.open(outputFile);
        const verifyStream = verifyInput.video();
        assert.ok(verifyStream, 'Output should have video stream');
        assert.equal(verifyStream.codecpar.width, 320, 'Width should be 320');
        assert.equal(verifyStream.codecpar.height, 240, 'Height should be 240');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should transcode with filter', async () => {
      const outputFile = getTestOutputPath('transcode-filter.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream);

        // Create a simple scale filter
        using filter = await FilterAPI.create('scale=320:240', {
          frameRate: videoStream.avgFrameRate,
          timeBase: videoStream.timeBase,
        });

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          frameRate: videoStream.avgFrameRate,
          timeBase: videoStream.timeBase,
          bitrate: '500k',
        });

        const control = pipeline(input, decoder, filter, encoder, output);
        await control.completion;

        // Verify output
        assert.ok(existsSync(outputFile), 'Output file should exist');

        await using verifyInput = await MediaInput.open(outputFile);
        const verifyStream = verifyInput.video();
        assert.ok(verifyStream, 'Output should have video stream');
        assert.equal(verifyStream.codecpar.width, 320, 'Width should be 320');
        assert.equal(verifyStream.codecpar.height, 240, 'Height should be 240');
      } finally {
        cleanupTestFile(outputFile);
      }
    });
  });

  describe('Simple Pipeline - BitStreamFilter', () => {
    it('should apply bitstream filter during stream copy', async function (t) {
      const outputFile = getTestOutputPath('copy-bsf.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        const videoStream = input.video();

        if (!videoStream || videoStream.codecpar.codecId !== AV_CODEC_ID_H264) {
          t.skip();
          return;
        }

        await using output = await MediaOutput.open(outputFile);

        // Create h264_mp4toannexb filter for the video stream
        using bsf = BitStreamFilterAPI.create('h264_mp4toannexb', videoStream);

        const control = pipeline(input, bsf, output);
        await control.completion;

        // Verify output exists
        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should apply bitstream filter after encoding', async function (t) {
      const outputFile = getTestOutputPath('transcode-bsf.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          t.skip();
          return;
        }

        using decoder = await Decoder.create(videoStream);
        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '1M',
        });

        // Create BSF for the encoded stream
        // Note: We use the null filter which works with any stream
        using bsf = BitStreamFilterAPI.create('null', videoStream);

        const control = pipeline(input, decoder, encoder, bsf, output);
        await control.completion;

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });
  });

  describe('Named Pipeline', () => {
    it('should process multiple named streams', async () => {
      const outputFile = getTestOutputPath('named-multi.mp4');

      try {
        await using videoInput = await MediaInput.open(inputFile);
        await using audioInput = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = videoInput.video();
        const audioStream = audioInput.audio();

        if (!videoStream || !audioStream) {
          assert.fail('Missing video or audio stream');
        }

        // Create processing stages
        using videoDecoder = await Decoder.create(videoStream);
        using videoEncoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '1M',
        });

        using audioDecoder = await Decoder.create(audioStream);
        using audioEncoder = await Encoder.create(FF_ENCODER_AAC, {
          timeBase: { num: 1, den: 44100 },
          bitrate: '128k',
        });

        // const audioFilter = await FilterAPI.create('aformat=sample_fmts=fltp:channel_layouts=stereo,asetnsamples=n=1024:p=0', audioStream);

        // Named pipeline with separate video and audio processing
        const control = pipeline(
          { video: videoInput, audio: audioInput },
          {
            video: [videoDecoder, videoEncoder],
            audio: [audioDecoder, audioEncoder],
          },
          output,
        );

        await control.completion;

        // Verify output
        assert.ok(existsSync(outputFile), 'Output file should exist');

        await using verifyInput = await MediaInput.open(outputFile);
        assert.ok(verifyInput.video(), 'Output should have video stream');
        assert.ok(verifyInput.audio(), 'Output should have audio stream');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should support passthrough for specific streams', async () => {
      const outputFile = getTestOutputPath('named-passthrough.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        const output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        const audioStream = input.audio();

        if (!videoStream || !audioStream) {
          assert.fail('Missing video or audio stream');
        }

        // Process video, passthrough audio
        using videoDecoder = await Decoder.create(videoStream);
        using videoEncoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
        });

        const control = pipeline(
          { video: input, audio: input },
          {
            video: [videoDecoder, videoEncoder],
            audio: 'passthrough',
          },
          output,
        );

        await control.completion;

        // Verify output
        assert.ok(existsSync(outputFile), 'Output file should exist');

        await using verifyInput = await MediaInput.open(outputFile);
        const verifyVideo = verifyInput.video();
        const verifyAudio = verifyInput.audio();

        assert.ok(verifyVideo, 'Output should have video stream');
        assert.ok(verifyAudio, 'Output should have audio stream');

        // Video should be reencoded to 320x240
        assert.equal(verifyVideo.codecpar.width, 320, 'Video width should be 320');
        assert.equal(verifyVideo.codecpar.height, 240, 'Video height should be 240');

        // Audio should have same codec as input (passthrough)
        assert.equal(verifyAudio.codecpar.codecId, audioStream.codecpar.codecId, 'Audio codec should be unchanged');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should handle filters in named pipeline', async () => {
      const outputFile = getTestOutputPath('named-filter.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream);
        using filter = await FilterAPI.create('scale=320:240', {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
        });
        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
        });

        const control = pipeline({ video: input }, { video: [decoder, filter, encoder] }, output);

        await control.completion;

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });
  });

  describe('Partial Pipelines', () => {
    it('should return generator for decoder only', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();

      if (!videoStream) {
        assert.fail('No video stream found');
      }

      using decoder = await Decoder.create(videoStream);

      // Partial pipeline returns generator
      const frameGenerator = pipeline(input, decoder);

      // Verify it's an async generator
      assert.ok(frameGenerator[Symbol.asyncIterator], 'Should return async generator');

      // Get first few frames
      let frameCount = 0;
      for await (const frame of frameGenerator) {
        assert.ok(frame instanceof Frame, 'Should yield Frame objects');
        frameCount++;
        if (frameCount >= 5) break;
      }

      assert.ok(frameCount > 0, 'Should have yielded frames');
    });

    it('should return generator for decoder + filter', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();

      if (!videoStream) {
        assert.fail('No video stream found');
      }

      using decoder = await Decoder.create(videoStream);
      using filter = await FilterAPI.create('scale=160:120', {
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
      });

      // Partial pipeline with filter
      const frameGenerator = pipeline(input, decoder, filter);

      // Get first few filtered frames
      let frameCount = 0;
      for await (const frame of frameGenerator) {
        assert.ok(frame instanceof Frame, 'Should yield Frame objects');
        assert.equal(frame.width, 160, 'Frame should be scaled to 160 width');
        assert.equal(frame.height, 120, 'Frame should be scaled to 120 height');
        frameCount++;
        if (frameCount >= 3) break;
      }

      assert.ok(frameCount > 0, 'Should have yielded frames');
    });

    it('should return packets for decoder + encoder partial pipeline', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();

      if (!videoStream) {
        assert.fail('No video stream found');
      }

      using decoder = await Decoder.create(videoStream);
      using filter = await FilterAPI.create('scale=320:240', {
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
      });
      using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
        bitrate: '500k',
      });

      // Partial pipeline returns packets
      const packetGenerator = pipeline(input, decoder, filter, encoder);

      // Get first few packets
      let packetCount = 0;
      for await (const packet of packetGenerator) {
        assert.ok(packet instanceof Packet, 'Should yield Packet objects');
        packetCount++;
        if (packetCount >= 5) break;
      }

      assert.ok(packetCount > 0, 'Should have yielded packets');
    });

    it('should return generator for named partial pipeline', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();

      if (!videoStream) {
        assert.fail('No video stream found');
      }

      using decoder = await Decoder.create(videoStream);
      using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        bitrate: '1M',
      });

      // Named partial pipeline
      const generators = pipeline({ video: input }, { video: [decoder, encoder] });

      // Should return object with generators
      assert.ok(generators.video, 'Should have video generator');
      assert.ok(generators.video[Symbol.asyncIterator], 'Video should be async generator');

      // Get first few packets
      let packetCount = 0;
      for await (const packet of generators.video) {
        assert.ok(packet instanceof Packet, 'Should yield Packet objects');
        packetCount++;
        if (packetCount >= 5) break;
      }

      assert.ok(packetCount > 0, 'Should have yielded packets');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple filters in chain', async () => {
      const outputFile = getTestOutputPath('multi-filter.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream);

        // Chain multiple filters
        using scaleFilter = await FilterAPI.create('scale=320:240', {
          timeBase: videoStream.timeBase,
          frameRate: videoStream.avgFrameRate,
        });
        using rotateFilter = await FilterAPI.create('transpose=1', {
          timeBase: videoStream.timeBase,
          frameRate: videoStream.avgFrameRate,
        });

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
        });

        const control = pipeline(input, decoder, scaleFilter, rotateFilter, encoder, output);
        await control.completion;

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should handle filter array in simple pipeline', async () => {
      const outputFile = getTestOutputPath('filter-array.mp4');

      try {
        await using input = await MediaInput.open(inputFile);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream);

        // Array of filters
        const filter1 = await FilterAPI.create('scale=320:240', {
          timeBase: videoStream.timeBase,
          frameRate: videoStream.avgFrameRate,
        });
        const filter2 = await FilterAPI.create('format=yuv420p', {
          timeBase: videoStream.timeBase,
          frameRate: videoStream.avgFrameRate,
        });
        const filters = [filter1, filter2];

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
        });

        const control = pipeline(input, decoder, filters, encoder, output);
        await control.completion;

        // Cleanup filters
        for (const f of filters) {
          f[Symbol.dispose]();
        }

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });

    it('should handle frames as source', async () => {
      const outputFile = getTestOutputPath('frames-source.mp4');

      try {
        await using output = await MediaOutput.open(outputFile);

        // Create a simple frame generator
        async function* generateFrames() {
          for (let i = 0; i < 30; i++) {
            const frame = new Frame();
            frame.alloc();
            frame.width = 320;
            frame.height = 240;
            frame.format = AV_PIX_FMT_YUV420P;
            frame.pts = BigInt(i);

            // Allocate buffer for the frame
            const ret = frame.getBuffer(0);
            if (ret < 0) {
              frame.free();
              continue;
            }

            yield frame;
          }
        }

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
          gopSize: 10,
          maxBFrames: 0,
        });

        const control = pipeline(generateFrames(), encoder, output);
        await control.completion;

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid decoder', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();

      if (!videoStream) {
        assert.fail('No video stream found');
      }

      // Create decoder but close it immediately
      const decoder = await Decoder.create(videoStream);
      decoder.close();

      // This should fail when trying to decode
      const frameGenerator = pipeline(input, decoder);

      await assert.rejects(
        async () => {
          for await (const frame of frameGenerator) {
            // Should throw before getting here
            frame.free();
            break;
          }
        },
        /closed|disposed/i,
        'Should throw error for closed decoder',
      );
    });
  });

  describe('Hardware Acceleration', skipInCI, () => {
    it('should support hardware decoder in pipeline', async function (t) {
      // Check if hardware acceleration is available
      const hw = HardwareContext.auto();
      if (!hw) {
        t.skip(); // No hardware acceleration available
        return;
      }

      // Use demux_perfect.mp4 which has yuv420p - compatible with hardware acceleration
      const outputFile = getTestOutputPath('hw-decode.mp4');

      try {
        await using input = await MediaInput.open(inputFile2);
        await using output = await MediaOutput.open(outputFile);

        const videoStream = input.video();
        if (!videoStream) {
          assert.fail('No video stream found');
        }

        using decoder = await Decoder.create(videoStream, { hardware: hw });

        using filter = await FilterAPI.create('hwdownload,format=nv12', {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
        });

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '1M',
        });

        const control = pipeline(input, decoder, filter, encoder, output);
        await control.completion;

        assert.ok(existsSync(outputFile), 'Output file should exist');
      } finally {
        cleanupTestFile(outputFile);
        hw?.dispose();
      }
    });
  });

  describe('Additional Coverage', () => {
    describe('Untested Overloads', () => {
      it('should handle stream copy with bitstream filter', async () => {
        const outputFile = getTestOutputPath('stream-copy-bsf.mp4');

        try {
          await using input = await MediaInput.open(inputFile);
          const videoStream = input.video();
          if (!videoStream) {
            assert.fail('No video stream found');
          }

          await using output = await MediaOutput.open(outputFile);

          // Create BSF for the stream
          using bsf = BitStreamFilterAPI.create('null', videoStream);

          // Stream copy with BSF: input → bsf → output
          const control = pipeline(input, bsf, output);
          await control.completion;

          assert.ok(existsSync(outputFile), 'Output file should exist');
        } finally {
          cleanupTestFile(outputFile);
        }
      });

      it('should handle frames as source with filter and encoder', async () => {
        const outputFile = getTestOutputPath('frames-filter-encode.mp4');

        try {
          await using output = await MediaOutput.open(outputFile);

          // Create a frame generator
          async function* generateFrames() {
            for (let i = 0; i < 10; i++) {
              const frame = new Frame();
              frame.alloc();
              frame.width = 320;
              frame.height = 240;
              frame.format = AV_PIX_FMT_YUV420P;
              frame.pts = BigInt(i);

              const ret = frame.getBuffer(0);
              if (ret < 0) {
                frame.free();
                continue;
              }
              yield frame;
            }
          }

          // Create filter and encoder
          using filter = await FilterAPI.create('scale=160:120', {
            timeBase: { num: 1, den: 30 },
          });

          using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
            timeBase: { num: 1, den: 30 },
            frameRate: { num: 30, den: 1 },
            bitrate: '500k',
            gopSize: 10,
            maxBFrames: 0,
          });

          // Pipeline: frames → filter → encoder → output
          const control = pipeline(generateFrames(), filter, encoder, output);
          await control.completion;

          assert.ok(existsSync(outputFile), 'Output file should exist');
        } finally {
          cleanupTestFile(outputFile);
        }
      });

      it('should handle partial pipeline with frames and filter', async () => {
        // Create a frame generator
        async function* generateFrames() {
          for (let i = 0; i < 5; i++) {
            const frame = new Frame();
            frame.alloc();
            frame.width = 320;
            frame.height = 240;
            frame.format = AV_PIX_FMT_YUV420P;
            frame.pts = BigInt(i);

            const ret = frame.getBuffer(0);
            if (ret < 0) {
              frame.free();
              continue;
            }
            yield frame;
          }
        }

        using filter = await FilterAPI.create('scale=160:120', {
          timeBase: { num: 1, den: 30 },
        });

        // Partial pipeline: frames → filter (returns frames)
        const filteredFrames = pipeline(generateFrames(), filter);

        let frameCount = 0;
        for await (const frame of filteredFrames) {
          assert.ok(frame instanceof Frame, 'Should yield Frame objects');
          assert.equal(frame.width, 160, 'Frame should be scaled to 160 width');
          assert.equal(frame.height, 120, 'Frame should be scaled to 120 height');
          frameCount++;
          frame.free();
        }

        assert.ok(frameCount > 0, 'Should have yielded filtered frames');
      });

      it('should handle partial pipeline with frames and encoder', async () => {
        // Create a frame generator
        async function* generateFrames() {
          for (let i = 0; i < 10; i++) {
            const frame = new Frame();
            frame.alloc();
            frame.width = 320;
            frame.height = 240;
            frame.format = AV_PIX_FMT_YUV420P;
            frame.pts = BigInt(i);

            const ret = frame.getBuffer(0);
            if (ret < 0) {
              frame.free();
              continue;
            }
            yield frame;
          }
        }

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
          gopSize: 10,
          maxBFrames: 0,
        });

        // Partial pipeline: frames → encoder (returns packets)
        const packets = pipeline(generateFrames(), encoder);

        let packetCount = 0;
        for await (const packet of packets) {
          assert.ok(packet instanceof Packet, 'Should yield Packet objects');
          packetCount++;
          packet.free();
          if (packetCount >= 5) break;
        }

        assert.ok(packetCount > 0, 'Should have yielded packets');
      });

      it('should handle partial pipeline with frames, filter and encoder', async () => {
        // Create a frame generator
        async function* generateFrames() {
          for (let i = 0; i < 10; i++) {
            const frame = new Frame();
            frame.alloc();
            frame.width = 320;
            frame.height = 240;
            frame.format = AV_PIX_FMT_YUV420P;
            frame.pts = BigInt(i);

            const ret = frame.getBuffer(0);
            if (ret < 0) {
              frame.free();
              continue;
            }
            yield frame;
          }
        }

        using filter = await FilterAPI.create('scale=160:120', {
          timeBase: { num: 1, den: 30 },
        });

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
          gopSize: 10,
          maxBFrames: 0,
        });

        // Partial pipeline: frames → filter → encoder (returns packets)
        const packets = pipeline(generateFrames(), filter, encoder);

        let packetCount = 0;
        for await (const packet of packets) {
          assert.ok(packet instanceof Packet, 'Should yield Packet objects');
          packetCount++;
          packet.free();
          if (packetCount >= 5) break;
        }

        assert.ok(packetCount > 0, 'Should have yielded packets');
      });
    });

    describe('Edge Cases', () => {
      // CI tests failing due to aac decoder?
      it.skip('should handle pipeline with multiple outputs in named pipeline', async () => {
        if (process.platform === 'darwin' && process.arch === 'x64') {
          console.log('Skipping test on macOS x64 due to known race condition');
          return;
        }

        const videoOutputFile = getTestOutputPath('multi-out-video.mp4');
        const audioOutputFile = getTestOutputPath('multi-out-audio.aac');

        try {
          await using input = await MediaInput.open(inputFile2);
          const videoOutput = await MediaOutput.open(videoOutputFile);
          const audioOutput = await MediaOutput.open(audioOutputFile);

          const videoStream = input.video();
          const audioStream = input.audio();

          if (!videoStream || !audioStream) {
            assert.fail('Missing video or audio stream');
          }

          // Create decoders and encoders
          const videoDecoder = await Decoder.create(videoStream);
          const audioDecoder = await Decoder.create(audioStream);

          const videoEncoder = await Encoder.create(FF_ENCODER_LIBX264, {
            timeBase: { num: 1, den: 30 },
            frameRate: { num: 30, den: 1 },
            bitrate: '500k',
          });

          const audioEncoder = await Encoder.create(FF_ENCODER_AAC, {
            timeBase: { num: 1, den: 44100 },
            bitrate: '128k',
          });

          // Named pipeline with multiple outputs
          const control = pipeline(
            { video: input, audio: input },
            {
              video: [videoDecoder, videoEncoder],
              audio: [audioDecoder, audioEncoder],
            },
            { video: videoOutput, audio: audioOutput },
          );

          await control.completion;

          assert.ok(existsSync(videoOutputFile), 'Video output file should exist');
          assert.ok(existsSync(audioOutputFile), 'Audio output file should exist');

          // Close outputs manually since they're not in using statements
          await videoOutput.close();
          await audioOutput.close();
          videoDecoder.close();
          audioDecoder.close();
          videoEncoder.close();
          audioEncoder.close();
        } finally {
          cleanupTestFile(videoOutputFile);
          cleanupTestFile(audioOutputFile);
        }
      });

      it('should handle stop() during processing', async () => {
        const outputFile = getTestOutputPath('stopped-early.mp4');

        try {
          await using input = await MediaInput.open(inputFile);
          await using output = await MediaOutput.open(outputFile);

          const videoStream = input.video();
          if (!videoStream) {
            assert.fail('No video stream found');
          }

          using decoder = await Decoder.create(videoStream);
          using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
            timeBase: { num: 1, den: 30 },
            frameRate: { num: 30, den: 1 },
            bitrate: '1M',
          });

          const control = pipeline(input, decoder, encoder, output);

          // Stop immediately
          control.stop();

          await control.completion;

          assert.ok(control.isStopped(), 'Pipeline should be stopped');

          // Check that output file exists but is smaller than expected
          assert.ok(existsSync(outputFile), 'Output file should exist');
          const stats = statSync(outputFile);
          // File should be small since we stopped immediately
          assert.ok(stats.size < 50000, 'Output file should be small due to early stop');
        } finally {
          cleanupTestFile(outputFile);
        }
      });

      it('should handle empty input gracefully', async () => {
        // Create an empty frame generator
        async function* emptyFrames(): AsyncGenerator<Frame> {
          // Yield nothing
        }

        using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
          bitrate: '500k',
        });

        // Partial pipeline with empty input
        const packets = pipeline(emptyFrames(), encoder);

        let packetCount = 0;
        for await (const packet of packets) {
          packetCount++;
          packet.free();
        }

        assert.equal(packetCount, 0, 'Should yield no packets for empty input');
      });
    });

    describe('Performance and Memory', () => {
      it('should handle large number of frames without memory leak', async () => {
        const outputFile = getTestOutputPath('large-frames.mp4');

        try {
          await using output = await MediaOutput.open(outputFile);

          // Generate many frames
          async function* generateManyFrames() {
            for (let i = 0; i < 100; i++) {
              const frame = new Frame();
              frame.alloc();
              frame.width = 320;
              frame.height = 240;
              frame.format = AV_PIX_FMT_YUV420P;
              frame.pts = BigInt(i);

              const ret = frame.getBuffer(0);
              if (ret < 0) {
                frame.free();
                continue;
              }
              yield frame;
            }
          }

          using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
            timeBase: { num: 1, den: 30 },
            frameRate: { num: 30, den: 1 },
            bitrate: '500k',
            gopSize: 30,
            maxBFrames: 0,
          });

          const control = pipeline(generateManyFrames(), encoder, output);
          await control.completion;

          assert.ok(existsSync(outputFile), 'Output file should exist');

          // Check file has reasonable size (should have encoded frames)
          const stats = statSync(outputFile);
          assert.ok(stats.size > 1000, 'Output file should have content');
        } finally {
          cleanupTestFile(outputFile);
        }
      });
    });
  });
});
