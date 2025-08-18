/**
 * IOStream - Node.js Stream Integration for FFmpeg
 *
 * Provides seamless integration between Node.js streams and FFmpeg's IOContext.
 * Enables reading from and writing to Node.js streams, Buffers, and custom callbacks.
 *
 * Factory class for creating IOContext instances from various Node.js sources.
 * All methods are static - this class cannot be instantiated.
 *
 * @module api/io-stream
 */

import { AV_SEEK_CUR, AV_SEEK_END, AV_SEEK_SET, AV_SEEK_SIZE } from '../lib/constants.js';
import { IOContext } from '../lib/index.js';

import type { Readable, Transform, Writable } from 'stream';
import type { IOCallbacks } from './types.js';

/**
 * IOStream - Wrapper for FFmpeg IOContext with Node.js stream support.
 *
 * Provides factory methods to create IOContext from various Node.js sources
 * including Readable streams, Writable streams, Buffers, and custom callbacks.
 *
 * This is a static factory class - all methods are static and the class
 * cannot be instantiated. Use the static methods to create IOContext instances.
 *
 * @example
 * ```typescript
 * import { IOStream } from '@seydx/ffmpeg/api';
 * import { createReadStream } from 'fs';
 *
 * // From file stream
 * const stream = createReadStream('video.mp4');
 * const ioContext = await IOStream.fromReadable(stream);
 *
 * // From Buffer
 * const buffer = await fs.readFile('video.mp4');
 * const ioContext = IOStream.fromBuffer(buffer);
 * ```
 */
export class IOStream {
  // 1. Private Properties
  // None - this is a factory class with static methods only

  // 2. Constructor
  private constructor() {
    // Private constructor to prevent instantiation
    throw new Error('IOStream is a static class and cannot be instantiated');
  }

  // 3. Static Factory Methods

  /**
   * Create IOContext from a Node.js Readable stream.
   *
   * Buffers the entire stream into memory before creating the IOContext.
   * For large files, consider using custom callbacks with streaming.
   *
   * Uses avio_alloc_context() internally to create a custom I/O context.
   * The stream is fully buffered into memory, then wrapped with read/seek callbacks.
   *
   * @param stream - Node.js Readable stream
   * @param bufferSize - Internal buffer size for IOContext (default: 8192)
   *
   * @returns Promise resolving to IOContext
   *
   * @throws {Error} If stream reading fails
   *
   * @example
   * ```typescript
   * const stream = createReadStream('video.mp4');
   * const ioContext = await IOStream.fromReadable(stream);
   * formatContext.pb = ioContext;
   * ```
   */
  static async fromReadable(stream: Readable, bufferSize = 8192): Promise<IOContext> {
    const chunks: Buffer[] = [];

    // Buffer all data from stream
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    const buffer = Buffer.concat(chunks);
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
          case AV_SEEK_SIZE:
            return BigInt(buffer.length);
          case AV_SEEK_SET:
            position = Number(offset);
            break;
          case AV_SEEK_CUR:
            position += Number(offset);
            break;
          case AV_SEEK_END:
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
   * Create IOContext from a Node.js Writable stream.
   *
   * Data written to the IOContext will be piped to the Writable stream.
   * Suitable for output operations like muxing.
   *
   * Uses avio_alloc_context() internally with write callbacks.
   * Write operations are synchronous and directly forwarded to the stream.
   *
   * @param stream - Node.js Writable stream
   * @param bufferSize - Internal buffer size for IOContext (default: 8192)
   *
   * @returns IOContext
   *
   * @throws {Error} If stream is not writable
   *
   * @example
   * ```typescript
   * const stream = createWriteStream('output.mp4');
   * const ioContext = IOStream.fromWritable(stream);
   * formatContext.pb = ioContext;
   * ```
   */
  static fromWritable(stream: Writable, bufferSize = 8192): IOContext {
    if (!stream.writable) {
      throw new Error('Stream is not writable');
    }

    const ioContext = new IOContext();
    ioContext.allocContextWithCallbacks(
      bufferSize,
      1,
      undefined,
      (data: Buffer) => {
        try {
          stream.write(data);
          return data.length;
        } catch {
          return -1; // Signal error
        }
      },
      undefined, // Most streams don't support seeking
    );

    return ioContext;
  }

  /**
   * Create IOContext from a Buffer.
   *
   * Useful for in-memory operations or when data is already loaded.
   * Supports both reading and seeking.
   *
   * Uses avio_alloc_context() internally with memory-based callbacks.
   * The buffer is accessed directly without copying, supporting full seek operations.
   *
   * @param buffer - Buffer containing media data
   * @param bufferSize - Internal buffer size for IOContext (default: 8192)
   *
   * @returns IOContext
   *
   * @example
   * ```typescript
   * const buffer = await fs.readFile('video.mp4');
   * const ioContext = IOStream.fromBuffer(buffer);
   * formatContext.pb = ioContext;
   * ```
   */
  static fromBuffer(buffer: Buffer, bufferSize = 8192): IOContext {
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
          case AV_SEEK_SIZE:
            return BigInt(buffer.length);
          case AV_SEEK_SET:
            position = Number(offset);
            break;
          case AV_SEEK_CUR:
            position += Number(offset);
            break;
          case AV_SEEK_END:
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
   * Create IOContext from a Transform stream.
   *
   * Allows processing data as it flows through the stream.
   * Useful for intercepting, modifying, or analyzing data.
   *
   * Internally delegates to fromReadable() or fromWritable() based on mode.
   * Transform streams can act as both readable and writable.
   *
   * @param stream - Node.js Transform stream
   * @param mode - 'read' or 'write' mode
   * @param bufferSize - Internal buffer size for IOContext (default: 8192)
   *
   * @returns Promise resolving to IOContext
   *
   * @throws {Error} If mode is invalid
   *
   * @example
   * ```typescript
   * const transform = new Transform({
   *   transform(chunk, encoding, callback) {
   *     console.log(`Processing ${chunk.length} bytes`);
   *     callback(null, chunk);
   *   }
   * });
   * const ioContext = await IOStream.fromTransform(transform, 'write');
   * ```
   */
  static async fromTransform(stream: Transform, mode: 'read' | 'write', bufferSize = 8192): Promise<IOContext> {
    if (mode === 'read') {
      return this.fromReadable(stream, bufferSize);
    } else if (mode === 'write') {
      return this.fromWritable(stream, bufferSize);
    } else {
      throw new Error(`Invalid mode: ${mode}. Use 'read' or 'write'`);
    }
  }

  /**
   * Create IOContext from custom callbacks.
   *
   * Provides full control over read, write, and seek operations.
   * Useful for custom protocols, network streams, or special handling.
   *
   * Uses avio_alloc_context() internally with user-provided callbacks.
   * Callbacks are invoked by FFmpeg during I/O operations.
   *
   * @param callbacks - Custom IO callbacks
   * @param bufferSize - Internal buffer size for IOContext (default: 8192)
   * @param writeFlag - 0 for reading, 1 for writing
   *
   * @returns IOContext
   *
   * @throws {Error} If callbacks are invalid for the specified mode
   *
   * @example
   * ```typescript
   * const ioContext = IOStream.create({
   *   read: (size) => {
   *     return customDataSource.read(size);
   *   },
   *   seek: (offset, whence) => {
   *     return customDataSource.seek(offset, whence);
   *   }
   * });
   * ```
   */
  static create(callbacks: IOCallbacks, bufferSize = 8192, writeFlag: 0 | 1 = 0): IOContext {
    // Validate callbacks
    if (writeFlag === 0 && !callbacks.read) {
      throw new Error('Read callback is required for read mode');
    }
    if (writeFlag === 1 && !callbacks.write) {
      throw new Error('Write callback is required for write mode');
    }

    const ioContext = new IOContext();
    ioContext.allocContextWithCallbacks(bufferSize, writeFlag, callbacks.read, callbacks.write, callbacks.seek);

    return ioContext;
  }
}
