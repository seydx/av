import { AVERROR_EAGAIN, AVERROR_EOF } from '../constants/constants.js';
import { BitStreamFilter, BitStreamFilterContext, FFmpegError, Packet } from '../lib/index.js';

import type { Stream } from '../lib/index.js';

/**
 * High-level bitstream filter for packet processing.
 *
 * Provides simplified interface for applying bitstream filters to packets.
 * Handles filter initialization, packet processing, and memory management.
 * Supports filters like h264_mp4toannexb, hevc_mp4toannexb, aac_adtstoasc.
 * Essential for format conversion and stream compatibility in transcoding pipelines.
 *
 * @example
 * ```typescript
 * import { BitStreamFilterAPI } from 'node-av/api';
 *
 * // Create H.264 Annex B converter
 * const filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);
 *
 * // Process packet
 * const outputPackets = await filter.process(inputPacket);
 * for (const packet of outputPackets) {
 *   await output.writePacket(packet);
 *   packet.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Process packet stream
 * const filter = BitStreamFilterAPI.create('hevc_mp4toannexb', videoStream);
 *
 * for await (const packet of filter.packets(input.packets())) {
 *   await output.writePacket(packet);
 *   packet.free();
 * }
 * ```
 *
 * @see {@link BitStreamFilter} For available filters
 * @see {@link BitStreamFilterContext} For low-level API
 * @see {@link MediaOutput} For writing filtered packets
 */
export class BitStreamFilterAPI implements Disposable {
  private ctx: BitStreamFilterContext;
  private filter: BitStreamFilter;
  private stream: Stream;
  private isDisposed = false;

  /**
   * @param filter - Bitstream filter instance
   * @param ctx - Filter context
   * @param stream - Associated stream
   * @internal
   */
  private constructor(filter: BitStreamFilter, ctx: BitStreamFilterContext, stream: Stream) {
    this.filter = filter;
    this.ctx = ctx;
    this.stream = stream;
  }

  /**
   * Create a bitstream filter for a stream.
   *
   * Initializes filter with stream codec parameters.
   * Configures time base and prepares for packet processing.
   *
   * Direct mapping to av_bsf_get_by_name() and av_bsf_alloc().
   *
   * @param filterName - Name of the bitstream filter
   * @param stream - Stream to apply filter to
   * @returns Configured bitstream filter
   *
   * @throws {Error} If filter not found or initialization fails
   *
   * @throws {FFmpegError} If allocation or initialization fails
   *
   * @example
   * ```typescript
   * // H.264 MP4 to Annex B conversion
   * const filter = BitStreamFilterAPI.create('h264_mp4toannexb', videoStream);
   * ```
   *
   * @example
   * ```typescript
   * // AAC ADTS to ASC conversion
   * const filter = BitStreamFilterAPI.create('aac_adtstoasc', audioStream);
   * ```
   *
   * @example
   * ```typescript
   * // Remove metadata
   * const filter = BitStreamFilterAPI.create('filter_units', stream);
   * ```
   *
   * @see {@link BitStreamFilter.getByName} For filter discovery
   */
  static create(filterName: string, stream: Stream): BitStreamFilterAPI {
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
   * Get filter name.
   *
   * @example
   * ```typescript
   * console.log(`Using filter: ${filter.name}`);
   * ```
   */
  get name(): string {
    return this.filter.name ?? 'unknown';
  }

  /**
   * Get output codec parameters.
   *
   * Parameters after filter processing.
   * May differ from input parameters.
   *
   * @example
   * ```typescript
   * const outputParams = filter.outputCodecParameters;
   * console.log(`Output codec: ${outputParams?.codecId}`);
   * ```
   */
  get outputCodecParameters() {
    return this.ctx.outputCodecParameters;
  }

  /**
   * Get output time base.
   *
   * Time base after filter processing.
   *
   * @example
   * ```typescript
   * const tb = filter.outputTimeBase;
   * console.log(`Output timebase: ${tb?.num}/${tb?.den}`);
   * ```
   */
  get outputTimeBase() {
    return this.ctx.outputTimeBase;
  }

  /**
   * Process a packet through the filter.
   *
   * Applies bitstream filter to packet.
   * May produce zero, one, or multiple output packets.
   * Pass null to signal end-of-stream.
   *
   * Direct mapping to av_bsf_send_packet() and av_bsf_receive_packet().
   *
   * @param packet - Packet to filter or null for EOF
   * @returns Array of filtered packets
   *
   * @throws {Error} If filter is disposed
   *
   * @throws {FFmpegError} If filtering fails
   *
   * @example
   * ```typescript
   * const outputPackets = await filter.process(inputPacket);
   * for (const packet of outputPackets) {
   *   console.log(`Filtered packet: pts=${packet.pts}`);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Flush filter
   * const remaining = await filter.process(null);
   * ```
   *
   * @see {@link flush} For explicit flushing
   * @see {@link packets} For stream processing
   */
  async process(packet: Packet | null): Promise<Packet[]> {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    const outputPackets: Packet[] = [];

    // Send packet to filter
    const sendRet = await this.ctx.sendPacket(packet);
    if (sendRet < 0 && sendRet !== AVERROR_EAGAIN) {
      FFmpegError.throwIfError(sendRet, 'Failed to send packet to bitstream filter');
    }

    // Receive all output packets
    while (true) {
      const outPacket = new Packet();
      outPacket.alloc();

      const recvRet = await this.ctx.receivePacket(outPacket);

      if (recvRet === AVERROR_EAGAIN || recvRet === AVERROR_EOF) {
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
   * Process packet stream through filter.
   *
   * High-level async generator for filtering packet streams.
   * Automatically handles flushing at end of stream.
   * Yields filtered packets ready for output.
   *
   * @param packets - Async iterable of packets
   * @yields {Packet} Filtered packets
   * @throws {Error} If filter is disposed
   *
   * @throws {FFmpegError} If filtering fails
   *
   * @example
   * ```typescript
   * // Filter entire stream
   * for await (const packet of filter.packets(input.packets())) {
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Chain with decoder
   * const decoder = await Decoder.create(stream);
   * const filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);
   *
   * for await (const frame of decoder.frames(filter.packets(input.packets()))) {
   *   // Process frames
   *   frame.free();
   * }
   * ```
   *
   * @see {@link process} For single packet filtering
   * @see {@link flush} For end-of-stream handling
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
   * Flush filter and get remaining packets.
   *
   * Signals end-of-stream and retrieves buffered packets.
   * Also resets internal filter state.
   *
   * Direct mapping to av_bsf_flush().
   *
   * @returns Array of remaining packets
   *
   * @throws {Error} If filter is disposed
   *
   * @example
   * ```typescript
   * const remaining = await filter.flush();
   * for (const packet of remaining) {
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link flushPackets} For async iteration
   * @see {@link reset} For state reset only
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
   * Flush filter as async generator.
   *
   * Convenient async iteration over remaining packets.
   * Combines flush and iteration.
   *
   * @yields {Packet} Remaining packets
   * @throws {Error} If filter is disposed
   *
   * @example
   * ```typescript
   * for await (const packet of filter.flushPackets()) {
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link flush} For array return
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
   * Get associated stream.
   *
   * Returns the stream this filter was created for.
   *
   * @returns Associated stream
   *
   * @example
   * ```typescript
   * const stream = filter.getStream();
   * console.log(`Filtering stream ${stream.index}`);
   * ```
   */
  getStream(): Stream {
    return this.stream;
  }

  /**
   * Reset filter state.
   *
   * Clears internal buffers and resets filter.
   * Does not dispose resources.
   *
   * Direct mapping to av_bsf_flush().
   *
   * @throws {Error} If filter is disposed
   *
   * @example
   * ```typescript
   * // Reset for new segment
   * filter.reset();
   * ```
   *
   * @see {@link flush} For reset with packet retrieval
   */
  reset(): void {
    if (this.isDisposed) {
      throw new Error('BitStreamFilterAPI is disposed');
    }

    this.ctx.flush();
  }

  /**
   * Dispose of filter and free resources.
   *
   * Releases filter context and marks as disposed.
   * Safe to call multiple times.
   *
   * @example
   * ```typescript
   * filter.dispose();
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  dispose(): void {
    if (!this.isDisposed) {
      this.ctx.free();
      this.isDisposed = true;
    }
  }

  /**
   * Dispose of filter.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling dispose().
   *
   * @example
   * ```typescript
   * {
   *   using filter = BitStreamFilterAPI.create('h264_mp4toannexb', stream);
   *   // Use filter...
   * } // Automatically disposed
   * ```
   *
   * @see {@link dispose} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.dispose();
  }
}
