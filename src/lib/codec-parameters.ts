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
  AVProfile,
  AVSampleFormat,
} from './constants.js';
import type { NativeCodecParameters, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Codec parameters for stream configuration.
 *
 * Describes the properties of an encoded media stream.
 * Used to transfer codec parameters between contexts and streams.
 * Contains essential information like codec type, dimensions, and format.
 *
 * Direct mapping to FFmpeg's AVCodecParameters.
 *
 * @example
 * ```typescript
 * import { CodecParameters, FFmpegError } from '@seydx/av';
 * import { AVMEDIA_TYPE_VIDEO, AV_CODEC_ID_H264, AV_PIX_FMT_YUV420P } from '@seydx/av/constants';
 *
 * // Create and allocate codec parameters
 * const params = new CodecParameters();
 * params.alloc();
 *
 * // Copy parameters from a codec context
 * const ret = params.fromContext(codecContext);
 * FFmpegError.throwIfError(ret, 'fromContext');
 *
 * // Set video parameters manually
 * params.codecType = AVMEDIA_TYPE_VIDEO;
 * params.codecId = AV_CODEC_ID_H264;
 * params.width = 1920;
 * params.height = 1080;
 * params.format = AV_PIX_FMT_YUV420P;
 *
 * // Apply parameters to another codec context
 * const ret2 = params.toContext(otherCodecContext);
 * FFmpegError.throwIfError(ret2, 'toContext');
 *
 * // Copy to another parameters struct
 * const params2 = new CodecParameters();
 * params2.alloc();
 * const copyRet = params.copy(params2);
 * FFmpegError.throwIfError(copyRet, 'copy');
 *
 * // Clean up
 * params.free();
 * params2.free();
 * ```
 */
export class CodecParameters implements NativeWrapper<NativeCodecParameters> {
  private native: NativeCodecParameters;

  /**
   * Create new codec parameters.
   *
   * The parameters are uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVCodecParameters.
   *
   * @example
   * ```typescript
   * import { CodecParameters } from '@seydx/av';
   *
   * const params = new CodecParameters();
   * params.alloc();
   * // Parameters are now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.CodecParameters();
  }

  /**
   * General type of the encoded data.
   *
   * Identifies the media type (video, audio, subtitle, etc.).
   *
   * Direct mapping to AVCodecParameters->codec_type
   */
  get codecType(): AVMediaType {
    return this.native.codecType;
  }

  set codecType(value: AVMediaType) {
    this.native.codecType = value;
  }

  /**
   * Specific type of the encoded data.
   *
   * Identifies the exact codec (H.264, AAC, etc.).
   *
   * Direct mapping to AVCodecParameters->codec_id
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
   * Direct mapping to AVCodecParameters->codec_tag
   * Additional information about the codec (corresponds to the AVI FOURCC).
   */
  get codecTag(): number {
    return this.native.codecTag;
  }

  set codecTag(value: number) {
    this.native.codecTag = value;
  }

  /**
   * Extra binary data needed for initializing the decoder.
   *
   * Direct mapping to AVCodecParameters->extradata
   * The allocated memory should be AV_INPUT_BUFFER_PADDING_SIZE bytes larger
   * than extradata_size to avoid problems if it is read with the bitstream reader.
   * The bytewise contents of extradata must not depend on the architecture or CPU endianness.
   * Must be allocated with the av_malloc() family of functions.
   */
  get extradata(): Buffer | null {
    return this.native.extradata;
  }

  set extradata(value: Buffer | null) {
    this.native.extradata = value;
  }

  /**
   * Size of the extradata content in bytes.
   *
   * Direct mapping to AVCodecParameters->extradata_size
   */
  get extradataSize(): number {
    return this.native.extradataSize;
  }

  /**
   * Format of the encoded data.
   * - video: the pixel format (AVPixelFormat)
   * - audio: the sample format (AVSampleFormat)
   */
  get format(): AVPixelFormat | AVSampleFormat {
    return this.native.format;
  }

  set format(value: AVPixelFormat | AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * The average bitrate of the encoded data (in bits per second).
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
  }

  /**
   * Codec-specific bitstream restrictions that the stream conforms to.
   * FF_PROFILE_H264_BASELINE, FF_PROFILE_H264_MAIN, etc.
   */
  get profile(): AVProfile {
    return this.native.profile;
  }

  set profile(value: AVProfile) {
    this.native.profile = value;
  }

  /**
   * Level of the bitstream.
   * FF_LEVEL_UNKNOWN or codec-specific values.
   */
  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
  }

  /**
   * Video frame width in pixels.
   *
   * Direct mapping to AVCodecParameters->width
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Video frame height in pixels.
   *
   * Direct mapping to AVCodecParameters->height
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * The pixel aspect ratio (width / height) which a single pixel should have when displayed.
   *
   * When the aspect ratio is unknown / undefined, the numerator should be set to 0
   * (the denominator may have any value).
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num, sar.den);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Video only. The framerate of the video.
   * This is the fundamental unit of time (in seconds) in terms
   * of which frame timestamps are represented.
   */
  get frameRate(): Rational {
    const fr = this.native.frameRate;
    return new Rational(fr.num, fr.den);
  }

  set frameRate(value: Rational) {
    this.native.frameRate = { num: value.num, den: value.den };
  }

  /**
   * Video only. Additional colorspace characteristics.
   * AVCOL_RANGE_MPEG, AVCOL_RANGE_JPEG, etc.
   */
  get colorRange(): AVColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: AVColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Chromaticity coordinates of the source primaries.
   * AVCOL_PRI_BT709, AVCOL_PRI_BT2020, etc.
   */
  get colorPrimaries(): AVColorPrimaries {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: AVColorPrimaries) {
    this.native.colorPrimaries = value;
  }

  /**
   * Color Transfer Characteristic.
   * AVCOL_TRC_BT709, AVCOL_TRC_SMPTE2084, etc.
   */
  get colorTrc(): AVColorTransferCharacteristic {
    return this.native.colorTrc;
  }

  set colorTrc(value: AVColorTransferCharacteristic) {
    this.native.colorTrc = value;
  }

  /**
   * YUV colorspace type.
   * AVCOL_SPC_BT709, AVCOL_SPC_BT2020_NCL, etc.
   */
  get colorSpace(): AVColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: AVColorSpace) {
    this.native.colorSpace = value;
  }

  /**
   * Location of chroma samples.
   * AVCHROMA_LOC_LEFT, AVCHROMA_LOC_CENTER, etc.
   */
  get chromaLocation(): AVChromaLocation {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: AVChromaLocation) {
    this.native.chromaLocation = value;
  }

  /**
   * Audio channel layout.
   * @deprecated use ch_layout
   */
  get channelLayout(): ChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: ChannelLayout) {
    this.native.channelLayout = value;
  }

  /**
   * Audio only. The number of audio channels.
   * @deprecated use ch_layout.nb_channels
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
   * Direct mapping to AVCodecParameters->sample_rate
   * The number of audio samples per second.
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Allocate a new AVCodecParameters and set its fields to default values.
   *
   * Allocates the parameters structure and initializes with defaults.
   * Must be called before using the parameters.
   *
   * Direct mapping to avcodec_parameters_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { CodecParameters } from '@seydx/av';
   *
   * const params = new CodecParameters();
   * params.alloc();
   * // Parameters are now allocated with default values
   * ```
   *
   * @see {@link free} To free the parameters
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the codec parameters and everything associated with it.
   *
   * Releases all resources associated with the parameters.
   * The parameters become invalid after this call.
   *
   * Direct mapping to avcodec_parameters_free()
   *
   * @example
   * ```typescript
   * params.free();
   * // params is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Copy the contents of this CodecParameters to dst.
   *
   * Copies all parameter values to the destination.
   * Any allocated fields in dst are freed and replaced with newly allocated duplicates.
   *
   * Direct mapping to avcodec_parameters_copy()
   *
   * @param dst - Destination CodecParameters. Must be allocated.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { CodecParameters, FFmpegError } from '@seydx/av';
   *
   * const src = new CodecParameters();
   * src.alloc();
   * // ... set up src parameters ...
   *
   * const dst = new CodecParameters();
   * dst.alloc();
   * const ret = src.copy(dst);
   * FFmpegError.throwIfError(ret, 'copy');
   * ```
   *
   * @see {@link fromContext} To copy from codec context
   * @see {@link toContext} To copy to codec context
   */
  copy(dst: CodecParameters): number {
    return this.native.copy(dst.native);
  }

  /**
   * Fill this parameters struct based on the values from the supplied codec context.
   *
   * Copies codec parameters from a codec context to this parameters struct.
   * Any allocated fields are freed and replaced with duplicates.
   *
   * Direct mapping to avcodec_parameters_from_context()
   *
   * @param codecContext - Source CodecContext to copy from
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid codec context
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * // Copy encoder parameters to stream
   * const ret = outputStream.codecpar.fromContext(encoderContext);
   * FFmpegError.throwIfError(ret, 'fromContext');
   * ```
   *
   * @see {@link toContext} To copy in the opposite direction
   */
  fromContext(codecContext: CodecContext): number {
    return this.native.fromContext(codecContext.getNative());
  }

  /**
   * Fill the codec context based on the values from this codec parameters.
   *
   * Copies parameters from this struct to a codec context.
   * Any allocated fields in the codec context are freed and replaced with duplicates.
   *
   * Direct mapping to avcodec_parameters_to_context()
   *
   * @param codecContext - Destination CodecContext to copy to
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid codec context
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * // Copy stream parameters to decoder
   * const ret = inputStream.codecpar.toContext(decoderContext);
   * FFmpegError.throwIfError(ret, 'toContext');
   * ```
   *
   * @see {@link fromContext} To copy in the opposite direction
   */
  toContext(codecContext: CodecContext): number {
    return this.native.toContext(codecContext.getNative());
  }

  /**
   * Get the native FFmpeg AVCodecParameters pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native codec parameters object
   */
  getNative(): NativeCodecParameters {
    return this.native;
  }

  /**
   * Dispose of the codec parameters.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using params = new CodecParameters();
   *   params.alloc();
   *   // ... use parameters
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
