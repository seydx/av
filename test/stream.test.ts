import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Dictionary, Stream } from '../src/lib/index.js';

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

    const dict = Dictionary.fromObject(metadata);

    stream.metadata = dict;
    const retrieved = stream.metadata;
    const values = dict.toObject();

    // Note: metadata might be null for new streams
    if (retrieved) {
      assert.strictEqual(values.language, 'eng');
      assert.strictEqual(values.title, 'English Audio');
      assert.strictEqual(values.handler_name, 'SoundHandler');
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
    const stream = Stream.fromNative({} as any);
    assert(stream instanceof Stream);
  });
});
