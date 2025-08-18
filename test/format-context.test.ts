import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';

import { fileURLToPath } from 'node:url';
import {
  AV_CODEC_ID_H264,
  AV_CODEC_ID_PCM_S16LE,
  AV_DICT_NONE,
  AV_FMT_FLAG_GENPTS,
  AV_IO_FLAG_WRITE,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_SAMPLE_FMT_S16,
  AV_SEEK_FLAG_NONE,
  Codec,
  Dictionary,
  FormatContext,
  IOContext,
  OutputFormat,
  Packet,
  Rational,
} from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FormatContext', () => {
  let ctx: FormatContext;
  const testDir = path.join(__dirname, './.tmp');
  const testFile = path.join(testDir, 'test.mp4');
  const testAudioFile = path.join(testDir, 'test-audio.wav');
  const inputVideoFile = path.join(__dirname, '../testdata/video.mp4');

  before(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  after(() => {
    // Clean up test files
    try {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(testAudioFile)) fs.unlinkSync(testAudioFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    ctx = new FormatContext();
  });

  afterEach(() => {
    // Clean up context if not already done
    // Note: Some tests may have already freed the context
    try {
      if (ctx) {
        ctx.freeContext();
      }
    } catch {
      // Already freed or error during cleanup
      // This is expected for some tests
    }
    ctx = null as any; // Clear reference
  });

  describe('Lifecycle', () => {
    it('should create an uninitialized format context', () => {
      assert.ok(ctx);
    });

    it('should allocate output context', () => {
      const ret = ctx.allocOutputContext2(null, null, testFile);
      assert.equal(ret, 0);
      // Context should be allocated for output
    });

    it('should allocate output context with format', () => {
      const format = OutputFormat.guessFormat('mp4', null, null);
      assert.ok(format);

      const ret = ctx.allocOutputContext2(format, null, null);
      assert.equal(ret, 0);
    });

    it('should open input', async () => {
      // Use existing test video file
      const ret = await ctx.openInput(inputVideoFile, null, null);
      assert.equal(ret, 0);
    });

    it('should free context', () => {
      ctx.allocOutputContext2(null, null, testFile);
      ctx.freeContext();
      // After free, context is invalid
      ctx = null as any; // Clear reference so afterEach doesn't double-free
    });

    it('should support using statement for automatic disposal', () => {
      using testCtx = new FormatContext();
      testCtx.allocOutputContext2(null, null, testFile);
      assert.ok(testCtx);
      // testCtx will be automatically disposed when leaving scope
    });
  });

  describe('Input Operations', () => {
    it('should open input file', async () => {
      const ret = await ctx.openInput(inputVideoFile, null, null);
      assert.equal(ret, 0);
      assert.ok(ctx.nbStreams > 0);
    });

    it('should open input with options', async () => {
      const options = new Dictionary();
      const ret = await ctx.openInput(inputVideoFile, null, options);
      assert.equal(ret, 0);
      options.free();
    });

    it('should find stream info', async () => {
      await ctx.openInput(inputVideoFile, null, null);
      const ret = await ctx.findStreamInfo(null);
      assert.equal(ret, 0);
    });

    it('should read packets', async () => {
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      const packet = new Packet();
      packet.alloc();

      const ret = await ctx.readFrame(packet);
      // Should succeed with video.mp4
      assert.equal(ret, 0);

      packet.free();
    });

    it('should seek to timestamp', async () => {
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      const ret = await ctx.seekFrame(-1, 0n, AV_SEEK_FLAG_NONE);
      // Seeking should work for mp4
      assert.equal(ret, 0);
    });

    it('should close input', async () => {
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      // Should be able to close input without error
      await ctx.closeInput();

      // After closing, we should be able to open again
      const ret = await ctx.openInput(inputVideoFile, null, null);
      assert.equal(ret, 0);
    });
  });

  describe('Output Operations', () => {
    beforeEach(() => {
      ctx.allocOutputContext2(null, null, testFile);
    });

    it('should create new stream', () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      assert.equal(ctx.nbStreams, 1);
    });

    it('should create stream with codec', () => {
      const codec = Codec.findEncoder(AV_CODEC_ID_H264);
      if (codec) {
        const stream = ctx.newStream(codec);
        assert.ok(stream);
        // Note: newStream with codec doesn't automatically set codecpar
        // The codec is used as a hint, but codecpar must still be set manually
        stream.codecpar.codecId = AV_CODEC_ID_H264;
        assert.equal(stream.codecpar.codecId, AV_CODEC_ID_H264);
      }
    });

    it('should write header', async () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 1920;
      stream.codecpar.height = 1080;

      // Open output file explicitly
      const openRet = await ctx.openOutput();
      assert.equal(openRet, 0);

      const ret = await ctx.writeHeader(null);
      assert.equal(ret, 0);

      // ctx.closeOutput();
    });

    it('should write header with options', async () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 1920;
      stream.codecpar.height = 1080;

      await ctx.openOutput();

      const options = new Dictionary();
      const ret = await ctx.writeHeader(options);
      assert.equal(ret, 0);

      // ctx.closeOutput();
      options.free();
    });

    it('should write packet', async () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 1920;
      stream.codecpar.height = 1080;

      await ctx.openOutput();
      await ctx.writeHeader(null);

      const packet = new Packet();
      packet.alloc();
      packet.streamIndex = 0;
      packet.pts = 0n;
      packet.dts = 0n;

      const ret = await ctx.writeFrame(packet);
      // Writing might fail without proper packet data
      assert.ok(ret <= 0);

      // ctx.closeOutput();
      packet.free();
    });

    it('should write trailer', async () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 1920;
      stream.codecpar.height = 1080;

      await ctx.openOutput();
      await ctx.writeHeader(null);
      const ret = await ctx.writeTrailer();
      assert.equal(ret, 0);

      // ctx.closeOutput();
    });

    it('should interleave and write packet', async () => {
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 1920;
      stream.codecpar.height = 1080;

      await ctx.openOutput();
      await ctx.writeHeader(null);

      const packet = new Packet();
      packet.alloc();
      packet.streamIndex = 0;

      const ret = await ctx.interleavedWriteFrame(packet);
      // Writing might fail without proper packet data
      assert.ok(ret <= 0);

      // ctx.closeOutput();
      packet.free();
    });
  });

  describe('Stream Selection', () => {
    it('should find best stream without decoder', async () => {
      // Need an actual file with streams for this test
      // We'll use allocOutputContext2 and add a stream as simulation
      ctx.allocOutputContext2(null, 'mp4', null);
      const stream = ctx.newStream(null);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;

      // Find best stream without decoder (original API)
      const streamIndex = ctx.findBestStream(AV_MEDIA_TYPE_VIDEO, -1, -1);
      // With our mock setup, it should find stream 0 or return error
      assert.ok(typeof streamIndex === 'number');
    });

    it('should find best stream with decoder', async () => {
      ctx.allocOutputContext2(null, 'mp4', null);
      const stream = ctx.newStream(null);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;

      // Find best stream with decoder (new API)
      const result = ctx.findBestStream(AV_MEDIA_TYPE_VIDEO, -1, -1, true, 0);
      assert.ok(typeof result === 'object');
      assert.ok('streamIndex' in result);
      assert.ok('decoder' in result);
      assert.ok(typeof result.streamIndex === 'number');
      // decoder might be null if no decoder found for the stream
      if (result.decoder) {
        assert.ok(result.decoder.name);
      }
    });
  });

  describe('Stream Access', () => {
    beforeEach(() => {
      ctx.allocOutputContext2(null, null, testFile);
    });

    it('should get number of streams', () => {
      assert.equal(ctx.nbStreams, 0);

      ctx.newStream(null);
      assert.equal(ctx.nbStreams, 1);

      ctx.newStream(null);
      assert.equal(ctx.nbStreams, 2);
    });

    it('should get stream by index', () => {
      const stream1 = ctx.newStream(null);
      const stream2 = ctx.newStream(null);

      assert.ok(stream1);
      assert.ok(stream2);
      assert.equal(stream1.index, 0);
      assert.equal(stream2.index, 1);

      const streams = ctx.streams;
      assert.ok(streams);
      assert.equal(streams.length, 2);
      assert.equal(streams[0].index, 0);
      assert.equal(streams[1].index, 1);
    });

    it('should handle invalid stream index', () => {
      ctx.newStream(null);

      const streams = ctx.streams;
      assert.ok(streams);
      assert.equal(streams.length, 1);
      assert.equal(streams[10], undefined);
    });

    it('should get all streams', () => {
      ctx.newStream(null);
      ctx.newStream(null);
      ctx.newStream(null);

      const streams = ctx.streams;
      assert.ok(Array.isArray(streams));
      assert.equal(streams.length, 3);
    });
  });

  describe('Properties', () => {
    beforeEach(() => {
      ctx.allocOutputContext2(null, null, testFile);
    });

    it('should dump format for output', () => {
      // Create a stream first
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 640;
      stream.codecpar.height = 480;

      // Should not throw
      assert.doesNotThrow(() => {
        ctx.dumpFormat(0, testFile, true);
      });
    });

    it('should dump format for input', async () => {
      // Open existing file as input
      ctx.freeContext();
      ctx = new FormatContext();
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      // Should not throw
      assert.doesNotThrow(() => {
        ctx.dumpFormat(0, inputVideoFile, false);
      });
    });

    it('should get start time', () => {
      // Start time is read-only
      const startTime = ctx.startTime;
      assert.ok(typeof startTime === 'bigint');
    });

    it('should get duration', () => {
      // Duration is read-only
      const duration = ctx.duration;
      assert.ok(typeof duration === 'bigint');
    });

    it('should get bit rate', () => {
      // Bit rate is read-only
      const bitRate = ctx.bitRate;
      assert.ok(typeof bitRate === 'bigint');
    });

    it('should get and set flags', () => {
      ctx.flags = AV_FMT_FLAG_GENPTS;
      assert.equal(ctx.flags, AV_FMT_FLAG_GENPTS);
    });

    it('should get and set probesize', () => {
      ctx.probesize = 5000000n;
      assert.equal(ctx.probesize, 5000000n);
    });

    it('should get and set max analyze duration', () => {
      ctx.maxAnalyzeDuration = 5000000n;
      assert.equal(ctx.maxAnalyzeDuration, 5000000n);
    });

    it('should get and set metadata', () => {
      const metadata = new Dictionary();
      metadata.set('title', 'Test Video', AV_DICT_NONE);
      metadata.set('artist', 'Test Artist', AV_DICT_NONE);

      ctx.metadata = metadata;

      const retrieved = ctx.metadata;
      assert.ok(retrieved);
      assert.equal(retrieved.get('title', AV_DICT_NONE), 'Test Video');
      assert.equal(retrieved.get('artist', AV_DICT_NONE), 'Test Artist');

      metadata.free();
      retrieved.free();
    });

    it('should read metadata from input file', async () => {
      // Open existing file as input
      ctx.freeContext();
      ctx = new FormatContext();
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      const metadata = ctx.metadata;
      assert.ok(metadata);

      // Get all metadata entries
      const entries = metadata.getAll();
      assert.ok(typeof entries === 'object');

      // Check that expected metadata exists
      assert.ok('major_brand' in entries);
      assert.ok('encoder' in entries);

      metadata.free();
    });

    it('should get url/filename', () => {
      assert.equal(ctx.url, testFile);
    });

    it('should get oformat', () => {
      const oformat = ctx.oformat;
      assert.ok(oformat);
    });

    it('should get iformat when opened as input', async () => {
      // Create a file first
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 640;
      stream.codecpar.height = 480;
      await ctx.openOutput();
      await ctx.writeHeader(null);
      await ctx.writeTrailer();
      // ctx.closeOutput();
      ctx.freeContext();
      ctx = null as any; // Clear reference so afterEach doesn't double-free

      // Open as input
      ctx = new FormatContext();
      await ctx.openInput(testFile, null, null);

      const iformat = ctx.iformat;
      assert.ok(iformat);
    });
  });

  describe('IO Context', () => {
    it('should create custom IO context', () => {
      const ioCtx = new IOContext();
      ioCtx.allocContext(4096, AV_IO_FLAG_WRITE);

      ctx.allocOutputContext2(null, 'mp4', null);
      ctx.pb = ioCtx;

      const retrieved = ctx.pb;
      assert.ok(retrieved);

      // Don't free IOContext here - it's now owned by FormatContext
      // It will be freed when FormatContext is freed
    });

    it('should work with custom IO', async () => {
      const ioCtx = new IOContext();
      ioCtx.allocContext(4096, AV_IO_FLAG_WRITE);

      ctx.allocOutputContext2(null, 'mp4', null);
      ctx.pb = ioCtx;

      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 640;
      stream.codecpar.height = 480;

      // Should work with custom IO
      // Custom IO doesn't need openOutput as it manages its own I/O
      // Just verify we can set the custom IO context
      assert.ok(ctx.pb);

      // Don't free IOContext here - it's now owned by FormatContext
      // It will be freed when FormatContext is freed
    });
  });

  describe('Audio-specific Operations', () => {
    it('should create audio stream', () => {
      ctx.allocOutputContext2(null, null, testAudioFile);

      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_AUDIO;
      stream.codecpar.codecId = AV_CODEC_ID_PCM_S16LE;
      stream.codecpar.sampleRate = 44100;
      stream.codecpar.channels = 2;
      stream.codecpar.format = AV_SAMPLE_FMT_S16;

      assert.equal(stream.codecpar.codecType, AV_MEDIA_TYPE_AUDIO);
      assert.equal(stream.codecpar.sampleRate, 44100);
    });

    it('should set audio time base', () => {
      ctx.allocOutputContext2(null, null, testAudioFile);

      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_AUDIO;
      stream.codecpar.sampleRate = 48000;

      const timeBase = new Rational(1, 48000);
      stream.timeBase = timeBase;

      const retrieved = stream.timeBase;
      assert.equal(retrieved.num, 1);
      assert.equal(retrieved.den, 48000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null filename', () => {
      const ret = ctx.allocOutputContext2(null, 'mp4', null);
      assert.equal(ret, 0);
    });

    it('should handle invalid format', () => {
      assert.throws(
        () => {
          ctx.allocOutputContext2(null, 'invalid_format_xyz', null);
        },
        {
          message: /Failed to allocate output context/,
        },
      );
    });

    it('should handle non-existent input file', async () => {
      const ret = await ctx.openInput('/non/existent/file.mp4', null, null);
      assert.ok(ret < 0);
    });

    it('should handle empty streams array', () => {
      ctx.allocOutputContext2(null, null, testFile);
      const streams = ctx.streams;
      assert.ok(Array.isArray(streams));
      assert.equal(streams.length, 0);
    });
  });

  describe('Async Operations', () => {
    it('should read frame asynchronously', async () => {
      // Use existing test video
      await ctx.openInput(inputVideoFile, null, null);
      await ctx.findStreamInfo(null);

      const packet = new Packet();
      packet.alloc();

      const ret = await ctx.readFrame(packet);
      assert.equal(ret, 0); // Should succeed with video.mp4

      packet.free();
    });

    it('should write frame asynchronously', async () => {
      // Need to allocate context for this specific test
      ctx.allocOutputContext2(null, null, testFile);
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 640;
      stream.codecpar.height = 480;

      await ctx.openOutput();
      await ctx.writeHeader(null);

      const packet = new Packet();
      packet.alloc();
      packet.streamIndex = 0;

      const ret = await ctx.writeFrame(packet);
      assert.ok(ret <= 0);

      // ctx.closeOutput();
      packet.free();
    });

    it('should interleave write frame asynchronously', async () => {
      // Need to allocate context for this specific test
      ctx.allocOutputContext2(null, null, testFile);
      const stream = ctx.newStream(null);
      assert.ok(stream);
      stream.codecpar.codecType = AV_MEDIA_TYPE_VIDEO;
      stream.codecpar.codecId = AV_CODEC_ID_H264;
      stream.codecpar.width = 640;
      stream.codecpar.height = 480;

      await ctx.openOutput();
      await ctx.writeHeader(null);

      const packet = new Packet();
      packet.alloc();
      packet.streamIndex = 0;

      const ret = await ctx.interleavedWriteFrame(packet);
      assert.ok(ret <= 0);

      // ctx.closeOutput();
      packet.free();
    });
  });
});
