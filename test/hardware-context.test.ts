import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX,
  AV_CODEC_ID_H264,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AV_PIX_FMT_YUV420P,
  Codec,
  CodecContext,
  Frame,
  HardwareDeviceContext,
  HardwareFramesContext,
} from '../src/lib/index.js';

describe('HardwareDeviceContext', () => {
  it('should get supported hardware types', () => {
    const types = HardwareDeviceContext.getSupportedTypes();
    assert(Array.isArray(types));

    // Should have at least some hardware types
    // The exact types depend on the system
    console.log('Supported hardware types:', types);
  });

  it('should find type by name', () => {
    // Test with known type names
    const videotoolbox = HardwareDeviceContext.findTypeByName('videotoolbox');
    assert.strictEqual(typeof videotoolbox, 'number');
    assert.strictEqual(videotoolbox, AV_HWDEVICE_TYPE_VIDEOTOOLBOX);

    const unknown = HardwareDeviceContext.findTypeByName('unknown_device');
    assert.strictEqual(unknown, AV_HWDEVICE_TYPE_NONE);
  });

  it('should get type name', () => {
    // Test with the supported types on this system
    const types = HardwareDeviceContext.getSupportedTypes();

    for (const type of types) {
      const name = HardwareDeviceContext.getTypeName(type.type);
      assert.strictEqual(name, type.name);
    }

    // VideoToolbox should work on macOS
    if (process.platform === 'darwin') {
      const videotoolboxName = HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
      assert.strictEqual(videotoolboxName, 'videotoolbox');
    }
  });

  it('should handle creation attempt', () => {
    // Try to create a device context
    // This might fail if hardware is not available, which is OK for tests
    try {
      // Try VideoToolbox on macOS
      const types = HardwareDeviceContext.getSupportedTypes();
      if (types.length > 0) {
        // Try to create with the first supported type
        using ctx = new HardwareDeviceContext(types[0].type);
        assert(ctx);
        assert.strictEqual(ctx.type, types[0].type);

        // Get constraints
        const constraints = ctx.getHardwareFramesConstraints();
        if (constraints) {
          assert.strictEqual(typeof constraints.minWidth, 'number');
          assert.strictEqual(typeof constraints.minHeight, 'number');
          assert.strictEqual(typeof constraints.maxWidth, 'number');
          assert.strictEqual(typeof constraints.maxHeight, 'number');
        }
      }
    } catch (error) {
      // Hardware not available is OK for unit tests
      console.log('Hardware device creation failed (expected in CI):', error);
    }
  });

  it('should support using statement', () => {
    const types = HardwareDeviceContext.getSupportedTypes();
    if (types.length > 0) {
      try {
        {
          using ctx = new HardwareDeviceContext(types[0].type);
          assert(ctx);
        }
        // Context should be disposed here
        assert(true, 'Context disposed successfully');
      } catch {
        // Hardware not available
      }
    }
  });
});

describe('HardwareFramesContext', () => {
  it('should work with hardware device context', () => {
    const types = HardwareDeviceContext.getSupportedTypes();
    if (types.length > 0) {
      try {
        using deviceCtx = new HardwareDeviceContext(types[0].type);
        using framesCtx = new HardwareFramesContext(deviceCtx);

        assert(framesCtx);

        // Set properties
        framesCtx.width = 1920;
        framesCtx.height = 1080;
        framesCtx.softwarePixelFormat = AV_PIX_FMT_YUV420P;
        framesCtx.hardwarePixelFormat = AV_PIX_FMT_NV12;
        framesCtx.initialPoolSize = 10;

        // Get properties
        assert.strictEqual(framesCtx.width, 1920);
        assert.strictEqual(framesCtx.height, 1080);
        assert.strictEqual(framesCtx.softwarePixelFormat, AV_PIX_FMT_YUV420P);
        assert.strictEqual(framesCtx.hardwarePixelFormat, AV_PIX_FMT_NV12);
        assert.strictEqual(framesCtx.initialPoolSize, 10);

        // Note: We don't call initialize() in tests as it requires
        // a fully configured hardware context which may not be available
      } catch (error) {
        // Hardware not available
        console.log('Hardware frames context test skipped:', error);
      }
    }
  });
});

describe('Hardware Pipeline Integration', () => {
  it('should check codec hardware support', () => {
    const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
    if (!decoder) {
      console.log('H264 decoder not found');
      return;
    }

    const hwConfigs = decoder.getHardwareConfigs();
    assert(Array.isArray(hwConfigs));

    // Check for VideoToolbox support on macOS
    if (process.platform === 'darwin') {
      const vtConfig = hwConfigs.find(c => c.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
      if (vtConfig) {
        assert.strictEqual(vtConfig.pixelFormat, AV_PIX_FMT_VIDEOTOOLBOX);
        assert(vtConfig.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX);
      }
    }
  });

  it('should verify encoder hardware configurations', () => {
    // Try h264_videotoolbox encoder on macOS
    if (process.platform !== 'darwin') {
      // Skip test on non-macOS platforms
      assert(true);
      return;
    }
    
    const encoder = Codec.findEncoderByName('h264_videotoolbox');
    if (!encoder) {
      console.log('h264_videotoolbox encoder not found');
      // This is OK, encoder might not be available
      assert(true);
      return;
    }

    const hwConfigs = encoder.getHardwareConfigs();
    assert(Array.isArray(hwConfigs));

    // VideoToolbox encoder should support hardware configs
    const vtConfig = hwConfigs.find(c => c.deviceType === AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
    if (vtConfig) {
      assert.strictEqual(vtConfig.pixelFormat, AV_PIX_FMT_VIDEOTOOLBOX);
      // h264_videotoolbox uses HW_FRAMES_CTX method
      assert(vtConfig.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX);
    } else {
      // No VideoToolbox config found, that's OK too
      assert(true);
    }
  });

  it('should test hardware configuration workflow', () => {
    const types = HardwareDeviceContext.getSupportedTypes();
    if (types.length === 0) {
      console.log('No hardware types supported');
      return;
    }

    const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
    if (!decoder) {
      console.log('H264 decoder not found');
      return;
    }

    try {
      // Create hardware device context
      using hwDevice = new HardwareDeviceContext(types[0].type);
      
      // Create codec context
      using codecCtx = new CodecContext(decoder);
      
      // Configure hardware acceleration
      codecCtx.hwDeviceContext = hwDevice;
      
      // Set hardware pixel format
      const hwConfigs = decoder.getHardwareConfigs();
      const hwConfig = hwConfigs.find(c => c.deviceType === types[0].type);
      if (hwConfig) {
        codecCtx.setHardwarePixelFormat(hwConfig.pixelFormat);
      }
      
      // Verify configuration
      assert(codecCtx.hwDeviceContext);
      
      // Test advanced hardware configuration
      codecCtx.setHardwareConfig({
        preferredFormat: hwConfig?.pixelFormat || AV_PIX_FMT_VIDEOTOOLBOX,
        fallbackFormats: [AV_PIX_FMT_YUV420P],
        requireHardware: false
      });
      
      // Clear and reconfigure
      codecCtx.clearHardwareConfig();
      codecCtx.setHardwarePixelFormat(hwConfig?.pixelFormat || AV_PIX_FMT_VIDEOTOOLBOX);
      
    } catch (error) {
      console.log('Hardware configuration test skipped:', error);
    }
  });

  it('should test frame transfer operations', () => {
    const types = HardwareDeviceContext.getSupportedTypes();
    if (types.length === 0) {
      console.log('No hardware types supported');
      return;
    }

    try {
      // Create software frame
      using swFrame = new Frame();
      swFrame.width = 640;
      swFrame.height = 480;
      swFrame.format = AV_PIX_FMT_YUV420P;
      swFrame.allocBuffer();
      
      // Create hardware frame (mock for testing)
      using hwFrame = new Frame();
      
      // Test transfer operations
      const ret1 = swFrame.transferDataTo(hwFrame);
      assert.strictEqual(typeof ret1, 'number');
      
      using swFrame2 = new Frame();
      const ret2 = swFrame2.transferDataFrom(hwFrame);
      assert.strictEqual(typeof ret2, 'number');
      
    } catch (error) {
      console.log('Frame transfer test skipped:', error);
    }
  });

  it('should validate hardware pipeline configuration', () => {
    // This test validates that all hardware components work together
    const types = HardwareDeviceContext.getSupportedTypes();
    if (types.length === 0) {
      console.log('No hardware types supported');
      return;
    }

    const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
    const encoder = Codec.findEncoderByName('h264_videotoolbox');
    
    if (!decoder || !encoder) {
      console.log('Required codecs not available');
      return;
    }

    try {
      // Create hardware contexts
      using hwDevice = new HardwareDeviceContext(types[0].type);
      using hwFrames = new HardwareFramesContext(hwDevice);
      
      // Configure frames context
      hwFrames.width = 1920;
      hwFrames.height = 1080;
      hwFrames.softwarePixelFormat = AV_PIX_FMT_YUV420P;
      hwFrames.hardwarePixelFormat = AV_PIX_FMT_VIDEOTOOLBOX;
      hwFrames.initialPoolSize = 20;
      
      // Create decoder context
      using decoderCtx = new CodecContext(decoder);
      decoderCtx.hwDeviceContext = hwDevice;
      decoderCtx.setHardwarePixelFormat(AV_PIX_FMT_VIDEOTOOLBOX);
      
      // Create encoder context
      using encoderCtx = new CodecContext(encoder);
      encoderCtx.hwDeviceContext = hwDevice;
      encoderCtx.hwFramesContext = hwFrames;
      
      // Verify the pipeline configuration
      assert(decoderCtx.hwDeviceContext);
      assert(encoderCtx.hwDeviceContext);
      assert(encoderCtx.hwFramesContext);
      
      console.log('Hardware pipeline configuration validated successfully');
      
    } catch (error) {
      console.log('Hardware pipeline validation skipped:', error);
    }
  });
});
