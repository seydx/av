import { bindings } from './binding.js';
import { Codec } from './codec.js';
import { AVFLAG_NONE } from './constants.js';
import { Dictionary } from './dictionary.js';
import { InputFormat } from './input-format.js';
import { OptionMember } from './option.js';
import { OutputFormat } from './output-format.js';
import { Stream } from './stream.js';

import type { AVFormatFlag, AVMediaType, AVSeekFlag } from './constants.js';
import type { IOContext } from './io-context.js';
import type { NativeFormatContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * FFmpeg format context for demuxing and muxing.
 *
 * Central structure for media file handling, managing both input (demuxing) and output (muxing).
 * Provides full control over allocation, configuration and lifecycle with no hidden operations.
 * Handles container formats, streams, metadata, and packet I/O operations.
 *
 * Direct mapping to FFmpeg's AVFormatContext.
 *
 * @example
 * ```typescript
 * import { FormatContext, Packet, FFmpegError } from 'node-av';
 *
 * // Demuxing - full control over every step
 * const ctx = new FormatContext();
 * ctx.allocContext();
 *
 * const ret = await ctx.openInput('video.mp4', null, null);
 * FFmpegError.throwIfError(ret, 'openInput');
 *
 * const infoRet = await ctx.findStreamInfo(null);
 * FFmpegError.throwIfError(infoRet, 'findStreamInfo');
 *
 * const packet = new Packet();
 * packet.alloc();
 *
 * while (true) {
 *   const readRet = await ctx.readFrame(packet);
 *   if (readRet < 0) break; // EOF or error
 *   // Process packet
 *   packet.unref();
 * }
 *
 * await ctx.closeInput();
 * ctx.freeContext();
 * ```
 *
 * @example
 * ```typescript
 * import { FormatContext, FFmpegError } from 'node-av';
 *
 * // Muxing - explicit control
 * const ctx = new FormatContext();
 * const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4');
 * FFmpegError.throwIfError(ret, 'allocOutputContext2');
 *
 * // Add streams
 * const stream = ctx.newStream(null);
 *
 * // Write header
 * const headerRet = await ctx.writeHeader(null);
 * FFmpegError.throwIfError(headerRet, 'writeHeader');
 *
 * // Write packets
 * const writeRet = await ctx.interleavedWriteFrame(packet);
 * FFmpegError.throwIfError(writeRet, 'interleavedWriteFrame');
 *
 * // Finalize
 * const trailerRet = await ctx.writeTrailer();
 * FFmpegError.throwIfError(trailerRet, 'writeTrailer');
 * ctx.freeContext();
 * ```
 *
 * @see {@link InputFormat} For input format handling
 * @see {@link OutputFormat} For output format handling
 * @see {@link Stream} For stream management
 * @see {@link Packet} For packet handling
 */
export class FormatContext extends OptionMember<NativeFormatContext> implements AsyncDisposable, NativeWrapper<NativeFormatContext> {
  private _ioContext: IOContext | null = null;

  /**
   * Create a new format context.
   *
   * The context is uninitialized - you must call allocContext() or allocOutputContext2() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around AVFormatContext.
   *
   * @example
   * ```typescript
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * const ctx = new FormatContext();
   * ctx.allocContext(); // For demuxing
   * // OR
   * const ret = ctx.allocOutputContext2(null, 'mp4', 'output.mp4'); // For muxing
   * FFmpegError.throwIfError(ret, 'allocOutputContext2');
   * ```
   */
  constructor() {
    super(new bindings.FormatContext());
  }

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
   *
   * The FormatContext keeps track of the IOContext set by the user.
   * This prevents ownership confusion.
   */
  get pb(): IOContext | null {
    return this._ioContext;
  }

  set pb(value: IOContext | null) {
    this._ioContext = value;
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

  /**
   * Number of programs in the stream.
   *
   * Direct mapping to AVFormatContext->nb_programs
   *
   * - demuxing: Set by libavformat
   */
  get nbPrograms(): number {
    return this.native.nbPrograms;
  }

  /**
   * Current position in bytes (avio_tell).
   *
   * Direct mapping to avio_tell(AVFormatContext->pb)
   *
   * Returns the current byte position in the I/O context.
   * - demuxing: Current read position
   * - muxing: Current write position
   */
  get pbBytes(): bigint {
    return this.native.pbBytes;
  }

  /**
   * Format probing score (0-100).
   *
   * Direct mapping to AVFormatContext->probe_score
   *
   * Indicates confidence in format detection (higher is better).
   * - demuxing: Set by format probing
   */
  get probeScore(): number {
    return this.native.probeScore;
  }

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
    if (!oformat && !formatName && !filename) {
      throw new Error('At least one of oformat, formatName, or filename must be specified');
    }

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
   * await ctx.closeInput();
   * // Input is closed and context is freed
   * ```
   */
  async closeInput(): Promise<void> {
    return this.native.closeInput();
  }

  /**
   * Open the output file for writing.
   *
   * Must be called after allocOutputContext2() and before writeHeader()
   * for file-based formats (not NOFILE formats).
   *
   * Direct mapping to avio_open()
   *
   * @returns Promise resolving to 0 on success, negative AVERROR on failure:
   *   - 0: Success
   *   - AVERROR(ENOENT): File cannot be created
   *   - AVERROR(EACCES): Permission denied
   *   - AVERROR(EIO): I/O error
   *
   * @example
   * ```typescript
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * ctx.allocOutputContext2(null, null, 'output.mp4');
   * const ret = await ctx.openOutput(); // Opens the file for writing
   * FFmpegError.throwIfError(ret, 'openOutput');
   * await ctx.writeHeader(null);
   * ```
   */
  async openOutput(): Promise<number> {
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
   * await ctx.closeOutput();
   * ctx.freeContext();
   * ```
   */
  async closeOutput(): Promise<void> {
    return this.native.closeOutput();
  }

  /**
   * Open an input stream and read the header.
   *
   * Opens the specified URL, reads the format header, and initializes the stream information.
   * Automatically detects the format if not specified.
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
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * const ret = await ctx.openInput('video.mp4', null, null);
   * FFmpegError.throwIfError(ret, 'openInput');
   * // Context is now open and header is read
   * ```
   */
  async openInput(url: string, fmt: InputFormat | null = null, options: Dictionary | null = null): Promise<number> {
    return this.native.openInput(url, fmt?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Read packets of a media file to get stream information.
   *
   * Analyzes the media file by reading packets to determine stream parameters
   * like codec, dimensions, sample rate, etc. Required after openInput().
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
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * const ret = await ctx.findStreamInfo(null);
   * FFmpegError.throwIfError(ret, 'findStreamInfo');
   * console.log(`Found ${ctx.nbStreams} streams`);
   * ```
   */
  async findStreamInfo(options: Dictionary[] | null = null): Promise<number> {
    return this.native.findStreamInfo(options?.map((d) => d.getNative()) ?? null);
  }

  /**
   * Read the next packet in the file.
   *
   * Reads and returns the next packet from the input file.
   * Packets must be unreferenced after use to free memory.
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
   * import { Packet, FormatContext, FFmpegError, AVERROR_EOF } from 'node-av';
   *
   * const packet = new Packet();
   * packet.alloc();
   *
   * while (true) {
   *   const ret = await ctx.readFrame(packet);
   *   if (ret === AVERROR_EOF) break;
   *   FFmpegError.throwIfError(ret, 'readFrame');
   *
   *   // Process packet
   *   console.log(`Stream ${packet.streamIndex}, PTS: ${packet.pts}`);
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
   * Seeks to the keyframe at or before the specified timestamp.
   * The next packet read will be from the new position.
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
   * import { FormatContext, FFmpegError, AV_TIME_BASE, AVSEEK_FLAG_BACKWARD } from 'node-av';
   *
   * // Seek to 10 seconds
   * const timestamp = 10n * BigInt(AV_TIME_BASE);
   * const ret = await ctx.seekFrame(-1, timestamp, AVSEEK_FLAG_BACKWARD);
   * FFmpegError.throwIfError(ret, 'seekFrame');
   * // Next readFrame will return packet from new position
   * ```
   */
  async seekFrame(streamIndex: number, timestamp: bigint, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    return this.native.seekFrame(streamIndex, timestamp, flags);
  }

  /**
   * Seek to timestamp ts with more control.
   *
   * Seeks to a timestamp within the specified min/max range.
   * More precise than seekFrame() with tolerance control.
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
   * import { FormatContext, FFmpegError, AV_TIME_BASE } from 'node-av';
   *
   * // Seek to timestamp with tolerance
   * const target = 10n * BigInt(AV_TIME_BASE);
   * const tolerance = BigInt(AV_TIME_BASE);
   * const ret = await ctx.seekFile(
   *   -1,
   *   target - tolerance,  // min: 9 seconds
   *   target,             // target: 10 seconds
   *   target + tolerance, // max: 11 seconds
   *   0
   * );
   * FFmpegError.throwIfError(ret, 'seekFile');
   * ```
   */
  async seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    return this.native.seekFile(streamIndex, minTs, ts, maxTs, flags);
  }

  /**
   * Allocate the stream private data and write the stream header.
   *
   * Initializes the output file and writes the file header.
   * Must be called before writing any packets.
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
   * import { Dictionary, FormatContext, FFmpegError } from 'node-av';
   *
   * const options = new Dictionary();
   * options.set('movflags', 'faststart', 0);
   *
   * const ret = await ctx.writeHeader(options);
   * FFmpegError.throwIfError(ret, 'writeHeader');
   * options.free();
   * // Header written, ready to write packets
   * ```
   */
  async writeHeader(options: Dictionary | null = null): Promise<number> {
    return this.native.writeHeader(options?.getNative() ?? null);
  }

  /**
   * Write a packet to an output media file.
   *
   * Writes a packet directly without reordering.
   * Use interleavedWriteFrame() for automatic interleaving.
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
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * const ret = await ctx.writeFrame(packet);
   * FFmpegError.throwIfError(ret, 'writeFrame');
   *
   * // Flush at the end
   * const flushRet = await ctx.writeFrame(null);
   * FFmpegError.throwIfError(flushRet, 'writeFrame flush');
   * ```
   *
   * @note This function does NOT take ownership of the packet.
   *
   * @see {@link interleavedWriteFrame} For automatic interleaving
   */
  async writeFrame(pkt: Packet | null): Promise<number> {
    return this.native.writeFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write a packet to an output media file ensuring correct interleaving.
   *
   * Automatically interleaves packets from different streams based on DTS.
   * Preferred method for writing packets in most cases.
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
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * // Write packets with automatic interleaving
   * const ret = await ctx.interleavedWriteFrame(packet);
   * FFmpegError.throwIfError(ret, 'interleavedWriteFrame');
   * // Packet is automatically freed after writing
   * ```
   *
   * @note This function TAKES OWNERSHIP of the packet and will free it.
   *
   * @see {@link writeFrame} For manual interleaving control
   */
  async interleavedWriteFrame(pkt: Packet | null): Promise<number> {
    return this.native.interleavedWriteFrame(pkt ? pkt.getNative() : null);
  }

  /**
   * Write the stream trailer to an output media file.
   *
   * Finalizes the output file by writing the trailer.
   * Must be called after all packets have been written.
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
   * import { FormatContext, FFmpegError } from 'node-av';
   *
   * // Finalize the output file
   * const ret = await ctx.writeTrailer();
   * FFmpegError.throwIfError(ret, 'writeTrailer');
   * // File is now complete and finalized
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
   * import { FormatContext } from 'node-av';
   *
   * // Flush buffered data
   * ctx.flush();
   * // All buffered data written to output
   * ```
   */
  flush(): void {
    return this.native.flush();
  }

  /**
   * Dump format information to stderr.
   *
   * Prints detailed information about the format and streams to stderr.
   * Useful for debugging and understanding file structure.
   *
   * Direct mapping to av_dump_format()
   *
   * @param index - Stream index or program index to dump
   * @param url - URL or filename to display
   * @param isOutput - true for output format, false for input format
   *
   * @example
   * ```typescript
   * import { FormatContext } from 'node-av';
   *
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
   * The best stream is determined according to various heuristics as the most
   * likely to be what the user expects.
   *
   * Direct mapping to av_find_best_stream()
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
   * import { FormatContext, FFmpegError, AVMEDIA_TYPE_VIDEO } from 'node-av';
   *
   * // Find best video stream
   * const videoStreamIndex = ctx.findBestStream(
   *   AVMEDIA_TYPE_VIDEO,
   *   -1,  // automatic selection
   *   -1   // no related stream
   * );
   *
   * if (videoStreamIndex < 0) {
   *   FFmpegError.throwIfError(videoStreamIndex, 'findBestStream');
   * }
   * const videoStream = ctx.streams[videoStreamIndex];
   * // Process video stream
   * ```
   */
  findBestStream(type: AVMediaType, wantedStreamNb?: number, relatedStream?: number): number;

  /**
   * Find the "best" stream in the file and optionally return the decoder.
   *
   * The best stream is determined according to various heuristics as the most
   * likely to be what the user expects.
   *
   * Direct mapping to av_find_best_stream()
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
   * import { FormatContext, FFmpegError, AVMEDIA_TYPE_VIDEO } from 'node-av';
   *
   * // Find best video stream with decoder
   * const result = ctx.findBestStream(
   *   AVMEDIA_TYPE_VIDEO,
   *   -1,  // automatic selection
   *   -1,  // no related stream
   *   true, // want decoder
   *   0
   * );
   *
   * if (result.streamIndex < 0) {
   *   FFmpegError.throwIfError(result.streamIndex, 'findBestStream');
   * }
   * const videoStream = ctx.streams[result.streamIndex];
   * const decoder = result.decoder;
   * // Use decoder directly
   * ```
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
   * Add a new stream to the media file.
   *
   * Creates a new stream in the output format context.
   * The stream must be configured before calling writeHeader().
   *
   * Direct mapping to avformat_new_stream()
   *
   * @param c - Codec to use for the stream. May be null
   *
   * @returns The newly created stream
   *
   * @throws {Error} If stream creation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * import { FormatContext, Codec, FFmpegError } from 'node-av';
   * import { AV_CODEC_ID_H264, AVMEDIA_TYPE_VIDEO } from 'node-av/constants';
   *
   * // Add a video stream
   * const videoCodec = Codec.findEncoder(AV_CODEC_ID_H264);
   * const videoStream = ctx.newStream(videoCodec);
   *
   * // Configure stream parameters
   * videoStream.codecpar.codecType = AVMEDIA_TYPE_VIDEO;
   * videoStream.codecpar.codecId = AV_CODEC_ID_H264;
   * videoStream.codecpar.width = 1920;
   * videoStream.codecpar.height = 1080;
   * ```
   */
  newStream(c: Codec | null = null): Stream {
    const nativeStream = this.native.newStream(c?.getNative() ?? null);
    return new Stream(nativeStream);
  }

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
   * Dispose of the format context asynchronously.
   *
   * Implements the AsyncDisposable interface for automatic cleanup.
   * Properly handles network connections and I/O operations.
   *
   * @example
   * ```typescript
   * import { FormatContext } from 'node-av';
   *
   * {
   *   await using ctx = new FormatContext();
   *   await ctx.openInput('rtsp://camera/stream');
   *   // ... use context
   * } // Automatically closed when leaving scope
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.native[Symbol.asyncDispose]();
  }
}
