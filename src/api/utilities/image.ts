import { bindings } from '../../lib/binding.js';
import { FFmpegError } from '../../lib/error.js';

import type { AVPixelFormat } from '../../constants/constants.js';

/**
 * Image buffer allocation result.
 */
export interface ImageAllocation {
  /** Allocated buffer containing the image data */
  buffer: Buffer;
  /** Total size in bytes */
  size: number;
  /** Line sizes for each plane */
  linesizes: number[];
}

/**
 * Image buffer utilities.
 *
 * Provides static methods for allocating, copying, and managing image buffers.
 * These utilities handle the low-level memory layout for various pixel formats,
 * including planar formats with multiple buffers.
 *
 * @example
 * ```typescript
 * import { ImageUtils } from 'node-av';
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';
 *
 * // Allocate image buffer
 * const image = ImageUtils.alloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
 * console.log(`Allocated ${image.size} bytes`);
 *
 * // Get buffer size without allocating
 * const size = ImageUtils.getBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
 * console.log(`RGB24 1080p needs ${size} bytes`);
 * ```
 */
export class ImageUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Allocate an image buffer.
   *
   * Allocates a buffer large enough to hold an image with the specified dimensions
   * and pixel format. Returns the buffer along with line sizes for each plane.
   * Direct mapping to av_image_alloc()
   *
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param pixFmt - Pixel format
   * @param align - Buffer alignment (typically 1, 16, or 32)
   * @returns Allocation result with buffer, size, and line sizes
   * @throws {FFmpegError} On allocation failure
   *
   * @example
   * ```typescript
   * import { ImageUtils } from 'node-av';
   * import { AV_PIX_FMT_YUV420P } from 'node-av/constants';
   *
   * // Allocate aligned buffer for YUV420P image
   * const image = ImageUtils.alloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
   * console.log(`Buffer size: ${image.size} bytes`);
   * console.log(`Y plane line size: ${image.linesizes[0]}`);
   * console.log(`U plane line size: ${image.linesizes[1]}`);
   * console.log(`V plane line size: ${image.linesizes[2]}`);
   * ```
   */
  static alloc(width: number, height: number, pixFmt: AVPixelFormat, align: number): ImageAllocation {
    const result = bindings.avImageAlloc(width, height, pixFmt, align);
    if (typeof result === 'number') {
      FFmpegError.throwIfError(result, 'Failed to allocate image');
    }
    return result as ImageAllocation;
  }

  /**
   * Allocate image buffer arrays (alternative interface).
   *
   * Similar to alloc() but with a different return format.
   * This is an alias for compatibility.
   *
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param pixFmt - Pixel format
   * @param align - Buffer alignment
   * @returns Allocation result
   * @throws {FFmpegError} On allocation failure
   */
  static allocArrays(width: number, height: number, pixFmt: AVPixelFormat, align: number): ImageAllocation {
    return ImageUtils.alloc(width, height, pixFmt, align);
  }

  /**
   * Copy image data between buffers.
   *
   * Copies image data from source buffers to destination buffers.
   * Direct mapping to av_image_copy2()
   *
   * @param dstData - Destination data buffers (one per plane)
   * @param dstLinesizes - Destination line sizes
   * @param srcData - Source data buffers (one per plane)
   * @param srcLinesizes - Source line sizes
   * @param pixFmt - Pixel format
   * @param width - Image width
   * @param height - Image height
   *
   * @example
   * ```typescript
   * import { ImageUtils } from 'node-av';
   * import { AV_PIX_FMT_YUV420P } from 'node-av/constants';
   *
   * // Copy between two image buffers
   * ImageUtils.copy(
   *   dstBuffers, dstLinesizes,
   *   srcBuffers, srcLinesizes,
   *   AV_PIX_FMT_YUV420P, 1920, 1080
   * );
   * ```
   */
  static copy(dstData: Buffer[], dstLinesizes: number[], srcData: Buffer[], srcLinesizes: number[], pixFmt: AVPixelFormat, width: number, height: number): void {
    bindings.avImageCopy2(dstData, dstLinesizes, srcData, srcLinesizes, pixFmt, width, height);
  }

  /**
   * Get required buffer size for an image.
   *
   * Calculates the buffer size needed to store an image with the given parameters.
   * Direct mapping to av_image_get_buffer_size()
   *
   * @param pixFmt - Pixel format
   * @param width - Image width
   * @param height - Image height
   * @param align - Buffer alignment
   * @returns Required buffer size in bytes
   *
   * @example
   * ```typescript
   * import { ImageUtils } from 'node-av';
   * import { AV_PIX_FMT_RGB24, AV_PIX_FMT_YUV420P } from 'node-av/constants';
   *
   * // Calculate buffer sizes for different formats
   * const rgbSize = ImageUtils.getBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
   * const yuvSize = ImageUtils.getBufferSize(AV_PIX_FMT_YUV420P, 1920, 1080, 1);
   *
   * console.log(`RGB24: ${rgbSize} bytes`);   // 1920*1080*3
   * console.log(`YUV420P: ${yuvSize} bytes`); // 1920*1080*1.5
   * ```
   */
  static getBufferSize(pixFmt: AVPixelFormat, width: number, height: number, align: number): number {
    return bindings.avImageGetBufferSize(pixFmt, width, height, align);
  }

  /**
   * Copy image to a single buffer.
   *
   * Copies image data from multiple plane buffers to a single contiguous buffer.
   * Useful for serialization or when a single buffer is required.
   * Direct mapping to av_image_copy_to_buffer()
   *
   * @param dst - Destination buffer
   * @param dstSize - Destination buffer size
   * @param srcData - Source data buffers (one per plane), or null
   * @param srcLinesize - Source line sizes, or null
   * @param pixFmt - Pixel format
   * @param width - Image width
   * @param height - Image height
   * @param align - Buffer alignment
   * @returns Bytes written, or negative error code
   *
   * @example
   * ```typescript
   * import { ImageUtils, FFmpegError } from 'node-av';
   * import { AV_PIX_FMT_YUV420P } from 'node-av/constants';
   *
   * // Copy planar data to single buffer
   * const dstSize = ImageUtils.getBufferSize(AV_PIX_FMT_YUV420P, 1920, 1080, 1);
   * const dst = Buffer.alloc(dstSize);
   *
   * const written = ImageUtils.copyToBuffer(
   *   dst, dstSize,
   *   srcBuffers, srcLinesizes,
   *   AV_PIX_FMT_YUV420P, 1920, 1080, 1
   * );
   *
   * FFmpegError.throwIfError(written, 'Failed to copy image to buffer');
   * console.log(`Wrote ${written} bytes`);
   * ```
   */
  static copyToBuffer(
    dst: Buffer,
    dstSize: number,
    srcData: Buffer[] | null,
    srcLinesize: number[] | null,
    pixFmt: AVPixelFormat,
    width: number,
    height: number,
    align: number,
  ): number {
    return bindings.avImageCopyToBuffer(dst, dstSize, srcData, srcLinesize, pixFmt, width, height, align);
  }
}
