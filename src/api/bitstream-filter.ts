/**
 * BitStreamFilterAPI - High-level wrapper for bitstream filtering
 *
 * Simplifies FFmpeg's bitstream filter API with automatic initialization,
 * parameter configuration, and packet processing.
 *
 * Handles filter context lifecycle, packet buffering, and flushing.
 * Useful for format conversion, metadata extraction, and stream modifications.
 *
 * @module api/bitstream-filter
 */

import { AV_ERROR_EAGAIN, AV_ERROR_EOF, BitStreamFilter, BitStreamFilterContext, FFmpegError, Packet } from '../lib/index.js';

import type { Stream } from '../lib/index.js';

/**
 * High-level bitstream filter for packet processing.
 *
 * Handles filter initialization, packet processing, and cleanup.
 * Designed for simple, efficient packet filtering workflows.
 *
 * Manages filter context lifecycle and provides automatic cleanup.
 * Supports packet-by-packet and stream processing modes.
 *
 * @example
 * ```typescript
 * // Create filter for H.264 stream
 * const media = await MediaInput.open('video.mp4');
 * const stream = media.video();
 * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb', stream);
 *
 * // Process packets
 * for await (const packet of media.packets()) {
 *   if (packet.streamIndex === stream.index) {
 *     const filtered = await bsf.process(packet);
 *     for (const outPacket of filtered) {
 *       // Write to output or process further
 *       await output.writePacket(outPacket);
 *     }
 *   }
 * }
 *
 * // Flush and cleanup
 * const remaining = await bsf.flush();
 * bsf.dispose();
 * ```
 *
 * @example
 * ```typescript
 * // Process packet stream
 * const bsf = await BitStreamFilterAPI.create('extract_extradata', stream);
 *
 * for await (const filtered of bsf.packets(media.packets())) {
 *   // Filtered packets are automatically processed
 *   await output.writePacket(filtered);
 * }
 * ```
 */
export class BitStreamFilterAPI implements Disposable {
  private ctx: BitStreamFilterContext;
  private filter: BitStreamFilter;
  private stream: Stream;
  private isDisposed = false;

  /**
   * Private constructor - use BitStreamFilterAPI.create() instead.
   *
   * @param filter - The bitstream filter
   * @param ctx - Initialized filter context
   * @param stream - The stream this filter is for
   */
  private constructor(filter: BitStreamFilter, ctx: BitStreamFilterContext, stream: Stream) {
    this.filter = filter;
    this.ctx = ctx;
    this.stream = stream;
  }

  /**
   * Create a bitstream filter for a specific stream.
   *
   * Factory method that handles filter discovery, context setup,
   * and initialization.
   *
   * @param filterName - Name of the bitstream filter (e.g., 'h264_mp4toannexb')
   * @param stream - Stream to filter
   *
   * @returns Promise resolving to configured BitStreamFilterAPI
   *
   * @throws {Error} If filter unavailable or initialization fails
   *
   * @example
   * ```typescript
   * const media = await MediaInput.open('video.mp4');
   * const stream = media.video();
   * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb', stream);
   * ```
   */
  static async create(filterName: string, stream: Stream): Promise<BitStreamFilterAPI> {
    if (!stream) {
      throw new Error('Stream is required');
    }

    // Find the bitstream filter
    const filter = BitStreamFilter.getByName(filterName);
    if (!filter) {
      throw new Error(`Bitstream filter '${filterName}' not found`);
    }

    // Create and allocate context
    const ctx = new BitStreamFilterContext();
    const allocRet = ctx.alloc(filter);
    FFmpegError.throwIfError(allocRet, 'Failed to allocate bitstream filter context');

    try {
      // Copy codec parameters from stream
      if (!ctx.inputCodecParameters) {
        throw new Error('Failed to get input codec parameters from filter context');
      }
      stream.codecpar.copy(ctx.inputCodecParameters);

      // Set time base
      ctx.inputTimeBase = stream.timeBase;

      // Initialize the filter
      const initRet = ctx.init();
      FFmpegError.throwIfError(initRet, 'Failed to initialize bitstream filter');

      return new BitStreamFilterAPI(filter, ctx, stream);
    } catch (error) {
      // Clean up on error
      ctx.free();
      throw error;
    }
  }

  /**
   * Get the filter name.
   *
   * @returns The name of the bitstream filter
   */
  get name(): string {
    return this.filter.name ?? 'unknown';
  }

  /**
   * Get the associated stream.
   *
   * @returns The stream this filter was created for
   */
  get streamInfo(): Stream {
    return this.stream;
  }

  /**
   * Get output codec parameters.
   *
   * Returns the output codec parameters after filter initialization.
   * These may differ from input parameters depending on the filter.
   *
   * @returns Output codec parameters, or null if not available
   */
  get outputCodecParameters() {
    return this.ctx.outputCodecParameters;
  }

  /**
   * Get output time base.
   *
   * Returns the output time base after filter initialization.
   *
   * @returns Output time base, or null if not available
   */
  get outputTimeBase() {
    return this.ctx.outputTimeBase;
  }

  /**
   * Process a single packet through the filter.
   *
   * Sends a packet to the filter and retrieves all output packets.
   * One input packet may produce zero, one, or multiple output packets.
   *
   * @param packet - Packet to filter, or null to signal EOF
   *
   * @returns Array of filtered packets (may be empty)
   *
   * @example
   * ```typescript
   * const inputPacket = await media.readPacket();
   * const filtered = await bsf.process(inputPacket);
   *
   * for (const packet of filtered) {
   *   console.log(`Filtered packet: size=${packet.size}`);
   *   await output.writePacket(packet);
   * }
   * ```
   */
  async process(packet: Packet | null): Promise<Packet[]> {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    const outputPackets: Packet[] = [];

    // Send packet to filter
    const sendRet = await this.ctx.sendPacket(packet);
    if (sendRet < 0 && sendRet !== AV_ERROR_EAGAIN) {
      FFmpegError.throwIfError(sendRet, 'Failed to send packet to bitstream filter');
    }

    // Receive all output packets
    while (true) {
      const outPacket = new Packet();
      outPacket.alloc();

      const recvRet = await this.ctx.receivePacket(outPacket);

      if (recvRet === AV_ERROR_EAGAIN || recvRet === AV_ERROR_EOF) {
        outPacket.unref();
        break;
      }

      if (recvRet < 0) {
        outPacket.unref();
        FFmpegError.throwIfError(recvRet, 'Failed to receive packet from bitstream filter');
      }

      outputPackets.push(outPacket);
    }

    return outputPackets;
  }

  /**
   * Process a stream of packets through the filter.
   *
   * Async generator that processes packets lazily and yields filtered results.
   * Automatically handles EOF and cleanup.
   *
   * @param packets - Async iterable of packets to filter
   *
   * @yields Filtered packets
   *
   * @example
   * ```typescript
   * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb', stream);
   *
   * // Filter only video packets
   * async function* videoPackets() {
   *   for await (const packet of media.packets()) {
   *     if (packet.streamIndex === stream.index) {
   *       yield packet;
   *     }
   *   }
   * }
   *
   * for await (const filtered of bsf.packets(videoPackets())) {
   *   await output.writePacket(filtered);
   * }
   * ```
   */
  async *packets(packets: AsyncIterable<Packet>): AsyncGenerator<Packet> {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    try {
      // Process all input packets
      for await (const packet of packets) {
        const filtered = await this.process(packet);
        for (const outPacket of filtered) {
          yield outPacket;
        }
      }

      // Send EOF and get remaining packets
      const remaining = await this.flush();
      for (const packet of remaining) {
        yield packet;
      }
    } catch (error) {
      // Ensure cleanup on error
      this.ctx.flush();
      throw error;
    }
  }

  /**
   * Flush the filter and retrieve remaining packets.
   *
   * Sends EOF to the filter and retrieves any buffered packets.
   * Should be called when all input packets have been processed.
   *
   * @returns Array of remaining packets (may be empty)
   *
   * @example
   * ```typescript
   * // After processing all packets
   * const remaining = await bsf.flush();
   * for (const packet of remaining) {
   *   await output.writePacket(packet);
   * }
   * ```
   */
  async flush(): Promise<Packet[]> {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    // Send EOF
    const filtered = await this.process(null);

    // Also flush the context to reset internal state
    this.ctx.flush();

    return filtered;
  }

  /**
   * Flush the filter and yield remaining packets.
   *
   * Async generator that sends EOF to the filter and yields any buffered packets.
   * Provides a convenient way to process all remaining packets after input is complete.
   *
   * @yields Remaining packets from the filter
   *
   * @example
   * ```typescript
   * // Process all remaining packets with generator
   * for await (const packet of bsf.flushPackets()) {
   *   await output.writePacket(packet);
   *   using _ = packet; // Auto cleanup
   * }
   * ```
   */
  async *flushPackets(): AsyncGenerator<Packet> {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    const remaining = await this.flush();
    for (const packet of remaining) {
      yield packet;
    }
  }

  /**
   * Get the stream this filter was created for.
   * Used for determining stream configuration in pipeline.
   */
  getStream(): Stream {
    return this.stream;
  }

  /**
   * Reset the filter state.
   *
   * Clears internal buffers and resets the filter to initial state.
   * Useful when seeking or switching between streams.
   *
   * @example
   * ```typescript
   * // When seeking in the input
   * await media.seek(timestamp);
   * bsf.reset(); // Clear filter state
   * // Continue processing from new position
   * ```
   */
  reset(): void {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    this.ctx.flush();
  }

  /**
   * Dispose of the filter resources.
   *
   * Automatically called when using the `using` statement.
   * Frees all associated FFmpeg resources.
   *
   * @example
   * ```typescript
   * {
   *   using bsf = await BitStreamFilterAPI.create('h264_mp4toannexb', stream);
   *   // ... use filter
   * } // Automatically disposed when leaving scope
   * ```
   */
  dispose(): void {
    if (!this.isDisposed) {
      this.ctx.free();
      this.isDisposed = true;
    }
  }

  /**
   * Symbol.dispose implementation for using statement.
   */
  [Symbol.dispose](): void {
    this.dispose();
  }
}
