import { bindings } from '../../lib/binding.js';

import type { AVMediaType } from '../../constants/constants.js';

/**
 * Media type utilities.
 *
 * Provides static methods for converting media type enum values to
 * human-readable strings.
 *
 * @example
 * ```typescript
 * import { MediaType } from 'node-av';
 * import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';
 *
 * console.log(MediaType.getString(AVMEDIA_TYPE_VIDEO));      // "video"
 * console.log(MediaType.getString(AVMEDIA_TYPE_AUDIO));      // "audio"
 * console.log(MediaType.getString(AVMEDIA_TYPE_SUBTITLE));   // "subtitle"
 * ```
 */
export class MediaTypeUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Get string representation of media type.
   *
   * Converts a media type enum value to its string representation.
   * Direct mapping to av_get_media_type_string()
   *
   * @param type - Media type enum value
   * @returns String representation, or null for invalid type
   *
   * @example
   * ```typescript
   * import { MediaType } from 'node-av';
   * import {
   *   AVMEDIA_TYPE_VIDEO,
   *   AVMEDIA_TYPE_AUDIO,
   *   AVMEDIA_TYPE_DATA,
   *   AVMEDIA_TYPE_SUBTITLE,
   *   AVMEDIA_TYPE_ATTACHMENT
   * } from 'node-av/constants';
   *
   * console.log(MediaType.getString(AVMEDIA_TYPE_VIDEO));      // "video"
   * console.log(MediaType.getString(AVMEDIA_TYPE_AUDIO));      // "audio"
   * console.log(MediaType.getString(AVMEDIA_TYPE_DATA));       // "data"
   * console.log(MediaType.getString(AVMEDIA_TYPE_SUBTITLE));   // "subtitle"
   * console.log(MediaType.getString(AVMEDIA_TYPE_ATTACHMENT)); // "attachment"
   * ```
   */
  static getString(type: AVMediaType): string | null {
    return bindings.avGetMediaTypeString(type);
  }
}
