/**
 * MediaOutput - Unified Output Handler for FFmpeg
 *
 * Provides a high-level interface for writing media to various destinations.
 * Supports files, streams, and custom IO with automatic format configuration.
 *
 * Central entry point for all media output operations.
 * Manages FormatContext lifecycle and provides stream management.
 *
 * @module api/media-output
 */

import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

import { AVFMT_FLAG_CUSTOM_IO, AVFMT_NOFILE, AVIO_FLAG_WRITE } from '../constants/constants.js';
import { FFmpegError, FormatContext, IOContext, Rational } from '../lib/index.js';
import { Encoder } from './encoder.js';

import type { IRational, Packet, Stream } from '../lib/index.js';
import type { IOOutputCallbacks, MediaOutputOptions } from './types.js';

interface StreamInfo {
  stream: Stream;
  timeBase: IRational;
  isStreamCopy: boolean;
  sourceTimeBase?: IRational; // For rescaling when needed
}

/**
 * MediaOutput - High-level media output handler.
 *
 * Creates and manages media containers for writing encoded streams.
 * Automatically handles format setup and stream configuration.
 *
 * Manages the FormatContext and provides convenient methods for
 * adding streams, writing packets, and finalizing output.
 *
 * @example
 * ```typescript
 * import { MediaOutput, Encoder } from 'node-av/api';
 *
 * // Open output file
 * const output = await MediaOutput.open('output.mp4');
 *
 * // Add encoder stream
 * const encoder = await Encoder.create('libx264', {
 *   width: 1920,
 *   height: 1080,
 *   pixelFormat: AV_PIX_FMT_YUV420P
 * });
 * const streamIdx = output.addStream(encoder);
 *
 * // Write header, packets, trailer
 * await output.writeHeader();
 * await output.writePacket(packet, streamIdx);
 * await output.writeTrailer();
 * await output.close();
 * ```
 *
 * @example
 * ```typescript
 * // Stream copy without re-encoding
 * const input = await MediaInput.open('input.mp4');
 * const output = await MediaOutput.open('output.mkv');
 *
 * const videoStream = input.video();
 * const streamIdx = output.addStream(videoStream);
 *
 * await output.writeHeader();
 * for await (const packet of input.packets()) {
 *   if (packet.streamIndex === videoStream.index) {
 *     await output.writePacket(packet, streamIdx);
 *   }
 * }
 * await output.writeTrailer();
 * ```
 */
export class MediaOutput implements AsyncDisposable {
  private formatContext: FormatContext;
  private streams = new Map<number, StreamInfo>();
  private ioContext?: IOContext;
  private headerWritten = false;
  private trailerWritten = false;
  private closed = false;

  /**
   * Private constructor - use MediaOutput.open() instead.
   *
   * Initializes the output with a new FormatContext.
   * The actual format setup happens in the static factory method.
   */
  private constructor() {
    this.formatContext = new FormatContext();
  }

  /**
   * Opens a media output for writing with custom IO callbacks or stream URL or file output
   *
   * Creates a FormatContext and prepares the output for writing.
   * Automatically detects format from filename/URL if not specified.
   *
   * If io callbacks is used, it creates a FormatContext with custom IO handling.
   * Format must be explicitly specified for custom IO.
   *
   * Uses avformat_alloc_output_context2() and avio_alloc_context() internally.
   *
   * @param target - File path or stream URL or custom IO callbacks
   * @param options - Optional configuration
   *
   * @returns Promise resolving to MediaOutput instance
   *
   * @throws {Error} If format not specified or context allocation fails
   *
   * @example
   * ```typescript
   * const callbacks = {
   *   write: (buffer) => myStream.write(buffer),
   *   seek: (offset, whence) => offset
   * };
   * const output = await MediaOutput.open(callbacks, { format: 'mp4' });
   * ```
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.open('output.mp4');
   * ```
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.open('rtmp://server/live/streamkey', { format: 'flv' });
   * ```
   */
  static async open(target: string | IOOutputCallbacks, options?: MediaOutputOptions): Promise<MediaOutput> {
    const output = new MediaOutput();

    try {
      if (typeof target === 'string') {
        // File or stream URL - resolve relative paths and create directories
        // Check if it's a URL (starts with protocol://) or a file path
        const isUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(target);
        const resolvedTarget = isUrl ? target : resolve(target);

        // Create directory structure for local files (not URLs)
        if (!isUrl && target !== '') {
          const dir = dirname(resolvedTarget);
          await mkdir(dir, { recursive: true });
        }
        // Allocate output context
        const ret = output.formatContext.allocOutputContext2(null, options?.format ?? null, resolvedTarget === '' ? null : resolvedTarget);
        FFmpegError.throwIfError(ret, 'Failed to allocate output context');

        // Check if we need to open IO
        const oformat = output.formatContext.oformat;
        if (resolvedTarget && oformat && !(oformat.flags & AVFMT_NOFILE)) {
          // For file-based formats, we need to open the file using avio_open2
          // FFmpeg will manage the AVIOContext internally
          output.ioContext = new IOContext();
          const openRet = await output.ioContext.open2(resolvedTarget, AVIO_FLAG_WRITE);
          FFmpegError.throwIfError(openRet, `Failed to open output file: ${resolvedTarget}`);
          output.formatContext.pb = output.ioContext;
        }
      } else {
        // Custom IO with callbacks - format is required
        if (!options?.format) {
          throw new Error('Format must be specified for custom IO');
        }

        const ret = output.formatContext.allocOutputContext2(null, options.format, null);
        FFmpegError.throwIfError(ret, 'Failed to allocate output context');

        // Setup custom IO with callbacks
        output.ioContext = new IOContext();
        output.ioContext.allocContextWithCallbacks(options.bufferSize ?? 4096, 1, target.read, target.write, target.seek);
        output.ioContext.maxPacketSize = options.bufferSize ?? 4096;
        output.formatContext.pb = output.ioContext;
        output.formatContext.flags = AVFMT_FLAG_CUSTOM_IO;
      }

      return output;
    } catch (error) {
      // Cleanup on error
      if (output.ioContext) {
        try {
          const isCustomIO = (output.formatContext.flags & AVFMT_FLAG_CUSTOM_IO) !== 0;
          if (isCustomIO) {
            // Clear the pb reference first
            output.formatContext.pb = null;
            // For custom IO with callbacks, free the context
            output.ioContext.freeContext();
          } else {
            // For file-based IO, close the file handle
            await output.ioContext.closep();
          }
        } catch {
          // Ignore errors
        }
      }
      if (output.formatContext) {
        try {
          output.formatContext.freeContext();
        } catch {
          // Ignore errors
        }
      }
      throw error;
    }
  }

  /**
   * Adds a stream to the output container.
   *
   * Creates a new stream in the output format context.
   * Copies codec parameters from encoder or input stream.
   *
   * Uses avformat_new_stream() and avcodec_parameters_copy() internally.
   *
   * @param source - Encoder for transcoding or Stream for copying
   * @param options - Optional stream configuration
   * @param options.timeBase - Custom output timebase for the stream.
   *                           If not specified, uses the source's timebase.
   *                           When set, packets will be automatically rescaled
   *                           from source timebase to this output timebase.
   *
   * @returns Stream index for packet writing
   *
   * @throws {Error} If called after header is written or output is closed
   *
   * @example
   * ```typescript
   * // Add encoder stream (transcoding) - uses encoder's timebase
   * const encoder = await Encoder.create('libx264', { width: 1920, height: 1080 });
   * const streamIdx = output.addStream(encoder);
   * ```
   *
   * @example
   * ```typescript
   * // Add stream for direct copy - uses input stream's timebase
   * const inputStream = input.video();
   * const streamIdx = output.addStream(inputStream);
   * ```
   *
   * @example
   * ```typescript
   * // Custom output timebase (e.g., for format requirements)
   * const streamIdx = output.addStream(encoder, {
   *   timeBase: { num: 1, den: 90000 }  // MPEG-TS standard
   * });
   * // Packets from encoder will be automatically rescaled to 1/90000
   * ```
   */
  addStream(
    source: Encoder | Stream,
    options?: {
      timeBase?: IRational;
    },
  ): number {
    if (this.closed) {
      throw new Error('MediaOutput is closed');
    }

    if (this.headerWritten) {
      throw new Error('Cannot add streams after header is written');
    }

    const stream = this.formatContext.newStream(null);
    if (!stream) {
      throw new Error('Failed to create new stream');
    }

    let isStreamCopy = false;
    let sourceTimeBase: IRational | undefined;

    if (source instanceof Encoder) {
      // Transcoding with encoder
      const codecContext = source.getCodecContext();
      if (!codecContext) {
        throw new Error('Failed to get codec context from encoder');
      }

      const ret = stream.codecpar.fromContext(codecContext);
      FFmpegError.throwIfError(ret, 'Failed to copy codec parameters from encoder');

      // Store the encoder's timebase as source (we'll need it for rescaling)
      sourceTimeBase = codecContext.timeBase;

      // Output stream uses encoder's timebase (or custom if specified)
      stream.timeBase = options?.timeBase ? new Rational(options.timeBase.num, options.timeBase.den) : codecContext.timeBase;
    } else {
      // Stream copy
      const ret = source.codecpar.copy(stream.codecpar);
      FFmpegError.throwIfError(ret, 'Failed to copy codec parameters');

      // Store the input stream's timebase as source (we'll need it for rescaling)
      sourceTimeBase = source.timeBase;

      // Output stream uses input stream's timebase (or custom if specified)
      stream.timeBase = options?.timeBase ? new Rational(options.timeBase.num, options.timeBase.den) : source.timeBase;
      stream.codecpar.codecTag = 0; // Important for format compatibility
      isStreamCopy = true;
    }

    this.streams.set(stream.index, {
      stream,
      timeBase: stream.timeBase,
      isStreamCopy,
      sourceTimeBase,
    });

    return stream.index;
  }

  /**
   * Writes a packet to the output container.
   *
   * Writes an encoded packet to the specified stream.
   * Automatically sets the stream index on the packet.
   *
   * Uses av_interleaved_write_frame() internally.
   *
   * @param packet - Packet to write
   * @param streamIndex - Target stream index
   *
   * @throws {Error} If header not written, trailer already written, or invalid stream
   *
   * @example
   * ```typescript
   * const encoded = await encoder.encode(frame);
   * if (encoded) {
   *   await output.writePacket(encoded, streamIdx);
   *   encoded.free();
   * }
   * ```
   */
  async writePacket(packet: Packet, streamIndex: number): Promise<void> {
    if (this.closed) {
      throw new Error('MediaOutput is closed');
    }

    if (!this.headerWritten) {
      throw new Error('Header must be written before packets');
    }

    if (this.trailerWritten) {
      throw new Error('Cannot write packets after trailer');
    }

    const streamInfo = this.streams.get(streamIndex);
    if (!streamInfo) {
      throw new Error(`Invalid stream index: ${streamIndex}`);
    }

    // Set stream index
    packet.streamIndex = streamIndex;

    // Rescale packet timestamps if source and output timebases differ
    // Note: The stream's timebase may have been changed by writeHeader (e.g., MP4 uses 1/time_scale)
    if (streamInfo.sourceTimeBase) {
      const outputStream = this.formatContext.streams?.[streamIndex];
      if (outputStream) {
        // Only rescale if timebases actually differ
        const srcTb = streamInfo.sourceTimeBase;
        const dstTb = outputStream.timeBase;
        if (srcTb.num !== dstTb.num || srcTb.den !== dstTb.den) {
          packet.rescaleTs(streamInfo.sourceTimeBase, outputStream.timeBase);
        }
      }
    }

    // Write the packet
    const ret = await this.formatContext.interleavedWriteFrame(packet);
    FFmpegError.throwIfError(ret, 'Failed to write packet');
  }

  /**
   * Writes the output file header.
   *
   * Writes the container header with stream information.
   * Must be called before writing any packets.
   *
   * Uses avformat_write_header() internally.
   *
   * @param options - Optional header options (format-specific)
   *
   * @throws {Error} If header already written or output is closed
   *
   * @example
   * ```typescript
   * await output.writeHeader();
   * ```
   */
  async writeHeader(): Promise<void> {
    if (this.closed) {
      throw new Error('MediaOutput is closed');
    }

    if (this.headerWritten) {
      throw new Error('Header already written');
    }

    const ret = await this.formatContext.writeHeader();
    FFmpegError.throwIfError(ret, 'Failed to write header');
    this.headerWritten = true;
  }

  /**
   * Writes the output file trailer.
   *
   * Finalizes the output file with necessary metadata.
   * Should be called after all packets have been written.
   *
   * Uses av_write_trailer() internally.
   *
   * @throws {Error} If header not written, trailer already written, or output is closed
   *
   * @example
   * ```typescript
   * await output.writeTrailer();
   * ```
   */
  async writeTrailer(): Promise<void> {
    if (this.closed) {
      throw new Error('MediaOutput is closed');
    }

    if (!this.headerWritten) {
      throw new Error('Cannot write trailer without header');
    }

    if (this.trailerWritten) {
      throw new Error('Trailer already written');
    }

    const ret = await this.formatContext.writeTrailer();
    FFmpegError.throwIfError(ret, 'Failed to write trailer');
    this.trailerWritten = true;
  }

  /**
   * Closes the output and releases all resources.
   *
   * Writes trailer if needed, closes IO context, and frees format context.
   * Safe to call multiple times.
   *
   * Uses av_write_trailer(), avio_closep(), and avformat_free_context() internally.
   *
   * @example
   * ```typescript
   * await output.close();
   * ```
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    // Try to write trailer if header was written but trailer wasn't
    try {
      if (this.headerWritten && !this.trailerWritten) {
        await this.formatContext.writeTrailer();
      }
    } catch {
      // Ignore errors
    }

    // Clear pb reference first to prevent use-after-free
    if (this.ioContext) {
      this.formatContext.pb = null;
    }

    // Determine if this is custom IO before freeing format context
    const isCustomIO = (this.formatContext.flags & AVFMT_FLAG_CUSTOM_IO) !== 0;

    // For file-based IO, close the file handle via closep
    // For custom IO, the context will be freed below
    if (this.ioContext && !isCustomIO) {
      try {
        await this.ioContext.closep();
      } catch {
        // Ignore errors
      }
    }

    // Free format context
    if (this.formatContext) {
      try {
        this.formatContext.freeContext();
      } catch {
        // Ignore errors
      }
    }

    // Now free custom IO context if present
    if (this.ioContext && isCustomIO) {
      try {
        this.ioContext.freeContext();
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Gets information about a specific stream.
   */
  getStreamInfo(streamIndex: number): StreamInfo | undefined {
    return this.streams.get(streamIndex);
  }

  /**
   * Gets all stream indices.
   */
  getStreamIndices(): number[] {
    return Array.from(this.streams.keys());
  }

  /**
   * Checks if header has been written.
   */
  isHeaderWritten(): boolean {
    return this.headerWritten;
  }

  /**
   * Checks if trailer has been written.
   */
  isTrailerWritten(): boolean {
    return this.trailerWritten;
  }

  /**
   * Gets the underlying format context.
   *
   * For advanced use cases requiring direct format context access.
   */
  getFormatContext(): FormatContext {
    return this.formatContext;
  }

  /**
   * AsyncDisposable implementation for using statement.
   *
   * Enables automatic resource cleanup with await using syntax.
   *
   * @example
   * ```typescript
   * await using output = await MediaOutput.open('output.mp4');
   * // Output automatically closes when scope ends
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
