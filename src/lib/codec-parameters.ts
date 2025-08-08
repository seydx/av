import { bindings } from './binding.js';

import type { CodecContext } from './codec-context.js';
import type { AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { NativeCodecParameters, NativeWrapper } from './native-types.js';
import { Rational } from './rational.js';

/**
 * Channel layout configuration
 */
export interface CodecChannelLayout {
  /** Number of channels */
  nbChannels: number;
  /** Channel order */
  order: number;
  /** Channel mask */
  mask: bigint;
}

/**
 * Codec parameters for streams
 *
 * Contains the essential information about a codec configuration
 * that can be used to initialize encoders/decoders or copy between streams.
 *
 * @example
 * ```typescript
 * // Copy parameters from a stream
 * const params = new CodecParameters();
 * params.fromCodecContext(decoderContext);
 *
 * // Apply to another context
 * params.toCodecContext(encoderContext);
 * ```
 */
export class CodecParameters implements Disposable, NativeWrapper<NativeCodecParameters> {
  private native: any; // Native codec parameters binding

  // ==================== Constructor ====================

  /**
   * Create new codec parameters
   */
  constructor() {
    this.native = new bindings.CodecParameters();
  }

  // ==================== Static Methods ====================

  /**
   * Create CodecParameters from a native binding
   * @internal
   */
  static fromNative(nativeParams: any): CodecParameters {
    const params = Object.create(CodecParameters.prototype) as CodecParameters;
    Object.defineProperty(params, 'native', {
      value: nativeParams,
      writable: false,
      configurable: false,
    });
    return params;
  }

  // ==================== Getters/Setters ====================

  /**
   * Get/set the codec type (audio/video/subtitle)
   */
  get codecType(): AVMediaType {
    return this.native.codecType;
  }

  set codecType(value: AVMediaType) {
    this.native.codecType = value;
  }

  /**
   * Get/set the codec ID
   */
  get codecId(): AVCodecID {
    return this.native.codecId;
  }

  set codecId(value: AVCodecID) {
    this.native.codecId = value;
  }

  /**
   * Get/set the codec tag
   */
  get codecTag(): number {
    return this.native.codecTag;
  }

  set codecTag(value: number) {
    this.native.codecTag = value;
  }

  /**
   * Get/set the bit rate
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
  }

  /**
   * Get/set video width in pixels
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Get/set video height in pixels
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Get/set format (generic)
   */
  get format(): number {
    return this.native.format;
  }

  set format(value: number) {
    this.native.format = value;
  }

  /**
   * Get/set pixel format for video
   */
  get pixelFormat(): AVPixelFormat {
    return this.native.format;
  }

  set pixelFormat(value: AVPixelFormat) {
    this.native.format = value;
  }

  /**
   * Get/set sample aspect ratio
   */
  get sampleAspectRatio(): Rational {
    const r = this.native.sampleAspectRatio;
    return new Rational(r.num, r.den);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Get/set audio sample rate in Hz
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Get/set audio sample format
   */
  get sampleFormat(): AVSampleFormat {
    return this.native.format;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Get/set channel layout configuration
   */
  get channelLayout(): CodecChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: CodecChannelLayout) {
    this.native.channelLayout = value;
  }

  /**
   * Get/set audio frame size
   */
  get frameSize(): number {
    return this.native.frameSize;
  }

  set frameSize(value: number) {
    this.native.frameSize = value;
  }

  /**
   * Get/set codec profile
   */
  get profile(): number {
    return this.native.profile;
  }

  set profile(value: number) {
    this.native.profile = value;
  }

  /**
   * Get/set codec level
   */
  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
  }

  /**
   * Get/set color range
   */
  get colorRange(): number {
    return this.native.colorRange;
  }

  set colorRange(value: number) {
    this.native.colorRange = value;
  }

  /**
   * Get/set color space
   */
  get colorSpace(): number {
    return this.native.colorSpace;
  }

  set colorSpace(value: number) {
    this.native.colorSpace = value;
  }

  /**
   * Get/set color primaries
   */
  get colorPrimaries(): number {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: number) {
    this.native.colorPrimaries = value;
  }

  /**
   * Get/set color transfer characteristic
   */
  get colorTransferCharacteristic(): number {
    return this.native.colorTransferCharacteristic;
  }

  set colorTransferCharacteristic(value: number) {
    this.native.colorTransferCharacteristic = value;
  }

  /**
   * Get/set chroma sample location
   */
  get chromaLocation(): number {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: number) {
    this.native.chromaLocation = value;
  }

  /**
   * Get/set codec extra data
   */
  get extraData(): Buffer | null {
    return this.native.extraData;
  }

  set extraData(value: Buffer | null) {
    this.native.extraData = value;
  }

  // ==================== Public Methods ====================

  /**
   * Copy parameters to another CodecParameters instance
   * @param dst Destination parameters
   */
  copy(dst: CodecParameters): void {
    this.native.copy(dst.getNative());
  }

  /**
   * Copy parameters from a codec context
   * @param ctx Source codec context
   */
  fromCodecContext(ctx: CodecContext): void {
    // Pass the native wrapped object that C++ can unwrap
    this.native.fromCodecContext(ctx.getNative());
  }

  /**
   * Copy parameters to a codec context
   * @param ctx Destination codec context
   */
  toCodecContext(ctx: CodecContext): void {
    // Pass the native wrapped object that C++ can unwrap
    this.native.toCodecContext(ctx.getNative());
  }

  /**
   * Dispose of codec parameters and free resources
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get native codec parameters for internal use
   * @internal
   */
  getNative(): any {
    return this.native;
  }
}
