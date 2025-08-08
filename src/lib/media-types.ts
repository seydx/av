/**
 * Media type utilities for FFmpeg
 * Provides helper functions for working with media types, sample formats, and picture types
 */

import {
  type AVMediaType,
  type AVPictureType,
  type AVSampleFormat,
  AV_MEDIA_TYPE_ATTACHMENT,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_DATA,
  AV_MEDIA_TYPE_SUBTITLE,
  AV_MEDIA_TYPE_UNKNOWN,
  AV_MEDIA_TYPE_VIDEO,
  AV_PICTURE_TYPE_B,
  AV_PICTURE_TYPE_BI,
  AV_PICTURE_TYPE_I,
  AV_PICTURE_TYPE_NONE,
  AV_PICTURE_TYPE_P,
  AV_PICTURE_TYPE_S,
  AV_PICTURE_TYPE_SI,
  AV_PICTURE_TYPE_SP,
  AV_SAMPLE_FMT_DBL,
  AV_SAMPLE_FMT_DBLP,
  AV_SAMPLE_FMT_FLT,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_NONE,
  AV_SAMPLE_FMT_S16,
  AV_SAMPLE_FMT_S16P,
  AV_SAMPLE_FMT_S32,
  AV_SAMPLE_FMT_S32P,
  AV_SAMPLE_FMT_S64,
  AV_SAMPLE_FMT_S64P,
  AV_SAMPLE_FMT_U8,
  AV_SAMPLE_FMT_U8P,
} from './constants.js';

/**
 * Media Type utilities
 */
export class MediaType {
  /**
   * Get string representation of media type
   * @param type Media type
   * @returns String representation (e.g., "video", "audio")
   */
  static toString(type: AVMediaType): string {
    switch (type) {
      case AV_MEDIA_TYPE_UNKNOWN:
        return 'unknown';
      case AV_MEDIA_TYPE_VIDEO:
        return 'video';
      case AV_MEDIA_TYPE_AUDIO:
        return 'audio';
      case AV_MEDIA_TYPE_DATA:
        return 'data';
      case AV_MEDIA_TYPE_SUBTITLE:
        return 'subtitle';
      case AV_MEDIA_TYPE_ATTACHMENT:
        return 'attachment';
      default:
        return 'unknown';
    }
  }

  /**
   * Parse media type from string
   * @param str String representation
   * @returns Media type
   */
  static fromString(str: string): AVMediaType {
    switch (str.toLowerCase()) {
      case 'video':
        return AV_MEDIA_TYPE_VIDEO;
      case 'audio':
        return AV_MEDIA_TYPE_AUDIO;
      case 'data':
        return AV_MEDIA_TYPE_DATA;
      case 'subtitle':
      case 'subtitles':
        return AV_MEDIA_TYPE_SUBTITLE;
      case 'attachment':
        return AV_MEDIA_TYPE_ATTACHMENT;
      default:
        return AV_MEDIA_TYPE_UNKNOWN;
    }
  }
}

/**
 * Sample Format utilities
 */
export class SampleFormat {
  /**
   * Get name of sample format
   * @param format Sample format
   * @returns Format name (e.g., "s16", "fltp")
   */
  static getName(format: AVSampleFormat): string {
    const names: Record<number, string> = {
      [AV_SAMPLE_FMT_NONE]: 'none',
      [AV_SAMPLE_FMT_U8]: 'u8',
      [AV_SAMPLE_FMT_S16]: 's16',
      [AV_SAMPLE_FMT_S32]: 's32',
      [AV_SAMPLE_FMT_FLT]: 'flt',
      [AV_SAMPLE_FMT_DBL]: 'dbl',
      [AV_SAMPLE_FMT_S64]: 's64',
      [AV_SAMPLE_FMT_U8P]: 'u8p',
      [AV_SAMPLE_FMT_S16P]: 's16p',
      [AV_SAMPLE_FMT_S32P]: 's32p',
      [AV_SAMPLE_FMT_FLTP]: 'fltp',
      [AV_SAMPLE_FMT_DBLP]: 'dblp',
      [AV_SAMPLE_FMT_S64P]: 's64p',
    };
    return names[format] || 'unknown';
  }

  /**
   * Get bytes per sample for format
   * @param format Sample format
   * @returns Bytes per sample
   */
  static getBytesPerSample(format: AVSampleFormat): number {
    const sizes: Record<number, number> = {
      [AV_SAMPLE_FMT_NONE]: 0,
      [AV_SAMPLE_FMT_U8]: 1,
      [AV_SAMPLE_FMT_S16]: 2,
      [AV_SAMPLE_FMT_S32]: 4,
      [AV_SAMPLE_FMT_FLT]: 4,
      [AV_SAMPLE_FMT_DBL]: 8,
      [AV_SAMPLE_FMT_S64]: 8,
      [AV_SAMPLE_FMT_U8P]: 1,
      [AV_SAMPLE_FMT_S16P]: 2,
      [AV_SAMPLE_FMT_S32P]: 4,
      [AV_SAMPLE_FMT_FLTP]: 4,
      [AV_SAMPLE_FMT_DBLP]: 8,
      [AV_SAMPLE_FMT_S64P]: 8,
    };
    return sizes[format] || 0;
  }

  /**
   * Check if sample format is planar
   * @param format Sample format
   * @returns True if planar
   */
  static isPlanar(format: AVSampleFormat): boolean {
    return (
      format === AV_SAMPLE_FMT_U8P ||
      format === AV_SAMPLE_FMT_S16P ||
      format === AV_SAMPLE_FMT_S32P ||
      format === AV_SAMPLE_FMT_FLTP ||
      format === AV_SAMPLE_FMT_DBLP ||
      format === AV_SAMPLE_FMT_S64P
    );
  }

  /**
   * Get sample format from string
   * @param name Format name
   * @returns Sample format
   */
  static fromString(name: string): AVSampleFormat {
    const formats: Record<string, AVSampleFormat> = {
      none: AV_SAMPLE_FMT_NONE,
      u8: AV_SAMPLE_FMT_U8,
      s16: AV_SAMPLE_FMT_S16,
      s32: AV_SAMPLE_FMT_S32,
      flt: AV_SAMPLE_FMT_FLT,
      dbl: AV_SAMPLE_FMT_DBL,
      s64: AV_SAMPLE_FMT_S64,
      u8p: AV_SAMPLE_FMT_U8P,
      s16p: AV_SAMPLE_FMT_S16P,
      s32p: AV_SAMPLE_FMT_S32P,
      fltp: AV_SAMPLE_FMT_FLTP,
      dblp: AV_SAMPLE_FMT_DBLP,
      s64p: AV_SAMPLE_FMT_S64P,
    };
    return formats[name.toLowerCase()] || AV_SAMPLE_FMT_NONE;
  }
}

/**
 * Picture Type utilities
 */
export class PictureType {
  /**
   * Get character representation of picture type
   * @param type Picture type
   * @returns Character representation (e.g., "I", "P", "B")
   */
  static toChar(type: AVPictureType): string {
    switch (type) {
      case AV_PICTURE_TYPE_NONE:
        return '?';
      case AV_PICTURE_TYPE_I:
        return 'I';
      case AV_PICTURE_TYPE_P:
        return 'P';
      case AV_PICTURE_TYPE_B:
        return 'B';
      case AV_PICTURE_TYPE_S:
        return 'S';
      case AV_PICTURE_TYPE_SI:
        return 'i';
      case AV_PICTURE_TYPE_SP:
        return 'p';
      case AV_PICTURE_TYPE_BI:
        return 'b';
      default:
        return '?';
    }
  }

  /**
   * Get description of picture type
   * @param type Picture type
   * @returns Description
   */
  static getDescription(type: AVPictureType): string {
    switch (type) {
      case AV_PICTURE_TYPE_NONE:
        return 'Undefined';
      case AV_PICTURE_TYPE_I:
        return 'Intra';
      case AV_PICTURE_TYPE_P:
        return 'Predicted';
      case AV_PICTURE_TYPE_B:
        return 'Bi-directional predicted';
      case AV_PICTURE_TYPE_S:
        return 'S(GMC)-VOP MPEG-4';
      case AV_PICTURE_TYPE_SI:
        return 'Switching Intra';
      case AV_PICTURE_TYPE_SP:
        return 'Switching Predicted';
      case AV_PICTURE_TYPE_BI:
        return 'BI type';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if picture type is keyframe
   * @param type Picture type
   * @returns True if keyframe
   */
  static isKeyframe(type: AVPictureType): boolean {
    return type === AV_PICTURE_TYPE_I;
  }
}
