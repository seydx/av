import { bindings } from './binding.js';
import { HardwareDeviceContext } from './hardware-device-context.js';

import type { AVHWFrameTransferDirection, AVPixelFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeHardwareFramesContext, NativeWrapper } from './native-types.js';

/**
 * FFmpeg Hardware Frames Context - Low Level API
 *
 * Direct mapping to FFmpeg's AVHWFramesContext.
 * Manages hardware frame pools and format conversions.
 *
 * @example
 * ```typescript
 * // Create hardware frames context
 * const device = new HardwareDeviceContext();
 * device.create(AV_HWDEVICE_TYPE_CUDA, null, null);
 *
 * const frames = new HardwareFramesContext();
 * frames.alloc(device);
 *
 * // Configure frame parameters
 * frames.format = AV_PIX_FMT_CUDA;     // Hardware format
 * frames.swFormat = AV_PIX_FMT_NV12;   // Software format
 * frames.width = 1920;
 * frames.height = 1080;
 * frames.initialPoolSize = 10;
 *
 * // Initialize the context
 * const ret = frames.init();
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Allocate hardware frame
 * const hwFrame = new Frame();
 * hwFrame.alloc();
 * const ret2 = frames.getBuffer(hwFrame, 0);
 * if (ret2 < 0) throw new FFmpegError(ret2);
 *
 * // Transfer between hardware and software
 * const swFrame = new Frame();
 * swFrame.alloc();
 * swFrame.width = 1920;
 * swFrame.height = 1080;
 * swFrame.format = AV_PIX_FMT_NV12;
 * swFrame.getBuffer();
 *
 * // Download from hardware
 * frames.transferData(swFrame, hwFrame, 0);
 *
 * // Upload to hardware
 * frames.transferData(hwFrame, swFrame, 0);
 *
 * // Cleanup
 * hwFrame.free();
 * swFrame.free();
 * frames.free();
 * device.free();
 * ```
 */
export class HardwareFramesContext implements Disposable, NativeWrapper<NativeHardwareFramesContext> {
  private native: NativeHardwareFramesContext;

  // Constructor
  /**
   * Create a new hardware frames context.
   *
   * The context is uninitialized - you must call alloc() before use.
   * Direct wrapper around AVHWFramesContext.
   *
   * @example
   * ```typescript
   * const frames = new HardwareFramesContext();
   * frames.alloc(device);
   * // Configure parameters
   * frames.init();
   * ```
   */
  constructor() {
    this.native = new bindings.HardwareFramesContext();
  }

  // Getter/Setter Properties

  /**
   * Hardware pixel format.
   *
   * Direct mapping to AVHWFramesContext->format
   *
   * The pixel format identifying the underlying HW surface type.
   */
  get format(): AVPixelFormat {
    return this.native.format;
  }

  set format(value: AVPixelFormat) {
    this.native.format = value;
  }

  /**
   * Software pixel format.
   *
   * Direct mapping to AVHWFramesContext->sw_format
   *
   * The pixel format identifying the actual data layout of the hardware frames.
   */
  get swFormat(): AVPixelFormat {
    return this.native.swFormat;
  }

  set swFormat(value: AVPixelFormat) {
    this.native.swFormat = value;
  }

  /**
   * Frame width.
   *
   * Direct mapping to AVHWFramesContext->width
   *
   * The allocated dimensions of the frames in this pool.
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Frame height.
   *
   * Direct mapping to AVHWFramesContext->height
   *
   * The allocated dimensions of the frames in this pool.
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Initial pool size.
   *
   * Direct mapping to AVHWFramesContext->initial_pool_size
   *
   * Initial size of the frame pool. If a device type does not support
   * dynamically resizing the pool, then this is also the maximum pool size.
   */
  get initialPoolSize(): number {
    return this.native.initialPoolSize;
  }

  set initialPoolSize(value: number) {
    this.native.initialPoolSize = value;
  }

  /**
   * Associated device context.
   *
   * Direct mapping to AVHWFramesContext->device_ref
   *
   * @readonly
   */
  get deviceRef(): HardwareDeviceContext | null {
    const native = this.native.deviceRef;
    if (!native) {
      return null;
    }
    // Wrap the native device context
    const device = Object.create(HardwareDeviceContext.prototype) as HardwareDeviceContext;
    (device as any).native = native;
    return device;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an AVHWFramesContext tied to a given device context.
   *
   * Direct mapping to av_hwframe_ctx_alloc()
   *
   * @param device - Hardware device context
   *
   * @example
   * ```typescript
   * const frames = new HardwareFramesContext();
   * frames.alloc(device);
   * // Set parameters before init()
   * frames.format = AV_PIX_FMT_CUDA;
   * frames.swFormat = AV_PIX_FMT_NV12;
   * frames.width = 1920;
   * frames.height = 1080;
   * ```
   *
   * @throws {Error} If allocation fails
   */
  alloc(device: HardwareDeviceContext): void {
    this.native.alloc(device.getNative());
  }

  /**
   * Finalize the context before use.
   *
   * Direct mapping to av_hwframe_ctx_init()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * const ret = frames.init();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Free the frames context.
   *
   * Unreferences the AVBufferRef.
   *
   * @example
   * ```typescript
   * frames.free();
   * // frames is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  // Public Methods - Frame Operations

  /**
   * Allocate a new frame attached to the given AVHWFramesContext.
   *
   * Direct mapping to av_hwframe_get_buffer()
   *
   * @param frame - Frame to allocate (must be allocated but empty)
   * @param flags - Currently unused, should be set to 0
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Device-specific errors
   *
   * @example
   * ```typescript
   * const frame = new Frame();
   * frame.alloc();
   * const ret = frames.getBuffer(frame, 0);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // frame now contains a hardware frame
   * ```
   */
  getBuffer(frame: Frame, flags?: number): number {
    return this.native.getBuffer(frame.getNative(), flags ?? 0);
  }

  /**
   * Copy data to or from a hardware surface.
   *
   * Direct mapping to av_hwframe_transfer_data()
   *
   * @param dst - Destination frame
   * @param src - Source frame
   * @param flags - Currently unused, should be set to 0
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOSYS): Transfer not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Download from hardware to software
   * const ret = frames.transferData(swFrame, hwFrame, 0);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Upload from software to hardware
   * const ret2 = frames.transferData(hwFrame, swFrame, 0);
   * if (ret2 < 0) {
   *   throw new FFmpegError(ret2);
   * }
   * ```
   */
  transferData(dst: Frame, src: Frame, flags?: number): number {
    return this.native.transferData(dst.getNative(), src.getNative(), flags ?? 0);
  }

  /**
   * Get a list of possible source/target formats.
   *
   * Direct mapping to av_hwframe_transfer_get_formats()
   *
   * @param direction - Transfer direction (AV_HWFRAME_TRANSFER_DIRECTION_*)
   *
   * @returns Array of pixel formats or error code:
   *   - Array: List of supported formats
   *   - <0: AVERROR on failure
   *
   * @example
   * ```typescript
   * // Get formats for downloading from hardware
   * const formats = frames.transferGetFormats(AV_HWFRAME_TRANSFER_DIRECTION_FROM);
   * if (Array.isArray(formats)) {
   *   console.log('Supported download formats:', formats);
   * }
   *
   * // Get formats for uploading to hardware
   * const formats2 = frames.transferGetFormats(AV_HWFRAME_TRANSFER_DIRECTION_TO);
   * if (Array.isArray(formats2)) {
   *   console.log('Supported upload formats:', formats2);
   * }
   * ```
   */
  transferGetFormats(direction: AVHWFrameTransferDirection): AVPixelFormat[] | number {
    return this.native.transferGetFormats(direction);
  }

  /**
   * Map a hardware frame.
   *
   * Direct mapping to av_hwframe_map()
   *
   * This has a number of different possible effects, depending on the format
   * and origin of the src and dst frames. On input, src should be a usable
   * frame with valid hardware/software format and allocated data.
   *
   * @param dst - Destination frame
   * @param src - Source frame to map
   * @param flags - Combination of AV_HWFRAME_MAP_* flags
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOSYS): Mapping not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const mappedFrame = new Frame();
   * mappedFrame.alloc();
   * const ret = frames.map(mappedFrame, hwFrame, AV_HWFRAME_MAP_READ);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // mappedFrame now provides CPU access to hwFrame
   * ```
   */
  map(dst: Frame, src: Frame, flags?: number): number {
    return this.native.map(dst.getNative(), src.getNative(), flags ?? 0);
  }

  /**
   * Create a new frame context derived from an existing one.
   *
   * Direct mapping to av_hwframe_ctx_create_derived()
   *
   * @param format - Pixel format for the derived context
   * @param derivedDevice - Device context for the derived frames
   * @param source - Source frames context
   * @param flags - Currently unused, should be 0
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOSYS): Derivation not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const derived = new HardwareFramesContext();
   * const ret = derived.createDerived(
   *   AV_PIX_FMT_NV12,
   *   derivedDevice,
   *   sourceFrames,
   *   0
   * );
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  createDerived(format: AVPixelFormat, derivedDevice: HardwareDeviceContext, source: HardwareFramesContext, flags?: number): number {
    return this.native.createDerived(format, derivedDevice.getNative(), source.native, flags ?? 0);
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVHWFramesContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native hardware frames context object
   */
  getNative(): NativeHardwareFramesContext {
    return this.native;
  }

  /**
   * Dispose of the hardware frames context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using frames = new HardwareFramesContext();
   *   frames.alloc(device);
   *   frames.init();
   *   // ... use frames
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
