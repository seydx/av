import { bindings } from './binding.js';
import { HardwareDeviceContext } from './hardware-device-context.js';
import { HardwareFramesContext } from './hardware-frames-context.js';
import { OptionMember } from './option.js';
import { Rational } from './rational.js';

import type {
  AVChromaLocation,
  AVCodecFlag,
  AVCodecFlag2,
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
import type { CodecParameters } from './codec-parameters.js';
import type { Codec } from './codec.js';
import type { Dictionary } from './dictionary.js';
import type { Frame } from './frame.js';
import type { NativeCodecContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';
import type { ChannelLayout } from './types.js';

/**
 * Codec context for encoding and decoding media.
 *
 * Central structure for media encoding and decoding operations.
 * Manages codec state, parameters, and threading.
 * Supports both software and hardware acceleration.
 *
 * Direct mapping to FFmpeg's AVCodecContext.
 *
 * @example
 * ```typescript
 * import { CodecContext, Codec, FFmpegError } from 'node-av';
 * import { AV_CODEC_ID_H264, AV_PIX_FMT_YUV420P } from 'node-av/constants';
 *
 * // Create and configure decoder context
 * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
 * const ctx = new CodecContext();
 * ctx.allocContext3(codec);
 *
 * // Configure parameters
 * ctx.width = 1920;
 * ctx.height = 1080;
 * ctx.pixelFormat = AV_PIX_FMT_YUV420P;
 *
 * // Open codec
 * const ret = await ctx.open2(codec, null);
 * FFmpegError.throwIfError(ret, 'open2');
 *
 * // Decode packets
 * const sendRet = await ctx.sendPacket(packet);
 * FFmpegError.throwIfError(sendRet, 'sendPacket');
 *
 * while (true) {
 *   const ret = await ctx.receiveFrame(frame);
 *   if (ret === AVERROR_EOF || ret === AVERROR(EAGAIN)) break;
 *   FFmpegError.throwIfError(ret, 'receiveFrame');
 *   // Process frame
 * }
 *
 * // Cleanup
 * ctx.freeContext();
 * ```
 */
export class CodecContext extends OptionMember<NativeCodecContext> implements Disposable, NativeWrapper<NativeCodecContext> {
  private _hwDeviceCtx?: HardwareDeviceContext; // Cache for hardware device context wrapper
  private _hwFramesCtx?: HardwareFramesContext; // Cache for hardware frames context wrapper

  /**
   * Create a new codec context.
   *
   * The context is uninitialized - you must call allocContext3() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around AVCodecContext.
   *
   * @example
   * ```typescript
   * import { CodecContext, Codec } from 'node-av';
   *
   * const ctx = new CodecContext();
   * ctx.allocContext3(codec);
   * // Context is now ready for configuration
   * ```
   */
  constructor() {
    super(new bindings.CodecContext());
  }

  /**
   * Codec type.
   *
   * Identifies whether this is a video, audio, subtitle, or data codec.
   *
   * Direct mapping to AVCodecContext->codec_type
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
   * Identifies the specific codec (e.g., AV_CODEC_ID_H264, AV_CODEC_ID_AAC).
   *
   * Direct mapping to AVCodecContext->codec_id
   */
  get codecId(): AVCodecID {
    return this.native.codecId;
  }

  set codecId(value: AVCodecID) {
    this.native.codecId = value;
  }

  /**
   * The average bitrate.
   *
   * Direct mapping to AVCodecContext->bit_rate
   *
   * - encoding: Set by user, unused for constant quantizer encoding.
   * - decoding: Set by user, may be overwritten by libavcodec if this info is available in the stream.
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
  }

  /**
   * Time base for timestamps.
   *
   * The fundamental unit of time (in seconds) for frame timestamps.
   *
   * Direct mapping to AVCodecContext->time_base
   *
   * - encoding: MUST be set by user.
   * - decoding: the use of this field for decoding is deprecated. Use framerate instead.
   */
  get timeBase(): Rational {
    const tb = this.native.timeBase;
    return new Rational(tb.num, tb.den);
  }

  set timeBase(value: Rational) {
    this.native.timeBase = { num: value.num, den: value.den };
  }

  /**
   * Timebase in which pkt_dts/pts and AVPacket.dts/pts are.
   * This is the fundamental unit of time (in seconds) in terms
   * of which frame timestamps are represented.
   */
  get pktTimebase(): Rational {
    const tb = this.native.pktTimebase;
    return new Rational(tb.num, tb.den);
  }

  set pktTimebase(value: Rational) {
    this.native.pktTimebase = { num: value.num, den: value.den };
  }

  /**
   * Codec delay.
   * - encoding: Number of frames delay there will be from the encoder input to
   *             the decoder output. (we assume the decoder matches the spec)
   * - decoding: Number of frames delay in addition to what a standard decoder
   *             as specified in the spec would produce.
   * @readonly
   */
  get delay(): number {
    return this.native.delay;
  }

  /**
   * AV_CODEC_FLAG_* flags.
   * - encoding: Set by user.
   * - decoding: Set by user.
   */
  get flags(): AVCodecFlag {
    return this.native.flags;
  }

  set flags(value: AVCodecFlag) {
    this.native.flags = value;
  }

  /**
   * AV_CODEC_FLAG2_* flags.
   * - encoding: Set by user.
   * - decoding: Set by user.
   */
  get flags2(): AVCodecFlag2 {
    return this.native.flags2;
  }

  set flags2(value: AVCodecFlag2) {
    this.native.flags2 = value;
  }

  /**
   * Some codecs need / can use extradata like Huffman tables.
   * MJPEG: Huffman tables
   * rv10: additional flags
   * MPEG-4: global headers (they can be in the bitstream or here)
   * The allocated memory should be AV_INPUT_BUFFER_PADDING_SIZE bytes larger
   * than extradata_size to avoid problems if it is read with the bitstream reader.
   * The bytewise contents of extradata must not depend on the architecture or CPU endianness.
   * Must be allocated with the av_malloc() family of functions.
   * - encoding: Set/allocated/freed by libavcodec.
   * - decoding: Set/allocated/freed by user.
   */
  get extraData(): Buffer | null {
    return this.native.extraData;
  }

  set extraData(value: Buffer | null) {
    this.native.extraData = value;
  }

  /**
   * Profile (FF_PROFILE_H264_BASELINE, FF_PROFILE_H264_MAIN, etc.)
   * - encoding: Set by user.
   * - decoding: Set by libavcodec.
   */
  get profile(): AVProfile {
    return this.native.profile;
  }

  set profile(value: AVProfile) {
    this.native.profile = value;
  }

  /**
   * Level (FF_LEVEL_UNKNOWN, or codec-specific values)
   * - encoding: Set by user.
   * - decoding: Set by libavcodec.
   */
  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
  }

  /**
   * Thread count.
   * Is used to decide how many independent tasks should be passed to execute().
   * - encoding: Set by user.
   * - decoding: Set by user.
   */
  get threadCount(): number {
    return this.native.threadCount;
  }

  set threadCount(value: number) {
    this.native.threadCount = value;
  }

  /**
   * Picture width.
   * - encoding: MUST be set by user.
   * - decoding: May be set by the user before opening the decoder if known e.g.
   *             from the container. Some decoders will require the dimensions
   *             to be set by the caller. During decoding, the decoder may
   *             overwrite those values as required while parsing the data.
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Picture height.
   * - encoding: MUST be set by user.
   * - decoding: May be set by the user before opening the decoder if known e.g.
   *             from the container. Some decoders will require the dimensions
   *             to be set by the caller. During decoding, the decoder may
   *             overwrite those values as required while parsing the data.
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * The number of pictures in a group of pictures, or 0 for intra_only.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get gopSize(): number {
    return this.native.gopSize;
  }

  set gopSize(value: number) {
    this.native.gopSize = value;
  }

  /**
   * Pixel format.
   * - encoding: Set by user.
   * - decoding: Set by user if known, overridden by libavcodec while
   *             parsing the data.
   */
  get pixelFormat(): AVPixelFormat {
    return this.native.pixelFormat;
  }

  set pixelFormat(value: AVPixelFormat) {
    this.native.pixelFormat = value;
  }

  /**
   * Maximum number of B-frames between non-B-frames.
   * Note: The output will be delayed by max_b_frames+1 relative to the input.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get maxBFrames(): number {
    return this.native.maxBFrames;
  }

  set maxBFrames(value: number) {
    this.native.maxBFrames = value;
  }

  /**
   * Macroblock decision mode.
   *
   * Direct mapping to AVCodecContext->mb_decision
   *
   * - encoding: Set by user.
   * - decoding: unused
   *
   * Values:
   * - 0 (FF_MB_DECISION_SIMPLE): uses mb_cmp
   * - 1 (FF_MB_DECISION_BITS): chooses the one which needs the fewest bits
   * - 2 (FF_MB_DECISION_RD): rate distortion
   */
  get mbDecision(): number {
    return this.native.mbDecision;
  }

  set mbDecision(value: number) {
    this.native.mbDecision = value;
  }

  /**
   * Size of the frame reordering buffer in the decoder.
   * For MPEG-2 it is 1 IPB or 0 low delay IP.
   * - encoding: Set by libavcodec.
   * - decoding: Set by libavcodec.
   * @readonly
   */
  get hasBFrames(): number {
    return this.native.hasBFrames;
  }

  /**
   * Sample aspect ratio (0 if unknown).
   * That is the width of a pixel divided by the height of the pixel.
   * Numerator and denominator must be relatively prime and smaller than 256 for some video standards.
   * - encoding: Set by user.
   * - decoding: Set by libavcodec.
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num || 0, sar.den || 1);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Framerate.
   * - encoding: May be used to signal the framerate of CFR content to an encoder.
   * - decoding: For codecs that store a framerate value in the compressed
   *             bitstream, the decoder may export it here. { 0, 1} when
   *             unknown.
   */
  get framerate(): Rational {
    const fr = this.native.framerate;
    return new Rational(fr.num, fr.den);
  }

  set framerate(value: Rational) {
    this.native.framerate = { num: value.num, den: value.den };
  }

  /**
   * Color range (AVCOL_RANGE_MPEG, AVCOL_RANGE_JPEG, etc.)
   * - encoding: Set by user
   * - decoding: Set by libavcodec
   */
  get colorRange(): AVColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: AVColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Chromaticity coordinates of the source primaries.
   * - encoding: Set by user
   * - decoding: Set by libavcodec
   */
  get colorPrimaries(): AVColorPrimaries {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: AVColorPrimaries) {
    this.native.colorPrimaries = value;
  }

  /**
   * Color Transfer Characteristic.
   * - encoding: Set by user
   * - decoding: Set by libavcodec
   */
  get colorTrc(): AVColorTransferCharacteristic {
    return this.native.colorTrc;
  }

  set colorTrc(value: AVColorTransferCharacteristic) {
    this.native.colorTrc = value;
  }

  /**
   * YUV colorspace type.
   * - encoding: Set by user
   * - decoding: Set by libavcodec
   */
  get colorSpace(): AVColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: AVColorSpace) {
    this.native.colorSpace = value;
  }

  /**
   * Location of chroma samples.
   * - encoding: Set by user
   * - decoding: Set by libavcodec
   */
  get chromaLocation(): AVChromaLocation {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: AVChromaLocation) {
    this.native.chromaLocation = value;
  }

  /**
   * Sample rate of the audio data.
   * - encoding: MUST be set by user.
   * - decoding: May be set by the user before opening the decoder if known e.g.
   *             from the container. The decoder can change this value.
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Number of audio channels.
   * @deprecated use ch_layout.nb_channels
   */
  get channels(): number {
    return this.native.channels;
  }

  set channels(value: number) {
    this.native.channels = value;
  }

  /**
   * Audio sample format.
   * - encoding: Set by user.
   * - decoding: Set by libavcodec.
   */
  get sampleFormat(): AVSampleFormat {
    return this.native.sampleFormat;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.native.sampleFormat = value;
  }

  /**
   * Number of samples per channel in an audio frame.
   * - encoding: Set by libavcodec in avcodec_open2(). Each submitted frame
   *   except the last must contain exactly frame_size samples per channel.
   *   May be 0 when the codec has AV_CODEC_CAP_VARIABLE_FRAME_SIZE set, then the
   *   frame size is not restricted.
   * - decoding: May be set by some decoders to indicate constant frame size.
   */
  get frameSize(): number {
    return this.native.frameSize;
  }

  set frameSize(value: number) {
    this.native.frameSize = value;
  }

  /**
   * Frame counter, set by libavcodec.
   * - decoding: Total number of frames returned from the decoder so far.
   * - encoding: Total number of frames passed to the encoder so far.
   * @readonly
   */
  get frameNumber(): number {
    return this.native.frameNumber;
  }

  /**
   * Audio channel layout.
   * - encoding: Set by user.
   * - decoding: Set by user, may be overwritten by libavcodec.
   * @deprecated use ch_layout
   */
  get channelLayout(): ChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: ChannelLayout) {
    this.native.channelLayout = value;
  }

  /**
   * Minimum quantizer.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get qMin(): number {
    return this.native.qMin;
  }

  set qMin(value: number) {
    this.native.qMin = value;
  }

  /**
   * Maximum quantizer.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get qMax(): number {
    return this.native.qMax;
  }

  set qMax(value: number) {
    this.native.qMax = value;
  }

  /**
   * Decoder bitstream buffer size.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get rcBufferSize(): number {
    return this.native.rcBufferSize;
  }

  set rcBufferSize(value: number) {
    this.native.rcBufferSize = value;
  }

  /**
   * Maximum bitrate.
   * - encoding: Set by user.
   * - decoding: Set by user, may be overwritten by libavcodec.
   */
  get rcMaxRate(): bigint {
    return this.native.rcMaxRate;
  }

  set rcMaxRate(value: bigint) {
    this.native.rcMaxRate = value;
  }

  /**
   * Minimum bitrate.
   * - encoding: Set by user.
   * - decoding: unused
   */
  get rcMinRate(): bigint {
    return this.native.rcMinRate;
  }

  set rcMinRate(value: bigint) {
    this.native.rcMinRate = value;
  }

  // Hardware Acceleration

  /**
   * Hardware device context for hardware acceleration.
   *
   * Direct mapping to AVCodecContext->hw_device_ctx
   *
   * If the codec supports hardware acceleration, this should be set
   * to the hardware device context before opening the codec.
   */
  get hwDeviceCtx(): HardwareDeviceContext | null {
    const native = this.native.hwDeviceCtx;
    if (!native) {
      // Clear cache if native is null
      this._hwDeviceCtx = undefined;
      return null;
    }

    // Return cached wrapper if available and still valid
    if (this._hwDeviceCtx && (this._hwDeviceCtx as any).native === native) {
      return this._hwDeviceCtx;
    }

    // Create and cache new wrapper
    const device = Object.create(HardwareDeviceContext.prototype) as HardwareDeviceContext;
    (device as any).native = native;
    this._hwDeviceCtx = device;
    return device;
  }

  set hwDeviceCtx(value: HardwareDeviceContext | null) {
    this.native.hwDeviceCtx = value?.getNative() ?? null;
    // Clear cache when setting new value
    this._hwDeviceCtx = undefined;
  }

  /**
   * Hardware frames context for hardware acceleration.
   *
   * Direct mapping to AVCodecContext->hw_frames_ctx
   *
   * For decoders, this is an optional field that the decoder can set
   * to provide the caller with hardware frames. For encoders, this
   * must be set by the caller before opening the encoder.
   */
  get hwFramesCtx(): HardwareFramesContext | null {
    const native = this.native.hwFramesCtx;
    if (!native) {
      // Clear cache if native is null
      this._hwFramesCtx = undefined;
      return null;
    }

    // Return cached wrapper if available and still valid
    if (this._hwFramesCtx && (this._hwFramesCtx as any).native === native) {
      return this._hwFramesCtx;
    }

    // Create and cache new wrapper
    const frames = Object.create(HardwareFramesContext.prototype) as HardwareFramesContext;
    (frames as any).native = native;
    this._hwFramesCtx = frames;
    return frames;
  }

  set hwFramesCtx(value: HardwareFramesContext | null) {
    this.native.hwFramesCtx = value?.getNative() ?? null;
    // Clear cache when setting new value
    this._hwFramesCtx = undefined;
  }

  /**
   * Check if the codec context is open.
   *
   * Direct mapping to avcodec_is_open()
   *
   * @returns true if the codec is open and ready for encoding/decoding
   */
  get isOpen(): boolean {
    return this.native.isOpen;
  }

  /**
   * Allocate an AVCodecContext and set its fields to default values.
   *
   * Allocates the codec context and initializes with codec-specific defaults.
   * Must be called before using the context.
   *
   * Direct mapping to avcodec_alloc_context3()
   *
   * @param codec - If non-NULL, allocate private data and initialize defaults
   *                for the given codec. It is illegal to then call open2()
   *                with a different codec.
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { CodecContext, Codec } from 'node-av';
   * import { AV_CODEC_ID_H264 } from 'node-av/constants';
   *
   * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
   * const ctx = new CodecContext();
   * ctx.allocContext3(codec);
   * // Context is now allocated with H264 defaults
   * ```
   *
   * @see {@link open2} To open the codec
   * @see {@link freeContext} To free the context
   */
  allocContext3(codec: Codec | null = null): void {
    this.native.allocContext3(codec?.getNative() ?? null);
  }

  /**
   * Free the codec context and everything associated with it.
   *
   * Releases all resources associated with the codec context.
   * The context becomes invalid after this call.
   *
   * Direct mapping to avcodec_free_context()
   *
   * @example
   * ```typescript
   * ctx.freeContext();
   * // ctx is now invalid and should not be used
   * ```
   */
  freeContext(): void {
    this.native.freeContext();
  }

  /**
   * Initialize the AVCodecContext to use the given AVCodec.
   *
   * Opens the codec and prepares it for encoding or decoding.
   * Prior to using this function the context has to be allocated with allocContext3().
   *
   * Direct mapping to avcodec_open2()
   *
   * @param codec - The codec to open this context for. If a non-NULL codec has been
   *                previously passed to allocContext3() for this context, then this
   *                parameter MUST be either NULL or equal to the previously passed codec.
   * @param options - A dictionary filled with AVCodecContext and codec-private options.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters or codec not found
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other codec-specific errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.open2(codec, null);
   * FFmpegError.throwIfError(ret, 'open2');
   * ```
   *
   * @see {@link close} To close the codec context
   * @see {@link allocContext3} Must be called before open2()
   */
  async open2(codec: Codec | null = null, options: Dictionary | null = null): Promise<number> {
    return await this.native.open2(codec?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Open the codec context synchronously.
   *
   * Direct mapping to avcodec_open2()
   * @param codec - The codec to open the context for (null to use already set codec_id)
   * @param options - Dictionary of codec-specific options (null for defaults)
   * @returns 0 on success, negative AVERROR on error
   * @example
   * ```typescript
   * import { CodecContext, Codec } from 'node-av';
   *
   * const ctx = new CodecContext();
   * const codec = Codec.findEncoder('libx264');
   * ctx.allocContext3(codec);
   *
   * // Configure context
   * ctx.width = 1920;
   * ctx.height = 1080;
   * ctx.timeBase = { num: 1, den: 30 };
   *
   * // Open synchronously (blocks until complete)
   * const ret = ctx.open2Sync(codec, null);
   * if (ret < 0) {
   *   throw new Error(`Failed to open codec: ${ret}`);
   * }
   * ```
   * @see {@link open2} For async version
   * @see {@link allocContext3} Must be called before open2Sync()
   */
  open2Sync(codec: Codec | null = null, options: Dictionary | null = null): number {
    return this.native.open2Sync(codec?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Fill the codec context based on the values from the supplied codec parameters.
   *
   * Direct mapping to avcodec_parameters_to_context()
   *
   * @param params - Codec parameters to copy from
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Copy parameters from stream to codec context
   * const ret = ctx.parametersToContext(stream.codecpar);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see parametersFromContext() - To copy in the opposite direction
   */
  parametersToContext(params: CodecParameters): number {
    return this.native.parametersToContext(params.getNative());
  }

  /**
   * Fill the parameters struct based on the values from the supplied codec context.
   *
   * Direct mapping to avcodec_parameters_from_context()
   *
   * @param params - Codec parameters to fill
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Copy parameters from codec context to stream
   * const ret = ctx.parametersFromContext(outputStream.codecpar);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see parametersToContext() - To copy in the opposite direction
   */
  parametersFromContext(params: CodecParameters): number {
    return this.native.parametersFromContext(params.getNative());
  }

  /**
   * Reset the internal codec state / flush internal buffers.
   * Should be called when seeking or switching to a different stream.
   *
   * Direct mapping to avcodec_flush_buffers()
   *
   * @example
   * ```typescript
   * // Flush buffers when seeking
   * formatContext.seekFrame(streamIndex, timestamp, flags);
   * codecContext.flushBuffers();
   * ```
   */
  flushBuffers(): void {
    this.native.flushBuffers();
  }

  /**
   * Supply raw packet data as input to a decoder.
   *
   * Sends compressed data to the decoder for processing.
   * The decoder may buffer the packet internally.
   *
   * Direct mapping to avcodec_send_packet()
   *
   * @param packet - The input packet. May be NULL to signal end of stream (flush).
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EAGAIN): Input not accepted - must read output with receiveFrame() first
   *   - AVERROR_EOF: Decoder has been flushed, no new packets can be sent
   *   - AVERROR(EINVAL): Codec not opened, is an encoder, or requires flush
   *   - AVERROR(ENOMEM): Failed to add packet to internal queue
   *   - <0: Other legitimate decoding errors
   *
   * @example
   * ```typescript
   * import { FFmpegError, Frame } from 'node-av';
   * import { AVERROR_EAGAIN } from 'node-av/constants';
   *
   * // Decode packet
   * const ret = await decoder.sendPacket(packet);
   * if (ret === AVERROR_EAGAIN) {
   *   // Need to read output first
   *   const frame = new Frame();
   *   frame.alloc();
   *   const recvRet = await decoder.receiveFrame(frame);
   *   FFmpegError.throwIfError(recvRet, 'receiveFrame');
   * } else {
   *   FFmpegError.throwIfError(ret, 'sendPacket');
   * }
   * ```
   *
   * @see {@link receiveFrame} To retrieve decoded frames
   */
  async sendPacket(packet: Packet | null): Promise<number> {
    return await this.native.sendPacket(packet?.getNative() ?? null);
  }

  /**
   * Return decoded output data from a decoder.
   *
   * Retrieves decoded frames from the decoder.
   * The frame must be allocated before calling this function.
   *
   * Direct mapping to avcodec_receive_frame()
   *
   * @param frame - Frame to receive decoded data. Must be allocated.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success, a frame was returned
   *   - AVERROR(EAGAIN): Output not available, must send new input
   *   - AVERROR_EOF: Decoder fully flushed, no more frames
   *   - AVERROR(EINVAL): Codec not opened or is an encoder
   *   - <0: Other legitimate decoding errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   * import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av/constants';
   *
   * // Receive all frames from decoder
   * const frame = new Frame();
   * frame.alloc();
   *
   * while (true) {
   *   const ret = await decoder.receiveFrame(frame);
   *   if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
   *     break;
   *   }
   *   FFmpegError.throwIfError(ret, 'receiveFrame');
   *
   *   // Process frame
   *   processFrame(frame);
   *   frame.unref();
   * }
   * ```
   *
   * @see {@link sendPacket} To send input packets
   */
  async receiveFrame(frame: Frame): Promise<number> {
    return await this.native.receiveFrame(frame.getNative());
  }

  /**
   * Supply a raw video or audio frame to the encoder.
   *
   * Sends uncompressed frame data to the encoder.
   * Use receivePacket() to retrieve buffered output packets.
   *
   * Direct mapping to avcodec_send_frame()
   *
   * @param frame - AVFrame containing the raw audio or video frame to be encoded.
   *                Can be NULL for flush packet (signals end of stream).
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EAGAIN): Input not accepted - must read output with receivePacket()
   *   - AVERROR_EOF: Encoder has been flushed, no new frames can be sent
   *   - AVERROR(EINVAL): Codec not opened, is a decoder, or requires flush
   *   - AVERROR(ENOMEM): Failed to add packet to internal queue
   *   - <0: Other legitimate encoding errors
   *
   * @example
   * ```typescript
   * import { Packet, FFmpegError } from 'node-av';
   * import { AVERROR_EAGAIN } from 'node-av/constants';
   *
   * // Send frame to encoder
   * const ret = await encoder.sendFrame(frame);
   * if (ret === AVERROR_EAGAIN) {
   *   // Need to read output first
   *   const packet = new Packet();
   *   packet.alloc();
   *   const recvRet = await encoder.receivePacket(packet);
   *   FFmpegError.throwIfError(recvRet, 'receivePacket');
   * } else {
   *   FFmpegError.throwIfError(ret, 'sendFrame');
   * }
   * ```
   *
   * @see {@link receivePacket} To retrieve encoded packets
   *
   * @note For audio: If AV_CODEC_CAP_VARIABLE_FRAME_SIZE is set, then each frame
   * can have any number of samples. If not set, frame.nbSamples must equal
   * avctx.frameSize for all frames except the last.
   */
  async sendFrame(frame: Frame | null): Promise<number> {
    return await this.native.sendFrame(frame?.getNative() ?? null);
  }

  /**
   * Read encoded data from the encoder.
   *
   * Retrieves compressed packets from the encoder.
   * The packet must be allocated before calling.
   *
   * Direct mapping to avcodec_receive_packet()
   *
   * @param packet - Packet to receive encoded data. Must be allocated.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success, a packet was returned
   *   - AVERROR(EAGAIN): Output not available, must send new input
   *   - AVERROR_EOF: Encoder fully flushed, no more packets
   *   - AVERROR(EINVAL): Codec not opened or is a decoder
   *   - <0: Other legitimate encoding errors
   *
   * @example
   * ```typescript
   * import { Packet, FFmpegError } from 'node-av';
   * import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av/constants';
   *
   * // Receive all packets from encoder
   * const packet = new Packet();
   * packet.alloc();
   *
   * while (true) {
   *   const ret = await encoder.receivePacket(packet);
   *   if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
   *     break;
   *   }
   *   if (ret < 0) {
   *     throw new FFmpegError(ret);
   *   }
   *   // Write packet to output
   *   await formatContext.writeFrame(packet);
   *   packet.unref();
   * }
   * ```
   *
   * @see sendFrame() - To send input frames
   */
  async receivePacket(packet: Packet): Promise<number> {
    return await this.native.receivePacket(packet.getNative());
  }

  /**
   * Set the hardware pixel format for hardware acceleration.
   *
   * This configures the codec context to prefer a specific hardware pixel format
   * when negotiating formats with FFmpeg. Optionally, a software fallback format
   * can be specified.
   *
   * @param hwFormat - The preferred hardware pixel format (e.g., AV_PIX_FMT_VIDEOTOOLBOX)
   * @param swFormat - Optional software fallback format if hardware format is not available
   *
   * @example
   * ```typescript
   * // For VideoToolbox hardware decoding on macOS
   * codecContext.setHardwarePixelFormat(AV_PIX_FMT_VIDEOTOOLBOX);
   *
   * // With software fallback
   * codecContext.setHardwarePixelFormat(
   *   AV_PIX_FMT_VIDEOTOOLBOX,
   *   AV_PIX_FMT_YUV420P // Fallback to YUV420P if hardware not available
   * );
   * ```
   */
  setHardwarePixelFormat(hwFormat: AVPixelFormat, swFormat?: AVPixelFormat): void {
    this.native.setHardwarePixelFormat(hwFormat, swFormat);
  }

  /**
   * Get the native FFmpeg AVCodecContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native codec context object
   */
  getNative(): NativeCodecContext {
    return this.native;
  }

  /**
   * Dispose of the codec context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling freeContext().
   *
   * @example
   * ```typescript
   * {
   *   using ctx = new CodecContext();
   *   ctx.allocContext3(codec);
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
