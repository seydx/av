import { bindings } from './binding.js';
import { HardwareFramesContext } from './hardware-frames-context.js';
import { Rational } from './rational.js';

import type {
  AVChromaLocation,
  AVColorPrimaries,
  AVColorRange,
  AVColorSpace,
  AVColorTransferCharacteristic,
  AVPictureType,
  AVPixelFormat,
  AVSampleFormat,
} from './constants.js';
import type { NativeFrame, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * FFmpeg frame for uncompressed audio/video data - Low Level API
 *
 * Direct mapping to FFmpeg's AVFrame.
 * Contains raw audio samples or video pixels after decoding or before encoding.
 * User has full control over allocation and lifecycle.
 *
 * @example
 * ```typescript
 * // Create and allocate frame - full control
 * const frame = new Frame();
 * frame.alloc();
 *
 * // Configure video frame
 * frame.format = AV_PIX_FMT_YUV420P;
 * frame.width = 1920;
 * frame.height = 1080;
 * frame.getBuffer(); // Allocate buffers
 *
 * // Configure audio frame
 * frame.format = AV_SAMPLE_FMT_FLTP;
 * frame.sampleRate = 48000;
 * frame.nbSamples = 1024;
 * frame.channelLayout = { nbChannels: 2, order: 0, mask: 3n };
 * frame.getBuffer(); // Allocate buffers
 *
 * // Receive decoded data
 * const ret = await codecContext.receiveFrame(frame);
 * if (ret >= 0) {
 *   console.log(`Frame PTS: ${frame.pts}`);
 * }
 *
 * // Cleanup
 * frame.unref(); // Clear data but keep frame allocated
 * frame.free();  // Free frame completely
 * ```
 */
export class Frame implements Disposable, NativeWrapper<NativeFrame> {
  private native: NativeFrame;

  // Constructor
  /**
   * Create a new frame.
   *
   * The frame is uninitialized - you must call alloc() before use.
   * Direct wrapper around AVFrame.
   *
   * @example
   * ```typescript
   * const frame = new Frame();
   * frame.alloc();
   * // Frame is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.Frame();
  }

  // Getter/Setter Properties - General

  /**
   * Format of the frame.
   *
   * Direct mapping to AVFrame->format
   *
   * - video: AVPixelFormat (-1 if unknown or unset)
   * - audio: AVSampleFormat (-1 if unknown or unset)
   * Must be set before calling getBuffer() or allocBuffer().
   */
  get format(): AVPixelFormat | AVSampleFormat {
    return this.native.format;
  }

  set format(value: AVPixelFormat | AVSampleFormat) {
    this.native.format = value;
  }

  /**
   * Width of the video frame in pixels.
   *
   * Direct mapping to AVFrame->width
   *
   * - video: MUST be set before calling getBuffer() or allocBuffer()
   * - audio: unused (0)
   */
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  /**
   * Height of the video frame in pixels.
   *
   * Direct mapping to AVFrame->height
   *
   * - video: MUST be set before calling getBuffer() or allocBuffer()
   * - audio: unused (0)
   */
  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  /**
   * Number of audio samples (per channel) described by this frame.
   *
   * Direct mapping to AVFrame->nb_samples
   *
   * - audio: MUST be set before calling getBuffer() or allocBuffer()
   * - video: unused (0)
   */
  get nbSamples(): number {
    return this.native.nbSamples;
  }

  set nbSamples(value: number) {
    this.native.nbSamples = value;
  }

  /**
   * Presentation timestamp in time_base units.
   *
   * Direct mapping to AVFrame->pts
   *
   * Time when frame should be shown to user.
   * Can be AV_NOPTS_VALUE if unknown.
   */
  get pts(): bigint {
    return this.native.pts;
  }

  set pts(value: bigint) {
    this.native.pts = value;
  }

  /**
   * DTS copied from the AVPacket that triggered returning this frame.
   *
   * Direct mapping to AVFrame->pkt_dts
   *
   * If frame threading isn't used, this is also the Presentation time of this AVFrame
   * calculated from only AVPacket.dts values without pts values.
   */
  get pktDts(): bigint {
    return this.native.pktDts;
  }

  set pktDts(value: bigint) {
    this.native.pktDts = value;
  }

  /**
   * Best effort timestamp.
   *
   * Direct mapping to AVFrame->best_effort_timestamp (computed value)
   *
   * Attempts to provide the most accurate timestamp for the frame.
   * Uses pts if available, otherwise falls back to pkt_dts.
   */
  get bestEffortTimestamp(): bigint {
    return this.native.bestEffortTimestamp;
  }

  set bestEffortTimestamp(value: bigint) {
    this.native.bestEffortTimestamp = value;
  }

  /**
   * Time base for pts/dts timestamps.
   *
   * Direct mapping to AVFrame->time_base
   *
   * This is the fundamental unit of time (in seconds) in terms
   * of which frame timestamps are represented.
   */
  get timeBase(): Rational {
    const tb = this.native.timeBase;
    return new Rational(tb.num, tb.den);
  }

  set timeBase(value: Rational) {
    this.native.timeBase = { num: value.num, den: value.den };
  }

  /**
   * Whether this frame is a keyframe.
   *
   * Direct mapping to AVFrame->key_frame
   *
   * 1 -> keyframe, 0 -> not a keyframe.
   * It is set to 1 for all frames in intra-only codecs.
   * - encoding: Set by libavcodec.
   * - decoding: Set by libavcodec.
   */
  get keyFrame(): number {
    return this.native.keyFrame;
  }

  set keyFrame(value: number) {
    this.native.keyFrame = value;
  }

  /**
   * Picture type of the frame.
   *
   * Direct mapping to AVFrame->pict_type
   *
   * AV_PICTURE_TYPE_I for intra frames, AV_PICTURE_TYPE_P for predicted frames,
   * AV_PICTURE_TYPE_B for bi-directionally predicted frames, etc.
   * - encoding: Set by libavcodec. for coded_picture (and set by user for input).
   * - decoding: Set by libavcodec.
   */
  get pictType(): AVPictureType {
    return this.native.pictType;
  }

  set pictType(value: AVPictureType) {
    this.native.pictType = value;
  }

  /**
   * Sample aspect ratio for the video frame.
   *
   * Direct mapping to AVFrame->sample_aspect_ratio
   *
   * 0/1 if unknown/unspecified.
   * This is the aspect ratio of a single pixel (width/height).
   * For anamorphic video, this differs from the display aspect ratio.
   */
  get sampleAspectRatio(): Rational {
    const sar = this.native.sampleAspectRatio;
    return new Rational(sar.num || 0, sar.den || 1);
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = { num: value.num, den: value.den };
  }

  // Getter/Setter Properties - Audio specific

  /**
   * Sample rate of the audio data.
   *
   * Direct mapping to AVFrame->sample_rate
   *
   * In samples per second.
   * - encoding: MUST be set by user.
   * - decoding: MAY be set by libavcodec.
   */
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  /**
   * Channel layout of the audio data.
   *
   * Direct mapping to AVFrame->ch_layout
   *
   * Describes the number and order of audio channels.
   * Must be set before calling getBuffer() for audio frames.
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
   * Direct mapping to AVFrame->channels
   *
   * Derived from channel layout.
   * @readonly
   */
  get channels(): number {
    return this.native.channels;
  }

  // Getter/Setter Properties - Video specific

  /**
   * Line size (stride) for each plane.
   *
   * Direct mapping to AVFrame->linesize
   *
   * For video, the size in bytes of each picture line.
   * For audio, the size in bytes of each plane.
   *
   * For audio, only linesize[0] may be set. For planar audio, each channel
   * plane must be the same size.
   *
   * For video the linesizes should be multiples of the CPUs alignment preference,
   * this is 16 or 32 for modern desktop CPUs.
   * @readonly
   */
  get linesize(): number[] {
    return this.native.linesize;
  }

  /**
   * MPEG vs JPEG YUV color range.
   *
   * Direct mapping to AVFrame->color_range
   *
   * AVCOL_RANGE_MPEG (limited/tv/16-235), AVCOL_RANGE_JPEG (full/pc/0-255)
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
   *
   * Direct mapping to AVFrame->color_primaries
   *
   * AVCOL_PRI_BT709, AVCOL_PRI_BT2020, etc.
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
   *
   * Direct mapping to AVFrame->color_trc
   *
   * AVCOL_TRC_BT709, AVCOL_TRC_SMPTE2084 (PQ), AVCOL_TRC_ARIB_STD_B67 (HLG), etc.
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
   *
   * Direct mapping to AVFrame->colorspace
   *
   * AVCOL_SPC_BT709, AVCOL_SPC_BT2020_NCL, etc.
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
   *
   * Direct mapping to AVFrame->chroma_location
   *
   * AVCHROMA_LOC_LEFT (MPEG-1/2/4, H.264 default), AVCHROMA_LOC_CENTER (MPEG-2), etc.
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
   * Pointers to the data planes/channels.
   *
   * Direct mapping to AVFrame->data
   *
   * For video, this is an array of pointers to picture planes.
   * For packed audio, this is a single pointer to all audio data.
   * For planar audio, each channel has a separate data pointer.
   *
   * AVFrame.data pointers must point to the first element of an AVFrame.buf array.
   * @readonly
   */
  get data(): Buffer[] | null {
    return this.native.data;
  }

  /**
   * Pointers to the data planes/channels for frames with more than 8 channels.
   *
   * Direct mapping to AVFrame->extended_data
   *
   * For audio, if the number of channels is greater than 8, this must be used
   * to access channels beyond the first 8. Otherwise, data[] should be used.
   * @readonly
   */
  get extendedData(): Buffer[] | null {
    return this.native.extendedData;
  }

  /**
   * Check if the frame data is writable.
   *
   * Direct mapping to av_frame_is_writable()
   *
   * A frame is writable if all its underlying buffers are writable and there's
   * only one reference to each buffer. Use makeWritable() to ensure writability.
   * @readonly
   */
  get isWritable(): boolean {
    return this.native.isWritable;
  }

  // Hardware Acceleration

  /**
   * Hardware frames context.
   *
   * Direct mapping to AVFrame->hw_frames_ctx
   *
   * For hwaccel-format frames, this should be a reference to the
   * AVHWFramesContext describing the frame.
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

  // Public Methods - Low Level API

  /**
   * Allocate an AVFrame and set its fields to default values.
   *
   * Direct mapping to av_frame_alloc()
   *
   * @example
   * ```typescript
   * const frame = new Frame();
   * frame.alloc();
   * // Frame structure is now allocated
   * ```
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @note This only allocates the AVFrame itself, not the data buffers.
   *       Those must be allocated through other means such as getBuffer().
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the frame and any dynamically allocated objects in it.
   *
   * Direct mapping to av_frame_free()
   *
   * @example
   * ```typescript
   * frame.free();
   * // frame is now invalid and should not be used
   * ```
   *
   * @note If the frame is reference counted, it will be unreferenced first.
   */
  free(): void {
    this.native.free();
  }

  /**
   * Set up a new reference to the data described by the source frame.
   *
   * Direct mapping to av_frame_ref()
   *
   * @param src - Source frame to reference
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * const ret = frame.ref(sourceFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // frame now references the same data as sourceFrame
   * ```
   *
   * @warning This function does not copy side data.
   * @see unref() - To remove references
   * @see clone() - To create a new frame with same data
   */
  ref(src: Frame): number {
    return this.native.ref(src.getNative());
  }

  /**
   * Unreference all the buffers referenced by frame and reset the frame fields.
   *
   * Direct mapping to av_frame_unref()
   *
   * @example
   * ```typescript
   * frame.unref();
   * // Frame is now empty but still allocated
   * // Can be reused for next decode/encode
   * ```
   *
   * @note The frame remains allocated and can be reused.
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Create a new frame that references the same data as this frame.
   *
   * Direct mapping to av_frame_clone()
   *
   * @returns New frame referencing the same data, or null on error (ENOMEM)
   *
   * @example
   * ```typescript
   * const clonedFrame = frame.clone();
   * if (!clonedFrame) {
   *   throw new Error('Failed to clone frame');
   * }
   * // clonedFrame references the same data as frame
   * ```
   *
   * @see ref() - To reference into existing frame
   */
  clone(): Frame | null {
    const cloned = this.native.clone();
    if (!cloned) {
      return null;
    }

    // Wrap the native cloned frame
    const frame = Object.create(Frame.prototype) as Frame;
    // Need to set private property - this is safe since we control the implementation
    (frame as unknown as { native: NativeFrame }).native = cloned;
    return frame;
  }

  /**
   * Allocate new buffer(s) for audio or video data.
   *
   * Direct mapping to av_frame_get_buffer()
   *
   * @param align - Required buffer size alignment. 0 for automatic.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters (e.g., format not set)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * // Video frame
   * frame.format = AV_PIX_FMT_YUV420P;
   * frame.width = 1920;
   * frame.height = 1080;
   * const ret = frame.getBuffer(0);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @note The following fields must be set before calling:
   *       - format (pixel format for video, sample format for audio)
   *       - width and height for video
   *       - nb_samples and channel_layout for audio
   *
   * @see allocBuffer() - Convenience wrapper
   * @see makeWritable() - Ensure buffer is writable
   */
  getBuffer(align = 0): number {
    return this.native.getBuffer(align);
  }

  /**
   * Allocate buffer(s) for frame according to its parameters.
   *
   * Convenience wrapper for getBuffer() with default alignment.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const ret = frame.allocBuffer();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see getBuffer() - With custom alignment
   */
  allocBuffer(): number {
    return this.native.allocBuffer();
  }

  /**
   * Ensure that the frame data is writable.
   *
   * Direct mapping to av_frame_make_writable()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (frame is now writable)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * if (!frame.isWritable) {
   *   const ret = frame.makeWritable();
   *   if (ret < 0) {
   *     throw new FFmpegError(ret);
   *   }
   * }
   * // Frame data can now be modified
   * ```
   *
   * @note Does nothing if frame is already writable.
   * @see isWritable - Check if writable
   */
  makeWritable(): number {
    return this.native.makeWritable();
  }

  /**
   * Copy only "metadata" fields from src to this frame.
   *
   * Direct mapping to av_frame_copy_props()
   *
   * @param src - Source frame to copy properties from
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const ret = dstFrame.copyProps(srcFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * // dstFrame now has same properties as srcFrame (but not data)
   * ```
   *
   * @note Metadata includes all fields except data/buffers.
   * @note Side data is also copied.
   */
  copyProps(src: Frame): number {
    return this.native.copyProps(src.getNative());
  }

  /**
   * Copy the frame data from src to this frame.
   *
   * Direct mapping to av_frame_copy()
   *
   * @param src - Source frame to copy data from
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success
   *   - AVERROR(EINVAL): Frames have different parameters (format, size, etc.)
   *
   * @example
   * ```typescript
   * // Destination must be allocated with same parameters
   * dstFrame.format = srcFrame.format;
   * dstFrame.width = srcFrame.width;
   * dstFrame.height = srcFrame.height;
   * dstFrame.allocBuffer();
   *
   * const ret = dstFrame.copy(srcFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @note Destination must be pre-allocated with same parameters.
   * @see copyProps() - To copy metadata only
   */
  copy(src: Frame): number {
    return this.native.copy(src.getNative());
  }

  /**
   * Transfer data to or from hardware surfaces.
   *
   * Direct mapping to av_hwframe_transfer_data()
   *
   * @param dst - Destination frame
   * @param flags - Transfer flags (0 for default)
   * @returns 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * // Transfer from hardware to software frame
   * const swFrame = new Frame();
   * swFrame.alloc();
   * const ret = hwFrame.hwframeTransferData(swFrame, 0);
   * if (ret < 0) throw new FFmpegError(ret);
   * ```
   */
  hwframeTransferData(dst: Frame, flags?: number): number {
    return this.native.hwframeTransferData(dst.getNative(), flags ?? 0);
  }

  /**
   * Check if this is a hardware frame.
   *
   * A frame is considered a hardware frame if it has a hw_frames_ctx set.
   *
   * @returns True if this is a hardware frame, false otherwise
   *
   * @example
   * ```typescript
   * if (frame.isHwFrame()) {
   *   console.log('Frame is in GPU memory');
   * } else {
   *   console.log('Frame is in CPU memory');
   * }
   * ```
   */
  isHwFrame(): boolean {
    return this.native.isHwFrame();
  }

  /**
   * Check if this is a software frame.
   *
   * A frame is considered a software frame if it doesn't have hw_frames_ctx
   * but has actual data pointers.
   *
   * @returns True if this is a software frame, false otherwise
   *
   * @example
   * ```typescript
   * if (frame.isSwFrame()) {
   *   console.log('Frame is in CPU memory');
   *   // Safe to access frame.data
   * }
   * ```
   */
  isSwFrame(): boolean {
    return this.native.isSwFrame();
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVFrame pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native frame object
   */
  getNative(): NativeFrame {
    return this.native;
  }

  /**
   * Dispose of the frame.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using frame = new Frame();
   *   frame.alloc();
   *   // ... use frame
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
