import { AVERROR_EAGAIN, AVERROR_EOF } from '../constants/constants.js';
import { Codec, CodecContext, Dictionary, FFmpegError, Frame } from '../lib/index.js';

import type { Packet, Stream } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { DecoderOptions } from './types.js';

/**
 * High-level decoder for audio and video streams.
 *
 * Provides a simplified interface for decoding media streams from packets to frames.
 * Handles codec initialization, hardware acceleration setup, and frame management.
 * Supports both synchronous packet-by-packet decoding and async iteration over frames.
 * Essential component in media processing pipelines for converting compressed data to raw frames.
 *
 * @example
 * ```typescript
 * import { MediaInput, Decoder } from 'node-av/api';
 *
 * // Open media and create decoder
 * await using input = await MediaInput.open('video.mp4');
 * using decoder = await Decoder.create(input.video());
 *
 * // Decode frames
 * for await (const frame of decoder.frames(input.packets())) {
 *   console.log(`Decoded frame: ${frame.width}x${frame.height}`);
 *   frame.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { HardwareContext } from 'node-av/api';
 * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
 *
 * // Setup hardware acceleration
 * const hw = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
 * using decoder = await Decoder.create(stream, { hardware: hw });
 *
 * // Frames will be decoded on GPU
 * for await (const frame of decoder.frames(packets)) {
 *   // frame.hwFramesCtx contains GPU memory reference
 * }
 * ```
 *
 * @see {@link Encoder} For encoding frames to packets
 * @see {@link MediaInput} For reading media files
 * @see {@link HardwareContext} For GPU acceleration
 */
export class Decoder implements Disposable {
  private codecContext: CodecContext;
  private codec: Codec;
  private frame: Frame;
  private stream: Stream;
  private initialized = true;
  private isClosed = false;
  private hardware?: HardwareContext | null;

  /**
   * @param codecContext - Configured codec context
   *
   * @param codec - Codec being used
   *
   * @param stream - Media stream being decoded
   *
   * @param hardware - Optional hardware context
   * Use {@link create} factory method
   *
   * @internal
   */
  private constructor(codecContext: CodecContext, codec: Codec, stream: Stream, hardware?: HardwareContext | null) {
    this.codecContext = codecContext;
    this.codec = codec;
    this.stream = stream;
    this.hardware = hardware;
    this.frame = new Frame();
    this.frame.alloc();
  }

  /**
   * Create a decoder for a media stream.
   *
   * Initializes a decoder with the appropriate codec and configuration.
   * Automatically detects and configures hardware acceleration if provided.
   * Applies custom codec options and threading configuration.
   *
   * @param stream - Media stream to decode
   *
   * @param options - Decoder configuration options
   *
   * @returns Configured decoder instance
   *
   * @throws {Error} If decoder not found for codec
   *
   * @throws {FFmpegError} If codec initialization fails
   *
   * @example
   * ```typescript
   * import { MediaInput, Decoder } from 'node-av/api';
   *
   * await using input = await MediaInput.open('video.mp4');
   * using decoder = await Decoder.create(input.video());
   * ```
   *
   * @example
   * ```typescript
   * using decoder = await Decoder.create(stream, {
   *   threads: 4,
   *   options: {
   *     'refcounted_frames': '1',
   *     'skip_frame': 'nonkey'  // Only decode keyframes
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * const hw = HardwareContext.auto();
   * using decoder = await Decoder.create(stream, {
   *   hardware: hw,
   *   threads: 0  // Auto-detect thread count
   * });
   * ```
   *
   * @see {@link HardwareContext} For GPU acceleration setup
   * @see {@link DecoderOptions} For configuration options
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
      FFmpegError.throwIfError(ret, 'Failed to copy codec parameters');
    }

    // Set packet time base
    codecContext.pktTimebase = stream.timeBase;

    // Apply options
    if (options.threads !== undefined) {
      codecContext.threadCount = options.threads;
    }

    // Check if this decoder supports hardware acceleration
    // Only apply hardware acceleration if the decoder supports it
    // Silently ignore hardware for software decoders
    const isHWDecoder = codec.isHardwareAcceleratedDecoder();
    if (isHWDecoder && options.hardware) {
      codecContext.hwDeviceCtx = options.hardware.deviceContext;
    }

    const opts = options.options ? Dictionary.fromObject(options.options) : undefined;

    // Open codec
    const openRet = await codecContext.open2(codec, opts);
    if (openRet < 0) {
      codecContext.freeContext();
      FFmpegError.throwIfError(openRet, 'Failed to open codec');
    }

    return new Decoder(codecContext, codec, stream, isHWDecoder ? options.hardware : undefined);
  }

  /**
   * Check if decoder is open.
   *
   * @returns true if decoder is open and ready
   *
   * @example
   * ```typescript
   * if (decoder.isDecoderOpen) {
   *   const frame = await decoder.decode(packet);
   * }
   * ```
   */
  get isDecoderOpen(): boolean {
    return !this.isClosed;
  }

  /**
   * Check if decoder has been initialized.
   *
   * Returns true if decoder is initialized (true by default for decoders).
   * Decoders are pre-initialized from stream parameters.
   *
   * @returns true if decoder has been initialized
   *
   * @example
   * ```typescript
   * if (decoder.isDecoderInitialized) {
   *   console.log('Decoder is ready to process frames');
   * }
   * ```
   */
  get isDecoderInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if decoder uses hardware acceleration.
   *
   * @returns true if hardware-accelerated
   *
   * @example
   * ```typescript
   * if (decoder.isHardware()) {
   *   console.log('Using GPU acceleration');
   * }
   * ```
   *
   * @see {@link HardwareContext} For hardware setup
   */
  isHardware(): boolean {
    return !!this.hardware && this.codec.isHardwareAcceleratedDecoder();
  }

  /**
   * Check if decoder is ready for processing.
   *
   * @returns true if initialized and ready
   *
   * @example
   * ```typescript
   * if (decoder.isReady()) {
   *   const frame = await decoder.decode(packet);
   * }
   * ```
   */
  isReady(): boolean {
    return this.initialized && !this.isClosed;
  }

  /**
   * Decode a packet to a frame.
   *
   * Sends a packet to the decoder and attempts to receive a decoded frame.
   * Handles internal buffering - may return null if more packets needed.
   * Automatically manages decoder state and error recovery.
   *
   * Direct mapping to avcodec_send_packet() and avcodec_receive_frame().
   *
   * @param packet - Compressed packet to decode
   *
   * @returns Decoded frame or null if more data needed
   *
   * @throws {Error} If decoder is closed
   *
   * @throws {FFmpegError} If decoding fails
   *
   * @example
   * ```typescript
   * const frame = await decoder.decode(packet);
   * if (frame) {
   *   console.log(`Decoded frame with PTS: ${frame.pts}`);
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * for await (const packet of input.packets()) {
   *   if (packet.streamIndex === decoder.getStream().index) {
   *     const frame = await decoder.decode(packet);
   *     if (frame) {
   *       await processFrame(frame);
   *       frame.free();
   *     }
   *   }
   *   packet.free();
   * }
   * ```
   *
   * @see {@link frames} For automatic packet iteration
   * @see {@link flush} For end-of-stream handling
   */
  async decode(packet: Packet): Promise<Frame | null> {
    if (this.isClosed) {
      throw new Error('Decoder is closed');
    }

    // Send packet to decoder
    const sendRet = await this.codecContext.sendPacket(packet);
    if (sendRet < 0 && sendRet !== AVERROR_EOF) {
      // Decoder might be full, try to receive first
      const frame = await this.receive();
      if (frame) {
        return frame;
      }

      // If still failing, it's an error
      if (sendRet !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(sendRet, 'Failed to send packet');
      }
    }

    // Try to receive frame
    const frame = await this.receive();
    return frame;
  }

  /**
   * Decode a packet to frame synchronously.
   * Synchronous version of decode.
   *
   * Send packet to decoder and attempt to receive frame.
   * Handles decoder buffering and error conditions.
   * May return null if decoder needs more data.
   *
   * @param packet - Compressed packet to decode
   *
   * @returns Decoded frame or null
   *
   * @throws {Error} If decoder is closed
   *
   * @throws {FFmpegError} If decoding fails
   *
   * @example
   * ```typescript
   * const frame = decoder.decodeSync(packet);
   * if (frame) {
   *   console.log(`Decoded: ${frame.width}x${frame.height}`);
   * }
   * ```
   *
   * @see {@link decode} For async version
   */
  decodeSync(packet: Packet): Frame | null {
    if (this.isClosed) {
      throw new Error('Decoder is closed');
    }

    // Send packet to decoder
    const sendRet = this.codecContext.sendPacketSync(packet);
    if (sendRet < 0 && sendRet !== AVERROR_EOF) {
      // Decoder might be full, try to receive first
      const frame = this.receiveSync();
      if (frame) {
        return frame;
      }

      // If still failing, it's an error
      if (sendRet !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(sendRet, 'Failed to send packet');
      }
    }

    // Try to receive frame
    const frame = this.receiveSync();
    return frame;
  }

  /**
   * Decode packet stream to frame stream.
   *
   * High-level async generator for complete decoding pipeline.
   * Automatically filters packets for this stream, manages memory,
   * and flushes buffered frames at end.
   * Primary interface for stream-based decoding.
   *
   * @param packets - Async iterable of packets
   *
   * @yields {Frame} Decoded frames
   *
   * @throws {Error} If decoder is closed
   *
   * @throws {FFmpegError} If decoding fails
   *
   * @example
   * ```typescript
   * await using input = await MediaInput.open('video.mp4');
   * using decoder = await Decoder.create(input.video());
   *
   * for await (const frame of decoder.frames(input.packets())) {
   *   console.log(`Frame: ${frame.width}x${frame.height}`);
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * for await (const frame of decoder.frames(input.packets())) {
   *   // Process frame
   *   await filter.process(frame);
   *
   *   // Frame automatically freed
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * import { pipeline } from 'node-av/api';
   *
   * const control = pipeline(
   *   input,
   *   decoder,
   *   encoder,
   *   output
   * );
   * await control.completion;
   * ```
   *
   * @see {@link decode} For single packet decoding
   * @see {@link MediaInput.packets} For packet source
   */
  async *frames(packets: AsyncIterable<Packet>): AsyncGenerator<Frame> {
    // Process packets
    for await (const packet of packets) {
      try {
        // Only process packets for our stream
        if (packet.streamIndex === this.stream.index) {
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
    await this.flush();
    while (true) {
      const remaining = await this.receive();
      if (!remaining) break;
      yield remaining;
    }
  }

  /**
   * Decode packet stream to frame stream synchronously.
   * Synchronous version of frames.
   *
   * High-level sync generator for complete decoding pipeline.
   * Automatically filters packets for this stream, manages memory,
   * and flushes buffered frames at end.
   *
   * @param packets - Iterable of packets
   *
   * @yields {Frame} Decoded frames
   *
   * @throws {Error} If decoder is closed
   *
   * @throws {FFmpegError} If decoding fails
   *
   * @example
   * ```typescript
   * for (const frame of decoder.framesSync(packets)) {
   *   console.log(`Frame: ${frame.width}x${frame.height}`);
   *   // Process frame...
   * }
   * ```
   *
   * @see {@link frames} For async version
   */
  *framesSync(packets: Iterable<Packet>): Generator<Frame> {
    // Process packets
    for (const packet of packets) {
      try {
        // Only process packets for our stream
        if (packet.streamIndex === this.stream.index) {
          const frame = this.decodeSync(packet);
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
    this.flushSync();
    while (true) {
      const remaining = this.receiveSync();
      if (!remaining) break;
      yield remaining;
    }
  }

  /**
   * Flush decoder and signal end-of-stream.
   *
   * Sends null packet to decoder to signal end-of-stream.
   * Does nothing if decoder is closed.
   * Must use receive() or flushFrames() to get remaining buffered frames.
   *
   * Direct mapping to avcodec_send_packet(NULL).
   *
   * @throws {FFmpegError} If flush fails
   *
   * @example
   * ```typescript
   * // Signal end of stream
   * await decoder.flush();
   *
   * // Then get remaining frames
   * let frame;
   * while ((frame = await decoder.receive()) !== null) {
   *   console.log('Got buffered frame');
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flushFrames} For convenient async iteration
   * @see {@link receive} For getting buffered frames
   */
  async flush(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    // Send flush packet (null)
    const ret = await this.codecContext.sendPacket(null);
    if (ret < 0 && ret !== AVERROR_EOF) {
      if (ret !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(ret, 'Failed to flush decoder');
      }
    }
  }

  /**
   * Flush decoder and signal end-of-stream synchronously.
   * Synchronous version of flush.
   *
   * Send null packet to signal end of input stream.
   * Decoder may still have buffered frames.
   * Call receiveSync() repeatedly to get remaining frames.
   *
   * @throws {FFmpegError} If flush fails
   *
   * @example
   * ```typescript
   * decoder.flushSync();
   * // Get remaining frames
   * let frame;
   * while ((frame = decoder.receiveSync()) !== null) {
   *   console.log('Buffered frame');
   * }
   * ```
   *
   * @see {@link flush} For async version
   */
  flushSync(): void {
    if (this.isClosed) {
      return;
    }

    // Send flush packet (null)
    const ret = this.codecContext.sendPacketSync(null);
    if (ret < 0 && ret !== AVERROR_EOF) {
      if (ret !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(ret, 'Failed to flush decoder');
      }
    }
  }

  /**
   * Flush all buffered frames as async generator.
   *
   * Convenient async iteration over remaining frames.
   * Automatically sends flush signal and retrieves buffered frames.
   * Useful for end-of-stream processing.
   *
   * @yields {Frame} Buffered frames
   *
   * @example
   * ```typescript
   * // Flush at end of decoding
   * for await (const frame of decoder.flushFrames()) {
   *   console.log('Processing buffered frame');
   *   await encoder.encode(frame);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flush} For signaling end-of-stream
   * @see {@link frames} For complete pipeline
   */
  async *flushFrames(): AsyncGenerator<Frame> {
    // Send flush signal
    await this.flush();

    let frame;
    while ((frame = await this.receive()) !== null) {
      yield frame;
    }
  }

  /**
   * Flush all buffered frames as generator synchronously.
   * Synchronous version of flushFrames.
   *
   * Convenient sync iteration over remaining frames.
   * Automatically sends flush signal and retrieves buffered frames.
   * Useful for end-of-stream processing.
   *
   * @yields {Frame} Buffered frames
   *
   * @example
   * ```typescript
   * // Flush at end of decoding
   * for (const frame of decoder.flushFramesSync()) {
   *   console.log('Processing buffered frame');
   *   encoder.encodeSync(frame);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flushFrames} For async version
   */
  *flushFramesSync(): Generator<Frame> {
    // Send flush signal
    this.flushSync();

    let frame;
    while ((frame = this.receiveSync()) !== null) {
      yield frame;
    }
  }

  /**
   * Receive frame from decoder.
   *
   * Gets decoded frames from the codec's internal buffer.
   * Handles frame cloning and error checking.
   * Hardware frames include hw_frames_ctx reference.
   * Call repeatedly until null to drain all buffered frames.
   *
   * Direct mapping to avcodec_receive_frame().
   *
   * @returns Cloned frame or null if no frames available
   *
   * @throws {FFmpegError} If receive fails with error other than AVERROR_EAGAIN or AVERROR_EOF
   *
   * @example
   * ```typescript
   * const frame = await decoder.receive();
   * if (frame) {
   *   console.log('Got decoded frame');
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Drain all buffered frames
   * let frame;
   * while ((frame = await decoder.receive()) !== null) {
   *   console.log(`Frame PTS: ${frame.pts}`);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link decode} For sending packets and receiving frames
   * @see {@link flush} For signaling end-of-stream
   */
  async receive(): Promise<Frame | null> {
    // Clear previous frame data
    this.frame.unref();

    const ret = await this.codecContext.receiveFrame(this.frame);

    if (ret === 0) {
      // Got a frame, clone it for the user
      return this.frame.clone();
    } else if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
      // Need more data or end of stream
      return null;
    } else {
      // Error
      FFmpegError.throwIfError(ret, 'Failed to receive frame');
      return null;
    }
  }

  /**
   * Receive frame from decoder synchronously.
   * Synchronous version of receive.
   *
   * Gets decoded frames from the codec's internal buffer.
   * Handles frame cloning and error checking.
   * Hardware frames include hw_frames_ctx reference.
   * Call repeatedly until null to drain all buffered frames.
   *
   * Direct mapping to avcodec_receive_frame().
   *
   * @returns Cloned frame or null if no frames available
   *
   * @throws {FFmpegError} If receive fails with error other than AVERROR_EAGAIN or AVERROR_EOF
   *
   * @example
   * ```typescript
   * const frame = decoder.receiveSync();
   * if (frame) {
   *   console.log('Got decoded frame');
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Drain all buffered frames
   * let frame;
   * while ((frame = decoder.receiveSync()) !== null) {
   *   console.log(`Frame PTS: ${frame.pts}`);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link receive} For async version
   */
  receiveSync(): Frame | null {
    // Clear previous frame data
    this.frame.unref();

    const ret = this.codecContext.receiveFrameSync(this.frame);

    if (ret === 0) {
      // Got a frame, clone it for the user
      return this.frame.clone();
    } else if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
      // Need more data or end of stream
      return null;
    } else {
      // Error
      FFmpegError.throwIfError(ret, 'Failed to receive frame');
      return null;
    }
  }

  /**
   * Close decoder and free resources.
   *
   * Releases codec context and internal frame buffer.
   * Safe to call multiple times.
   * Automatically called by Symbol.dispose.
   *
   * @example
   * ```typescript
   * const decoder = await Decoder.create(stream);
   * try {
   *   // Use decoder
   * } finally {
   *   decoder.close();
   * }
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  close(): void {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    this.frame.free();
    this.codecContext.freeContext();

    this.initialized = false;
  }

  /**
   * Get stream object.
   *
   * Returns the underlying stream being decoded.
   * Provides access to stream metadata and parameters.
   *
   * @returns Stream object
   *
   * @internal
   *
   * @see {@link Stream} For stream details
   */
  getStream(): Stream {
    return this.stream;
  }

  /**
   * Get decoder codec.
   *
   * Returns the codec used by this decoder.
   * Useful for checking codec capabilities and properties.
   *
   * @returns Codec instance
   *
   * @internal
   *
   * @see {@link Codec} For codec details
   */
  getCodec(): Codec {
    return this.codec;
  }

  /**
   * Get underlying codec context.
   *
   * Returns the codec context for advanced operations.
   * Useful for accessing low-level codec properties and settings.
   * Returns null if decoder is closed.
   *
   * @returns Codec context or null if closed
   *
   * @internal
   *
   * @see {@link CodecContext} For context details
   */
  getCodecContext(): CodecContext | null {
    return !this.isClosed && this.initialized ? this.codecContext : null;
  }

  /**
   * Dispose of decoder.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   using decoder = await Decoder.create(stream);
   *   // Decode frames...
   * } // Automatically closed
   * ```
   *
   * @see {@link close} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
