/**
 * Sample Format Utilities
 *
 * Provides utilities for working with audio sample formats in FFmpeg.
 * All methods are static and map directly to FFmpeg's libavutil functions.
 *
 * @module lib/sample-format
 */

import { bindings } from '../../lib/binding.js';

import type { AVSampleFormat } from '../../constants/constants.js';

/**
 * Audio sample format utilities.
 *
 * Provides static methods for querying and converting between audio sample formats.
 * These utilities help with format introspection, conversion between packed/planar
 * layouts, and getting human-readable format information.
 *
 * @example
 * ```typescript
 * import { SampleFormat } from 'node-av';
 * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * // Get format information
 * console.log(SampleFormat.getName(AV_SAMPLE_FMT_S16));        // "s16"
 * console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_S16)); // 2
 * console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_FLTP));      // true
 *
 * // Convert between packed and planar formats
 * const packed = SampleFormat.getPackedFormat(AV_SAMPLE_FMT_FLTP);
 * const planar = SampleFormat.getPlanarFormat(AV_SAMPLE_FMT_FLT);
 * ```
 */
export class SampleFormat {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Get bytes per sample for a sample format.
   *
   * Returns the number of bytes required to store one sample in the given format.
   * Direct mapping to av_get_bytes_per_sample()
   *
   * @param format - Audio sample format
   * @returns Number of bytes per sample, or 0 for invalid format
   *
   * @example
   * ```typescript
   * import { SampleFormat } from 'node-av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT } from 'node-av/constants';
   *
   * console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_S16)); // 2
   * console.log(SampleFormat.getBytesPerSample(AV_SAMPLE_FMT_FLT)); // 4
   * ```
   */
  static getBytesPerSample(format: AVSampleFormat): number {
    return bindings.avGetBytesPerSample(format);
  }

  /**
   * Get the name of a sample format.
   *
   * Returns a string describing the sample format.
   * Direct mapping to av_get_sample_fmt_name()
   *
   * @param format - Audio sample format
   * @returns Format name string, or null for invalid format
   *
   * @example
   * ```typescript
   * import { SampleFormat } from 'node-av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
   *
   * console.log(SampleFormat.getName(AV_SAMPLE_FMT_S16));  // "s16"
   * console.log(SampleFormat.getName(AV_SAMPLE_FMT_FLTP)); // "fltp"
   * ```
   */
  static getName(format: AVSampleFormat): string | null {
    return bindings.avGetSampleFmtName(format);
  }

  /**
   * Get packed sample format.
   *
   * Returns the packed variant of the given sample format.
   * If the format is already packed, returns it unchanged.
   * Direct mapping to av_get_packed_sample_fmt()
   *
   * @param format - Audio sample format
   * @returns Packed sample format
   *
   * @example
   * ```typescript
   * import { SampleFormat } from 'node-av';
   * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_FLT } from 'node-av/constants';
   *
   * const packed = SampleFormat.getPackedFormat(AV_SAMPLE_FMT_FLTP);
   * console.log(packed === AV_SAMPLE_FMT_FLT); // true
   * ```
   */
  static getPackedFormat(format: AVSampleFormat): AVSampleFormat {
    return bindings.avGetPackedSampleFmt(format);
  }

  /**
   * Get planar sample format.
   *
   * Returns the planar variant of the given sample format.
   * If the format is already planar, returns it unchanged.
   * Direct mapping to av_get_planar_sample_fmt()
   *
   * @param format - Audio sample format
   * @returns Planar sample format
   *
   * @example
   * ```typescript
   * import { SampleFormat } from 'node-av';
   * import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
   *
   * const planar = SampleFormat.getPlanarFormat(AV_SAMPLE_FMT_FLT);
   * console.log(planar === AV_SAMPLE_FMT_FLTP); // true
   * ```
   */
  static getPlanarFormat(format: AVSampleFormat): AVSampleFormat {
    return bindings.avGetPlanarSampleFmt(format);
  }

  /**
   * Check if sample format is planar.
   *
   * Returns true if the sample format stores each channel in a separate buffer.
   * Returns false if all channels are interleaved in a single buffer.
   * Direct mapping to av_sample_fmt_is_planar()
   *
   * @param format - Audio sample format
   * @returns True if format is planar, false if packed/interleaved
   *
   * @example
   * ```typescript
   * import { SampleFormat } from 'node-av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_S16P } from 'node-av/constants';
   *
   * console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_S16));  // false (packed)
   * console.log(SampleFormat.isPlanar(AV_SAMPLE_FMT_S16P)); // true (planar)
   * ```
   */
  static isPlanar(format: AVSampleFormat): boolean {
    return bindings.avSampleFmtIsPlanar(format);
  }
}
