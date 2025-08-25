import { bindings } from './binding.js';
import { SWS_BILINEAR } from './constants.js';
import { OptionMember } from './option.js';

import type { AVPixelFormat, SWSFlag } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareScaleContext, NativeWrapper } from './native-types.js';

/**
 * Software video scaling context.
 *
 * Provides high-quality video scaling, format conversion, and color space conversion.
 * Supports various scaling algorithms from fast bilinear to high-quality Lanczos.
 * Uses the libswscale library for efficient video processing.
 *
 * Direct mapping to FFmpeg's SwsContext.
 *
 * @example
 * ```typescript
 * import { SoftwareScaleContext, Frame, FFmpegError } from 'node-av';
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24, SWS_BILINEAR } from 'node-av/constants';
 *
 * // Create and configure scale context
 * const sws = new SoftwareScaleContext();
 * sws.getContext(
 *   1920, 1080, AV_PIX_FMT_YUV420P,
 *   1280, 720, AV_PIX_FMT_RGB24,
 *   SWS_BILINEAR
 * );
 *
 * // Scale frame data
 * const ret = await sws.scale(
 *   srcSlice, srcStride, 0, srcHeight,
 *   dst, dstStride
 * );
 *
 * // Or scale Frame objects directly
 * const scaleRet = await sws.scaleFrame(dstFrame, srcFrame);
 * FFmpegError.throwIfError(scaleRet, 'scaleFrame');
 *
 * // Cleanup
 * sws.freeContext();
 * ```
 */
export class SoftwareScaleContext extends OptionMember<NativeSoftwareScaleContext> implements Disposable, NativeWrapper<NativeSoftwareScaleContext> {
  /**
   * Create a new software scale context.
   *
   * The context is uninitialized - you must call allocContext() or getContext() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around SwsContext.
   *
   * @example
   * ```typescript
   * import { SoftwareScaleContext } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24, SWS_BILINEAR } from 'node-av/constants';
   *
   * const sws = new SoftwareScaleContext();
   * sws.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   1280, 720, AV_PIX_FMT_RGB24,
   *   SWS_BILINEAR
   * );
   * ```
   */
  constructor() {
    super(new bindings.SoftwareScaleContext());
  }

  /**
   * Allocate an empty SwsContext.
   *
   * Allocates an uninitialized scale context.
   * Options must be set through the AVOptions API before calling initContext().
   *
   * Direct mapping to sws_alloc_context()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { SoftwareScaleContext, FFmpegError } from 'node-av';
   *
   * const sws = new SoftwareScaleContext();
   * sws.allocContext();
   * // Set options via AVOptions API
   * const ret = sws.initContext();
   * FFmpegError.throwIfError(ret, 'initContext');
   * ```
   *
   * @see {@link getContext} For one-step allocation and configuration
   * @see {@link initContext} To initialize after configuration
   */
  allocContext(): void {
    this.native.allocContext();
  }

  /**
   * Allocate and return an SwsContext.
   *
   * One-step allocation and configuration of the scale context.
   * Sets up everything needed for scaling operations.
   *
   * Direct mapping to sws_getContext()
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
   *   - SWS_BICUBIC: Bicubic
   *   - SWS_X: Experimental
   *   - SWS_POINT: Nearest neighbor
   *   - SWS_AREA: Area averaging
   *   - SWS_BICUBLIN: Luma bicubic, chroma bilinear
   *   - SWS_GAUSS: Gaussian
   *   - SWS_SINC: Sinc
   *   - SWS_LANCZOS: Lanczos
   *   - SWS_SPLINE: Natural bicubic spline
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { SoftwareScaleContext } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24, SWS_BILINEAR } from 'node-av/constants';
   *
   * // Scale from 1080p YUV to 720p RGB
   * sws.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   1280, 720, AV_PIX_FMT_RGB24,
   *   SWS_BILINEAR
   * );
   * ```
   *
   * @see {@link scale} To scale image data
   * @see {@link scaleFrame} To scale Frame objects
   */
  getContext(srcW: number, srcH: number, srcFormat: AVPixelFormat, dstW: number, dstH: number, dstFormat: AVPixelFormat, flags: SWSFlag = SWS_BILINEAR): void {
    this.native.getContext(srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags);
  }

  /**
   * Initialize the swscaler context sws_context.
   *
   * Completes initialization of the scale context.
   * Must be called after allocContext() and configuration.
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
   * import { FFmpegError } from 'node-av';
   *
   * const ret = sws.initContext();
   * FFmpegError.throwIfError(ret, 'initContext');
   * ```
   *
   * @see {@link allocContext} For allocation
   * @see {@link getContext} For one-step setup
   */
  initContext(): number {
    return this.native.initContext();
  }

  /**
   * Free the swscaler context swsContext.
   *
   * Releases all resources associated with the scale context.
   * Safe to call on NULL context.
   *
   * Direct mapping to sws_freeContext()
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

  /**
   * Scale the image slice in srcSlice and put the resulting scaled slice in the image in dst.
   *
   * Scales image data from source to destination.
   * Processes image in slices for efficient memory usage.
   *
   * Direct mapping to sws_scale()
   *
   * @param srcSlice - The array containing the pointers to the planes of the source slice
   * @param srcStride - The array containing the strides for each plane of the source image
   * @param srcSliceY - The position in the source image of the slice to process (first row number)
   * @param srcSliceH - The height of the source slice (number of rows)
   * @param dst - The array containing the pointers to the planes of the destination image
   * @param dstStride - The array containing the strides for each plane of the destination image
   *
   * @returns Promise resolving to the height of the output slice
   *
   * @example
   * ```typescript
   * const outputHeight = await sws.scale(
   *   srcData,
   *   srcLinesize,
   *   0,
   *   srcHeight,
   *   dstData,
   *   dstLinesize
   * );
   * console.log(`Scaled ${outputHeight} rows`);
   * ```
   *
   * @see {@link scaleFrame} For Frame-based scaling
   *
   * @note Slices must be provided in sequential order (top-bottom or bottom-top).
   * Non-sequential order results in undefined behavior.
   */
  async scale(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): Promise<number> {
    return this.native.scale(srcSlice, srcStride, srcSliceY, srcSliceH, dst, dstStride);
  }

  /**
   * Scale source data from src and write the output to dst.
   *
   * Frame-based scaling with automatic configuration.
   * Dynamically adapts to frame properties without reallocation.
   *
   * Direct mapping to sws_scale_frame()
   *
   * @param dst - The destination frame (buffers can be pre-allocated or allocated by scaler)
   * @param src - The source frame
   *
   * @returns The height of the output slice on success, negative AVERROR on error:
   *   - >0: Output height (success)
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   * import { AV_PIX_FMT_RGB24 } from 'node-av/constants';
   *
   * const srcFrame = new Frame();
   * srcFrame.alloc();
   * // ... fill srcFrame with data ...
   *
   * const dstFrame = new Frame();
   * dstFrame.alloc();
   * dstFrame.width = 1280;
   * dstFrame.height = 720;
   * dstFrame.format = AV_PIX_FMT_RGB24;
   * const bufRet = dstFrame.getBuffer();
   * FFmpegError.throwIfError(bufRet, 'getBuffer');
   *
   * const ret = await sws.scaleFrame(dstFrame, srcFrame);
   * FFmpegError.throwIfError(ret, 'scaleFrame');
   * console.log(`Scaled to height: ${ret}`);
   * ```
   *
   * @see {@link scale} For buffer-based scaling
   *
   * @note This function can be used directly on an allocated context without
   * calling sws_init_context(). Such usage is fully dynamic and does not
   * require reallocation if frame properties change.
   */
  async scaleFrame(dst: Frame, src: Frame): Promise<number> {
    return this.native.scaleFrame(dst.getNative(), src.getNative());
  }

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
   * import { SoftwareScaleContext } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24, SWS_BILINEAR } from 'node-av/constants';
   *
   * {
   *   using sws = new SoftwareScaleContext();
   *   sws.getContext(
   *     1920, 1080, AV_PIX_FMT_YUV420P,
   *     1280, 720, AV_PIX_FMT_RGB24,
   *     SWS_BILINEAR
   *   );
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   *
   * @see {@link freeContext} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
