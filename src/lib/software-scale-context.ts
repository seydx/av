import { bindings } from './binding.js';

import type { Frame } from './frame.js';
import type { NativeSoftwareScaleContext, NativeWrapper } from './native-types.js';

/**
 * Software video scaler for frame format conversion
 *
 * Handles video frame scaling and pixel format conversion using libswscale.
 * Used when you need to resize video frames or convert between different
 * pixel formats.
 *
 * @example
 * ```typescript
 * // Create scaler for 1920x1080 YUV420P to 1280x720 RGB24
 * const scaler = new SoftwareScaleContext(
 *   1920, 1080, AV_PIX_FMT_YUV420P,
 *   1280, 720, AV_PIX_FMT_RGB24,
 *   SWS_BILINEAR
 * );
 *
 * // Scale frames
 * scaler.scaleFrame(inputFrame, outputFrame);
 * ```
 */
export class SoftwareScaleContext implements Disposable, NativeWrapper<NativeSoftwareScaleContext> {
  private context: NativeSoftwareScaleContext; // Native scale context binding

  // ==================== Constructor ====================

  /**
   * Create a new software scale context
   * @param srcWidth Source width in pixels
   * @param srcHeight Source height in pixels
   * @param srcFormat Source pixel format (AV_PIX_FMT_*)
   * @param dstWidth Destination width in pixels
   * @param dstHeight Destination height in pixels
   * @param dstFormat Destination pixel format (AV_PIX_FMT_*)
   * @param flags Scaling algorithm flags (SWS_*)
   * @throws Error if context creation fails
   * @example
   * ```typescript
   * // High quality downscaling with Lanczos
   * const scaler = new SoftwareScaleContext(
   *   3840, 2160, AV_PIX_FMT_YUV420P,
   *   1920, 1080, AV_PIX_FMT_YUV420P,
   *   SWS_LANCZOS
   * );
   *
   * // Fast upscaling with bilinear interpolation
   * const upscaler = new SoftwareScaleContext(
   *   640, 480, AV_PIX_FMT_RGB24,
   *   1920, 1080, AV_PIX_FMT_RGB24,
   *   SWS_BILINEAR
   * );
   * ```
   */
  constructor(srcWidth: number, srcHeight: number, srcFormat: number, dstWidth: number, dstHeight: number, dstFormat: number, flags: number) {
    this.context = new bindings.SoftwareScaleContext(srcWidth, srcHeight, srcFormat, dstWidth, dstHeight, dstFormat, flags);

    if (!this.context) {
      throw new Error('Failed to create software scale context');
    }
  }

  // ==================== Getters/Setters ====================

  /**
   * Get source frame width
   */
  get sourceWidth(): number {
    return this.context.sourceWidth;
  }

  /**
   * Get source frame height
   */
  get sourceHeight(): number {
    return this.context.sourceHeight;
  }

  /**
   * Get source pixel format
   */
  get sourcePixelFormat(): number {
    return this.context.sourcePixelFormat;
  }

  /**
   * Get destination frame width
   */
  get destinationWidth(): number {
    return this.context.destinationWidth;
  }

  /**
   * Get destination frame height
   */
  get destinationHeight(): number {
    return this.context.destinationHeight;
  }

  /**
   * Get destination pixel format
   */
  get destinationPixelFormat(): number {
    return this.context.destinationPixelFormat;
  }

  /**
   * Get scaling algorithm flags
   */
  get flags(): number {
    return this.context.flags;
  }

  // ==================== Public Methods ====================

  /**
   * Scale a video frame from source to destination format
   * @param src Source frame
   * @param dst Destination frame (must be allocated with correct size/format)
   * @throws Error if scaling fails
   * @example
   * ```typescript
   * const dstFrame = new Frame();
   * dstFrame.format = AV_PIX_FMT_RGB24;
   * dstFrame.width = 1280;
   * dstFrame.height = 720;
   * dstFrame.allocBuffer();
   *
   * scaler.scaleFrame(srcFrame, dstFrame);
   * ```
   */
  scaleFrame(src: Frame, dst: Frame): void {
    this.context.scaleFrame(src.getNative(), dst.getNative());
  }

  /**
   * Dispose of the scale context and free resources
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get native scale context for internal use
   * @internal
   */
  getNative(): NativeSoftwareScaleContext {
    return this.context;
  }
}
