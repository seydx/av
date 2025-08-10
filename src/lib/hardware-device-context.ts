import { bindings } from './binding.js';

import type { AVHWDeviceType } from './constants.js';
import type { Dictionary } from './dictionary.js';
import type { NativeHardwareDeviceContext, NativeWrapper } from './native-types.js';

// Re-export hardware device type constants for convenience
export {
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_D3D12VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_MEDIACODEC,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_QSV,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_VDPAU,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_HWDEVICE_TYPE_VULKAN,
  type AVHWDeviceType,
} from './constants.js';

/**
 * Hardware frames constraints
 */
export interface HardwareFramesConstraints {
  /** Valid hardware pixel formats */
  validHwFormats?: number[];
  /** Valid software pixel formats */
  validSwFormats?: number[];
  /** Minimum frame width */
  minWidth: number;
  /** Minimum frame height */
  minHeight: number;
  /** Maximum frame width */
  maxWidth: number;
  /** Maximum frame height */
  maxHeight: number;
}

/**
 * Hardware device context for hardware-accelerated encoding/decoding
 *
 * Manages hardware acceleration devices like CUDA, VAAPI, VideoToolbox, etc.
 * Used to enable GPU-accelerated video processing.
 *
 * @example
 * ```typescript
 * // Create a CUDA device context
 * const hwContext = new HardwareDeviceContext(
 *   AV_HWDEVICE_TYPE_CUDA,
 *   '0' // GPU index
 * );
 *
 * // Use with codec context
 * codecContext.hwDeviceContext = hwContext;
 * ```
 */
export class HardwareDeviceContext implements Disposable, NativeWrapper<NativeHardwareDeviceContext> {
  private context: NativeHardwareDeviceContext; // Native hardware device context binding

  /**
   * Create a hardware device context
   * @param type Hardware device type (e.g., CUDA, VAAPI) or native context to wrap
   * @param device Optional device name (e.g., GPU index '0')
   * @param options Optional configuration dictionary
   * @throws Error if device creation fails
   */
  constructor(type: AVHWDeviceType | NativeHardwareDeviceContext, device?: string, options?: Dictionary) {
    if (typeof type === 'object') {
      // Wrapping an existing native context
      this.context = type;
    } else {
      // Creating a new hardware device context
      this.context = new bindings.HardwareDeviceContext(type, device, options?.getNative());

      if (!this.context) {
        throw new Error(`Failed to create hardware device context for type ${type}`);
      }
    }
  }

  /**
   * Find hardware device type by name
   * @param name Device type name (e.g., "cuda", "vaapi", "videotoolbox")
   * @returns Hardware device type or NONE if not found
   * @example
   * ```typescript
   * const type = HardwareDeviceContext.findTypeByName('cuda');
   * if (type !== AV_HWDEVICE_TYPE_NONE) {
   *   const context = new HardwareDeviceContext(type);
   * }
   * ```
   */
  static findTypeByName(name: string): AVHWDeviceType {
    try {
      const type = bindings.HardwareDeviceContext.findTypeByName(name);
      return (type ?? 0) as AVHWDeviceType;
    } catch {
      return 0 as AVHWDeviceType;
    }
  }

  /**
   * Get name of hardware device type
   * @param type Hardware device type
   * @returns Device type name or null
   */
  static getTypeName(type: AVHWDeviceType): string | null {
    try {
      return bindings.HardwareDeviceContext.getTypeName(type) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Get all supported hardware device types
   * @returns Array of supported hardware device types
   * @example
   * ```typescript
   * const types = HardwareDeviceContext.getSupportedTypes();
   * for (const { type, name } of types) {
   *   console.log(`${name}: ${type}`);
   * }
   * ```
   */
  static getSupportedTypes(): { type: AVHWDeviceType; name: string }[] {
    try {
      const types = bindings.HardwareDeviceContext.getSupportedTypes();
      return types.map((t) => ({ type: t.type as AVHWDeviceType, name: t.name }));
    } catch {
      return [];
    }
  }

  /**
   * Get hardware device type
   */
  get type(): AVHWDeviceType {
    return this.context.type;
  }

  /**
   * Get hardware frames constraints
   * @returns Constraints for frame formats and sizes, or null if not available
   * @example
   * ```typescript
   * const constraints = hwContext.getHardwareFramesConstraints();
   * if (constraints) {
   *   console.log(`Max resolution: ${constraints.maxWidth}x${constraints.maxHeight}`);
   * }
   * ```
   */
  getHardwareFramesConstraints(): HardwareFramesConstraints | null {
    return this.context.getHardwareFramesConstraints();
  }

  /**
   * Dispose of the hardware device context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }

  /**
   * Get native hardware device context for internal use
   * @internal
   */
  getNative(): NativeHardwareDeviceContext {
    return this.context;
  }
}
