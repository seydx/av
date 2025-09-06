import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

import { AVFMT_FLAG_CUSTOM_IO, AVFMT_NOFILE, AVIO_FLAG_WRITE } from '../constants/constants.js';
import { FFmpegError, FormatContext, IOContext, Rational } from '../lib/index.js';
import { Encoder } from './encoder.js';

import type { IRational, Packet, Stream } from '../lib/index.js';
import type { IOOutputCallbacks, MediaOutputOptions } from './types.js';

export interface StreamDescription {
  stream: Stream;
  timeBase: IRational;
  isStreamCopy: boolean;
  sourceTimeBase?: IRational;
}

/**
 * High-level media output for writing and muxing media files.
 *
 * Provides simplified access to media muxing and file writing operations.
 * Handles stream configuration, packet writing, and format management.
 * Supports files, URLs, and custom I/O with automatic cleanup.
 * Essential component for media encoding pipelines and transcoding.
 *
 * @example
 * ```typescript
 * import { MediaOutput } from 'node-av/api';
 *
 * // Create output file
 * await using output = await MediaOutput.open('output.mp4');
 *
 * // Add streams from encoders
 * const videoIdx = output.addStream(videoEncoder);
 * const audioIdx = output.addStream(audioEncoder);
 *
 * // Write header
 * await output.writeHeader();
 *
 * // Write packets
 * await output.writePacket(packet, videoIdx);
 *
 * // Write trailer and close
 * await output.writeTrailer();
 * ```
 *
 * @example
 * ```typescript
 * // Stream copy
 * await using input = await MediaInput.open('input.mp4');
 * await using output = await MediaOutput.open('output.mp4');
 *
 * // Copy stream configuration
 * const videoIdx = output.addStream(input.video());
 * await output.writeHeader();
 *
 * for await (const packet of input.packets()) {
 *   await output.writePacket(packet, videoIdx);
 *   packet.free();
 * }
 * ```
 *
 * @see {@link MediaInput} For reading media files
 * @see {@link Encoder} For encoding frames to packets
 * @see {@link FormatContext} For low-level API
 */
export class MediaOutput implements AsyncDisposable {
  private formatContext: FormatContext;
  private streams = new Map<number, StreamDescription>();
  private ioContext?: IOContext;
  private headerWritten = false;
  private trailerWritten = false;
  private closed = false;

  /**
   * @internal
   */
  private constructor() {
    this.formatContext = new FormatContext();
  }

  /**
   * Open media output for writing.
   *
   * Creates and configures output context for muxing.
   * Automatically creates directories for file output.
   * Supports files, URLs, and custom I/O callbacks.
   *
   * Direct mapping to avformat_alloc_output_context2() and avio_open2().
   *
   * @param target - File path, URL, or I/O callbacks
   * @param options - Output configuration options
   * @returns Opened media output instance
   *
   * @throws {Error} If format required for custom I/O
   *
   * @throws {FFmpegError} If allocation or opening fails
   *
   * @example
   * ```typescript
   * // Create file output
   * await using output = await MediaOutput.open('output.mp4');
   * ```
   *
   * @example
   * ```typescript
   * // Create output with specific format
   * await using output = await MediaOutput.open('output.ts', {
   *   format: 'mpegts'
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Custom I/O callbacks
   * const callbacks = {
   *   write: async (buffer: Buffer) => {
   *     // Write to custom destination
   *     return buffer.length;
   *   },
   *   seek: async (offset: bigint, whence: number) => {
   *     // Seek in custom destination
   *     return offset;
   *   }
   * };
   *
   * await using output = await MediaOutput.open(callbacks, {
   *   format: 'mp4',
   *   bufferSize: 8192
   * });
   * ```
   *
   * @see {@link MediaOutputOptions} For configuration options
   * @see {@link IOOutputCallbacks} For custom I/O interface
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
   * Add a stream to the output.
   *
   * Configures output stream from encoder or input stream.
   * Must be called before writeHeader().
   * Returns stream index for packet writing.
   *
   * Direct mapping to avformat_new_stream() and avcodec_parameters_copy().
   *
   * @param source - Encoder or stream to add
   * @param options - Stream configuration options
   * @param options.timeBase - Optional custom timebase for the stream
   * @returns Stream index for packet writing
   *
   * @throws {Error} If called after header written or output closed
   *
   * @example
   * ```typescript
   * // Add stream from encoder
   * const videoIdx = output.addStream(videoEncoder);
   * const audioIdx = output.addStream(audioEncoder);
   * ```
   *
   * @example
   * ```typescript
   * // Stream copy with custom timebase
   * const streamIdx = output.addStream(input.video(), {
   *   timeBase: { num: 1, den: 90000 }
   * });
   * ```
   *
   * @see {@link writePacket} For writing packets to streams
   * @see {@link Encoder} For transcoding source
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
   * Write a packet to the output.
   *
   * Writes muxed packet to the specified stream.
   * Automatically handles timestamp rescaling.
   * Must be called after writeHeader() and before writeTrailer().
   *
   * Direct mapping to av_interleaved_write_frame().
   *
   * @param packet - Packet to write
   * @param streamIndex - Target stream index
   * @throws {Error} If stream invalid or called at wrong time
   *
   * @throws {FFmpegError} If write fails
   *
   * @example
   * ```typescript
   * // Write encoded packet
   * const packet = await encoder.encode(frame);
   * if (packet) {
   *   await output.writePacket(packet, videoIdx);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Stream copy with packet processing
   * for await (const packet of input.packets()) {
   *   if (packet.streamIndex === inputVideoIdx) {
   *     await output.writePacket(packet, outputVideoIdx);
   *   }
   *   packet.free();
   * }
   * ```
   *
   * @see {@link addStream} For adding streams
   * @see {@link writeHeader} Must be called first
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
   * Write file header.
   *
   * Writes format header with stream configuration.
   * Must be called after adding all streams and before writing packets.
   * Finalizes stream parameters and initializes muxer.
   *
   * Direct mapping to avformat_write_header().
   *
   * @throws {Error} If already written or output closed
   *
   * @throws {FFmpegError} If write fails
   *
   * @example
   * ```typescript
   * // Standard workflow
   * const output = await MediaOutput.open('output.mp4');
   * output.addStream(encoder);
   * await output.writeHeader();
   * // Now ready to write packets
   * ```
   *
   * @see {@link addStream} Must add streams first
   * @see {@link writePacket} Can write packets after
   * @see {@link writeTrailer} Must call at end
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
   * Write file trailer.
   *
   * Writes format trailer and finalizes the file.
   * Must be called after all packets are written.
   * Flushes any buffered data and updates file headers.
   *
   * Direct mapping to av_write_trailer().
   *
   * @throws {Error} If header not written or already written
   *
   * @throws {FFmpegError} If write fails
   *
   * @example
   * ```typescript
   * // Finalize output
   * await output.writeTrailer();
   * await output.close();
   * ```
   *
   * @see {@link writeHeader} Must be called first
   * @see {@link close} For cleanup after trailer
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
   * Close media output and free resources.
   *
   * Writes trailer if needed and releases all resources.
   * Safe to call multiple times.
   * Automatically called by Symbol.asyncDispose.
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.open('output.mp4');
   * try {
   *   // Use output
   * } finally {
   *   await output.close();
   * }
   * ```
   *
   * @see {@link Symbol.asyncDispose} For automatic cleanup
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
   * Get stream information.
   *
   * Returns internal stream info for the specified index.
   *
   * @param streamIndex - Stream index
   * @returns Stream info or undefined
   *
   * @example
   * ```typescript
   * const info = output.getStreamInfo(0);
   * console.log(`Stream 0 timebase: ${info?.timeBase.num}/${info?.timeBase.den}`);
   * ```
   */
  getStreamInfo(streamIndex: number): StreamDescription | undefined {
    return this.streams.get(streamIndex);
  }

  /**
   * Get all stream indices.
   *
   * Returns array of all added stream indices.
   *
   * @returns Array of stream indices
   *
   * @example
   * ```typescript
   * const indices = output.getStreamIndices();
   * console.log(`Output has ${indices.length} streams`);
   * ```
   */
  getStreamIndices(): number[] {
    return Array.from(this.streams.keys());
  }

  /**
   * Check if header has been written.
   *
   * @returns true if header written
   *
   * @example
   * ```typescript
   * if (!output.isHeaderWritten()) {
   *   await output.writeHeader();
   * }
   * ```
   */
  isHeaderWritten(): boolean {
    return this.headerWritten;
  }

  /**
   * Check if trailer has been written.
   *
   * @returns true if trailer written
   *
   * @example
   * ```typescript
   * if (!output.isTrailerWritten()) {
   *   await output.writeTrailer();
   * }
   * ```
   */
  isTrailerWritten(): boolean {
    return this.trailerWritten;
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
   * Dispose of media output.
   *
   * Implements AsyncDisposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   await using output = await MediaOutput.open('output.mp4');
   *   // Use output...
   * } // Automatically closed
   * ```
   *
   * @see {@link close} For manual cleanup
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
