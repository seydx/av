import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_CHROMA_LOCATION_UNSPECIFIED,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_MSMPEG4V3,
  AV_COLOR_PRIMARIES_BT709,
  AV_COLOR_RANGE_MPEG,
  AV_COLOR_SPACE_BT709,
  AV_COLOR_TRC_BT709,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  CodecParameters,
  Rational,
} from '../src/lib/index.js';

describe('CodecParameters', () => {
  it('should create a new codec parameters', () => {
    const params = new CodecParameters();
    assert(params);
  });

  it('should set and get codec type and id', () => {
    const params = new CodecParameters();

    params.codecType = AV_MEDIA_TYPE_VIDEO;
    params.codecId = AV_CODEC_ID_H264;

    assert.strictEqual(params.codecType, AV_MEDIA_TYPE_VIDEO);
    assert.strictEqual(params.codecId, AV_CODEC_ID_H264);
  });

  it('should set and get video parameters', () => {
    const params = new CodecParameters();

    params.codecType = AV_MEDIA_TYPE_VIDEO;
    params.width = 1920;
    params.height = 1080;
    params.pixelFormat = AV_PIX_FMT_YUV420P;
    params.bitRate = 4000000n;

    assert.strictEqual(params.width, 1920);
    assert.strictEqual(params.height, 1080);
    assert.strictEqual(params.pixelFormat, AV_PIX_FMT_YUV420P);
    assert.strictEqual(params.bitRate, 4000000n);
  });

  it('should set and get audio parameters', () => {
    const params = new CodecParameters();

    params.codecType = AV_MEDIA_TYPE_AUDIO;
    params.codecId = AV_CODEC_ID_MSMPEG4V3; // MP3 codec ID
    params.sampleRate = 48000;
    params.sampleFormat = AV_SAMPLE_FMT_FLTP;
    params.channelLayout = {
      nbChannels: 2,
      order: 1,
      mask: 3n,
    };
    params.frameSize = 1024;

    assert.strictEqual(params.sampleRate, 48000);
    assert.strictEqual(params.sampleFormat, AV_SAMPLE_FMT_FLTP);
    assert.strictEqual(params.channelLayout.nbChannels, 2);
    assert.strictEqual(params.frameSize, 1024);
  });

  it('should handle sample aspect ratio', () => {
    const params = new CodecParameters();

    const sar = new Rational(1, 1);
    params.sampleAspectRatio = sar;

    const retrieved = params.sampleAspectRatio;
    assert.strictEqual(retrieved.num, 1);
    assert.strictEqual(retrieved.den, 1);
  });

  it('should handle profile and level', () => {
    const params = new CodecParameters();

    params.profile = 100; // High profile
    params.level = 51; // Level 5.1

    assert.strictEqual(params.profile, 100);
    assert.strictEqual(params.level, 51);
  });

  it('should handle color properties', () => {
    const params = new CodecParameters();

    params.colorRange = AV_COLOR_RANGE_MPEG; // AVCOL_RANGE_MPEG
    params.colorSpace = AV_COLOR_SPACE_BT709; // AVCOL_SPC_BT709
    params.colorPrimaries = AV_COLOR_PRIMARIES_BT709; // AVCOL_PRI_BT709
    params.colorTransferCharacteristic = AV_COLOR_TRC_BT709; // AVCOL_TRC_BT709
    params.chromaLocation = AV_CHROMA_LOCATION_UNSPECIFIED; // AVCHROMA_LOC_UNSPECIFIED

    assert.strictEqual(params.colorRange, AV_COLOR_RANGE_MPEG);
    assert.strictEqual(params.colorSpace, AV_COLOR_SPACE_BT709);
    assert.strictEqual(params.colorPrimaries, AV_COLOR_PRIMARIES_BT709);
    assert.strictEqual(params.colorTransferCharacteristic, AV_COLOR_TRC_BT709);
    assert.strictEqual(params.chromaLocation, AV_CHROMA_LOCATION_UNSPECIFIED);
  });

  it('should handle extra data', () => {
    const params = new CodecParameters();

    const extraData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    params.extraData = extraData;

    const retrieved = params.extraData;
    assert(retrieved);
    assert(Buffer.isBuffer(retrieved));
    assert.strictEqual(retrieved.length, 4);
  });

  it('should handle codec tag', () => {
    const params = new CodecParameters();

    params.codecTag = 0x31637661; // 'avc1'
    assert.strictEqual(params.codecTag, 0x31637661);
  });

  it('should copy parameters', () => {
    const src = new CodecParameters();
    src.codecType = AV_MEDIA_TYPE_VIDEO;
    src.width = 640;
    src.height = 480;
    src.codecId = AV_CODEC_ID_H264;

    const dst = new CodecParameters();
    src.copy(dst);

    assert.strictEqual(dst.codecType, AV_MEDIA_TYPE_VIDEO);
    assert.strictEqual(dst.width, 640);
    assert.strictEqual(dst.height, 480);
    assert.strictEqual(dst.codecId, AV_CODEC_ID_H264);
  });

  it('should support using statement', () => {
    {
      using params = new CodecParameters();
      params.width = 1280;
      assert.strictEqual(params.width, 1280);
    }
  });
});
