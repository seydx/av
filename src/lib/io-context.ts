import { bindings } from './binding.js';

import type { AVIOFlag } from './constants.js';

/**
 * I/O context for custom input/output operations
 *
 * IOContext provides low-level I/O operations for reading and writing
 * media data. It can be used for custom protocols, memory buffers,
 * or network streams.
 *
 * @example
 * ```typescript
 * // Open file for writing
 * const io = new IOContext();
 * await io.openAsync('output.mp4', AV_IO_FLAG_WRITE);
 *
 * // Use with FormatContext
 * formatContext.pb = io;
 * ```
 */
export class IOContext implements Disposable {
  private native: any; // Native IO context binding

  constructor() {
    this.native = new bindings.IOContext();
  }

  /**
   * Open an I/O context
   * @param url URL or file path to open
   * @param flags I/O flags (e.g., AV_IO_FLAG_WRITE)
   * @param options Optional dictionary of options
   */
  open(url: string, flags: AVIOFlag, options?: Record<string, string>): void {
    this.native.open(url, flags, options);
  }

  /**
   * Open an I/O context asynchronously
   * @param url URL or file path to open
   * @param flags I/O flags (e.g., AV_IO_FLAG_WRITE)
   * @param options Optional dictionary of options
   */
  async openAsync(url: string, flags: AVIOFlag, options?: Record<string, string>): Promise<void> {
    await this.native.openAsync(url, flags, options);
  }

  /**
   * Close the I/O context
   */
  close(): void {
    this.native.close();
  }

  /**
   * Flush buffered data
   */
  flush(): void {
    this.native.flush();
  }

  /**
   * Get the file size
   */
  get size(): bigint | null {
    const size = this.native.size;
    return size !== null ? BigInt(size) : null;
  }

  /**
   * Get the current position
   */
  get pos(): bigint {
    return BigInt(this.native.pos);
  }

  /**
   * Check if at end of file
   */
  get eof(): boolean {
    return this.native.eof;
  }

  /**
   * Check if seekable
   */
  get seekable(): boolean {
    return this.native.seekable;
  }

  /**
   * Get native binding object for internal use
   * @internal
   */
  getNative(): any {
    return this.native;
  }

  // ==================== Disposable ====================

  /**
   * Dispose of the I/O context
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
