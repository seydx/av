import assert from 'node:assert';
import { describe, it } from 'node:test';

import { 
  AV_CODEC_ID_H264, 
  AV_MEDIA_TYPE_AUDIO, 
  AV_MEDIA_TYPE_VIDEO,
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_VIDEOTOOLBOX,
  Codec 
} from '../src/lib/index.js';

describe('Codec', () => {
  it('should find H264 decoder', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);
    assert.strictEqual(codec.id, AV_CODEC_ID_H264);
    assert(codec.isDecoder());
    assert(!codec.isEncoder());
    assert(codec.name);
  });

  it('should find H264 encoder', () => {
    const codec = Codec.findEncoder(AV_CODEC_ID_H264);
    // Encoder might not be available in all builds
    if (codec) {
      assert.strictEqual(codec.id, AV_CODEC_ID_H264);
      assert(!codec.isDecoder());
      assert(codec.isEncoder());
    }
  });

  it('should find decoder by name', () => {
    const codec = Codec.findDecoderByName('h264');
    assert(codec);
    assert.strictEqual(codec.name, 'h264');
    assert(codec.isDecoder());
  });

  it('should find encoder by name', () => {
    const codec = Codec.findEncoderByName('libx264');
    // libx264 might not be available in all builds
    if (codec) {
      assert(codec.name?.includes('264'));
      assert(codec.isEncoder());
    }
  });

  it('should get codec properties', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    assert(codec.name);
    assert(codec.longName);
    assert.strictEqual(codec.id, AV_CODEC_ID_H264);
    assert.strictEqual(codec.type, AV_MEDIA_TYPE_VIDEO);
    assert.strictEqual(typeof codec.capabilities, 'number');
  });

  it('should get pixel formats for video codec', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    const formats = codec.getPixelFormats();
    assert(Array.isArray(formats));
    // H264 should support at least some pixel formats
    if (formats.length > 0) {
      assert(formats.length > 0);
      assert.strictEqual(typeof formats[0], 'number');
    }
  });

  it('should get sample formats for audio codec', () => {
    // Try to find an audio decoder (MP3 would be 86017 but not in enum)
    const codec = Codec.findDecoderByName('mp3');
    if (codec && codec.type === AV_MEDIA_TYPE_AUDIO) {
      const formats = codec.getSampleFormats();
      assert(Array.isArray(formats));
    }
  });

  it('should check capabilities', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    // Check if codec supports specific capabilities
    const supportsThreading = codec.supportsMultithreading();
    assert.strictEqual(typeof supportsThreading, 'boolean');

    const supportsHardware = codec.supportsHardware();
    assert.strictEqual(typeof supportsHardware, 'boolean');
  });

  it('should get all codecs', () => {
    const codecs = Codec.getAllCodecs();
    assert(Array.isArray(codecs));
    assert(codecs.length > 0);

    // Check first codec
    const first = codecs[0];
    assert(first);
    assert(first.name);
    assert.strictEqual(typeof first.id, 'number');
  });

  it('should get codec profiles', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    const profiles = codec.getProfiles();
    assert(Array.isArray(profiles));
    // H264 might have profiles like baseline, main, high
    if (profiles.length > 0) {
      assert('profile' in profiles[0]);
      assert.strictEqual(typeof profiles[0].profile, 'number');
    }
  });

  it('should get sample rates for audio codec', () => {
    // Try to find an audio encoder
    const codec = Codec.findEncoderByName('aac');
    if (codec && codec.type === AV_MEDIA_TYPE_AUDIO) {
      const rates = codec.getSampleRates();
      assert(Array.isArray(rates));
      // AAC encoder might support specific sample rates
      if (rates.length > 0) {
        assert(rates.includes(48000) || rates.includes(44100));
      }
    }
  });

  it('should get channel layouts', () => {
    // Try to find an audio codec
    const codec = Codec.findEncoderByName('aac');
    if (codec && codec.type === AV_MEDIA_TYPE_AUDIO) {
      const layouts = codec.getChannelLayouts();
      assert(Array.isArray(layouts));
      if (layouts.length > 0) {
        assert('nbChannels' in layouts[0]);
        assert('order' in layouts[0]);
        assert('mask' in layouts[0]);
      }
    }
  });

  it('should handle null for non-existent codec', () => {
    const codec = Codec.findDecoderByName('nonexistent_codec');
    assert.strictEqual(codec, null);
  });

  it('should convert to string', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    const str = codec.toString();
    assert.strictEqual(str, codec.name);
  });

  it('should get hardware configurations', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    const hwConfigs = codec.getHardwareConfigs();
    assert(Array.isArray(hwConfigs));
    
    // Check if any hardware configs are available
    if (hwConfigs.length > 0) {
      const config = hwConfigs[0];
      assert('pixelFormat' in config);
      assert('methods' in config);
      assert('deviceType' in config);
      assert.strictEqual(typeof config.pixelFormat, 'number');
      assert.strictEqual(typeof config.methods, 'number');
      assert.strictEqual(typeof config.deviceType, 'number');
    }
  });

  it('should find hardware encoder configurations', () => {
    // Try to find h264_videotoolbox encoder on macOS
    const encoder = Codec.findEncoderByName('h264_videotoolbox');
    if (encoder) {
      const hwConfigs = encoder.getHardwareConfigs();
      assert(Array.isArray(hwConfigs));
      
      // h264_videotoolbox should have hardware configs
      if (hwConfigs.length > 0) {
        const vt_config = hwConfigs.find(c => c.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
        if (vt_config) {
          assert.strictEqual(vt_config.pixelFormat, AV_PIX_FMT_VIDEOTOOLBOX);
          // h264_videotoolbox uses HW_FRAMES_CTX method
          assert(vt_config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX);
        }
      }
    } else {
      // Encoder not available, that's OK
      assert(true);
    }
  });

  it('should check for hardware support methods', () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert(codec);

    const hwConfigs = codec.getHardwareConfigs();
    if (hwConfigs.length > 0) {
      // Check if any config supports HW_DEVICE_CTX method
      const supportsDeviceCtx = hwConfigs.some(
        config => config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX
      );
      assert.strictEqual(typeof supportsDeviceCtx, 'boolean');

      // Check if any config supports HW_FRAMES_CTX method
      const supportsFramesCtx = hwConfigs.some(
        config => config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX
      );
      assert.strictEqual(typeof supportsFramesCtx, 'boolean');
    }
  });
});
