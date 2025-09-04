import { AVFLAG_NONE } from '../constants/constants.js';
import { bindings } from './binding.js';
import { Codec } from './codec.js';
import { Dictionary } from './dictionary.js';
import { InputFormat } from './input-format.js';
import { OptionMember } from './option.js';
import { OutputFormat } from './output-format.js';
import { Stream } from './stream.js';

import type { AVFormatFlag, AVMediaType, AVSeekFlag } from '../constants/constants.js';
import type { IOContext } from './io-context.js';
import type { NativeFormatContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Container format context for reading/writing multimedia files.
 *
 * Central structure for demuxing (reading) and muxing (writing) media files.
 * Manages streams, packets, metadata, and format-specific operations.
 * Supports both file-based and custom I/O through IOContext.
 * Essential for all file-based media operations.
 *
 * Direct mapping to FFmpeg's AVFormatContext.
 *
 * @example
 * ```typescript
 * import { FormatContext, FFmpegError } from 'node-av';
 * import { AVMEDIA_TYPE_VIDEO } from 'node-av/constants';
 *
 * // Open input file
 * const ctx = new FormatContext();
 * let ret = await ctx.openInput('input.mp4');
 * FFmpegError.throwIfError(ret, 'openInput');
 *
 * ret = await ctx.findStreamInfo();
 * FFmpegError.throwIfError(ret, 'findStreamInfo');
 *
 * // Find video stream
 * const videoIndex = ctx.findBestStream(AVMEDIA_TYPE_VIDEO);
 * if (videoIndex < 0) {
 *   throw new Error('No video stream found');
 * }
 *
 * // Read packets
 * const packet = new Packet();
 * packet.alloc();
 * while ((ret = await ctx.readFrame(packet)) >= 0) {
 *   if (packet.streamIndex === videoIndex) {
 *     // Process video packet
 *   }
 *   packet.unref();
 * }
 *
 * // Cleanup
 * await ctx.closeInput();
 * ```
 *
 * @see [AVFormatContext](https://ffmpeg.org/doxygen/trunk/structAVFormatContext.html) - FFmpeg Doxygen
 * @see {@link InputFormat} For supported input formats
 * @see {@link OutputFormat} For supported output formats
 * @see {@link Stream} For stream management
 */
export class FormatContext extends OptionMember<NativeFormatContext> implements AsyncDisposable, NativeWrapper<NativeFormatContext> {
  private _ioContext: IOContext | null = null;

  constructor() {
    super(new bindings.FormatContext());
  }

  /**
   * URL or filename of the media.
   *
   * For input: the opened file path.
   * For output: the target file path.
   *
   * Direct mapping to AVFormatContext->url.
   */
  get url(): string | null {
    return this.native.url;
  }

  set url(value: string | null) {
    this.native.url = value;
  }

  /**
   * Start time of the stream.
   *
   * Position of the first frame in microseconds.
   * AV_NOPTS_VALUE if unknown.
   *
   * Direct mapping to AVFormatContext->start_time.
   */
  get startTime(): bigint {
    return this.native.startTime;
  }

  /**
   * Duration of the stream.
   *
   * Total stream duration in microseconds.
   * AV_NOPTS_VALUE if unknown.
   *
   * Direct mapping to AVFormatContext->duration.
   */
  get duration(): bigint {
    return this.native.duration;
  }

  /**
   * Total stream bitrate.
   *
   * Bitrate in bits per second.
   * 0 if unknown.
   *
   * Direct mapping to AVFormatContext->bit_rate.
   */
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  /**
   * Format-specific flags.
   *
   * Combination of AVFMT_FLAG_* values controlling
   * format behavior (e.g., AVFMT_FLAG_GENPTS).
   *
   * Direct mapping to AVFormatContext->flags.
   */
  get flags(): AVFormatFlag {
    return this.native.flags;
  }

  set flags(value: AVFormatFlag) {
    this.native.flags = value;
  }

  /**
   * Maximum bytes to probe for format detection.
   *
   * Larger values improve format detection accuracy
   * but increase startup time.
   *
   * Direct mapping to AVFormatContext->probesize.
   */
  get probesize(): bigint {
    return this.native.probesize;
  }

  set probesize(value: bigint) {
    this.native.probesize = value;
  }

  /**
   * Maximum duration to analyze streams.
   *
   * Time in microseconds to spend analyzing streams.
   * Larger values improve stream detection accuracy.
   *
   * Direct mapping to AVFormatContext->max_analyze_duration.
   */
  get maxAnalyzeDuration(): bigint {
    return this.native.maxAnalyzeDuration;
  }

  set maxAnalyzeDuration(value: bigint) {
    this.native.maxAnalyzeDuration = value;
  }

  /**
   * Container metadata.
   *
   * Key-value pairs of metadata (title, author, etc.).
   *
   * Direct mapping to AVFormatContext->metadata.
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
   * Input format descriptor.
   *
   * Format used for demuxing. Null for output contexts.
   *
   * Direct mapping to AVFormatContext->iformat.
   */
  get iformat(): InputFormat | null {
    const nativeFormat = this.native.iformat;
    if (!nativeFormat) {
      return null;
    }
    return new InputFormat(nativeFormat);
  }

  /**
   * Output format descriptor.
   *
   * Format used for muxing. Null for input contexts.
   *
   * Direct mapping to AVFormatContext->oformat.
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
   * Custom I/O context.
   *
   * For custom I/O operations instead of file I/O.
   *
   * Direct mapping to AVFormatContext->pb.
   */
  get pb(): IOContext | null {
    return this._ioContext;
  }

  set pb(value: IOContext | null) {
    this._ioContext = value;
    this.native.pb = value?.getNative() ?? null;
  }

  /**
   * Number of streams in the container.
   *
   * Direct mapping to AVFormatContext->nb_streams.
   */
  get nbStreams(): number {
    return this.native.nbStreams;
  }

  /**
   * Array of streams in the container.
   *
   * All audio, video, subtitle, and data streams.
   *
   * Direct mapping to AVFormatContext->streams.
   */
  get streams(): Stream[] | null {
    const nativeStreams = this.native.streams;
    if (!nativeStreams) {
      return null;
    }
    return nativeStreams.map((nativeStream) => new Stream(nativeStream));
  }

  /**
   * Strictness level for standards compliance.
   *
   * FF_COMPLIANCE_* value controlling how strictly
   * to follow specifications.
   *
   * Direct mapping to AVFormatContext->strict_std_compliance.
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
   * Limit on stream count for security/resource reasons.
   *
   * Direct mapping to AVFormatContext->max_streams.
   */
  get maxStreams(): number {
    return this.native.maxStreams;
  }

  set maxStreams(value: number) {
    this.native.maxStreams = value;
  }

  /**
   * Number of programs.
   *
   * For containers with multiple programs (e.g., MPEG-TS).
   *
   * Direct mapping to AVFormatContext->nb_programs.
   */
  get nbPrograms(): number {
    return this.native.nbPrograms;
  }

  /**
   * Number of bytes read/written through I/O context.
   *
   * Direct mapping to avio_tell(AVFormatContext->pb).
   */
  get pbBytes(): bigint {
    return this.native.pbBytes;
  }

  /**
   * Format probe score.
   *
   * Confidence score from format detection (0-100).
   * Higher values indicate more confident detection.
   *
   * Direct mapping to AVFormatContext->probe_score.
   */
  get probeScore(): number {
    return this.native.probeScore;
  }

  /**
   * Allocate a format context.
   *
   * Allocates the context structure. Usually not needed
   * as openInput/allocOutputContext2 handle this.
   *
   * Direct mapping to avformat_alloc_context().
   *
   * @example
   * ```typescript
   * const ctx = new FormatContext();
   * ctx.allocContext();
   * // Context is now allocated
   * ```
   */
  allocContext(): void {
    this.native.allocContext();
  }

  /**
   * Allocate an output format context.
   *
   * Allocates and configures context for writing.
   * Format is determined by parameters in priority order.
   *
   * Direct mapping to avformat_alloc_output_context2().
   *
   * @param oformat - Specific output format to use
   * @param formatName - Format name (e.g., 'mp4', 'mkv')
   * @param filename - Filename to guess format from extension
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOMEM: Memory allocation failure
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ctx = new FormatContext();
   * const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4');
   * FFmpegError.throwIfError(ret, 'allocOutputContext2');
   * ```
   *
   * @see {@link openOutput} To open output file
   * @see {@link writeHeader} To write file header
   */
  allocOutputContext2(oformat: OutputFormat | null, formatName: string | null, filename: string | null): number {
    if (!oformat && !formatName && !filename) {
      throw new Error('At least one of oformat, formatName, or filename must be specified');
    }

    return this.native.allocOutputContext2(oformat?.getNative() ?? null, formatName, filename);
  }

  /**
   * Free the format context.
   *
   * Releases all resources. The context becomes invalid.
   *
   * Direct mapping to avformat_free_context().
   *
   * @example
   * ```typescript
   * ctx.freeContext();
   * // Context is now invalid
   * ```
   *
   * @see {@link Symbol.asyncDispose} For automatic cleanup
   */
  freeContext(): void {
    this.native.freeContext();
  }

  /**
   * Close an input format context.
   *
   * Closes input file and releases resources.
   *
   * Direct mapping to avformat_close_input().
   *
   * @returns Promise that resolves when closed
   *
   * @example
   * ```typescript
   * await ctx.closeInput();
   * // Input closed and context freed
   * ```
   *
   * @see {@link openInput} To open input
   */
  async closeInput(): Promise<void> {
    return await this.native.closeInput();
  }

  /**
   * Open output file for writing.
   *
   * Opens the output file specified in url.
   * Must call allocOutputContext2 first.
   *
   * Direct mapping to avio_open2().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOENT: File not found
   *   - AVERROR_EACCES: Permission denied
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.openOutput();
   * FFmpegError.throwIfError(ret, 'openOutput');
   * ```
   *
   * @see {@link allocOutputContext2} Must be called first
   * @see {@link closeOutput} To close output
   */
  async openOutput(): Promise<number> {
    return await this.native.openOutput();
  }

  /**
   * Close output file.
   *
   * Closes the output file and releases I/O resources.
   *
   * Direct mapping to avio_closep().
   *
   * @returns Promise that resolves when closed
   *
   * @example
   * ```typescript
   * await ctx.closeOutput();
   * // Output file closed
   * ```
   *
   * @see {@link openOutput} To open output
   */
  async closeOutput(): Promise<void> {
    return await this.native.closeOutput();
  }

  /**
   * Open input file for reading.
   *
   * Opens and probes the input file, detecting format automatically
   * unless specified.
   *
   * Direct mapping to avformat_open_input().
   *
   * @param url - URL or file path to open
   * @param fmt - Force specific input format (null for auto-detect)
   * @param options - Format-specific options
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOENT: File not found
   *   - AVERROR_INVALIDDATA: Invalid file format
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.openInput('input.mp4');
   * FFmpegError.throwIfError(ret, 'openInput');
   * ```
   *
   * @see {@link findStreamInfo} To analyze streams after opening
   * @see {@link closeInput} To close input
   */
  async openInput(url: string, fmt: InputFormat | null = null, options: Dictionary | null = null): Promise<number> {
    return await this.native.openInput(url, fmt?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Analyze streams to get stream info.
   *
   * Reads packet headers to fill in stream information.
   * Should be called after openInput for accurate stream data.
   *
   * Direct mapping to avformat_find_stream_info().
   *
   * @param options - Per-stream options array
   * @returns >=0 on success, negative AVERROR on error:
   *   - AVERROR_EOF: End of file reached
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.findStreamInfo();
   * FFmpegError.throwIfError(ret, 'findStreamInfo');
   * console.log(`Found ${ctx.nbStreams} streams`);
   * ```
   *
   * @see {@link openInput} Must be called first
   */
  async findStreamInfo(options: Dictionary[] | null = null): Promise<number> {
    return await this.native.findStreamInfo(options?.map((d) => d.getNative()) ?? null);
  }

  /**
   * Read next packet from the input.
   *
   * Reads and returns the next packet in the stream.
   * Packet must be unreferenced after use.
   *
   * Direct mapping to av_read_frame().
   *
   * @param pkt - Packet to read into
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EOF: End of file
   *   - AVERROR_EAGAIN: Temporarily unavailable
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EOF } from 'node-av';
   *
   * const packet = new Packet();
   * packet.alloc();
   *
   * let ret;
   * while ((ret = await ctx.readFrame(packet)) >= 0) {
   *   // Process packet
   *   console.log(`Stream ${packet.streamIndex}, PTS: ${packet.pts}`);
   *   packet.unref();
   * }
   *
   * if (ret !== AVERROR_EOF) {
   *   FFmpegError.throwIfError(ret, 'readFrame');
   * }
   * ```
   *
   * @see {@link seekFrame} To seek before reading
   */
  async readFrame(pkt: Packet): Promise<number> {
    return await this.native.readFrame(pkt.getNative());
  }

  /**
   * Seek to timestamp in stream.
   *
   * Seeks to the keyframe at or before the given timestamp.
   *
   * Direct mapping to av_seek_frame().
   *
   * @param streamIndex - Stream to seek in (-1 for default)
   * @param timestamp - Target timestamp in stream time base
   * @param flags - Seek flags (AVSEEK_FLAG_*)
   * @returns >=0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_EOF: Seek beyond file
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVSEEK_FLAG_BACKWARD } from 'node-av/constants';
   *
   * // Seek to 10 seconds (assuming 1/1000 time base)
   * const ret = await ctx.seekFrame(videoStreamIndex, 10000n, AVSEEK_FLAG_BACKWARD);
   * FFmpegError.throwIfError(ret, 'seekFrame');
   * ```
   *
   * @see {@link seekFile} For more precise seeking
   */
  async seekFrame(streamIndex: number, timestamp: bigint, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    return await this.native.seekFrame(streamIndex, timestamp, flags);
  }

  /**
   * Seek to timestamp with bounds.
   *
   * More precise seeking with min/max timestamp bounds.
   *
   * Direct mapping to avformat_seek_file().
   *
   * @param streamIndex - Stream to seek in (-1 for default)
   * @param minTs - Minimum acceptable timestamp
   * @param ts - Target timestamp
   * @param maxTs - Maximum acceptable timestamp
   * @param flags - Seek flags
   * @returns >=0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Seek to 10s with 0.5s tolerance
   * const target = 10000n;
   * const ret = await ctx.seekFile(
   *   -1,
   *   target - 500n,
   *   target,
   *   target + 500n
   * );
   * FFmpegError.throwIfError(ret, 'seekFile');
   * ```
   *
   * @see {@link seekFrame} For simpler seeking
   */
  async seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    return await this.native.seekFile(streamIndex, minTs, ts, maxTs, flags);
  }

  /**
   * Write file header.
   *
   * Writes the file header and initializes output.
   * Must be called before writing packets.
   *
   * Direct mapping to avformat_write_header().
   *
   * @param options - Muxer-specific options
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.writeHeader();
   * FFmpegError.throwIfError(ret, 'writeHeader');
   * // Now ready to write packets
   * ```
   *
   * @see {@link writeTrailer} To finalize file
   * @see {@link writeFrame} To write packets
   */
  async writeHeader(options: Dictionary | null = null): Promise<number> {
    return await this.native.writeHeader(options?.getNative() ?? null);
  }

  /**
   * Write packet to output.
   *
   * Writes a packet directly without interleaving.
   * Caller must handle correct interleaving.
   *
   * Direct mapping to av_write_frame().
   *
   * @param pkt - Packet to write (null to flush)
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid packet
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.writeFrame(packet);
   * FFmpegError.throwIfError(ret, 'writeFrame');
   * ```
   *
   * @see {@link interleavedWriteFrame} For automatic interleaving
   */
  async writeFrame(pkt: Packet | null): Promise<number> {
    return await this.native.writeFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write packet with automatic interleaving.
   *
   * Writes packet with proper interleaving for muxing.
   * Preferred method for writing packets.
   *
   * Direct mapping to av_interleaved_write_frame().
   *
   * @param pkt - Packet to write (null to flush)
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid packet
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Write with proper interleaving
   * const ret = await ctx.interleavedWriteFrame(packet);
   * FFmpegError.throwIfError(ret, 'interleavedWriteFrame');
   *
   * // Flush buffered packets
   * await ctx.interleavedWriteFrame(null);
   * ```
   *
   * @see {@link writeFrame} For direct writing
   */
  async interleavedWriteFrame(pkt: Packet | null): Promise<number> {
    return await this.native.interleavedWriteFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write file trailer.
   *
   * Finalizes the output file, writing index and metadata.
   * Must be called to properly close output files.
   *
   * Direct mapping to av_write_trailer().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await ctx.writeTrailer();
   * FFmpegError.throwIfError(ret, 'writeTrailer');
   * // File is now finalized
   * ```
   *
   * @see {@link writeHeader} Must be called first
   */
  async writeTrailer(): Promise<number> {
    return await this.native.writeTrailer();
  }

  /**
   * Flush buffered data.
   *
   * Flushes any buffered packets in muxers.
   *
   * Direct mapping to avio_flush().
   *
   * @example
   * ```typescript
   * ctx.flush();
   * // Buffered data written to output
   * ```
   */
  flush(): void {
    this.native.flush();
  }

  /**
   * Print format information.
   *
   * Dumps human-readable format info to stderr.
   * Useful for debugging.
   *
   * Direct mapping to av_dump_format().
   *
   * @param index - Stream index to highlight (-1 for none)
   * @param url - URL to display
   * @param isOutput - True for output format, false for input
   *
   * @example
   * ```typescript
   * // Dump input format info
   * ctx.dumpFormat(0, 'input.mp4', false);
   *
   * // Dump output format info
   * ctx.dumpFormat(0, 'output.mp4', true);
   * ```
   */
  dumpFormat(index: number, url: string, isOutput: boolean): void {
    this.native.dumpFormat(index, url, isOutput);
  }

  /**
   * Find the best stream of a given type.
   *
   * Selects the most suitable stream (e.g., default audio/video).
   *
   * Direct mapping to av_find_best_stream().
   *
   * @param type - Media type to find (AVMEDIA_TYPE_*)
   * @param wantedStreamNb - Preferred stream index (-1 for auto)
   * @param relatedStream - Related stream for audio/video sync (-1 for none)
   * @returns Stream index, or negative AVERROR if not found
   *
   * @example
   * ```typescript
   * import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';
   *
   * const videoIndex = ctx.findBestStream(AVMEDIA_TYPE_VIDEO);
   * if (videoIndex >= 0) {
   *   console.log(`Best video stream: ${videoIndex}`);
   * }
   *
   * const audioIndex = ctx.findBestStream(AVMEDIA_TYPE_AUDIO);
   * if (audioIndex >= 0) {
   *   console.log(`Best audio stream: ${audioIndex}`);
   * }
   * ```
   */
  findBestStream(type: AVMediaType, wantedStreamNb?: number, relatedStream?: number): number;
  /**
   * Find the best stream and its decoder.
   *
   * @param type - Media type to find
   * @param wantedStreamNb - Preferred stream index
   * @param relatedStream - Related stream index
   * @param wantDecoder - True to also find decoder
   * @param flags - Reserved flags
   * @returns Object with stream index and decoder
   */
  findBestStream(type: AVMediaType, wantedStreamNb: number, relatedStream: number, wantDecoder: true, flags?: number): { streamIndex: number; decoder: Codec | null };
  findBestStream(type: AVMediaType, wantedStreamNb = -1, relatedStream = -1, wantDecoder = false, flags = 0): number | { streamIndex: number; decoder: Codec | null } {
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

    return this.native.findBestStream(type, wantedStreamNb, relatedStream, false, flags ?? 0) as number;
  }

  /**
   * Add a new stream to output context.
   *
   * Creates a new stream for writing.
   *
   * Direct mapping to avformat_new_stream().
   *
   * @param c - Codec for the stream (optional)
   * @returns New stream instance
   *
   * @example
   * ```typescript
   * import { Codec } from 'node-av';
   * import { AV_CODEC_ID_H264 } from 'node-av/constants';
   *
   * const codec = Codec.findEncoder(AV_CODEC_ID_H264);
   * const stream = ctx.newStream(codec);
   * stream.id = ctx.nbStreams - 1;
   * ```
   *
   * @see {@link Stream} For stream configuration
   */
  newStream(c: Codec | null = null): Stream {
    const nativeStream = this.native.newStream(c?.getNative() ?? null);
    return new Stream(nativeStream);
  }

  /**
   * Get the underlying native FormatContext object.
   *
   * @returns The native FormatContext binding object
   *
   * @internal
   */
  getNative(): NativeFormatContext {
    return this.native;
  }

  /**
   * Dispose of the format context.
   *
   * Implements the AsyncDisposable interface for automatic cleanup.
   * Closes input/output and frees resources.
   *
   * @returns Promise that resolves when disposed
   *
   * @example
   * ```typescript
   * {
   *   await using ctx = new FormatContext();
   *   await ctx.openInput('input.mp4');
   *   // Use context...
   * } // Automatically closed and freed
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.native[Symbol.asyncDispose]();
  }
}
