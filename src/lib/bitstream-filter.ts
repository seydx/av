import { bindings } from './binding.js';

import type { AVCodecID } from './constants.js';
import type { NativeBitStreamFilter, NativeWrapper } from './native-types.js';

/**
 * Bitstream filter definition.
 *
 * Represents a bitstream filter for manipulating encoded data without decoding.
 * Allows modification of codec-specific headers, packet metadata, and bitstream syntax.
 * This is an immutable descriptor - actual filtering happens via BitStreamFilterContext.
 *
 * Direct mapping to FFmpeg's AVBitStreamFilter.
 *
 * @example
 * ```typescript
 * import { BitStreamFilter } from '@seydx/av';
 *
 * // Find a specific bitstream filter
 * const h264Mp4ToAnnexB = BitStreamFilter.getByName('h264_mp4toannexb');
 * if (!h264Mp4ToAnnexB) throw new Error('h264_mp4toannexb filter not found');
 *
 * console.log(`Filter: ${h264Mp4ToAnnexB.name}`);
 * console.log(`Supported codecs: ${h264Mp4ToAnnexB.codecIds}`);
 *
 * // List all available bitstream filters
 * const filters = BitStreamFilter.iterate();
 * for (const filter of filters) {
 *   console.log(`Found filter: ${filter.name}`);
 * }
 * ```
 */
export class BitStreamFilter implements NativeWrapper<NativeBitStreamFilter> {
  private native: NativeBitStreamFilter;

  /**
   * Create a BitStreamFilter wrapper.
   *
   * Usually not called directly - use static methods instead.
   * No FFmpeg resources are allocated.
   *
   * @param native - Native BitStreamFilter object from bindings
   * @internal
   */
  constructor(native: NativeBitStreamFilter) {
    this.native = native;
  }

  /**
   * Find a bitstream filter by name.
   *
   * Searches for a registered bitstream filter with the given name.
   * Returns null if no filter with that name exists.
   *
   * Calls av_bsf_get_by_name() internally.
   *
   * @param name - Name of the bitstream filter (e.g., 'h264_mp4toannexb')
   * @returns BitStreamFilter if found, null otherwise
   *
   * @example
   * ```typescript
   * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
   * if (filter) {
   *   console.log(`Found filter: ${filter.name}`);
   * }
   * ```
   */
  static getByName(name: string): BitStreamFilter | null {
    const native = bindings.BitStreamFilter.getByName(name);
    return native ? new BitStreamFilter(native) : null;
  }

  /**
   * Get all available bitstream filters.
   *
   * Returns an array of all registered bitstream filters.
   * Useful for discovery and debugging.
   *
   * Calls av_bsf_iterate() internally.
   *
   * @returns Array of all available bitstream filters
   *
   * @example
   * ```typescript
   * const filters = BitStreamFilter.iterate();
   * for (const filter of filters) {
   *   console.log(`${filter.name}: ${filter.codecIds?.join(', ') || 'all codecs'}`);
   * }
   * ```
   */
  static iterate(): BitStreamFilter[] {
    const natives = bindings.BitStreamFilter.iterate();
    return natives.map((native: NativeBitStreamFilter) => new BitStreamFilter(native));
  }

  /**
   * Filter name.
   *
   * Short name used to identify the filter.
   * This is the name used with getByName().
   *
   * Maps to AVBitStreamFilter->name.
   *
   * @example
   * ```typescript
   * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
   * console.log(filter.name); // 'h264_mp4toannexb'
   * ```
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Supported codec IDs.
   *
   * List of codec IDs this filter can process.
   * If null, the filter works with any codec.
   *
   * Maps to AVBitStreamFilter->codec_ids.
   *
   * @example
   * ```typescript
   * import { AV_CODEC_ID_H264 } from '@seydx/av/constants';
   *
   * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
   * if (filter.codecIds?.includes(AV_CODEC_ID_H264)) {
   *   console.log('Filter supports H.264');
   * }
   * ```
   */
  get codecIds(): AVCodecID[] | null {
    return this.native.codecIds as AVCodecID[] | null;
  }

  /**
   * Get the underlying native object.
   *
   * For advanced use cases that need direct access to the native bindings.
   *
   * @returns Native BitStreamFilter object
   * @internal
   */
  getNative(): NativeBitStreamFilter {
    return this.native;
  }
}