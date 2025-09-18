import { mkdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

import { AVFMT_FLAG_CUSTOM_IO, AVFMT_NOFILE, AVIO_FLAG_WRITE } from '../constants/constants.js';
import { FFmpegError, FormatContext, IOContext, Rational } from '../lib/index.js';
import { Encoder } from './encoder.js';

import type { IRational, Packet, Stream } from '../lib/index.js';
import type { IOOutputCallbacks, MediaOutputOptions } from './types.js';

export interface StreamDescription {
  initialized: boolean;
  stream: Stream;
  source: Encoder | Stream;
  timeBase?: IRational;
  sourceTimeBase?: IRational;
  isStreamCopy: boolean;
  bufferedPackets: Packet[];
}

/**
 * High-level media output for writing and muxing media files.
 *
 * Provides simplified access to media muxing and file writing operations.
 * Automatically manages header and trailer writing - header is written on first packet,
 * trailer is written on close. Supports lazy initialization for both encoders and streams.
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
 * // Write packets - header written automatically on first packet
 * await output.writePacket(packet, videoIdx);
 *
 * // Close - trailer written automatically
 * // (automatic with await using)
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
 *
 * // Process packets - header/trailer handled automatically
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
export class MediaOutput implements AsyncDisposable, Disposable {
  private formatContext: FormatContext;
  private streams = new Map<number, StreamDescription>();
  private ioContext?: IOContext;
  private headerWritten = false;
  private trailerWritten = false;
  private isClosed = false;
  private headerWritePromise?: Promise<void>;

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
   *
   * @param options - Output configuration options
   *
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
   * Open media output for writing synchronously.
   * Synchronous version of open.
   *
   * Creates and configures output context for muxing.
   * Automatically creates directories for file output.
   * Supports files, URLs, and custom I/O callbacks.
   *
   * Direct mapping to avformat_alloc_output_context2() and avio_open2().
   *
   * @param target - File path, URL, or I/O callbacks
   *
   * @param options - Output configuration options
   *
   * @returns Opened media output instance
   *
   * @throws {Error} If format required for custom I/O
   *
   * @throws {FFmpegError} If allocation or opening fails
   *
   * @example
   * ```typescript
   * // Create file output
   * using output = MediaOutput.openSync('output.mp4');
   * ```
   *
   * @example
   * ```typescript
   * // Create output with specific format
   * using output = MediaOutput.openSync('output.ts', {
   *   format: 'mpegts'
   * });
   * ```
   *
   * @see {@link open} For async version
   */
  static openSync(target: string | IOOutputCallbacks, options?: MediaOutputOptions): MediaOutput {
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
          mkdirSync(dir, { recursive: true });
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
          const openRet = output.ioContext.open2Sync(resolvedTarget, AVIO_FLAG_WRITE);
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
            output.ioContext.closepSync();
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
   * Must be called before writing any packets.
   * Returns stream index for packet writing.
   *
   * Streams are initialized lazily - codec parameters are configured
   * automatically when the first packet is written. This allows encoders
   * to be initialized from frame properties.
   *
   * Direct mapping to avformat_new_stream().
   *
   * @param source - Encoder or stream to add
   *
   * @param options - Stream configuration options
   *
   * @param options.timeBase - Optional custom timebase for the stream
   *
   * @returns Stream index for packet writing
   *
   * @throws {Error} If called after packets have been written or output closed
   *
   * @example
   * ```typescript
   * // Add stream from encoder (lazy initialization)
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
    if (this.isClosed) {
      throw new Error('MediaOutput is closed');
    }

    if (this.headerWritten) {
      throw new Error('Cannot add streams after packets have been written');
    }

    const stream = this.formatContext.newStream(null);
    if (!stream) {
      throw new Error('Failed to create new stream');
    }

    const isStreamCopy = !(source instanceof Encoder);

    // For stream copy, initialize immediately since we have all the info
    if (isStreamCopy) {
      const inputStream = source;
      const ret = inputStream.codecpar.copy(stream.codecpar);
      FFmpegError.throwIfError(ret, 'Failed to copy codec parameters');

      // Set the timebases
      const sourceTimeBase = inputStream.timeBase;
      stream.timeBase = options?.timeBase ? new Rational(options.timeBase.num, options.timeBase.den) : inputStream.timeBase;

      this.streams.set(stream.index, {
        initialized: true,
        stream,
        source,
        timeBase: options?.timeBase,
        sourceTimeBase,
        isStreamCopy: true,
        bufferedPackets: [],
      });
    } else {
      this.streams.set(stream.index, {
        initialized: false,
        stream,
        source,
        timeBase: options?.timeBase,
        sourceTimeBase: undefined, // Will be set on initialization
        isStreamCopy: false,
        bufferedPackets: [],
      });
    }

    return stream.index;
  }

  /**
   * Write a packet to the output.
   *
   * Writes muxed packet to the specified stream.
   * Automatically handles:
   * - Stream initialization on first packet (lazy initialization)
   * - Codec parameter configuration from encoder or input stream
   * - Header writing on first packet
   * - Timestamp rescaling between source and output timebases
   *
   * For encoder sources, the encoder must have processed at least one frame
   * before packets can be written (encoder must be initialized).
   *
   * Direct mapping to avformat_write_header() (on first packet) and av_interleaved_write_frame().
   *
   * @param packet - Packet to write
   *
   * @param streamIndex - Target stream index
   *
   * @throws {Error} If stream invalid or encoder not initialized
   *
   * @throws {FFmpegError} If write fails
   *
   * @example
   * ```typescript
   * // Write encoded packet - header written automatically on first packet
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
   */
  async writePacket(packet: Packet, streamIndex: number): Promise<void> {
    if (this.isClosed) {
      throw new Error('MediaOutput is closed');
    }

    if (this.trailerWritten) {
      throw new Error('Cannot write packets after output is finalized');
    }

    if (!this.streams.get(streamIndex)) {
      throw new Error(`Invalid stream index: ${streamIndex}`);
    }

    // Initialize any encoder streams that are ready
    for (const streamInfo of this.streams.values()) {
      if (!streamInfo.initialized && streamInfo.source instanceof Encoder) {
        const encoder = streamInfo.source;
        const codecContext = encoder.getCodecContext();

        // Skip if encoder not ready yet
        if (!encoder.isEncoderInitialized || !codecContext) {
          continue;
        }

        // This encoder is ready, initialize it now
        const ret = streamInfo.stream.codecpar.fromContext(codecContext);
        FFmpegError.throwIfError(ret, 'Failed to copy codec parameters from encoder');

        // Update the timebase from the encoder
        streamInfo.sourceTimeBase = codecContext.timeBase;

        // Output stream uses encoder's timebase (or custom if specified)
        streamInfo.stream.timeBase = streamInfo.timeBase ? new Rational(streamInfo.timeBase.num, streamInfo.timeBase.den) : codecContext.timeBase;

        // Mark as initialized
        streamInfo.initialized = true;
      }
    }

    const streamInfo = this.streams.get(streamIndex)!;

    // Check if any streams are still uninitialized
    const uninitialized = Array.from(this.streams.values()).some((s) => !s.initialized);
    if (uninitialized) {
      const clonedPacket = packet.clone();
      packet.free();
      if (clonedPacket) {
        streamInfo.bufferedPackets.push(clonedPacket);
      }
      return;
    }

    // Automatically write header if not written yet
    // Use a promise to ensure only one thread writes the header
    if (!this.headerWritten) {
      this.headerWritePromise ??= (async () => {
        const ret = await this.formatContext.writeHeader();
        FFmpegError.throwIfError(ret, 'Failed to write header');
        this.headerWritten = true;
      })();
      // All threads wait for the header to be written
      await this.headerWritePromise;
    }

    // Set stream index
    packet.streamIndex = streamIndex;

    const write = async (pkt: Packet) => {
      // Rescale packet timestamps if source and output timebases differ
      // Note: The stream's timebase may have been changed by writeHeader (e.g., MP4 uses 1/time_scale)
      if (streamInfo.sourceTimeBase) {
        const outputStream = this.formatContext.streams?.[streamIndex];
        if (outputStream) {
          // Only rescale if timebases actually differ
          const srcTb = streamInfo.sourceTimeBase;
          const dstTb = outputStream.timeBase;
          if (srcTb.num !== dstTb.num || srcTb.den !== dstTb.den) {
            pkt.rescaleTs(streamInfo.sourceTimeBase, outputStream.timeBase);
          }
        }
      }

      // Write the packet
      const ret = await this.formatContext.interleavedWriteFrame(pkt);
      FFmpegError.throwIfError(ret, 'Failed to write packet');
    };

    // Write any buffered packets first
    for (const bufferedPacket of streamInfo.bufferedPackets) {
      await write(bufferedPacket);
      bufferedPacket.free();
    }
    streamInfo.bufferedPackets = [];

    // Write the current packet
    await write(packet);
  }

  /**
   * Write a packet to the output synchronously.
   * Synchronous version of writePacket.
   *
   * Writes muxed packet to the specified stream.
   * Automatically handles:
   * - Stream initialization on first packet (lazy initialization)
   * - Codec parameter configuration from encoder or input stream
   * - Header writing on first packet
   * - Timestamp rescaling between source and output timebases
   *
   * For encoder sources, the encoder must have processed at least one frame
   * before packets can be written (encoder must be initialized).
   *
   * Direct mapping to avformat_write_header() (on first packet) and av_interleaved_write_frame().
   *
   * @param packet - Packet to write
   *
   * @param streamIndex - Target stream index
   *
   * @throws {Error} If stream invalid or encoder not initialized
   *
   * @throws {FFmpegError} If write fails
   *
   * @example
   * ```typescript
   * // Write encoded packet - header written automatically on first packet
   * const packet = encoder.encodeSync(frame);
   * if (packet) {
   *   output.writePacketSync(packet, videoIdx);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Stream copy with packet processing
   * for (const packet of input.packetsSync()) {
   *   if (packet.streamIndex === inputVideoIdx) {
   *     output.writePacketSync(packet, outputVideoIdx);
   *   }
   *   packet.free();
   * }
   * ```
   *
   * @see {@link writePacket} For async version
   */
  writePacketSync(packet: Packet, streamIndex: number): void {
    if (this.isClosed) {
      throw new Error('MediaOutput is closed');
    }

    if (this.trailerWritten) {
      throw new Error('Cannot write packets after output is finalized');
    }

    if (!this.streams.get(streamIndex)) {
      throw new Error(`Invalid stream index: ${streamIndex}`);
    }

    // Initialize any encoder streams that are ready
    for (const streamInfo of this.streams.values()) {
      if (!streamInfo.initialized && streamInfo.source instanceof Encoder) {
        const encoder = streamInfo.source;
        const codecContext = encoder.getCodecContext();

        // Skip if encoder not ready yet
        if (!encoder.isEncoderInitialized || !codecContext) {
          continue;
        }

        // This encoder is ready, initialize it now
        const ret = streamInfo.stream.codecpar.fromContext(codecContext);
        FFmpegError.throwIfError(ret, 'Failed to copy codec parameters from encoder');

        // Update the timebase from the encoder
        streamInfo.sourceTimeBase = codecContext.timeBase;

        // Output stream uses encoder's timebase (or custom if specified)
        streamInfo.stream.timeBase = streamInfo.timeBase ? new Rational(streamInfo.timeBase.num, streamInfo.timeBase.den) : codecContext.timeBase;

        // Mark as initialized
        streamInfo.initialized = true;
      }
    }

    const streamInfo = this.streams.get(streamIndex)!;

    // Check if any streams are still uninitialized
    const uninitialized = Array.from(this.streams.values()).some((s) => !s.initialized);
    if (uninitialized) {
      const clonedPacket = packet.clone();
      packet.free();
      if (clonedPacket) {
        streamInfo.bufferedPackets.push(clonedPacket);
      }
      return;
    }

    // Automatically write header if not written yet
    if (!this.headerWritten) {
      const ret = this.formatContext.writeHeaderSync();
      FFmpegError.throwIfError(ret, 'Failed to write header');
      this.headerWritten = true;
    }

    // Set stream index
    packet.streamIndex = streamIndex;

    const write = (pkt: Packet) => {
      // Rescale packet timestamps if source and output timebases differ
      // Note: The stream's timebase may have been changed by writeHeader (e.g., MP4 uses 1/time_scale)
      if (streamInfo.sourceTimeBase) {
        const outputStream = this.formatContext.streams?.[streamIndex];
        if (outputStream) {
          // Only rescale if timebases actually differ
          const srcTb = streamInfo.sourceTimeBase;
          const dstTb = outputStream.timeBase;
          if (srcTb.num !== dstTb.num || srcTb.den !== dstTb.den) {
            pkt.rescaleTs(streamInfo.sourceTimeBase, outputStream.timeBase);
          }
        }
      }

      // Write the packet
      const ret = this.formatContext.interleavedWriteFrameSync(pkt);
      FFmpegError.throwIfError(ret, 'Failed to write packet');
    };

    // Write any buffered packets first
    for (const bufferedPacket of streamInfo.bufferedPackets) {
      write(bufferedPacket);
      bufferedPacket.free();
    }
    streamInfo.bufferedPackets = [];

    // Write the current packet
    write(packet);
  }

  /**
   * Close media output and free resources.
   *
   * Automatically writes trailer if header was written.
   * Closes the output file and releases all resources.
   * Safe to call multiple times.
   * Automatically called by Symbol.asyncDispose.
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.open('output.mp4');
   * try {
   *   // Use output - trailer written automatically on close
   * } finally {
   *   await output.close();
   * }
   * ```
   *
   * @see {@link Symbol.asyncDispose} For automatic cleanup
   */
  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Free any buffered packets
    for (const streamInfo of this.streams.values()) {
      // Free any buffered packets
      for (const pkt of streamInfo.bufferedPackets) {
        pkt.free();
      }
      streamInfo.bufferedPackets = [];
    }

    // Try to write trailer if header was written but trailer wasn't
    try {
      if (this.headerWritten && !this.trailerWritten) {
        await this.formatContext.writeTrailer();
        this.trailerWritten = true;
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
   * Close media output and free resources synchronously.
   * Synchronous version of close.
   *
   * Automatically writes trailer if header was written.
   * Closes the output file and releases all resources.
   * Safe to call multiple times.
   * Automatically called by Symbol.dispose.
   *
   * @example
   * ```typescript
   * const output = MediaOutput.openSync('output.mp4');
   * try {
   *   // Use output - trailer written automatically on close
   * } finally {
   *   output.closeSync();
   * }
   * ```
   *
   * @see {@link close} For async version
   */
  closeSync(): void {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Free any buffered packets
    for (const streamInfo of this.streams.values()) {
      // Free any buffered packets
      for (const pkt of streamInfo.bufferedPackets) {
        pkt.free();
      }
      streamInfo.bufferedPackets = [];
    }

    // Try to write trailer if header was written but trailer wasn't
    try {
      if (this.headerWritten && !this.trailerWritten) {
        this.formatContext.writeTrailerSync();
        this.trailerWritten = true;
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
        this.ioContext.closepSync();
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

  /**
   * Dispose of media output synchronously.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling closeSync().
   *
   * @example
   * ```typescript
   * {
   *   using output = MediaOutput.openSync('output.mp4');
   *   // Use output...
   * } // Automatically closed
   * ```
   *
   * @see {@link closeSync} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.closeSync();
  }
}
