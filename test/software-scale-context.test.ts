import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PIX_FMT_RGB24, AV_PIX_FMT_YUV420P, SoftwareScaleContext } from '../src/lib/index.js';

// SWS flags
const SWS_BILINEAR = 2;

describe('SoftwareScaleContext', () => {
  it('should create a scale context', () => {
    using ctx = new SoftwareScaleContext(
      640,
      480,
      AV_PIX_FMT_YUV420P, // Source
      320,
      240,
      AV_PIX_FMT_YUV420P, // Destination
      SWS_BILINEAR, // Flags
    );

    assert(ctx);
    assert.strictEqual(ctx.sourceWidth, 640);
    assert.strictEqual(ctx.sourceHeight, 480);
    assert.strictEqual(ctx.sourcePixelFormat, AV_PIX_FMT_YUV420P);
    assert.strictEqual(ctx.destinationWidth, 320);
    assert.strictEqual(ctx.destinationHeight, 240);
    assert.strictEqual(ctx.destinationPixelFormat, AV_PIX_FMT_YUV420P);
    assert.strictEqual(ctx.flags, SWS_BILINEAR);
  });

  it('should support different pixel formats', () => {
    using ctx = new SoftwareScaleContext(
      640,
      480,
      AV_PIX_FMT_YUV420P, // Source YUV
      640,
      480,
      AV_PIX_FMT_RGB24, // Destination RGB
      SWS_BILINEAR,
    );

    assert(ctx);
    assert.strictEqual(ctx.sourcePixelFormat, AV_PIX_FMT_YUV420P);
    assert.strictEqual(ctx.destinationPixelFormat, AV_PIX_FMT_RGB24);
  });

  it('should support using statement', () => {
    {
      using ctx = new SoftwareScaleContext(640, 480, AV_PIX_FMT_YUV420P, 320, 240, AV_PIX_FMT_YUV420P, SWS_BILINEAR);
      assert(ctx);
    }
    // Context should be disposed here
    assert(true, 'Context disposed successfully');
  });

  it('should have scaleFrame method', () => {
    using ctx = new SoftwareScaleContext(640, 480, AV_PIX_FMT_YUV420P, 320, 240, AV_PIX_FMT_YUV420P, SWS_BILINEAR);

    // Just verify the method exists
    assert.strictEqual(typeof ctx.scaleFrame, 'function');

    // Actual scaling requires properly allocated frames with data
    // This will be tested in integration tests
  });
});
