import { bindings } from './binding.js';
import { Rational } from './rational.js';

import type { AVCodecCap, AVCodecID, AVHWDeviceType, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { NativeCodec, NativeWrapper } from './native-types.js';
import type { ChannelLayout, CodecProfile } from './types.js';

/**
 * Codec (encoder/decoder) definition.
 *
 * Represents a codec implementation for encoding or decoding media.
 * Provides codec information, capabilities, and supported formats.
 * This is an immutable descriptor - actual encoding/decoding happens via CodecContext.
 *
 * Direct mapping to FFmpeg's AVCodec.
 *
 * @example
 * ```typescript
 * import { Codec } from '@seydx/ffmpeg';
 * import { AV_CODEC_ID_H264 } from '@seydx/ffmpeg/constants';
 *
 * // Find decoder by ID
 * const h264Decoder = Codec.findDecoder(AV_CODEC_ID_H264);
 * if (!h264Decoder) throw new Error('H264 decoder not found');
 *
 * // Find encoder by name
 * const x264Encoder = Codec.findEncoderByName('libx264');
 * if (!x264Encoder) throw new Error('x264 encoder not found');
 *
 * // Check codec capabilities
 * console.log(`Codec: ${h264Decoder.name}`);
 * console.log(`Long name: ${h264Decoder.longName}`);
 * console.log(`Type: ${h264Decoder.type}`);
 * console.log(`Is decoder: ${h264Decoder.isDecoder()}`);
 *
 * // Get supported formats
 * const pixelFormats = h264Decoder.pixelFormats;
 * console.log(`Supported pixel formats: ${pixelFormats}`);
 *
 * // Iterate through all codecs
 * let iter = null;
 * while (true) {
 *   const result = Codec.iterateCodecs(iter);
 *   if (!result) break;
 *   console.log(`Found codec: ${result.codec.name}`);
 *   iter = result.opaque;
 * }
 * ```
 */
export class Codec implements NativeWrapper<NativeCodec> {
  private native: NativeCodec;

  // Constructor
  /**
   * Constructor is internal - use static factory methods.
   *
   * Codecs are global immutable objects managed by FFmpeg.
   * Use the static find methods to obtain codec instances.
   *
   * @internal
   *
   * @param native - Native AVCodec to wrap
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   * import { AV_CODEC_ID_H264 } from '@seydx/ffmpeg/constants';
   *
   * // Don't use constructor directly
   * // const codec = new Codec(); // ❌ Wrong
   *
   * // Use static factory methods instead
   * const decoder = Codec.findDecoder(AV_CODEC_ID_H264); // ✅ Correct
   * const encoder = Codec.findEncoderByName('libx264'); // ✅ Correct
   * ```
   */
  constructor(native: NativeCodec) {
    this.native = native;
  }

  /**
   * Create a Codec instance from a native codec object.
   * @internal Used by the bindings layer
   */
  static fromNative(native: NativeCodec | null): Codec | null {
    if (!native) return null;
    return new Codec(native);
  }

  // Static Methods - Low Level API

  /**
   * Find a registered decoder with a matching codec ID.
   *
   * Searches for a decoder that can decode the specified codec format.
   *
   * Direct mapping to avcodec_find_decoder()
   *
   * @param id - AVCodecID of the requested decoder
   *
   * @returns Codec object or null if no decoder found
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   * import { AV_CODEC_ID_H264 } from '@seydx/ffmpeg/constants';
   *
   * const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
   * if (!decoder) {
   *   throw new Error('H.264 decoder not available');
   * }
   * ```
   *
   * @see {@link findDecoderByName} To find by name
   * @see {@link findEncoder} To find encoder
   */
  static findDecoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findDecoder(id);
    return native ? new Codec(native) : null;
  }

  /**
   * Find a registered decoder with the specified name.
   *
   * Searches for a decoder by its exact name.
   * Useful for selecting specific decoder implementations.
   *
   * Direct mapping to avcodec_find_decoder_by_name()
   *
   * @param name - Name of the requested decoder
   *
   * @returns Codec object or null if no decoder found
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   *
   * const decoder = Codec.findDecoderByName('h264');
   * // Can also use specific implementations:
   * const cudaDecoder = Codec.findDecoderByName('h264_cuvid'); // NVIDIA hardware decoder
   * ```
   *
   * @see {@link findDecoder} To find by codec ID
   */
  static findDecoderByName(name: string): Codec | null {
    const native = bindings.Codec.findDecoderByName(name);
    return native ? new Codec(native) : null;
  }

  /**
   * Find a registered encoder with a matching codec ID.
   *
   * Searches for an encoder that can encode to the specified codec format.
   *
   * Direct mapping to avcodec_find_encoder()
   *
   * @param id - AVCodecID of the requested encoder
   *
   * @returns Codec object or null if no encoder found
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   * import { AV_CODEC_ID_H264 } from '@seydx/ffmpeg/constants';
   *
   * const encoder = Codec.findEncoder(AV_CODEC_ID_H264);
   * if (!encoder) {
   *   throw new Error('H.264 encoder not available');
   * }
   * ```
   *
   * @see {@link findEncoderByName} To find by name
   * @see {@link findDecoder} To find decoder
   */
  static findEncoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findEncoder(id);
    return native ? new Codec(native) : null;
  }

  /**
   * Find a registered encoder with the specified name.
   *
   * Searches for an encoder by its exact name.
   * Useful for selecting specific encoder implementations.
   *
   * Direct mapping to avcodec_find_encoder_by_name()
   *
   * @param name - Name of the requested encoder
   *
   * @returns Codec object or null if no encoder found
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   *
   * // Find specific encoder implementation
   * const x264 = Codec.findEncoderByName('libx264');    // Software H.264 encoder
   * const nvenc = Codec.findEncoderByName('h264_nvenc'); // NVIDIA hardware encoder
   * const vaapi = Codec.findEncoderByName('h264_vaapi'); // VAAPI hardware encoder
   * ```
   *
   * @see {@link findEncoder} To find by codec ID
   */
  static findEncoderByName(name: string): Codec | null {
    const native = bindings.Codec.findEncoderByName(name);
    return native ? new Codec(native) : null;
  }

  /**
   * Get list of all available codecs.
   *
   * Returns all registered codecs in the system.
   * Internally uses av_codec_iterate() to collect all codecs.
   *
   * @returns Array of all registered codecs
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   * import { AVMEDIA_TYPE_VIDEO } from '@seydx/ffmpeg/constants';
   *
   * const codecs = Codec.getCodecList();
   * const videoEncoders = codecs.filter(c =>
   *   c.type === AVMEDIA_TYPE_VIDEO && c.isEncoder()
   * );
   * console.log(`Found ${videoEncoders.length} video encoders`);
   * ```
   *
   * @note This loads all codecs at once. For large codec lists,
   *       consider using iterateCodecs() instead.
   *
   * @see {@link iterateCodecs} For memory-efficient iteration
   */
  static getCodecList(): Codec[] {
    const natives = bindings.Codec.getCodecList();
    return natives.map((n: NativeCodec) => new Codec(n));
  }

  /**
   * Iterate through codecs one by one.
   *
   * Memory-efficient codec iteration.
   * Processes codecs one at a time instead of loading all at once.
   *
   * Direct mapping to av_codec_iterate()
   *
   * @param opaque - Iterator state (null to start, or value from previous call)
   *
   * @returns Object with codec and next iterator state, or null when done
   *
   * @example
   * ```typescript
   * import { Codec } from '@seydx/ffmpeg';
   * import { AVMEDIA_TYPE_VIDEO } from '@seydx/ffmpeg/constants';
   *
   * let opaque = null;
   * while (true) {
   *   const result = Codec.iterateCodecs(opaque);
   *   if (!result) break;
   *
   *   const codec = result.codec;
   *   if (codec.type === AVMEDIA_TYPE_VIDEO && codec.isEncoder()) {
   *     console.log(`Video encoder: ${codec.name}`);
   *   }
   *
   *   opaque = result.opaque;
   * }
   * ```
   *
   * @see {@link getCodecList} To get all codecs at once
   */
  static iterateCodecs(opaque: bigint | null = null): { codec: Codec; opaque: bigint } | null {
    const result = bindings.Codec.iterateCodecs(opaque);
    if (!result) return null;

    return {
      codec: new Codec(result.codec),
      opaque: result.opaque,
    };
  }

  // Getter Properties

  /**
   * Short name of the codec.
   *
   * Direct mapping to AVCodec->name
   * Typically matches the name of the codec specification.
   * For example: "h264", "aac", "vp9", "opus"
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Descriptive name for the codec.
   *
   * Direct mapping to AVCodec->long_name
   * More human-readable than name.
   * For example: "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10"
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * Media type handled by this codec.
   *
   * Direct mapping to AVCodec->type
   * AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_SUBTITLE, etc.
   */
  get type(): AVMediaType {
    return this.native.type;
  }

  /**
   * Codec ID.
   *
   * Direct mapping to AVCodec->id
   * Unique identifier for this codec type (AV_CODEC_ID_H264, AV_CODEC_ID_AAC, etc.)
   */
  get id(): AVCodecID {
    return this.native.id;
  }

  /**
   * Codec capabilities.
   *
   * Direct mapping to AVCodec->capabilities
   * Bitfield of AV_CODEC_CAP_* flags describing codec features.
   */
  get capabilities(): AVCodecCap {
    return this.native.capabilities;
  }

  /**
   * Maximum lowres value supported by the decoder.
   *
   * Lowres decoding allows decoding at reduced resolution for faster preview.
   * 0 means lowres decoding is not supported.
   * 1 means 1/2 resolution is supported.
   * 2 means 1/4 resolution is supported.
   * 3 means 1/8 resolution is supported.
   * @readonly
   */
  get maxLowres(): number {
    return this.native.maxLowres;
  }

  /**
   * Array of supported codec profiles.
   *
   * Profiles define subsets of codec features.
   * For example, H.264 has Baseline, Main, High profiles.
   * null if codec doesn't support profiles or none are defined.
   * @readonly
   */
  get profiles(): CodecProfile[] | null {
    return this.native.profiles;
  }

  /**
   * Group name of the codec implementation.
   *
   * This is a short symbolic name of the wrapper backing this codec.
   * For example "lavc" for internal codecs, "libopenh264" for OpenH264 wrapper.
   * null if codec is not wrapped.
   * @readonly
   */
  get wrapper(): string | null {
    return this.native.wrapper;
  }

  /**
   * Supported framerates (video only).
   *
   * Terminated by {0,0}. null if any framerate is supported.
   * Some codecs like MPEG-1/2 only support specific framerates.
   * @readonly
   */
  get supportedFramerates(): Rational[] | null {
    const rates = this.native.supportedFramerates;
    if (!rates) return null;
    return rates.map((r) => new Rational(r.num, r.den));
  }

  /**
   * Array of supported pixel formats (video only).
   *
   * Terminated by AV_PIX_FMT_NONE. null if unknown.
   * Lists all pixel formats this codec can encode/decode.
   * @readonly
   */
  get pixelFormats(): AVPixelFormat[] | null {
    return this.native.pixelFormats;
  }

  /**
   * Supported sample rates (audio only).
   *
   * Terminated by 0. null if any sample rate is supported.
   * Common rates: 8000, 16000, 22050, 44100, 48000, 96000, 192000 Hz.
   * @readonly
   */
  get supportedSamplerates(): number[] | null {
    return this.native.supportedSamplerates;
  }

  /**
   * Array of supported sample formats (audio only).
   *
   * Terminated by AV_SAMPLE_FMT_NONE. null if unknown.
   * Lists all sample formats this codec can encode/decode.
   * Common formats: S16, S32, FLT, DBL (planar and interleaved variants).
   * @readonly
   */
  get sampleFormats(): AVSampleFormat[] | null {
    return this.native.sampleFormats;
  }

  /**
   * Array of supported channel layouts (audio only).
   *
   * Lists all channel configurations this codec supports.
   * Common layouts: mono, stereo, 5.1, 7.1.
   * null if unknown or all layouts are supported.
   * @readonly
   */
  get channelLayouts(): ChannelLayout[] | null {
    return this.native.channelLayouts;
  }

  // Public Methods

  /**
   * Check if the codec is an encoder.
   *
   * Direct mapping to av_codec_is_encoder()
   *
   * @returns true if the codec is an encoder, false otherwise
   *
   * @example
   * ```typescript
   * const codec = Codec.findEncoderByName('libx264');
   * if (codec && codec.isEncoder()) {
   *   console.log('Found H.264 encoder');
   * }
   * ```
   */
  isEncoder(): boolean {
    return this.native.isEncoder();
  }

  /**
   * Check if the codec is a decoder.
   *
   * Direct mapping to av_codec_is_decoder()
   *
   * @returns true if the codec is a decoder, false otherwise
   *
   * @example
   * ```typescript
   * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
   * if (codec && codec.isDecoder()) {
   *   console.log('Found H.264 decoder');
   * }
   * ```
   */
  isDecoder(): boolean {
    return this.native.isDecoder();
  }

  /**
   * Check if the codec is experimental.
   *
   * Experimental codecs require explicit allowance to use.
   * You must set strict_std_compliance to FF_COMPLIANCE_EXPERIMENTAL
   * or lower in the codec context to use experimental codecs.
   *
   * @returns true if the codec is experimental, false otherwise
   *
   * @example
   * ```typescript
   * const codec = Codec.findEncoderByName('some_experimental_codec');
   * if (codec && codec.isExperimental()) {
   *   console.warn('This codec is experimental and may not be stable');
   *   // codecContext.strict_std_compliance = FF_COMPLIANCE_EXPERIMENTAL;
   * }
   * ```
   */
  isExperimental(): boolean {
    return this.native.isExperimental();
  }

  /**
   * Get hardware configuration at specified index.
   *
   * Direct mapping to avcodec_get_hw_config()
   *
   * @param index - Configuration index (0-based)
   * @returns Hardware configuration or null if not available
   *
   * @example
   * ```typescript
   * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
   * for (let i = 0; ; i++) {
   *   const config = codec.getHwConfig(i);
   *   if (!config) break;
   *
   *   if (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) {
   *     console.log(`Supports device type: ${config.deviceType}`);
   *   }
   * }
   * ```
   */
  getHwConfig(index: number): {
    pixFmt: AVPixelFormat;
    methods: number;
    deviceType: AVHWDeviceType;
  } | null {
    return this.native.getHwConfig(index);
  }

  // Internal Methods

  /**
   * Get the native codec object for use with C++ bindings
   * @internal
   */
  getNative(): NativeCodec {
    return this.native;
  }
}
