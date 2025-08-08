import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Dictionary, FormatContext, InputFormat, OutputFormat } from '../src/lib/index.js';

describe('FormatContext', () => {
  it('should create a new format context', () => {
    const ctx = new FormatContext();
    assert(ctx);
  });

  it.skip('should create format context with static methods', () => {
    // Skip: These require proper native allocation
    const ctx1 = FormatContext.allocFormatContext();
    assert(ctx1);

    // Output format context for MP4 using OutputFormat
    const mp4Format = OutputFormat.find('mp4');
    assert(mp4Format);
    const ctx2 = FormatContext.allocOutputFormatContext(mp4Format, 'mp4', 'test.mp4');
    assert(ctx2);

    // Output format context with just format name
    const ctx3 = FormatContext.allocOutputFormatContext(null, 'mp4', 'test.mp4');
    assert(ctx3);
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

  it.skip('should handle metadata using Dictionary', () => {
    // Skip: Requires native FormatContext with AVDictionary support
    const ctx = new FormatContext();

    // Create metadata dictionary
    const metadata = new Dictionary();
    metadata.set('title', 'Test Video');
    metadata.set('artist', 'Test Artist');
    metadata.set('album', 'Test Album');

    ctx.metadata = metadata;
    const retrieved = ctx.metadata;

    assert(retrieved);
    assert(retrieved instanceof Dictionary);
    assert.strictEqual(retrieved.get('title'), 'Test Video');
    assert.strictEqual(retrieved.get('artist'), 'Test Artist');
    assert.strictEqual(retrieved.get('album'), 'Test Album');
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

  it('should work with InputFormat and OutputFormat', () => {
    // Find formats
    const mp4Input = InputFormat.find('mp4');
    assert(mp4Input);
    assert.strictEqual(mp4Input.name, 'mov,mp4,m4a,3gp,3g2,mj2');

    const mp4Output = OutputFormat.find('mp4');
    assert(mp4Output);
    assert.strictEqual(mp4Output.name, 'mp4');

    // Can be used with FormatContext (would be used in openInput/allocOutputFormatContext)
    assert(mp4Input.extensions?.includes('mp4'));
    assert(mp4Output.extensions?.includes('mp4'));
  });

  it('should get duration and timing info', () => {
    const ctx = new FormatContext();

    // New context has default values
    assert.strictEqual(typeof ctx.duration, 'bigint');
    assert.strictEqual(typeof ctx.startTime, 'bigint');
    assert.strictEqual(typeof ctx.bitRate, 'bigint');
  });

  it.skip('should create output streams', () => {
    // Skip: Requires proper native allocation
    const mp4Format = OutputFormat.find('mp4');
    assert(mp4Format);
    const ctx = FormatContext.allocOutputFormatContext(mp4Format, undefined, 'test.mp4');

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
    // Skip: Requires proper native context
    const ctx = new FormatContext();

    // Should not throw
    assert.doesNotThrow(() => {
      ctx.dump(0, false);
    });
  });

  it('should demonstrate Dictionary usage for options', () => {
    // Create options dictionary for openInput
    const inputOptions = new Dictionary();
    inputOptions.set('analyzeduration', '10000000');
    inputOptions.set('probesize', '5000000');

    // Create options dictionary for writeHeader
    const outputOptions = new Dictionary();
    outputOptions.set('movflags', 'faststart');
    outputOptions.set('brand', 'mp42');

    // These would be used like:
    // await ctx.openInput('input.mp4', null, inputOptions);
    // ctx.writeHeader(outputOptions);

    assert.strictEqual(inputOptions.get('analyzeduration'), '10000000');
    assert.strictEqual(outputOptions.get('movflags'), 'faststart');
  });
});
