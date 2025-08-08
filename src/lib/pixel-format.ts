/**
 * Pixel format utilities for FFmpeg
 * Provides pixel format helpers
 */

import {
  type AVPixelFormat,
  AV_PIX_FMT_ABGR,
  AV_PIX_FMT_ARGB,
  AV_PIX_FMT_BGR0,
  AV_PIX_FMT_BGR24,
  AV_PIX_FMT_BGRA,
  AV_PIX_FMT_GRAY8,
  AV_PIX_FMT_NONE,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_NV21,
  AV_PIX_FMT_RGB0,
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_RGBA,
  AV_PIX_FMT_YUV410P,
  AV_PIX_FMT_YUV411P,
  AV_PIX_FMT_YUV420P,
  AV_PIX_FMT_YUV420P10BE,
  AV_PIX_FMT_YUV420P10LE,
  AV_PIX_FMT_YUV422P,
  AV_PIX_FMT_YUV422P10BE,
  AV_PIX_FMT_YUV422P10LE,
  AV_PIX_FMT_YUV444P,
  AV_PIX_FMT_YUV444P10BE,
  AV_PIX_FMT_YUV444P10LE,
  AV_PIX_FMT_YUVA420P,
  AV_PIX_FMT_YUVA422P,
  AV_PIX_FMT_YUVA444P,
  AV_PIX_FMT_YUVJ420P,
  AV_PIX_FMT_YUVJ422P,
  AV_PIX_FMT_YUVJ444P,
} from './constants.js';

/**
 * Pixel format utilities
 */
export class PixelFormat {
  /**
   * Check if pixel format is none/invalid
   * @param format Pixel format
   * @returns True if none
   */
  static isNone(format: AVPixelFormat): boolean {
    return format === AV_PIX_FMT_NONE || format < 0;
  }

  /**
   * Check if pixel format is YUV
   * @param format Pixel format
   * @returns True if YUV format
   */
  static isYUV(format: AVPixelFormat): boolean {
    return (
      format === AV_PIX_FMT_YUV420P ||
      format === AV_PIX_FMT_YUV422P ||
      format === AV_PIX_FMT_YUV444P ||
      format === AV_PIX_FMT_YUV410P ||
      format === AV_PIX_FMT_YUV411P ||
      format === AV_PIX_FMT_YUVJ420P ||
      format === AV_PIX_FMT_YUVJ422P ||
      format === AV_PIX_FMT_YUVJ444P ||
      format === AV_PIX_FMT_YUVA420P ||
      format === AV_PIX_FMT_YUVA422P ||
      format === AV_PIX_FMT_YUVA444P ||
      format === AV_PIX_FMT_YUV420P10LE ||
      format === AV_PIX_FMT_YUV420P10BE ||
      format === AV_PIX_FMT_YUV422P10LE ||
      format === AV_PIX_FMT_YUV422P10BE ||
      format === AV_PIX_FMT_YUV444P10LE ||
      format === AV_PIX_FMT_YUV444P10BE ||
      format === AV_PIX_FMT_NV12 ||
      format === AV_PIX_FMT_NV21
    );
  }

  /**
   * Check if pixel format is RGB
   * @param format Pixel format
   * @returns True if RGB format
   */
  static isRGB(format: AVPixelFormat): boolean {
    return (
      format === AV_PIX_FMT_RGB24 ||
      format === AV_PIX_FMT_BGR24 ||
      format === AV_PIX_FMT_RGB0 ||
      format === AV_PIX_FMT_BGR0 ||
      format === AV_PIX_FMT_RGBA ||
      format === AV_PIX_FMT_BGRA ||
      format === AV_PIX_FMT_ARGB ||
      format === AV_PIX_FMT_ABGR
    );
  }

  /**
   * Check if pixel format has alpha channel
   * @param format Pixel format
   * @returns True if has alpha
   */
  static hasAlpha(format: AVPixelFormat): boolean {
    return (
      format === AV_PIX_FMT_RGBA ||
      format === AV_PIX_FMT_BGRA ||
      format === AV_PIX_FMT_ARGB ||
      format === AV_PIX_FMT_ABGR ||
      format === AV_PIX_FMT_YUVA420P ||
      format === AV_PIX_FMT_YUVA422P ||
      format === AV_PIX_FMT_YUVA444P
    );
  }

  /**
   * Check if pixel format is grayscale
   * @param format Pixel format
   * @returns True if grayscale
   */
  static isGrayscale(format: AVPixelFormat): boolean {
    return format === AV_PIX_FMT_GRAY8;
  }

  /**
   * Check if pixel format is 10-bit
   * @param format Pixel format
   * @returns True if 10-bit format
   */
  static is10Bit(format: AVPixelFormat): boolean {
    return (
      format === AV_PIX_FMT_YUV420P10LE ||
      format === AV_PIX_FMT_YUV420P10BE ||
      format === AV_PIX_FMT_YUV422P10LE ||
      format === AV_PIX_FMT_YUV422P10BE ||
      format === AV_PIX_FMT_YUV444P10LE ||
      format === AV_PIX_FMT_YUV444P10BE
    );
  }

  /**
   * Check if pixel format is planar
   * @param format Pixel format
   * @returns True if planar format
   */
  static isPlanar(format: AVPixelFormat): boolean {
    // Most YUV formats are planar
    return (
      format === AV_PIX_FMT_YUV420P ||
      format === AV_PIX_FMT_YUV422P ||
      format === AV_PIX_FMT_YUV444P ||
      format === AV_PIX_FMT_YUV410P ||
      format === AV_PIX_FMT_YUV411P ||
      format === AV_PIX_FMT_YUVJ420P ||
      format === AV_PIX_FMT_YUVJ422P ||
      format === AV_PIX_FMT_YUVJ444P ||
      format === AV_PIX_FMT_YUVA420P ||
      format === AV_PIX_FMT_YUVA422P ||
      format === AV_PIX_FMT_YUVA444P ||
      format === AV_PIX_FMT_YUV420P10LE ||
      format === AV_PIX_FMT_YUV420P10BE ||
      format === AV_PIX_FMT_YUV422P10LE ||
      format === AV_PIX_FMT_YUV422P10BE ||
      format === AV_PIX_FMT_YUV444P10LE ||
      format === AV_PIX_FMT_YUV444P10BE ||
      format === AV_PIX_FMT_GRAY8
    );
  }

  /**
   * Check if pixel format is packed
   * @param format Pixel format
   * @returns True if packed format
   */
  static isPacked(format: AVPixelFormat): boolean {
    // RGB formats are typically packed
    return (
      format === AV_PIX_FMT_RGB24 ||
      format === AV_PIX_FMT_BGR24 ||
      format === AV_PIX_FMT_RGB0 ||
      format === AV_PIX_FMT_BGR0 ||
      format === AV_PIX_FMT_RGBA ||
      format === AV_PIX_FMT_BGRA ||
      format === AV_PIX_FMT_ARGB ||
      format === AV_PIX_FMT_ABGR
    );
  }

  /**
   * Get chroma subsampling from pixel format
   * @param format Pixel format
   * @returns Chroma subsampling string (e.g., "4:2:0", "4:2:2", "4:4:4") or null
   */
  static getChromaSubsampling(format: AVPixelFormat): string | null {
    if (
      format === AV_PIX_FMT_YUV420P ||
      format === AV_PIX_FMT_YUVJ420P ||
      format === AV_PIX_FMT_YUVA420P ||
      format === AV_PIX_FMT_YUV420P10LE ||
      format === AV_PIX_FMT_YUV420P10BE ||
      format === AV_PIX_FMT_NV12 ||
      format === AV_PIX_FMT_NV21
    ) {
      return '4:2:0';
    }
    if (
      format === AV_PIX_FMT_YUV422P ||
      format === AV_PIX_FMT_YUVJ422P ||
      format === AV_PIX_FMT_YUVA422P ||
      format === AV_PIX_FMT_YUV422P10LE ||
      format === AV_PIX_FMT_YUV422P10BE
    ) {
      return '4:2:2';
    }
    if (
      format === AV_PIX_FMT_YUV444P ||
      format === AV_PIX_FMT_YUVJ444P ||
      format === AV_PIX_FMT_YUVA444P ||
      format === AV_PIX_FMT_YUV444P10LE ||
      format === AV_PIX_FMT_YUV444P10BE
    ) {
      return '4:4:4';
    }
    if (format === AV_PIX_FMT_YUV410P) {
      return '4:1:0';
    }
    if (format === AV_PIX_FMT_YUV411P) {
      return '4:1:1';
    }
    return null;
  }

  /**
   * Get a short name for common pixel formats
   * @param format Pixel format
   * @returns Short format name
   */
  static getShortName(format: AVPixelFormat): string {
    switch (format) {
      case AV_PIX_FMT_NONE:
        return 'none';
      case AV_PIX_FMT_YUV420P:
        return 'yuv420p';
      case AV_PIX_FMT_YUV422P:
        return 'yuv422p';
      case AV_PIX_FMT_YUV444P:
        return 'yuv444p';
      case AV_PIX_FMT_YUVJ420P:
        return 'yuvj420p';
      case AV_PIX_FMT_YUVJ422P:
        return 'yuvj422p';
      case AV_PIX_FMT_YUVJ444P:
        return 'yuvj444p';
      case AV_PIX_FMT_YUV420P10LE:
        return 'yuv420p10le';
      case AV_PIX_FMT_YUV420P10BE:
        return 'yuv420p10be';
      case AV_PIX_FMT_YUV422P10LE:
        return 'yuv422p10le';
      case AV_PIX_FMT_YUV422P10BE:
        return 'yuv422p10be';
      case AV_PIX_FMT_YUV444P10LE:
        return 'yuv444p10le';
      case AV_PIX_FMT_YUV444P10BE:
        return 'yuv444p10be';
      case AV_PIX_FMT_RGB24:
        return 'rgb24';
      case AV_PIX_FMT_BGR24:
        return 'bgr24';
      case AV_PIX_FMT_RGBA:
        return 'rgba';
      case AV_PIX_FMT_BGRA:
        return 'bgra';
      case AV_PIX_FMT_ARGB:
        return 'argb';
      case AV_PIX_FMT_ABGR:
        return 'abgr';
      case AV_PIX_FMT_GRAY8:
        return 'gray8';
      case AV_PIX_FMT_NV12:
        return 'nv12';
      case AV_PIX_FMT_NV21:
        return 'nv21';
      default:
        return `pixfmt_${format}`;
    }
  }
}
