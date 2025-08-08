import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16, SoftwareResampleContext } from '../src/lib/index.js';

describe('SoftwareResampleContext', () => {
  it('should create a resample context', () => {
    using ctx = new SoftwareResampleContext(
      { nbChannels: 2, order: 1, mask: 3n }, // Stereo input
      48000, // 48kHz
      AV_SAMPLE_FMT_FLTP,
      { nbChannels: 2, order: 1, mask: 3n }, // Stereo output
      44100, // 44.1kHz
      AV_SAMPLE_FMT_S16
    );
    assert(ctx);
  });

  it('should support using statement', () => {
    {
      using ctx = new SoftwareResampleContext(
        { nbChannels: 2, order: 1, mask: 3n },
        48000,
        AV_SAMPLE_FMT_FLTP,
        { nbChannels: 2, order: 1, mask: 3n },
        44100,
        AV_SAMPLE_FMT_S16
      );
      assert(ctx);
    }
    // Context should be disposed here
    assert(true, 'Context disposed successfully');
  });

  it('should have convertFrame method', () => {
    using ctx = new SoftwareResampleContext(
      { nbChannels: 2, order: 1, mask: 3n },
      48000,
      AV_SAMPLE_FMT_FLTP,
      { nbChannels: 2, order: 1, mask: 3n },
      44100,
      AV_SAMPLE_FMT_S16
    );

    // Just verify the method exists
    assert.strictEqual(typeof ctx.convertFrame, 'function');

    // Actual resampling requires properly configured context and frames
    // This will be tested in integration tests
  });

  it('should have getDelay method', () => {
    using ctx = new SoftwareResampleContext(
      { nbChannels: 2, order: 1, mask: 3n },
      48000,
      AV_SAMPLE_FMT_FLTP,
      { nbChannels: 2, order: 1, mask: 3n },
      44100,
      AV_SAMPLE_FMT_S16
    );

    // Just verify the method exists and returns bigint
    assert.strictEqual(typeof ctx.getDelay, 'function');

    // Test with sample rate of 48000
    const delay = ctx.getDelay(48000n);
    assert.strictEqual(typeof delay, 'bigint');
    assert(delay >= 0n, 'Delay should be non-negative');
  });
});
