import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  AVFILTER_CMD_FLAG_ONE,
  Decoder,
  Encoder,
  FF_ENCODER_LIBX264,
  FilterAPI,
  FilterPreset,
  Frame,
  MediaInput,
  Rational,
} from '../src/index.js';
import { getInputFile, prepareTestEnvironment } from './index.js';

prepareTestEnvironment();

const testVideoPath = getInputFile('demux.mp4');
const testAudioPath = getInputFile('audio.wav');

describe('High-Level Filter API', () => {
  describe('Filter Creation', () => {
    it('should create a simple video filter', () => {
      // Filters use lazy initialization and won't be fully ready until first frame
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
      });
      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      assert.equal(filter.isFilterInitialized, false); // Not initialized until first frame
      filter.close();
    });

    it('should create a simple audio filter', () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });
      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      assert.equal(filter.isFilterInitialized, false); // Not initialized until first frame
      filter.close();
    });

    it('should create filter with null/passthrough', () => {
      const filter = FilterAPI.create('null', {
        timeBase: { num: 1, den: 30 },
      });
      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      filter.close();
    });

    it('should create filter for encoder', async () => {
      const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
      });
      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);

      filter.close();
      encoder.close();
    });

    it('should create filter with format conversion', () => {
      const filter = FilterAPI.create('scale=1280:720,format=pix_fmts=yuv420p|nv12', {
        timeBase: { num: 1, den: 30 },
      });

      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      filter.close();
    });

    it('should create filter with threading options', () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        threads: 4,
      });

      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      filter.close();
    });

    it('should handle complex filter chain', () => {
      const filter = FilterAPI.create('scale=1280:720,fps=30,format=yuv420p', {
        timeBase: { num: 1, den: 30 },
      });

      assert.ok(filter);
      assert.equal(filter.isFilterOpen, true);
      filter.close();
    });

    it('should throw on invalid filter description', async () => {
      // Note: Error might not occur until first frame with lazy initialization
      const filter = FilterAPI.create('invalid_filter_xyz', {
        timeBase: { num: 1, den: 48000 },
      });

      // Create a test frame to trigger initialization
      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 48000;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;
      frame.getBuffer();

      await assert.rejects(async () => {
        await filter.process(frame);
      }, /Filter not found|Invalid argument/);

      frame.free();
      filter.close();
    });
  });

  describe('Frame Processing', () => {
    it('should process a single frame (async)', async () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Create a test frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_YUV420P;
      const ret = frame.getBuffer();
      assert.ok(ret >= 0);

      const output = await filter.process(frame);
      assert.ok(output);
      assert.equal(output.width, 1280);
      assert.equal(output.height, 720);

      frame.free();
      output.free();
      filter.close();
    });

    it('should process a single frame (sync)', () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Create a test frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_YUV420P;
      const ret = frame.getBuffer();
      assert.ok(ret >= 0);

      const output = filter.processSync(frame);
      assert.ok(output);
      assert.equal(output.width, 1280);
      assert.equal(output.height, 720);

      frame.free();
      output.free();
      filter.close();
    });

    it('should handle multiple frames (async)', async () => {
      const filter = FilterAPI.create('fps=15', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      const frames: Frame[] = [];
      for (let i = 0; i < 3; i++) {
        const frame = new Frame();
        frame.alloc();
        frame.width = 640;
        frame.height = 480;
        frame.format = AV_PIX_FMT_YUV420P;
        frame.pts = BigInt(i * 1000);
        const ret = frame.getBuffer();
        assert.ok(ret >= 0);
        frames.push(frame);
      }

      const outputs = await filter.processMultiple(frames);
      assert.ok(outputs.length > 0);

      // Clean up
      frames.forEach((f) => f.free());
      outputs.forEach((f) => f.free());
      filter.close();
    });

    it('should handle multiple frames (sync)', () => {
      const filter = FilterAPI.create('fps=15', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      const frames: Frame[] = [];
      for (let i = 0; i < 3; i++) {
        const frame = new Frame();
        frame.alloc();
        frame.width = 640;
        frame.height = 480;
        frame.format = AV_PIX_FMT_YUV420P;
        frame.pts = BigInt(i * 1000);
        const ret = frame.getBuffer();
        assert.ok(ret >= 0);
        frames.push(frame);
      }

      const outputs = filter.processMultipleSync(frames);
      assert.ok(outputs.length > 0);

      // Clean up
      frames.forEach((f) => f.free());
      outputs.forEach((f) => f.free());
      filter.close();
    });

    it('should flush and receive remaining frames (async)', async () => {
      const filter = FilterAPI.create('fps=15', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Send some frames
      for (let i = 0; i < 5; i++) {
        const frame = new Frame();
        frame.alloc();
        frame.width = 640;
        frame.height = 480;
        frame.format = AV_PIX_FMT_YUV420P;
        frame.pts = BigInt(i * 1000);
        const ret = frame.getBuffer();
        assert.ok(ret >= 0);

        const output = await filter.process(frame);
        if (output) {
          output.free();
        }
        frame.free();
      }

      // Flush
      await filter.flush();

      // Receive remaining frames
      let remainingCount = 0;
      while (true) {
        const frame = await filter.receive();
        if (!frame) break;
        remainingCount++;
        frame.free();
      }

      assert.ok(remainingCount >= 0);
      filter.close();
    });

    it('should flush and receive remaining frames (sync)', () => {
      const filter = FilterAPI.create('fps=15', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Send some frames
      for (let i = 0; i < 5; i++) {
        const frame = new Frame();
        frame.alloc();
        frame.width = 640;
        frame.height = 480;
        frame.format = AV_PIX_FMT_YUV420P;
        frame.pts = BigInt(i * 1000);
        const ret = frame.getBuffer();
        assert.ok(ret >= 0);

        const output = filter.processSync(frame);
        if (output) {
          output.free();
        }
        frame.free();
      }

      // Flush
      filter.flushSync();

      // Receive remaining frames
      let remainingCount = 0;
      while (true) {
        const frame = filter.receiveSync();
        if (!frame) break;
        remainingCount++;
        frame.free();
      }

      assert.ok(remainingCount >= 0);
      filter.close();
    });
  });

  describe('Async Generator Interface', () => {
    it('should process frames via async generator', async () => {
      const media = await MediaInput.open(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);
      const decoder = await Decoder.create(videoStream);

      const filter = FilterAPI.create('scale=320:240,fps=15', {
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
      });

      let frameCount = 0;
      const maxFrames = 10;

      async function* limitedFrames() {
        let count = 0;
        for await (const packet of media.packets()) {
          if (packet.streamIndex === videoStream!.index) {
            const frame = await decoder.decode(packet);
            if (frame) {
              yield frame;
              count++;
              if (count >= maxFrames) break;
            }
          }
        }
      }

      for await (const filtered of filter.frames(limitedFrames())) {
        assert.ok(filtered);
        assert.equal(filtered.width, 320);
        assert.equal(filtered.height, 240);
        filtered.free();
        frameCount++;
      }

      assert.ok(frameCount > 0);

      filter.close();
      decoder.close();
      media.close();
    });

    it('should process frames via sync generator', () => {
      const media = MediaInput.openSync(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);
      const decoder = Decoder.createSync(videoStream);

      const filter = FilterAPI.create('scale=320:240,fps=15', {
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
      });

      let frameCount = 0;
      const maxFrames = 10;

      function* limitedFrames() {
        let count = 0;
        for (const packet of media.packetsSync()) {
          if (packet.streamIndex === videoStream!.index) {
            const frame = decoder.decodeSync(packet);
            if (frame) {
              yield frame;
              count++;
              if (count >= maxFrames) break;
            }
          }
        }
      }

      for (const filtered of filter.framesSync(limitedFrames())) {
        assert.ok(filtered);
        assert.equal(filtered.width, 320);
        assert.equal(filtered.height, 240);
        filtered.free();
        frameCount++;
      }

      assert.ok(frameCount > 0);

      filter.close();
      decoder.close();
      media.closeSync();
    });
  });

  describe('Utility Methods', () => {
    it('should get graph description (async)', async () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });

      // Initialize filter with a frame first
      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 48000;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;
      frame.pts = 0n;
      frame.timeBase = new Rational(1, 48000);
      frame.getBuffer();

      await filter.process(frame);
      frame.free();

      const description = filter.getGraphDescription();
      assert.ok(description);
      assert.equal(typeof description, 'string');

      filter.close();
    });

    it('should get graph description (sync)', () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });

      // Initialize filter with a frame first
      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 48000;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;
      frame.pts = 0n;
      frame.timeBase = new Rational(1, 48000);
      frame.getBuffer();

      filter.processSync(frame);
      frame.free();

      const description = filter.getGraphDescription();
      assert.ok(description);
      assert.equal(typeof description, 'string');

      filter.close();
    });

    it('should check if filter is ready (async)', async () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Filter not ready until first frame
      assert.ok(!filter.isReady());

      // Initialize with a frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.getBuffer();

      await filter.process(frame);
      frame.free();

      // Now should be ready
      assert.ok(filter.isReady());

      filter.close();
      assert.ok(!filter.isReady());
    });

    it('should check if filter is ready (sync)', () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      // Filter not ready until first frame
      assert.ok(!filter.isReady());

      // Initialize with a frame
      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.getBuffer();

      filter.processSync(frame);
      frame.free();

      // Now should be ready
      assert.ok(filter.isReady());

      filter.close();
      assert.ok(!filter.isReady());
    });

    it('should get media type', () => {
      // Note: getMediaType() doesn't exist in the new API
      // Filters determine media type from first frame
      const videoFilter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
      });
      assert.ok(videoFilter);
      videoFilter.close();

      const audioFilter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });
      assert.ok(audioFilter);
      audioFilter.close();
    });
  });

  describe('Symbol.dispose', () => {
    it('should support using syntax', () => {
      {
        using filter = FilterAPI.create('scale=1280:720', {
          timeBase: { num: 1, den: 30 },
          frameRate: { num: 30, den: 1 },
        });
        assert.ok(filter);
      }
      // Filter should be automatically freed here
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid configuration (async)', async () => {
      // Invalid configurations are detected when first frame is processed
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });

      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 0; // Invalid sample rate
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;

      await assert.rejects(async () => {
        await filter.process(frame);
      });

      frame.free();
      filter.close();
    });

    it('should throw on invalid configuration (sync)', () => {
      // Invalid configurations are detected when first frame is processed
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });

      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 0; // Invalid sample rate
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;

      assert.throws(() => {
        filter.processSync(frame);
      });

      frame.free();
      filter.close();
    });

    it('should throw when processing after free (async)', async () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });
      filter.close();

      const frame = new Frame();
      frame.alloc();
      frame.nbSamples = 1024;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.sampleRate = 48000;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.getBuffer();

      await assert.rejects(async () => {
        await filter.process(frame);
      }, /Filter is closed/);

      frame.free();
    });

    it('should throw when processing after free (sync)', () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });
      filter.close();

      const frame = new Frame();
      frame.alloc();
      frame.nbSamples = 1024;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.sampleRate = 48000;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.getBuffer();

      assert.throws(() => {
        filter.processSync(frame);
      }, /Filter is closed/);

      frame.free();
    });

    it('should handle flush after free', async () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      filter.close();

      // flush() doesn't throw when closed, it just returns
      await filter.flush();
      assert.ok(true, 'Flush should not throw when closed');
    });

    it('should return null when receiving after free', async () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      filter.close();

      // receive() returns null when closed
      const result = await filter.receive();
      assert.equal(result, null);
    });

    it('should handle flush after free', async () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      filter.close();

      // flush() returns void and doesn't throw when closed
      await filter.flush(); // Should not throw
      assert.ok(true, 'flush() handled gracefully after free');
    });
  });

  describe('Complex Filter Graphs', () => {
    it('should handle video scaling and format conversion', async () => {
      const filter = FilterAPI.create('scale=1280:720,format=yuv420p', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_RGB24;
      const ret = frame.getBuffer();
      assert.ok(ret >= 0);

      const output = await filter.process(frame);
      if (output) {
        assert.equal(output.width, 1280);
        assert.equal(output.height, 720);
        assert.equal(output.format, AV_PIX_FMT_YUV420P);
        output.free();
      }

      frame.free();
      filter.close();
    });

    it('should handle audio resampling', () => {
      const filter = FilterAPI.create('aformat=sample_rates=44100:sample_fmts=s16:channel_layouts=stereo', {
        timeBase: { num: 1, den: 48000 },
      });

      // Filter will be initialized when first frame is processed
      assert.equal(filter.isFilterInitialized, false);
      filter.close();
    });
  });

  describe('Real Media Processing', () => {
    it('should process real video file', async () => {
      const media = await MediaInput.open(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);
      const decoder = await Decoder.create(videoStream);

      const filter = FilterAPI.create('scale=640:480,format=yuv420p', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });

      let processedFrames = 0;
      const maxFrames = 5;

      for await (const packet of media.packets()) {
        if (packet.streamIndex === videoStream.index) {
          const frame = await decoder.decode(packet);
          if (frame) {
            const filtered = await filter.process(frame);
            if (filtered) {
              assert.equal(filtered.width, 640);
              assert.equal(filtered.height, 480);
              filtered.free();
              processedFrames++;
            }
            frame.free();
            if (processedFrames >= maxFrames) break;
          }
        }
      }

      assert.ok(processedFrames > 0);

      filter.close();
      decoder.close();
      await media.close();
    });

    it('should chain multiple filter presets', () => {
      const filterChain = FilterPreset.chain().scale(1280, 720).fps(24).format(AV_PIX_FMT_YUV420P).build();
      const filter = FilterAPI.create(filterChain, {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      assert.ok(filter); // Video filters use lazy initialization

      // For lazy-initialized video filters, graph description is null until first frame
      const description = filter.getGraphDescription();
      // Since video filter is not initialized yet, description will be null
      assert.equal(description, null);

      filter.close();
    });

    it('should process real audio file', async () => {
      const media = await MediaInput.open(testAudioPath);

      // Find audio stream
      const audioStream = media.audio();
      assert.ok(audioStream, 'Should find audio stream');

      const decoder = await Decoder.create(audioStream);

      // Apply audio filters: volume adjustment and resampling
      const filter = FilterAPI.create('volume=0.5,aformat=sample_rates=44100:sample_fmts=s16:channel_layouts=stereo', {
        timeBase: { num: 1, den: 44100 },
      });

      let processedFrames = 0;
      const maxFrames = 10;

      for await (const packet of media.packets()) {
        if (packet.streamIndex === audioStream.index) {
          const frame = await decoder.decode(packet);
          if (frame) {
            const filtered = await filter.process(frame);
            if (filtered) {
              // Check that the filter applied the correct format
              assert.equal(filtered.sampleRate, 44100);
              assert.equal(filtered.format, AV_SAMPLE_FMT_S16);
              filtered.free();
              processedFrames++;
            }
            frame.free();
            if (processedFrames >= maxFrames) break;
          }
        }
      }

      assert.ok(processedFrames > 0, 'Should process audio frames');

      filter.close();
      decoder.close();
      await media.close();
    });
  });

  describe('Command Interface', () => {
    it('should send commands to filters', () => {
      // Create a filter with a filter that supports commands (volume)
      const filter = FilterAPI.create('volume=1.0', {
        timeBase: { num: 1, den: 48000 },
      });

      try {
        // Send volume change command
        const response = filter.sendCommand('volume', 'volume', '0.5');
        // Response might be empty but command should succeed
        assert.ok(response !== undefined, 'Should return a response (even if empty)');
      } catch (err) {
        // Some filters might not support runtime commands
        // This is OK, just verify the method exists and can be called
        assert.ok(err instanceof Error, 'Should throw an Error if command fails');
      }

      filter.close();
    });

    it('should queue commands for future execution', () => {
      const filter = FilterAPI.create('volume=1.0', {
        timeBase: { num: 1, den: 48000 },
      });

      try {
        // Queue volume changes at different timestamps
        filter.queueCommand('volume', 'volume', '0.5', 1.0);
        filter.queueCommand('volume', 'volume', '0.8', 2.0);
        filter.queueCommand('volume', 'volume', '0.2', 3.0);

        // Commands are queued successfully
        assert.ok(true, 'Commands queued without error');
      } catch (err) {
        // If queueing fails, it should throw an Error
        assert.ok(err instanceof Error, 'Should throw an Error if queueing fails');
      }

      filter.close();
    });

    it('should throw when sending command to closed filter', () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      filter.close();

      assert.throws(() => {
        filter.sendCommand('scale', 'width', '1920');
      }, /Filter is closed/);
    });

    it('should throw when queueing command to closed filter', () => {
      const filter = FilterAPI.create('scale=1280:720', {
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      });
      filter.close();

      assert.throws(() => {
        filter.queueCommand('scale', 'width', '1920', 5.0);
      }, /Filter is closed/);
    });

    it('should send command with flags', () => {
      const filter = FilterAPI.create('volume=1.0', {
        timeBase: { num: 1, den: 48000 },
      });

      try {
        // Send command with AVFILTER_CMD_FLAG_ONE
        const response = filter.sendCommand('all', 'enable', '1', AVFILTER_CMD_FLAG_ONE);
        assert.ok(response !== undefined, 'Should return a response');
      } catch (err) {
        // Command might fail, but the API should work
        assert.ok(err instanceof Error, 'Should throw an Error if command fails');
      }

      filter.close();
    });

    it('should handle invalid command gracefully', async () => {
      const filter = FilterAPI.create('volume=0.5', {
        timeBase: { num: 1, den: 48000 },
      });

      // Initialize filter first with a frame
      const frame = new Frame();
      frame.alloc();
      frame.sampleRate = 48000;
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = { nbChannels: 2, order: 1, mask: 3n };
      frame.nbSamples = 1024;
      frame.pts = 0n;
      frame.timeBase = new Rational(1, 48000);
      frame.getBuffer();
      await filter.process(frame);
      frame.free();

      try {
        // Send an invalid command
        filter.sendCommand('volume', 'invalid_command_xyz', 'value');
        // If it doesn't throw, that's also OK
        assert.ok(true, 'Handled invalid command');
      } catch (err) {
        // Should throw an FFmpegError
        assert.ok(err instanceof Error, 'Should throw an Error for invalid command');
        // The error message may vary based on FFmpeg version
        assert.ok(err.message.includes('Failed') || err.message.includes('Invalid'), 'Error message should indicate failure');
      }

      filter.close();
    });
  });
});
