import { bindings } from './binding.js';

import type { AVPacketFlag } from './constants.js';
import type { NativePacket, NativeWrapper } from './native-types.js';
import type { Rational } from './rational.js';

/**
 * FFmpeg packet for compressed data - Low Level API
 *
 * Direct mapping to FFmpeg's AVPacket.
 * Contains compressed audio/video data read from demuxer or to be sent to muxer.
 * User has full control over allocation and lifecycle.
 *
 * @example
 * ```typescript
 * // Create and allocate packet - full control
 * const packet = new Packet();
 * packet.alloc();
 *
 * // Read from demuxer
 * const ret = await formatContext.readFrame(packet);
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Process packet
 * console.log(`Stream: ${packet.streamIndex}, PTS: ${packet.pts}`);
 *
 * // Send to decoder
 * await codecContext.sendPacket(packet);
 *
 * // Cleanup
 * packet.unref(); // Clear data but keep packet allocated
 * packet.free();  // Free packet completely
 * ```
 */
export class Packet implements Disposable, NativeWrapper<NativePacket> {
  private native: NativePacket;

  // Constructor
  /**
   * Create a new packet.
   *
   * The packet is uninitialized - you must call alloc() before use.
   * Direct wrapper around AVPacket.
   *
   * @example
   * ```typescript
   * const packet = new Packet();
   * packet.alloc();
   * // Packet is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.Packet();
  }

  // Getter/Setter Properties

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

  // Public Methods - Low Level API

  /**
   * Allocate an AVPacket and set its fields to default values.
   *
   * Direct mapping to av_packet_alloc()
   *
   * The packet must be freed with free().
   *
   * @example
   * ```typescript
   * const packet = new Packet();
   * packet.alloc();
   * // Packet is now allocated with default values
   * ```
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @note This only allocates the AVPacket itself, not the data buffers.
   *       Those must be allocated through other means such as av_new_packet().
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
   * Direct mapping to av_packet_ref()
   *
   * If src is reference counted, increase its reference count.
   * Otherwise allocate a new buffer for dst and copy the data from src into it.
   *
   * All the other fields are copied from src.
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
   * const src = new Packet();
   * // ... src contains data ...
   * const dst = new Packet();
   * dst.alloc();
   * const ret = dst.ref(src);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // dst now references the same data as src
   * ```
   *
   * @see unref()
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
   * Direct mapping to av_packet_clone()
   *
   * This is a shortcut for av_packet_alloc() + av_packet_ref().
   *
   * @returns New packet referencing the same data, or null on error (ENOMEM)
   *
   * @example
   * ```typescript
   * const original = new Packet();
   * // ... original contains data ...
   * const cloned = original.clone();
   * if (!cloned) {
   *   throw new Error('Failed to clone packet');
   * }
   * // cloned references the same data as original
   * ```
   *
   * @see ref()
   */
  clone(): Packet | null {
    const cloned = this.native.clone();
    if (!cloned) {
      return null;
    }

    // Wrap the native cloned packet
    const packet = Object.create(Packet.prototype) as Packet;
    // Need to set private property - this is safe since we control the implementation
    (packet as unknown as { native: NativePacket }).native = cloned;
    return packet;
  }

  /**
   * Convert valid timing fields (timestamps / durations) in a packet from one
   * timebase to another.
   *
   * Direct mapping to av_packet_rescale_ts()
   *
   * Timestamps with unknown values (AV_NOPTS_VALUE) will be ignored.
   *
   * This function is useful when you need to convert packet timestamps between
   * different contexts, for example when remuxing or when the decoder and encoder
   * use different timebases.
   *
   * @param srcTimebase - Source timebase, in which the timestamps are expressed
   * @param dstTimebase - Destination timebase, to which the timestamps will be converted
   *
   * @example
   * ```typescript
   * // Convert from stream timebase to codec timebase
   * packet.rescaleTs(
   *   stream.timeBase,
   *   codecContext.timeBase
   * );
   * ```
   */
  rescaleTs(srcTimebase: Rational, dstTimebase: Rational): void {
    this.native.rescaleTs({ num: srcTimebase.num, den: srcTimebase.den }, { num: dstTimebase.num, den: dstTimebase.den });
  }

  /**
   * Ensure the data described by the packet is reference counted.
   *
   * Direct mapping to av_packet_make_refcounted()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (data is now reference counted)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const ret = packet.makeRefcounted();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // Packet data is now reference counted
   * ```
   *
   * @note This function does not ensure that the reference will be writable.
   *       Use makeWritable() for that purpose.
   *
   * @see makeWritable()
   */
  makeRefcounted(): number {
    return this.native.makeRefcounted();
  }

  /**
   * Create a writable reference for the data described by the packet,
   * avoiding data copy if possible.
   *
   * Direct mapping to av_packet_make_writable()
   *
   * If the packet data buffer is already writable, this does nothing.
   * Otherwise, a new buffer is allocated, data is copied, and the old buffer
   * is unreferenced.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (data is now writable)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const ret = packet.makeWritable();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // Packet data is now writable and can be modified
   * ```
   *
   * @see makeRefcounted()
   */
  makeWritable(): number {
    return this.native.makeWritable();
  }

  // Internal Methods

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
   * {
   *   using packet = new Packet();
   *   packet.alloc();
   *   // ... use packet
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
