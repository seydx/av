import { bindings } from './binding.js';
import { AV_IO_FLAG_READ } from './constants.js';

import type { AVIOFlag, AVSeekWhence } from './constants.js';
import type { NativeIOContext, NativeWrapper } from './native-types.js';

/**
 * FFmpeg I/O Context - Low Level API
 *
 * Direct mapping to FFmpeg's AVIOContext.
 * Provides custom I/O for reading/writing data from/to files, network, memory, etc.
 *
 * @example
 * ```typescript
 * // Open a file for reading
 * const io = new IOContext();
 * const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Read data
 * const buffer = await io.read(4096);
 *
 * // Seek to position
 * await io.seek(1024n, SEEK_SET);
 *
 * // Get file size
 * const size = await io.size();
 *
 * // Clean up
 * await io.closep();
 * ```
 *
 * @example
 * ```typescript
 * // Custom I/O with callbacks
 * const io = new IOContext();
 * io.allocContext(
 *   4096,           // buffer size
 *   0,              // read mode
 *   readCallback,   // custom read function
 *   null,           // no write
 *   seekCallback    // custom seek function
 * );
 *
 * // Use with FormatContext
 * const ctx = new FormatContext();
 * ctx.allocContext();
 * ctx.pb = io;
 * await ctx.openInput(null, null, null);
 * ```
 */
export class IOContext implements AsyncDisposable, NativeWrapper<NativeIOContext> {
  private native: NativeIOContext;

  // Constructor
  /**
   * Create a new I/O context.
   *
   * The context is uninitialized - you must call allocContext() or open2() before use.
   * Direct wrapper around AVIOContext.
   *
   * @example
   * ```typescript
   * const io = new IOContext();
   * await io.open2('file.mp4', AVIO_FLAG_READ);
   * // I/O context is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.IOContext();
  }

  // Static Methods

  /**
   * Create an IOContext wrapper from a native IOContext.
   *
   * Used internally when getting IOContext from other objects.
   * @internal
   *
   * @param native - Native IOContext to wrap
   * @returns Wrapped IOContext instance
   */
  static fromNative(native: NativeIOContext): IOContext {
    const io = Object.create(IOContext.prototype) as IOContext;
    (io as any).native = native;
    return io;
  }

  // Getter/Setter Properties

  /**
   * Check if end of file reached.
   *
   * Direct mapping to avio_feof()
   *
   * @readonly
   */
  get eof(): boolean {
    return this.native.eof;
  }

  /**
   * Error code if any.
   *
   * Direct mapping to AVIOContext->error
   *
   * @readonly
   */
  get error(): number {
    return this.native.error;
  }

  /**
   * Whether seeking is possible.
   *
   * Direct mapping to AVIOContext->seekable
   *
   * Bitmask of AVIO_SEEKABLE_* flags.
   * @readonly
   */
  get seekable(): number {
    return this.native.seekable;
  }

  /**
   * Maximum packet size.
   *
   * Direct mapping to AVIOContext->max_packet_size
   *
   * If non-zero, indicates the maximum packet size.
   */
  get maxPacketSize(): number {
    return this.native.maxPacketSize;
  }

  set maxPacketSize(value: number) {
    this.native.maxPacketSize = value;
  }

  /**
   * Whether direct mode is enabled.
   *
   * Direct mapping to AVIOContext->direct
   *
   * avio_read and avio_write should if possible be satisfied directly
   * instead of going through a buffer, and avio_seek will always call
   * the underlying seek function directly.
   */
  get direct(): number {
    return this.native.direct;
  }

  set direct(value: number) {
    this.native.direct = value;
  }

  /**
   * Get current position in the file.
   *
   * Direct mapping to AVIOContext->pos
   *
   * @readonly
   */
  get pos(): bigint {
    return this.native.pos;
  }

  /**
   * Get buffer size.
   *
   * Direct mapping to AVIOContext->buffer_size
   *
   * @readonly
   */
  get bufferSize(): number {
    return this.native.bufferSize;
  }

  /**
   * Check if opened for writing.
   *
   * Direct mapping to AVIOContext->write_flag
   *
   * @readonly
   */
  get writeFlag(): boolean {
    return this.native.writeFlag;
  }

  // Public Methods - Lifecycle

  /**
   * Create and initialize a AVIOContext for buffered I/O.
   *
   * Direct mapping to avio_alloc_context()
   *
   * @param bufferSize - Size of the buffer
   * @param writeFlag - 1 if writing, 0 if reading
   *
   * @example
   * ```typescript
   * const io = new IOContext();
   * io.allocContext(4096, 0); // 4KB buffer for reading
   * ```
   *
   * @note For file I/O, use open2() instead.
   */
  allocContext(bufferSize: number, writeFlag: number): void {
    return this.native.allocContext(bufferSize, writeFlag);
  }

  /**
   * Allocate an AVIOContext with custom callbacks.
   *
   * Creates a custom I/O context with JavaScript callbacks for read, write, and seek operations.
   *
   * @param bufferSize - Size of the buffer in bytes
   * @param writeFlag - 0 for read, 1 for write
   * @param readCallback - Callback for reading data. Returns Buffer, null for EOF, or negative error code
   * @param writeCallback - Callback for writing data. Returns bytes written or negative error code
   * @param seekCallback - Callback for seeking. Returns new position or negative error code
   *
   * @example
   * ```typescript
   * const io = new IOContext();
   * io.allocContextWithCallbacks(
   *   4096,
   *   0,
   *   (size) => {
   *     // Read up to 'size' bytes
   *     return buffer.slice(position, position + size);
   *   },
   *   null,
   *   (offset, whence) => {
   *     // Seek to position
   *     if (whence === 0) position = Number(offset);
   *     else if (whence === 1) position += Number(offset);
   *     else if (whence === 2) position = buffer.length + Number(offset);
   *     return BigInt(position);
   *   }
   * );
   * ```
   */
  allocContextWithCallbacks(
    bufferSize: number,
    writeFlag: number,
    readCallback?: (size: number) => Buffer | null | number,
    writeCallback?: (buffer: Buffer) => number | void,
    seekCallback?: (offset: bigint, whence: number) => bigint | number,
  ): void {
    return this.native.allocContextWithCallbacks(bufferSize, writeFlag, readCallback, writeCallback, seekCallback);
  }

  /**
   * Free the AVIOContext.
   *
   * Direct mapping to avio_context_free()
   *
   * @example
   * ```typescript
   * io.freeContext();
   * // io is now invalid and should not be used
   * ```
   */
  freeContext(): void {
    return this.native.freeContext();
  }

  /**
   * Open resource for reading/writing.
   *
   * Direct mapping to avio_open2()
   *
   * @param url - URL to open (file://, http://, etc.)
   * @param flags - AVIO_FLAG_READ, AVIO_FLAG_WRITE, etc.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOENT): File not found
   *   - AVERROR(EACCES): Permission denied
   *   - AVERROR(EIO): I/O error
   *   - <0: Other protocol-specific errors
   *
   * @example
   * ```typescript
   * const io = new IOContext();
   * const ret = await io.open2('file.mp4', AVIO_FLAG_READ);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  async open2(url: string, flags: AVIOFlag = AV_IO_FLAG_READ): Promise<number> {
    return this.native.open2(url, flags);
  }

  /**
   * Close the resource and free the AVIOContext.
   *
   * Direct mapping to avio_closep()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EIO): I/O error during close
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = await io.closep();
   * if (ret < 0) {
   *   console.error('Error closing I/O context');
   * }
   * ```
   */
  async closep(): Promise<number> {
    return this.native.closep();
  }

  // Public Methods - I/O Operations

  /**
   * Read size bytes from AVIOContext.
   *
   * Direct mapping to avio_read()
   *
   * @param size - Number of bytes to read
   *
   * @returns Buffer with data or error code if negative:
   *   - Buffer: Successfully read data
   *   - AVERROR_EOF: End of file reached
   *   - AVERROR(EIO): I/O error
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const data = await io.read(1024);
   * if (typeof data === 'number' && data < 0) {
   *   if (data === AVERROR_EOF) {
   *     console.log('End of file');
   *   } else {
   *     throw new FFmpegError(data);
   *   }
   * } else {
   *   // Process buffer
   *   console.log(`Read ${data.length} bytes`);
   * }
   * ```
   */
  async read(size: number): Promise<Buffer | number> {
    return this.native.read(size);
  }

  /**
   * Write buffer to AVIOContext.
   *
   * Direct mapping to avio_write()
   *
   * @param buffer - Buffer to write
   *
   * @example
   * ```typescript
   * const data = Buffer.from('Hello, World!');
   * await io.write(data);
   * ```
   *
   * @throws {Error} If write fails
   */
  async write(buffer: Buffer): Promise<void> {
    return this.native.write(buffer);
  }

  /**
   * Seek to a given offset.
   *
   * Direct mapping to avio_seek()
   *
   * @param offset - Offset to seek to
   * @param whence - SEEK_SET (0), SEEK_CUR (1), SEEK_END (2), or AVSEEK_SIZE (0x10000)
   *
   * @returns New position or negative AVERROR:
   *   - >=0: New position in bytes
   *   - AVERROR(EINVAL): Invalid whence value
   *   - AVERROR(ESPIPE): Seek not supported
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Seek to beginning
   * const pos = await io.seek(0n, AV_SEEK_SET);
   *
   * // Seek to end
   * await io.seek(0n, AV_SEEK_END);
   *
   * // Get file size without changing position
   * const size = await io.seek(0n, AV_SEEK_SIZE);
   * console.log(`File size: ${size} bytes`);
   * ```
   */
  async seek(offset: bigint, whence: AVSeekWhence): Promise<bigint> {
    return this.native.seek(offset, whence);
  }

  /**
   * Get the file size.
   *
   * Direct mapping to avio_size()
   *
   * @returns File size or negative AVERROR:
   *   - >=0: File size in bytes
   *   - AVERROR(ENOSYS): Operation not supported
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const size = await io.size();
   * if (size < 0n) {
   *   console.error('Cannot determine file size');
   * } else {
   *   console.log(`File size: ${size} bytes`);
   * }
   * ```
   */
  async size(): Promise<bigint> {
    return this.native.size();
  }

  /**
   * Force flushing of buffered data.
   *
   * Direct mapping to avio_flush()
   *
   * @example
   * ```typescript
   * await io.flush();
   * // All buffered data has been written
   * ```
   */
  async flush(): Promise<void> {
    return this.native.flush();
  }

  /**
   * Skip given number of bytes forward.
   *
   * Direct mapping to avio_skip()
   *
   * @param offset - Number of bytes to skip
   *
   * @returns New position or negative AVERROR:
   *   - >=0: New position in bytes
   *   - AVERROR_EOF: End of file reached
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Skip 1024 bytes
   * const newPos = await io.skip(1024n);
   * if (newPos < 0n) {
   *   throw new FFmpegError(Number(newPos));
   * }
   * ```
   */
  async skip(offset: bigint): Promise<bigint> {
    return this.native.skip(offset);
  }

  /**
   * Get the current position.
   *
   * Direct mapping to avio_tell()
   *
   * @returns Current position in bytes
   *
   * @example
   * ```typescript
   * const position = io.tell();
   * console.log(`Current position: ${position} bytes`);
   * ```
   */
  tell(): bigint {
    return this.native.tell();
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVIOContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native I/O context object
   */
  getNative(): NativeIOContext {
    return this.native;
  }

  /**
   * Dispose of the I/O context.
   *
   * Implements the AsyncDisposable interface for automatic cleanup.
   * Equivalent to calling closep().
   *
   * @example
   * ```typescript
   * {
   *   await using io = new IOContext();
   *   await io.open2('file.mp4', AVIO_FLAG_READ);
   *   // ... use I/O context
   * } // Automatically closed when leaving scope
   * ```
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.native[Symbol.asyncDispose]();
  }
}
