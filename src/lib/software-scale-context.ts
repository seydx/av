import { SWS_BILINEAR } from '../constants/constants.js';
import { bindings } from './binding.js';
import { OptionMember } from './option.js';

import type { AVPixelFormat, SWSFlag } from '../constants/constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareScaleContext, NativeWrapper } from './native-types.js';

/**
 * Video scaling and pixel format conversion context.
 *
 * Provides high-quality image scaling and pixel format conversion for video frames.
 * Supports various scaling algorithms from fast bilinear to high-quality Lanczos.
 * Essential for resolution changes, aspect ratio adjustments, and format compatibility
 * in video processing pipelines.
 *
 * Direct mapping to FFmpeg's SwsContext.
 *
 * @example
 * ```typescript
 * import { SoftwareScaleContext, Frame, FFmpegError } from 'node-av';
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24, SWS_LANCZOS } from 'node-av/constants';
 *
 * // Create scaler
 * const scaler = new SoftwareScaleContext();
 *
 * // Configure scaling: 1920x1080 YUV420P -> 1280x720 RGB24
 * scaler.getContext(
 *   1920, 1080, AV_PIX_FMT_YUV420P,  // Source
 *   1280, 720, AV_PIX_FMT_RGB24,     // Destination
 *   SWS_LANCZOS                       // High quality
 * );
 *
 * const ret = scaler.initContext();
 * FFmpegError.throwIfError(ret, 'initContext');
 *
 * // Scale frames
 * const dstFrame = new Frame();
 * dstFrame.width = 1280;
 * dstFrame.height = 720;
 * dstFrame.format = AV_PIX_FMT_RGB24;
 * dstFrame.allocBuffer();
 *
 * const height = await scaler.scaleFrame(dstFrame, srcFrame);
 * console.log(`Scaled to ${height} lines`);
 *
 * // Clean up
 * scaler.freeContext();
 * ```
 *
 * @see [SwsContext](https://ffmpeg.org/doxygen/trunk/structSwsContext.html) - FFmpeg Doxygen
 * @see {@link Frame} For video frame operations
 */
export class SoftwareScaleContext extends OptionMember<NativeSoftwareScaleContext> implements Disposable, NativeWrapper<NativeSoftwareScaleContext> {
  constructor() {
    super(new bindings.SoftwareScaleContext());
  }

  /**
   * Allocate scale context.
   *
   * Allocates memory for the scaler.
   * Must be called before configuration if using options.
   *
   * Direct mapping to sws_alloc_context().
   *
   * @example
   * ```typescript
   * const scaler = new SoftwareScaleContext();
   * scaler.allocContext();
   * // Now configure with setOption() or getContext()
   * ```
   *
   * @see {@link getContext} For direct configuration
   */
  allocContext(): void {
    this.native.allocContext();
  }

  /**
   * Configure scaling context.
   *
   * Sets up the scaler with source and destination formats.
   * This is the primary configuration method.
   *
   * Direct mapping to sws_getContext().
   *
   * @param srcW - Source width in pixels
   *
   * @param srcH - Source height in pixels
   *
   * @param srcFormat - Source pixel format
   *
   * @param dstW - Destination width in pixels
   *
   * @param dstH - Destination height in pixels
   *
   * @param dstFormat - Destination pixel format
   *
   * @param flags - Scaling algorithm flags (SWS_*)
   *
   * @example
   * ```typescript
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';
   * import { SWS_BILINEAR, SWS_BICUBIC, SWS_LANCZOS, SWS_FAST_BILINEAR } from 'node-av/constants';
   *
   * // Fast bilinear (lower quality, faster)
   * scaler.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   1280, 720, AV_PIX_FMT_RGB24,
   *   SWS_FAST_BILINEAR
   * );
   *
   * // High quality Lanczos (higher quality, slower)
   * scaler.getContext(
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   3840, 2160, AV_PIX_FMT_YUV420P,  // Upscaling
   *   SWS_LANCZOS
   * );
   * ```
   *
   * @see {@link initContext} Must be called after configuration
   */
  getContext(srcW: number, srcH: number, srcFormat: AVPixelFormat, dstW: number, dstH: number, dstFormat: AVPixelFormat, flags: SWSFlag = SWS_BILINEAR): void {
    this.native.getContext(srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags);
  }

  /**
   * Initialize scaling context.
   *
   * Initializes the scaler after configuration.
   * Must be called before any scaling operations.
   *
   * Direct mapping to sws_init_context().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = scaler.initContext();
   * FFmpegError.throwIfError(ret, 'initContext');
   * ```
   *
   * @see {@link getContext} For configuration
   */
  initContext(): number {
    return this.native.initContext();
  }

  /**
   * Free scaling context.
   *
   * Releases all resources associated with the scaler.
   * The context becomes invalid after calling this.
   *
   * Direct mapping to sws_freeContext().
   *
   * @example
   * ```typescript
   * scaler.freeContext();
   * // Scaler is now invalid
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  freeContext(): void {
    this.native.freeContext();
  }

  /**
   * Scale image data.
   *
   * Scales raw image data from source to destination buffers.
   * Low-level interface for custom buffer management.
   *
   * Direct mapping to sws_scale().
   *
   * @param srcSlice - Source data planes (one buffer per plane)
   *
   * @param srcStride - Bytes per line for each plane
   *
   * @param srcSliceY - Starting Y position in source
   *
   * @param srcSliceH - Height of source slice to process
   *
   * @param dst - Destination data planes
   *
   * @param dstStride - Destination bytes per line
   *
   * @returns Output height in pixels, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * // Scale YUV420P data
   * const srcPlanes = [yPlane, uPlane, vPlane];
   * const srcStrides = [1920, 960, 960]; // Full HD
   * const dstPlanes = [dstY, dstU, dstV];
   * const dstStrides = [1280, 640, 640]; // 720p
   *
   * const height = await scaler.scale(
   *   srcPlanes, srcStrides, 0, 1080,
   *   dstPlanes, dstStrides
   * );
   * console.log(`Scaled ${height} lines`);
   * ```
   *
   * @see {@link scaleFrame} For frame-based scaling
   */
  async scale(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): Promise<number> {
    return await this.native.scale(srcSlice, srcStride, srcSliceY, srcSliceH, dst, dstStride);
  }

  /**
   * Scale video synchronously.
   * Synchronous version of scale.
   *
   * Scales raw video data from source to destination format.
   * Can scale a slice or entire image.
   *
   * Direct mapping to sws_scale().
   *
   * @param srcSlice - Array of source buffers (one per plane)
   *
   * @param srcStride - Array of source strides (bytes per row)
   *
   * @param srcSliceY - Y position of slice (0 for full image)
   *
   * @param srcSliceH - Height of slice (full height for entire image)
   *
   * @param dst - Array of destination buffers (one per plane)
   *
   * @param dstStride - Array of destination strides
   *
   * @returns Height of output image, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Scale YUV420P image
   * const srcBufs = [yPlane, uPlane, vPlane];
   * const srcStrides = [srcWidth, srcWidth/2, srcWidth/2];
   * const dstBufs = [dstY, dstU, dstV];
   * const dstStrides = [dstWidth, dstWidth/2, dstWidth/2];
   *
   * const height = scaler.scaleSync(
   *   srcBufs, srcStrides,
   *   0, srcHeight,  // Full image
   *   dstBufs, dstStrides
   * );
   * FFmpegError.throwIfError(height, 'scaleSync');
   * console.log(`Scaled ${height} lines`);
   * ```
   *
   * @see {@link scale} For async version
   */
  scaleSync(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): number {
    return this.native.scaleSync(srcSlice, srcStride, srcSliceY, srcSliceH, dst, dstStride);
  }

  /**
   * Scale video frame.
   *
   * Scales an entire video frame to the destination format.
   * Simpler interface than scale() for frame-based processing.
   *
   * Direct mapping to sws_scale_frame().
   *
   * @param dst - Destination frame (must be allocated)
   *
   * @param src - Source frame
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   * import { AV_PIX_FMT_RGB24 } from 'node-av/constants';
   *
   * // Create destination frame
   * const dstFrame = new Frame();
   * dstFrame.width = 1280;
   * dstFrame.height = 720;
   * dstFrame.format = AV_PIX_FMT_RGB24;
   * const ret = dstFrame.allocBuffer();
   * FFmpegError.throwIfError(ret, 'allocBuffer');
   *
   * // Scale frame
   * const ret2 = await scaler.scaleFrame(dstFrame, srcFrame);
   * FFmpegError.throwIfError(ret2, 'scaleFrame');
   *
   * // dstFrame now contains scaled image
   * ```
   *
   * @see {@link scale} For buffer-based scaling
   */
  async scaleFrame(dst: Frame, src: Frame): Promise<number> {
    return await this.native.scaleFrame(dst.getNative(), src.getNative());
  }

  /**
   * Scale video frame synchronously.
   * Synchronous version of scaleFrame.
   *
   * Scales an entire video frame to the destination format.
   * Simpler interface than scaleSync() for frame-based processing.
   *
   * Direct mapping to sws_scale_frame().
   *
   * @param dst - Destination frame (must be allocated)
   *
   * @param src - Source frame
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';
   *
   * // Convert YUV to RGB
   * const srcFrame = new Frame();
   * srcFrame.allocBuffer(AV_PIX_FMT_YUV420P, 1920, 1080);
   * // ... fill with YUV data ...
   *
   * const dstFrame = new Frame();
   * dstFrame.allocBuffer(AV_PIX_FMT_RGB24, 1920, 1080);
   *
   * const ret = scaler.scaleFrameSync(dstFrame, srcFrame);
   * FFmpegError.throwIfError(ret, 'scaleFrameSync');
   *
   * // dstFrame now contains scaled image
   * ```
   *
   * @see {@link scaleFrame} For async version
   */
  scaleFrameSync(dst: Frame, src: Frame): number {
    return this.native.scaleFrameSync(dst.getNative(), src.getNative());
  }

  /**
   * Get the underlying native SoftwareScaleContext object.
   *
   * @returns The native SoftwareScaleContext binding object
   *
   * @internal
   */
  getNative(): NativeSoftwareScaleContext {
    return this.native;
  }

  /**
   * Dispose of the scaling context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling freeContext().
   *
   * @example
   * ```typescript
   * {
   *   using scaler = new SoftwareScaleContext();
   *   scaler.getContext(...);
   *   scaler.initContext();
   *   // Use scaler...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
