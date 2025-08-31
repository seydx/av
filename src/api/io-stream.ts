/**
 * IOStream - Custom I/O Factory for FFmpeg
 *
 * Provides factory methods for creating IOContext instances from various sources.
 * Supports Buffers for in-memory operations and custom callbacks for full control.
 *
 * All methods are static - this class cannot be instantiated.
 * Use the overloaded create() method to create IOContext from different input types.
 *
 * @module api/io-stream
 */

import { AVSEEK_CUR, AVSEEK_END, AVSEEK_SET, AVSEEK_SIZE } from '../constants/constants.js';
import { IOContext } from '../lib/index.js';

import type { IOInputCallbacks, MediaInputOptions } from './types.js';

/**
 * Factory class for creating IOContext instances.
 *
 * Provides a unified interface for creating custom I/O contexts from:
 * - Buffers for in-memory data
 * - Custom callbacks for full I/O control
 *
 * @example
 * ```typescript
 * import { IOStream } from 'node-av/api';
 * import { readFile } from 'fs/promises';
 *
 * // From Buffer
 * const buffer = await readFile('video.mp4');
 * const ioContext = IOStream.create(buffer);
 *
 * // From custom callbacks
 * const ioContext = IOStream.create({
 *   read: (size) => customSource.read(size),
 *   seek: (offset, whence) => customSource.seek(offset, whence)
 * });
 * ```
 */
export class IOStream {
  // Private constructor to prevent instantiation
  private constructor() {
    throw new Error('IOStream is a static class and cannot be instantiated');
  }

  /**
   * Create IOContext from a Buffer.
   *
   * Creates an I/O context for reading from in-memory data.
   * Automatically handles seeking within the buffer.
   *
   * @param buffer - Buffer containing media data
   * @param options - Optional configuration
   *
   * @returns IOContext instance ready for use
   *
   * @example
   * ```typescript
   * const buffer = await readFile('video.mp4');
   * const ioContext = IOStream.create(buffer);
   * ```
   */
  static create(buffer: Buffer, options?: MediaInputOptions): IOContext;

  /**
   * Create IOContext from custom callbacks.
   *
   * Creates an I/O context with custom read and seek operations.
   * Callbacks must be synchronous and return immediately.
   *
   * @param callbacks - Custom I/O callbacks (read required, seek optional)
   * @param options - Optional configuration
   *
   * @returns IOContext instance ready for use
   *
   * @throws {Error} If read callback is not provided
   *
   * @example
   * ```typescript
   * const ioContext = IOStream.create({
   *   read: (size) => buffer.slice(pos, pos + size),
   *   seek: (offset, whence) => calculatePosition(offset, whence)
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
   * Create IOContext from a Buffer with position tracking.
   *
   * Sets up read and seek callbacks that operate on the buffer.
   * Maintains internal position state for sequential reading.
   *
   * @param buffer - Buffer containing the data
   * @param bufferSize - Internal buffer size for IOContext
   *
   * @returns Configured IOContext instance
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
   * Create IOContext from user-provided callbacks.
   *
   * Validates and wraps the provided callbacks for use with FFmpeg.
   * Only supports read mode as high-level API doesn't expose write operations.
   *
   * @param callbacks - User-provided I/O callbacks
   * @param bufferSize - Internal buffer size for IOContext
   *
   * @returns Configured IOContext instance
   *
   * @throws {Error} If read callback is not provided
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
