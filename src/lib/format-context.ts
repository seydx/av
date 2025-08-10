import { bindings } from './binding.js';
import { AV_ERROR_EOF } from './constants.js';
import { Dictionary } from './dictionary.js';
import { FFmpegError } from './error.js';
import { InputFormat } from './input-format.js';
import { Options } from './option.js';
import { OutputFormat } from './output-format.js';
import { Stream } from './stream.js';

import type { AVFormatFlag, AVMediaType } from './constants.js';
import type { NativeCodec, NativeFormatContext, NativeIOContext, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Flags for seeking operations
 */
export enum SeekFlags {
  /** Seek backward */
  BACKWARD = 1,
  /** Seeking based on position in bytes */
  BYTE = 2,
  /** Seek to any frame, even non-keyframes */
  ANY = 4,
  /** Seeking based on frame number */
  FRAME = 8,
}

/**
 * Format context for media file I/O and container handling
 *
 * FormatContext manages input/output operations for media files,
 * handling container formats, streams, and metadata. It's the main
 * entry point for reading and writing media files.
 *
 * @example
 * ```typescript
 * // Open an input file
 * const formatContext = new FormatContext('input');
 * formatContext.openInput('video.mp4');
 * formatContext.findStreamInfo();
 *
 * // Read packets
 * const packet = new Packet();
 * while (formatContext.readFrame(packet) >= 0) {
 *   // Process packet
 * }
 *
 * // Create output file
 * const output = new FormatContext('output', null, 'mp4', 'output.mp4');
 * // Add streams and write...
 * ```
 */
export class FormatContext implements Disposable, NativeWrapper<NativeFormatContext> {
  private context: NativeFormatContext; // Native format context binding
  private _options?: Options;

  /**
   * Create a new FormatContext
   * @param type Type of context: 'input' (default) or 'output'
   * @param outputFormat Output format (for output contexts)
   * @param formatName Format name (for output contexts, e.g., 'mp4', 'mkv')
   * @param filename Filename (for output contexts)
   * @example
   * ```typescript
   * // Input context
   * const input = new FormatContext('input');
   *
   * // Output context with format
   * const output = new FormatContext('output', null, 'mp4', 'output.mp4');
   * ```
   */
  constructor(type: 'input' | 'output' = 'input', outputFormat?: OutputFormat | null, formatName?: string, filename?: string) {
    if (type === 'output' && (outputFormat || formatName || filename)) {
      this.context = bindings.FormatContext.allocOutputFormatContext(outputFormat?.getNative() ?? null, formatName, filename);
    } else {
      this.context = bindings.FormatContext.allocFormatContext();
    }
  }

  /**
   * Get all streams in the container
   */
  get streams(): Stream[] {
    const nativeStreams = this.context.streams;
    return nativeStreams.map((s) => Stream.fromNative(s));
  }

  /**
   * Get number of streams
   */
  get nbStreams(): number {
    return this.context.nbStreams;
  }

  /**
   * Get file URL/path
   */
  get url(): string | null {
    return this.context.url;
  }

  /**
   * Get duration in AV_TIME_BASE units
   */
  get duration(): bigint {
    return this.context.duration;
  }

  /**
   * Get start time in AV_TIME_BASE units
   */
  get startTime(): bigint {
    return this.context.startTime;
  }

  /**
   * Get total bit rate
   */
  get bitRate(): bigint {
    return this.context.bitRate;
  }

  /**
   * Get/set metadata dictionary
   */
  get metadata(): Dictionary {
    // Native binding returns a plain object, convert to Dictionary
    const nativeMeta = this.context.metadata;
    if (!nativeMeta) {
      return new Dictionary();
    }
    return Dictionary.fromObject(nativeMeta);
  }

  set metadata(value: Dictionary) {
    // Native binding expects a plain object
    this.context.metadata = value.toObject() as any;
  }

  /**
   * Get/set format flags
   */
  get flags(): AVFormatFlag {
    return this.context.flags;
  }

  set flags(value: AVFormatFlag) {
    this.context.flags = value;
  }

  /**
   * Get/set maximum duration to analyze
   */
  get maxAnalyzeDuration(): bigint {
    return this.context.maxAnalyzeDuration;
  }

  set maxAnalyzeDuration(value: bigint) {
    this.context.maxAnalyzeDuration = value;
  }

  /**
   * Get/set probe size for format detection
   */
  get probesize(): bigint {
    return this.context.probesize;
  }

  set probesize(value: bigint) {
    this.context.probesize = value;
  }

  /**
   * Get AVOptions for this format context
   * Allows runtime configuration of format parameters
   */
  get options(): Options {
    this._options ??= new Options(this.context.options);
    return this._options;
  }

  /**
   * Get input format (for input contexts)
   */
  get inputFormat(): InputFormat | null {
    const native = this.context.inputFormat;
    if (!native) return null;
    return InputFormat.fromNative(native);
  }

  /**
   * Get output format (for output contexts)
   */
  get outputFormat(): OutputFormat | null {
    const native = this.context.outputFormat;
    if (!native) return null;
    return OutputFormat.fromNative(native);
  }

  /**
   * Set I/O context for custom I/O operations
   * @param value IOContext instance or null
   */
  set pb(value: NativeIOContext | NativeWrapper<NativeIOContext> | null) {
    if (value && 'getNative' in value && typeof value.getNative === 'function') {
      this.context.pb = value.getNative();
    } else {
      this.context.pb = value as NativeIOContext | null;
    }
  }

  /**
   * Get I/O context
   * @returns IOContext wrapper if set, null otherwise
   * Note: This returns a non-owning wrapper when the context was created internally by FFmpeg
   */
  get pb(): NativeIOContext | null {
    return this.context.pb;
  }

  /**
   * Allocate an output format context
   * @param outputFormat Optional output format
   * @param formatName Optional format name (e.g., 'mp4', 'mkv')
   * @param filename Optional filename
   */
  allocOutputContext(outputFormat: OutputFormat | null, formatName?: string, filename?: string): void {
    this.context = bindings.FormatContext.allocOutputFormatContext(outputFormat?.getNative() ?? null, formatName, filename);
  }

  /**
   * Open an input file or URL
   * @param url File path or URL to open
   * @param inputFormat Optional format to force
   * @param options Optional format options
   * @throws FFmpegError if opening fails
   * @example
   * ```typescript
   * formatContext.openInput('video.mp4');
   * // With options
   * const options = new Dictionary();
   * options.set('rtsp_transport', 'tcp');
   * formatContext.openInput('rtsp://server/stream', null, options);
   * ```
   */
  openInput(url: string, inputFormat?: InputFormat | null, options?: Dictionary): void {
    // Pass the native binding objects (which are wrapped C++ objects) directly
    // The C++ code will unwrap them to get the actual AVInputFormat* and AVDictionary*
    this.context.openInput(url, inputFormat?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Open an input file or URL (asynchronous)
   * @param url File path or URL to open
   * @param inputFormat Optional specific input format to use
   * @param options Optional format options
   * @returns Promise that resolves when the file is opened
   * @throws FFmpegError if opening fails
   * @example
   * ```typescript
   * await formatContext.openInputAsync('video.mp4');
   * // With options
   * const options = new Dictionary();
   * options.set('rtsp_transport', 'tcp');
   * await formatContext.openInputAsync('rtsp://server/stream', null, options);
   * ```
   */
  async openInputAsync(url: string, inputFormat?: InputFormat | null, options?: Dictionary): Promise<void> {
    await this.context.openInputAsync(url, inputFormat?.getNative() ?? null, options?.getNative() ?? null);
  }

  /**
   * Close the input file
   */
  closeInput(): void {
    this.context.closeInput();
  }

  /**
   * Find and analyze stream information (synchronous)
   * @param options Optional per-stream options
   * @throws FFmpegError if analysis fails
   */
  findStreamInfo(options?: Dictionary): void {
    this.context.findStreamInfo(options?.getNative() ?? null);
  }

  /**
   * Find and analyze stream information (asynchronous)
   * @param options Optional per-stream options
   * @returns Promise that resolves when stream info is found
   * @throws FFmpegError if analysis fails
   */
  async findStreamInfoAsync(options?: Dictionary): Promise<void> {
    await this.context.findStreamInfoAsync(options?.getNative() ?? null);
  }

  /**
   * Find the best stream of a given type
   * @param mediaType Type of stream to find (audio/video/subtitle)
   * @param wantedStreamNb Preferred stream index or -1 for auto
   * @param relatedStream Related stream index or -1
   * @returns Stream index or negative error code
   */
  findBestStream(mediaType: AVMediaType, wantedStreamNb?: number, relatedStream?: number): number {
    return this.context.findBestStream(mediaType, wantedStreamNb ?? -1, relatedStream ?? -1);
  }

  /**
   * Read the next packet from the file (synchronous)
   * @param packet Packet to read data into
   * @returns 0 on success, AV_ERROR_EOF at end of file
   * @throws FFmpegError on read errors
   * @example
   * ```typescript
   * const packet = new Packet();
   * while (formatContext.readFrame(packet) >= 0) {
   *   // Process packet
   *   packet.unref();
   * }
   * ```
   */
  readFrame(packet: Packet): number {
    const ret = this.context.readFrame(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to read frame');
    }
    return ret;
  }

  /**
   * Read the next packet from the file (asynchronous)
   * @param packet Packet to read data into
   * @returns Promise resolving to 0 on success, AV_ERROR_EOF at end of file
   * @throws FFmpegError on read errors
   * @example
   * ```typescript
   * const packet = new Packet();
   * let ret: number;
   * while ((ret = await formatContext.readFrameAsync(packet)) >= 0) {
   *   // Process packet
   *   packet.unref();
   * }
   * ```
   */
  async readFrameAsync(packet: Packet): Promise<number> {
    const ret = await this.context.readFrameAsync(packet.getNative());
    if (ret < 0 && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to read frame');
    }
    return ret;
  }

  /**
   * Seek to a specific timestamp
   * @param streamIndex Stream to seek in (-1 for default)
   * @param timestamp Target timestamp
   * @param flags Seek flags (use SeekFlags enum)
   * @returns 0 on success, negative on error
   */
  seekFrame(streamIndex: number, timestamp: bigint, flags: number): number {
    return this.context.seekFrame(streamIndex, timestamp, flags);
  }

  /**
   * Seek to timestamp with min/max bounds
   * @param streamIndex Stream to seek in
   * @param minTs Minimum acceptable timestamp
   * @param ts Target timestamp
   * @param maxTs Maximum acceptable timestamp
   * @param flags Optional seek flags
   * @returns 0 on success, negative on error
   */
  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags?: number): number {
    return this.context.seekFile(streamIndex, minTs, ts, maxTs, flags ?? 0);
  }

  /**
   * Flush internal buffers
   */
  flush(): void {
    this.context.flush();
  }

  /**
   * Write file header (for output contexts) - synchronous
   * @param options Optional muxer options
   * @throws FFmpegError if writing fails
   */
  writeHeader(options?: Dictionary): void {
    this.context.writeHeader(options?.getNative() ?? null);
  }

  /**
   * Write file header (for output contexts) - asynchronous
   * @param options Optional muxer options
   * @returns Promise that resolves when header is written
   * @throws FFmpegError if writing fails
   */
  async writeHeaderAsync(options?: Dictionary): Promise<void> {
    await this.context.writeHeaderAsync(options?.getNative() ?? null);
  }

  /**
   * Write a packet to the output file - synchronous
   * @param packet Packet to write (null to flush)
   * @returns 0 on success, negative on error
   */
  writeFrame(packet: Packet | null): number {
    return this.context.writeFrame(packet ? packet.getNative() : null);
  }

  /**
   * Write a packet to the output file - asynchronous
   * @param packet Packet to write (null to flush)
   * @returns Promise resolving to 0 on success, negative on error
   */
  async writeFrameAsync(packet: Packet | null): Promise<number> {
    return await this.context.writeFrameAsync(packet ? packet.getNative() : null);
  }

  /**
   * Write packet with proper interleaving
   * @param packet Packet to write (null to flush)
   * @returns 0 on success, negative on error
   */
  writeInterleavedFrame(packet: Packet | null): number {
    return this.context.writeInterleavedFrame(packet ? packet.getNative() : null);
  }

  /**
   * Write packet with proper interleaving (asynchronous)
   * @param packet Packet to write (null to flush)
   * @returns Promise that resolves when the packet is written
   */
  async writeInterleavedFrameAsync(packet: Packet | null): Promise<void> {
    await this.context.writeInterleavedFrameAsync(packet ? packet.getNative() : null);
  }

  /**
   * Write file trailer (for output contexts) - synchronous
   * Must be called after all packets are written
   */
  writeTrailer(): void {
    this.context.writeTrailer();
  }

  /**
   * Write file trailer (for output contexts) - asynchronous
   * Must be called after all packets are written
   * @returns Promise that resolves when trailer is written
   */
  async writeTrailerAsync(): Promise<void> {
    await this.context.writeTrailerAsync();
  }

  /**
   * Create a new stream (for output contexts)
   * @param codec Optional codec to use
   * @returns New stream
   * @example
   * ```typescript
   * const stream = formatContext.newStream();
   * stream.codecParameters.codecType = AVMEDIA_TYPE_VIDEO;
   * stream.codecParameters.codecId = AV_CODEC_ID_H264;
   * ```
   */
  newStream(codec?: NativeCodec): Stream {
    const nativeStream = this.context.newStream(codec ?? null);
    return Stream.fromNative(nativeStream);
  }

  /**
   * Dump format information to stderr
   * @param index Stream index to highlight
   * @param isOutput Whether this is an output context
   */
  dump(index = 0, isOutput = false): void {
    this.context.dump(index, isOutput);
  }

  /**
   * Free the format context and release resources
   */
  free(): void {
    this.context.free();
  }

  /**
   * Dispose of the format context and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native format context for internal use
   * @internal
   */
  getNative(): NativeFormatContext {
    return this.context;
  }
}
