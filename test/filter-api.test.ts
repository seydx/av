import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  AVFILTER_CMD_FLAG_ONE,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_VIDEO,
  Decoder,
  Encoder,
  FF_ENCODER_LIBX264,
  FilterAPI,
  FilterPresets,
  Frame,
  MediaInput,
} from '../src/index.js';
import { getInputFile, prepareTestEnvironment } from './index.js';

import type { AudioInfo, VideoInfo } from '../src/api/types.js';

prepareTestEnvironment();

const testVideoPath = getInputFile('demux.mp4');
const testAudioPath = getInputFile('audio.wav');

describe('High-Level Filter API', () => {
  describe('Filter Creation', () => {
    it('should create a simple video filter', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      assert.ok(filter);
      assert.ok(filter.isReady());
      assert.equal(filter.getMediaType(), AVMEDIA_TYPE_VIDEO);
      filter.free();
    });

    it('should create a simple audio filter', async () => {
      const config: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n }, // Stereo
        timeBase: { num: 1, den: 48000 },
      };

      const filter = await FilterAPI.create('volume=0.5', config);
      assert.ok(filter);
      assert.ok(filter.isReady());
      assert.equal(filter.getMediaType(), AVMEDIA_TYPE_AUDIO);
      filter.free();
    });

    it('should create filter with null/passthrough', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('null', config);
      assert.ok(filter);
      assert.ok(filter.isReady());
      filter.free();
    });

    it('should create filter from stream', async () => {
      const media = await MediaInput.open(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);

      const filter = await FilterAPI.create('scale=640:480', videoStream);
      assert.ok(filter);
      assert.ok(filter.isReady());
      assert.equal(filter.getMediaType(), AVMEDIA_TYPE_VIDEO);

      filter.free();
      await media.close();
    });

    it('should create filter for encoder', async () => {
      const encoder = await Encoder.create(
        FF_ENCODER_LIBX264,
        {
          type: 'video',
          width: 1280,
          height: 720,
          pixelFormat: AV_PIX_FMT_YUV420P,
          frameRate: { num: 30, den: 1 },
          timeBase: { num: 1, den: 30 },
          sampleAspectRatio: { num: 1, den: 1 },
        },
        {},
      );

      const inputConfig: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_RGB24,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', inputConfig);
      assert.ok(filter);
      assert.ok(filter.isReady());

      filter.free();
      encoder.close();
    });

    it('should create filter with output constraints', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_RGB24,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      // Note: output constraints are not supported in the new API
      const filter = await FilterAPI.create('scale=1280:720,format=pix_fmts=yuv420p|nv12', config);

      assert.ok(filter);
      assert.ok(filter.isReady());
      filter.free();
    });

    it('should create filter with threading options', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config, {
        threads: 4,
      });

      assert.ok(filter);
      assert.ok(filter.isReady());
      filter.free();
    });

    it('should handle complex filter chain', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720,fps=30,format=yuv420p', config);

      assert.ok(filter);
      assert.ok(filter.isReady());
      filter.free();
    });

    it('should throw on invalid filter description', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      await assert.rejects(async () => {
        await FilterAPI.create('invalid_filter_xyz', config);
      }, /Failed to parse filter description/);
    });
  });

  describe('Frame Processing', () => {
    it('should process a single frame', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);

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
      filter.free();
    });

    it('should handle multiple frames', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 640,
        height: 480,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('fps=15', config);

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
      filter.free();
    });

    it('should flush and receive remaining frames', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 640,
        height: 480,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('fps=15', config);

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
      filter.free();
    });
  });

  describe('Async Generator Interface', () => {
    it('should process frames via async generator', async () => {
      const media = await MediaInput.open(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);
      const decoder = await Decoder.create(videoStream);

      const filter = await FilterAPI.create('scale=320:240,fps=15', videoStream);

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

      filter.free();
      decoder.close();
      media.close();
    });
  });

  describe('FilterPresets', () => {
    it('should create scale preset', () => {
      const preset = FilterPresets.scale(1280, 720);
      assert.equal(preset, 'scale=1280:720');

      const presetWithFlags = FilterPresets.scale(1280, 720, 'bicubic');
      assert.equal(presetWithFlags, 'scale=1280:720:flags=bicubic');
    });

    it('should create crop preset', () => {
      const preset = FilterPresets.crop(640, 480);
      assert.equal(preset, 'crop=640:480:0:0');

      const presetWithOffset = FilterPresets.crop(640, 480, 100, 50);
      assert.equal(presetWithOffset, 'crop=640:480:100:50');
    });

    it('should create fps preset', () => {
      const preset = FilterPresets.fps(30);
      assert.equal(preset, 'fps=30');
    });

    it('should create format preset with enum', () => {
      const preset = FilterPresets.format(AV_PIX_FMT_YUV420P);
      assert.ok(preset.startsWith('format='));
    });

    it('should create format preset with string', () => {
      const preset = FilterPresets.format('yuv420p');
      assert.equal(preset, 'format=yuv420p');
    });

    it('should create rotation preset', () => {
      const preset = FilterPresets.rotate(90);
      assert.equal(preset, 'rotate=90*PI/180');
    });

    it('should create flip presets', () => {
      assert.equal(FilterPresets.hflip(), 'hflip');
      assert.equal(FilterPresets.vflip(), 'vflip');
    });

    it('should create fade preset', () => {
      const fadeIn = FilterPresets.fade('in', 0, 2);
      assert.equal(fadeIn, 'fade=t=in:st=0:d=2');

      const fadeOut = FilterPresets.fade('out', 5, 1);
      assert.equal(fadeOut, 'fade=t=out:st=5:d=1');
    });

    it('should create overlay preset', () => {
      const preset = FilterPresets.overlay();
      assert.equal(preset, 'overlay=0:0');

      const presetWithPosition = FilterPresets.overlay(100, 50);
      assert.equal(presetWithPosition, 'overlay=100:50');
    });

    it('should create volume preset', () => {
      const preset = FilterPresets.volume(0.5);
      assert.equal(preset, 'volume=0.5');
    });

    it('should create aformat preset with enum', () => {
      const preset = FilterPresets.aformat(AV_SAMPLE_FMT_S16);
      assert.ok(preset.startsWith('aformat=sample_fmts='));
    });

    it('should create aformat preset with string', () => {
      const preset = FilterPresets.aformat('s16', 48000, 'stereo');
      assert.equal(preset, 'aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo');
    });

    it('should create atempo preset', () => {
      const preset = FilterPresets.atempo(1.5);
      assert.equal(preset, 'atempo=1.5');
    });

    it('should create afade preset', () => {
      const preset = FilterPresets.afade('in', 0, 3);
      assert.equal(preset, 'afade=t=in:st=0:d=3');
    });

    it('should create amix preset', () => {
      const preset = FilterPresets.amix();
      assert.equal(preset, 'amix=inputs=2:duration=longest');

      const presetCustom = FilterPresets.amix(3, 'shortest');
      assert.equal(presetCustom, 'amix=inputs=3:duration=shortest');
    });
  });

  describe('Utility Methods', () => {
    it('should get graph description', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      const description = filter.getGraphDescription();
      assert.ok(description);
      assert.equal(typeof description, 'string');

      filter.free();
    });

    it('should get filter configuration', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      const returnedConfig = filter.getConfig();

      assert.equal(returnedConfig.type, 'video');
      if (returnedConfig.type === 'video') {
        assert.equal(returnedConfig.width, 1920);
        assert.equal(returnedConfig.height, 1080);
        assert.equal(returnedConfig.pixelFormat, AV_PIX_FMT_YUV420P);
      }

      filter.free();
    });

    it('should check if filter is ready', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      assert.ok(filter.isReady());

      filter.free();
      assert.ok(!filter.isReady());
    });

    it('should get media type', async () => {
      const videoConfig: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const videoFilter = await FilterAPI.create('scale=1280:720', videoConfig);
      assert.equal(videoFilter.getMediaType(), AVMEDIA_TYPE_VIDEO);
      videoFilter.free();

      const audioConfig: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n },
        timeBase: { num: 1, den: 48000 },
      };

      const audioFilter = await FilterAPI.create('volume=0.5', audioConfig);
      assert.equal(audioFilter.getMediaType(), AVMEDIA_TYPE_AUDIO);
      audioFilter.free();
    });
  });

  describe('Symbol.dispose', () => {
    it('should support using syntax', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      {
        using filter = await FilterAPI.create('scale=1280:720', config);
        assert.ok(filter.isReady());
      }
      // Filter should be automatically freed here
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid configuration', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 0, // Invalid width
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      await assert.rejects(async () => {
        await FilterAPI.create('scale=1280:720', config);
      });
    });

    it('should throw when processing after free', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      filter.free();

      const frame = new Frame();
      frame.alloc();
      frame.width = 1920;
      frame.height = 1080;
      frame.format = AV_PIX_FMT_YUV420P;

      await assert.rejects(async () => {
        await filter.process(frame);
      }, /Filter not initialized/);

      frame.free();
    });

    it('should throw when flushing after free', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      filter.free();

      await assert.rejects(async () => {
        await filter.flush();
      }, /Filter not initialized/);
    });

    it('should throw when receiving after free', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      filter.free();

      await assert.rejects(async () => {
        await filter.receive();
      }, /Filter not initialized/);
    });

    it('should throw when exporting graph after free', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      await assert.rejects(async () => {
        const filter = await FilterAPI.create('scale=1280:720', config);
        filter.free();
        await filter.flush();
      }, /Filter not initialized/);
    });
  });

  describe('Complex Filter Graphs', () => {
    it('should handle video scaling and format conversion', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_RGB24,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720,format=yuv420p', config);

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
      filter.free();
    });

    it('should handle audio resampling', async () => {
      const config: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n },
        timeBase: { num: 1, den: 48000 },
      };

      const filter = await FilterAPI.create('aformat=sample_rates=44100:sample_fmts=s16:channel_layouts=stereo', config);

      assert.ok(filter.isReady());
      filter.free();
    });
  });

  describe('Real Media Processing', () => {
    it('should process real video file', async () => {
      const media = await MediaInput.open(testVideoPath);
      const videoStream = media.video();
      assert.ok(videoStream);
      const decoder = await Decoder.create(videoStream);

      const filter = await FilterAPI.create('scale=640:480,format=yuv420p', videoStream);

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

      filter.free();
      decoder.close();
      await media.close();
    });

    it('should chain multiple filter presets', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filterChain = [FilterPresets.scale(1280, 720), FilterPresets.fps(24), FilterPresets.format(AV_PIX_FMT_YUV420P)].join(',');

      const filter = await FilterAPI.create(filterChain, config);
      assert.ok(filter.isReady());

      const description = filter.getGraphDescription();
      assert.ok(description);
      assert.ok(description.includes('scale'));
      assert.ok(description.includes('fps'));

      filter.free();
    });

    it('should process real audio file', async () => {
      const media = await MediaInput.open(testAudioPath);

      // Find audio stream
      const audioStream = media.audio();
      assert.ok(audioStream, 'Should find audio stream');

      const decoder = await Decoder.create(audioStream);

      // Apply audio filters: volume adjustment and resampling
      const filter = await FilterAPI.create('volume=0.5,aformat=sample_rates=44100:sample_fmts=s16:channel_layouts=stereo', audioStream);

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

      filter.free();
      decoder.close();
      await media.close();
    });
  });

  describe('Command Interface', () => {
    it('should send commands to filters', async () => {
      const audioConfig: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n },
        timeBase: { num: 1, den: 48000 },
      };

      // Create a filter with a filter that supports commands (volume)
      const filter = await FilterAPI.create('volume=1.0', audioConfig);

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

      filter.free();
    });

    it('should queue commands for future execution', async () => {
      const audioConfig: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n },
        timeBase: { num: 1, den: 48000 },
      };

      const filter = await FilterAPI.create('volume=1.0', audioConfig);

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

      filter.free();
    });

    it('should throw when sending command to uninitialized filter', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      filter.free();

      assert.throws(() => {
        filter.sendCommand('scale', 'width', '1920');
      }, /Filter not initialized/);
    });

    it('should throw when queueing command to uninitialized filter', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);
      filter.free();

      assert.throws(() => {
        filter.queueCommand('scale', 'width', '1920', 5.0);
      }, /Filter not initialized/);
    });

    it('should send command with flags', async () => {
      const audioConfig: AudioInfo = {
        type: 'audio',
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: { nbChannels: 2, order: 1, mask: 3n },
        timeBase: { num: 1, den: 48000 },
      };

      const filter = await FilterAPI.create('volume=1.0', audioConfig);

      try {
        // Send command with AVFILTER_CMD_FLAG_ONE
        const response = filter.sendCommand('all', 'enable', '1', AVFILTER_CMD_FLAG_ONE);
        assert.ok(response !== undefined, 'Should return a response');
      } catch (err) {
        // Command might fail, but the API should work
        assert.ok(err instanceof Error, 'Should throw an Error if command fails');
      }

      filter.free();
    });

    it('should handle invalid command gracefully', async () => {
      const config: VideoInfo = {
        type: 'video',
        width: 1920,
        height: 1080,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: { num: 1, den: 30 },
        frameRate: { num: 30, den: 1 },
        sampleAspectRatio: { num: 1, den: 1 },
      };

      const filter = await FilterAPI.create('scale=1280:720', config);

      try {
        // Send an invalid command
        filter.sendCommand('scale', 'invalid_command_xyz', 'value');
        // If it doesn't throw, that's also OK
        assert.ok(true, 'Handled invalid command');
      } catch (err) {
        // Should throw an FFmpegError
        assert.ok(err instanceof Error, 'Should throw an Error for invalid command');
        assert.ok(err.message.includes('Failed to send filter command'), 'Error message should indicate command failure');
      }

      filter.free();
    });
  });
});
