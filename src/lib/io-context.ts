import { bindings } from './binding.js';
import { AVIO_FLAG_READ } from './constants.js';
import { OptionMember } from './option.js';

import type { AVIOFlag, AVSeekWhence } from './constants.js';
import type { NativeIOContext, NativeWrapper } from './native-types.js';

/**
 * I/O context for custom input/output operations.
 *
 * Provides buffered I/O and protocol handling for reading/writing data
 * from/to files, network streams, memory buffers, or custom sources.
 * Can be used with FormatContext for custom I/O or standalone for direct I/O operations.
 *
 * Direct mapping to FFmpeg's AVIOContext.
 *
 * @example
 * ```typescript
 * import { IOContext, FFmpegError } from '@seydx/av';
 * import { AVIO_FLAG_READ, AVSEEK_SET } from '@seydx/av/constants';
 *
 * // Open a file for reading
 * const io = new IOContext();
 * const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
 * FFmpegError.throwIfError(ret, 'open2');
 *
 * // Read data
 * const buffer = await io.read(4096);
 *
 * // Seek to position
 * const seekRet = await io.seek(1024n, AVSEEK_SET);
 * FFmpegError.throwIfError(seekRet < 0 ? -1 : 0, 'seek');
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
 * io.allocContextWithCallbacks(
 *   4096,           // buffer size
 *   0,              // read mode
 *   (size) => {     // custom read function
 *     return myBuffer.slice(pos, pos + size);
 *   },
 *   null,           // no write
 *   (offset, whence) => { // custom seek function
 *     return BigInt(calculateNewPosition(offset, whence));
 *   }
 * );
 *
 * // Use with FormatContext
 * const ctx = new FormatContext();
 * ctx.allocOutputContext2(null, 'mp4', null);
 * ctx.pb = io;
 * const openRet = await ctx.openInput(null, null, null);
 * FFmpegError.throwIfError(openRet, 'openInput');
 * ```
 *
 * @see {@link FormatContext} For using custom I/O with containers
 */
export class IOContext extends OptionMember<NativeIOContext> implements AsyncDisposable, NativeWrapper<NativeIOContext> {
  /**
   * Create a new I/O context instance.
   *
   * The context is uninitialized - you must call allocContext() or open2() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around AVIOContext allocation.
   *
   * @example
   * ```typescript
   * import { IOContext, FFmpegError, AVIO_FLAG_READ } from '@seydx/av';
   *
   * const io = new IOContext();
   * const ret = await io.open2('file.mp4', AVIO_FLAG_READ);
   * FFmpegError.throwIfError(ret, 'open2');
   * // I/O context is now ready for use
   * ```
   */
  constructor() {
    super(new bindings.IOContext());
  }

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

  /**
   * Create and initialize a buffered I/O context.
   *
   * Allocates an I/O context with an internal buffer for efficient I/O operations.
   * For file I/O, use open2() instead which handles allocation automatically.
   *
   * Direct mapping to avio_alloc_context()
   *
   * @param bufferSize - Size of the internal buffer in bytes
   * @param writeFlag - 1 for writing, 0 for reading
   *
   * @example
   * ```typescript
   * import { IOContext } from '@seydx/av';
   *
   * const io = new IOContext();
   * io.allocContext(4096, 0); // 4KB buffer for reading
   *
   * // For writing
   * const writeIO = new IOContext();
   * writeIO.allocContext(8192, 1); // 8KB buffer for writing
   * ```
   *
   * @see {@link allocContextWithCallbacks} For custom I/O callbacks
   * @see {@link open2} For file I/O
   */
  allocContext(bufferSize: number, writeFlag: number): void {
    return this.native.allocContext(bufferSize, writeFlag);
  }

  /**
   * Allocate an AVIOContext with custom callbacks.
   *
   * Creates a custom I/O context with JavaScript callbacks for read, write, and seek operations.
   *
   * IMPORTANT: Callbacks must be synchronous! They are called from FFmpeg's thread and must
   * return immediately. If you need async operations, buffer the data in JavaScript first.
   *
   * Direct mapping to avio_alloc_context() with custom callbacks
   *
   * @param bufferSize - Size of the buffer in bytes
   * @param writeFlag - 0 for read, 1 for write
   * @param readCallback - Synchronous callback for reading data. Returns Buffer, null for EOF, or negative error code
   * @param writeCallback - Synchronous callback for writing data. Returns bytes written or negative error code
   * @param seekCallback - Synchronous callback for seeking. Returns new position or negative error code
   *
   * @example
   * ```typescript
   * import { IOContext, AVSEEK_SET, AVSEEK_CUR, AVSEEK_END } from '@seydx/av';
   *
   * const io = new IOContext();
   * let position = 0;
   * const buffer = Buffer.from('example data');
   *
   * io.allocContextWithCallbacks(
   *   4096,
   *   0,
   *   (size) => {
   *     // Read up to 'size' bytes - MUST BE SYNCHRONOUS
   *     return buffer.slice(position, position + size);
   *   },
   *   null,
   *   (offset, whence) => {
   *     // Seek to position - MUST BE SYNCHRONOUS
   *     if (whence === AVSEEK_SET) position = Number(offset);
   *     else if (whence === AVSEEK_CUR) position += Number(offset);
   *     else if (whence === AVSEEK_END) position = buffer.length + Number(offset);
   *     return BigInt(position);
   *   }
   * );
   * ```
   *
   * @see {@link allocContext} For simple buffer allocation
   */
  allocContextWithCallbacks(
    bufferSize: number,
    writeFlag: 0 | 1,
    readCallback?: ((size: number) => Buffer | null | number) | null,
    writeCallback?: ((buffer: Buffer) => number | void) | null,
    seekCallback?: ((offset: bigint, whence: number) => bigint | number) | null,
  ): void {
    return this.native.allocContextWithCallbacks(bufferSize, writeFlag, readCallback ?? undefined, writeCallback ?? undefined, seekCallback ?? undefined);
  }

  /**
   * Free the AVIOContext.
   *
   * Direct mapping to avio_context_free()
   *
   * @example
   * ```typescript
   * import { IOContext } from '@seydx/av';
   *
   * io.freeContext();
   * // io is now invalid and should not be used
   * ```
   */
  freeContext(): void {
    return this.native.freeContext();
  }

  /**
   * Open a resource for reading or writing.
   *
   * Opens a URL using the appropriate protocol handler (file, http, etc.).
   * Automatically allocates and initializes the I/O context.
   *
   * Direct mapping to avio_open2()
   *
   * @param url - URL to open (file://, http://, https://, etc.)
   * @param flags - I/O flags (AVIO_FLAG_READ, AVIO_FLAG_WRITE, etc.)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOENT): File not found
   *   - AVERROR(EACCES): Permission denied
   *   - AVERROR(EIO): I/O error
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other protocol-specific errors
   *
   * @example
   * ```typescript
   * import { IOContext, FFmpegError } from '@seydx/av';
   * import { AVIO_FLAG_READ, AVIO_FLAG_WRITE } from '@seydx/av/constants';
   *
   * // Open file for reading
   * const io = new IOContext();
   * const ret = await io.open2('input.mp4', AVIO_FLAG_READ);
   * FFmpegError.throwIfError(ret, 'open2');
   *
   * // Open file for writing
   * const writeIO = new IOContext();
   * const writeRet = await writeIO.open2('output.mp4', AVIO_FLAG_WRITE);
   * FFmpegError.throwIfError(writeRet, 'open2');
   *
   * // Open network stream
   * const streamIO = new IOContext();
   * const streamRet = await streamIO.open2('http://example.com/stream.m3u8', AVIO_FLAG_READ);
   * FFmpegError.throwIfError(streamRet, 'open2');
   * ```
   *
   * @see {@link closep} To close and free resources
   */
  async open2(url: string, flags: AVIOFlag = AVIO_FLAG_READ): Promise<number> {
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
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = await io.closep();
   * FFmpegError.throwIfError(ret, 'closep');
   * // I/O context is now closed and freed
   * ```
   */
  async closep(): Promise<number> {
    return this.native.closep();
  }

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
   * import { FFmpegError, AVERROR_EOF } from '@seydx/av';
   *
   * const data = await io.read(1024);
   * if (typeof data === 'number' && data < 0) {
   *   if (data === AVERROR_EOF) {
   *     console.log('End of file');
   *   } else {
   *     FFmpegError.throwIfError(data, 'read');
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
   * import { IOContext } from '@seydx/av';
   *
   * const data = Buffer.from('Hello, World!');
   * await io.write(data);
   * // Data written successfully
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
   * @param whence - AVSEEK_SET (0), AVSEEK_CUR (1), AVSEEK_END (2), or AVSEEK_SIZE (0x10000)
   *
   * @returns New position or negative AVERROR:
   *   - >=0: New position in bytes
   *   - AVERROR(EINVAL): Invalid whence value
   *   - AVERROR(ESPIPE): Seek not supported
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError, AVSEEK_SET, AVSEEK_END, AVSEEK_SIZE } from '@seydx/av';
   *
   * // Seek to beginning
   * const pos = await io.seek(0n, AVSEEK_SET);
   * FFmpegError.throwIfError(pos < 0n ? Number(pos) : 0, 'seek');
   *
   * // Seek to end
   * const endPos = await io.seek(0n, AVSEEK_END);
   * FFmpegError.throwIfError(endPos < 0n ? Number(endPos) : 0, 'seek');
   *
   * // Get file size without changing position
   * const size = await io.seek(0n, AVSEEK_SIZE);
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
   * import { FFmpegError } from '@seydx/av';
   *
   * const size = await io.size();
   * if (size < 0n) {
   *   // Handle unsupported or error
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
   * import { IOContext } from '@seydx/av';
   *
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
   * import { FFmpegError } from '@seydx/av';
   *
   * // Skip 1024 bytes
   * const newPos = await io.skip(1024n);
   * FFmpegError.throwIfError(newPos < 0n ? Number(newPos) : 0, 'skip');
   * console.log(`New position: ${newPos}`);
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
   * import { IOContext } from '@seydx/av';
   *
   * const position = io.tell();
   * console.log(`Current position: ${position} bytes`);
   * ```
   */
  tell(): bigint {
    return this.native.tell();
  }

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
   * import { IOContext, AVIO_FLAG_READ } from '@seydx/av';
   *
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
