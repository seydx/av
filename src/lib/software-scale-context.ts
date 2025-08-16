import { bindings } from './binding.js';
import { AV_SWS_BILINEAR } from './constants.js';

import type { AVPixelFormat, AVSoftwareScaleFlag } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareScaleContext, NativeWrapper } from './native-types.js';

/**
 * FFmpeg software scaling context - Low Level API
 *
 * Direct mapping to FFmpeg's SwsContext.
 * User has full control over allocation, configuration and lifecycle.
 *
 * @example
 * ```typescript
 * // Create and configure scale context - full control
 * const sws = new SoftwareScaleContext();
 * sws.getContext(
 *   1920, 1080, AV_PIX_FMT_YUV420P,
 *   1280, 720, AV_PIX_FMT_RGB24,
 *   SWS_BILINEAR
 * );
 *
 * // Scale frame data
 * const ret = sws.scale(
 *   srcSlice, srcStride, 0, srcHeight,
 *   dst, dstStride
 * );
 *
 * // Or scale Frame objects directly
 * const ret = sws.scaleFrame(dstFrame, srcFrame);
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Cleanup
 * sws.freeContext();
 * ```
 */
export class SoftwareScaleContext implements Disposable, NativeWrapper<NativeSoftwareScaleContext> {
  private native: NativeSoftwareScaleContext;

  // Constructor
  /**
   * Create a new software scale context.
   *
   * The context is uninitialized - you must call allocContext() or getContext() before use.
   * Direct wrapper around SwsContext.
   *
   * @example
   * ```typescript
   * const sws = new SoftwareScaleContext();
   * sws.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   1280, 720, AV_PIX_FMT_RGB24,
   *   SWS_BILINEAR
   * );
   * ```
   */
  constructor() {
    this.native = new bindings.SoftwareScaleContext();
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an empty SwsContext.
   *
   * Direct mapping to sws_alloc_context()
   *
   * @example
   * ```typescript
   * const sws = new SoftwareScaleContext();
   * sws.allocContext();
   * // Set options via AVOptions API
   * sws.initContext();
   * ```
   */
  allocContext(): void {
    this.native.allocContext();
  }

  /**
   * Allocate and return an SwsContext.
   *
   * Direct mapping to sws_getContext()
   *
   * You need it to perform scaling/conversion operations using sws_scale().
   *
   * @param srcW - The width of the source image
   * @param srcH - The height of the source image
   * @param srcFormat - The source image format
   * @param dstW - The width of the destination image
   * @param dstH - The height of the destination image
   * @param dstFormat - The destination image format
   * @param flags - Specify which algorithm and options to use for rescaling:
   *   - SWS_FAST_BILINEAR: Fast bilinear
   *   - SWS_BILINEAR: Bilinear
   *   - SWS_BICUBIC: Bicubic (param[0] and [1] tune the shape of the basis function)
   *   - SWS_X: Experimental
   *   - SWS_POINT: Nearest neighbor
   *   - SWS_AREA: Area averaging
   *   - SWS_BICUBLIN: Luma bicubic, chroma bilinear
   *   - SWS_GAUSS: Gaussian (param[0] tunes the exponent and thus cutoff frequency)
   *   - SWS_SINC: Sinc
   *   - SWS_LANCZOS: Lanczos (param[0] tunes the width of the window function)
   *   - SWS_SPLINE: Natural bicubic spline
   *
   * @example
   * ```typescript
   * // Scale from 1080p YUV to 720p RGB
   * sws.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   1280, 720, AV_PIX_FMT_RGB24,
   *   SWS_BILINEAR
   * );
   * ```
   *
   * @throws {Error} If allocation fails
   */
  getContext(
    srcW: number,
    srcH: number,
    srcFormat: AVPixelFormat,
    dstW: number,
    dstH: number,
    dstFormat: AVPixelFormat,
    flags: AVSoftwareScaleFlag = AV_SWS_BILINEAR,
  ): void {
    this.native.getContext(srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags);
  }

  /**
   * Initialize the swscaler context sws_context.
   *
   * Direct mapping to sws_init_context()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = sws.initContext();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  initContext(): number {
    return this.native.initContext();
  }

  /**
   * Free the swscaler context swsContext.
   *
   * Direct mapping to sws_freeContext()
   *
   * If swsContext is NULL, then does nothing.
   *
   * @example
   * ```typescript
   * sws.freeContext();
   * // sws is now invalid and should not be used
   * ```
   */
  freeContext(): void {
    this.native.freeContext();
  }

  // Public Methods - Scaling

  /**
   * Scale the image slice in srcSlice and put the resulting scaled
   * slice in the image in dst.
   *
   * Direct mapping to sws_scale()
   *
   * A slice is a sequence of consecutive rows in an image.
   *
   * Slices have to be provided in sequential order, either in
   * top-bottom or bottom-top order. If slices are provided in
   * non-sequential order the behavior of the function is undefined.
   *
   * @param srcSlice - The array containing the pointers to the planes of the source slice
   * @param srcStride - The array containing the strides for each plane of the source image
   * @param srcSliceY - The position in the source image of the slice to process,
   *                    that is the number (counted starting from zero) in the image
   *                    of the first row of the slice
   * @param srcSliceH - The height of the source slice, that is the number of rows in the slice
   * @param dst - The array containing the pointers to the planes of the destination image
   * @param dstStride - The array containing the strides for each plane of the destination image
   *
   * @returns The height of the output slice
   *
   * @example
   * ```typescript
   * const outputHeight = sws.scale(
   *   srcData,
   *   srcLinesize,
   *   0,
   *   srcHeight,
   *   dstData,
   *   dstLinesize
   * );
   * console.log(`Scaled ${outputHeight} rows`);
   * ```
   */
  scale(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): number {
    return this.native.scale(srcSlice, srcStride, srcSliceY, srcSliceH, dst, dstStride);
  }

  /**
   * Scale source data from src and write the output to dst.
   *
   * Direct mapping to sws_scale_frame()
   *
   * This function can be used directly on an allocated context, without setting
   * up any frame properties or calling sws_init_context(). Such usage is fully
   * dynamic and does not require reallocation if the frame properties change.
   *
   * @param dst - The destination frame. The data buffers may either be already
   *              allocated by the caller or left clear, in which case they will
   *              be allocated by the scaler. The latter may have performance
   *              advantages - e.g. in certain cases some (or all) output planes
   *              may be references to input planes, rather than copies.
   * @param src - The source frame. If the data buffers are set to NULL, then
   *              this function behaves identically to sws_frame_setup.
   *
   * @returns The height of the output slice on success, negative AVERROR on error:
   *   - >0: Output height (success)
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const srcFrame = new Frame();
   * srcFrame.alloc();
   * // ... fill srcFrame with data ...
   *
   * const dstFrame = new Frame();
   * dstFrame.width = 1280;
   * dstFrame.height = 720;
   * dstFrame.format = AV_PIX_FMT_RGB24;
   * dstFrame.getBuffer();
   *
   * const ret = sws.scaleFrame(dstFrame, srcFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * console.log(`Scaled to height: ${ret}`);
   * ```
   */
  scaleFrame(dst: Frame, src: Frame): number {
    return this.native.scaleFrame(dst.getNative(), src.getNative());
  }

  // Internal Methods

  /**
   * Get the native FFmpeg SwsContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native scale context object
   */
  getNative(): NativeSoftwareScaleContext {
    return this.native;
  }

  /**
   * Dispose of the scale context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling freeContext().
   *
   * @example
   * ```typescript
   * {
   *   using sws = new SoftwareScaleContext();
   *   sws.getContext(...);
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
