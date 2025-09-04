import { bindings } from './binding.js';

import type { AVHWDeviceType } from '../constants/constants.js';
import type { Dictionary } from './dictionary.js';
import type { NativeHardwareDeviceContext, NativeWrapper } from './native-types.js';

/**
 * Hardware device context for GPU-accelerated processing.
 *
 * Manages hardware acceleration devices for video encoding, decoding, and filtering.
 * Provides access to GPU resources like CUDA, VAAPI, VideoToolbox, and other
 * hardware acceleration APIs. Essential for high-performance video processing
 * and reduced CPU usage.
 *
 * Direct mapping to FFmpeg's AVHWDeviceContext.
 *
 * @example
 * ```typescript
 * import { HardwareDeviceContext, FFmpegError } from 'node-av';
 * import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VIDEOTOOLBOX } from 'node-av/constants';
 *
 * // Create hardware device
 * const device = new HardwareDeviceContext();
 * const ret = device.create(AV_HWDEVICE_TYPE_CUDA);
 * FFmpegError.throwIfError(ret, 'create');
 *
 * // List available hardware types
 * const types = HardwareDeviceContext.iterateTypes();
 * for (const type of types) {
 *   const name = HardwareDeviceContext.getTypeName(type);
 *   console.log(`Available: ${name}`);
 * }
 *
 * // Use with decoder
 * const codecContext = new CodecContext();
 * codecContext.hwDeviceCtx = device;
 *
 * // Create derived context
 * const derived = new HardwareDeviceContext();
 * const ret2 = derived.createDerived(device, AV_HWDEVICE_TYPE_CUDA);
 * FFmpegError.throwIfError(ret2, 'createDerived');
 *
 * // Cleanup
 * device.free();
 * ```
 *
 * @see {@link [AVHWDeviceContext](https://ffmpeg.org/doxygen/trunk/structAVHWDeviceContext.html)}
 * @see {@link HardwareFramesContext} For hardware frame allocation
 * @see {@link CodecContext} For hardware codec usage
 */
export class HardwareDeviceContext implements Disposable, NativeWrapper<NativeHardwareDeviceContext> {
  private native: NativeHardwareDeviceContext;

  constructor() {
    this.native = new bindings.HardwareDeviceContext();
  }

  /**
   * Get human-readable name for hardware device type.
   *
   * Converts a hardware device type enum to its string representation.
   *
   * Direct mapping to av_hwdevice_get_type_name().
   *
   * @param type - Hardware device type
   * @returns Type name string, or null if invalid
   *
   * @example
   * ```typescript
   * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
   *
   * const name = HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_CUDA);
   * console.log(name); // "cuda"
   * ```
   *
   * @see {@link findTypeByName} For reverse lookup
   */
  static getTypeName(type: AVHWDeviceType): string | null {
    return bindings.HardwareDeviceContext.getTypeName(type);
  }

  /**
   * List all supported hardware device types.
   *
   * Returns an array of all hardware acceleration types available
   * in the current FFmpeg build.
   *
   * Direct mapping to av_hwdevice_iterate_types().
   *
   * @returns Array of available hardware device types
   *
   * @example
   * ```typescript
   * const types = HardwareDeviceContext.iterateTypes();
   * console.log('Available hardware acceleration:');
   * for (const type of types) {
   *   const name = HardwareDeviceContext.getTypeName(type);
   *   console.log(`  - ${name}`);
   * }
   * ```
   */
  static iterateTypes(): AVHWDeviceType[] {
    return bindings.HardwareDeviceContext.iterateTypes();
  }

  /**
   * Find hardware device type by name.
   *
   * Converts a string name to the corresponding hardware device type enum.
   *
   * Direct mapping to av_hwdevice_find_type_by_name().
   *
   * @param name - Hardware type name (e.g., 'cuda', 'vaapi', 'videotoolbox')
   * @returns Hardware device type enum, or AV_HWDEVICE_TYPE_NONE if not found
   *
   * @example
   * ```typescript
   * const type = HardwareDeviceContext.findTypeByName('cuda');
   * if (type !== AV_HWDEVICE_TYPE_NONE) {
   *   console.log('CUDA is available');
   * }
   * ```
   *
   * @see {@link getTypeName} For type to name conversion
   */
  static findTypeByName(name: string): AVHWDeviceType {
    return bindings.HardwareDeviceContext.findTypeByName(name);
  }

  /**
   * Hardware device type.
   *
   * The type of hardware acceleration in use.
   *
   * Direct mapping to AVHWDeviceContext->type.
   */
  get type(): AVHWDeviceType {
    return this.native.type;
  }

  /**
   * Hardware context pointer.
   *
   * Opaque pointer to the underlying hardware-specific context.
   * Type depends on the hardware device type.
   *
   * Direct mapping to AVHWDeviceContext->hwctx.
   */
  get hwctx(): bigint | null {
    return this.native.hwctx;
  }

  /**
   * Allocate hardware device context.
   *
   * Allocates memory for the specified hardware device type.
   * Must be followed by init() to initialize the device.
   *
   * Direct mapping to av_hwdevice_ctx_alloc().
   *
   * @param type - Hardware device type to allocate
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
   *
   * const device = new HardwareDeviceContext();
   * device.alloc(AV_HWDEVICE_TYPE_CUDA);
   * const ret = device.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   *
   * @see {@link init} To initialize after allocation
   * @see {@link create} For combined alloc and init
   */
  alloc(type: AVHWDeviceType): void {
    this.native.alloc(type);
  }

  /**
   * Initialize allocated hardware device.
   *
   * Initializes a previously allocated hardware device context.
   * Must be called after alloc() and before using the device.
   *
   * Direct mapping to av_hwdevice_ctx_init().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *   - Device-specific errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * device.alloc(type);
   * const ret = device.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   *
   * @see {@link alloc} Must be called first
   * @see {@link create} For combined operation
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Create and initialize hardware device.
   *
   * Combined allocation and initialization of a hardware device.
   * This is the preferred method for creating hardware contexts.
   *
   * Direct mapping to av_hwdevice_ctx_create().
   *
   * @param type - Hardware device type
   * @param device - Device name/path (null for default)
   * @param options - Device-specific options
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid type or parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *   - AVERROR_ENOSYS: Type not supported
   *   - Device-specific errors
   *
   * @example
   * ```typescript
   * import { FFmpegError, Dictionary } from 'node-av';
   * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
   *
   * // Create with default device
   * const device = new HardwareDeviceContext();
   * let ret = device.create(AV_HWDEVICE_TYPE_CUDA);
   * FFmpegError.throwIfError(ret, 'create');
   *
   * // Create with specific device
   * const device2 = new HardwareDeviceContext();
   * ret = device2.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
   * FFmpegError.throwIfError(ret, 'create');
   *
   * // Create with options
   * const opts = Dictionary.fromObject({ 'device_idx': '1' });
   * ret = device.create(AV_HWDEVICE_TYPE_CUDA, null, opts);
   * FFmpegError.throwIfError(ret, 'create');
   * ```
   *
   * @see {@link createDerived} To create from existing device
   */
  create(type: AVHWDeviceType, device: string | null = null, options: Dictionary | null = null): number {
    return this.native.create(type, device, options?.getNative() ?? null);
  }

  /**
   * Create derived hardware device.
   *
   * Creates a new device context derived from an existing one.
   * Used for interoperability between different hardware APIs.
   *
   * Direct mapping to av_hwdevice_ctx_create_derived().
   *
   * @param source - Source device context to derive from
   * @param type - Target hardware device type
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOSYS: Derivation not supported
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VULKAN } from 'node-av/constants';
   *
   * // Create CUDA device from Vulkan
   * const vulkan = new HardwareDeviceContext();
   * vulkan.create(AV_HWDEVICE_TYPE_VULKAN);
   *
   * const cuda = new HardwareDeviceContext();
   * const ret = cuda.createDerived(vulkan, AV_HWDEVICE_TYPE_CUDA);
   * FFmpegError.throwIfError(ret, 'createDerived');
   * ```
   *
   * @see {@link create} For creating independent device
   */
  createDerived(source: HardwareDeviceContext, type: AVHWDeviceType): number {
    return this.native.createDerived(source.native, type);
  }

  /**
   * Free hardware device context.
   *
   * Releases all resources associated with the hardware device.
   * The context becomes invalid after calling this.
   *
   * Direct mapping to av_buffer_unref() on device context.
   *
   * @example
   * ```typescript
   * device.free();
   * // Device is now invalid
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    this.native.free();
  }

  /**
   * Allocate hardware configuration.
   *
   * Allocates a hardware-specific configuration structure.
   * Used for codec configuration with hardware acceleration.
   *
   * Direct mapping to av_hwdevice_hwconfig_alloc().
   *
   * @returns Configuration pointer, or null on failure
   *
   * @example
   * ```typescript
   * const hwconfig = device.hwconfigAlloc();
   * if (hwconfig) {
   *   // Use with codec context
   *   codecContext.hwConfig = hwconfig;
   * }
   * ```
   *
   * @see {@link getHwframeConstraints} To get constraints
   */
  hwconfigAlloc(): bigint | null {
    return this.native.hwconfigAlloc();
  }

  /**
   * Get hardware frame constraints.
   *
   * Returns the constraints on frames that can be allocated
   * with this hardware device.
   *
   * Direct mapping to av_hwdevice_get_hwframe_constraints().
   *
   * @param hwconfig - Optional hardware configuration
   * @returns Frame constraints, or null if not available
   *
   * @example
   * ```typescript
   * const constraints = device.getHwframeConstraints();
   * if (constraints) {
   *   console.log(`Min size: ${constraints.minWidth}x${constraints.minHeight}`);
   *   console.log(`Max size: ${constraints.maxWidth}x${constraints.maxHeight}`);
   *   if (constraints.validSwFormats) {
   *     console.log('Software formats:', constraints.validSwFormats);
   *   }
   *   if (constraints.validHwFormats) {
   *     console.log('Hardware formats:', constraints.validHwFormats);
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

  /**
   * Get the underlying native HardwareDeviceContext object.
   *
   * @returns The native HardwareDeviceContext binding object
   *
   * @internal
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
   *   device.create(AV_HWDEVICE_TYPE_CUDA);
   *   // Use device...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
