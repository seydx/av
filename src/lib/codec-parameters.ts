import { bindings } from './binding.js';
import { Rational } from './rational.js';

import type { CodecContext } from './codec-context.js';
import type {
  AVChromaLocation,
  AVCodecID,
  AVColorPrimaries,
  AVColorRange,
  AVColorSpace,
  AVColorTransferCharacteristic,
  AVMediaType,
  AVPixelFormat,
  AVSampleFormat,
} from './constants.js';
import type { NativeCodecParameters, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

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
  private native: NativeCodecParameters; // Native codec parameters binding

  /**
   * Create new codec parameters
   */
  constructor() {
    this.native = new bindings.CodecParameters();
  }

  /**
   * Create CodecParameters from a native binding
   * @internal
   */
  static fromNative(nativeParams: NativeCodecParameters): CodecParameters {
    const params = Object.create(CodecParameters.prototype) as CodecParameters;
    Object.defineProperty(params, 'native', {
      value: nativeParams,
      writable: false,
      configurable: false,
    });
    return params;
  }

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
  get format(): AVPixelFormat {
    return this.native.format as AVPixelFormat;
  }

  set format(value: AVPixelFormat) {
    this.native.format = value;
  }

  /**
   * Get/set pixel format for video
   */
  get pixelFormat(): AVPixelFormat {
    return this.native.format as AVPixelFormat;
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
    return this.native.format as AVSampleFormat;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Get/set channel layout configuration
   */
  get channelLayout(): ChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: ChannelLayout) {
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
  get colorRange(): AVColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: AVColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Get/set color space
   */
  get colorSpace(): AVColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: AVColorSpace) {
    this.native.colorSpace = value;
  }

  /**
   * Get/set color primaries
   */
  get colorPrimaries(): AVColorPrimaries {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: AVColorPrimaries) {
    this.native.colorPrimaries = value;
  }

  /**
   * Get/set color transfer characteristic
   */
  get colorTransferCharacteristic(): AVColorTransferCharacteristic {
    return this.native.colorTransferCharacteristic;
  }

  set colorTransferCharacteristic(value: AVColorTransferCharacteristic) {
    this.native.colorTransferCharacteristic = value;
  }

  /**
   * Get/set chroma sample location
   */
  get chromaLocation(): AVChromaLocation {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: AVChromaLocation) {
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
   * Free the codec parameters and release resources
   */
  free(): void {
    this.native.free();
  }

  /**
   * Dispose of codec parameters and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native codec parameters for internal use
   * @internal
   */
  getNative(): NativeCodecParameters {
    return this.native;
  }
}
