import { AVSEEK_CUR, AVSEEK_END, AVSEEK_SET, AVSEEK_SIZE } from '../constants/constants.js';
import { IOContext } from '../lib/index.js';

import type { IOInputCallbacks, MediaInputOptions } from './types.js';

/**
 * Factory for creating custom I/O contexts.
 *
 * Provides simplified creation of I/O contexts from buffers or custom callbacks.
 * Handles buffer management and seek operations for in-memory media.
 * Bridges the gap between high-level media operations and custom I/O sources.
 * Essential for processing media from non-file sources like network streams or memory.
 *
 * @example
 * ```typescript
 * import { IOStream, MediaInput } from 'node-av/api';
 *
 * // From buffer
 * const buffer = await fs.readFile('video.mp4');
 * const ioContext = IOStream.create(buffer);
 * const input = await MediaInput.open(buffer);
 * ```
 *
 * @example
 * ```typescript
 * // Custom I/O callbacks
 * const callbacks = {
 *   read: async (size: number) => {
 *     // Read from custom source
 *     return Buffer.alloc(size);
 *   },
 *   seek: async (offset: bigint, whence: number) => {
 *     // Seek in custom source
 *     return offset;
 *   }
 * };
 *
 * const ioContext = IOStream.create(callbacks, {
 *   bufferSize: 4096
 * });
 * ```
 *
 * @see {@link IOContext} For low-level I/O operations
 * @see {@link MediaInput} For using I/O contexts
 * @see {@link IOInputCallbacks} For callback interface
 */
export class IOStream {
  /**
   * Create I/O context from buffer.
   *
   * Creates an I/O context from an in-memory buffer for reading media data.
   * Automatically handles seek operations and position tracking.
   *
   * @param buffer - Buffer containing media data
   * @param options - I/O configuration options
   * @returns Configured I/O context
   *
   * @example
   * ```typescript
   * const buffer = await fs.readFile('video.mp4');
   * const ioContext = IOStream.create(buffer, {
   *   bufferSize: 8192
   * });
   * ```
   */
  static create(buffer: Buffer, options?: MediaInputOptions): IOContext;
  /**
   * Create I/O context from callbacks.
   *
   * Creates an I/O context using custom read and seek callbacks.
   * Useful for streaming from non-file sources like network or custom storage.
   *
   * @param callbacks - I/O callbacks for read and seek operations
   * @param options - I/O configuration options
   * @returns Configured I/O context
   *
   * @throws {Error} If callbacks missing required read function
   *
   * @example
   * ```typescript
   * const ioContext = IOStream.create({
   *   read: async (size) => {
   *     return await customSource.read(size);
   *   },
   *   seek: async (offset, whence) => {
   *     return await customSource.seek(offset, whence);
   *   }
   * });
   * ```
   */
  static create(callbacks: IOInputCallbacks, options?: MediaInputOptions): IOContext;
  static create(input: Buffer | IOInputCallbacks, options: MediaInputOptions = {}): IOContext | Promise<IOContext> {
    const { bufferSize = 8192 } = options;

    // Handle Buffer
    if (Buffer.isBuffer(input)) {
      return this.createFromBuffer(input, bufferSize);
    }

    // Handle custom callbacks
    if (typeof input === 'object' && 'read' in input) {
      return this.createFromCallbacks(input, bufferSize);
    }

    throw new TypeError('Invalid input type. Expected Buffer or IOInputCallbacks');
  }

  /**
   * Create I/O context from buffer.
   *
   * Sets up read and seek callbacks for in-memory buffer.
   * Manages position tracking and EOF handling.
   *
   * @param buffer - Source buffer
   * @param bufferSize - Internal buffer size
   *
   * @returns Configured I/O context
   *
   * @internal
   */
  private static createFromBuffer(buffer: Buffer, bufferSize: number): IOContext {
    let position = 0;

    const ioContext = new IOContext();
    ioContext.allocContextWithCallbacks(
      bufferSize,
      0,
      (size: number) => {
        if (position >= buffer.length) {
          return null; // EOF
        }

        const chunk = buffer.subarray(position, Math.min(position + size, buffer.length));
        position += chunk.length;
        return chunk;
      },
      undefined,
      (offset: bigint, whence: number) => {
        switch (whence) {
          case AVSEEK_SIZE:
            return BigInt(buffer.length);
          case AVSEEK_SET:
            position = Number(offset);
            break;
          case AVSEEK_CUR:
            position += Number(offset);
            break;
          case AVSEEK_END:
            position = buffer.length + Number(offset);
            break;
        }

        // Clamp position
        position = Math.max(0, Math.min(position, buffer.length));
        return BigInt(position);
      },
    );

    return ioContext;
  }

  /**
   * Create I/O context from callbacks.
   *
   * Sets up custom I/O with user-provided callbacks.
   * Supports read and optional seek operations.
   *
   * @param callbacks - User I/O callbacks
   * @param bufferSize - Internal buffer size
   *
   * @returns Configured I/O context
   *
   * @throws {Error} If read callback not provided
   *
   * @internal
   */
  private static createFromCallbacks(callbacks: IOInputCallbacks, bufferSize: number): IOContext {
    // We only support read mode in the high-level API
    // Write mode would be needed for custom output, which we don't currently support

    if (!callbacks.read) {
      throw new Error('Read callback is required');
    }

    const ioContext = new IOContext();
    ioContext.allocContextWithCallbacks(
      bufferSize,
      0, // Always read mode
      callbacks.read,
      undefined, // No write callback in high-level API
      callbacks.seek,
    );

    return ioContext;
  }
}
