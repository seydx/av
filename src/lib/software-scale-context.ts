import { bindings } from './binding.js';

import type { Frame } from './frame.js';

/**
 * Software Scale Context wrapper for video frame scaling
 */
export class SoftwareScaleContext implements Disposable {
  private context: any;

  private constructor(context: any) {
    this.context = context;
  }

  /**
   * Create a new software scale context
   *
   * @param srcWidth Source width
   * @param srcHeight Source height
   * @param srcFormat Source pixel format (use constants.AV_PIX_FMT_*)
   * @param dstWidth Destination width
   * @param dstHeight Destination height
   * @param dstFormat Destination pixel format
   * @param flags Scaling flags (use constants.SWS_* flags)
   */
  static create(srcWidth: number, srcHeight: number, srcFormat: number, dstWidth: number, dstHeight: number, dstFormat: number, flags: number): SoftwareScaleContext {
    const context = bindings.SoftwareScaleContext.create(srcWidth, srcHeight, srcFormat, dstWidth, dstHeight, dstFormat, flags);

    if (!context) {
      throw new Error('Failed to create software scale context');
    }

    return new SoftwareScaleContext(context);
  }

  /**
   * Scale a frame
   *
   * @param src Source frame
   * @param dst Destination frame (must be allocated with proper size/format)
   */
  scaleFrame(src: Frame, dst: Frame): void {
    this.context.scaleFrame(src.nativeFrame, dst.nativeFrame);
  }

  /**
   * Get source width
   */
  get sourceWidth(): number {
    return this.context.sourceWidth;
  }

  /**
   * Get source height
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
   * Get destination width
   */
  get destinationWidth(): number {
    return this.context.destinationWidth;
  }

  /**
   * Get destination height
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
   * Get scaling flags
   */
  get flags(): number {
    return this.context.flags;
  }

  /**
   * Dispose of the scale context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }
}
