/**
 * Decoder - High-level wrapper for media decoding
 *
 * Simplifies FFmpeg's decoding API with automatic codec selection,
 * parameter configuration, and frame management.
 *
 * Handles codec initialization, packet decoding, and frame output.
 * Supports hardware acceleration and zero-copy transcoding.
 *
 * @module api/decoder
 */

import { AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX, AV_ERROR_EAGAIN, AV_ERROR_EOF, Codec, CodecContext, Frame } from '../lib/index.js';

import type { Packet, Stream } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { DecoderOptions } from './types.js';

/**
 * High-level decoder for media streams.
 *
 * Handles codec initialization, packet decoding, and frame output.
 * Designed for simple, efficient decoding workflows.
 *
 * Manages codec context lifecycle and provides automatic cleanup.
 * Supports hardware acceleration with zero-copy frame sharing.
 *
 * @example
 * ```typescript
 * // Create decoder for video stream
 * const media = await MediaInput.open('video.mp4');
 * const stream = media.video(); // Get video stream
 * const decoder = await Decoder.create(stream);
 *
 * // Decode packets
 * for await (const packet of media.packets()) {
 *   if (packet.streamIndex === stream.index) {
 *     const frame = await decoder.decode(packet);
 *     if (frame) {
 *       console.log(`Decoded frame: ${frame.width}x${frame.height}`);
 *       // Process frame...
 *     }
 *   }
 * }
 *
 * // Flush decoder
 * const lastFrame = await decoder.flush();
 * decoder.close();
 * ```
 *
 * @example
 * ```typescript
 * // With hardware acceleration
 * const hw = await HardwareContext.auto();
 * const stream = media.video();
 * const decoder = await Decoder.create(stream, {
 *   hardware: hw
 * });
 * // ... use decoder
 * decoder.close();
 * hw?.dispose(); // Safe to call again (no-op)
 * ```
 */
export class Decoder implements Disposable {
  private codecContext: CodecContext;
  private frame: Frame;
  private streamIndex: number;
  private stream: Stream;
  private isOpen = true;
  private hardware?: HardwareContext | null; // Reference to hardware context for auto-sharing frames context

  /**
   * Private constructor - use Decoder.create() instead.
   *
   * Initializes the decoder with a codec context and allocates a frame buffer.
   *
   * @param codecContext - Initialized codec context
   * @param stream - The stream this decoder is for
   * @param hardware - Optional hardware context for auto-sharing frames context
   */
  private constructor(codecContext: CodecContext, stream: Stream, hardware?: HardwareContext | null) {
    this.codecContext = codecContext;
    this.stream = stream;
    this.streamIndex = stream.index;
    this.hardware = hardware;
    this.frame = new Frame();
    this.frame.alloc();
  }

  /**
   * Create a decoder for a specific stream.
   *
   * Factory method that handles codec discovery, context setup,
   * and initialization.
   *
   * Uses avcodec_find_decoder() to locate the appropriate codec,
   * then initializes and opens the codec context.
   *
   * @param stream - Stream to decode
   * @param options - Decoder configuration options
   *
   * @returns Promise resolving to configured Decoder
   *
   * @throws {Error} If codec unavailable
   *
   * @example
   * ```typescript
   * const media = await MediaInput.open('video.mp4');
   * const stream = media.video();
   * const decoder = await Decoder.create(stream);
   * ```
   */
  static async create(stream: Stream, options: DecoderOptions = {}): Promise<Decoder> {
    if (!stream) {
      throw new Error('Stream is required');
    }

    // Find decoder for this codec
    const codec = Codec.findDecoder(stream.codecpar.codecId);
    if (!codec) {
      throw new Error(`Decoder not found for codec ${stream.codecpar.codecId}`);
    }

    // Allocate and configure codec context
    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);

    // Copy codec parameters to context
    const ret = codecContext.parametersToContext(stream.codecpar);
    if (ret < 0) {
      codecContext.freeContext();
      throw new Error(`Failed to copy codec parameters: ${ret}`);
    }

    // Set packet time base
    codecContext.pktTimebase = stream.timeBase;

    // Apply options
    if (options.threads !== undefined) {
      codecContext.threadCount = options.threads;
    }

    // Check if this decoder supports hardware acceleration
    let supportsHardware = false;
    if (options.hardware) {
      // Check decoder's hardware configurations
      for (let i = 0; ; i++) {
        const config = codec.getHwConfig(i);
        if (!config) break;

        // Check if decoder supports HW_DEVICE_CTX method with matching device type
        if ((config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) !== 0 && config.deviceType === options.hardware.deviceType) {
          supportsHardware = true;
          break;
        }
      }

      // Only apply hardware acceleration if the decoder supports it
      if (supportsHardware) {
        codecContext.hwDeviceCtx = options.hardware.deviceContext;
      }
      // Silently ignore hardware for software decoders
    }

    // Apply codec-specific options via AVOptions
    if (options.options) {
      for (const [key, value] of Object.entries(options.options)) {
        codecContext.setOpt(key, value.toString());
      }
    }

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      throw new Error(`Failed to open codec: ${openRet}`);
    }

    const decoder = new Decoder(codecContext, stream, options.hardware);
    return decoder;
  }

  /**
   * Check if decoder is open.
   */
  get isDecoderOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Decode a packet and return a frame if available.
   *
   * Sends packet to decoder and attempts to receive a frame.
   * May return null if decoder needs more data.
   *
   * Uses avcodec_send_packet() and avcodec_receive_frame() internally.
   * The decoder may buffer packets before producing frames.
   *
   * @param packet - Packet to decode
   *
   * @returns Promise resolving to Frame or null
   *
   * @throws {Error} If decoder is closed or decode fails
   *
   * @example
   * ```typescript
   * const frame = await decoder.decode(packet);
   * if (frame) {
   *   // Process frame
   * }
   * ```
   */
  async decode(packet: Packet): Promise<Frame | null> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Send packet to decoder
    const sendRet = await this.codecContext.sendPacket(packet);
    if (sendRet < 0 && sendRet !== AV_ERROR_EOF) {
      // Decoder might be full, try to receive first
      const frame = await this.receiveFrameInternal();
      if (frame) {
        return frame;
      }

      // If still failing, it's an error
      if (sendRet !== AV_ERROR_EAGAIN) {
        throw new Error(`Failed to send packet: ${sendRet}`);
      }
    }

    // Try to receive frame
    const frame = await this.receiveFrameInternal();
    return frame;
  }

  /**
   * Flush decoder and get remaining frames.
   *
   * Sends null packet to trigger flush mode.
   * Call repeatedly until it returns null.
   *
   * Uses avcodec_send_packet(NULL) to signal end of stream.
   * Retrieves buffered frames from the decoder.
   *
   * @returns Promise resolving to Frame or null
   *
   * @throws {Error} If decoder is closed
   *
   * @example
   * ```typescript
   * // Flush all remaining frames
   * let frame;
   * while ((frame = await decoder.flush()) !== null) {
   *   // Process final frames
   * }
   * ```
   */
  async flush(): Promise<Frame | null> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Send flush packet (null)
    await this.codecContext.sendPacket(null);

    // Receive frame
    const frame = await this.receiveFrameInternal();
    return frame;
  }

  /**
   * Flush decoder and yield all remaining frames as a generator.
   *
   * More convenient than calling flush() in a loop.
   * Automatically sends flush signal and yields all buffered frames.
   *
   * IMPORTANT: The yielded frames MUST be freed by the caller!
   * Use 'using' statement or manually call frame.free() to avoid memory leaks.
   *
   * @returns Async generator of remaining frames
   *
   * @throws {Error} If decoder is closed
   *
   * @example
   * ```typescript
   * // Process all remaining frames with generator
   * for await (const frame of decoder.flushFrames()) {
   *   // Process final frame
   *   using _ = frame; // Auto cleanup
   * }
   * ```
   */
  async *flushFrames(): AsyncGenerator<Frame> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    let frame;
    while ((frame = await this.flush()) !== null) {
      yield frame;
    }
  }

  /**
   * Async iterator that decodes packets and yields frames.
   *
   * Filters packets for this decoder's stream and yields decoded frames.
   * Automatically handles packet cleanup and decoder flushing.
   *
   * Processes packets in sequence, decoding each and yielding frames.
   * After all packets are processed, flushes the decoder for remaining frames.
   *
   * IMPORTANT: The yielded frames MUST be freed by the caller!
   * Use 'using' statement or manually call frame.free() to avoid memory leaks.
   *
   * @param packets - Async iterable of packets (e.g., from MediaInput.packets())
   *
   * @yields Decoded frames (ownership transferred to caller)
   *
   * @example
   * ```typescript
   * // RECOMMENDED: Use 'using' for automatic cleanup
   * for await (using frame of decoder.frames(media.packets())) {
   *   console.log(`Frame: ${frame.width}x${frame.height}`);
   *   // Frame is automatically freed at end of iteration
   * }
   *
   * // OR: Manual cleanup
   * for await (const frame of decoder.frames(media.packets())) {
   *   console.log(`Frame: ${frame.width}x${frame.height}`);
   *   // Process frame...
   *   frame.free(); // MUST call free()!
   * }
   * ```
   */
  async *frames(packets: AsyncIterable<Packet>): AsyncGenerator<Frame> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Process packets
    for await (const packet of packets) {
      try {
        // Only process packets for our stream
        if (packet.streamIndex === this.streamIndex) {
          const frame = await this.decode(packet);
          if (frame) {
            yield frame;
          }
        }
      } finally {
        // Free the input packet after processing
        packet.free();
      }
    }

    // Flush decoder after all packets
    let frame;
    while ((frame = await this.flush()) !== null) {
      yield frame;
    }
  }

  /**
   * Close decoder and free resources.
   *
   * After closing, the decoder cannot be used again.
   *
   * Frees the frame buffer and codec context.
   * Note: Does NOT dispose the HardwareContext - caller is responsible for that.
   */
  close(): void {
    if (!this.isOpen) return;

    this.frame.free();
    this.codecContext.freeContext();

    // NOTE: We do NOT dispose the hardware context here
    // The caller who created the HardwareContext is responsible for disposing it
    // This allows reusing the same HardwareContext for multiple decoders

    this.isOpen = false;
  }

  /**
   * Get the stream index this decoder is for.
   */
  getStreamIndex(): number {
    return this.streamIndex;
  }

  /**
   * Get the original stream this decoder was created from.
   * Used for stream-copy operations in pipeline.
   */
  getStream(): Stream {
    return this.stream;
  }

  /**
   * Get codec context for advanced configuration.
   *
   * Use with caution - direct manipulation may cause issues.
   *
   * Provides access to the underlying AVCodecContext for advanced operations.
   *
   * @returns CodecContext or null if closed
   *
   * @internal
   */
  getCodecContext(): CodecContext | null {
    return this.isOpen ? this.codecContext : null;
  }

  /**
   * Receive a frame from the decoder (internal).
   *
   * Internal method to receive decoded frames without conversion.
   *
   * Uses avcodec_receive_frame() to get decoded frames from the codec.
   * Clones the frame for the user to prevent internal buffer corruption.
   *
   * @returns Frame or null if no frame available
   * @internal
   */
  private async receiveFrameInternal(): Promise<Frame | null> {
    // Clear previous frame data
    this.frame.unref();

    const ret = await this.codecContext.receiveFrame(this.frame);

    if (ret === 0) {
      // Set hw_frames_ctx from frame for other components to share
      // This is THE moment when hw_frames_ctx becomes available
      if (this.hardware && this.frame.hwFramesCtx) {
        this.hardware.framesContext = this.frame.hwFramesCtx;
      }

      // Got a frame, clone it for the user
      return this.frame.clone();
    } else if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
      // Need more data or end of stream
      return null;
    } else {
      // Error
      throw new Error(`Failed to receive frame: ${ret}`);
    }
  }

  /**
   * Symbol.dispose for automatic cleanup.
   *
   * Implements the Disposable interface for automatic resource management.
   * Calls close() to free all resources.
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
