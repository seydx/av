import { bindings } from './binding.js';

import type { AVPacketFlag } from './constants.js';
import type { NativePacket, NativeWrapper } from './native-types.js';
import type { IRational } from './types.js';

/**
 * Packet for compressed audio/video data.
 *
 * Contains compressed audio/video data read from demuxer or to be sent to muxer.
 * Packets are the fundamental unit of data exchange between demuxers, muxers,
 * encoders, and decoders in FFmpeg. User has full control over allocation and lifecycle.
 *
 * Direct mapping to FFmpeg's AVPacket.
 *
 * @example
 * ```typescript
 * import { Packet, FormatContext, CodecContext, FFmpegError } from '@seydx/ffmpeg';
 *
 * // Create and allocate packet - full control
 * const packet = new Packet();
 * packet.alloc();
 *
 * // Read from demuxer
 * const ret = await formatContext.readFrame(packet);
 * FFmpegError.throwIfError(ret, 'readFrame');
 *
 * // Process packet
 * console.log(`Stream: ${packet.streamIndex}, PTS: ${packet.pts}`);
 *
 * // Send to decoder
 * const sendRet = await codecContext.sendPacket(packet);
 * FFmpegError.throwIfError(sendRet, 'sendPacket');
 *
 * // Cleanup
 * packet.unref(); // Clear data but keep packet allocated
 * packet.free();  // Free packet completely
 * ```
 *
 * @see {@link CodecContext} For encoding/decoding packets
 * @see {@link FormatContext} For reading/writing packets
 */
export class Packet implements Disposable, NativeWrapper<NativePacket> {
  private native: NativePacket;

  /**
   * Create a new packet instance.
   *
   * The packet is uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVPacket allocation.
   *
   * @example
   * ```typescript
   * import { Packet } from '@seydx/ffmpeg';
   *
   * const packet = new Packet();
   * packet.alloc();
   * // Packet is now ready for use
   *
   * // Always free when done
   * packet.free();
   * ```
   */
  constructor() {
    this.native = new bindings.Packet();
  }

  /**
   * Stream index this packet belongs to.
   *
   * Direct mapping to AVPacket->stream_index
   *
   * Set by demuxer to indicate which stream this packet belongs to.
   * Must be set by user for muxing.
   */
  get streamIndex(): number {
    return this.native.streamIndex;
  }

  set streamIndex(value: number) {
    this.native.streamIndex = value;
  }

  /**
   * Presentation timestamp in AVStream->time_base units.
   *
   * Direct mapping to AVPacket->pts
   *
   * The time at which the decompressed packet will be presented to the user.
   * Can be AV_NOPTS_VALUE if it is not stored in the file.
   * pts MUST be larger or equal to dts as presentation cannot happen before
   * decompression, unless one wants to view hex dumps. Some formats misuse
   * the terms dts and pts/cts to mean something different. Such timestamps
   * must be converted to true pts/dts before they are stored in AVPacket.
   */
  get pts(): bigint {
    return this.native.pts;
  }

  set pts(value: bigint) {
    this.native.pts = value;
  }

  /**
   * Decompression timestamp in AVStream->time_base units.
   *
   * Direct mapping to AVPacket->dts
   *
   * The time at which the packet is decompressed.
   * Can be AV_NOPTS_VALUE if it is not stored in the file.
   */
  get dts(): bigint {
    return this.native.dts;
  }

  set dts(value: bigint) {
    this.native.dts = value;
  }

  /**
   * Duration of this packet in AVStream->time_base units, 0 if unknown.
   *
   * Direct mapping to AVPacket->duration
   *
   * Equals next_pts - this_pts in presentation order.
   */
  get duration(): bigint {
    return this.native.duration;
  }

  set duration(value: bigint) {
    this.native.duration = value;
  }

  /**
   * Byte position in stream, -1 if unknown.
   *
   * Direct mapping to AVPacket->pos
   *
   * Can be used to derive seeking positions for formats without timestamps.
   */
  get pos(): bigint {
    return this.native.pos;
  }

  set pos(value: bigint) {
    this.native.pos = value;
  }

  /**
   * Size of packet data in bytes.
   *
   * Direct mapping to AVPacket->size
   *
   * @readonly
   */
  get size(): number {
    return this.native.size;
  }

  /**
   * A combination of AV_PKT_FLAG values.
   *
   * Direct mapping to AVPacket->flags
   *
   * - AV_PKT_FLAG_KEY: The packet contains a keyframe
   * - AV_PKT_FLAG_CORRUPT: The packet content is corrupted
   * - AV_PKT_FLAG_DISCARD: Flag for packets that should be dropped
   * - AV_PKT_FLAG_TRUSTED: The packet comes from a trusted source
   * - AV_PKT_FLAG_DISPOSABLE: Flag for packets that can be dropped if needed
   */
  get flags(): AVPacketFlag {
    return this.native.flags;
  }

  set flags(value: AVPacketFlag) {
    this.native.flags = value;
  }

  /**
   * Packet data buffer.
   *
   * Direct mapping to AVPacket->data
   *
   * Can be null if the packet is empty or unallocated.
   * Setting null will unref the packet data.
   * When setting a new buffer, av_packet_from_data() is called internally.
   */
  get data(): Buffer | null {
    return this.native.data;
  }

  set data(value: Buffer | null) {
    this.native.data = value;
  }

  /**
   * Check if packet contains a keyframe.
   *
   * This is a convenience accessor for the AV_PKT_FLAG_KEY flag.
   */
  get isKeyframe(): boolean {
    return this.native.isKeyframe;
  }

  set isKeyframe(value: boolean) {
    this.native.isKeyframe = value;
  }

  /**
   * Allocate an AVPacket and set its fields to default values.
   *
   * Allocates the AVPacket structure and initializes all fields to default values.
   * This only allocates the packet structure itself, not the data buffers.
   *
   * Direct mapping to av_packet_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { Packet } from '@seydx/ffmpeg';
   *
   * const packet = new Packet();
   * packet.alloc();
   * // Packet is now allocated with default values
   * // pts = AV_NOPTS_VALUE, dts = AV_NOPTS_VALUE
   * // size = 0, data = null
   * ```
   *
   * @see {@link free} Must be called when done
   * @see {@link unref} To clear data but keep allocation
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the packet.
   *
   * Direct mapping to av_packet_free()
   *
   * If the packet has a reference counted buffer, it will be unreferenced first.
   * After calling this, the packet is no longer usable until alloc() is called again.
   *
   * @example
   * ```typescript
   * packet.free();
   * // packet is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Setup a new reference to the data described by a given packet.
   *
   * If src is reference counted, increase its reference count.
   * Otherwise allocate a new buffer for dst and copy the data from src into it.
   * All the other fields are copied from src.
   *
   * Direct mapping to av_packet_ref()
   *
   * @param src - Source packet to reference
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(EINVAL): Invalid parameters (null packet)
   *
   * @example
   * ```typescript
   * import { Packet, FFmpegError } from '@seydx/ffmpeg';
   *
   * const src = new Packet();
   * // ... src contains data ...
   * const dst = new Packet();
   * dst.alloc();
   *
   * const ret = dst.ref(src);
   * FFmpegError.throwIfError(ret, 'packet.ref');
   * // dst now references the same data as src
   * ```
   *
   * @see {@link unref} To remove reference
   * @see {@link clone} For simpler cloning
   */
  ref(src: Packet): number {
    return this.native.ref(src.getNative());
  }

  /**
   * Wipe the packet.
   *
   * Direct mapping to av_packet_unref()
   *
   * Unreference the buffer referenced by the packet and reset the
   * remaining packet fields to their default values.
   *
   * The packet remains allocated and can be reused.
   *
   * @example
   * ```typescript
   * packet.unref();
   * // Packet data is cleared but packet remains allocated
   * // Can reuse the packet for another read
   * ```
   *
   * @note The packet must have been allocated with alloc().
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Create a new packet that references the same data as this packet.
   *
   * This is a shortcut for av_packet_alloc() + av_packet_ref().
   * The new packet shares the same data buffer through reference counting.
   *
   * Direct mapping to av_packet_clone()
   *
   * @returns New packet referencing the same data, or null on error (ENOMEM)
   *
   * @example
   * ```typescript
   * import { Packet } from '@seydx/ffmpeg';
   *
   * const original = new Packet();
   * // ... original contains data ...
   *
   * const cloned = original.clone();
   * if (!cloned) {
   *   throw new Error('Failed to clone packet: Out of memory');
   * }
   * // cloned references the same data as original
   * // Both packets must be freed independently
   * cloned.free();
   * original.free();
   * ```
   *
   * @see {@link ref} For manual reference setup
   */
  clone(): Packet | null {
    const cloned = this.native.clone();
    if (!cloned) {
      return null;
    }

    // Wrap the native cloned packet
    const packet = Object.create(Packet.prototype) as Packet;
    // Need to set private property - this is safe since we control the implementation
    (packet as any).native = cloned;
    return packet;
  }

  /**
   * Convert valid timing fields (timestamps / durations) in a packet from one timebase to another.
   *
   * Timestamps with unknown values (AV_NOPTS_VALUE) will be ignored.
   * This function is useful when you need to convert packet timestamps between
   * different contexts, for example when remuxing or when the decoder and encoder
   * use different timebases.
   *
   * Direct mapping to av_packet_rescale_ts()
   *
   * @param srcTimebase - Source timebase, in which the timestamps are expressed
   * @param dstTimebase - Destination timebase, to which the timestamps will be converted
   *
   * @example
   * ```typescript
   * import { Packet, Rational } from '@seydx/ffmpeg';
   *
   * // Convert from stream timebase to codec timebase
   * const streamTimebase = new Rational(1, 90000); // 90kHz
   * const codecTimebase = new Rational(1, 25); // 25 fps
   *
   * packet.rescaleTs(
   *   streamTimebase,
   *   codecTimebase
   * );
   * // PTS and DTS are now in codec timebase
   * ```
   *
   * @see {@link Rational} For timebase representation
   */
  rescaleTs(srcTimebase: IRational, dstTimebase: IRational): void {
    this.native.rescaleTs({ num: srcTimebase.num, den: srcTimebase.den }, { num: dstTimebase.num, den: dstTimebase.den });
  }

  /**
   * Ensure the data described by the packet is reference counted.
   *
   * Makes the packet data reference counted if it isn't already.
   * This is useful when you need to share packet data between multiple owners.
   *
   * Direct mapping to av_packet_make_refcounted()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (data is now reference counted)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { Packet, FFmpegError } from '@seydx/ffmpeg';
   *
   * const ret = packet.makeRefcounted();
   * FFmpegError.throwIfError(ret, 'makeRefcounted');
   * // Packet data is now reference counted
   * // Safe to share with multiple owners
   * ```
   *
   * Note: This function does not ensure that the reference will be writable.
   * Use makeWritable() for that purpose.
   *
   * @see {@link makeWritable} To ensure data is writable
   */
  makeRefcounted(): number {
    return this.native.makeRefcounted();
  }

  /**
   * Create a writable reference for the data described by the packet.
   *
   * If the packet data buffer is already writable, this does nothing.
   * Otherwise, a new buffer is allocated, data is copied, and the old buffer
   * is unreferenced. This avoids data copy if possible.
   *
   * Direct mapping to av_packet_make_writable()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (data is now writable)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { Packet, FFmpegError } from '@seydx/ffmpeg';
   *
   * // Before modifying packet data
   * const ret = packet.makeWritable();
   * FFmpegError.throwIfError(ret, 'makeWritable');
   *
   * // Now safe to modify packet data
   * const data = packet.data;
   * if (data) {
   *   // Modify data buffer directly
   *   data[0] = 0xFF;
   * }
   * ```
   *
   * @see {@link makeRefcounted} To make data reference counted
   */
  makeWritable(): number {
    return this.native.makeWritable();
  }

  /**
   * Get the native FFmpeg AVPacket pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native packet object
   */
  getNative(): NativePacket {
    return this.native;
  }

  /**
   * Dispose of the packet.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * import { Packet } from '@seydx/ffmpeg';
   *
   * // Using 'using' declaration for automatic cleanup
   * {
   *   using packet = new Packet();
   *   packet.alloc();
   *   // ... use packet
   * } // Automatically freed when leaving scope
   *
   * // Or with try-finally
   * const packet = new Packet();
   * try {
   *   packet.alloc();
   *   // ... use packet
   * } finally {
   *   packet[Symbol.dispose]();
   * }
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
