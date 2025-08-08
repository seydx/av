import { bindings } from './binding.js';
import { type AVHWDeviceType } from './constants.js';

import type { Dictionary } from './dictionary.js';

// Re-export hardware device type constants for convenience
export {
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_VDPAU,
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_QSV,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_MEDIACODEC,
  AV_HWDEVICE_TYPE_VULKAN,
  AV_HWDEVICE_TYPE_D3D12VA,
  type AVHWDeviceType,
} from './constants.js';

/**
 * Hardware frames constraints
 */
export interface HardwareFramesConstraints {
  validHwFormats?: number[];
  validSwFormats?: number[];
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Hardware Device Context wrapper for hardware acceleration
 */
export class HardwareDeviceContext implements Disposable {
  private context: any;

  private constructor(context: any) {
    this.context = context;
  }

  /**
   * Create a hardware device context
   *
   * @param type Hardware device type
   * @param device Optional device name (e.g., GPU index)
   * @param options Optional configuration dictionary
   * @param flags Optional flags
   */
  static create(type: AVHWDeviceType, device?: string, options?: Dictionary, flags = 0): HardwareDeviceContext {
    const context = bindings.HardwareDeviceContext.create(type, device, options?.nativeDict, flags);

    if (!context) {
      throw new Error(`Failed to create hardware device context for type ${type}`);
    }

    return new HardwareDeviceContext(context);
  }

  /**
   * Find hardware device type by name
   *
   * @param name Device type name (e.g., "cuda", "vaapi", "videotoolbox")
   * @returns Hardware device type or NONE if not found
   */
  static findTypeByName(name: string): AVHWDeviceType {
    return bindings.HardwareDeviceContext.findTypeByName(name);
  }

  /**
   * Get name of hardware device type
   *
   * @param type Hardware device type
   * @returns Device type name or null
   */
  static getTypeName(type: AVHWDeviceType): string | null {
    return bindings.HardwareDeviceContext.getTypeName(type);
  }

  /**
   * Get all supported hardware device types
   *
   * @returns Array of supported hardware device types
   */
  static getSupportedTypes(): { type: AVHWDeviceType; name: string }[] {
    return bindings.HardwareDeviceContext.getSupportedTypes();
  }

  /**
   * Get hardware frames constraints
   *
   * @returns Constraints or null if not available
   */
  getHardwareFramesConstraints(): HardwareFramesConstraints | null {
    return this.context.getHardwareFramesConstraints();
  }

  /**
   * Get hardware device type
   */
  get type(): AVHWDeviceType {
    return this.context.type;
  }

  /**
   * Get native context for use with other APIs
   */
  get native(): any {
    return this.context;
  }

  /**
   * Dispose of the hardware device context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }
}
