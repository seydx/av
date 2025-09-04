import { open } from 'fs/promises';
import { resolve } from 'path';

import { AVFLAG_NONE, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO } from '../constants/constants.js';
import { avGetPixFmtName, avGetSampleFmtName, Dictionary, FFmpegError, FormatContext, InputFormat, Packet, Rational } from '../lib/index.js';
import { IOStream } from './io-stream.js';

import type { AVMediaType, AVSeekFlag } from '../constants/constants.js';
import type { IOContext, Stream } from '../lib/index.js';
import type { MediaInputOptions, RawData } from './types.js';

/**
 * High-level media input for reading and demuxing media files.
 *
 * Provides simplified access to media streams, packets, and metadata.
 * Handles file opening, format detection, and stream information extraction.
 * Supports files, URLs, buffers, and raw data input with automatic cleanup.
 * Essential component for media processing pipelines and transcoding.
 *
 * @example
 * ```typescript
 * import { MediaInput } from 'node-av/api';
 *
 * // Open media file
 * await using input = await MediaInput.open('video.mp4');
 * console.log(`Format: ${input.formatName}`);
 * console.log(`Duration: ${input.duration}s`);
 *
 * // Process packets
 * for await (const packet of input.packets()) {
 *   console.log(`Packet from stream ${packet.streamIndex}`);
 *   packet.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // From buffer
 * const buffer = await fs.readFile('video.mp4');
 * await using input = await MediaInput.open(buffer);
 *
 * // Access streams
 * const videoStream = input.video();
 * const audioStream = input.audio();
 * ```
 *
 * @see {@link MediaOutput} For writing media files
 * @see {@link Decoder} For decoding packets to frames
 * @see {@link FormatContext} For low-level API
 */
export class MediaInput implements AsyncDisposable {
  private formatContext: FormatContext;
  private _streams: Stream[] = [];
  private ioContext?: IOContext;

  /**
   * @param formatContext - Opened format context
   * @internal
   */
  private constructor(formatContext: FormatContext) {
    this.formatContext = formatContext;
  }

  /**
   * Probe media format without fully opening the file.
   *
   * Detects format by analyzing file headers and content.
   * Useful for format validation before processing.
   *
   * Direct mapping to av_probe_input_format().
   *
   * @param input - File path or buffer to probe
   * @returns Format information or null if unrecognized
   *
   * @example
   * ```typescript
   * const info = await MediaInput.probeFormat('video.mp4');
   * if (info) {
   *   console.log(`Format: ${info.format}`);
   *   console.log(`Confidence: ${info.confidence}%`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Probe from buffer
   * const buffer = await fs.readFile('video.webm');
   * const info = await MediaInput.probeFormat(buffer);
   * console.log(`MIME type: ${info?.mimeType}`);
   * ```
   *
   * @see {@link InputFormat.probe} For low-level probing
   */
  static async probeFormat(input: string | Buffer): Promise<{
    format: string;
    longName?: string;
    extensions?: string;
    mimeType?: string;
    confidence: number;
  } | null> {
    try {
      if (Buffer.isBuffer(input)) {
        // Probe from buffer
        const format = InputFormat.probe(input);
        if (!format) {
          return null;
        }

        return {
          format: format.name ?? 'unknown',
          longName: format.longName ?? undefined,
          extensions: format.extensions ?? undefined,
          mimeType: format.mimeType ?? undefined,
          confidence: 100, // Direct probe always has high confidence
        };
      } else {
        // For files, read first part and probe
        let fileHandle;
        try {
          fileHandle = await open(input, 'r');
          // Read first 64KB for probing
          const buffer = Buffer.alloc(65536);
          const { bytesRead } = await fileHandle.read(buffer, 0, 65536, 0);

          const probeBuffer = buffer.subarray(0, bytesRead);
          const format = InputFormat.probe(probeBuffer, input);

          if (!format) {
            return null;
          }

          return {
            format: format.name ?? 'unknown',
            longName: format.longName ?? undefined,
            extensions: format.extensions ?? undefined,
            mimeType: format.mimeType ?? undefined,
            confidence: 90, // File-based probe with filename hint
          };
        } catch {
          // If file reading fails, return null
          return null;
        } finally {
          await fileHandle?.close();
        }
      }
    } catch {
      return null;
    }
  }

  /**
   * Open media from file, URL, buffer, or raw data.
   *
   * Automatically detects format and extracts stream information.
   * Supports various input sources with flexible configuration.
   * Creates demuxer ready for packet extraction.
   *
   * Direct mapping to avformat_open_input() and avformat_find_stream_info().
   *
   * @param input - File path, URL, buffer, or raw data descriptor
   * @param options - Input configuration options
   * @returns Opened media input instance
   *
   * @throws {Error} If format not found or open fails
   * @throws {FFmpegError} If FFmpeg operations fail
   *
   * @example
   * ```typescript
   * // Open file
   * await using input = await MediaInput.open('video.mp4');
   * ```
   *
   * @example
   * ```typescript
   * // Open URL
   * await using input = await MediaInput.open('http://example.com/stream.m3u8');
   * ```
   *
   * @example
   * ```typescript
   * // Open with options
   * await using input = await MediaInput.open('rtsp://camera.local', {
   *   format: 'rtsp',
   *   options: {
   *     rtsp_transport: 'tcp',
   *     analyzeduration: '5000000'
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Open raw video data
   * await using input = await MediaInput.open({
   *   type: 'video',
   *   input: rawBuffer,
   *   width: 1920,
   *   height: 1080,
   *   pixelFormat: AV_PIX_FMT_YUV420P,
   *   frameRate: { num: 30, den: 1 }
   * });
   * ```
   *
   * @see {@link MediaInputOptions} For configuration options
   * @see {@link RawData} For raw data input
   */
  static async open(input: string | Buffer, options?: MediaInputOptions): Promise<MediaInput>;
  static async open(rawData: RawData, options?: MediaInputOptions): Promise<MediaInput>;
  static async open(input: string | Buffer | RawData, options: MediaInputOptions = {}): Promise<MediaInput> {
    // Check if input is raw data
    if (typeof input === 'object' && 'type' in input && ('width' in input || 'sampleRate' in input)) {
      // Build options for raw data
      const rawOptions: MediaInputOptions = {
        bufferSize: options.bufferSize,
        format: options.format ?? (input.type === 'video' ? 'rawvideo' : 's16le'),
        options: {
          ...options.options,
        },
      };

      if (input.type === 'video') {
        rawOptions.options = {
          ...rawOptions.options,
          video_size: `${input.width}x${input.height}`,
          pixel_format: avGetPixFmtName(input.pixelFormat) ?? 'yuv420p',
          framerate: new Rational(input.frameRate.num, input.frameRate.den).toString(),
        };
      } else {
        rawOptions.options = {
          ...rawOptions.options,
          sample_rate: input.sampleRate,
          channels: input.channels,
          sample_fmt: avGetSampleFmtName(input.sampleFormat) ?? 's16le',
        };
      }

      // Open with the raw data source
      return MediaInput.open(input.input, rawOptions);
    }

    // Original implementation for non-raw data
    const formatContext = new FormatContext();
    let ioContext: IOContext | undefined;
    let optionsDict: Dictionary | null = null;
    let inputFormat: InputFormat | null = null;

    try {
      // Create options dictionary if options are provided
      if (options.options && Object.keys(options.options).length > 0) {
        // Convert all values to strings for FFmpeg
        const stringOptions: Record<string, string> = {};
        for (const [key, value] of Object.entries(options.options)) {
          stringOptions[key] = String(value);
        }
        optionsDict = Dictionary.fromObject(stringOptions);
      }

      // Find input format if specified
      if (options.format) {
        inputFormat = InputFormat.findInputFormat(options.format);
        if (!inputFormat) {
          throw new Error(`Input format '${options.format}' not found`);
        }
      }

      if (typeof input === 'string') {
        // File path or URL - resolve relative paths to absolute
        // Check if it's a URL (starts with protocol://) or a file path
        const isUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input);
        const resolvedInput = isUrl ? input : resolve(input);

        const ret = await formatContext.openInput(resolvedInput, inputFormat, optionsDict);
        FFmpegError.throwIfError(ret, 'Failed to open input');
      } else if (Buffer.isBuffer(input)) {
        // Validate buffer is not empty
        if (input.length === 0) {
          throw new Error('Cannot open media from empty buffer');
        }
        // From buffer - allocate context first for custom I/O
        formatContext.allocContext();
        ioContext = IOStream.create(input, { bufferSize: options.bufferSize });
        formatContext.pb = ioContext;
        const ret = await formatContext.openInput('', inputFormat, optionsDict);
        FFmpegError.throwIfError(ret, 'Failed to open input from buffer');
      } else {
        throw new TypeError('Invalid input type. Expected file path, URL, or Buffer');
      }

      // Find stream information
      const ret = await formatContext.findStreamInfo(null);
      FFmpegError.throwIfError(ret, 'Failed to find stream info');

      const mediaInput = new MediaInput(formatContext);
      mediaInput.ioContext = ioContext;

      // After successful creation, streams should be available
      mediaInput._streams = formatContext.streams ?? [];

      return mediaInput;
    } catch (error) {
      // Clean up only on error
      if (ioContext) {
        // Clear the pb reference first
        formatContext.pb = null;
        // Free the IOContext
        ioContext.freeContext();
      }
      // Clean up FormatContext
      await formatContext.closeInput();
      throw error;
    } finally {
      // Clean up options dictionary
      if (optionsDict) {
        optionsDict.free();
      }
    }
  }

  /**
   * Get all streams in the media.
   *
   * @example
   * ```typescript
   * for (const stream of input.streams) {
   *   console.log(`Stream ${stream.index}: ${stream.codecpar.codecType}`);
   * }
   * ```
   */
  get streams(): Stream[] {
    return this._streams;
  }

  /**
   * Get media duration in seconds.
   *
   * Returns 0 if duration is unknown or not available.
   *
   * @example
   * ```typescript
   * console.log(`Duration: ${input.duration} seconds`);
   * ```
   */
  get duration(): number {
    const duration = this.formatContext.duration;
    if (!duration || duration <= 0) return 0;
    // Convert from AV_TIME_BASE (microseconds) to seconds
    return Number(duration) / 1000000;
  }

  /**
   * Get media bitrate in kilobits per second.
   *
   * Returns 0 if bitrate is unknown.
   *
   * @example
   * ```typescript
   * console.log(`Bitrate: ${input.bitRate} kbps`);
   * ```
   */
  get bitRate(): number {
    const bitrate = this.formatContext.bitRate;
    if (!bitrate || bitrate <= 0) return 0;
    // Convert from bits per second to kilobits per second
    return Number(bitrate) / 1000;
  }

  /**
   * Get media metadata.
   *
   * Returns all metadata tags as key-value pairs.
   *
   * @example
   * ```typescript
   * const metadata = input.metadata;
   * console.log(`Title: ${metadata.title}`);
   * console.log(`Artist: ${metadata.artist}`);
   * ```
   */
  get metadata(): Record<string, string> {
    return this.formatContext.metadata?.getAll() ?? {};
  }

  /**
   * Get format name.
   *
   * @example
   * ```typescript
   * console.log(`Format: ${input.formatName}`); // "mov,mp4,m4a,3gp,3g2,mj2"
   * ```
   */
  get formatName(): string {
    return this.formatContext.iformat?.name ?? 'unknown';
  }

  /**
   * Get format long name.
   *
   * @example
   * ```typescript
   * console.log(`Format: ${input.formatLongName}`); // "QuickTime / MOV"
   * ```
   */
  get formatLongName(): string {
    return this.formatContext.iformat?.longName ?? 'Unknown Format';
  }

  /**
   * Get video stream by index.
   *
   * Returns the nth video stream (0-based index).
   * Returns undefined if stream doesn't exist.
   *
   * @param index - Video stream index (default: 0)
   * @returns Video stream or undefined
   *
   * @example
   * ```typescript
   * const videoStream = input.video();
   * if (videoStream) {
   *   console.log(`Video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second video stream
   * const secondVideo = input.video(1);
   * ```
   *
   * @see {@link audio} For audio streams
   * @see {@link findBestStream} For automatic selection
   */
  video(index = 0): Stream | undefined {
    const streams = this._streams.filter((s) => s.codecpar.codecType === AVMEDIA_TYPE_VIDEO);
    return streams[index];
  }

  /**
   * Get audio stream by index.
   *
   * Returns the nth audio stream (0-based index).
   * Returns undefined if stream doesn't exist.
   *
   * @param index - Audio stream index (default: 0)
   * @returns Audio stream or undefined
   *
   * @example
   * ```typescript
   * const audioStream = input.audio();
   * if (audioStream) {
   *   console.log(`Audio: ${audioStream.codecpar.sampleRate}Hz`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Get second audio stream
   * const secondAudio = input.audio(1);
   * ```
   *
   * @see {@link video} For video streams
   * @see {@link findBestStream} For automatic selection
   */
  audio(index = 0): Stream | undefined {
    const streams = this._streams.filter((s) => s.codecpar.codecType === AVMEDIA_TYPE_AUDIO);
    return streams[index];
  }

  /**
   * Find the best stream of a given type.
   *
   * Uses FFmpeg's stream selection algorithm.
   * Considers codec support, default flags, and quality.
   *
   * Direct mapping to av_find_best_stream().
   *
   * @param type - Media type to find
   * @returns Best stream or undefined if not found
   *
   * @example
   * ```typescript
   * import { AVMEDIA_TYPE_VIDEO } from 'node-av/constants';
   *
   * const bestVideo = input.findBestStream(AVMEDIA_TYPE_VIDEO);
   * if (bestVideo) {
   *   const decoder = await Decoder.create(bestVideo);
   * }
   * ```
   *
   * @see {@link video} For direct video stream access
   * @see {@link audio} For direct audio stream access
   */
  findBestStream(type: AVMediaType): Stream | undefined {
    const bestStreamIndex = this.formatContext.findBestStream(type);
    return this._streams.find((s) => s.index === bestStreamIndex);
  }

  /**
   * Read packets from media as async generator.
   *
   * Yields demuxed packets for processing.
   * Automatically handles packet memory management.
   * Optionally filters packets by stream index.
   *
   * Direct mapping to av_read_frame().
   *
   * @param index - Optional stream index to filter
   * @yields Demuxed packets (must be freed by caller)
   * @throws {Error} If packet cloning fails
   *
   * @example
   * ```typescript
   * // Read all packets
   * for await (const packet of input.packets()) {
   *   console.log(`Packet: stream=${packet.streamIndex}, pts=${packet.pts}`);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Read only video packets
   * const videoStream = input.video();
   * for await (const packet of input.packets(videoStream.index)) {
   *   // Process video packet
   *   packet.free();
   * }
   * ```
   *
   * @see {@link Decoder.frames} For decoding packets
   */
  async *packets(index?: number): AsyncGenerator<Packet> {
    const packet = new Packet();
    packet.alloc();

    try {
      while (true) {
        const ret = await this.formatContext.readFrame(packet);
        if (ret < 0) {
          // End of file or error
          break;
        }

        if (index === undefined || packet.streamIndex === index) {
          // Clone the packet for the user
          // This creates a new Packet object that shares the same data buffer
          // through reference counting. The data won't be freed until both
          // the original and the clone are unreferenced.
          const cloned = packet.clone();
          if (!cloned) {
            throw new Error('Failed to clone packet (out of memory)');
          }
          yield cloned;
        }
        // Unreference the original packet's data buffer
        // This allows us to reuse the packet object for the next readFrame()
        // The data itself is still alive because the clone has a reference
        packet.unref();
      }
    } finally {
      packet.free();
    }
  }

  /**
   * Seek to timestamp in media.
   *
   * Seeks to the specified position in seconds.
   * Can seek in specific stream or globally.
   *
   * Direct mapping to av_seek_frame().
   *
   * @param timestamp - Target position in seconds
   * @param streamIndex - Stream index or -1 for global (default: -1)
   * @param flags - Seek flags (default: AVFLAG_NONE)
   * @returns 0 on success, negative on error
   *
   * @example
   * ```typescript
   * // Seek to 30 seconds
   * const ret = await input.seek(30);
   * FFmpegError.throwIfError(ret, 'seek failed');
   * ```
   *
   * @example
   * ```typescript
   * import { AVSEEK_FLAG_BACKWARD } from 'node-av/constants';
   *
   * // Seek to keyframe before 60 seconds
   * await input.seek(60, -1, AVSEEK_FLAG_BACKWARD);
   * ```
   *
   * @see {@link AVSeekFlag} For seek flags
   */
  async seek(timestamp: number, streamIndex = -1, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    // Convert seconds to AV_TIME_BASE
    const ts = BigInt(Math.floor(timestamp * 1000000));
    return this.formatContext.seekFrame(streamIndex, ts, flags);
  }

  /**
   * Close media input and free resources.
   *
   * Releases format context and I/O context.
   * Safe to call multiple times.
   * Automatically called by Symbol.asyncDispose.
   *
   * Direct mapping to avformat_close_input().
   *
   * @example
   * ```typescript
   * const input = await MediaInput.open('video.mp4');
   * try {
   *   // Use input
   * } finally {
   *   await input.close();
   * }
   * ```
   *
   * @see {@link Symbol.asyncDispose} For automatic cleanup
   */
  async close(): Promise<void> {
    // IMPORTANT: Clear pb reference FIRST to prevent use-after-free
    if (this.ioContext) {
      this.formatContext.pb = null;
    }

    // Close FormatContext
    await this.formatContext.closeInput();

    // NOW we can safely free the IOContext
    if (this.ioContext) {
      this.ioContext.freeContext();
      this.ioContext = undefined;
    }
  }

  /**
   * Get underlying format context.
   *
   * Returns the internal format context for advanced operations.
   *
   * @returns Format context
   *
   * @internal
   */
  getFormatContext(): FormatContext {
    return this.formatContext;
  }

  /**
   * Dispose of media input.
   *
   * Implements AsyncDisposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   await using input = await MediaInput.open('video.mp4');
   *   // Process media...
   * } // Automatically closed
   * ```
   *
   * @see {@link close} For manual cleanup
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
