import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_CODEC_ID_H264, AV_MEDIA_TYPE_VIDEO, AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP, CodecContext, Rational } from '../src/lib/index.js';

describe('CodecContext', () => {
  it('should create a new codec context', () => {
    const ctx = new CodecContext();
    assert(ctx);
  });

  it('should set and get general properties', () => {
    const ctx = new CodecContext();

    ctx.codecID = AV_CODEC_ID_H264;
    assert.strictEqual(ctx.codecID, AV_CODEC_ID_H264);

    ctx.mediaType = AV_MEDIA_TYPE_VIDEO;
    assert.strictEqual(ctx.mediaType, AV_MEDIA_TYPE_VIDEO);

    ctx.bitRate = 1000000n;
    assert.strictEqual(ctx.bitRate, 1000000n);

    const timeBase = new Rational(1, 25);
    ctx.timeBase = timeBase;
    const tb = ctx.timeBase;
    assert.strictEqual(tb.num, 1);
    assert.strictEqual(tb.den, 25);

    ctx.level = 41;
    assert.strictEqual(ctx.level, 41);

    ctx.profile = 100;
    assert.strictEqual(ctx.profile, 100);

    ctx.threadCount = 4;
    assert.strictEqual(ctx.threadCount, 4);
  });

  it('should set and get video properties', () => {
    const ctx = new CodecContext();

    ctx.width = 1920;
    ctx.height = 1080;
    ctx.pixelFormat = AV_PIX_FMT_YUV420P;

    assert.strictEqual(ctx.width, 1920);
    assert.strictEqual(ctx.height, 1080);
    assert.strictEqual(ctx.pixelFormat, AV_PIX_FMT_YUV420P);

    const framerate = new Rational(30, 1);
    ctx.framerate = framerate;
    const fr = ctx.framerate;
    assert.strictEqual(fr.num, 30);
    assert.strictEqual(fr.den, 1);

    ctx.gopSize = 12;
    assert.strictEqual(ctx.gopSize, 12);

    ctx.maxBFrames = 2;
    assert.strictEqual(ctx.maxBFrames, 2);
  });

  it('should set and get audio properties', () => {
    const ctx = new CodecContext();

    ctx.sampleRate = 48000;
    assert.strictEqual(ctx.sampleRate, 48000);

    ctx.sampleFormat = AV_SAMPLE_FMT_FLTP;
    assert.strictEqual(ctx.sampleFormat, AV_SAMPLE_FMT_FLTP);

    ctx.channelLayout = {
      nbChannels: 2,
      order: 1,
      mask: 3n,
    };

    const layout = ctx.channelLayout;
    assert.strictEqual(layout.nbChannels, 2);
    assert.strictEqual(ctx.channels, 2);

    ctx.frameSize = 1024;
    assert.strictEqual(ctx.frameSize, 1024);
  });

  it('should handle rate control properties', () => {
    const ctx = new CodecContext();

    ctx.rcMaxRate = 2000000n;
    assert.strictEqual(ctx.rcMaxRate, 2000000n);

    ctx.rcMinRate = 500000n;
    assert.strictEqual(ctx.rcMinRate, 500000n);

    ctx.rcBufferSize = 4000000;
    assert.strictEqual(ctx.rcBufferSize, 4000000);
  });

  it('should handle extra data', () => {
    const ctx = new CodecContext();

    const extraData = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    ctx.extraData = extraData;

    const retrieved = ctx.extraData;
    assert(retrieved);
    assert(Buffer.isBuffer(retrieved));
    assert.deepStrictEqual(retrieved, extraData);

    // Clear extra data
    ctx.extraData = null;
    assert.strictEqual(ctx.extraData, null);
  });

  it('should support using statement', () => {
    {
      using ctx = new CodecContext();
      ctx.width = 640;
      assert.strictEqual(ctx.width, 640);
    }
    // Context is automatically disposed here
  });

  it('should handle flags', () => {
    const ctx = new CodecContext();

    ctx.flags = 0x0001 as any;
    assert.strictEqual(ctx.flags as any, 0x0001);

    ctx.flags2 = 0x0002 as any;
    assert.strictEqual(ctx.flags2 as any, 0x0002);
  });
});
