import { bindings } from './binding.js';
import { Codec } from './codec.js';
import { AV_SEEK_FLAG_NONE } from './constants.js';
import { Dictionary } from './dictionary.js';
import { InputFormat } from './input-format.js';
import { IOContext } from './io-context.js';
import { OutputFormat } from './output-format.js';
import { Stream } from './stream.js';

import type { AVFormatFlag, AVMediaType, AVSeekFlag } from './constants.js';
import type { NativeFormatContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * FFmpeg format context for demuxing and muxing - Low Level API
 *
 * Direct mapping to FFmpeg's AVFormatContext.
 * User has full control over allocation, configuration and lifecycle.
 * No hidden operations, no automatic initialization.
 *
 * @example
 * ```typescript
 * // Demuxing - full control over every step
 * const ctx = new FormatContext();
 * ctx.allocContext();
 *
 * const ret = await ctx.openInput('video.mp4', null, null);
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * await ctx.findStreamInfo(null);
 *
 * const packet = new Packet();
 * packet.alloc();
 *
 * while ((await ctx.readFrame(packet)) >= 0) {
 *   // Process packet
 *   packet.unref();
 * }
 *
 * ctx.closeInput();
 * ctx.freeContext();
 * ```
 *
 * @example
 * ```typescript
 * // Muxing - explicit control
 * const ctx = new FormatContext();
 * const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4');
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Add streams
 * const stream = ctx.newStream(null);
 *
 * // Write header
 * await ctx.writeHeader(null);
 *
 * // Write packets
 * await ctx.interleavedWriteFrame(packet);
 *
 * // Finalize
 * await ctx.writeTrailer();
 * ctx.freeContext();
 * ```
 */
export class FormatContext implements Disposable, NativeWrapper<NativeFormatContext> {
  private native: NativeFormatContext;

  // Constructor
  /**
   * Create a new format context.
   *
   * The context is uninitialized - you must call allocContext() or allocOutputContext2() before use.
   * Direct wrapper around AVFormatContext.
   *
   * @example
   * ```typescript
   * const ctx = new FormatContext();
   * ctx.allocContext(); // For demuxing
   * // OR
   * ctx.allocOutputContext2(null, 'mp4', 'output.mp4'); // For muxing
   * ```
   */
  constructor() {
    this.native = new bindings.FormatContext();
  }

  // Getter/Setter Properties

  /**
   * Input or output URL/filename.
   *
   * Direct mapping to AVFormatContext->url
   *
   * - muxing: Set by user
   * - demuxing: Set by avformat_open_input
   */
  get url(): string | null {
    return this.native.url;
  }

  set url(value: string | null) {
    this.native.url = value;
  }

  /**
   * Position of the first frame of the component, in AV_TIME_BASE units.
   *
   * Direct mapping to AVFormatContext->start_time
   *
   * NEVER set this value directly: it is deduced from the AVStream values.
   * - demuxing: Set by libavformat
   */
  get startTime(): bigint {
    return this.native.startTime;
  }

  /**
   * Duration of the stream, in AV_TIME_BASE units.
   *
   * Direct mapping to AVFormatContext->duration
   *
   * Only set this value if you know none of the individual stream durations.
   * - demuxing: Set by libavformat
   * - muxing: May be set by user
   */
  get duration(): bigint {
    return this.native.duration;
  }

  /**
   * Total stream bitrate in bit/s, 0 if not available.
   *
   * Direct mapping to AVFormatContext->bit_rate
   *
   * Never set directly if the file_size and duration are known.
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  /**
   * Flags modifying demuxer/muxer behavior.
   *
   * Direct mapping to AVFormatContext->flags
   *
   * AVFMT_FLAG_GENPTS, AVFMT_FLAG_IGNIDX, etc.
   * - encoding: Set by user
   * - decoding: Set by user
   */
  get flags(): AVFormatFlag {
    return this.native.flags;
  }

  set flags(value: AVFormatFlag) {
    this.native.flags = value;
  }

  /**
   * Maximum size of the data read from input for determining format.
   *
   * Direct mapping to AVFormatContext->probesize
   *
   * - encoding: unused
   * - decoding: Set by user
   */
  get probesize(): bigint {
    return this.native.probesize;
  }

  set probesize(value: bigint) {
    this.native.probesize = value;
  }

  /**
   * Maximum duration (in AV_TIME_BASE units) of the data read from input.
   *
   * Direct mapping to AVFormatContext->max_analyze_duration
   *
   * - encoding: unused
   * - decoding: Set by user
   */
  get maxAnalyzeDuration(): bigint {
    return this.native.maxAnalyzeDuration;
  }

  set maxAnalyzeDuration(value: bigint) {
    this.native.maxAnalyzeDuration = value;
  }

  /**
   * Metadata that applies to the whole file.
   *
   * Direct mapping to AVFormatContext->metadata
   *
   * - demuxing: Set by libavformat
   * - muxing: May be set by user
   */
  get metadata(): Dictionary | null {
    const nativeDict = this.native.metadata;
    if (!nativeDict) {
      return null;
    }
    return Dictionary.fromNative(nativeDict);
  }

  set metadata(value: Dictionary | null) {
    this.native.metadata = value?.getNative() ?? null;
  }

  /**
   * Input format (demuxing only).
   *
   * Direct mapping to AVFormatContext->iformat
   *
   * The detected or specified input format.
   */
  get iformat(): InputFormat | null {
    const nativeFormat = this.native.iformat;
    if (!nativeFormat) {
      return null;
    }
    return new InputFormat(nativeFormat);
  }

  /**
   * Output format (muxing only).
   *
   * Direct mapping to AVFormatContext->oformat
   *
   * The specified output format.
   */
  get oformat(): OutputFormat | null {
    const nativeFormat = this.native.oformat;
    if (!nativeFormat) {
      return null;
    }
    return new OutputFormat(nativeFormat);
  }

  set oformat(value: OutputFormat | null) {
    this.native.oformat = value?.getNative() ?? null;
  }

  /**
   * I/O context.
   *
   * Direct mapping to AVFormatContext->pb
   *
   * - demuxing: Either set by user or internal (for protocols like file:)
   * - muxing: Set by user for custom I/O. Otherwise internal
   */
  get pb(): IOContext | null {
    const nativeIO = this.native.pb;
    if (!nativeIO) {
      return null;
    }
    return IOContext.fromNative(nativeIO);
  }

  set pb(value: IOContext | null) {
    this.native.pb = value?.getNative() ?? null;
  }

  /**
   * Number of streams in the file.
   *
   * Direct mapping to AVFormatContext->nb_streams
   */
  get nbStreams(): number {
    return this.native.nbStreams;
  }

  /**
   * Array of streams in the file.
   *
   * Direct mapping to AVFormatContext->streams
   */
  get streams(): Stream[] | null {
    const nativeStreams = this.native.streams;
    if (!nativeStreams) {
      return null;
    }
    return nativeStreams.map((nativeStream) => new Stream(nativeStream));
  }

  /**
   * Allow non-standard and experimental extension.
   *
   * Direct mapping to AVFormatContext->strict_std_compliance
   *
   * @see AVCodecContext.strict_std_compliance
   */
  get strictStdCompliance(): number {
    return this.native.strictStdCompliance;
  }

  set strictStdCompliance(value: number) {
    this.native.strictStdCompliance = value;
  }

  /**
   * Maximum number of streams.
   *
   * Direct mapping to AVFormatContext->max_streams
   *
   * - encoding: unused
   * - decoding: Set by user
   */
  get maxStreams(): number {
    return this.native.maxStreams;
  }

  set maxStreams(value: number) {
    this.native.maxStreams = value;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an AVFormatContext for input.
   *
   * Direct mapping to avformat_alloc_context()
   *
   * @example
   * ```typescript
   * const ctx = new FormatContext();
   * ctx.allocContext();
   * // Context is now allocated for demuxing
   * ```
   *
   * @throws {Error} If allocation fails (ENOMEM)
   */
  allocContext(): void {
    return this.native.allocContext();
  }

  /**
   * Allocate an AVFormatContext for output.
   *
   * Direct mapping to avformat_alloc_output_context2()
   *
   * @param oformat - Output format. May be null to auto-detect from filename
   * @param formatName - Format name. May be null to auto-detect
   * @param filename - Filename for output. Used to guess format if not specified
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid arguments
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const ctx = new FormatContext();
   * const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4');
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  allocOutputContext2(oformat: OutputFormat | null, formatName: string | null, filename: string | null): number {
    return this.native.allocOutputContext2(oformat?.getNative() ?? null, formatName, filename);
  }

  /**
   * Free an AVFormatContext and all its streams.
   *
   * Direct mapping to avformat_free_context()
   *
   * @example
   * ```typescript
   * ctx.freeContext();
   * // ctx is now invalid and should not be used
   * ```
   */
  freeContext(): void {
    return this.native.freeContext();
  }

  /**
   * Close an opened input AVFormatContext.
   *
   * Direct mapping to avformat_close_input()
   *
   * @example
   * ```typescript
   * ctx.closeInput();
   * // Input is closed and context is freed
   * ```
   */
  closeInput(): void {
    return this.native.closeInput();
  }

  /**
   * Open the output file for writing.
   *
   * Direct mapping to avio_open()
   *
   * Must be called after allocOutputContext2() and before writeHeader()
   * for file-based formats (not NOFILE formats).
   *
   * @example
   * ```typescript
   * ctx.allocOutputContext2(null, null, 'output.mp4');
   * ctx.openOutput(); // Opens the file for writing
   * await ctx.writeHeader(null);
   * ```
   *
   * @returns 0 on success, negative AVERROR on failure
   */
  openOutput(): number {
    return this.native.openOutput();
  }

  /**
   * Close the output file.
   *
   * Direct mapping to avio_closep()
   *
   * Should be called after writeTrailer() for file-based formats.
   * The file is automatically closed by freeContext() as well.
   *
   * @example
   * ```typescript
   * await ctx.writeTrailer();
   * ctx.closeOutput();
   * ctx.freeContext();
   * ```
   */
  closeOutput(): void {
    return this.native.closeOutput();
  }

  // Public Methods - Input Operations (Async)

  /**
   * Open an input stream and read the header.
   *
   * Direct mapping to avformat_open_input()
   *
   * @param url - URL of the stream to open
   * @param fmt - Input format. May be null to auto-detect
   * @param options - Dictionary of options. May be null
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOENT): File not found
   *   - AVERROR(EIO): I/O error
   *   - AVERROR(EINVAL): Invalid data found
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other format-specific errors
   *
   * @example
   * ```typescript
   * const ret = await ctx.openInput('video.mp4', null, null);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  async openInput(url: string, fmt: InputFormat | null, options: Dictionary | null): Promise<number> {
    return this.native.openInput(url, fmt?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Read packets of a media file to get stream information.
   *
   * Direct mapping to avformat_find_stream_info()
   *
   * @param options - Dictionary of options per stream. May be null
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success (number of stream info found)
   *   - AVERROR(EIO): I/O error
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = await ctx.findStreamInfo(null);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * console.log(`Found ${ctx.nbStreams} streams`);
   * ```
   */
  async findStreamInfo(options: Dictionary[] | null): Promise<number> {
    return this.native.findStreamInfo(options?.map((d) => d.getNative()) ?? null);
  }

  /**
   * Read the next packet in the file.
   *
   * Direct mapping to av_read_frame()
   *
   * @param pkt - Packet to fill with data
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR_EOF: End of file reached
   *   - AVERROR(EAGAIN): Temporarily unavailable
   *   - AVERROR(EIO): I/O error
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const packet = new Packet();
   * packet.alloc();
   *
   * while (true) {
   *   const ret = await ctx.readFrame(packet);
   *   if (ret === AVERROR_EOF) break;
   *   if (ret < 0) throw new FFmpegError(ret);
   *
   *   // Process packet
   *   processPacket(packet);
   *   packet.unref();
   * }
   * ```
   */
  async readFrame(pkt: Packet): Promise<number> {
    return this.native.readFrame(pkt.getNative());
  }

  /**
   * Seek to the keyframe at timestamp.
   *
   * Direct mapping to av_seek_frame()
   *
   * @param streamIndex - Stream index or -1 for default
   * @param timestamp - Timestamp in stream time_base units or AV_TIME_BASE if stream_index is -1
   * @param flags - AVSEEK_FLAG_* flags
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success
   *   - AVERROR(EINVAL): Invalid arguments
   *   - AVERROR(EIO): I/O error
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Seek to 10 seconds
   * const timestamp = 10n * AV_TIME_BASE;
   * const ret = await ctx.seekFrame(-1, timestamp, AVSEEK_FLAG_BACKWARD);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  async seekFrame(streamIndex: number, timestamp: bigint, flags: AVSeekFlag = AV_SEEK_FLAG_NONE): Promise<number> {
    return this.native.seekFrame(streamIndex, timestamp, flags);
  }

  /**
   * Seek to timestamp ts with more control.
   *
   * Direct mapping to avformat_seek_file()
   *
   * @param streamIndex - Stream index or -1 for default
   * @param minTs - Smallest acceptable timestamp
   * @param ts - Target timestamp
   * @param maxTs - Largest acceptable timestamp
   * @param flags - AVSEEK_FLAG_* flags
   *
   * @returns >=0 on success, negative AVERROR on error:
   *   - >=0: Success
   *   - AVERROR(EINVAL): Invalid arguments
   *   - AVERROR(EIO): I/O error
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Seek to timestamp with tolerance
   * const target = 10n * AV_TIME_BASE;
   * const ret = await ctx.seekFile(
   *   -1,
   *   target - AV_TIME_BASE,  // min: 9 seconds
   *   target,                  // target: 10 seconds
   *   target + AV_TIME_BASE,  // max: 11 seconds
   *   0
   * );
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  async seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: AVSeekFlag = AV_SEEK_FLAG_NONE): Promise<number> {
    return this.native.seekFile(streamIndex, minTs, ts, maxTs, flags);
  }

  // Public Methods - Output Operations (Async)

  /**
   * Allocate the stream private data and write the stream header.
   *
   * Direct mapping to avformat_write_header()
   *
   * @param options - Dictionary of options. May be null
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(EIO): I/O error
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other muxer-specific errors
   *
   * @example
   * ```typescript
   * const options = new Dictionary();
   * options.set('movflags', 'faststart', 0);
   *
   * const ret = await ctx.writeHeader(options);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * options.free();
   * ```
   */
  async writeHeader(options: Dictionary | null): Promise<number> {
    return this.native.writeHeader(options?.getNative() ?? null);
  }

  /**
   * Write a packet to an output media file.
   *
   * Direct mapping to av_write_frame()
   *
   * @param pkt - Packet to write. May be null to flush
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid packet
   *   - AVERROR(EIO): I/O error
   *   - <0: Other muxer-specific errors
   *
   * @example
   * ```typescript
   * const ret = await ctx.writeFrame(packet);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Flush at the end
   * await ctx.writeFrame(null);
   * ```
   *
   * @note This function does NOT take ownership of the packet.
   */
  async writeFrame(pkt: Packet | null): Promise<number> {
    return this.native.writeFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write a packet to an output media file ensuring correct interleaving.
   *
   * Direct mapping to av_interleaved_write_frame()
   *
   * @param pkt - Packet to write. May be null to flush
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid packet
   *   - AVERROR(EIO): I/O error
   *   - <0: Other muxer-specific errors
   *
   * @example
   * ```typescript
   * // Write packets with automatic interleaving
   * const ret = await ctx.interleavedWriteFrame(packet);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @note This function TAKES OWNERSHIP of the packet and will free it.
   * @see writeFrame() - For manual interleaving control
   */
  async interleavedWriteFrame(pkt: Packet | null): Promise<number> {
    return this.native.interleavedWriteFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write the stream trailer to an output media file.
   *
   * Direct mapping to av_write_trailer()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EIO): I/O error
   *   - <0: Other muxer-specific errors
   *
   * @example
   * ```typescript
   * // Finalize the output file
   * const ret = await ctx.writeTrailer();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @note Must be called after all packets have been written.
   */
  async writeTrailer(): Promise<number> {
    return this.native.writeTrailer();
  }

  /**
   * Flush any buffered data to the output.
   *
   * Direct mapping to avio_flush()
   *
   * @example
   * ```typescript
   * // Flush buffered data
   * ctx.flush();
   * ```
   */
  flush(): void {
    return this.native.flush();
  }

  // Public Methods - Utility

  /**
   * Dump format information to stderr.
   *
   * Direct mapping to av_dump_format()
   *
   * @param index - Stream index or program index to dump
   * @param url - URL or filename to display
   * @param isOutput - true for output format, false for input format
   *
   * @example
   * ```typescript
   * // Dump input format info
   * formatCtx.dumpFormat(0, 'input.mp4', false);
   *
   * // Dump output format info
   * formatCtx.dumpFormat(0, 'output.mp4', true);
   * ```
   */
  dumpFormat(index: number, url: string, isOutput: boolean): void {
    this.native.dumpFormat(index, url, isOutput);
  }

  /**
   * Find the "best" stream in the file.
   *
   * Direct mapping to av_find_best_stream()
   *
   * The best stream is determined according to various heuristics as the most
   * likely to be what the user expects.
   *
   * @param type - Media type (AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO, etc.)
   * @param wantedStreamNb - User-requested stream number, or -1 for automatic selection
   * @param relatedStream - Try to find a stream related to this one, or -1 if none
   *
   * @returns The stream index if found, or negative AVERROR on error:
   *   - >=0: Stream index of the best stream
   *   - AVERROR_STREAM_NOT_FOUND: No stream of the requested type found
   *   - AVERROR_DECODER_NOT_FOUND: Streams were found but no decoder
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Find best video stream
   * const videoStreamIndex = ctx.findBestStream(
   *   AVMEDIA_TYPE_VIDEO,
   *   -1,  // automatic selection
   *   -1   // no related stream
   * );
   *
   * if (videoStreamIndex >= 0) {
   *   const videoStream = ctx.streams[videoStreamIndex];
   *   // Process video stream
   * }
   * ```
   */
  findBestStream(type: AVMediaType, wantedStreamNb: number, relatedStream: number): number;

  /**
   * Find the "best" stream in the file and optionally return the decoder.
   *
   * Direct mapping to av_find_best_stream()
   *
   * The best stream is determined according to various heuristics as the most
   * likely to be what the user expects.
   *
   * @param type - Media type (AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO, etc.)
   * @param wantedStreamNb - User-requested stream number, or -1 for automatic selection
   * @param relatedStream - Try to find a stream related to this one, or -1 if none
   * @param wantDecoder - Whether to return the decoder for the stream
   * @param flags - Currently unused, pass 0
   *
   * @returns Object with stream index and decoder if found
   *
   * @example
   * ```typescript
   * // Find best video stream with decoder
   * const result = ctx.findBestStream(
   *   AVMEDIA_TYPE_VIDEO,
   *   -1,  // automatic selection
   *   -1,  // no related stream
   *   true, // want decoder
   *   0
   * );
   *
   * if (result.streamIndex >= 0) {
   *   const videoStream = ctx.streams[result.streamIndex];
   *   const decoder = result.decoder;
   *   // Use decoder directly
   * }
   * ```
   */
  findBestStream(type: AVMediaType, wantedStreamNb: number, relatedStream: number, wantDecoder: true, flags?: number): { streamIndex: number; decoder: Codec | null };

  findBestStream(
    type: AVMediaType,
    wantedStreamNb: number,
    relatedStream: number,
    wantDecoder?: boolean,
    flags?: number,
  ): number | { streamIndex: number; decoder: Codec | null } {
    if (wantDecoder === true) {
      const result = this.native.findBestStream(type, wantedStreamNb, relatedStream, true, flags ?? 0);
      if (typeof result === 'object' && result !== null) {
        // Wrap the native decoder in a Codec instance
        return {
          streamIndex: result.streamIndex,
          decoder: Codec.fromNative(result.decoder),
        };
      }
      // If not an object, return as error code
      return { streamIndex: result, decoder: null };
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return this.native.findBestStream(type, wantedStreamNb, relatedStream, false, flags ?? 0) as number;
  }

  // Public Methods - Stream Management

  /**
   * Add a new stream to the media file.
   *
   * Direct mapping to avformat_new_stream()
   *
   * @param c - Codec to use for the stream. May be null
   *
   * @returns The newly created stream or null on failure
   *
   * @example
   * ```typescript
   * // Add a video stream
   * const videoCodec = Codec.findEncoder(AV_CODEC_ID_H264);
   * const videoStream = ctx.newStream(videoCodec);
   * if (!videoStream) {
   *   throw new Error('Failed to create video stream');
   * }
   *
   * // Configure stream parameters
   * videoStream.codecpar.codecType = AVMEDIA_TYPE_VIDEO;
   * videoStream.codecpar.codecId = AV_CODEC_ID_H264;
   * videoStream.codecpar.width = 1920;
   * videoStream.codecpar.height = 1080;
   * ```
   */
  newStream(c: Codec | null): Stream {
    const nativeStream = this.native.newStream(c?.getNative() ?? null);
    return new Stream(nativeStream);
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVFormatContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native format context object
   */
  getNative(): NativeFormatContext {
    return this.native;
  }

  /**
   * Dispose of the format context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling freeContext().
   *
   * @example
   * ```typescript
   * {
   *   using ctx = new FormatContext();
   *   ctx.allocContext();
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
