import { bindings } from './binding.js';

import type { AVHWDeviceType } from './constants.js';
import type { Dictionary } from './dictionary.js';
import type { NativeHardwareDeviceContext, NativeWrapper } from './native-types.js';

/**
 * FFmpeg Hardware Device Context - Low Level API
 *
 * Direct mapping to FFmpeg's AVHWDeviceContext.
 * Provides hardware acceleration device management.
 *
 * @example
 * ```typescript
 * // Create CUDA device context
 * const device = new HardwareDeviceContext();
 * const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Get device constraints
 * const constraints = device.getHwframeConstraints();
 * console.log(`Max size: ${constraints.maxWidth}x${constraints.maxHeight}`);
 *
 * // Create frames context for this device
 * const frames = new HardwareFramesContext();
 * frames.alloc(device);
 * frames.format = AV_PIX_FMT_CUDA;
 * frames.swFormat = AV_PIX_FMT_NV12;
 * frames.width = 1920;
 * frames.height = 1080;
 * frames.init();
 *
 * // Cleanup
 * frames.free();
 * device.free();
 * ```
 *
 * @example
 * ```typescript
 * // List available hardware device types
 * const types = HardwareDeviceContext.iterateTypes();
 * for (const type of types) {
 *   const name = HardwareDeviceContext.getTypeName(type);
 *   console.log(`Available: ${name}`);
 * }
 *
 * // Find specific device type
 * const vaapi = HardwareDeviceContext.findTypeByName('vaapi');
 * if (vaapi !== AV_HWDEVICE_TYPE_NONE) {
 *   const device = new HardwareDeviceContext();
 *   device.create(vaapi, '/dev/dri/renderD128', null);
 * }
 * ```
 */
export class HardwareDeviceContext implements Disposable, NativeWrapper<NativeHardwareDeviceContext> {
  private native: NativeHardwareDeviceContext;

  // Constructor
  /**
   * Create a new hardware device context.
   *
   * The context is uninitialized - you must call alloc() or create() before use.
   * Direct wrapper around AVHWDeviceContext.
   *
   * @example
   * ```typescript
   * const device = new HardwareDeviceContext();
   * device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   * // Device is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.HardwareDeviceContext();
  }

  // Static Methods - Low Level API

  /**
   * Get the string name of an AVHWDeviceType.
   *
   * Direct mapping to av_hwdevice_get_type_name()
   *
   * @param type - Hardware device type (AVHWDeviceType)
   *
   * @returns Device type name or null if unknown
   *
   * @example
   * ```typescript
   * const name = HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_CUDA);
   * console.log(name); // "cuda"
   * ```
   */
  static getTypeName(type: AVHWDeviceType): string | null {
    return bindings.HardwareDeviceContext.getTypeName(type);
  }

  /**
   * Iterate over supported device types.
   *
   * Direct mapping to av_hwdevice_iterate_types()
   *
   * @returns Array of supported AVHWDeviceType values
   *
   * @example
   * ```typescript
   * const types = HardwareDeviceContext.iterateTypes();
   * for (const type of types) {
   *   const name = HardwareDeviceContext.getTypeName(type);
   *   console.log(`Supported: ${name}`);
   * }
   * ```
   */
  static iterateTypes(): AVHWDeviceType[] {
    return bindings.HardwareDeviceContext.iterateTypes();
  }

  /**
   * Get the AVHWDeviceType corresponding to the name.
   *
   * Direct mapping to av_hwdevice_find_type_by_name()
   *
   * @param name - Device type name (e.g., "cuda", "vaapi", "dxva2")
   *
   * @returns AVHWDeviceType or AV_HWDEVICE_TYPE_NONE if not found
   *
   * @example
   * ```typescript
   * const type = HardwareDeviceContext.findTypeByName('cuda');
   * if (type !== AV_HWDEVICE_TYPE_NONE) {
   *   // CUDA is available
   * }
   * ```
   */
  static findTypeByName(name: string): AVHWDeviceType {
    return bindings.HardwareDeviceContext.findTypeByName(name);
  }

  // Getter/Setter Properties

  /**
   * Hardware device type.
   *
   * Direct mapping to AVHWDeviceContext->type
   *
   * @readonly
   */
  get type(): AVHWDeviceType {
    return this.native.type;
  }

  /**
   * Hardware-specific data.
   *
   * Direct mapping to AVHWDeviceContext->hwctx
   *
   * Returns opaque pointer as BigInt for advanced users.
   * @readonly
   */
  get hwctx(): bigint | null {
    return this.native.hwctx;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an AVHWDeviceContext for a given hardware type.
   *
   * Direct mapping to av_hwdevice_ctx_alloc()
   *
   * @param type - Hardware device type
   *
   * @example
   * ```typescript
   * const device = new HardwareDeviceContext();
   * device.alloc(AV_HWDEVICE_TYPE_CUDA);
   * // Configure device properties if needed
   * device.init();
   * ```
   *
   * @throws {Error} If allocation fails
   */
  alloc(type: AVHWDeviceType): void {
    this.native.alloc(type);
  }

  /**
   * Finalize the device context before use.
   *
   * Direct mapping to av_hwdevice_ctx_init()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * const ret = device.init();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Open a device of the specified type and create an AVHWDeviceContext.
   *
   * Direct mapping to av_hwdevice_ctx_create()
   *
   * @param type - Hardware device type
   * @param device - Device to open (e.g., "/dev/dri/renderD128" for VAAPI), or null for default
   * @param options - Device creation options, or null
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(ENOSYS): Device type not supported
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * // Create CUDA device
   * const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Create VAAPI device with specific device
   * const ret2 = device.create(
   *   AV_HWDEVICE_TYPE_VAAPI,
   *   '/dev/dri/renderD128',
   *   null
   * );
   * ```
   */
  create(type: AVHWDeviceType, device: string | null, options: Dictionary | null): number {
    return this.native.create(type, device, options?.getNative() ?? null);
  }

  /**
   * Create a new device of the specified type from an existing device.
   *
   * Direct mapping to av_hwdevice_ctx_create_derived()
   *
   * @param source - Source device context to derive from
   * @param type - Target hardware device type
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOSYS): Derivation not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Create CUDA device from VAAPI device
   * const vaapi = new HardwareDeviceContext();
   * vaapi.create(AV_HWDEVICE_TYPE_VAAPI, null, null);
   *
   * const cuda = new HardwareDeviceContext();
   * const ret = cuda.createDerived(vaapi, AV_HWDEVICE_TYPE_CUDA);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  createDerived(source: HardwareDeviceContext, type: AVHWDeviceType): number {
    return this.native.createDerived(source.native, type);
  }

  /**
   * Free the device context.
   *
   * Unreferences the AVBufferRef.
   *
   * @example
   * ```typescript
   * device.free();
   * // device is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  // Public Methods - Configuration

  /**
   * Allocate a HW-specific configuration structure.
   *
   * Direct mapping to av_hwdevice_hwconfig_alloc()
   *
   * @returns Opaque pointer as BigInt or null
   *
   * @example
   * ```typescript
   * const hwconfig = device.hwconfigAlloc();
   * if (hwconfig) {
   *   // Use with getHwframeConstraints
   *   const constraints = device.getHwframeConstraints(hwconfig);
   * }
   * ```
   */
  hwconfigAlloc(): bigint | null {
    return this.native.hwconfigAlloc();
  }

  /**
   * Get the constraints on HW frames given a device and parameters.
   *
   * Direct mapping to av_hwdevice_get_hwframe_constraints()
   *
   * @param hwconfig - Hardware configuration from hwconfigAlloc(), or undefined
   *
   * @returns Constraints object or null
   *
   * @example
   * ```typescript
   * const constraints = device.getHwframeConstraints();
   * if (constraints) {
   *   console.log(`Size range: ${constraints.minWidth}x${constraints.minHeight} to ${constraints.maxWidth}x${constraints.maxHeight}`);
   *
   *   if (constraints.validSwFormats) {
   *     console.log('Valid software formats:', constraints.validSwFormats);
   *   }
   * }
   * ```
   */
  getHwframeConstraints(hwconfig?: bigint): {
    validHwFormats?: number[];
    validSwFormats?: number[];
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  } | null {
    return this.native.getHwframeConstraints(hwconfig);
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVHWDeviceContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native hardware device context object
   */
  getNative(): NativeHardwareDeviceContext {
    return this.native;
  }

  /**
   * Dispose of the hardware device context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using device = new HardwareDeviceContext();
   *   device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   *   // ... use device
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
