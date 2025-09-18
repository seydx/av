import { bindings } from './binding.js';
import { Rational } from './rational.js';

import type {
  AVChromaLocation,
  AVCodecID,
  AVColorPrimaries,
  AVColorRange,
  AVColorSpace,
  AVColorTransferCharacteristic,
  AVMediaType,
  AVPixelFormat,
  AVProfile,
  AVSampleFormat,
} from '../constants/constants.js';
import type { CodecContext } from './codec-context.js';
import type { NativeCodecParameters, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Codec parameters for stream configuration.
 *
 * Stores essential codec parameters without requiring a full codec context.
 * Used to describe stream properties in containers, transfer codec configuration
 * between contexts, and initialize decoders/encoders. Contains format, dimensions,
 * sample rates, and other codec-specific parameters.
 *
 * Direct mapping to FFmpeg's AVCodecParameters.
 *
 * @example
 * ```typescript
 * import { CodecParameters, CodecContext, FFmpegError } from 'node-av';
 *
 * // Create and allocate parameters
 * const params = new CodecParameters();
 * params.alloc();
 *
 * // Copy from stream
 * const stream = formatContext.streams[0];
 * const ret = stream.codecpar.copy(params);
 * FFmpegError.throwIfError(ret, 'copy');
 *
 * // Transfer to codec context
 * const ret2 = params.toContext(codecContext);
 * FFmpegError.throwIfError(ret2, 'toContext');
 *
 * // Get parameters info
 * console.log(`Codec: ${params.codecId}`);
 * console.log(`Dimensions: ${params.width}x${params.height}`);
 * console.log(`Bitrate: ${params.bitRate}`);
 * ```
 *
 * @see [AVCodecParameters](https://ffmpeg.org/doxygen/trunk/structAVCodecParameters.html) - FFmpeg Doxygen
 * @see {@link CodecContext} For full codec operations
 * @see {@link Stream} For stream parameters
 */
export class CodecParameters implements NativeWrapper<NativeCodecParameters> {
  private native: NativeCodecParameters;

  constructor() {
    this.native = new bindings.CodecParameters();
  }

  /**
   * Codec type.
   *
   * Media type (video, audio, subtitle, etc.).
   *
   * Direct mapping to AVCodecParameters->codec_type.
   */
  get codecType(): AVMediaType {
    return this.native.codecType;
  }

  set codecType(value: AVMediaType) {
    this.native.codecType = value;
  }

  /**
   * Codec ID.
   *
   * Specific codec identifier (e.g., AV_CODEC_ID_H264).
   *
   * Direct mapping to AVCodecParameters->codec_id.
   */
  get codecId(): AVCodecID {
    return this.native.codecId;
  }

  set codecId(value: AVCodecID) {
    this.native.codecId = value;
  }

  /**
   * Codec tag.
   *
   * Additional codec tag used by some formats.
   *
   * Direct mapping to AVCodecParameters->codec_tag.
   */
  get codecTag(): number {
    return this.native.codecTag;
  }

  set codecTag(value: number) {
    this.native.codecTag = value;
  }

  /**
   * Extra codec data.
   *
   * Codec-specific initialization data (e.g., H.264 SPS/PPS).
   *
   * Direct mapping to AVCodecParameters->extradata.
   */
  get extradata(): Buffer | null {
    return this.native.extradata;
  }

  set extradata(value: Buffer | null) {
    this.native.extradata = value;
  }

  /**
   * Extra data size.
   *
   * Size of extradata buffer in bytes.
   *
   * Direct mapping to AVCodecParameters->extradata_size.
   */
  get extradataSize(): number {
    return this.native.extradataSize;
  }

  /**
   * Pixel or sample format.
   *
   * Format of video pixels or audio samples.
   *
   * Direct mapping to AVCodecParameters->format.
   */
  get format(): AVPixelFormat | AVSampleFormat {
    return this.native.format;
  }

  set format(value: AVPixelFormat | AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Bit rate.
   *
   * Average bitrate in bits per second.
   *
   * Direct mapping to AVCodecParameters->bit_rate.
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
  }

  /**
   * Codec profile.
   *
   * Profile level (e.g., baseline, main, high for H.264).
   *
   * Direct mapping to AVCodecParameters->profile.
   */
  get profile(): AVProfile {
    return this.native.profile;
  }

  set profile(value: AVProfile) {
    this.native.profile = value;
  }

  /**
   * Codec level.
   *
   * Level within the profile.
   *
   * Direct mapping to AVCodecParameters->level.
   */
  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
  }

  /**
   * Video width.
   *
   * Width of video frames in pixels.
   *
   * Direct mapping to AVCodecParameters->width.
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Video height.
   *
   * Height of video frames in pixels.
   *
   * Direct mapping to AVCodecParameters->height.
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Sample aspect ratio.
   *
   * Pixel aspect ratio for video.
   *
   * Direct mapping to AVCodecParameters->sample_aspect_ratio.
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num, sar.den);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Frame rate.
   *
   * Video frame rate in frames per second.
   *
   * Direct mapping to AVCodecParameters->framerate.
   */
  get frameRate(): Rational {
    const fr = this.native.frameRate;
    return new Rational(fr.num, fr.den);
  }

  set frameRate(value: Rational) {
    this.native.frameRate = { num: value.num, den: value.den };
  }

  /**
   * Color range.
   *
   * MPEG (limited) or JPEG (full) range.
   *
   * Direct mapping to AVCodecParameters->color_range.
   */
  get colorRange(): AVColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: AVColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Color primaries.
   *
   * Chromaticity coordinates of source primaries.
   *
   * Direct mapping to AVCodecParameters->color_primaries.
   */
  get colorPrimaries(): AVColorPrimaries {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: AVColorPrimaries) {
    this.native.colorPrimaries = value;
  }

  /**
   * Color transfer characteristic.
   *
   * Color transfer function (gamma).
   *
   * Direct mapping to AVCodecParameters->color_trc.
   */
  get colorTrc(): AVColorTransferCharacteristic {
    return this.native.colorTrc;
  }

  set colorTrc(value: AVColorTransferCharacteristic) {
    this.native.colorTrc = value;
  }

  /**
   * Color space.
   *
   * YUV colorspace type.
   *
   * Direct mapping to AVCodecParameters->color_space.
   */
  get colorSpace(): AVColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: AVColorSpace) {
    this.native.colorSpace = value;
  }

  /**
   * Chroma sample location.
   *
   * Location of chroma samples.
   *
   * Direct mapping to AVCodecParameters->chroma_location.
   */
  get chromaLocation(): AVChromaLocation {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: AVChromaLocation) {
    this.native.chromaLocation = value;
  }

  /**
   * Audio channel layout.
   *
   * Configuration of audio channels.
   *
   * Direct mapping to AVCodecParameters->ch_layout.
   */
  get channelLayout(): ChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: ChannelLayout) {
    this.native.channelLayout = value;
  }

  /**
   * Number of audio channels.
   *
   * @deprecated Use channelLayout.nbChannels instead
   *
   * Direct mapping to AVCodecParameters->channels.
   */
  get channels(): number {
    return this.native.channels;
  }

  set channels(value: number) {
    this.native.channels = value;
  }

  /**
   * Audio sample rate.
   *
   * Sample rate in Hz.
   *
   * Direct mapping to AVCodecParameters->sample_rate.
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Allocate codec parameters.
   *
   * Allocates memory for the parameters structure.
   *
   * Direct mapping to avcodec_parameters_alloc().
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * const params = new CodecParameters();
   * params.alloc();
   * // Parameters ready for use
   * ```
   *
   * @see {@link free} To deallocate
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free codec parameters.
   *
   * Releases all memory associated with the parameters.
   *
   * Direct mapping to avcodec_parameters_free().
   *
   * @example
   * ```typescript
   * params.free();
   * // Parameters now invalid
   * ```
   *
   * @see {@link alloc} To allocate
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    this.native.free();
  }

  /**
   * Copy parameters to destination.
   *
   * Copies all codec parameters to another instance.
   *
   * Direct mapping to avcodec_parameters_copy().
   *
   * @param dst - Destination parameters
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const dst = new CodecParameters();
   * dst.alloc();
   * const ret = src.copy(dst);
   * FFmpegError.throwIfError(ret, 'copy');
   * ```
   */
  copy(dst: CodecParameters): number {
    return this.native.copy(dst.getNative());
  }

  /**
   * Fill parameters from codec context.
   *
   * Extracts codec parameters from a configured codec context.
   *
   * Direct mapping to avcodec_parameters_from_context().
   *
   * @param codecContext - Source codec context
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Extract parameters from encoder
   * const ret = params.fromContext(encoderContext);
   * FFmpegError.throwIfError(ret, 'fromContext');
   * ```
   *
   * @see {@link toContext} To apply to context
   */
  fromContext(codecContext: CodecContext): number {
    return this.native.fromContext(codecContext.getNative());
  }

  /**
   * Apply parameters to codec context.
   *
   * Configures a codec context with these parameters.
   * Essential for initializing decoders with stream parameters.
   *
   * Direct mapping to avcodec_parameters_to_context().
   *
   * @param codecContext - Destination codec context
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Configure decoder with stream parameters
   * const stream = formatContext.streams[0];
   * const ret = stream.codecpar.toContext(decoderContext);
   * FFmpegError.throwIfError(ret, 'toContext');
   * ```
   *
   * @see {@link fromContext} To extract from context
   */
  toContext(codecContext: CodecContext): number {
    return this.native.toContext(codecContext.getNative());
  }

  /**
   * Convert to JSON representation.
   *
   * Returns all codec parameters as a plain object.
   * Useful for debugging and serialization.
   *
   * @returns Object with all parameter values
   *
   * @example
   * ```typescript
   * const json = params.toJSON();
   * console.log(JSON.stringify(json, null, 2));
   * ```
   */
  toJSON(): Record<string, any> {
    return this.native.toJSON();
  }

  /**
   * Get the underlying native CodecParameters object.
   *
   * @returns The native CodecParameters binding object
   *
   * @internal
   */
  getNative(): NativeCodecParameters {
    return this.native;
  }

  /**
   * Dispose of the codec parameters.
   *
   * Implements the Disposable interface for automatic cleanup.
   *
   * @example
   * ```typescript
   * {
   *   using params = new CodecParameters();
   *   params.alloc();
   *   // Use params...
   * } // Automatically disposed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
