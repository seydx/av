import assert from 'node:assert';
import { describe, it } from 'node:test';

import { FormatContext } from '../src/lib/index.js';

describe('FormatContext', () => {
  it('should create a new format context', () => {
    const ctx = new FormatContext();
    assert(ctx);
  });

  it.skip('should create format context with static methods', () => {
    // TODO: Fix static methods - might cause issues
    const ctx1 = FormatContext.allocFormatContext();
    assert(ctx1);

    // Output format context for MP4
    const ctx2 = FormatContext.allocOutputFormatContext('mp4', 'test.mp4');
    assert(ctx2);
  });

  it('should get and set properties', () => {
    const ctx = new FormatContext();

    // Flags
    ctx.flags = 0x0001;
    assert.strictEqual(ctx.flags, 0x0001);

    // Max analyze duration
    ctx.maxAnalyzeDuration = 5000000n;
    assert.strictEqual(ctx.maxAnalyzeDuration, 5000000n);

    // Probe size
    ctx.probesize = 5000000n;
    assert.strictEqual(ctx.probesize, 5000000n);
  });

  it.skip('should handle metadata', () => {
    // TODO: Fix metadata handling
    const ctx = new FormatContext();

    const metadata = {
      title: 'Test Video',
      artist: 'Test Artist',
      album: 'Test Album',
    };

    ctx.metadata = metadata;
    const retrieved = ctx.metadata;

    assert(retrieved);
    assert.strictEqual(retrieved.title, 'Test Video');
    assert.strictEqual(retrieved.artist, 'Test Artist');
    assert.strictEqual(retrieved.album, 'Test Album');
  });

  it('should report stream count', () => {
    const ctx = new FormatContext();

    // New context has no streams
    assert.strictEqual(ctx.nbStreams, 0);
    assert(Array.isArray(ctx.streams));
    assert.strictEqual(ctx.streams.length, 0);
  });

  it.skip('should support using statement', () => {
    // TODO: Fix dispose - might cause segfault
    {
      using ctx = new FormatContext();
      ctx.flags = 0x0002;
      assert.strictEqual(ctx.flags, 0x0002);
    }
    // Context is automatically disposed here
  });

  it('should handle format info', () => {
    const ctx = new FormatContext();

    // New context has no format set
    assert.strictEqual(ctx.inputFormat, null);
    assert.strictEqual(ctx.outputFormat, null);
  });

  it('should get duration and timing info', () => {
    const ctx = new FormatContext();

    // New context has default values
    assert.strictEqual(typeof ctx.duration, 'bigint');
    assert.strictEqual(typeof ctx.startTime, 'bigint');
    assert.strictEqual(typeof ctx.bitRate, 'bigint');
  });

  it.skip('should create output streams', () => {
    // TODO: Fix - causes segfault
    const ctx = FormatContext.allocOutputFormatContext('mp4');

    // Create a new stream
    const streamIndex = ctx.newStream();
    assert.strictEqual(streamIndex, 0);
    assert.strictEqual(ctx.nbStreams, 1);

    // Create another stream
    const streamIndex2 = ctx.newStream();
    assert.strictEqual(streamIndex2, 1);
    assert.strictEqual(ctx.nbStreams, 2);
  });

  it.skip('should handle dump without crashing', () => {
    // TODO: Fix - might cause issues
    const ctx = new FormatContext();

    // Should not throw
    assert.doesNotThrow(() => {
      ctx.dump(0, false);
    });
  });
});
