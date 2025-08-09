import { AV_ERROR_EAGAIN, AV_ERROR_EOF } from './constants.js';
import { FFmpegError } from './error.js';
import { Options } from './option.js';

import type { Codec } from './codec.js';
import type { AVCodecFlag, AVCodecFlag2, AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { Packet } from './packet.js';
import { Rational } from './rational.js';

import { bindings } from './binding.js';
import type { NativeCodecContext, NativeWrapper } from './native-types.js';

/**
 * Audio channel layout configuration
 */
export interface ChannelLayout {
  /** Number of channels */
  nbChannels: number;
  /** Channel order */
  order: number;
  /** Channel mask */
  mask: bigint;
}

/**
 * FFmpeg codec context for encoding and decoding
 *
 * Represents the state and configuration for an encoder or decoder.
 * Must be initialized with a codec and opened before use.
 *
 * @example
 * ```typescript
 * // Create decoder context
 * const codec = Codec.findDecoder(AV_CODEC_ID_H264);
 * const ctx = new CodecContext(codec);
 * ctx.width = 1920;
 * ctx.height = 1080;
 * ctx.open();
 *
 * // Decode packets
 * ctx.sendPacket(packet);
 * while (ctx.receiveFrame(frame) >= 0) {
 *   // Process frame
 * }
 * ```
 */
export class CodecContext implements Disposable, NativeWrapper<NativeCodecContext> {
  private native: any; // Native codec context binding
  private _options?: Options;

  // ==================== Constructor ====================

  /**
   * Create a new codec context
   * @param codec Optional codec to use for initialization
   */
  constructor(codec?: Codec) {
    if (codec) {
      // Pass the wrapped codec's native binding object (which is itself a wrapped C++ object)
      // The C++ code will unwrap it to get the actual AVCodec*
      this.native = new bindings.CodecContext(codec.getNative());
    } else {
      this.native = new bindings.CodecContext();
    }
  }

  // ==================== Getters/Setters ====================

  /**
   * Get/set codec ID
   */
  get codecID(): AVCodecID {
    return this.native.codecID as AVCodecID;
  }

  set codecID(value: AVCodecID) {
    this.native.codecID = value;
  }

  /**
   * Get/set media type (audio/video/subtitle)
   */
  get mediaType(): AVMediaType {
    return this.native.mediaType as AVMediaType;
  }

  set mediaType(value: AVMediaType) {
    this.native.mediaType = value;
  }

  /**
   * Get/set bit rate
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
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
   * Get/set codec level
   */
  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
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
   * Get/set number of threads for encoding/decoding
   */
  get threadCount(): number {
    return this.native.threadCount;
  }

  set threadCount(value: number) {
    this.native.threadCount = value;
  }

  /**
   * Get/set thread type flags
   */
  get threadType(): number {
    return this.native.threadType;
  }

  set threadType(value: number) {
    this.native.threadType = value;
  }

  /**
   * Codec flags. Use AV_CODEC_FLAG_* constants.
   * Example: ctx.flags |= AV_CODEC_FLAG_COPY_OPAQUE to pass opaque data through codec
   */
  get flags(): AVCodecFlag {
    return this.native.flags as AVCodecFlag;
  }

  set flags(value: AVCodecFlag) {
    this.native.flags = value;
  }

  get flags2(): AVCodecFlag2 {
    return this.native.flags2 as AVCodecFlag2;
  }

  set flags2(value: AVCodecFlag2) {
    this.native.flags2 = value;
  }

  /**
   * Get/set codec-specific extra data
   */
  get extraData(): Buffer | null {
    return this.native.extraData;
  }

  set extraData(value: Buffer | null) {
    this.native.extraData = value;
  }

  /**
   * Get/set hardware device context for hardware acceleration
   */
  get hwDeviceContext(): any {
    return this.native.hwDeviceContext;
  }

  set hwDeviceContext(value: any) {
    // If it's a HardwareDeviceContext wrapper, extract the native object
    if (value && typeof value.getNative === 'function') {
      this.native.hwDeviceContext = value.getNative();
    } else {
      this.native.hwDeviceContext = value;
    }
  }

  /**
   * Get/set hardware frames context for hardware acceleration
   */
  get hwFramesContext(): any {
    return this.native.hwFramesContext;
  }

  set hwFramesContext(value: any) {
    // If it's a HardwareFramesContext wrapper, extract the native object
    if (value && typeof value.getNative === 'function') {
      this.native.hwFramesContext = value.getNative();
    } else {
      this.native.hwFramesContext = value;
    }
  }

  /**
   * Get AVOptions for this codec context
   * Allows runtime configuration of codec parameters
   */
  get options(): Options {
    this._options ??= new Options(this.native.options);
    return this._options;
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
   * Get/set pixel format
   */
  get pixelFormat(): AVPixelFormat {
    return this.native.pixelFormat as AVPixelFormat;
  }

  set pixelFormat(value: AVPixelFormat) {
    this.native.pixelFormat = value;
  }

  /**
   * Get/set framerate
   */
  get framerate(): Rational {
    const r = this.native.framerate;
    return new Rational(r.num, r.den);
  }

  set framerate(value: Rational) {
    this.native.framerate = { num: value.num, den: value.den };
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
   * Get/set GOP (Group of Pictures) size
   */
  get gopSize(): number {
    return this.native.gopSize;
  }

  set gopSize(value: number) {
    this.native.gopSize = value;
  }

  /**
   * Get/set maximum number of B-frames
   */
  get maxBFrames(): number {
    return this.native.maxBFrames;
  }

  set maxBFrames(value: number) {
    this.native.maxBFrames = value;
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
   * Get/set color range
   */
  get colorRange(): number {
    return this.native.colorRange;
  }

  set colorRange(value: number) {
    this.native.colorRange = value;
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
    return this.native.sampleFormat as AVSampleFormat;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.native.sampleFormat = value;
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
   * Get number of audio channels (read-only)
   */
  get channels(): number {
    return this.native.channels;
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
   * Get/set rate control maximum bit rate
   */
  get rcMaxRate(): bigint {
    return this.native.rcMaxRate;
  }

  set rcMaxRate(value: bigint) {
    this.native.rcMaxRate = value;
  }

  /**
   * Get/set rate control minimum bit rate
   */
  get rcMinRate(): bigint {
    return this.native.rcMinRate;
  }

  set rcMinRate(value: bigint) {
    this.native.rcMinRate = value;
  }

  /**
   * Get/set rate control buffer size
   */
  get rcBufferSize(): number {
    return this.native.rcBufferSize;
  }

  set rcBufferSize(value: number) {
    this.native.rcBufferSize = value;
  }

  /**
   * Check if this context is configured as encoder
   */
  get isEncoder(): boolean {
    return this.native.isEncoder;
  }

  /**
   * Check if this context is configured as decoder
   */
  get isDecoder(): boolean {
    return this.native.isDecoder;
  }

  // ==================== Public Methods ====================

  /**
   * Open the codec context for encoding/decoding (synchronous)
   * @param options Optional codec-specific options
   * @throws FFmpegError if opening fails
   */
  open(options?: Record<string, any>): void {
    this.native.open(options);
  }

  /**
   * Open the codec context for encoding/decoding (asynchronous)
   * @param options Optional codec-specific options
   * @returns Promise that resolves when codec is opened
   * @throws FFmpegError if opening fails
   */
  async openAsync(options?: Record<string, any>): Promise<void> {
    await this.native.openAsync(options);
  }

  /**
   * Close the codec context
   */
  close(): void {
    this.native.close();
  }

  /**
   * Flush internal buffers
   */
  flushBuffers(): void {
    this.native.flushBuffers();
  }

  /**
   * Send a packet to the decoder (synchronous)
   * @param packet Packet to decode (null to flush)
   * @returns 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors
   */
  sendPacket(packet: Packet | null): number {
    const ret = this.native.sendPacket(packet?.getNative() ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet');
    }
    return ret;
  }

  /**
   * Send a packet to the decoder (asynchronous)
   * @param packet Packet to decode (null to flush)
   * @returns Promise resolving to 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors
   */
  async sendPacketAsync(packet: Packet | null): Promise<number> {
    const ret = await this.native.sendPacketAsync(packet?.getNative() ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet');
    }
    return ret;
  }

  /**
   * Receive a decoded frame from the decoder (synchronous)
   * @param frame Frame to receive decoded data into
   * @returns 0 on success, AV_ERROR_EAGAIN or AV_ERROR_EOF when no output available
   * @throws FFmpegError on fatal errors
   */
  receiveFrame(frame: Frame): number {
    const ret = this.native.receiveFrame(frame.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive frame');
    }
    return ret;
  }

  /**
   * Receive a decoded frame from the decoder (asynchronous)
   * @param frame Frame to receive decoded data into
   * @returns Promise resolving to 0 on success, AV_ERROR_EAGAIN or AV_ERROR_EOF when no output available
   * @throws FFmpegError on fatal errors
   */
  async receiveFrameAsync(frame: Frame): Promise<number> {
    const ret = await this.native.receiveFrameAsync(frame.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive frame');
    }
    return ret;
  }

  /**
   * Send a frame to the encoder (synchronous)
   * @param frame Frame to encode (null to flush)
   * @returns 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors
   */
  sendFrame(frame: Frame | null): number {
    const ret = this.native.sendFrame(frame?.getNative() ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send frame');
    }
    return ret;
  }

  /**
   * Send a frame to the encoder (asynchronous)
   * @param frame Frame to encode (null to flush)
   * @returns Promise resolving to 0 on success, negative error code on failure
   * @throws FFmpegError on fatal errors
   */
  async sendFrameAsync(frame: Frame | null): Promise<number> {
    const ret = await this.native.sendFrameAsync(frame?.getNative() ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send frame');
    }
    return ret;
  }

  /**
   * Receive an encoded packet from the encoder (synchronous)
   * @param packet Packet to receive encoded data into
   * @returns 0 on success, AV_ERROR_EAGAIN or AV_ERROR_EOF when no output available
   * @throws FFmpegError on fatal errors
   */
  receivePacket(packet: Packet): number {
    const ret = this.native.receivePacket(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive packet');
    }
    return ret;
  }

  /**
   * Receive an encoded packet from the encoder (asynchronous)
   * @param packet Packet to receive encoded data into
   * @returns Promise resolving to 0 on success, AV_ERROR_EAGAIN or AV_ERROR_EOF when no output available
   * @throws FFmpegError on fatal errors
   */
  async receivePacketAsync(packet: Packet): Promise<number> {
    const ret = await this.native.receivePacketAsync(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive packet');
    }
    return ret;
  }

  /**
   * Dispose of the codec context and free resources
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get the native codec context object for use with C++ bindings
   * @internal
   */
  getNative(): any {
    return this.native;
  }
}
