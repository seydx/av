/**
 * Color-related type utilities for FFmpeg
 * Provides helper functions for working with color spaces, ranges, and primaries
 */

import {
  type AVColorPrimaries,
  type AVColorRange,
  type AVColorSpace,
  type AVColorTransferCharacteristic,
  AV_COLOR_PRIMARIES_BT2020,
  AV_COLOR_PRIMARIES_BT470BG,
  AV_COLOR_PRIMARIES_BT470M,
  AV_COLOR_PRIMARIES_BT709,
  AV_COLOR_PRIMARIES_FILM,
  AV_COLOR_PRIMARIES_SMPTE170M,
  AV_COLOR_PRIMARIES_SMPTE240M,
  AV_COLOR_PRIMARIES_UNSPECIFIED,
  AV_COLOR_RANGE_JPEG,
  AV_COLOR_RANGE_MPEG,
  AV_COLOR_RANGE_UNSPECIFIED,
  AV_COLOR_SPACE_BT2020_CL,
  AV_COLOR_SPACE_BT2020_NCL,
  AV_COLOR_SPACE_BT470BG,
  AV_COLOR_SPACE_BT709,
  AV_COLOR_SPACE_FCC,
  AV_COLOR_SPACE_RGB,
  AV_COLOR_SPACE_SMPTE170M,
  AV_COLOR_SPACE_SMPTE240M,
  AV_COLOR_SPACE_UNSPECIFIED,
  AV_COLOR_SPACE_YCGCO,
  AV_COLOR_TRC_ARIB_STD_B67,
  AV_COLOR_TRC_BT1361_ECG,
  AV_COLOR_TRC_BT2020_10,
  AV_COLOR_TRC_BT2020_12,
  AV_COLOR_TRC_BT709,
  AV_COLOR_TRC_GAMMA22,
  AV_COLOR_TRC_GAMMA28,
  AV_COLOR_TRC_IEC61966_2_1,
  AV_COLOR_TRC_IEC61966_2_4,
  AV_COLOR_TRC_LINEAR,
  AV_COLOR_TRC_LOG,
  AV_COLOR_TRC_LOG_SQRT,
  AV_COLOR_TRC_SMPTE170M,
  AV_COLOR_TRC_SMPTE2084,
  AV_COLOR_TRC_SMPTE240M,
  AV_COLOR_TRC_SMPTE428,
  AV_COLOR_TRC_UNSPECIFIED,
} from './constants.js';

/**
 * Color Range utilities
 */
export class ColorRangeUtils {
  /**
   * Get name of color range
   * @param range Color range
   * @returns Range name
   */
  static getName(range: AVColorRange): string {
    switch (range) {
      case AV_COLOR_RANGE_UNSPECIFIED:
        return 'unspecified';
      case AV_COLOR_RANGE_MPEG:
        return 'limited';
      case AV_COLOR_RANGE_JPEG:
        return 'full';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if color range is full range
   * @param range Color range
   * @returns True if full range
   */
  static isFullRange(range: AVColorRange): boolean {
    return range === AV_COLOR_RANGE_JPEG;
  }

  /**
   * Check if color range is limited range
   * @param range Color range
   * @returns True if limited range
   */
  static isLimitedRange(range: AVColorRange): boolean {
    return range === AV_COLOR_RANGE_MPEG;
  }
}

/**
 * Color Space utilities
 */
export class ColorSpaceUtils {
  /**
   * Get name of color space
   * @param space Color space
   * @returns Space name
   */
  static getName(space: AVColorSpace): string {
    switch (space) {
      case AV_COLOR_SPACE_RGB:
        return 'rgb';
      case AV_COLOR_SPACE_BT709:
        return 'bt709';
      case AV_COLOR_SPACE_UNSPECIFIED:
        return 'unspecified';
      case AV_COLOR_SPACE_FCC:
        return 'fcc';
      case AV_COLOR_SPACE_BT470BG:
        return 'bt470bg';
      case AV_COLOR_SPACE_SMPTE170M:
        return 'smpte170m';
      case AV_COLOR_SPACE_SMPTE240M:
        return 'smpte240m';
      case AV_COLOR_SPACE_YCGCO:
        return 'ycgco';
      case AV_COLOR_SPACE_BT2020_NCL:
        return 'bt2020nc';
      case AV_COLOR_SPACE_BT2020_CL:
        return 'bt2020c';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if color space is RGB
   * @param space Color space
   * @returns True if RGB
   */
  static isRGB(space: AVColorSpace): boolean {
    return space === AV_COLOR_SPACE_RGB;
  }

  /**
   * Check if color space is YUV
   * @param space Color space
   * @returns True if YUV
   */
  static isYUV(space: AVColorSpace): boolean {
    return space !== AV_COLOR_SPACE_RGB && space !== AV_COLOR_SPACE_UNSPECIFIED;
  }
}

/**
 * Color Primaries utilities
 */
export class ColorPrimariesUtils {
  /**
   * Get name of color primaries
   * @param primaries Color primaries
   * @returns Primaries name
   */
  static getName(primaries: AVColorPrimaries): string {
    switch (primaries) {
      case AV_COLOR_PRIMARIES_BT709:
        return 'bt709';
      case AV_COLOR_PRIMARIES_UNSPECIFIED:
        return 'unspecified';
      case AV_COLOR_PRIMARIES_BT470M:
        return 'bt470m';
      case AV_COLOR_PRIMARIES_BT470BG:
        return 'bt470bg';
      case AV_COLOR_PRIMARIES_SMPTE170M:
        return 'smpte170m';
      case AV_COLOR_PRIMARIES_SMPTE240M:
        return 'smpte240m';
      case AV_COLOR_PRIMARIES_FILM:
        return 'film';
      case AV_COLOR_PRIMARIES_BT2020:
        return 'bt2020';
      default:
        return 'unknown';
    }
  }
}

/**
 * Color Transfer Characteristic utilities
 */
export class ColorTransferCharacteristicUtils {
  /**
   * Get name of color transfer characteristic
   * @param trc Transfer characteristic
   * @returns TRC name
   */
  static getName(trc: AVColorTransferCharacteristic): string {
    switch (trc) {
      case AV_COLOR_TRC_BT709:
        return 'bt709';
      case AV_COLOR_TRC_UNSPECIFIED:
        return 'unspecified';
      case AV_COLOR_TRC_GAMMA22:
        return 'gamma22';
      case AV_COLOR_TRC_GAMMA28:
        return 'gamma28';
      case AV_COLOR_TRC_SMPTE170M:
        return 'smpte170m';
      case AV_COLOR_TRC_SMPTE240M:
        return 'smpte240m';
      case AV_COLOR_TRC_LINEAR:
        return 'linear';
      case AV_COLOR_TRC_LOG:
        return 'log';
      case AV_COLOR_TRC_LOG_SQRT:
        return 'log_sqrt';
      case AV_COLOR_TRC_IEC61966_2_4:
        return 'iec61966-2-4';
      case AV_COLOR_TRC_BT1361_ECG:
        return 'bt1361e';
      case AV_COLOR_TRC_IEC61966_2_1:
        return 'iec61966-2-1';
      case AV_COLOR_TRC_BT2020_10:
        return 'bt2020-10';
      case AV_COLOR_TRC_BT2020_12:
        return 'bt2020-12';
      case AV_COLOR_TRC_SMPTE2084:
        return 'smpte2084';
      case AV_COLOR_TRC_SMPTE428:
        return 'smpte428';
      case AV_COLOR_TRC_ARIB_STD_B67:
        return 'arib-std-b67';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if transfer characteristic is HDR
   * @param trc Transfer characteristic
   * @returns True if HDR
   */
  static isHDR(trc: AVColorTransferCharacteristic): boolean {
    return (
      trc === AV_COLOR_TRC_SMPTE2084 || // PQ
      trc === AV_COLOR_TRC_ARIB_STD_B67 // HLG
    );
  }
}
