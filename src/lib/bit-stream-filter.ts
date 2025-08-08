/**
 * BitStreamFilter wrapper for FFmpeg
 * Provides functionality to manipulate packet data (e.g., H.264 stream format conversion)
 */

import { bindings } from './binding.js';
import { CodecParameters } from './codec-parameters.js';
import { AV_ERROR_EAGAIN, AV_ERROR_EOF, type AVCodecID } from './constants.js';
import { FFmpegError } from './error.js';
import type { Packet } from './packet.js';
import type { Rational } from './rational.js';

/**
 * BitStreamFilter - represents a specific bitstream filter type
 */
export class BitStreamFilter {
  private native: any;

  /** @internal */
  constructor(native: any) {
    this.native = native;
  }

  /**
   * Get bitstream filter by name
   * @param name Filter name (e.g., "h264_mp4toannexb", "hevc_mp4toannexb", "aac_adtstoasc")
   * @returns BitStreamFilter instance or null if not found
   */
  static getByName(name: string): BitStreamFilter | null {
    const native = bindings.BitStreamFilter.getByName(name);
    return native ? new BitStreamFilter(native) : null;
  }

  /**
   * Iterate over all available bitstream filters
   * @returns Iterator of available filters
   */
  static *iterate(): IterableIterator<BitStreamFilter> {
    const opaque = null;
    while (true) {
      const native = (bindings as any).BitStreamFilter.iterate(opaque);
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
   * Get private class name (for debugging)
   */
  get privClassName(): string | null {
    return this.native.getPrivClass();
  }

  /**
   * Check if this filter supports a specific codec
   * @param codecId Codec ID to check
   * @returns true if supported, false otherwise
   */
  supportsCodec(codecId: AVCodecID): boolean {
    const ids = this.codecIds;
    if (!ids) return true; // Supports all codecs
    return ids.includes(codecId);
  }

  /** @internal */
  getNative(): any {
    return this.native;
  }
}

/**
 * BitStreamFilterContext - instance of a bitstream filter
 */
export class BitStreamFilterContext implements Disposable {
  private native: any;
  private _filter?: BitStreamFilter;
  private _codecParameters?: CodecParameters;

  /** @internal */
  constructor(native: any) {
    this.native = native;
  }

  /**
   * Allocate a new bitstream filter context
   * @param filter BitStreamFilter to use
   * @returns New context instance
   */
  static alloc(filter: BitStreamFilter): BitStreamFilterContext {
    const native = bindings.BitStreamFilterContext.alloc(filter.getNative());
    if (!native) {
      throw new Error('Failed to allocate bitstream filter context');
    }
    return new BitStreamFilterContext(native);
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
   */
  sendPacket(packet: Packet | null): number {
    const ret = this.native.sendPacket(packet ? packet.nativePacket : null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet to bitstream filter');
    }
    return ret;
  }

  /**
   * Receive a filtered packet
   * @param packet Packet to receive filtered data into
   * @returns 0 on success, EAGAIN if needs more input, EOF on end
   */
  receivePacket(packet: Packet): number {
    const ret = this.native.receivePacket(packet.nativePacket);
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
   */
  filterPacket(input: Packet, output: Packet): number {
    // Send input packet
    const ret = this.sendPacket(input);
    if (ret < 0) return ret;

    // Receive filtered packet
    return this.receivePacket(output);
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
    return this.native.timeBaseIn;
  }

  set timeBaseIn(value: Rational) {
    this.native.timeBaseIn = value;
  }

  /**
   * Get/set output time base
   */
  get timeBaseOut(): Rational {
    return this.native.timeBaseOut;
  }

  set timeBaseOut(value: Rational) {
    this.native.timeBaseOut = value;
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
   * Symbol.dispose support for using statement
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /** @internal */
  getNative(): any {
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

  const context = BitStreamFilterContext.alloc(filter);

  // Configure codec parameters if provided
  if (codecParams && context.codecParameters) {
    codecParams.copy(context.codecParameters);
  }

  context.init();
  return context;
}
