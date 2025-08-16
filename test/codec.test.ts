import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_CODEC_ID_AAC,
  AV_CODEC_ID_AC3,
  AV_CODEC_ID_AV1,
  AV_CODEC_ID_FLAC,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_HEVC,  // H.265 is called HEVC in FFmpeg
  AV_CODEC_ID_MJPEG,
  AV_CODEC_ID_MP3,
  AV_CODEC_ID_MPEG4,
  AV_CODEC_ID_OPUS,
  AV_CODEC_ID_PCM_S16LE,
  AV_CODEC_ID_PNG,
  AV_CODEC_ID_VP8,
  AV_CODEC_ID_VP9,
  AV_CODEC_ID_VORBIS,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
} from '../src/lib/index.js';

describe('Codec', () => {
  describe('Find Decoders', () => {
    it('should find H.264 decoder by ID', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);
      assert.ok(decoder.isDecoder());
      assert.equal(decoder.id, AV_CODEC_ID_H264);
      assert.equal(decoder.type, AV_MEDIA_TYPE_VIDEO);
      assert.ok(decoder.name);
      assert.ok(decoder.longName);
    });

    it('should find AAC decoder by ID', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_AAC);
      assert.ok(decoder);
      assert.ok(decoder.isDecoder());
      assert.equal(decoder.id, AV_CODEC_ID_AAC);
      assert.equal(decoder.type, AV_MEDIA_TYPE_AUDIO);
    });

    it('should find decoder by name', () => {
      const decoder = Codec.findDecoderByName('h264');
      assert.ok(decoder);
      assert.ok(decoder.isDecoder());
      assert.equal(decoder.name, 'h264');
      assert.equal(decoder.type, AV_MEDIA_TYPE_VIDEO);
    });

    it('should find AAC decoder by name', () => {
      const decoder = Codec.findDecoderByName('aac');
      assert.ok(decoder);
      assert.ok(decoder.isDecoder());
      assert.equal(decoder.name, 'aac');
      assert.equal(decoder.type, AV_MEDIA_TYPE_AUDIO);
    });

    it('should return null for non-existent decoder ID', () => {
      // Use an extremely high ID that's unlikely to exist
      const decoder = Codec.findDecoder(999999 as any);
      assert.equal(decoder, null);
    });

    it('should return null for non-existent decoder name', () => {
      const decoder = Codec.findDecoderByName('nonexistent_codec_xyz');
      assert.equal(decoder, null);
    });

    it('should find common video decoders', () => {
      const codecIds = [
        AV_CODEC_ID_H264,
        AV_CODEC_ID_HEVC,  // H.265
        AV_CODEC_ID_VP8,
        AV_CODEC_ID_VP9,
        AV_CODEC_ID_AV1,
        AV_CODEC_ID_MPEG4,
        AV_CODEC_ID_MJPEG,
      ];

      for (const id of codecIds) {
        const decoder = Codec.findDecoder(id);
        assert.ok(decoder, `Decoder for codec ID ${id} should exist`);
        assert.ok(decoder.isDecoder());
        assert.equal(decoder.type, AV_MEDIA_TYPE_VIDEO);
      }
    });

    it('should find common audio decoders', () => {
      const codecIds = [
        AV_CODEC_ID_AAC,
        AV_CODEC_ID_MP3,
        AV_CODEC_ID_OPUS,
        AV_CODEC_ID_VORBIS,
        AV_CODEC_ID_FLAC,
        AV_CODEC_ID_AC3,
        AV_CODEC_ID_PCM_S16LE,
      ];

      for (const id of codecIds) {
        const decoder = Codec.findDecoder(id);
        assert.ok(decoder, `Decoder for codec ID ${id} should exist`);
        assert.ok(decoder.isDecoder());
        assert.equal(decoder.type, AV_MEDIA_TYPE_AUDIO);
      }
    });
  });

  describe('Find Encoders', () => {
    it('should find H.264 encoder by ID', () => {
      const encoder = Codec.findEncoder(AV_CODEC_ID_H264);
      // H.264 encoder might not be available in all builds
      if (encoder) {
        assert.ok(encoder.isEncoder());
        assert.equal(encoder.id, AV_CODEC_ID_H264);
        assert.equal(encoder.type, AV_MEDIA_TYPE_VIDEO);
      }
    });

    it('should find encoder by name', () => {
      // Try to find libx264 encoder (common software encoder)
      const encoder = Codec.findEncoderByName('libx264');
      // libx264 might not be available in all builds
      if (encoder) {
        assert.ok(encoder.isEncoder());
        assert.equal(encoder.name, 'libx264');
        assert.equal(encoder.type, AV_MEDIA_TYPE_VIDEO);
      } else {
        // Try fallback to any h264 encoder
        const fallback = Codec.findEncoder(AV_CODEC_ID_H264);
        // Skip test if no H.264 encoder is available
        if (!fallback) {
          console.log('No H.264 encoder available, skipping test');
        }
      }
    });

    it('should find AAC encoder by ID', () => {
      const encoder = Codec.findEncoder(AV_CODEC_ID_AAC);
      if (encoder) {
        assert.ok(encoder.isEncoder());
        assert.equal(encoder.id, AV_CODEC_ID_AAC);
        assert.equal(encoder.type, AV_MEDIA_TYPE_AUDIO);
      }
    });

    it('should return null for non-existent encoder', () => {
      const encoder = Codec.findEncoderByName('nonexistent_encoder_xyz');
      assert.equal(encoder, null);
    });

    it('should find PNG encoder', () => {
      const encoder = Codec.findEncoder(AV_CODEC_ID_PNG);
      assert.ok(encoder);
      assert.ok(encoder.isEncoder());
      assert.equal(encoder.id, AV_CODEC_ID_PNG);
      assert.equal(encoder.type, AV_MEDIA_TYPE_VIDEO);
    });

    it('should find PCM encoder', () => {
      const encoder = Codec.findEncoder(AV_CODEC_ID_PCM_S16LE);
      assert.ok(encoder);
      assert.ok(encoder.isEncoder());
      assert.equal(encoder.id, AV_CODEC_ID_PCM_S16LE);
      assert.equal(encoder.type, AV_MEDIA_TYPE_AUDIO);
    });
  });

  describe('Codec Properties', () => {
    it('should have correct properties for H.264 decoder', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);

      // Basic properties
      assert.equal(decoder.name, 'h264');
      assert.ok(decoder.longName);
      assert.ok(decoder.longName.includes('H.264') || decoder.longName.includes('AVC'));
      assert.equal(decoder.type, AV_MEDIA_TYPE_VIDEO);
      assert.equal(decoder.id, AV_CODEC_ID_H264);

      // Capabilities
      assert.ok(typeof decoder.capabilities === 'number');

      // Check if decoder, not encoder
      assert.ok(decoder.isDecoder());
      assert.ok(!decoder.isEncoder());
    });

    it('should have correct properties for AAC decoder', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_AAC);
      assert.ok(decoder);

      assert.equal(decoder.name, 'aac');
      assert.ok(decoder.longName);
      assert.equal(decoder.type, AV_MEDIA_TYPE_AUDIO);
      assert.equal(decoder.id, AV_CODEC_ID_AAC);

      assert.ok(decoder.isDecoder());
      assert.ok(!decoder.isEncoder());
    });

    it('should have max lowres property', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);
      assert.ok(typeof decoder.maxLowres === 'number');
      assert.ok(decoder.maxLowres >= 0);
    });

    it('should check experimental flag', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);
      // H.264 decoder should not be experimental
      assert.ok(!decoder.isExperimental());
    });

    it('should have wrapper property', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);
      // wrapper can be null or a string
      const wrapper = decoder.wrapper;
      assert.ok(wrapper === null || typeof wrapper === 'string');
    });
  });

  describe('Codec Formats and Profiles', () => {
    it('should have pixel formats for video decoder', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);

      const pixelFormats = decoder.pixelFormats;
      // H.264 decoder should support pixel formats
      if (pixelFormats) {
        assert.ok(Array.isArray(pixelFormats));
        assert.ok(pixelFormats.length > 0);
        // Should be numbers (AVPixelFormat enum values)
        assert.ok(pixelFormats.every((fmt) => typeof fmt === 'number'));
      }
    });

    it('should have sample formats for audio decoder', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_AAC);
      assert.ok(decoder);

      const sampleFormats = decoder.sampleFormats;
      if (sampleFormats) {
        assert.ok(Array.isArray(sampleFormats));
        assert.ok(sampleFormats.length > 0);
        // Should be numbers (AVSampleFormat enum values)
        assert.ok(sampleFormats.every((fmt) => typeof fmt === 'number'));
      }
    });

    it('should have supported sample rates for audio codec', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_AAC);
      assert.ok(decoder);

      const sampleRates = decoder.supportedSamplerates;
      // AAC typically supports specific sample rates
      if (sampleRates) {
        assert.ok(Array.isArray(sampleRates));
        assert.ok(sampleRates.length > 0);
        // Common sample rates
        assert.ok(sampleRates.every((rate) => typeof rate === 'number' && rate > 0));
      }
    });

    it('should have channel layouts for audio codec', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_AAC);
      assert.ok(decoder);

      const channelLayouts = decoder.channelLayouts;
      if (channelLayouts) {
        assert.ok(Array.isArray(channelLayouts));
        // Channel layouts are complex objects
      }
    });

    it('should have profiles for H.264', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);

      const profiles = decoder.profiles;
      // H.264 has profiles like Baseline, Main, High
      if (profiles) {
        assert.ok(Array.isArray(profiles));
        assert.ok(profiles.length > 0);
        // Each profile should have profile and name properties
        profiles.forEach((p) => {
          assert.ok(typeof p.profile === 'number');
          assert.ok(typeof p.name === 'string');
        });
      }
    });

    it('should get hardware configurations', () => {
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);

      // Try to get first hardware config
      const hwConfig = decoder.getHwConfig(0);
      
      // hwConfig might be null if no hardware acceleration available
      if (hwConfig) {
        assert.ok(typeof hwConfig === 'object');
        assert.ok('pixFmt' in hwConfig);
        assert.ok('methods' in hwConfig);
        assert.ok('deviceType' in hwConfig);
        assert.ok(typeof hwConfig.pixFmt === 'number');
        assert.ok(typeof hwConfig.methods === 'number');
        assert.ok(typeof hwConfig.deviceType === 'number');
      } else {
        // It's ok to have no hardware config
        assert.equal(hwConfig, null);
      }
    });

    it('should have supported framerates for some codecs', () => {
      // MPEG-2 typically has specific supported framerates
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);

      const framerates = decoder.supportedFramerates;
      // Can be null (any framerate) or array of Rationals
      if (framerates) {
        assert.ok(Array.isArray(framerates));
        framerates.forEach((rate) => {
          assert.ok(typeof rate.num === 'number');
          assert.ok(typeof rate.den === 'number');
          assert.ok(rate.den !== 0);
        });
      }
    });
  });

  describe('Codec List and Iteration', () => {
    it('should get codec list', () => {
      const codecs = Codec.getCodecList();
      assert.ok(Array.isArray(codecs));
      assert.ok(codecs.length > 0);

      // Should have both encoders and decoders
      const encoders = codecs.filter((c) => c.isEncoder());
      const decoders = codecs.filter((c) => c.isDecoder());
      assert.ok(encoders.length > 0);
      assert.ok(decoders.length > 0);

      // Should have both audio and video codecs
      const videoCodecs = codecs.filter((c) => c.type === AV_MEDIA_TYPE_VIDEO);
      const audioCodecs = codecs.filter((c) => c.type === AV_MEDIA_TYPE_AUDIO);
      assert.ok(videoCodecs.length > 0);
      assert.ok(audioCodecs.length > 0);
    });

    it('should iterate through codecs', () => {
      const codecs: Codec[] = [];
      let opaque: bigint | null = null;
      let count = 0;
      const maxIterations = 1000; // Safety limit

      while (count < maxIterations) {
        const result = Codec.iterateCodecs(opaque);
        if (!result) break;

        codecs.push(result.codec);
        opaque = result.opaque;
        count++;

        // Verify codec has required properties
        assert.ok(result.codec.name);
        assert.ok(typeof result.codec.type === 'number');
        assert.ok(typeof result.codec.id === 'number');
      }

      assert.ok(codecs.length > 0);
      assert.ok(codecs.length < maxIterations, 'Iteration should terminate');

      // Should find common codecs
      const h264 = codecs.find((c) => c.name === 'h264' && c.isDecoder());
      assert.ok(h264, 'Should find H.264 decoder through iteration');
    });

    it('should match getCodecList with iteration', () => {
      // Get all codecs via list
      const listCodecs = Codec.getCodecList();

      // Get all codecs via iteration
      const iterCodecs: Codec[] = [];
      let opaque: bigint | null = null;

      while (true) {
        const result = Codec.iterateCodecs(opaque);
        if (!result) break;
        iterCodecs.push(result.codec);
        opaque = result.opaque;
      }

      // Should have same number of codecs
      assert.equal(iterCodecs.length, listCodecs.length);

      // Both should find same common codecs
      const listH264 = listCodecs.find((c) => c.name === 'h264' && c.isDecoder());
      const iterH264 = iterCodecs.find((c) => c.name === 'h264' && c.isDecoder());
      assert.ok(listH264);
      assert.ok(iterH264);
      assert.equal(listH264.id, iterH264.id);
    });
  });

  describe('Encoder vs Decoder', () => {
    it('should distinguish between encoder and decoder', () => {
      // Find H.264 decoder
      const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
      assert.ok(decoder);
      assert.ok(decoder.isDecoder());
      assert.ok(!decoder.isEncoder());

      // Find any H.264 encoder if available
      const encoder = Codec.findEncoder(AV_CODEC_ID_H264);
      if (encoder) {
        assert.ok(encoder.isEncoder());
        assert.ok(!encoder.isDecoder());
        // Both should have same codec ID but different names
        assert.equal(encoder.id, decoder.id);
      }
    });

    it('should find different implementations of same codec', () => {
      // Try to find different H.264 decoder implementations
      const h264 = Codec.findDecoderByName('h264');
      const h264_cuvid = Codec.findDecoderByName('h264_cuvid');

      if (h264) {
        assert.equal(h264.name, 'h264');
        assert.ok(h264.isDecoder());
      }

      // h264_cuvid is NVIDIA hardware decoder, might not be available
      if (h264_cuvid) {
        assert.equal(h264_cuvid.name, 'h264_cuvid');
        assert.ok(h264_cuvid.isDecoder());
        // Both decode H.264
        assert.equal(h264_cuvid.id, AV_CODEC_ID_H264);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined gracefully', () => {
      // Empty string should return null
      const decoder = Codec.findDecoderByName('');
      assert.equal(decoder, null);
    });

    it('should handle special codec IDs', () => {
      // PCM codecs should always be available
      const pcmDecoder = Codec.findDecoder(AV_CODEC_ID_PCM_S16LE);
      assert.ok(pcmDecoder);
      assert.equal(pcmDecoder.type, AV_MEDIA_TYPE_AUDIO);

      // PCM codecs typically don't need complex initialization
      assert.ok(pcmDecoder.isDecoder());
    });

    it('should handle codecs without certain properties', () => {
      // PCM codecs might not have profiles
      const pcmDecoder = Codec.findDecoder(AV_CODEC_ID_PCM_S16LE);
      assert.ok(pcmDecoder);

      // These can be null for simple codecs
      const profiles = pcmDecoder.profiles;
      // profiles can be null
      assert.ok(profiles === null || Array.isArray(profiles));
    });
  });
});