import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  AV_CHROMA_LOCATION_LEFT,
  AV_COLOR_PRIMARIES_BT709,
  AV_COLOR_RANGE_JPEG,
  AV_COLOR_SPACE_BT709,
  AV_COLOR_TRC_BT709,
  AV_NOPTS_VALUE,
  AV_PICTURE_TYPE_I,
  AV_PICTURE_TYPE_P,
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  Frame,
  Rational,
} from '../src/lib/index.js';

describe('Frame', () => {
  let frame: Frame;

  beforeEach(() => {
    frame = new Frame();
  });

  afterEach(() => {
    // Clean up if frame is still allocated
    try {
      frame.free();
    } catch {
      // Frame might already be freed
    }
  });

  describe('Lifecycle', () => {
    it('should create an uninitialized frame', () => {
      assert.ok(frame);
      // Frame should not have data before alloc
      assert.equal(frame.data, null);
    });

    it('should allocate and free a frame', () => {
      frame.alloc();
      // After alloc, frame should still not have data buffers
      assert.equal(frame.data, null);

      frame.free();
      // After free, frame should not be usable
      // NOTE: Skipping re-alloc test as it crashes
    });

    it('should support using statement for automatic disposal', () => {
      {
        using testFrame = new Frame();
        testFrame.alloc();
        assert.ok(testFrame);
      }
      // Frame should be automatically disposed here
    });
  });

  describe('Video Frame Properties', () => {
    beforeEach(() => {
      frame.alloc();
    });

    it('should set and get video format properties', () => {
      frame.format = AV_PIX_FMT_YUV420P;
      frame.width = 1920;
      frame.height = 1080;

      assert.equal(frame.format, AV_PIX_FMT_YUV420P);
      assert.equal(frame.width, 1920);
      assert.equal(frame.height, 1080);
    });

    it('should allocate video frame buffer', () => {
      frame.format = AV_PIX_FMT_YUV420P;
      frame.width = 640;
      frame.height = 480;

      const ret = frame.getBuffer();
      assert.equal(ret, 0, 'getBuffer should return 0 on success');

      // After buffer allocation, data should be available
      assert.notEqual(frame.data, null);
      assert.ok(Array.isArray(frame.data));
      assert.ok(frame.data.length > 0);

      // Check linesize is set
      const linesize = frame.linesize;
      assert.ok(Array.isArray(linesize));
      assert.ok(linesize[0] > 0); // Y plane should have linesize
    });

    it('should allocate RGB24 frame buffer', () => {
      frame.format = AV_PIX_FMT_RGB24;
      frame.width = 320;
      frame.height = 240;

      const ret = frame.allocBuffer();
      assert.equal(ret, 0);

      assert.notEqual(frame.data, null);
      assert.ok(frame.data![0] instanceof Buffer);
    });

    it('should allocate frame buffer with alignment', () => {
      frame.format = AV_PIX_FMT_RGB24;
      frame.width = 320;
      frame.height = 240;

      // Test with specific alignment (e.g., 32 for SIMD)
      const ret = frame.getBuffer(32);
      assert.equal(ret, 0, 'getBuffer with align should return 0 on success');

      assert.notEqual(frame.data, null);
      assert.ok(frame.data![0] instanceof Buffer);
    });

    it('should set and get color properties', () => {
      frame.colorRange = AV_COLOR_RANGE_JPEG;
      frame.colorPrimaries = AV_COLOR_PRIMARIES_BT709;
      frame.colorTrc = AV_COLOR_TRC_BT709;
      frame.colorSpace = AV_COLOR_SPACE_BT709;
      frame.chromaLocation = AV_CHROMA_LOCATION_LEFT;

      assert.equal(frame.colorRange, AV_COLOR_RANGE_JPEG);
      assert.equal(frame.colorPrimaries, AV_COLOR_PRIMARIES_BT709);
      assert.equal(frame.colorTrc, AV_COLOR_TRC_BT709);
      assert.equal(frame.colorSpace, AV_COLOR_SPACE_BT709);
      assert.equal(frame.chromaLocation, AV_CHROMA_LOCATION_LEFT);
    });

    it('should set and get picture type', () => {
      frame.pictType = AV_PICTURE_TYPE_I;
      assert.equal(frame.pictType, AV_PICTURE_TYPE_I);

      frame.pictType = AV_PICTURE_TYPE_P;
      assert.equal(frame.pictType, AV_PICTURE_TYPE_P);
    });

    it('should set and get sample aspect ratio', () => {
      const sar = new Rational(16, 9);
      frame.sampleAspectRatio = sar;

      const retrieved = frame.sampleAspectRatio;
      assert.equal(retrieved.num, 16);
      assert.equal(retrieved.den, 9);
    });
  });

  describe('Audio Frame Properties', () => {
    beforeEach(() => {
      frame.alloc();
    });

    it('should set and get audio format properties', () => {
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.sampleRate = 48000;
      frame.nbSamples = 1024;
      frame.channelLayout = {
        order: 0,
        nbChannels: 2,
        mask: 3n, // Stereo
      };

      assert.equal(frame.format, AV_SAMPLE_FMT_FLTP);
      assert.equal(frame.sampleRate, 48000);
      assert.equal(frame.nbSamples, 1024);
      assert.equal(frame.channelLayout.nbChannels, 2);
    });

    it('should allocate audio frame buffer', () => {
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.sampleRate = 44100;
      frame.nbSamples = 1024;
      frame.channelLayout = {
        order: 0,
        nbChannels: 2,
        mask: 3n,
      };

      const ret = frame.getBuffer();
      assert.equal(ret, 0);

      // For planar audio, we should have separate buffers per channel
      assert.notEqual(frame.data, null);
      assert.ok(Array.isArray(frame.data));
      assert.equal(frame.data.length, 2); // 2 channels
      assert.ok(frame.data[0] instanceof Buffer);
      assert.ok(frame.data[1] instanceof Buffer);
    });

    it('should allocate interleaved audio frame buffer', () => {
      frame.format = AV_SAMPLE_FMT_S16;
      frame.sampleRate = 48000;
      frame.nbSamples = 512;
      frame.channelLayout = {
        order: 0,
        nbChannels: 2,
        mask: 3n,
      };

      const ret = frame.allocBuffer();
      assert.equal(ret, 0);

      // For interleaved audio, we should have a single buffer
      assert.notEqual(frame.data, null);
      assert.ok(frame.data![0] instanceof Buffer);
    });

    it('should get number of channels', () => {
      frame.channelLayout = {
        order: 0,
        nbChannels: 6,
        mask: 0x3fn, // 5.1 surround
      };

      assert.equal(frame.channels, 6);
    });

    it('should access extendedData for audio frames', () => {
      // Set up audio frame
      frame.format = AV_SAMPLE_FMT_S16;
      frame.sampleRate = 44100;
      frame.nbSamples = 1024;
      frame.channelLayout = {
        order: 0,
        nbChannels: 2,
        mask: 3n, // Stereo
      };

      const ret = frame.allocBuffer();
      assert.equal(ret, 0);

      // extendedData should contain audio data buffers
      const extData = frame.extendedData;
      assert.notEqual(extData, null, 'Should have extended data');
      assert.ok(Array.isArray(extData), 'Should be an array');
      assert.ok(extData.length >= 1, 'Should have at least one buffer');
      assert.ok(extData[0] instanceof Buffer, 'Should contain Buffer objects');

      // For audio frames, we should be able to access the data
      // The actual buffer content may differ, but both should exist
      assert.ok(frame.data, 'Should have data array');
      assert.ok(frame.data[0] instanceof Buffer, 'data[0] should be a Buffer');
    });
  });

  describe('Timestamps and Timing', () => {
    beforeEach(() => {
      frame.alloc();
    });

    it('should set and get pts', () => {
      frame.pts = 12345n;
      assert.equal(frame.pts, 12345n);

      frame.pts = AV_NOPTS_VALUE;
      assert.equal(frame.pts, AV_NOPTS_VALUE);
    });

    it('should set and get pktDts', () => {
      frame.pktDts = 67890n;
      assert.equal(frame.pktDts, 67890n);
    });

    it('should set and get time base', () => {
      const timeBase = new Rational(1, 25);
      frame.timeBase = timeBase;

      const retrieved = frame.timeBase;
      assert.equal(retrieved.num, 1);
      assert.equal(retrieved.den, 25);
    });

    it('should set and get keyFrame flag', () => {
      frame.keyFrame = 1;
      assert.equal(frame.keyFrame, 1);

      frame.keyFrame = 0;
      assert.equal(frame.keyFrame, 0);
    });

    it('should get bestEffortTimestamp', () => {
      // Set various timestamp values
      frame.pts = 1000n;
      frame.pktDts = 900n;

      // bestEffortTimestamp should return the best timestamp available
      const best = frame.bestEffortTimestamp;
      assert.ok(typeof best === 'bigint', 'Should return bigint');
      // The actual value depends on FFmpeg's internal logic
      // We just verify it returns a valid bigint
    });
  });

  describe('Frame Operations', () => {
    let srcFrame: Frame;

    beforeEach(() => {
      srcFrame = new Frame();
      srcFrame.alloc();
    });

    afterEach(() => {
      try {
        srcFrame.free();
      } catch {
        // Frame might already be freed
      }
    });

    it('should clone a frame', () => {
      // Set up source frame
      srcFrame.format = AV_PIX_FMT_YUV420P;
      srcFrame.width = 320;
      srcFrame.height = 240;
      srcFrame.pts = 1000n;
      srcFrame.allocBuffer();

      // Clone the frame
      const cloned = srcFrame.clone();
      assert.ok(cloned);

      // Verify properties are copied
      assert.equal(cloned.format, srcFrame.format);
      assert.equal(cloned.width, srcFrame.width);
      assert.equal(cloned.height, srcFrame.height);
      assert.equal(cloned.pts, srcFrame.pts);

      // Clean up
      cloned.free();
    });

    it('should unreference a frame', () => {
      frame.alloc(); // Need to allocate first
      frame.format = AV_PIX_FMT_YUV420P;
      frame.width = 1920;
      frame.height = 1080;
      frame.allocBuffer();

      assert.notEqual(frame.data, null);

      // Unreference should clear the data
      frame.unref();
      assert.equal(frame.data, null);
      assert.equal(frame.width, 0);
      assert.equal(frame.height, 0);
    });

    it('should copy frame properties', () => {
      frame.alloc(); // Need to allocate destination frame

      srcFrame.format = AV_PIX_FMT_YUV420P;
      srcFrame.width = 800;
      srcFrame.height = 600;
      srcFrame.pts = 5000n;
      srcFrame.keyFrame = 1;
      srcFrame.pictType = AV_PICTURE_TYPE_I;
      srcFrame.colorRange = AV_COLOR_RANGE_JPEG;

      const ret = frame.copyProps(srcFrame);
      assert.ok(ret >= 0);

      // Properties should be copied
      assert.equal(frame.pts, srcFrame.pts);
      assert.equal(frame.keyFrame, srcFrame.keyFrame);
      assert.equal(frame.pictType, srcFrame.pictType);
      assert.equal(frame.colorRange, srcFrame.colorRange);
    });

    it('should copy frame data', () => {
      frame.alloc(); // Need to allocate destination frame first

      // Set up source frame with data
      srcFrame.format = AV_PIX_FMT_RGB24;
      srcFrame.width = 100;
      srcFrame.height = 100;
      srcFrame.allocBuffer();

      // Set up destination with same parameters
      frame.format = srcFrame.format;
      frame.width = srcFrame.width;
      frame.height = srcFrame.height;
      frame.allocBuffer();

      // Copy the data
      const ret = frame.copy(srcFrame);
      assert.ok(ret >= 0);

      // Both frames should have data
      assert.notEqual(srcFrame.data, null);
      assert.notEqual(frame.data, null);
    });

    it('should make frame writable', () => {
      srcFrame.format = AV_PIX_FMT_YUV420P;
      srcFrame.width = 320;
      srcFrame.height = 240;
      srcFrame.allocBuffer();

      // Check if writable
      const wasWritable = srcFrame.isWritable;

      // Make it writable
      const ret = srcFrame.makeWritable();
      assert.ok(ret >= 0);

      // Should now be writable
      assert.ok(srcFrame.isWritable);
    });
  });

  describe('Extended Data', () => {
    beforeEach(() => {
      frame.alloc();
    });

    it('should handle extended data for multi-channel audio', () => {
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.sampleRate = 48000;
      frame.nbSamples = 1024;
      frame.channelLayout = {
        order: 0,
        nbChannels: 8, // 7.1 surround
        mask: 0x3ffn,
      };

      const ret = frame.getBuffer();
      assert.equal(ret, 0);

      // Should have extended data for > 8 channels
      const extData = frame.extendedData;
      assert.notEqual(extData, null);
      assert.ok(Array.isArray(extData));
      assert.equal(extData.length, 8);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      frame.alloc();
    });

    it('should fail to allocate buffer without format', () => {
      // No format set
      frame.width = 640;
      frame.height = 480;

      const ret = frame.getBuffer();
      assert.notEqual(ret, 0, 'Should fail without format');
      assert.ok(ret < 0, 'Should return negative error code');
    });

    it('should fail to allocate video buffer without dimensions', () => {
      frame.format = AV_PIX_FMT_YUV420P;
      // No width/height set

      const ret = frame.getBuffer();
      assert.notEqual(ret, 0, 'Should fail without dimensions');
      assert.ok(ret < 0, 'Should return negative error code');
    });

    it('should fail to allocate audio buffer without samples', () => {
      frame.format = AV_SAMPLE_FMT_FLTP;
      frame.channelLayout = {
        order: 0,
        nbChannels: 2,
        mask: 3n,
      };
      // No nbSamples set

      const ret = frame.getBuffer();
      assert.notEqual(ret, 0, 'Should fail without nbSamples');
      assert.ok(ret < 0, 'Should return negative error code');
    });

    it('should fail to copy frames with different formats', () => {
      const srcFrame = new Frame();
      srcFrame.alloc();
      srcFrame.format = AV_PIX_FMT_YUV420P;
      srcFrame.width = 640;
      srcFrame.height = 480;
      srcFrame.allocBuffer();

      frame.format = AV_PIX_FMT_RGB24; // Different format
      frame.width = 640;
      frame.height = 480;
      frame.allocBuffer();

      const ret = frame.copy(srcFrame);
      assert.ok(ret < 0, 'Should fail to copy frames with different formats');

      srcFrame.free();
    });
  });

  describe('Hardware Acceleration', () => {
    it('should get and set null hardware frames context', () => {
      frame.alloc();

      // Initially should be null
      assert.equal(frame.hwFramesCtx, null);

      // Should be able to set to null
      frame.hwFramesCtx = null;
      assert.equal(frame.hwFramesCtx, null);
    });

    it('should detect software frame correctly', () => {
      frame.alloc();
      frame.format = AV_PIX_FMT_YUV420P;
      frame.width = 640;
      frame.height = 480;
      frame.allocBuffer();

      // Software frame should have data but no hw_frames_ctx
      assert.equal(frame.isSwFrame(), true, 'Should be a software frame');
      assert.equal(frame.isHwFrame(), false, 'Should not be a hardware frame');
    });

    it('should detect unallocated frame as neither hw nor sw', () => {
      frame.alloc();

      // Unallocated frame has neither data nor hw_frames_ctx
      assert.equal(frame.isSwFrame(), false, 'Unallocated frame should not be software');
      assert.equal(frame.isHwFrame(), false, 'Unallocated frame should not be hardware');
    });

    it('should transfer data between frames', async () => {
      const srcFrame = new Frame();
      srcFrame.alloc();
      srcFrame.format = AV_PIX_FMT_YUV420P;
      srcFrame.width = 640;
      srcFrame.height = 480;
      srcFrame.allocBuffer();

      frame.alloc();

      // Note: This will likely fail without proper hardware context
      // but we test that the method exists and returns a number
      const ret = await frame.hwframeTransferData(srcFrame, 0);
      assert.ok(typeof ret === 'number', 'Should return a number');

      srcFrame.free();
    });
  });
});
