import { bindings } from './binding.js';
import { AV_PKT_FLAG_KEY } from './constants.js';

import type { AVPacketFlag } from './constants.js';
import type { NativePacket, NativeWrapper } from './native-types.js';
import type { Rational } from './rational.js';

/**
 * AVPacket wrapper - represents encoded data
 * Packets are used to store compressed data before decoding
 * or after encoding
 */
export class Packet implements Disposable, NativeWrapper<NativePacket> {
  private native: NativePacket; // Native packet binding - using any because native bindings have dynamic properties

  constructor() {
    this.native = new bindings.Packet();
  }

  /**
   * Create a packet from a native binding
   * @internal
   */
  static fromNative(native: NativePacket): Packet {
    const packet = Object.create(Packet.prototype) as Packet;
    Object.defineProperty(packet, 'native', {
      value: native,
      writable: false,
      configurable: false,
    });
    return packet;
  }

  /**
   * Stream index this packet belongs to
   */
  get streamIndex(): number {
    return this.native.streamIndex;
  }

  set streamIndex(value: number) {
    this.native.streamIndex = value;
  }

  /**
   * Presentation timestamp in stream time base units
   */
  get pts(): bigint {
    return this.native.pts;
  }

  set pts(value: bigint) {
    this.native.pts = value;
  }

  /**
   * Decompression timestamp in stream time base units
   */
  get dts(): bigint {
    return this.native.dts;
  }

  set dts(value: bigint) {
    this.native.dts = value;
  }

  /**
   * Duration of this packet in stream time base units
   */
  get duration(): bigint {
    return this.native.duration;
  }

  set duration(value: bigint) {
    this.native.duration = value;
  }

  /**
   * Byte position in stream
   */
  get pos(): bigint {
    return this.native.pos;
  }

  set pos(value: bigint) {
    this.native.pos = value;
  }

  /**
   * Size of the packet data in bytes
   */
  get size(): number {
    return this.native.size;
  }

  /**
   * Packet flags (keyframe, corrupt, etc.)
   */
  get flags(): AVPacketFlag {
    return this.native.flags;
  }

  set flags(value: AVPacketFlag) {
    this.native.flags = value;
  }

  /**
   * Get whether packet contains a keyframe (read-only)
   */
  get isKeyframe(): boolean {
    return (this.flags & AV_PKT_FLAG_KEY) !== 0;
  }

  /**
   * Set keyframe flag
   */
  set isKeyframe(value: boolean) {
    if (value) {
      this.flags = (this.flags | AV_PKT_FLAG_KEY) as AVPacketFlag;
    } else {
      this.flags = (this.flags & ~AV_PKT_FLAG_KEY) as AVPacketFlag;
    }
  }

  /**
   * Packet data as Buffer
   */
  get data(): Buffer | null {
    return this.native.data;
  }

  set data(value: Buffer | null) {
    this.native.data = value;
  }

  /**
   * Rescale packet timestamps from one time base to another
   */
  rescaleTs(src: Rational, dst: Rational): void {
    this.native.rescaleTs(src, dst);
  }

  /**
   * Create a copy of this packet
   */
  clone(): Packet {
    const cloned = new Packet();
    (cloned as any).native = this.native.clone();
    return cloned;
  }

  /**
   * Clear packet data but keep structure for reuse
   * Use this when you want to reuse the packet object
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Free the packet and release all resources
   * Use this when you're done with the packet completely
   */
  free(): void {
    this.native.free();
  }

  /**
   * Dispose of the packet and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native binding
   * @internal
   */
  getNative(): NativePacket {
    return this.native;
  }
}
