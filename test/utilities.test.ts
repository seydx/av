import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AVMEDIA_TYPE_ATTACHMENT,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_DATA,
  AVMEDIA_TYPE_SUBTITLE,
  AVMEDIA_TYPE_VIDEO,
  AV_CHANNEL_LAYOUT_5POINT1_BACK,
  AV_CHANNEL_LAYOUT_7POINT1,
  AV_CHANNEL_LAYOUT_MONO,
  AV_CHANNEL_LAYOUT_STEREO,
  AV_PIX_FMT_BGR24,
  AV_PIX_FMT_CUDA,
  AV_PIX_FMT_NONE,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_RGBA,
  AV_PIX_FMT_VAAPI,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AV_PIX_FMT_YUV420P,
  AV_ROUND_DOWN,
  AV_ROUND_UP,
  AV_SAMPLE_FMT_DBL,
  AV_SAMPLE_FMT_DBLP,
  AV_SAMPLE_FMT_FLT,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  AV_SAMPLE_FMT_S16P,
  AV_SAMPLE_FMT_S32,
  AV_SAMPLE_FMT_S32P,
  AV_SAMPLE_FMT_U8,
  AV_SAMPLE_FMT_U8P,
  FormatContext,
  OutputFormat,
  Rational,
  avChannelLayoutDescribe,
  avCompareTs,
  avGetBytesPerSample,
  avGetMediaTypeString,
  avGetPackedSampleFmt,
  avGetPixFmtFromName,
  avGetPixFmtName,
  avGetPlanarSampleFmt,
  avGetSampleFmtName,
  avImageAlloc,
  avImageAllocArrays,
  avImageCopy2,
  avImageCopyToBuffer,
  avImageGetBufferSize,
  avRescaleQ,
  avRescaleRnd,
  avSampleFmtIsPlanar,
  avSamplesAlloc,
  avSamplesGetBufferSize,
  avSdpCreate,
  avTs2Str,
  avTs2TimeStr,
  avUsleep,
} from '../src/lib/index.js';

describe('Utilities', () => {
  describe('Channel Layout Functions', () => {
    it('should describe channel layouts', () => {
      // Test mono layout
      const mono = avChannelLayoutDescribe(AV_CHANNEL_LAYOUT_MONO);
      assert.ok(mono, 'Should describe mono layout');
      assert.ok(mono.toLowerCase().includes('mono'), 'Should contain "mono"');

      // Test stereo layout
      const stereo = avChannelLayoutDescribe(AV_CHANNEL_LAYOUT_STEREO);
      assert.ok(stereo, 'Should describe stereo layout');
      assert.ok(stereo.toLowerCase().includes('stereo'), 'Should contain "stereo"');

      // Test 5.1 layout
      const fivePointOne = avChannelLayoutDescribe(AV_CHANNEL_LAYOUT_5POINT1_BACK);
      assert.ok(fivePointOne, 'Should describe 5.1 layout');
      assert.ok(fivePointOne.includes('5.1'), 'Should contain "5.1"');

      // Test 7.1 layout
      const sevenPointOne = avChannelLayoutDescribe(AV_CHANNEL_LAYOUT_7POINT1);
      assert.ok(sevenPointOne, 'Should describe 7.1 layout');
      assert.ok(sevenPointOne.includes('7.1'), 'Should contain "7.1"');
    });

    it('should handle custom channel layouts', () => {
      // Test with a custom layout (3 channels)
      const customLayout = {
        order: 0,
        nbChannels: 3,
        mask: 7n, // FL | FR | FC
      };
      const description = avChannelLayoutDescribe(customLayout);
      assert.ok(description, 'Should describe custom layout');
      assert.ok(description.includes('3'), 'Should indicate 3 channels');
    });

    it('should handle empty channel layout', () => {
      const emptyLayout = {
        order: 0,
        nbChannels: 0,
        mask: 0n,
      };
      const description = avChannelLayoutDescribe(emptyLayout);
      // Empty layout might return empty string or specific description
      assert.ok(description !== undefined, 'Should handle empty layout');
    });
  });

  describe('Sample Format Functions', () => {
    it('should get bytes per sample', () => {
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_U8), 1);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_S16), 2);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_S32), 4);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_FLT), 4);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_DBL), 8);

      // Planar formats have same bytes per sample
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_U8P), 1);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_S16P), 2);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_S32P), 4);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_FLTP), 4);
      assert.equal(avGetBytesPerSample(AV_SAMPLE_FMT_DBLP), 8);
    });

    it('should get sample format name', () => {
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_U8), 'u8');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_S16), 's16');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_S32), 's32');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_FLT), 'flt');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_DBL), 'dbl');

      // Planar formats
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_U8P), 'u8p');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_S16P), 's16p');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_S32P), 's32p');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_FLTP), 'fltp');
      assert.equal(avGetSampleFmtName(AV_SAMPLE_FMT_DBLP), 'dblp');
    });

    it('should check if sample format is planar', () => {
      // Non-planar formats
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_U8), false);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16), false);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_S32), false);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_FLT), false);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_DBL), false);

      // Planar formats
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_U8P), true);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16P), true);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_S32P), true);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_FLTP), true);
      assert.equal(avSampleFmtIsPlanar(AV_SAMPLE_FMT_DBLP), true);
    });

    it('should get packed sample format', () => {
      // Planar formats should return their packed equivalents
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_U8P), AV_SAMPLE_FMT_U8);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_S16P), AV_SAMPLE_FMT_S16);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_S32P), AV_SAMPLE_FMT_S32);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_FLTP), AV_SAMPLE_FMT_FLT);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_DBLP), AV_SAMPLE_FMT_DBL);

      // Packed formats should return themselves
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_U8), AV_SAMPLE_FMT_U8);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_S16), AV_SAMPLE_FMT_S16);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_S32), AV_SAMPLE_FMT_S32);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_FLT), AV_SAMPLE_FMT_FLT);
      assert.equal(avGetPackedSampleFmt(AV_SAMPLE_FMT_DBL), AV_SAMPLE_FMT_DBL);
    });

    it('should get planar sample format', () => {
      // Packed formats should return their planar equivalents
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_U8), AV_SAMPLE_FMT_U8P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_S16), AV_SAMPLE_FMT_S16P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_S32), AV_SAMPLE_FMT_S32P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLT), AV_SAMPLE_FMT_FLTP);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_DBL), AV_SAMPLE_FMT_DBLP);

      // Planar formats should return themselves
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_U8P), AV_SAMPLE_FMT_U8P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_S16P), AV_SAMPLE_FMT_S16P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_S32P), AV_SAMPLE_FMT_S32P);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLTP), AV_SAMPLE_FMT_FLTP);
      assert.equal(avGetPlanarSampleFmt(AV_SAMPLE_FMT_DBLP), AV_SAMPLE_FMT_DBLP);
    });

    it('should handle invalid sample format', () => {
      const invalidFormat = 999999 as any;
      const name = avGetSampleFmtName(invalidFormat);
      assert.equal(name, null, 'Should return null for invalid format');

      const bytes = avGetBytesPerSample(invalidFormat);
      assert.equal(bytes, 0, 'Should return 0 for invalid format');
    });
  });

  describe('Pixel Format Functions', () => {
    it('should get pixel format name', () => {
      assert.equal(avGetPixFmtName(AV_PIX_FMT_YUV420P), 'yuv420p');
      assert.equal(avGetPixFmtName(AV_PIX_FMT_RGB24), 'rgb24');
    });

    it('should get pixel format from name', () => {
      assert.equal(avGetPixFmtFromName('yuv420p'), AV_PIX_FMT_YUV420P);
      assert.equal(avGetPixFmtFromName('rgb24'), AV_PIX_FMT_RGB24);

      // Test more common formats
      assert.equal(avGetPixFmtFromName('nv12'), AV_PIX_FMT_NV12);
      assert.equal(avGetPixFmtFromName('bgr24'), AV_PIX_FMT_BGR24);
      assert.equal(avGetPixFmtFromName('rgba'), AV_PIX_FMT_RGBA);

      // Test hardware formats (may not be available on all systems)
      const videotoolbox = avGetPixFmtFromName('videotoolbox');
      assert.ok(videotoolbox === AV_PIX_FMT_VIDEOTOOLBOX || videotoolbox === AV_PIX_FMT_NONE, 'VideoToolbox format should be 160 or -1 if not available');

      const cuda = avGetPixFmtFromName('cuda');
      assert.ok(cuda === AV_PIX_FMT_CUDA || cuda === AV_PIX_FMT_NONE, 'CUDA format should be 117 or -1 if not available');

      const vaapi = avGetPixFmtFromName('vaapi');
      assert.ok(vaapi === AV_PIX_FMT_VAAPI || vaapi === AV_PIX_FMT_NONE, 'VAAPI format should be 44 or -1 if not available');
    });

    it('should handle invalid pixel format name', () => {
      const invalidFormat = avGetPixFmtFromName('invalid_format_name');
      assert.equal(invalidFormat, -1, 'Should return -1 for invalid format name');

      // Test empty string
      assert.equal(avGetPixFmtFromName(''), -1, 'Should return -1 for empty string');

      // Test case sensitivity
      assert.equal(avGetPixFmtFromName('YUV420P'), -1, 'Should return -1 for uppercase (case sensitive)');
    });

    it('should handle invalid pixel format', () => {
      const invalidFormat = 999999 as any;
      const name = avGetPixFmtName(invalidFormat);
      assert.equal(name, null, 'Should return null for invalid format');
    });
  });

  describe('Media Type Functions', () => {
    it('should get media type string', () => {
      assert.equal(avGetMediaTypeString(AVMEDIA_TYPE_VIDEO), 'video');
      assert.equal(avGetMediaTypeString(AVMEDIA_TYPE_AUDIO), 'audio');
      assert.equal(avGetMediaTypeString(AVMEDIA_TYPE_DATA), 'data');
      assert.equal(avGetMediaTypeString(AVMEDIA_TYPE_SUBTITLE), 'subtitle');
      assert.equal(avGetMediaTypeString(AVMEDIA_TYPE_ATTACHMENT), 'attachment');
    });

    it('should handle invalid media type', () => {
      const invalidType = 999;
      const typeString = avGetMediaTypeString(invalidType as any);
      assert.equal(typeString, null, 'Should return null for invalid media type');
    });
  });

  describe('Image Functions', () => {
    it('should allocate image buffer', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_RGB24;
      const align = 1;

      const result = avImageAlloc(width, height, pixFmt, align);

      assert.ok(result.buffer instanceof Buffer, 'Should return a Buffer');
      assert.ok(result.size > 0, 'Should have positive size');
      assert.ok(Array.isArray(result.linesizes), 'Should have linesizes array');
      assert.ok(result.linesizes.length > 0, 'Should have at least one linesize');

      // For RGB24, we expect size = width * height * 3
      const expectedSize = width * height * 3;
      assert.equal(result.size, expectedSize, 'Should allocate correct size for RGB24');
    });

    it('should copy image to buffer', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_RGB24;
      const align = 1;

      // First allocate source image
      const srcResult = avImageAlloc(width, height, pixFmt, align);
      assert.ok(srcResult.buffer instanceof Buffer);

      // Fill source buffer with some test data
      for (let i = 0; i < srcResult.buffer.length; i++) {
        srcResult.buffer[i] = i % 256;
      }

      // Create destination buffer
      const dstSize = srcResult.size;
      const dst = Buffer.alloc(dstSize);

      // Create source data arrays
      const srcData = [srcResult.buffer];
      const srcLinesize = srcResult.linesizes;

      // Copy image to buffer
      const ret = avImageCopyToBuffer(dst, dstSize, srcData, srcLinesize, pixFmt, width, height, align);

      // Should return the number of bytes written
      assert.equal(ret, dstSize, 'Should copy all bytes');

      // Verify some data was copied
      assert.ok(!dst.every((b) => b === 0), 'Destination buffer should have data');
    });

    it('should handle insufficient buffer size', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_RGB24;
      const align = 1;

      // Create source data
      const srcResult = avImageAlloc(width, height, pixFmt, align);
      const srcData = [srcResult.buffer];
      const srcLinesize = srcResult.linesizes;

      // Create too small destination buffer
      const dstSize = 100; // Too small
      const dst = Buffer.alloc(dstSize);

      // Should return error for insufficient buffer
      const ret = avImageCopyToBuffer(dst, dstSize, srcData, srcLinesize, pixFmt, width, height, align);
      assert.ok(ret < 0, 'Should return error for insufficient buffer');
    });

    it('should allocate image buffer arrays', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_YUV420P;
      const align = 32;

      const result = avImageAllocArrays(width, height, pixFmt, align);

      assert.ok(Array.isArray(result.data), 'Should return data array');
      assert.ok(result.data.length > 0, 'Should have at least one data buffer');
      assert.ok(result.data[0] instanceof Buffer, 'Should contain Buffer objects');
      assert.ok(Array.isArray(result.linesizes), 'Should have linesizes array');
      assert.ok(result.size > 0, 'Should have positive size');
    });

    it('should get image buffer size', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_RGB24;
      const align = 1;

      const size = avImageGetBufferSize(pixFmt, width, height, align);
      assert.ok(size > 0, 'Should return positive size');

      // For RGB24, we expect size = width * height * 3
      const expectedSize = width * height * 3;
      assert.equal(size, expectedSize, 'Should calculate correct size for RGB24');
    });

    it('should handle invalid image parameters', () => {
      const invalidPixFmt = -1 as any;
      const width = 320;
      const height = 240;
      const align = 1;

      // avImageAlloc should throw for invalid format
      assert.throws(() => avImageAlloc(width, height, invalidPixFmt, align), 'Should throw for invalid pixel format');

      // avImageGetBufferSize should return negative for invalid format
      const size = avImageGetBufferSize(invalidPixFmt, width, height, align);
      assert.ok(size < 0, 'Should return negative size for invalid format');
    });

    it('should copy image data', () => {
      const width = 320;
      const height = 240;
      const pixFmt = AV_PIX_FMT_RGB24;
      const align = 1;

      // Allocate source and destination
      const src = avImageAlloc(width, height, pixFmt, align);
      const dst = avImageAlloc(width, height, pixFmt, align);

      // Fill source with test data
      src.buffer.fill(42);

      // Copy
      avImageCopy2([dst.buffer], dst.linesizes, [src.buffer], src.linesizes, pixFmt, width, height);

      // Verify copy
      assert.deepEqual(dst.buffer, src.buffer, 'Should copy data correctly');
    });
  });

  describe('Timestamp Functions', () => {
    it('should convert timestamp to string', () => {
      assert.equal(avTs2Str(0n), '0');
      assert.equal(avTs2Str(123456n), '123456');
      assert.equal(avTs2Str(-123456n), '-123456');
      assert.equal(avTs2Str(null), 'NOPTS');

      // Also works with numbers
      assert.equal(avTs2Str(42), '42');
      assert.equal(avTs2Str(-42), '-42');
    });

    it('should convert timestamp to time string', () => {
      const timeBase = new Rational(1, 1000); // milliseconds

      // The actual format might vary, so just check it's a valid string
      const result0 = avTs2TimeStr(0n, timeBase);
      assert.ok(typeof result0 === 'string', 'Should return string for 0');
      assert.ok(result0.includes('0'), 'Should contain 0');

      const result1000 = avTs2TimeStr(1000n, timeBase);
      assert.ok(typeof result1000 === 'string', 'Should return string for 1000');
      assert.ok(result1000.includes('1'), 'Should contain 1');

      assert.equal(avTs2TimeStr(null, timeBase), 'NOPTS');

      // Without timebase
      assert.equal(avTs2TimeStr(123n, null), '123');
    });

    it('should compare timestamps', () => {
      const tb1 = new Rational(1, 1000); // milliseconds
      const tb2 = new Rational(1, 1000000); // microseconds

      // Same timebase comparison
      assert.equal(avCompareTs(100n, tb1, 200n, tb1), -1, '100ms < 200ms');
      assert.equal(avCompareTs(200n, tb1, 100n, tb1), 1, '200ms > 100ms');
      assert.equal(avCompareTs(100n, tb1, 100n, tb1), 0, '100ms == 100ms');

      // Different timebase comparison
      assert.equal(avCompareTs(1n, tb1, 1000n, tb2), 0, '1ms == 1000us');
      assert.equal(avCompareTs(1n, tb1, 500n, tb2), 1, '1ms > 500us');
      assert.equal(avCompareTs(1n, tb1, 2000n, tb2), -1, '1ms < 2000us');

      // Null handling
      assert.equal(avCompareTs(null, tb1, 100n, tb1), -1, 'null < 100');
      assert.equal(avCompareTs(100n, tb1, null, tb1), 1, '100 > null');
      assert.equal(avCompareTs(null, tb1, null, tb1), 0, 'null == null');
    });

    it('should rescale timestamps', () => {
      const srcTb = new Rational(1, 1000); // milliseconds
      const dstTb = new Rational(1, 1000000); // microseconds

      assert.equal(avRescaleQ(1n, srcTb, dstTb), 1000n, '1ms = 1000us');
      assert.equal(avRescaleQ(500n, srcTb, dstTb), 500000n, '500ms = 500000us');
      assert.equal(avRescaleQ(0n, srcTb, dstTb), 0n, '0ms = 0us');

      // Reverse scaling
      assert.equal(avRescaleQ(1000n, dstTb, srcTb), 1n, '1000us = 1ms');
      assert.equal(avRescaleQ(500000n, dstTb, srcTb), 500n, '500000us = 500ms');

      // Null handling - FFmpeg treats null as AV_NOPTS_VALUE which is INT64_MIN
      // The actual behavior may vary, so just check it returns a bigint
      const nullResult = avRescaleQ(null, srcTb, dstTb);
      assert.ok(typeof nullResult === 'bigint', 'null should return bigint');
    });
  });

  describe('Sleep Function', () => {
    it('should sleep for specified microseconds', async () => {
      const startTime = Date.now();
      const sleepUs = 10000; // 10ms

      avUsleep(sleepUs);

      const elapsed = Date.now() - startTime;
      // Allow some tolerance (sleep might not be exact)
      assert.ok(elapsed >= 5, 'Should sleep for at least 5ms');
      assert.ok(elapsed < 150, 'Should not sleep for more than 150ms');
    });

    it('should handle zero sleep', () => {
      const startTime = Date.now();

      avUsleep(0);

      const elapsed = Date.now() - startTime;
      assert.ok(elapsed < 10, 'Zero sleep should return immediately');
    });
  });

  describe('Rescale with Rounding Functions', () => {
    it('should rescale with AV_ROUND_UP', () => {
      // Test basic rescaling with round up
      assert.equal(avRescaleRnd(1n, 1000n, 1n, AV_ROUND_UP), 1000n, '1 * 1000 / 1 = 1000');
      assert.equal(avRescaleRnd(1024n, 44100n, 48000n, AV_ROUND_UP), 941n, '1024 * 44100 / 48000 rounded up');

      // Test with numbers
      assert.equal(avRescaleRnd(100, 3, 10, AV_ROUND_UP), 30n, '100 * 3 / 10 = 30');
      assert.equal(avRescaleRnd(10, 3, 7, AV_ROUND_UP), 5n, '10 * 3 / 7 rounded up = 5');
    });

    it('should rescale with AV_ROUND_DOWN', () => {
      // Test basic rescaling with round down
      assert.equal(avRescaleRnd(1024n, 44100n, 48000n, AV_ROUND_DOWN), 940n, '1024 * 44100 / 48000 rounded down');
      assert.equal(avRescaleRnd(10, 3, 7, AV_ROUND_DOWN), 4n, '10 * 3 / 7 rounded down = 4');
    });

    it('should handle edge cases', () => {
      // Zero input
      assert.equal(avRescaleRnd(0n, 1000n, 1n, AV_ROUND_UP), 0n, '0 * anything = 0');

      // Identity scaling
      assert.equal(avRescaleRnd(100n, 1n, 1n, AV_ROUND_UP), 100n, '100 * 1 / 1 = 100');
    });
  });

  describe('Audio Sample Allocation Functions', () => {
    it('should allocate audio samples for packed format', () => {
      const nbChannels = 2;
      const nbSamples = 1024;
      const sampleFmt = AV_SAMPLE_FMT_S16; // Packed format
      const align = 0;

      const result = avSamplesAlloc(nbChannels, nbSamples, sampleFmt, align);

      assert.ok(result.data instanceof Array, 'Should return data array');
      assert.equal(result.data.length, 1, 'Packed format should have single buffer');
      assert.ok(result.data[0] instanceof Buffer, 'Should contain Buffer');
      assert.ok(result.linesize > 0, 'Should have positive linesize');
      assert.ok(result.size > 0, 'Should have positive size');

      // For S16 stereo: 2 bytes per sample * 2 channels * 1024 samples = 4096 bytes
      const expectedSize = 2 * nbChannels * nbSamples;
      assert.equal(result.size, expectedSize, 'Should allocate correct size');
    });

    it('should allocate audio samples for planar format', () => {
      const nbChannels = 2;
      const nbSamples = 1024;
      const sampleFmt = AV_SAMPLE_FMT_FLTP; // Planar format
      const align = 0;

      const result = avSamplesAlloc(nbChannels, nbSamples, sampleFmt, align);

      assert.ok(result.data instanceof Array, 'Should return data array');
      assert.equal(result.data.length, nbChannels, 'Planar format should have buffer per channel');

      for (let i = 0; i < nbChannels; i++) {
        assert.ok(result.data[i] instanceof Buffer, `Channel ${i} should contain Buffer`);
      }

      assert.ok(result.linesize > 0, 'Should have positive linesize');
      assert.ok(result.size > 0, 'Should have positive size');

      // For FLTP: 4 bytes per sample * 1024 samples per channel * 2 channels = 8192 bytes
      const expectedSize = 4 * nbSamples * nbChannels;
      assert.equal(result.size, expectedSize, 'Should allocate correct size');
    });

    it('should get buffer size for audio samples', () => {
      const nbChannels = 2;
      const nbSamples = 1024;
      const sampleFmt = AV_SAMPLE_FMT_S16;
      const align = 0;

      const result = avSamplesGetBufferSize(nbChannels, nbSamples, sampleFmt, align);

      assert.ok(result.size > 0, 'Should return positive size');
      assert.ok(result.linesize > 0, 'Should return positive linesize');

      // For S16 stereo: 2 bytes per sample * 2 channels * 1024 samples = 4096 bytes
      const expectedSize = 2 * nbChannels * nbSamples;
      assert.equal(result.size, expectedSize, 'Should calculate correct size');
    });

    it('should handle alignment in allocation', () => {
      const nbChannels = 1;
      const nbSamples = 1023; // Odd number to test alignment
      const sampleFmt = AV_SAMPLE_FMT_U8;
      const align = 32; // 32-byte alignment

      const result = avSamplesAlloc(nbChannels, nbSamples, sampleFmt, align);

      assert.ok(result.data instanceof Array, 'Should return data array');
      assert.ok(result.data[0] instanceof Buffer, 'Should contain Buffer');

      // Linesize should be aligned to 32 bytes
      assert.equal(result.linesize % align, 0, 'Linesize should be aligned');
    });

    it('should handle different sample formats', () => {
      const nbChannels = 1;
      const nbSamples = 100;
      const align = 1; // Use align=1 to avoid alignment padding

      // Test various formats
      const formats = [
        { fmt: AV_SAMPLE_FMT_U8, bytesPerSample: 1 },
        { fmt: AV_SAMPLE_FMT_S16, bytesPerSample: 2 },
        { fmt: AV_SAMPLE_FMT_S32, bytesPerSample: 4 },
        { fmt: AV_SAMPLE_FMT_FLT, bytesPerSample: 4 },
        { fmt: AV_SAMPLE_FMT_DBL, bytesPerSample: 8 },
      ];

      for (const { fmt, bytesPerSample } of formats) {
        const result = avSamplesGetBufferSize(nbChannels, nbSamples, fmt, align);
        const expectedSize = bytesPerSample * nbChannels * nbSamples;
        assert.equal(result.size, expectedSize, `Format ${fmt} should have size ${expectedSize}`);
      }
    });

    it('should throw on invalid parameters', () => {
      assert.throws(() => avSamplesAlloc(-1, 1024, AV_SAMPLE_FMT_S16, 0), 'Should throw for negative channels');
      assert.throws(() => avSamplesAlloc(2, -1, AV_SAMPLE_FMT_S16, 0), 'Should throw for negative samples');
      assert.throws(() => avSamplesAlloc(2, 1024, -1 as any, 0), 'Should throw for invalid format');
    });
  });

  describe('SDP Functions', () => {
    it('should create SDP from FormatContext array', () => {
      // Create output format contexts for RTP
      const contexts: FormatContext[] = [];

      // Create a simple RTP output context
      const ctx = new FormatContext();
      const format = OutputFormat.guessFormat('rtp', null, null);

      if (format) {
        ctx.allocOutputContext2(format, null, 'rtp://127.0.0.1:5004');
        contexts.push(ctx);

        // Call avSdpCreate
        const result = avSdpCreate(contexts);

        // Check if we got an SDP string or null
        if (typeof result === 'string') {
          assert.ok(result.length > 0, 'Should return non-empty SDP string');
          assert.ok(result.includes('v='), 'SDP should contain version line');
          assert.ok(result.includes('o='), 'SDP should contain origin line');
        } else {
          // If error, it might be because we haven't set up streams
          assert.equal(result, null, 'Should return null if SDP creation fails');
        }

        // Clean up
        ctx.freeContext();
      } else {
        // RTP format might not be available
        console.log('RTP output format not available, skipping SDP test');
      }
    });

    it('should handle empty array', () => {
      const result = avSdpCreate([]);

      // Empty array should return null
      assert.equal(result, null, 'Should return null for empty array');
    });

    it('should validate FormatContext objects', () => {
      // @ts-ignore - Testing invalid input with null
      const result1 = avSdpCreate([null]);
      assert.equal(result1, null, 'Should return null for null in array');

      // @ts-ignore - Testing invalid input with plain object
      const result2 = avSdpCreate([{}]);
      assert.equal(result2, null, 'Should return null for non-FormatContext objects');

      // @ts-ignore - Testing invalid input with string
      const result3 = avSdpCreate('not an array');
      assert.equal(result3, null, 'Should return null for non-array input');
    });

    it('should handle multiple contexts', () => {
      const contexts: FormatContext[] = [];
      const format = OutputFormat.guessFormat('rtp', null, null);

      if (format) {
        // Create multiple RTP contexts
        for (let i = 0; i < 2; i++) {
          const ctx = new FormatContext();
          ctx.allocOutputContext2(format, null, `rtp://127.0.0.1:${5004 + i * 2}`);
          contexts.push(ctx);
        }

        const result = avSdpCreate(contexts);

        if (typeof result === 'string') {
          assert.ok(result.length > 0, 'Should create SDP for multiple contexts');
        } else {
          assert.equal(result, null, 'Should return null if SDP creation fails');
        }

        // Clean up
        contexts.forEach((ctx) => ctx.freeContext());
      }
    });
  });
});
