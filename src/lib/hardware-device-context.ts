import { bindings } from './binding.js';

import type { AVHWDeviceType } from './constants.js';
import type { Dictionary } from './dictionary.js';
import type { NativeHardwareDeviceContext, NativeWrapper } from './native-types.js';

/**
 * Hardware device context for hardware acceleration.
 *
 * Manages hardware acceleration devices like CUDA, VAAPI, DXVA2, etc.
 * Provides device creation, configuration, and constraint querying.
 * Required for hardware-accelerated encoding, decoding, and filtering.
 *
 * Direct mapping to FFmpeg's AVHWDeviceContext.
 *
 * @example
 * ```typescript
 * import { HardwareDeviceContext, HardwareFramesContext, FFmpegError } from '@seydx/av';
 * import { AV_HWDEVICE_TYPE_CUDA, AV_PIX_FMT_CUDA, AV_PIX_FMT_NV12 } from '@seydx/av/constants';
 *
 * // Create CUDA device context
 * const device = new HardwareDeviceContext();
 * const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
 * FFmpegError.throwIfError(ret, 'create device');
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
 * const initRet = frames.init();
 * FFmpegError.throwIfError(initRet, 'init frames');
 *
 * // Cleanup
 * frames.free();
 * device.free();
 * ```
 *
 * @example
 * ```typescript
 * import { HardwareDeviceContext } from '@seydx/av';
 * import { AV_HWDEVICE_TYPE_NONE } from '@seydx/av/constants';
 *
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
 *   const ret = device.create(vaapi, '/dev/dri/renderD128', null);
 *   FFmpegError.throwIfError(ret, 'create VAAPI device');
 * }
 * ```
 *
 * @see {@link HardwareFramesContext} For managing hardware frame pools
 * @see {@link CodecContext} For hardware-accelerated encoding/decoding
 */
export class HardwareDeviceContext implements Disposable, NativeWrapper<NativeHardwareDeviceContext> {
  private native: NativeHardwareDeviceContext;

  /**
   * Create a new hardware device context.
   *
   * The context is uninitialized - you must call alloc() or create() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around AVHWDeviceContext.
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
   *
   * const device = new HardwareDeviceContext();
   * const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   * FFmpegError.throwIfError(ret, 'create device');
   * // Device is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.HardwareDeviceContext();
  }

  /**
   * Get the string name of an AVHWDeviceType.
   *
   * Returns the human-readable name for a hardware device type.
   *
   * Direct mapping to av_hwdevice_get_type_name()
   *
   * @param type - Hardware device type (AVHWDeviceType)
   *
   * @returns Device type name or null if unknown
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
   *
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
   * Returns all hardware device types supported by this FFmpeg build.
   *
   * Direct mapping to av_hwdevice_iterate_types()
   *
   * @returns Array of supported AVHWDeviceType values
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   *
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
   * Looks up a hardware device type by its string name.
   *
   * Direct mapping to av_hwdevice_find_type_by_name()
   *
   * @param name - Device type name (e.g., "cuda", "vaapi", "dxva2")
   *
   * @returns AVHWDeviceType or AV_HWDEVICE_TYPE_NONE if not found
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_NONE } from '@seydx/av/constants';
   *
   * const type = HardwareDeviceContext.findTypeByName('cuda');
   * if (type !== AV_HWDEVICE_TYPE_NONE) {
   *   // CUDA is available
   * }
   * ```
   */
  static findTypeByName(name: string): AVHWDeviceType {
    return bindings.HardwareDeviceContext.findTypeByName(name);
  }

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

  /**
   * Allocate an AVHWDeviceContext for a given hardware type.
   *
   * Allocates the device context structure but doesn't open the device.
   * Must call init() after configuration to finalize.
   *
   * Direct mapping to av_hwdevice_ctx_alloc()
   *
   * @param type - Hardware device type
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
   *
   * const device = new HardwareDeviceContext();
   * device.alloc(AV_HWDEVICE_TYPE_CUDA);
   * // Configure device properties if needed
   * const ret = device.init();
   * FFmpegError.throwIfError(ret, 'init device');
   * ```
   *
   * @see {@link init} To finalize the device
   * @see {@link create} For one-step device creation
   */
  alloc(type: AVHWDeviceType): void {
    this.native.alloc(type);
  }

  /**
   * Finalize the device context before use.
   *
   * Completes device initialization after alloc() and configuration.
   * Must be called before using the device context.
   *
   * Direct mapping to av_hwdevice_ctx_init()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (device ready)
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   *
   * const ret = device.init();
   * FFmpegError.throwIfError(ret, 'init device');
   * // Device is now ready for use
   * ```
   *
   * @see {@link alloc} Must be called first
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Open a device of the specified type and create an AVHWDeviceContext.
   *
   * One-step device creation that allocates, opens, and initializes the device.
   * This is the preferred method for creating hardware devices.
   *
   * Direct mapping to av_hwdevice_ctx_create()
   *
   * @param type - Hardware device type
   * @param device - Device to open (e.g., "/dev/dri/renderD128" for VAAPI), or null for default
   * @param options - Device creation options, or null
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (device created and ready)
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(ENOSYS): Device type not supported
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI } from '@seydx/av/constants';
   *
   * // Create CUDA device
   * const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   * FFmpegError.throwIfError(ret, 'create CUDA device');
   *
   * // Create VAAPI device with specific device
   * const ret2 = device.create(
   *   AV_HWDEVICE_TYPE_VAAPI,
   *   '/dev/dri/renderD128',
   *   null
   * );
   * FFmpegError.throwIfError(ret2, 'create VAAPI device');
   * ```
   *
   * @see {@link alloc} For manual device allocation
   * @see {@link createDerived} To derive from another device
   */
  create(type: AVHWDeviceType, device: string | null = null, options: Dictionary | null = null): number {
    return this.native.create(type, device, options?.getNative() ?? null);
  }

  /**
   * Create a new device of the specified type from an existing device.
   *
   * Creates a device that shares resources with the source device.
   * Useful for interop between different hardware APIs.
   *
   * Direct mapping to av_hwdevice_ctx_create_derived()
   *
   * @param source - Source device context to derive from
   * @param type - Target hardware device type
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (derived device created)
   *   - AVERROR(ENOSYS): Derivation not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_VAAPI, AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
   *
   * // Create CUDA device from VAAPI device
   * const vaapi = new HardwareDeviceContext();
   * const vaapiRet = vaapi.create(AV_HWDEVICE_TYPE_VAAPI, null, null);
   * FFmpegError.throwIfError(vaapiRet, 'create VAAPI');
   *
   * const cuda = new HardwareDeviceContext();
   * const ret = cuda.createDerived(vaapi, AV_HWDEVICE_TYPE_CUDA);
   * FFmpegError.throwIfError(ret, 'derive CUDA from VAAPI');
   * ```
   *
   * @see {@link create} For standalone device creation
   */
  createDerived(source: HardwareDeviceContext, type: AVHWDeviceType): number {
    return this.native.createDerived(source.native, type);
  }

  /**
   * Free the device context.
   *
   * Unreferences the AVBufferRef and releases all device resources.
   *
   * Direct mapping to av_buffer_unref()
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   *
   * device.free();
   * // device is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Allocate a HW-specific configuration structure.
   *
   * Allocates a configuration structure for querying device constraints.
   *
   * Direct mapping to av_hwdevice_hwconfig_alloc()
   *
   * @returns Opaque pointer as BigInt or null
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   *
   * const hwconfig = device.hwconfigAlloc();
   * if (hwconfig) {
   *   // Use with getHwframeConstraints
   *   const constraints = device.getHwframeConstraints(hwconfig);
   * }
   * ```
   *
   * @see {@link getHwframeConstraints} To use the configuration
   */
  hwconfigAlloc(): bigint | null {
    return this.native.hwconfigAlloc();
  }

  /**
   * Get the constraints on HW frames given a device and parameters.
   *
   * Queries the device for supported formats, sizes, and other constraints.
   * Essential for configuring hardware frames contexts.
   *
   * Direct mapping to av_hwdevice_get_hwframe_constraints()
   *
   * @param hwconfig - Hardware configuration from hwconfigAlloc(), or undefined
   *
   * @returns Constraints object or null:
   *   - Object: Device constraints
   *   - null: No constraints available
   *
   * @example
   * ```typescript
   * import { HardwareDeviceContext } from '@seydx/av';
   *
   * const constraints = device.getHwframeConstraints();
   * if (constraints) {
   *   console.log(`Size range: ${constraints.minWidth}x${constraints.minHeight} to ${constraints.maxWidth}x${constraints.maxHeight}`);
   *
   *   if (constraints.validSwFormats) {
   *     console.log('Valid software formats:', constraints.validSwFormats);
   *   }
   * }
   * ```
   *
   * @see {@link hwconfigAlloc} To create configuration
   * @see {@link HardwareFramesContext} To use with frame pools
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
   * import { HardwareDeviceContext, FFmpegError } from '@seydx/av';
   * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
   *
   * {
   *   using device = new HardwareDeviceContext();
   *   const ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
   *   FFmpegError.throwIfError(ret, 'create device');
   *   // ... use device
   * } // Automatically freed when leaving scope
   * ```
   *
   * @see {@link free} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
