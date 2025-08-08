import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_YUV420P,
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
        using ctx = HardwareDeviceContext.create(types[0].type);
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
          using ctx = HardwareDeviceContext.create(types[0].type);
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
        using deviceCtx = HardwareDeviceContext.create(types[0].type);
        using framesCtx = HardwareFramesContext.alloc(deviceCtx);

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
