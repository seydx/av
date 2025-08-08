import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP, Frame } from '../src/lib/index.js';

describe('Frame', () => {
  it('should create a new frame', async () => {
    const frame = new Frame();
    assert(frame);
    assert.strictEqual(frame.width, 0);
    assert.strictEqual(frame.height, 0);
  });

  it('should set and get video properties', async () => {
    const frame = new Frame();

    frame.width = 1920;
    frame.height = 1080;
    frame.format = AV_PIX_FMT_YUV420P;

    assert.strictEqual(frame.width, 1920);
    assert.strictEqual(frame.height, 1080);
    assert.strictEqual(frame.format, AV_PIX_FMT_YUV420P);
    assert(frame.isVideo);
    assert(!frame.isAudio);
  });

  it('should set and get audio properties', async () => {
    const frame = new Frame();

    frame.nbSamples = 1024;
    frame.sampleRate = 48000;
    frame.format = AV_SAMPLE_FMT_FLTP;
    frame.channelLayout = {
      nbChannels: 2,
      order: 1,
      mask: 3n,
    };

    assert.strictEqual(frame.nbSamples, 1024);
    assert.strictEqual(frame.sampleRate, 48000);
    assert.strictEqual(frame.channels, 2);
    assert(!frame.isVideo);
    assert(frame.isAudio);
  });

  it('should handle timestamps', async () => {
    const frame = new Frame();

    frame.pts = 1000n;
    frame.pktDts = 900n;
    frame.pktPos = 12345n;
    frame.pktDuration = 40n;

    assert.strictEqual(frame.pts, 1000n);
    assert.strictEqual(frame.pktDts, 900n);
    assert.strictEqual(frame.pktPos, 12345n); // Works even though deprecated
    assert.strictEqual(frame.pktDuration, 40n);
  });

  it('should handle keyframe', async () => {
    const frame = new Frame();

    frame.keyFrame = true;
    assert(frame.keyFrame);

    frame.keyFrame = false;
    assert(!frame.keyFrame);
  });

  it('should allocate buffer', async () => {
    const frame = new Frame();
    frame.width = 320;
    frame.height = 240;
    frame.format = AV_PIX_FMT_YUV420P;

    frame.allocBuffer();

    const data = frame.data;
    assert(Array.isArray(data));
    assert(data.length > 0);
  });

  it('should clone frame', async () => {
    const frame = new Frame();
    frame.width = 640;
    frame.height = 480;
    frame.format = AV_PIX_FMT_YUV420P;
    frame.pts = 5000n;

    // Allocate buffer before cloning
    frame.allocBuffer();

    const cloned = frame.clone();
    assert.strictEqual(cloned.width, 640);
    assert.strictEqual(cloned.height, 480);
    assert.strictEqual(cloned.pts, 5000n);
  });

  it('should support using statement', async () => {
    {
      using frame = new Frame();
      frame.width = 800;
      assert.strictEqual(frame.width, 800);
    }
  });
});
