import { bindings } from './binding.js';
import { CodecParameters } from './codec-parameters.js';
import { AV_MEDIA_TYPE_AUDIO, AV_MEDIA_TYPE_SUBTITLE, AV_MEDIA_TYPE_VIDEO } from './constants.js';
import { Dictionary } from './dictionary.js';
import { Options } from './option.js';
import { Rational } from './rational.js';

import type { AVDiscard, AVDisposition } from './constants.js';
import type { NativeStream, NativeWrapper } from './native-types.js';

/**
 * Media stream within a format context
 *
 * Represents an individual stream (video, audio, or subtitle) within a
 * media container. Each stream has its own codec parameters, timing
 * information, and metadata.
 *
 * @example
 * ```typescript
 * // Find video stream
 * const streams = formatContext.streams;
 * const videoStream = streams.find(s => s.isVideo());
 * if (videoStream) {
 *   console.log(`Video stream #${videoStream.index}`);
 *   console.log(`Resolution: ${videoStream.codecParameters?.width}x${videoStream.codecParameters?.height}`);
 *   console.log(`Time base: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
 * }
 *
 * // Check stream disposition
 * if (stream.hasDisposition(AV_DISPOSITION_DEFAULT)) {
 *   console.log('This is the default stream');
 * }
 * ```
 */
export class Stream implements NativeWrapper<NativeStream> {
  private native: NativeStream; // Native stream binding
  private _options?: Options;

  /**
   * Create a new stream
   */
  constructor() {
    this.native = new bindings.Stream();
  }

  /**
   * Create a Stream from native binding
   * @internal
   */
  static fromNative(nativeStream: NativeStream): Stream {
    const stream = new Stream();
    stream.native = nativeStream;
    return stream;
  }

  /**
   * Get stream index in the container (read-only)
   */
  get index(): number {
    return this.native.index;
  }

  /**
   * Get/set stream ID
   */
  get id(): number {
    return this.native.id;
  }

  set id(value: number) {
    this.native.id = value;
  }

  /**
   * Get stream duration in stream time base units
   */
  get duration(): bigint {
    return this.native.duration;
  }

  /**
   * Get number of frames in this stream
   */
  get nbFrames(): bigint {
    return this.native.nbFrames;
  }

  /**
   * Get start time in stream time base units
   */
  get startTime(): bigint {
    return this.native.startTime;
  }

  /**
   * Get/set time base for timestamps
   */
  get timeBase(): Rational {
    const r = this.native.timeBase;
    return new Rational(r.num, r.den);
  }

  set timeBase(value: Rational) {
    this.native.timeBase = { num: value.num, den: value.den };
  }

  /**
   * Get/set average frame rate
   */
  get avgFrameRate(): Rational {
    const r = this.native.avgFrameRate;
    return new Rational(r.num, r.den);
  }

  set avgFrameRate(value: Rational) {
    this.native.avgFrameRate = { num: value.num, den: value.den };
  }

  /**
   * Get/set real frame rate
   */
  get rFrameRate(): Rational {
    const r = this.native.rFrameRate;
    return new Rational(r.num, r.den);
  }

  set rFrameRate(value: Rational) {
    this.native.rFrameRate = { num: value.num, den: value.den };
  }

  /**
   * Get/set sample aspect ratio (video streams)
   */
  get sampleAspectRatio(): Rational {
    const r = this.native.sampleAspectRatio;
    return new Rational(r.num, r.den);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Get/set discard setting
   */
  get discard(): AVDiscard {
    return this.native.discard;
  }

  set discard(value: AVDiscard) {
    this.native.discard = value;
  }

  /**
   * Get/set stream disposition flags
   */
  get disposition(): AVDisposition {
    return this.native.disposition;
  }

  set disposition(value: AVDisposition) {
    this.native.disposition = value;
  }

  /**
   * Get event flags (read-only)
   */
  get eventFlags(): number {
    return this.native.eventFlags;
  }

  /**
   * Get/set stream metadata
   */
  get metadata(): Dictionary {
    // Native binding returns a plain object, convert to Dictionary
    const nativeMeta = this.native.metadata;
    if (!nativeMeta) {
      return new Dictionary();
    }
    return Dictionary.fromObject(nativeMeta);
  }

  set metadata(value: Dictionary) {
    // Native binding expects a plain object
    this.native.metadata = value.toObject();
  }

  /**
   * Get codec parameters for this stream
   */
  get codecParameters(): CodecParameters | null {
    const nativeParams = this.native.codecParameters;
    if (!nativeParams) return null;
    // The native binding returns a wrapped CodecParameters object
    // We need to wrap it in our TypeScript class
    return CodecParameters.fromNative(nativeParams);
  }

  /**
   * Get AVOptions for this stream
   * Allows runtime configuration of stream parameters
   */
  get options(): Options {
    this._options ??= new Options(this.native.options);
    return this._options;
  }

  /**
   * Check if this is a video stream
   * @returns true if video stream
   */
  isVideo(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_VIDEO : false;
  }

  /**
   * Check if this is an audio stream
   * @returns true if audio stream
   */
  isAudio(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_AUDIO : false;
  }

  /**
   * Check if this is a subtitle stream
   * @returns true if subtitle stream
   */
  isSubtitle(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_SUBTITLE : false;
  }

  /**
   * Check if stream has a specific disposition flag
   * @param flag Disposition flag to check
   * @returns true if flag is set
   * @example
   * ```typescript
   * if (stream.hasDisposition(AV_DISPOSITION_DEFAULT)) {
   *   console.log('Default stream');
   * }
   * ```
   */
  hasDisposition(flag: AVDisposition): boolean {
    return (this.disposition & flag) !== 0;
  }

  /**
   * Add a disposition flag to the stream
   * @param flag Disposition flag to add
   */
  addDisposition(flag: AVDisposition): void {
    this.disposition = (this.disposition | flag) as AVDisposition;
  }

  /**
   * Remove a disposition flag from the stream
   * @param flag Disposition flag to remove
   */
  removeDisposition(flag: AVDisposition): void {
    this.disposition = (this.disposition & ~flag) as AVDisposition;
  }

  /**
   * Get native stream for internal use
   * @internal
   */
  getNative(): NativeStream {
    return this.native;
  }
}
