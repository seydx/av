import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AV_FMT_NOFILE, InputFormat, OutputFormat } from '../src/lib/index.js';

describe('InputFormat', () => {
  it('should find mp4 input format', () => {
    const format = InputFormat.find('mp4');
    assert.ok(format, 'Should find mp4 format');
    assert.strictEqual(format.name, 'mov,mp4,m4a,3gp,3g2,mj2');
    assert.ok(format.longName?.includes('QuickTime'));
    assert.ok(format.extensions?.includes('mp4'));
  });

  it('should return null for unknown format', () => {
    const format = InputFormat.find('nonexistent');
    assert.strictEqual(format, null);
  });

  it('should get all input formats', () => {
    const formats = InputFormat.getAll();
    assert.ok(Array.isArray(formats));
    assert.ok(formats.length > 0, 'Should have at least one format');

    // Check first format has expected properties
    const first = formats[0];
    assert.ok(first.name);
    assert.ok(typeof first.flags === 'number');
  });

  it('should check format flags', () => {
    const format = InputFormat.find('mp4');
    assert.ok(format);
    assert.strictEqual(typeof format.flags, 'number');
    // Test hasFlag method - use the actual constant
    assert.strictEqual(typeof format.hasFlag(AV_FMT_NOFILE), 'boolean');
  });

  it('should handle toString()', () => {
    const format = InputFormat.find('mp4');
    assert.ok(format);
    assert.strictEqual(format.toString(), format.name);
  });
});

describe('OutputFormat', () => {
  it('should find mp4 output format', () => {
    const format = OutputFormat.find('mp4');
    assert.ok(format, 'Should find mp4 format');
    assert.strictEqual(format.name, 'mp4');
    assert.ok(format.longName?.includes('MP4'));
    assert.ok(format.extensions?.includes('mp4'));
  });

  it('should guess format from filename', () => {
    const format = OutputFormat.guess({ filename: 'test.mp4' });
    assert.ok(format, 'Should guess format from filename');
    assert.strictEqual(format.name, 'mp4');
  });

  it('should guess format from short name', () => {
    const format = OutputFormat.guess({ shortName: 'mp4' });
    assert.ok(format, 'Should guess format from short name');
    assert.strictEqual(format.name, 'mp4');
  });

  it('should return null when cannot guess format', () => {
    const format = OutputFormat.guess({ filename: 'test.unknownext' });
    assert.strictEqual(format, null);
  });

  it('should get all output formats', () => {
    const formats = OutputFormat.getAll();
    assert.ok(Array.isArray(formats));
    assert.ok(formats.length > 0, 'Should have at least one format');

    // Check first format has expected properties
    const first = formats[0];
    assert.ok(first.name);
    assert.ok(typeof first.flags === 'number');
  });

  it('should get codec IDs', () => {
    const format = OutputFormat.find('mp4');
    assert.ok(format);
    assert.strictEqual(typeof format.audioCodec, 'number');
    assert.strictEqual(typeof format.videoCodec, 'number');
    assert.strictEqual(typeof format.subtitleCodec, 'number');
  });

  it('should check needsFile property', () => {
    const mp4 = OutputFormat.find('mp4');
    assert.ok(mp4);
    assert.strictEqual(mp4.needsFile, true, 'MP4 needs a file');

    // Find a streaming format that doesn't need a file
    const formats = OutputFormat.getAll();
    const streamingFormat = formats.find((f) => f.name === 'hls' || f.name === 'dash');
    if (streamingFormat) {
      console.log(`Testing streaming format: ${streamingFormat.name}`);
      assert.strictEqual(typeof streamingFormat.needsFile, 'boolean');
    }
  });

  it('should check supportsGlobalHeader property', () => {
    const format = OutputFormat.find('mp4');
    assert.ok(format);
    assert.strictEqual(typeof format.supportsGlobalHeader, 'boolean');
  });
});
