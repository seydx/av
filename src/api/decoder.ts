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

import { AV_ERROR_EAGAIN, AV_ERROR_EOF } from '../lib/constants.js';
import { Codec, CodecContext, Frame, avGetPixFmtName, avIsHardwarePixelFormat } from '../lib/index.js';
import { FilterAPI } from './filter.js';

import type { AVPixelFormat } from '../lib/constants.js';
import type { Packet } from '../lib/index.js';
import type { MediaInput } from './media-input.js';
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
 * const decoder = await Decoder.create(media, 0); // Stream 0
 *
 * // Decode packets
 * for await (const packet of media.packets()) {
 *   if (packet.streamIndex === 0) {
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
 * const decoder = await Decoder.create(media, 0, {
 *   hardware: hw
 * });
 * // ... use decoder
 * decoder.close(); // Also disposes hardware
 * hw?.dispose(); // Safe to call again (no-op)
 * ```
 */
export class Decoder implements Disposable {
  private codecContext: CodecContext;
  private frame: Frame;
  private streamIndex: number;
  private isOpen = true;
  private mediaInput?: MediaInput; // Reference to media for initialize
  private conversionFilter?: FilterAPI | null; // Filter for pixel format conversion
  private targetPixelFormats?: AVPixelFormat[]; // Target pixel formats for conversion (try in order)
  private isInitialized = false; // Track if decoder has been initialized

  /**
   * Private constructor - use Decoder.create() instead.
   *
   * Initializes the decoder with a codec context and allocates a frame buffer.
   *
   * @param codecContext - Initialized codec context
   * @param streamIndex - Stream index this decoder is for
   * @param mediaInput - Optional media input for initialize
   */
  private constructor(codecContext: CodecContext, streamIndex: number, mediaInput?: MediaInput) {
    this.codecContext = codecContext;
    this.streamIndex = streamIndex;
    this.mediaInput = mediaInput;
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
   * @param media - MediaInput containing the stream
   * @param streamIndex - Index of stream to decode
   * @param options - Decoder configuration options
   *
   * @returns Promise resolving to configured Decoder
   *
   * @throws {Error} If stream not found or codec unavailable
   *
   * @example
   * ```typescript
   * const media = await MediaInput.open('video.mp4');
   * const decoder = await Decoder.create(media, 0);
   * ```
   */
  static async create(media: MediaInput, streamIndex: number, options: DecoderOptions = {}): Promise<Decoder> {
    // Get the stream from MediaInput
    const stream = media.streams.find((s) => s.index === streamIndex);
    if (!stream) {
      throw new Error(`Stream ${streamIndex} not found`);
    }

    // Get codec parameters
    const codecpar = stream.codecpar;
    if (!codecpar) {
      throw new Error(`Stream ${streamIndex} has no codec parameters`);
    }

    // Find decoder for this codec
    const codec = Codec.findDecoder(codecpar.codecId);
    if (!codec) {
      throw new Error(`Decoder not found for codec ${codecpar.codecId}`);
    }

    // Allocate and configure codec context
    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);

    // Copy codec parameters to context
    const ret = codecContext.parametersToContext(codecpar);
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

    // Apply hardware acceleration if provided
    // Decoder will dispose the HardwareContext on close (safe to dispose multiple times)
    if (options.hardware) {
      codecContext.hwDeviceCtx = options.hardware.deviceContext;
    }

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      throw new Error(`Failed to open codec: ${openRet}`);
    }

    const decoder = new Decoder(codecContext, streamIndex, media);

    // Store target pixel formats for filter creation
    if (options.targetPixelFormat !== undefined) {
      // Handle both single format and array of formats
      decoder.targetPixelFormats = Array.isArray(options.targetPixelFormat) ? options.targetPixelFormat : [options.targetPixelFormat];
    }

    // Initialize hardware context and conversion filters if needed
    if (options.hardware || options.targetPixelFormat !== undefined) {
      await decoder.initialize();
    }

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
        // Apply conversion filter if exists
        if (this.conversionFilter) {
          const converted = await this.conversionFilter.process(frame);
          frame.free();
          return converted;
        }
        return frame;
      }

      // If still failing, it's an error
      if (sendRet !== AV_ERROR_EAGAIN) {
        throw new Error(`Failed to send packet: ${sendRet}`);
      }
    }

    // Try to receive frame
    const frame = await this.receiveFrameInternal();
    if (!frame) return null;

    // Apply conversion filter if exists
    if (this.conversionFilter) {
      const converted = await this.conversionFilter.process(frame);
      frame.free();
      return converted;
    }

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
    if (!frame) return null;

    // Apply conversion filter if exists
    if (this.conversionFilter) {
      const converted = await this.conversionFilter.process(frame);
      frame.free();
      return converted;
    }

    return frame;
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

    // Clean up conversion filter if exists
    if (this.conversionFilter) {
      this.conversionFilter.free();
      this.conversionFilter = null;
    }

    // NOTE: We do NOT dispose the hardware context here anymore
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
   * Get codec context for advanced configuration.
   *
   * Use with caution - direct manipulation may cause issues.
   * Needed for zero-copy hardware transcoding to share frames context.
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
   * Async iterator that decodes packets and yields frames.
   *
   * Filters packets for this decoder's stream and yields decoded frames.
   * Automatically handles packet cleanup and decoder flushing.
   *
   * Processes packets in sequence, decoding each and yielding frames.
   * After all packets are processed, flushes the decoder for remaining frames.
   *
   * @param packets - Async iterable of packets (e.g., from MediaInput.packets())
   *
   * @yields Decoded frames
   *
   * @example
   * ```typescript
   * // Process all video frames
   * for await (const frame of decoder.frames(media.packets())) {
   *   console.log(`Frame: ${frame.width}x${frame.height}`);
   *   // Process frame...
   *   frame.free();
   * }
   * ```
   */
  async *frames(packets: AsyncIterable<Packet>): AsyncGenerator<Frame> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Process packets
    for await (const packet of packets) {
      // Only process packets for our stream
      if (packet.streamIndex === this.streamIndex) {
        const frame = await this.decode(packet);
        if (frame) {
          yield frame;
        }
      }
    }

    // Flush decoder after all packets
    let frame;
    while ((frame = await this.flush()) !== null) {
      yield frame;
    }
  }

  /**
   * Initialize decoder by preparing hardware context and conversion filters.
   *
   * This method:
   * 1. Initializes hardware frames context if hardware acceleration is used
   * 2. Sets up pixel format conversion filters if targetPixelFormats is specified
   *
   * The first frame is decoded and immediately freed - this is only for initialization.
   * After calling this, processing should start from the beginning with media.packets().
   *
   * @internal
   * @throws {Error} If decoder is closed or no frames available
   */
  private async initialize(): Promise<void> {
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Already initialized - no need to do it again
    if (this.isInitialized) {
      return;
    }

    if (!this.mediaInput) {
      throw new Error('Cannot prepare hardware context: MediaInput not available');
    }

    // Find and decode the first packet for this stream to initialize hwFramesCtx
    for await (const packet of this.mediaInput.packets()) {
      if (packet.streamIndex === this.streamIndex) {
        // Send packet to decoder
        const sendRet = await this.codecContext.sendPacket(packet);
        if (sendRet < 0 && sendRet !== AV_ERROR_EOF) {
          continue; // Try next packet
        }

        // Try to receive frame to get actual format
        const frame = await this.receiveFrameInternal();
        if (frame) {
          // Now we know the actual format - create conversion filter if needed
          if (this.targetPixelFormats && this.targetPixelFormats.length > 0) {
            try {
              this.conversionFilter = await this.createConversionFilter(frame.format as AVPixelFormat, this.targetPixelFormats);
              this.isInitialized = true;
            } finally {
              // The frame has initialized hwFramesCtx in the decoder
              // We can now free it - the context stays initialized
              frame.free();
            }
          }

          return;
        }
      }
    }

    throw new Error('No frames available to prepare hardware context');
  }

  /**
   * Create a conversion filter for pixel format conversion.
   *
   * @internal
   */
  private async createConversionFilter(currentFormat: AVPixelFormat, targetFormats: AVPixelFormat[]): Promise<FilterAPI | null> {
    // Case 1: Check if current format is already in target formats
    if (!targetFormats || targetFormats.length === 0 || targetFormats.includes(currentFormat)) {
      return null;
    }

    const currentIsHardware = avIsHardwarePixelFormat(currentFormat);
    const firstTargetIsHardware = avIsHardwarePixelFormat(targetFormats[0]);

    // Case 2: Hardware → Hardware (same device assumed)
    if (currentIsHardware && firstTargetIsHardware) {
      return null; // FFmpeg handles this internally
    }

    // Case 3: Hardware → CPU conversion
    if (currentIsHardware) {
      // Build format chain from targetFormats array
      // User can specify intermediate formats like [AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]
      // This creates: hwdownload,format=nv12,format=yuv420p
      const formatFilters = targetFormats
        .map((fmt) => {
          const name = avGetPixFmtName(fmt);
          if (!name) {
            return null;
          }
          return `format=${name}`;
        })
        .filter((f) => f !== null);

      if (formatFilters.length === 0) {
        throw new Error('No valid target formats specified');
      }

      const filterChain = `hwdownload,${formatFilters.join(',')}`;
      const outputFormat = targetFormats[targetFormats.length - 1];

      return await FilterAPI.createFromDecoder(this.codecContext, filterChain, { output: { pixelFormats: [outputFormat] } });
    }

    // Case 4: CPU format conversion - try first valid format
    for (const targetFormat of targetFormats) {
      const formatName = avGetPixFmtName(targetFormat);
      if (formatName) {
        try {
          return await FilterAPI.createFromDecoder(this.codecContext, `format=${formatName}`, { output: { pixelFormats: [targetFormat] } });
        } catch {
          // Try next format
          continue;
        }
      }
    }

    throw new Error('No valid target format could be applied');
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
