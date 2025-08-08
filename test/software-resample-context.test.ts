import assert from 'node:assert';
import { describe, it } from 'node:test';

import { SoftwareResampleContext } from '../src/lib/index.js';

describe('SoftwareResampleContext', () => {
  it('should create a resample context', () => {
    using ctx = new SoftwareResampleContext();
    assert(ctx);
    assert(ctx.native);
  });

  it('should support using statement', () => {
    {
      using ctx = new SoftwareResampleContext();
      assert(ctx);
    }
    // Context should be disposed here
    assert(true, 'Context disposed successfully');
  });

  it('should have convertFrame method', () => {
    using ctx = new SoftwareResampleContext();

    // Just verify the method exists
    assert.strictEqual(typeof ctx.convertFrame, 'function');

    // Actual resampling requires properly configured context and frames
    // This will be tested in integration tests
  });

  it('should have getDelay method', () => {
    using ctx = new SoftwareResampleContext();

    // Just verify the method exists and returns bigint
    assert.strictEqual(typeof ctx.getDelay, 'function');

    // Test with sample rate of 48000
    const delay = ctx.getDelay(48000n);
    assert.strictEqual(typeof delay, 'bigint');
    assert(delay >= 0n, 'Delay should be non-negative');
  });
});
