import { AVIO_FLAG_READ } from '../constants/constants.js';
import { bindings } from './binding.js';
import { OptionMember } from './option.js';

import type { AVIOFlag, AVSeekWhence } from '../constants/constants.js';
import type { NativeIOContext, NativeWrapper } from './native-types.js';

/**
 * I/O context for custom input/output operations.
 *
 * Provides an abstraction layer for all I/O operations in FFmpeg.
 * Enables reading from and writing to various sources including files,
 * network streams, memory buffers, and custom callbacks. Essential for
 * implementing custom protocols or handling non-standard I/O scenarios.
 *
 * Direct mapping to FFmpeg's AVIOContext.
 *
 * @example
 * ```typescript
 * import { IOContext, FFmpegError } from 'node-av';
 * import { AVIO_FLAG_READ, AVIO_FLAG_WRITE, AVSEEK_SET } from 'node-av/constants';
 *
 * // Open file for reading
 * const io = new IOContext();
 * const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
 * FFmpegError.throwIfError(ret, 'open2');
 *
 * // Read data
 * const data = await io.read(4096);
 * if (data instanceof Buffer) {
 *   console.log(`Read ${data.length} bytes`);
 * }
 *
 * // Seek to position
 * const pos = await io.seek(1024n, AVSEEK_SET);
 * console.log(`Seeked to position ${pos}`);
 *
 * // Get file size
 * const fileSize = await io.size();
 * console.log(`File size: ${fileSize}`);
 *
 * // Close when done
 * await io.closep();
 *
 * // Custom I/O with callbacks
 * const customIO = new IOContext();
 * let position = 0n;
 * const buffer = Buffer.from('Hello World');
 *
 * customIO.allocContextWithCallbacks(
 *   4096,  // Buffer size
 *   0,     // Read mode
 *   (size) => {
 *     // Read callback
 *     const end = Number(position) + size;
 *     const chunk = buffer.subarray(Number(position), end);
 *     position = BigInt(end);
 *     return chunk;
 *   },
 *   null,  // No write callback for read mode
 *   (offset, whence) => {
 *     // Seek callback
 *     if (whence === AVSEEK_SET) position = offset;
 *     else if (whence === AVSEEK_CUR) position += offset;
 *     else if (whence === AVSEEK_END) position = BigInt(buffer.length) + offset;
 *     return position;
 *   }
 * );
 * ```
 *
 * @see {@link [AVIOContext](https://ffmpeg.org/doxygen/trunk/structAVIOContext.html)}
 * @see {@link FormatContext} For using with demuxing/muxing
 */
export class IOContext extends OptionMember<NativeIOContext> implements AsyncDisposable, NativeWrapper<NativeIOContext> {
  constructor() {
    super(new bindings.IOContext());
  }

  /**
   * Find input format by short name.
   *
   * Creates an IOContext instance from a native binding object.
   * Used internally for wrapping native I/O contexts.
   *
   * @param native - Native IOContext binding object
   * @returns Wrapped IOContext instance
   *
   * @internal
   */
  static fromNative(native: NativeIOContext): IOContext {
    const io = Object.create(IOContext.prototype) as IOContext;
    (io as any).native = native;
    return io;
  }

  /**
   * End of file indicator.
   *
   * True if end of file has been reached during reading.
   *
   * Direct mapping to AVIOContext->eof_reached.
   */
  get eof(): boolean {
    return this.native.eof;
  }

  /**
   * Error code.
   *
   * Contains the last error that occurred, or 0 if no error.
   *
   * Direct mapping to AVIOContext->error.
   */
  get error(): number {
    return this.native.error;
  }

  /**
   * Seekability indicator.
   *
   * Non-zero if the underlying resource supports seeking.
   * Some protocols like pipes or network streams may not be seekable.
   *
   * Direct mapping to AVIOContext->seekable.
   */
  get seekable(): number {
    return this.native.seekable;
  }

  /**
   * Maximum packet size.
   *
   * Used to limit packet sizes in network protocols.
   * 0 means no limit.
   *
   * Direct mapping to AVIOContext->max_packet_size.
   */
  get maxPacketSize(): number {
    return this.native.maxPacketSize;
  }

  set maxPacketSize(value: number) {
    this.native.maxPacketSize = value;
  }

  /**
   * Direct mode flag.
   *
   * If set, the I/O context will attempt to avoid buffering.
   *
   * Direct mapping to AVIOContext->direct.
   */
  get direct(): number {
    return this.native.direct;
  }

  set direct(value: number) {
    this.native.direct = value;
  }

  /**
   * Current position.
   *
   * Current byte position in the stream.
   *
   * Direct mapping to AVIOContext->pos.
   */
  get pos(): bigint {
    return this.native.pos;
  }

  /**
   * Internal buffer size.
   *
   * Size of the internal buffer used for I/O operations.
   *
   * Direct mapping to AVIOContext->buffer_size.
   */
  get bufferSize(): number {
    return this.native.bufferSize;
  }

  /**
   * Write flag.
   *
   * True if opened for writing, false for reading.
   *
   * Direct mapping to AVIOContext->write_flag.
   */
  get writeFlag(): boolean {
    return this.native.writeFlag;
  }

  /**
   * Allocate I/O context with buffer.
   *
   * Allocates a basic I/O context with an internal buffer.
   * For custom I/O, use allocContextWithCallbacks instead.
   *
   * Direct mapping to avio_alloc_context() without callbacks.
   *
   * @param bufferSize - Size of internal buffer
   * @param writeFlag - 1 for write, 0 for read
   *
   * @example
   * ```typescript
   * const io = new IOContext();
   * io.allocContext(4096, 0); // 4KB buffer for reading
   * ```
   *
   * @see {@link allocContextWithCallbacks} For custom I/O
   */
  allocContext(bufferSize: number, writeFlag: number): void {
    this.native.allocContext(bufferSize, writeFlag);
  }

  /**
   * Allocate I/O context with custom callbacks.
   *
   * Creates an I/O context with custom read, write, and seek callbacks.
   * Enables implementing custom protocols or data sources.
   *
   * Direct mapping to avio_alloc_context() with callbacks.
   *
   * @param bufferSize - Size of internal buffer
   * @param writeFlag - 1 for write mode, 0 for read mode
   * @param readCallback - Function to read data (null for write-only)
   * @param writeCallback - Function to write data (null for read-only)
   * @param seekCallback - Function to seek in stream (optional)
   *
   * @example
   * ```typescript
   * import { AVSEEK_SET, AVSEEK_CUR, AVSEEK_END, AVSEEK_SIZE } from 'node-av/constants';
   *
   * const data = Buffer.from('Custom data source');
   * let position = 0;
   *
   * io.allocContextWithCallbacks(
   *   4096,
   *   0, // Read mode
   *   (size) => {
   *     // Read callback
   *     if (position >= data.length) return -541; // EOF
   *     const chunk = data.subarray(position, position + size);
   *     position += chunk.length;
   *     return chunk;
   *   },
   *   null,
   *   (offset, whence) => {
   *     // Seek callback
   *     if (whence === AVSEEK_SIZE) return BigInt(data.length);
   *     if (whence === AVSEEK_SET) position = Number(offset);
   *     else if (whence === AVSEEK_CUR) position += Number(offset);
   *     else if (whence === AVSEEK_END) position = data.length + Number(offset);
   *     return BigInt(position);
   *   }
   * );
   * ```
   *
   * @see {@link allocContext} For simple allocation
   */
  allocContextWithCallbacks(
    bufferSize: number,
    writeFlag: 0 | 1,
    readCallback?: ((size: number) => Buffer | null | number) | null,
    writeCallback?: ((buffer: Buffer) => number | void) | null,
    seekCallback?: ((offset: bigint, whence: number) => bigint | number) | null,
  ): void {
    this.native.allocContextWithCallbacks(bufferSize, writeFlag, readCallback ?? undefined, writeCallback ?? undefined, seekCallback ?? undefined);
  }

  /**
   * Free I/O context.
   *
   * Releases the I/O context and its resources.
   * The context becomes invalid after calling this.
   *
   * Direct mapping to avio_context_free().
   *
   * @example
   * ```typescript
   * io.freeContext();
   * // Context is now invalid
   * ```
   */
  freeContext(): void {
    this.native.freeContext();
  }

  /**
   * Open resource for I/O.
   *
   * Opens a URL or file for reading or writing.
   * Automatically selects the appropriate protocol handler.
   *
   * Direct mapping to avio_open2().
   *
   * @param url - URL or file path to open
   * @param flags - Open flags (AVIO_FLAG_READ, AVIO_FLAG_WRITE, etc.)
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOENT: File not found
   *   - AVERROR_EACCES: Permission denied
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVIO_FLAG_READ, AVIO_FLAG_WRITE } from 'node-av/constants';
   *
   * // Open for reading
   * const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
   * FFmpegError.throwIfError(ret, 'open2');
   *
   * // Open for writing
   * const ret2 = await io.open2('output.mp4', AVIO_FLAG_WRITE);
   * FFmpegError.throwIfError(ret2, 'open2');
   * ```
   *
   * @see {@link closep} To close after use
   */
  async open2(url: string, flags: AVIOFlag = AVIO_FLAG_READ): Promise<number> {
    return await this.native.open2(url, flags);
  }

  /**
   * Close I/O context.
   *
   * Closes the I/O context and releases associated resources.
   * Flushes any buffered data before closing.
   *
   * Direct mapping to avio_closep().
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * const ret = await io.closep();
   * if (ret < 0) {
   *   console.error('Error closing I/O context');
   * }
   * ```
   *
   * @see {@link open2} To open resources
   */
  async closep(): Promise<number> {
    return await this.native.closep();
  }

  /**
   * Read data from I/O context.
   *
   * Reads up to the specified number of bytes from the stream.
   *
   * Direct mapping to avio_read().
   *
   * @param size - Maximum number of bytes to read
   * @returns Buffer with data, or error code if negative:
   *   - AVERROR_EOF: End of file reached
   *   - AVERROR_EIO: I/O error
   *
   * @example
   * ```typescript
   * const data = await io.read(4096);
   * if (data instanceof Buffer) {
   *   console.log(`Read ${data.length} bytes`);
   * } else {
   *   console.error(`Read error: ${data}`);
   * }
   * ```
   *
   * @see {@link write} For writing data
   */
  async read(size: number): Promise<Buffer | number> {
    return await this.native.read(size);
  }

  /**
   * Write data to I/O context.
   *
   * Writes buffer data to the stream.
   *
   * Direct mapping to avio_write().
   *
   * @param buffer - Data to write
   *
   * @example
   * ```typescript
   * const data = Buffer.from('Hello World');
   * await io.write(data);
   * ```
   *
   * @see {@link read} For reading data
   * @see {@link flush} To flush buffers
   */
  async write(buffer: Buffer): Promise<void> {
    await this.native.write(buffer);
  }

  /**
   * Seek to position in stream.
   *
   * Changes the current position in the stream.
   * Not all streams support seeking.
   *
   * Direct mapping to avio_seek().
   *
   * @param offset - Byte offset to seek to
   * @param whence - Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END)
   * @returns New position, or negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid arguments
   *   - AVERROR_ENOSYS: Seeking not supported
   *
   * @example
   * ```typescript
   * import { AVSEEK_SET, AVSEEK_CUR, AVSEEK_END } from 'node-av/constants';
   *
   * // Seek to absolute position
   * const pos1 = await io.seek(1024n, AVSEEK_SET);
   *
   * // Seek relative to current position
   * const pos2 = await io.seek(512n, AVSEEK_CUR);
   *
   * // Seek relative to end
   * const pos3 = await io.seek(-1024n, AVSEEK_END);
   * ```
   *
   * @see {@link tell} To get current position
   * @see {@link skip} For relative seeking
   */
  async seek(offset: bigint, whence: AVSeekWhence): Promise<bigint> {
    return await this.native.seek(offset, whence);
  }

  /**
   * Get stream size.
   *
   * Returns the total size of the stream in bytes.
   * Not all streams have a known size.
   *
   * Direct mapping to avio_size().
   *
   * @returns Size in bytes, or negative AVERROR if unknown:
   *   - AVERROR_ENOSYS: Size not available
   *
   * @example
   * ```typescript
   * const size = await io.size();
   * if (size >= 0n) {
   *   console.log(`Stream size: ${size} bytes`);
   * } else {
   *   console.log('Stream size unknown');
   * }
   * ```
   */
  async size(): Promise<bigint> {
    return await this.native.size();
  }

  /**
   * Flush buffered data.
   *
   * Forces any buffered data to be written to the underlying resource.
   *
   * Direct mapping to avio_flush().
   *
   * @example
   * ```typescript
   * await io.write(data);
   * await io.flush(); // Ensure data is written
   * ```
   *
   * @see {@link write} For writing data
   */
  async flush(): Promise<void> {
    await this.native.flush();
  }

  /**
   * Skip bytes in stream.
   *
   * Advances the position by the specified offset.
   * More efficient than reading and discarding data.
   *
   * Direct mapping to avio_skip().
   *
   * @param offset - Number of bytes to skip
   * @returns New position after skipping
   *
   * @example
   * ```typescript
   * // Skip 1024 bytes forward
   * const newPos = await io.skip(1024n);
   * console.log(`New position: ${newPos}`);
   * ```
   *
   * @see {@link seek} For absolute positioning
   */
  async skip(offset: bigint): Promise<bigint> {
    return await this.native.skip(offset);
  }

  /**
   * Get current position.
   *
   * Returns the current byte position in the stream.
   *
   * Direct mapping to avio_tell().
   *
   * @returns Current position in bytes
   *
   * @example
   * ```typescript
   * const position = io.tell();
   * console.log(`Current position: ${position}`);
   * ```
   *
   * @see {@link seek} To change position
   */
  tell(): bigint {
    return this.native.tell();
  }

  /**
   * Get the underlying native IOContext object.
   *
   * @returns The native IOContext binding object
   *
   * @internal
   */
  getNative(): NativeIOContext {
    return this.native;
  }

  /**
   * Dispose of the I/O context asynchronously.
   *
   * Implements the AsyncDisposable interface for automatic cleanup.
   * Closes the context and releases resources.
   *
   * @example
   * ```typescript
   * {
   *   await using io = new IOContext();
   *   await io.open2('input.mp4');
   *   // Use io...
   * } // Automatically closed when leaving scope
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.native[Symbol.asyncDispose]();
  }
}
