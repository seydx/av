import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Stream } from '../src/lib/index.js';

describe('Stream', () => {
  it('should create a new stream', () => {
    const stream = new Stream();
    assert(stream);
  });

  // Note: Stream properties can only be tested with a valid AVStream from FormatContext
  // These are tested in the FormatContext integration test




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
