import { bindings } from './binding.js';
import { AV_OPT_SEARCH_CHILDREN } from './constants.js';
import { HardwareDeviceContext } from './hardware-device-context.js';
import { HardwareFramesContext } from './hardware-frames-context.js';
import { Rational } from './rational.js';

import type { CodecParameters } from './codec-parameters.js';
import type { Codec } from './codec.js';
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
  AVOptionSearchFlags,
  AVPixelFormat,
  AVProfile,
  AVSampleFormat,
} from './constants.js';
import type { Dictionary } from './dictionary.js';
import type { Frame } from './frame.js';
import type { NativeCodecContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';
import type { ChannelLayout } from './types.js';

/**
 * FFmpeg codec context for encoding and decoding - Low Level API
 *
 * Direct mapping to FFmpeg's AVCodecContext.
 * User has full control over allocation, configuration and lifecycle.
 *
 * @example
 * ```typescript
 * // Create and configure decoder context - full control
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
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Decode packets
 * await ctx.sendPacket(packet);
 * while (true) {
 *   const ret = await ctx.receiveFrame(frame);
 *   if (ret < 0) break;
 *   // Process frame
 * }
 *
 * // Cleanup
 * ctx.freeContext();
 * ```
 */
export class CodecContext implements Disposable, NativeWrapper<NativeCodecContext> {
  private native: NativeCodecContext;

  // Constructor
  /**
   * Create a new codec context.
   *
   * The context is uninitialized - you must call allocContext3() before use.
   * Direct wrapper around AVCodecContext.
   *
   * @example
   * ```typescript
   * const ctx = new CodecContext();
   * ctx.allocContext3(codec);
   * // Context is now ready for configuration
   * ```
   */
  constructor() {
    this.native = new bindings.CodecContext();
  }

  // Getter/Setter - General

  /**
   * Codec type.
   *
   * Direct mapping to AVCodecContext->codec_type
   * Identifies whether this is a video, audio, subtitle, or data codec.
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
   * Direct mapping to AVCodecContext->codec_id
   * Identifies the specific codec (e.g., AV_CODEC_ID_H264, AV_CODEC_ID_AAC).
   */
  get codecId(): AVCodecID {
    return this.native.codecId;
  }

  set codecId(value: AVCodecID) {
    this.native.codecId = value;
  }

  /**
   * The average bitrate.
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
   * This is the fundamental unit of time (in seconds) in terms
   * of which frame timestamps are represented. For fixed-fps content,
   * timebase should be 1/framerate and timestamp increments should be
   * identically 1.
   * - encoding: MUST be set by user.
   * - decoding: the use of this field for decoding is deprecated.
   *             Use framerate instead.
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

  // Getter/Setter - Video

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

  // Getter/Setter - Audio

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

  // Getter/Setter - Encoding

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
      return null;
    }
    // Wrap the native device context
    const device = Object.create(HardwareDeviceContext.prototype) as HardwareDeviceContext;
    (device as any).native = native;
    return device;
  }

  set hwDeviceCtx(value: HardwareDeviceContext | null) {
    this.native.hwDeviceCtx = value?.getNative() ?? null;
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
      return null;
    }
    // Wrap the native frames context
    const frames = Object.create(HardwareFramesContext.prototype) as HardwareFramesContext;
    (frames as any).native = native;
    return frames;
  }

  set hwFramesCtx(value: HardwareFramesContext | null) {
    this.native.hwFramesCtx = value?.getNative() ?? null;
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

  // Public Methods - Low Level API

  /**
   * Allocate an AVCodecContext and set its fields to default values.
   *
   * Direct mapping to avcodec_alloc_context3()
   *
   * @param codec - If non-NULL, allocate private data and initialize defaults
   *                for the given codec. It is illegal to then call open2()
   *                with a different codec.
   *
   * @example
   * ```typescript
   * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
   * const ctx = new CodecContext();
   * ctx.allocContext3(codec);
   * // Context is now allocated with H264 defaults
   * ```
   *
   * @throws Error if allocation fails
   */
  allocContext3(codec?: Codec | null): void {
    this.native.allocContext3(codec?.getNative() ?? null);
  }

  /**
   * Free the codec context and everything associated with it.
   *
   * Direct mapping to avcodec_free_context()
   * After calling this, the context is no longer usable.
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
   * Set an option on the codec context.
   *
   * Direct mapping to av_opt_set()
   * Used to configure codec-specific parameters.
   *
   * @param name - Option name
   * @param value - Option value
   * @param searchFlags - Search flags (default: AV_OPT_SEARCH_CHILDREN)
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Set H.264 preset
   * ctx.setOpt('preset', 'slow');
   * // Set CRF value
   * ctx.setOpt('crf', '23');
   * ```
   *
   * @example
   * ```typescript
   * // With specific search flags
   * import { AV_OPT_SEARCH_CHILDREN, AV_OPT_SEARCH_FAKE_OBJ } from '../constants.js';
   * ctx.setOpt('key', 'value', AV_OPT_SEARCH_CHILDREN | AV_OPT_SEARCH_FAKE_OBJ);
   * ```
   */
  setOpt(name: string, value: string, searchFlags: AVOptionSearchFlags = AV_OPT_SEARCH_CHILDREN): number {
    return this.native.setOpt(name, value, searchFlags);
  }

  /**
   * Initialize the AVCodecContext to use the given AVCodec.
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
   * const ret = await ctx.open2(codec, null);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see close() - To close the codec context
   * @see allocContext3() - Must be called before open2()
   */
  async open2(codec?: Codec | null, options?: Dictionary | null): Promise<number> {
    return await this.native.open2(codec?.getNative() ?? null, options?.getNative() ?? null);
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
   * Internally, this function does not copy the data from the packet. It may reference
   * the packet for later use. The packet must not be modified until it is unreferenced.
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
   * // Decode packet
   * const ret = await decoder.sendPacket(packet);
   * if (ret === AVERROR_EAGAIN) {
   *   // Need to read output first
   *   const frame = new Frame();
   *   frame.alloc();
   *   await decoder.receiveFrame(frame);
   * } else if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see receiveFrame() - To retrieve decoded frames
   */
  async sendPacket(packet: Packet | null): Promise<number> {
    return await this.native.sendPacket(packet?.getNative() ?? null);
  }

  /**
   * Return decoded output data from a decoder.
   *
   * The frame must be allocated before calling this function.
   * The function will overwrite all frame properties.
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
   * // Receive all frames from decoder
   * const frame = new Frame();
   * frame.alloc();
   *
   * while (true) {
   *   const ret = await decoder.receiveFrame(frame);
   *   if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
   *     break;
   *   }
   *   if (ret < 0) {
   *     throw new FFmpegError(ret);
   *   }
   *   // Process frame
   *   processFrame(frame);
   *   frame.unref();
   * }
   * ```
   *
   * @see sendPacket() - To send input packets
   */
  async receiveFrame(frame: Frame): Promise<number> {
    return await this.native.receiveFrame(frame.getNative());
  }

  /**
   * Supply a raw video or audio frame to the encoder.
   * Use receivePacket() to retrieve buffered output packets.
   *
   * Direct mapping to avcodec_send_frame()
   *
   * @param frame - AVFrame containing the raw audio or video frame to be encoded.
   *                Ownership of the frame remains with the caller, and the encoder
   *                will not write to the frame. The encoder may create a reference
   *                to the frame data (or copy it if the frame is not reference-counted).
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
   * // Send frame to encoder
   * const ret = await encoder.sendFrame(frame);
   * if (ret === AVERROR_EAGAIN) {
   *   // Need to read output first
   *   const packet = new Packet();
   *   packet.alloc();
   *   await encoder.receivePacket(packet);
   * } else if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see receivePacket() - To retrieve encoded packets
   *
   * For audio: If AV_CODEC_CAP_VARIABLE_FRAME_SIZE is set, then each frame
   * can have any number of samples. If not set, frame.nbSamples must equal
   * avctx.frameSize for all frames except the last.
   */
  async sendFrame(frame: Frame | null): Promise<number> {
    return await this.native.sendFrame(frame?.getNative() ?? null);
  }

  /**
   * Read encoded data from the encoder.
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

  // Internal Methods

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
