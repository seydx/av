import { bindings } from '../../lib/binding.js';

import type { AVPixelFormat } from '../../constants/constants.js';

/**
 * Video pixel format utilities.
 *
 * Provides static methods for querying pixel format properties, converting
 * between format names and values, and checking hardware acceleration support.
 *
 * @example
 * ```typescript
 * import { PixelFormat } from 'node-av';
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA } from 'node-av/constants';
 *
 * // Get format information
 * console.log(PixelFormat.getName(AV_PIX_FMT_YUV420P));    // "yuv420p"
 * console.log(PixelFormat.isHardware(AV_PIX_FMT_CUDA));    // true
 *
 * // Convert between names and values
 * const format = PixelFormat.fromName("yuv420p");
 * console.log(format === AV_PIX_FMT_YUV420P);              // true
 * ```
 */
export class PixelFormatUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Get the name of a pixel format.
   *
   * Returns a string describing the pixel format.
   * Direct mapping to av_get_pix_fmt_name()
   *
   * @param format - Video pixel format
   * @returns Format name string, or null for invalid format
   *
   * @example
   * ```typescript
   * import { PixelFormat } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';
   *
   * console.log(PixelFormat.getName(AV_PIX_FMT_YUV420P)); // "yuv420p"
   * console.log(PixelFormat.getName(AV_PIX_FMT_RGB24));   // "rgb24"
   * ```
   */
  static getName(format: AVPixelFormat): string | null {
    return bindings.avGetPixFmtName(format);
  }

  /**
   * Get pixel format from name.
   *
   * Converts a pixel format name string to its enum value.
   * Direct mapping to av_get_pix_fmt()
   *
   * @param name - Pixel format name string
   * @returns Pixel format enum value, or AV_PIX_FMT_NONE for unknown formats
   *
   * @example
   * ```typescript
   * import { PixelFormat } from 'node-av';
   * import { AV_PIX_FMT_YUV420P } from 'node-av/constants';
   *
   * const format = PixelFormat.fromName("yuv420p");
   * console.log(format === AV_PIX_FMT_YUV420P); // true
   *
   * const invalid = PixelFormat.fromName("invalid");
   * console.log(invalid === AV_PIX_FMT_NONE);   // true
   * ```
   */
  static fromName(name: string): AVPixelFormat {
    return bindings.avGetPixFmtFromName(name);
  }

  /**
   * Check if pixel format is hardware accelerated.
   *
   * Returns true if the pixel format represents frames in GPU/hardware memory
   * rather than system memory.
   * Direct mapping to av_pix_fmt_desc_get() and checking for AV_PIX_FMT_FLAG_HWACCEL
   *
   * @param format - Video pixel format
   * @returns True if format is hardware accelerated
   *
   * @example
   * ```typescript
   * import { PixelFormat } from 'node-av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA, AV_PIX_FMT_VAAPI } from 'node-av/constants';
   *
   * console.log(PixelFormat.isHardware(AV_PIX_FMT_YUV420P)); // false
   * console.log(PixelFormat.isHardware(AV_PIX_FMT_CUDA));    // true
   * console.log(PixelFormat.isHardware(AV_PIX_FMT_VAAPI));   // true
   * ```
   */
  static isHardware(format: AVPixelFormat): boolean {
    return bindings.avIsHardwarePixelFormat(format);
  }
}
