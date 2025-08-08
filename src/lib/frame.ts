import { bindings } from './binding.js';

import type { AVPictureType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Rational } from './rational.js';

// Native frame interface
interface NativeFrame {
  // Common
  pts: bigint;
  pktDts: bigint;
  readonly bestEffortTimestamp: bigint;
  pktPos: bigint;
  pktDuration: bigint;
  keyFrame: boolean;
  pictType: number;

  // Video
  width: number;
  height: number;
  format: number;
  sampleAspectRatio: Rational;
  colorRange: number;
  colorSpace: number;

  // Audio
  nbSamples: number;
  sampleRate: number;
  channelLayout: {
    nbChannels: number;
    order: number;
    mask?: bigint;
  };

  // Data
  readonly data: (Buffer | null)[];
  readonly linesize: number[];

  // Methods
  allocBuffer(align?: number): void;
  ref(): void;
  unref(): void;
  clone(): NativeFrame;
  makeWritable(): void;
  getBuffer(): Buffer | null;
}

/**
 * Channel layout order
 */
export enum ChannelOrder {
  UNSPEC = 0,
  NATIVE = 1,
  CUSTOM = 2,
  AMBISONIC = 3,
}

/**
 * Color range
 */
export enum ColorRange {
  UNSPECIFIED = 0,
  MPEG = 1, // Limited range
  JPEG = 2, // Full range
}

/**
 * Color space
 */
export enum ColorSpace {
  RGB = 0,
  BT709 = 1,
  UNSPECIFIED = 2,
  FCC = 4,
  BT470BG = 5,
  SMPTE170M = 6,
  SMPTE240M = 7,
  YCGCO = 8,
  BT2020_NCL = 9,
  BT2020_CL = 10,
}

/**
 * AVFrame wrapper - represents decoded/raw data
 * Frames are used to store uncompressed audio/video data
 */
export class Frame implements Disposable {
  private native: NativeFrame;

  constructor() {
    this.native = new bindings.Frame();
  }

  // Common properties

  /**
   * Presentation timestamp
   */
  get pts(): bigint {
    return this.native.pts;
  }

  set pts(value: bigint) {
    this.native.pts = value;
  }

  /**
   * Packet decompression timestamp
   */
  get pktDts(): bigint {
    return this.native.pktDts;
  }

  set pktDts(value: bigint) {
    this.native.pktDts = value;
  }

  /**
   * Best effort timestamp
   */
  get bestEffortTimestamp(): bigint {
    return this.native.bestEffortTimestamp;
  }

  /**
   * Packet position in stream
   * @deprecated pkt_pos is deprecated in FFmpeg 7+.
   * For new code, use opaque/opaque_ref with AV_CODEC_FLAG_COPY_OPAQUE instead.
   */
  get pktPos(): bigint {
    return this.native.pktPos;
  }

  /**
   * Packet position in stream
   * @deprecated pkt_pos is deprecated in FFmpeg 7+.
   * For new code, use opaque/opaque_ref with AV_CODEC_FLAG_COPY_OPAQUE instead.
   */
  set pktPos(value: bigint) {
    this.native.pktPos = value;
  }

  /**
   * Packet duration
   */
  get pktDuration(): bigint {
    return this.native.pktDuration;
  }

  set pktDuration(value: bigint) {
    this.native.pktDuration = value;
  }

  /**
   * Is this a keyframe?
   */
  get keyFrame(): boolean {
    return this.native.keyFrame;
  }

  set keyFrame(value: boolean) {
    this.native.keyFrame = value;
  }

  /**
   * Picture type (I, P, B frame)
   */
  get pictType(): AVPictureType {
    return this.native.pictType as AVPictureType;
  }

  set pictType(value: AVPictureType) {
    this.native.pictType = value;
  }

  // Video properties

  /**
   * Video frame width
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Video frame height
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Pixel format for video, sample format for audio
   */
  get format(): AVPixelFormat | AVSampleFormat {
    return this.native.format as AVPixelFormat | AVSampleFormat;
  }

  set format(value: AVPixelFormat | AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Sample aspect ratio (video only)
   */
  get sampleAspectRatio(): Rational {
    return this.native.sampleAspectRatio;
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = value;
  }

  /**
   * Color range (video only)
   */
  get colorRange(): ColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: ColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Color space (video only)
   */
  get colorSpace(): ColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: ColorSpace) {
    this.native.colorSpace = value;
  }

  // Audio properties

  /**
   * Number of audio samples
   */
  get nbSamples(): number {
    return this.native.nbSamples;
  }

  set nbSamples(value: number) {
    this.native.nbSamples = value;
  }

  /**
   * Audio sample rate
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Audio channel layout
   */
  get channelLayout(): { nbChannels: number; order: number; mask?: bigint } {
    return this.native.channelLayout;
  }

  set channelLayout(value: { nbChannels: number; order: number; mask?: bigint }) {
    this.native.channelLayout = value;
  }

  /**
   * Get number of channels
   */
  get channels(): number {
    return this.native.channelLayout.nbChannels;
  }

  // Data access

  /**
   * Frame data planes
   */
  get data(): (Buffer | null)[] {
    return this.native.data;
  }

  /**
   * Line sizes for each plane
   */
  get linesize(): number[] {
    return this.native.linesize;
  }

  /**
   * Check if this is a video frame
   */
  get isVideo(): boolean {
    return this.width > 0 && this.height > 0;
  }

  /**
   * Check if this is an audio frame
   */
  get isAudio(): boolean {
    return this.nbSamples > 0 && this.sampleRate > 0;
  }

  // Methods

  /**
   * Allocate buffer for frame data
   */
  allocBuffer(align = 0): void {
    this.native.allocBuffer(align);
  }

  /**
   * Reference the frame (increase reference count)
   */
  ref(): void {
    this.native.ref();
  }

  /**
   * Unreference the frame (decrease reference count)
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Create a copy of this frame
   */
  clone(): Frame {
    const cloned = new Frame();
    (cloned as any).native = this.native.clone();
    return cloned;
  }

  /**
   * Make frame data writable
   */
  makeWritable(): void {
    this.native.makeWritable();
  }

  /**
   * Get frame data as single buffer (first plane only)
   */
  getBuffer(): Buffer | null {
    return this.native.getBuffer();
  }

  /**
   * Dispose of the frame and free resources
   */
  [Symbol.dispose](): void {
    this.unref();
  }

  /**
   * Get native frame (for internal use with bindings)
   */
  get nativeFrame(): any {
    return this.native;
  }
}
