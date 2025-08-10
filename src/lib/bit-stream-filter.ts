import { bindings } from './binding.js';
import { CodecParameters } from './codec-parameters.js';
import { AV_ERROR_EAGAIN, AV_ERROR_EOF } from './constants.js';
import { FFmpegError } from './error.js';
import { Rational } from './rational.js';

import type { AVCodecID } from './constants.js';
import type { NativeBitStreamFilter, NativeBitStreamFilterContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * BitStreamFilter - represents a specific bitstream filter type
 *
 * BitStreamFilters are used to modify packet data without decoding.
 * Common uses include converting between stream formats (e.g., MP4 to Annex-B)
 * or adding/removing metadata.
 *
 * @example
 * ```typescript
 * // Get a filter for H.264 stream conversion
 * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
 * if (filter) {
 *   const context = new BitStreamFilterContext(filter);
 *   context.init();
 *   // Use context to filter packets...
 * }
 * ```
 */
export class BitStreamFilter implements NativeWrapper<NativeBitStreamFilter> {
  private native: NativeBitStreamFilter; // Native bitstream filter binding

  /**
   * Create a BitStreamFilter wrapper
   * @param native Native filter object
   * @internal
   */
  constructor(native: NativeBitStreamFilter) {
    this.native = native;
  }

  /**
   * Get bitstream filter by name
   * @param name Filter name (e.g., "h264_mp4toannexb", "hevc_mp4toannexb", "aac_adtstoasc")
   * @returns BitStreamFilter instance or null if not found
   * @example
   * ```typescript
   * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
   * ```
   */
  static getByName(name: string): BitStreamFilter | null {
    const native = bindings.BitStreamFilter.getByName(name);
    return native ? new BitStreamFilter(native) : null;
  }

  /**
   * Iterate over all available bitstream filters
   * @returns Iterator of available filters
   * @example
   * ```typescript
   * for (const filter of BitStreamFilter.iterate()) {
   *   console.log(filter.name);
   * }
   * ```
   */
  static *iterate(): IterableIterator<BitStreamFilter> {
    const opaque = null;
    while (true) {
      const native = bindings.BitStreamFilter.iterate(opaque);
      if (!native) break;
      yield new BitStreamFilter(native);
    }
  }

  /**
   * Get all available bitstream filters
   * @returns Array of available filters
   */
  static getAll(): BitStreamFilter[] {
    return Array.from(this.iterate());
  }

  /**
   * Get filter name
   */
  get name(): string {
    return this.native.getName();
  }

  /**
   * Get supported codec IDs
   * @returns Array of supported codec IDs or null if filter supports all codecs
   */
  get codecIds(): AVCodecID[] | null {
    return this.native.getCodecIds();
  }

  /**
   * Check if this filter supports a specific codec
   * @param codecId Codec ID to check
   * @returns true if supported, false otherwise
   * @example
   * ```typescript
   * if (filter.supportsCodec(AV_CODEC_ID_H264)) {
   *   // Filter can be used with H.264
   * }
   * ```
   */
  supportsCodec(codecId: AVCodecID): boolean {
    const ids = this.codecIds;
    if (!ids) return true; // Supports all codecs
    return ids.includes(codecId);
  }

  /**
   * Get native filter object for internal use
   * @internal
   */
  getNative(): NativeBitStreamFilter {
    return this.native;
  }
}

/**
 * BitStreamFilterContext - instance of a bitstream filter
 *
 * Represents an active instance of a bitstream filter that can process packets.
 * Must be initialized before use.
 *
 * @example
 * ```typescript
 * // Create and initialize a filter context
 * const filter = BitStreamFilter.getByName('h264_mp4toannexb');
 * const context = new BitStreamFilterContext(filter);
 * context.init();
 *
 * // Filter packets
 * context.sendPacket(inputPacket);
 * while (context.receivePacket(outputPacket) >= 0) {
 *   // Process filtered packet
 * }
 * ```
 */
export class BitStreamFilterContext implements Disposable, NativeWrapper<NativeBitStreamFilterContext> {
  private native: NativeBitStreamFilterContext; // Native bitstream filter context binding
  private _filter?: BitStreamFilter;
  private _codecParameters?: CodecParameters;

  /**
   * Allocate a new bitstream filter context
   * @param filter BitStreamFilter to use
   * @throws Error if allocation fails
   */
  constructor(filter: BitStreamFilter) {
    this.native = new bindings.BitStreamFilterContext(filter.getNative());
    if (!this.native) {
      throw new Error('Failed to allocate bitstream filter context');
    }
  }

  /**
   * Get the filter this context is using
   */
  get filter(): BitStreamFilter {
    if (!this._filter) {
      const native = this.native.filter;
      this._filter = new BitStreamFilter(native);
    }
    return this._filter;
  }

  /**
   * Get/set input time base
   */
  get timeBaseIn(): Rational {
    const r = this.native.timeBaseIn;
    return new Rational(r.num, r.den);
  }

  set timeBaseIn(value: Rational) {
    this.native.timeBaseIn = { num: value.num, den: value.den };
  }

  /**
   * Get/set output time base
   */
  get timeBaseOut(): Rational {
    const r = this.native.timeBaseOut;
    return new Rational(r.num, r.den);
  }

  set timeBaseOut(value: Rational) {
    this.native.timeBaseOut = { num: value.num, den: value.den };
  }

  /**
   * Get codec parameters
   * These are the input parameters that can be modified before init()
   */
  get codecParameters(): CodecParameters | null {
    if (!this._codecParameters) {
      const native = this.native.codecParameters;
      if (!native) return null;
      // Create wrapper for native codec parameters
      this._codecParameters = CodecParameters.fromNative(native);
    }
    return this._codecParameters;
  }

  /**
   * Initialize the filter context
   * Must be called before sending packets
   */
  init(): void {
    this.native.init();
  }

  /**
   * Send a packet to the filter
   * @param packet Packet to filter (null to flush)
   * @returns 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors (not EAGAIN or EOF)
   */
  sendPacket(packet: Packet | null): number {
    const ret = this.native.sendPacket(packet ? packet.getNative() : null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet to bitstream filter');
    }
    return ret;
  }

  /**
   * Receive a filtered packet
   * @param packet Packet to receive filtered data into
   * @returns 0 on success, EAGAIN if needs more input, EOF on end
   * @throws FFmpegError on fatal errors (not EAGAIN or EOF)
   */
  receivePacket(packet: Packet): number {
    const ret = this.native.receivePacket(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive packet from bitstream filter');
    }
    return ret;
  }

  /**
   * Send a packet to the filter (async version)
   * @param packet Packet to filter (null to flush)
   * @returns Promise resolving to 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors (not EAGAIN or EOF)
   */
  async sendPacketAsync(packet: Packet | null): Promise<number> {
    const ret = await this.native.sendPacketAsync(packet ? packet.getNative() : null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet to bitstream filter');
    }
    return ret;
  }

  /**
   * Receive a filtered packet (async version)
   * @param packet Packet to receive filtered data into
   * @returns Promise resolving to 0 on success, EAGAIN if needs more input, EOF on end
   * @throws FFmpegError on fatal errors (not EAGAIN or EOF)
   */
  async receivePacketAsync(packet: Packet): Promise<number> {
    const ret = await this.native.receivePacketAsync(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive packet from bitstream filter');
    }
    return ret;
  }

  /**
   * Filter a packet (convenience method)
   * Combines sendPacket and receivePacket
   * @param input Input packet
   * @param output Output packet
   * @returns 0 on success, negative error code on failure
   * @example
   * ```typescript
   * const result = context.filterPacket(inputPacket, outputPacket);
   * if (result >= 0) {
   *   // outputPacket contains filtered data
   * }
   * ```
   */
  filterPacket(input: Packet, output: Packet): number {
    // Send input packet
    const ret = this.sendPacket(input);
    if (ret < 0) return ret;

    // Receive filtered packet
    return this.receivePacket(output);
  }

  /**
   * Filter a packet (async convenience method)
   * Combines sendPacketAsync and receivePacketAsync
   * @param input Input packet
   * @param output Output packet
   * @returns Promise resolving to 0 on success, negative error code on failure
   * @example
   * ```typescript
   * const result = await context.filterPacketAsync(inputPacket, outputPacket);
   * if (result >= 0) {
   *   // outputPacket contains filtered data
   * }
   * ```
   */
  async filterPacketAsync(input: Packet, output: Packet): Promise<number> {
    // Send input packet
    const ret = await this.sendPacketAsync(input);
    if (ret < 0) return ret;

    // Receive filtered packet
    return await this.receivePacketAsync(output);
  }

  /**
   * Flush the filter
   */
  flush(): void {
    this.native.flush();
  }

  /**
   * Free the filter context
   */
  free(): void {
    this.native.free();
  }

  /**
   * Dispose of the filter context and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native filter context for internal use
   * @internal
   */
  getNative(): NativeBitStreamFilterContext {
    return this.native;
  }
}

/**
 * Common bitstream filter names
 */
export const BitstreamFilters = {
  // H.264/AVC
  H264_MP4_TO_ANNEXB: 'h264_mp4toannexb',
  H264_ANNEXB_TO_MP4: 'h264_annexb2mp4',

  // H.265/HEVC
  HEVC_MP4_TO_ANNEXB: 'hevc_mp4toannexb',
  HEVC_ANNEXB_TO_MP4: 'hevc_annexb2mp4',

  // AAC
  AAC_ADTS_TO_ASC: 'aac_adtstoasc',

  // VP9
  VP9_METADATA: 'vp9_metadata',
  VP9_SUPERFRAME: 'vp9_superframe',
  VP9_SUPERFRAME_SPLIT: 'vp9_superframe_split',

  // AV1
  AV1_METADATA: 'av1_metadata',
  AV1_FRAME_SPLIT: 'av1_frame_split',

  // General
  EXTRACT_EXTRADATA: 'extract_extradata',
  DUMP_EXTRADATA: 'dump_extra',
  REMOVE_EXTRADATA: 'remove_extra',
  NOISE: 'noise',
  NULL: 'null',
} as const;

/**
 * Helper function to create and initialize a bitstream filter
 * @param name Filter name
 * @param codecParams Optional codec parameters to configure
 * @returns Initialized filter context
 */
export function createBitstreamFilter(name: string, codecParams?: CodecParameters): BitStreamFilterContext {
  const filter = BitStreamFilter.getByName(name);
  if (!filter) {
    throw new Error(`Bitstream filter '${name}' not found`);
  }

  const context = new BitStreamFilterContext(filter);

  // Configure codec parameters if provided
  if (codecParams && context.codecParameters) {
    codecParams.copy(context.codecParameters);
  }

  context.init();
  return context;
}
