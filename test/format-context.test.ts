import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AV_ERROR_EOF,
  AV_FMT_FLAG_AUTO_BSF,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  Dictionary,
  FormatContext,
  InputFormat,
  OutputFormat,
  Packet,
} from '../src/lib/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('FormatContext', () => {
  it('should create a new format context', () => {
    const ctx = new FormatContext();
    assert(ctx);
  });

  it('should create format context with constructor', () => {
    const ctx1 = new FormatContext('input');
    assert(ctx1);

    // Output format context for MP4 using OutputFormat
    const mp4Format = OutputFormat.find('mp4');
    if (mp4Format) {
      const ctx2 = new FormatContext('output', mp4Format, 'mp4', 'test.mp4');
      assert(ctx2);
    }

    // Output format context with just format name
    const ctx3 = new FormatContext('output', null, 'mp4', 'test.mp4');
    assert(ctx3);
  });

  it('should get and set properties', () => {
    const ctx = new FormatContext();

    // Flags
    ctx.flags = AV_FMT_FLAG_AUTO_BSF;
    assert.strictEqual(ctx.flags, AV_FMT_FLAG_AUTO_BSF);

    // Max analyze duration
    ctx.maxAnalyzeDuration = 5000000n;
    assert.strictEqual(ctx.maxAnalyzeDuration, 5000000n);

    // Probe size
    ctx.probesize = 5000000n;
    assert.strictEqual(ctx.probesize, 5000000n);
  });

  it('should handle metadata using Dictionary', () => {
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

  it('should support using statement', () => {
    {
      using ctx = new FormatContext();
      ctx.flags = AV_FMT_FLAG_AUTO_BSF;
      assert.strictEqual(ctx.flags, AV_FMT_FLAG_AUTO_BSF);
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

  it('should create output streams', () => {
    const mp4Format = OutputFormat.find('mp4');
    assert(mp4Format);
    const ctx = new FormatContext('output', mp4Format, undefined, 'test.mp4');

    // Create a new stream
    const stream1 = ctx.newStream();
    assert(stream1);
    assert.strictEqual(stream1.index, 0);
    assert.strictEqual(ctx.nbStreams, 1);

    // Create another stream
    const stream2 = ctx.newStream();
    assert(stream2);
    assert.strictEqual(stream2.index, 1);
    assert.strictEqual(ctx.nbStreams, 2);
  });

  it('should handle dump without crashing', () => {
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

  it('integration test with real media file', async () => {
    const testFile = path.join(__dirname, '..', 'testdata', 'video.mp4');

    // Check if test file exists
    if (!fs.existsSync(testFile)) {
      console.log(`Skipping integration test - ${testFile} not found`);
      return;
    }

    const ctx = new FormatContext();

    try {
      // Open the media file
      await ctx.openInput(testFile);

      // Find stream info
      await ctx.findStreamInfo();

      // Check basic properties
      assert.ok(ctx.nbStreams > 0, 'Should have at least one stream');
      assert.ok(ctx.duration > 0n, 'Should have duration');
      assert.ok(ctx.bitRate >= 0n, 'Should have bitrate');
      assert.ok(ctx.url?.includes('video.mp4'), 'Should have URL');

      // Check streams
      const streams = ctx.streams;
      assert.ok(Array.isArray(streams), 'Should return streams array');
      assert.strictEqual(streams.length, ctx.nbStreams, 'Stream count should match');

      // Find video stream
      const videoStreamIndex = ctx.findBestStream(AV_MEDIA_TYPE_VIDEO);
      if (videoStreamIndex >= 0) {
        const videoStream = streams[videoStreamIndex];
        assert.ok(videoStream, 'Should have video stream');

        const codecParams = videoStream.codecParameters;
        assert.ok(codecParams, 'Video stream should have codec parameters');
        assert.strictEqual(codecParams.codecType, AV_MEDIA_TYPE_VIDEO);
        assert.ok(codecParams.width > 0, 'Should have width');
        assert.ok(codecParams.height > 0, 'Should have height');
      }

      // Find audio stream
      const audioStreamIndex = ctx.findBestStream(AV_MEDIA_TYPE_AUDIO);
      if (audioStreamIndex >= 0) {
        const audioStream = streams[audioStreamIndex];
        assert.ok(audioStream, 'Should have audio stream');

        const codecParams = audioStream.codecParameters;
        assert.ok(codecParams, 'Audio stream should have codec parameters');
        assert.strictEqual(codecParams.codecType, AV_MEDIA_TYPE_AUDIO);
        assert.ok(codecParams.sampleRate > 0, 'Should have sample rate');
        assert.ok(codecParams.channelLayout, 'Should have channel layout');
      }

      // Test reading packets
      using packet = new Packet();
      let packetsRead = 0;
      const maxPackets = 10; // Read only first 10 packets for testing

      while (packetsRead < maxPackets) {
        const ret = ctx.readFrame(packet);
        if (ret === AV_ERROR_EOF) {
          break;
        }

        assert.ok(packet.streamIndex >= 0, 'Packet should have valid stream index');
        assert.ok(packet.size > 0, 'Packet should have data');
        packetsRead++;

        packet.unref(); // Clear packet for next read
      }

      assert.ok(packetsRead > 0, 'Should have read at least one packet');

      // Test dump (should not crash)
      ctx.dump(0, false);
    } finally {
      // Close input
      ctx.closeInput();
      ctx[Symbol.dispose]();
    }
  });
});
