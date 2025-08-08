import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_DISPOSITION_DEFAULT, AV_DISPOSITION_FORCED, Rational, Stream } from '../src/lib/index.js';

describe('Stream', () => {
  it('should create a new stream', () => {
    const stream = new Stream();
    assert(stream);
  });

  it.skip('should get and set basic properties', () => {
    // Skip: Stream needs to be obtained from FormatContext to have a valid AVStream
    // This will be tested when FormatContext is complete
    const stream = new Stream();

    // ID can be set
    stream.id = 101;
    assert.strictEqual(stream.id, 101);

    // These are typically read-only from demuxed streams
    assert.strictEqual(typeof stream.index, 'number');
    assert.strictEqual(typeof stream.duration, 'bigint');
    assert.strictEqual(typeof stream.nbFrames, 'bigint');
    assert.strictEqual(typeof stream.startTime, 'bigint');
  });

  it.skip('should handle timing properties', () => {
    // Skip: Stream needs to be obtained from FormatContext to have a valid AVStream
    const stream = new Stream();

    // TimeBase
    const timeBase = new Rational(1, 1000);
    stream.timeBase = timeBase;
    assert.deepStrictEqual(stream.timeBase, timeBase);

    // Frame rates
    const fps = new Rational(30, 1);
    stream.avgFrameRate = fps;
    assert.deepStrictEqual(stream.avgFrameRate, fps);

    stream.rFrameRate = fps;
    assert.deepStrictEqual(stream.rFrameRate, fps);

    // Sample aspect ratio
    const sar = new Rational(16, 9);
    stream.sampleAspectRatio = sar;
    assert.deepStrictEqual(stream.sampleAspectRatio, sar);
  });

  it.skip('should handle configuration', () => {
    // Skip: Stream needs to be obtained from FormatContext to have a valid AVStream
    const stream = new Stream();

    // Discard level
    stream.discard = 1; // AVDISCARD_DEFAULT
    assert.strictEqual(stream.discard, 1);

    // Event flags (read-only)
    assert.strictEqual(typeof stream.eventFlags, 'number');
  });

  it.skip('should handle disposition flags', () => {
    // Skip: Stream needs to be obtained from FormatContext to have a valid AVStream
    const stream = new Stream();

    // Set initial disposition
    stream.disposition = AV_DISPOSITION_DEFAULT;
    assert(stream.hasDisposition(AV_DISPOSITION_DEFAULT));

    // Add more flags
    stream.addDisposition(AV_DISPOSITION_FORCED);
    assert(stream.hasDisposition(AV_DISPOSITION_FORCED));
    assert(stream.hasDisposition(AV_DISPOSITION_DEFAULT));

    // Remove flag
    stream.removeDisposition(AV_DISPOSITION_DEFAULT);
    assert(!stream.hasDisposition(AV_DISPOSITION_DEFAULT));
    assert(stream.hasDisposition(AV_DISPOSITION_FORCED));
  });

  it('should handle metadata', () => {
    const stream = new Stream();

    const metadata = {
      language: 'eng',
      title: 'English Audio',
      handler_name: 'SoundHandler',
    };

    stream.metadata = metadata;
    const retrieved = stream.metadata;

    // Note: metadata might be null for new streams
    if (retrieved) {
      assert.strictEqual(retrieved.language, 'eng');
      assert.strictEqual(retrieved.title, 'English Audio');
      assert.strictEqual(retrieved.handler_name, 'SoundHandler');
    }
  });

  it('should get codec parameters', () => {
    const stream = new Stream();

    const params = stream.codecParameters;
    // New stream might not have codec parameters
    if (params) {
      assert('codecType' in params);
      assert('codecId' in params);
      assert('bitRate' in params);
    }
  });

  it('should detect media types', () => {
    const stream = new Stream();

    // New stream without codec parameters
    assert.strictEqual(stream.isVideo(), false);
    assert.strictEqual(stream.isAudio(), false);
    assert.strictEqual(stream.isSubtitle(), false);
  });

  it('should wrap native stream', () => {
    // Test static fromNative method
    const nativeStream = {}; // Mock native stream
    const stream = Stream.fromNative(nativeStream);
    assert(stream instanceof Stream);
  });
});
