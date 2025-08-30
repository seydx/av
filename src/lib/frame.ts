import { bindings } from './binding.js';
import { HardwareFramesContext } from './hardware-frames-context.js';
import { Rational } from './rational.js';

import type {
  AVChromaLocation,
  AVColorPrimaries,
  AVColorRange,
  AVColorSpace,
  AVColorTransferCharacteristic,
  AVFrameSideDataType,
  AVPictureType,
  AVPixelFormat,
  AVSampleFormat,
} from './constants.js';
import type { NativeFrame, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Frame for uncompressed audio/video data.
 *
 * Contains raw audio samples or video pixels after decoding or before encoding.
 * Provides full control over allocation, configuration and lifecycle.
 * Supports both planar and packed data layouts for audio and video.
 *
 * Direct mapping to FFmpeg's AVFrame.
 *
 * @example
 * ```typescript
 * import { Frame, FFmpegError } from 'node-av';
 * import { AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * // Create and allocate frame - full control
 * const frame = new Frame();
 * frame.alloc();
 *
 * // Configure video frame
 * frame.format = AV_PIX_FMT_YUV420P;
 * frame.width = 1920;
 * frame.height = 1080;
 * const videoRet = frame.getBuffer(); // Allocate buffers
 * FFmpegError.throwIfError(videoRet, 'getBuffer');
 *
 * // Configure audio frame
 * const audioFrame = new Frame();
 * audioFrame.alloc();
 * audioFrame.format = AV_SAMPLE_FMT_FLTP;
 * audioFrame.sampleRate = 48000;
 * audioFrame.nbSamples = 1024;
 * audioFrame.channelLayout = { nbChannels: 2, order: 0, mask: 3n };
 * const audioRet = audioFrame.getBuffer(); // Allocate buffers
 * FFmpegError.throwIfError(audioRet, 'getBuffer');
 *
 * // Receive decoded data
 * const ret = await codecContext.receiveFrame(frame);
 * FFmpegError.throwIfError(ret, 'receiveFrame');
 * console.log(`Frame PTS: ${frame.pts}`);
 *
 * // Cleanup
 * frame.unref(); // Clear data but keep frame allocated
 * frame.free();  // Free frame completely
 * ```
 *
 * @see {@link CodecContext} For encoding/decoding frames
 * @see {@link FilterContext} For filtering frames
 */
export class Frame implements Disposable, NativeWrapper<NativeFrame> {
  private native: NativeFrame;
  private _hwFramesCtx?: HardwareFramesContext | null; // Cache for hardware frames context wrapper

  /**
   * Create a new frame.
   *
   * The frame is uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVFrame.
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * const frame = new Frame();
   * frame.alloc();
   * // Frame is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.Frame();
  }

  /**
   * Format of the frame.
   *
   * For video: AVPixelFormat (-1 if unknown or unset).
   * For audio: AVSampleFormat (-1 if unknown or unset).
   *
   * Direct mapping to AVFrame->format
   *
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
   * For video: MUST be set before calling getBuffer() or allocBuffer().
   * For audio: unused (0).
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
   * For video: MUST be set before calling getBuffer() or allocBuffer().
   * For audio: unused (0).
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
   * For audio: MUST be set before calling getBuffer() or allocBuffer().
   * For video: unused (0).
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
   * Time when frame should be shown to user.
   *
   * Direct mapping to AVFrame->pts
   *
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
   * If frame threading isn't used, this is also the presentation time
   * calculated from only AVPacket.dts values without pts values.
   *
   * Direct mapping to AVFrame->pkt_dts
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
    // Return cached wrapper if we already have one
    if (this._hwFramesCtx !== undefined) {
      return this._hwFramesCtx;
    }

    const native = this.native.hwFramesCtx;
    if (!native) {
      this._hwFramesCtx = null;
      return null;
    }

    // Create and cache the wrapper
    const frames = Object.create(HardwareFramesContext.prototype) as HardwareFramesContext;
    (frames as any).native = native;
    this._hwFramesCtx = frames;
    return frames;
  }

  set hwFramesCtx(value: HardwareFramesContext | null) {
    this.native.hwFramesCtx = value?.getNative() ?? null;
    // Clear the cache as the underlying context has changed
    this._hwFramesCtx = undefined;
  }

  /**
   * Allocate an AVFrame and set its fields to default values.
   *
   * Allocates the AVFrame structure and initializes all fields to default values.
   * This only allocates the frame structure itself, not the data buffers.
   *
   * Direct mapping to av_frame_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * const frame = new Frame();
   * frame.alloc();
   * // Frame structure is now allocated
   * // Still need to allocate data buffers with getBuffer()
   * ```
   *
   * @see {@link getBuffer} To allocate data buffers
   * @see {@link free} To free the frame
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the frame and any dynamically allocated objects in it.
   *
   * Frees the frame structure and all associated data buffers.
   * If the frame is reference counted, it will be unreferenced first.
   *
   * Direct mapping to av_frame_free()
   *
   * @note
   * Calling this multiple times is safe, because we check the freed state
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * frame.free();
   * // frame is now invalid and should not be used
   * ```
   *
   * @see {@link unref} To clear data but keep frame allocated
   */
  free(): void {
    this.native.free();
  }

  /**
   * Set up a new reference to the data described by the source frame.
   *
   * Creates a reference to the source frame's data buffers.
   * Both frames will share the same data through reference counting.
   * This function does not copy side data.
   *
   * Direct mapping to av_frame_ref()
   *
   * @param src - Source frame to reference
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (frame now references src data)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(EINVAL): Invalid parameters (null frame)
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * const ret = frame.ref(sourceFrame);
   * FFmpegError.throwIfError(ret, 'frame.ref');
   * // frame now references the same data as sourceFrame
   * ```
   *
   * @see {@link unref} To remove references
   * @see {@link clone} To create a new frame with same data
   */
  ref(src: Frame): number {
    return this.native.ref(src.getNative());
  }

  /**
   * Unreference all the buffers referenced by frame and reset the frame fields.
   *
   * Clears all data from the frame but keeps the frame structure allocated.
   * The frame can be reused for the next decode/encode operation.
   *
   * Direct mapping to av_frame_unref()
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * frame.unref();
   * // Frame is now empty but still allocated
   * // Can be reused for next decode/encode
   * ```
   *
   * @see {@link free} To completely free the frame
   */
  unref(): void {
    this.native.unref();
  }

  /**
   * Create a new frame that references the same data as this frame.
   *
   * Creates a new frame and sets it up as a reference to this frame's data.
   * This is a shortcut for av_frame_alloc() + av_frame_ref().
   *
   * Direct mapping to av_frame_clone()
   *
   * @returns New frame referencing the same data, or null on error:
   *   - Frame object: Success (new frame references this frame's data)
   *   - null: Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * const clonedFrame = frame.clone();
   * if (!clonedFrame) {
   *   throw new Error('Failed to clone frame: Out of memory');
   * }
   * // clonedFrame references the same data as frame
   * // Both frames must be freed independently
   * ```
   *
   * @see {@link ref} To reference into existing frame
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
   * Allocates data buffers for the frame based on its parameters.
   * Frame parameters must be set before calling this function.
   *
   * Direct mapping to av_frame_get_buffer()
   *
   * @param align - Required buffer size alignment. 0 for automatic.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (buffers allocated)
   *   - AVERROR(EINVAL): Invalid frame parameters (format/size not set)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError, AV_PIX_FMT_YUV420P } from 'node-av';
   *
   * // Video frame
   * frame.format = AV_PIX_FMT_YUV420P;
   * frame.width = 1920;
   * frame.height = 1080;
   * const ret = frame.getBuffer(0);
   * FFmpegError.throwIfError(ret, 'getBuffer');
   * // Frame data buffers are now allocated
   * ```
   *
   * @see {@link allocBuffer} Convenience wrapper with default alignment
   * @see {@link makeWritable} Ensure buffer is writable
   *
   * Required fields before calling:
   * - format (pixel format for video, sample format for audio)
   * - width and height for video
   * - nb_samples and channel_layout for audio
   */
  getBuffer(align = 0): number {
    return this.native.getBuffer(align);
  }

  /**
   * Allocate buffer(s) for frame according to its parameters.
   *
   * Convenience wrapper for getBuffer() with default alignment.
   * Frame parameters must be set before calling.
   *
   * Direct mapping to av_frame_get_buffer() with align=0
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (buffers allocated)
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * const ret = frame.allocBuffer();
   * FFmpegError.throwIfError(ret, 'allocBuffer');
   * // Frame data buffers are now allocated
   * ```
   *
   * @see {@link getBuffer} With custom alignment
   */
  allocBuffer(): number {
    return this.native.allocBuffer();
  }

  /**
   * Ensure that the frame data is writable.
   *
   * Makes a private copy of the frame data if it's currently shared.
   * Does nothing if frame is already writable.
   *
   * Direct mapping to av_frame_make_writable()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success (frame is now writable)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * if (!frame.isWritable) {
   *   const ret = frame.makeWritable();
   *   FFmpegError.throwIfError(ret, 'makeWritable');
   * }
   * // Frame data can now be modified safely
   * ```
   *
   * @see {@link isWritable} Check if writable
   */
  makeWritable(): number {
    return this.native.makeWritable();
  }

  /**
   * Copy only "metadata" fields from src to this frame.
   *
   * Copies all frame properties except the actual data buffers.
   * This includes timestamps, format, dimensions, side data, etc.
   *
   * Direct mapping to av_frame_copy_props()
   *
   * @param src - Source frame to copy properties from
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success (properties copied)
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * const ret = dstFrame.copyProps(srcFrame);
   * FFmpegError.throwIfError(ret, 'copyProps');
   * // dstFrame now has same properties as srcFrame (but not data)
   * ```
   *
   * @see {@link copy} To copy data as well
   */
  copyProps(src: Frame): number {
    return this.native.copyProps(src.getNative());
  }

  /**
   * Copy the frame data from src to this frame.
   *
   * Copies the actual data buffers from source to destination.
   * Destination must be pre-allocated with same parameters.
   *
   * Direct mapping to av_frame_copy()
   *
   * @param src - Source frame to copy data from
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success (data copied)
   *   - AVERROR(EINVAL): Frames have different parameters (format, size, etc.)
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * // Destination must be allocated with same parameters
   * dstFrame.format = srcFrame.format;
   * dstFrame.width = srcFrame.width;
   * dstFrame.height = srcFrame.height;
   * const allocRet = dstFrame.allocBuffer();
   * FFmpegError.throwIfError(allocRet, 'allocBuffer');
   *
   * const ret = dstFrame.copy(srcFrame);
   * FFmpegError.throwIfError(ret, 'copy');
   * // Data has been copied to dstFrame
   * ```
   *
   * @see {@link copyProps} To copy metadata only
   */
  copy(src: Frame): number {
    return this.native.copy(src.getNative());
  }

  /**
   * Fill frame data from a buffer.
   *
   * Copies raw frame data from a Buffer into this frame's data planes.
   * The frame must be allocated with the correct format, width/height (for video),
   * or nb_samples (for audio) before calling this method.
   *
   * For video frames, the buffer should contain raw pixel data in the frame's pixel format.
   * For audio frames, the buffer should contain raw audio samples in the frame's sample format.
   *
   * @param buffer - Buffer containing raw frame data
   * @returns 0 on success, negative AVERROR on failure
   *
   * @example
   * ```typescript
   * // Video frame from raw YUV420p data
   * const frame = new Frame();
   * frame.alloc();
   * frame.format = AV_PIX_FMT_YUV420P;
   * frame.width = 1920;
   * frame.height = 1080;
   * frame.allocBuffer();
   * frame.fromBuffer(rawYuvBuffer);
   *
   * // Audio frame from raw PCM data
   * const audioFrame = new Frame();
   * audioFrame.alloc();
   * audioFrame.format = AV_SAMPLE_FMT_FLTP;
   * audioFrame.nbSamples = 1024;
   * audioFrame.channelLayout = { order: 0, nb_channels: 2, u: { mask: 3n } };
   * audioFrame.allocBuffer();
   * audioFrame.fromBuffer(rawPcmBuffer);
   * ```
   */
  fromBuffer(buffer: Buffer): number {
    return this.native.fromBuffer(buffer);
  }

  /**
   * Transfer data to or from hardware surfaces.
   *
   * Transfers frame data between hardware (GPU) and software (CPU) memory.
   * Can be used for both upload and download operations.
   *
   * Direct mapping to av_hwframe_transfer_data()
   *
   * @param dst - Destination frame
   * @param flags - Transfer flags (currently unused, should be set to zero)
   *
   * @returns Promise resolving to 0 on success, negative AVERROR on error:
   *   - 0: Success (data transferred)
   *   - AVERROR(ENOSYS): Operation not supported
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other hardware-specific errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * // Transfer from hardware to software frame
   * const swFrame = new Frame();
   * swFrame.alloc();
   * const ret = await hwFrame.hwframeTransferData(swFrame, 0);
   * FFmpegError.throwIfError(ret, 'hwframeTransferData');
   * // Data is now in CPU memory
   * ```
   *
   * @see {@link isHwFrame} Check if frame is hardware frame
   */
  async hwframeTransferData(dst: Frame, flags?: number): Promise<number> {
    return this.native.hwframeTransferData(dst.getNative(), flags ?? 0);
  }

  /**
   * Check if this is a hardware frame.
   *
   * A frame is considered a hardware frame if it has a hw_frames_ctx set.
   *
   * Direct check of AVFrame->hw_frames_ctx
   *
   * @returns True if this is a hardware frame, false otherwise
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * if (frame.isHwFrame()) {
   *   console.log('Frame is in GPU memory');
   * } else {
   *   console.log('Frame is in CPU memory');
   * }
   * ```
   *
   * @see {@link hwframeTransferData} To transfer between CPU and GPU
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
   * Direct check of AVFrame->data[0] && !AVFrame->hw_frames_ctx
   *
   * @returns True if this is a software frame, false otherwise
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   *
   * if (frame.isSwFrame()) {
   *   console.log('Frame is in CPU memory');
   *   // Safe to access frame.data
   * }
   * ```
   *
   * @see {@link isHwFrame} To check for hardware frames
   */
  isSwFrame(): boolean {
    return this.native.isSwFrame();
  }

  /**
   * Get side data from the frame.
   *
   * Direct mapping to av_frame_get_side_data()
   *
   * @param type - The type of side data to retrieve
   * @returns Buffer containing the side data, or null if not found
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   * import { AV_FRAME_DATA_A53_CC } from 'node-av/constants';
   *
   * // Check for closed captions
   * const ccData = frame.getSideData(AV_FRAME_DATA_A53_CC);
   * if (ccData) {
   *   console.log('Found closed caption data:', ccData.length, 'bytes');
   * }
   * ```
   */
  getSideData(type: AVFrameSideDataType): Buffer | null {
    return this.native.getSideData(type);
  }

  /**
   * Allocate new side data for the frame.
   *
   * Allocates a new side data buffer of the specified size.
   * Returns a Buffer that references the allocated memory.
   * Direct mapping to av_frame_new_side_data()
   *
   * @param type - The type of side data to allocate
   * @param size - Size of the side data buffer to allocate
   * @returns Buffer referencing the allocated side data
   * @throws {Error} If allocation fails
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   * import { AV_FRAME_DATA_MASTERING_DISPLAY_METADATA } from 'node-av/constants';
   *
   * // Allocate HDR metadata
   * const hdrBuffer = frame.newSideData(
   *   AV_FRAME_DATA_MASTERING_DISPLAY_METADATA,
   *   24 // Size of mastering display metadata structure
   * );
   * // Write HDR metadata to the buffer
   * ```
   */
  newSideData(type: AVFrameSideDataType, size: number): Buffer {
    return this.native.newSideData(type, size);
  }

  /**
   * Remove side data from the frame.
   *
   * Removes and frees the specified type of side data from the frame.
   * Direct mapping to av_frame_remove_side_data()
   *
   * @param type - The type of side data to remove
   *
   * @example
   * ```typescript
   * import { Frame } from 'node-av';
   * import { AV_FRAME_DATA_MOTION_VECTORS } from 'node-av/constants';
   *
   * // Remove motion vectors data
   * frame.removeSideData(AV_FRAME_DATA_MOTION_VECTORS);
   * ```
   */
  removeSideData(type: AVFrameSideDataType): void {
    this.native.removeSideData(type);
  }

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
   * import { Frame } from 'node-av';
   *
   * {
   *   using frame = new Frame();
   *   frame.alloc();
   *   // ... use frame
   * } // Automatically freed when leaving scope
   * ```
   *
   * @see {@link free} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
