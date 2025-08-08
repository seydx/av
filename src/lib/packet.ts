import { bindings } from './binding.js';
import { AV_PKT_FLAG_KEY } from './constants.js';

import type { AVPacketFlag } from './constants.js';
import type { Rational } from './rational.js';

// Native packet interface
interface NativePacket {
  streamIndex: number;
  pts: bigint;
  dts: bigint;
  duration: bigint;
  pos: bigint;
  readonly size: number;
  flags: AVPacketFlag;
  data: Buffer | null;

  ref(): void;
  unref(): void;
  rescaleTs(src: Rational, dst: Rational): void;
  clone(): NativePacket;
}

/**
 * AVPacket wrapper - represents encoded data
 * Packets are used to store compressed data before decoding
 * or after encoding
 */
export class Packet implements Disposable {
  private native: NativePacket;

  constructor() {
    this.native = new (bindings as any).Packet();
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
   * Check if packet contains a keyframe
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
   * Reference the packet (increase reference count)
   */
  ref(): void {
    this.native.ref();
  }

  /**
   * Unreference the packet (decrease reference count and free if zero)
   */
  unref(): void {
    this.native.unref();
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
   * Dispose of the packet and free resources
   */
  [Symbol.dispose](): void {
    this.unref();
  }

  /**
   * Get native packet for internal use
   * @internal
   */
  get nativePacket(): NativePacket {
    return this.native;
  }
}
