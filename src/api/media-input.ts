/**
 * MediaInput - Unified Input Handler for FFmpeg
 *
 * Provides a high-level interface for opening and reading media from various sources.
 * Supports files, URLs, and Buffers with automatic format detection.
 *
 * Central entry point for all media input operations.
 * Manages FormatContext lifecycle and provides stream information.
 *
 * @module api/media-input
 */

import {
  AVFLAG_NONE,
  avGetPixFmtName,
  avGetSampleFmtName,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_VIDEO,
  Dictionary,
  FFmpegError,
  FormatContext,
  InputFormat,
  Packet,
  Rational,
} from '../lib/index.js';
import { IOStream } from './io-stream.js';

import type { AVMediaType, AVSeekFlag, IOContext, Stream } from '../lib/index.js';
import type { MediaInputOptions, RawData } from './types.js';

/**
 * MediaInput - High-level media input handler.
 *
 * Opens and provides access to media streams from various sources.
 * Automatically detects format and finds stream information.
 *
 * Manages the FormatContext and provides convenient methods for
 * accessing streams, metadata, and packets.
 *
 * @example
 * ```typescript
 * import { MediaInput } from 'node-av/api';
 *
 * // Open from file
 * const media = await MediaInput.open('video.mp4');
 * console.log(`Found ${media.streams.length} streams`);
 * console.log(`Duration: ${media.duration} seconds`);
 *
 * // Open from buffer
 * const buffer = await fs.readFile('video.mp4');
 * const media = await MediaInput.open(buffer);
 *
 * // Iterate packets
 * for await (const packet of media.packets()) {
 *   console.log(`Packet from stream ${packet.streamIndex}`);
 * }
 * ```
 */
export class MediaInput implements AsyncDisposable {
  private formatContext: FormatContext;
  private _streams: Stream[] = [];
  private ioContext?: IOContext; // Store IOContext for cleanup

  /**
   * Create a new MediaInput instance.
   *
   * Private constructor - use MediaInput.open() to create instances.
   *
   * Parses stream information immediately after construction.
   *
   * @param formatContext - Opened FormatContext
   */
  private constructor(formatContext: FormatContext) {
    this.formatContext = formatContext;
    // Streams will be set after findStreamInfo in the static factory
  }

  /**
   * Probe the format of media without fully opening it.
   *
   * Detects the container format and basic information without
   * parsing all stream information. Useful for quick format validation.
   *
   * @param input - File path or Buffer to probe
   *
   * @returns Format information or null if unrecognized
   *
   * @example
   * ```typescript
   * // Probe a file
   * const info = await MediaInput.probeFormat('video.mp4');
   * if (info) {
   *   console.log(`Format: ${info.format}`);
   *   console.log(`Confidence: ${info.confidence}%`);
   * }
   *
   * // Probe a buffer
   * const buffer = await fs.readFile('video.mp4');
   * const info = await MediaInput.probeFormat(buffer);
   * ```
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
        const { open } = await import('fs/promises');
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
   * Open a media input from various sources.
   *
   * Creates a FormatContext and opens the input for reading.
   * Automatically detects format and finds stream information.
   *
   * Uses av_format_open_input() and av_find_stream_info() internally.
   *
   * @param input - File path, URL, or Buffer
   * @param options - Optional configuration for timestamp handling
   *
   * @returns Promise resolving to MediaInput instance
   *
   * @throws {Error} If input cannot be opened or stream info not found
   *
   * @example
   * ```typescript
   * // From file
   * const media = await MediaInput.open('video.mp4');
   *
   * // From URL
   * const media = await MediaInput.open('https://example.com/video.mp4');
   *
   * // From Buffer
   * const buffer = await fs.readFile('video.mp4');
   * const media = await MediaInput.open(buffer);
   * ```
   */
  static async open(input: string | Buffer, options?: MediaInputOptions): Promise<MediaInput>;

  /**
   * Open raw video or audio data.
   *
   * @param rawData - Raw video or audio configuration
   *
   * @returns Promise resolving to MediaInput instance
   *
   * @example
   * ```typescript
   * // Raw video
   * const input = await MediaInput.open({
   *   type: 'video',
   *   data: 'input.yuv',
   *   width: 1280,
   *   height: 720,
   *   pixelFormat: 'yuv420p',
   *   frameRate: 30
   * });
   *
   * // Raw audio
   * const input = await MediaInput.open({
   *   type: 'audio',
   *   data: 'input.pcm',
   *   sampleRate: 48000,
   *   channels: 2,
   *   sampleFormat: 's16le'
   * });
   * ```
   */
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
        // File path or URL
        const ret = await formatContext.openInput(input, inputFormat, optionsDict);
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
   * Get all streams in the container.
   *
   * @returns Array of stream information
   */
  get streams(): Stream[] {
    return this._streams;
  }

  /**
   * Get media duration in seconds.
   *
   * Returns 0 if duration is not available.
   *
   * @returns Duration in seconds
   */
  get duration(): number {
    const duration = this.formatContext.duration;
    if (!duration || duration <= 0) return 0;
    // Convert from AV_TIME_BASE (microseconds) to seconds
    return Number(duration) / 1000000;
  }

  /**
   * Get container metadata.
   *
   * @returns Metadata key-value pairs
   */
  get metadata(): Record<string, string> {
    return this.formatContext.metadata?.getAll() ?? {};
  }

  /**
   * Get container format name.
   *
   * @returns Format name (e.g., 'mov,mp4,m4a,3gp,3g2,mj2')
   */
  get formatName(): string {
    return this.formatContext.iformat?.name ?? 'unknown';
  }

  /**
   * Get container format long name.
   *
   * @returns Format long name (e.g., 'QuickTime / MOV')
   */
  get formatLongName(): string {
    return this.formatContext.iformat?.longName ?? 'Unknown Format';
  }

  /**
   * Get the first video stream.
   *
   * @param index - Video stream index (0 for first, 1 for second, etc.)
   *
   * @returns Stream info or undefined if not found
   *
   * @example
   * ```typescript
   * const videoStream = media.video();
   * if (videoStream) {
   *   console.log(`Video: ${videoStream.width}x${videoStream.height}`);
   * }
   * ```
   */
  video(index = 0): Stream | undefined {
    const streams = this._streams.filter((s) => s.codecpar.codecType === AVMEDIA_TYPE_VIDEO);
    return streams[index];
  }

  /**
   * Get the first audio stream.
   *
   * @param index - Audio stream index (0 for first, 1 for second, etc.)
   *
   * @returns Stream info or undefined if not found
   *
   * @example
   * ```typescript
   * const audioStream = media.audio();
   * if (audioStream) {
   *   console.log(`Audio: ${audioStream.sampleRate}Hz, ${audioStream.channels}ch`);
   * }
   * ```
   */
  audio(index = 0): Stream | undefined {
    const streams = this._streams.filter((s) => s.codecpar.codecType === AVMEDIA_TYPE_AUDIO);
    return streams[index];
  }

  /**
   * Find the best stream of a given type.
   *
   * Uses FFmpeg's stream selection logic to find the most suitable stream.
   *
   * Uses av_find_best_stream() internally for optimal stream selection.
   *
   * @param type - Media type to search for
   *
   * @returns Stream info or undefined if not found
   */
  findBestStream(type: AVMediaType): Stream | undefined {
    const bestStreamIndex = this.formatContext.findBestStream(type);
    return this._streams.find((s) => s.index === bestStreamIndex);
  }

  /**
   * Iterate over all packets in the container.
   *
   * Allocates a single packet and reuses it for efficiency.
   * Automatically unreferences the packet between iterations.
   *
   * Uses av_read_frame() internally.
   *
   * @yields Packet from the container
   *
   * @example
   * ```typescript
   * for await (const packet of media.packets()) {
   *   if (packet.streamIndex === videoStream.index) {
   *     // Process video packet
   *     await decoder.decode(packet);
   *   }
   * }
   * ```
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
   * Seek to a specific timestamp.
   *
   * Uses av_seek_frame() internally.
   *
   * Converts seconds to microseconds for FFmpeg's AV_TIME_BASE.
   *
   * @param timestamp - Target timestamp in seconds
   * @param streamIndex - Stream to seek in (-1 for default)
   * @param flags - Seek flags (0 for default)
   *
   * @returns 0 on success, negative error code on failure
   */
  async seek(timestamp: number, streamIndex = -1, flags: AVSeekFlag = AVFLAG_NONE): Promise<number> {
    // Convert seconds to AV_TIME_BASE
    const ts = BigInt(Math.floor(timestamp * 1000000));
    return this.formatContext.seekFrame(streamIndex, ts, flags);
  }

  /**
   * Close the input and free resources.
   *
   * Uses avformat_close_input() internally.
   *
   * Properly cleans up IOContext references before closing to prevent
   * use-after-free errors.
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
   * Get the low-level FormatContext.
   *
   * Internal method for advanced use cases.
   *
   * Provides direct access to the underlying AVFormatContext.
   *
   * @returns FFmpeg FormatContext
   *
   * @internal
   */
  getFormatContext(): FormatContext {
    return this.formatContext;
  }

  /**
   * Async cleanup when using 'await using' statement.
   *
   * Implements the AsyncDisposable interface for automatic cleanup.
   *
   * Calls close() to free all resources.
   *
   * @example
   * ```typescript
   * {
   *   await using media = await MediaInput.open('video.mp4');
   *   // Use media...
   * } // Automatically closed
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
