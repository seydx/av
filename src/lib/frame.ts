import { bindings } from './binding.js';
import { FFmpegError } from './error.js';
import { Rational } from './rational.js';

import type { AVColorRange, AVColorSpace, AVPictureType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { NativeFrame, NativeHardwareFramesContext, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

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
 * AVFrame wrapper - represents decoded/raw audio or video data
 *
 * Frames store uncompressed audio/video data after decoding or before encoding.
 * They contain the actual pixel data for video or sample data for audio,
 * along with metadata like timestamps and format information.
 *
 * @example
 * ```typescript
 * // Create a frame for decoding
 * const frame = new Frame();
 *
 * // Receive decoded frame from codec
 * if (codecContext.receiveFrame(frame) >= 0) {
 *   console.log(`Got ${frame.isVideo ? 'video' : 'audio'} frame`);
 *   console.log(`PTS: ${frame.pts}`);
 *
 *   if (frame.isVideo) {
 *     console.log(`Resolution: ${frame.width}x${frame.height}`);
 *   } else {
 *     console.log(`Samples: ${frame.nbSamples}`);
 *   }
 * }
 * ```
 */
export class Frame implements Disposable, NativeWrapper<NativeFrame> {
  private native: NativeFrame; // Native frame binding

  /**
   * Create a new frame
   * @throws Error if frame allocation fails
   */
  constructor() {
    this.native = new bindings.Frame();
  }

  /**
   * Create a frame from a native binding
   * @internal
   */
  static fromNative(native: NativeFrame): Frame {
    const frame = Object.create(Frame.prototype) as Frame;
    Object.defineProperty(frame, 'native', {
      value: native,
      writable: false,
      configurable: false,
    });
    return frame;
  }

  /**
   * Get/set presentation timestamp (PTS)
   */
  get pts(): bigint {
    return this.native.pts;
  }

  set pts(value: bigint) {
    this.native.pts = value;
  }

  /**
   * Get/set packet decompression timestamp (DTS)
   */
  get pktDts(): bigint {
    return this.native.pktDts;
  }

  set pktDts(value: bigint) {
    this.native.pktDts = value;
  }

  /**
   * Get best effort timestamp (read-only)
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
   * Get/set packet duration
   */
  get pktDuration(): bigint {
    return this.native.pktDuration;
  }

  set pktDuration(value: bigint) {
    this.native.pktDuration = value;
  }

  /**
   * Get/set whether this is a keyframe
   */
  get keyFrame(): boolean {
    return this.native.keyFrame;
  }

  set keyFrame(value: boolean) {
    this.native.keyFrame = value;
  }

  /**
   * Get/set picture type (I, P, B frame)
   */
  get pictType(): AVPictureType {
    return this.native.pictType;
  }

  set pictType(value: AVPictureType) {
    this.native.pictType = value;
  }

  /**
   * Quality factor (0 = worst, higher = better)
   * Used by encoders to determine compression quality
   */
  get quality(): number {
    return this.native.quality;
  }

  set quality(value: number) {
    this.native.quality = value;
  }

  /**
   * Get/set video frame width in pixels
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Get/set video frame height in pixels
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Get/set pixel format (video) or sample format (audio)
   */
  get format(): AVPixelFormat | AVSampleFormat {
    return this.native.format;
  }

  set format(value: AVPixelFormat | AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Get/set sample aspect ratio (video only)
   */
  get sampleAspectRatio(): Rational {
    const r = this.native.sampleAspectRatio;
    return new Rational(r.num, r.den);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  /**
   * Get/set color range (video only)
   */
  get colorRange(): AVColorRange {
    return this.native.colorRange;
  }

  set colorRange(value: AVColorRange) {
    this.native.colorRange = value;
  }

  /**
   * Get/set color space (video only)
   */
  get colorSpace(): AVColorSpace {
    return this.native.colorSpace;
  }

  set colorSpace(value: AVColorSpace) {
    this.native.colorSpace = value;
  }

  /**
   * Get/set number of audio samples per channel
   */
  get nbSamples(): number {
    return this.native.nbSamples;
  }

  set nbSamples(value: number) {
    this.native.nbSamples = value;
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
   * Get/set audio channel layout configuration
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
    return this.native.channelLayout.nbChannels;
  }

  /**
   * Get frame data planes (read-only)
   * @returns Buffer array containing data for each plane
   */
  get data(): (Buffer | null)[] {
    return this.native.data;
  }

  /**
   * Get line sizes for each plane (read-only)
   * @returns Array of line sizes in bytes
   */
  get linesize(): number[] {
    return this.native.linesize;
  }

  /**
   * Check if this is a video frame (read-only)
   */
  get isVideo(): boolean {
    return this.width > 0 && this.height > 0;
  }

  /**
   * Check if this is an audio frame (read-only)
   */
  get isAudio(): boolean {
    return this.nbSamples > 0 && this.sampleRate > 0;
  }

  /**
   * Get total size of frame data in bytes
   * @returns Size in bytes
   */
  get dataSize(): number {
    return this.native.getDataSize();
  }

  /**
   * Get format as pixel format (for video frames)
   * @returns Pixel format or undefined if audio frame
   */
  get pixelFormat(): AVPixelFormat | undefined {
    // Video frames have width and height
    if (this.width > 0 && this.height > 0) {
      return this.format as AVPixelFormat;
    }
    return undefined;
  }

  /**
   * Get format as sample format (for audio frames)
   * @returns Sample format or undefined if video frame
   */
  get sampleFormat(): AVSampleFormat | undefined {
    // Audio frames have samples
    if (this.nbSamples > 0) {
      return this.format as AVSampleFormat;
    }
    return undefined;
  }

  /**
   * Get hardware frames context
   * @returns Hardware frames context or undefined
   */
  get hwFramesContext(): NativeHardwareFramesContext | null {
    return this.native.hwFramesContext;
  }

  /**
   * Set hardware frames context
   * @param value Hardware frames context
   */
  set hwFramesContext(value: NativeHardwareFramesContext | null) {
    this.native.hwFramesContext = value;
  }

  /**
   * Allocate buffer for frame data
   * @param align Alignment for buffer allocation (default: 0)
   * @throws FFmpegError if buffer allocation fails
   * @example
   * ```typescript
   * frame.width = 1920;
   * frame.height = 1080;
   * frame.format = AV_PIX_FMT_YUV420P;
   * frame.allocBuffer();
   * ```
   */
  allocBuffer(align = 0): void {
    try {
      this.native.allocBuffer(align);
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Create a copy of this frame
   * @returns A new Frame with copied data
   * @throws Error if frame cloning fails
   * @example
   * ```typescript
   * const copy = frame.clone();
   * // Modify copy without affecting original
   * copy.pts = frame.pts + 1000n;
   * ```
   */
  clone(): Frame {
    return Frame.fromNative(this.native.clone());
  }

  /**
   * Make frame data writable
   * Ensures the frame owns its data and can be modified
   * @throws FFmpegError if making frame writable fails
   */
  makeWritable(): void {
    try {
      this.native.makeWritable();
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Get frame data as single buffer (first plane only)
   * @returns Buffer containing frame data or null if no data
   */
  getBuffer(): Buffer | null {
    return this.native.getBuffer();
  }

  /**
   * Check if frame is writable
   * @returns true if frame data can be modified
   */
  isWritable(): boolean {
    return this.native.isWritable();
  }

  /**
   * Get all frame data as a single buffer
   * @param align Alignment (default: 1)
   * @returns Buffer containing all frame data or null
   */
  getBytes(align = 1): Buffer | null {
    return this.native.getBytes(align);
  }

  /**
   * Set frame data from buffer
   * @param buffer Source buffer
   * @param align Alignment (default: 1)
   * @throws TypeError if buffer is not provided
   * @throws Error if frame is not initialized or making frame writable fails
   */
  setBytes(buffer: Buffer, align = 1): void {
    this.native.setBytes(buffer, align);
  }

  /**
   * Transfer frame data to another frame (typically GPU to CPU)
   * @param dst Destination frame to transfer data to
   * @returns 0 on success, negative error code on failure
   * @throws TypeError if destination frame is invalid
   * @example
   * ```typescript
   * const cpuFrame = new Frame();
   * const ret = gpuFrame.transferDataTo(cpuFrame);
   * if (ret === 0) {
   *   // cpuFrame now contains the data from gpuFrame
   * }
   * ```
   */
  transferDataTo(dst: Frame): void {
    return this.native.transferDataTo(dst.native);
  }

  /**
   * Transfer frame data from another frame (typically CPU to GPU)
   * @param src Source frame to transfer data from
   * @returns 0 on success, negative error code on failure
   * @throws TypeError if source frame is invalid
   * @example
   * ```typescript
   * const gpuFrame = new Frame();
   * const ret = gpuFrame.transferDataFrom(cpuFrame);
   * if (ret === 0) {
   *   // gpuFrame now contains the data from cpuFrame
   * }
   * ```
   */
  transferDataFrom(src: Frame): void {
    return this.native.transferDataFrom(src.native);
  }

  /**
   * Clear frame data but keep structure for reuse
   * Use this when you want to reuse the frame object
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Free the frame and release all resources
   * Use this when you're done with the frame completely
   */
  free(): void {
    this.native.free();
  }

  /**
   * Dispose of the frame and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native frame for internal use
   * @internal
   */
  getNative(): NativeFrame {
    return this.native;
  }
}
