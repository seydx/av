import { AVERROR_EOF, AVMEDIA_TYPE_VIDEO } from '../constants/constants.js';
import { AVERROR_EAGAIN, Codec, CodecContext, FFmpegError, Frame } from '../lib/index.js';

import type { Packet, Stream } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { DecoderOptions, StreamInfo } from './types.js';

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
 * import { MediaInput, Decoder } from '@seydx/av/api';
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
 * import { HardwareContext } from '@seydx/av/api';
 * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
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
  private frame: Frame;
  private streamIndex: number;
  private stream: Stream;
  private isOpen = true;
  private hardware?: HardwareContext | null;

  /**
   * @param codecContext - Configured codec context
   * @param stream - Media stream being decoded
   * @param hardware - Optional hardware context
   * Use {@link create} factory method
   *
   * @internal
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
   * Create a decoder for a media stream.
   *
   * Initializes a decoder with the appropriate codec and configuration.
   * Automatically detects and configures hardware acceleration if provided.
   * Applies custom codec options and threading configuration.
   *
   * @param stream - Media stream to decode
   * @param options - Decoder configuration options
   * @returns Configured decoder instance
   *
   * @throws {Error} If decoder not found for codec
   * @throws {FFmpegError} If codec initialization fails
   *
   * @example
   * ```typescript
   * import { MediaInput, Decoder } from '@seydx/av/api';
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

    // Apply codec-specific options via AVOptions
    if (options.options) {
      for (const [key, value] of Object.entries(options.options)) {
        codecContext.setOption(key, value.toString());
      }
    }

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      FFmpegError.throwIfError(openRet, 'Failed to open codec');
    }

    const decoder = new Decoder(codecContext, stream, isHWDecoder ? options.hardware : undefined);
    return decoder;
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
    return this.isOpen;
  }

  /**
   * Get output stream information.
   *
   * Returns format information about decoded frames.
   * For hardware decoding, returns the hardware pixel format.
   * Essential for configuring downstream components like encoders or filters.
   *
   * @returns Stream format information
   *
   * @example
   * ```typescript
   * const info = decoder.getOutputStreamInfo();
   * if (info.type === 'video') {
   *   console.log(`Video: ${info.width}x${info.height} @ ${info.pixelFormat}`);
   *   console.log(`Frame rate: ${info.frameRate.num}/${info.frameRate.den}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * const info = decoder.getOutputStreamInfo();
   * if (info.type === 'audio') {
   *   console.log(`Audio: ${info.sampleRate}Hz ${info.sampleFormat}`);
   *   console.log(`Channels: ${info.channelLayout}`);
   * }
   * ```
   *
   * @see {@link StreamInfo} For format details
   * @see {@link Encoder.create} For matching encoder configuration
   */
  getOutputStreamInfo(): StreamInfo {
    if (this.stream.codecpar.codecType === AVMEDIA_TYPE_VIDEO) {
      return {
        type: 'video',
        width: this.codecContext.width,
        height: this.codecContext.height,
        pixelFormat: this.hardware?.devicePixelFormat ?? this.codecContext.pixelFormat,
        timeBase: this.stream.timeBase,
        frameRate: this.stream.rFrameRate,
        sampleAspectRatio: this.codecContext.sampleAspectRatio,
      };
    } else {
      return {
        type: 'audio',
        sampleRate: this.codecContext.sampleRate,
        sampleFormat: this.codecContext.sampleFormat,
        channelLayout: this.codecContext.channelLayout,
        timeBase: this.stream.timeBase,
      };
    }
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
    return !!this.hardware;
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
   * @returns Decoded frame or null if more data needed
   *
   * @throws {Error} If decoder is closed
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
   *   if (packet.streamIndex === decoder.getStreamIndex()) {
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
    if (!this.isOpen) {
      throw new Error('Decoder is closed');
    }

    // Send packet to decoder
    const sendRet = await this.codecContext.sendPacket(packet);
    if (sendRet < 0 && sendRet !== AVERROR_EOF) {
      // Decoder might be full, try to receive first
      const frame = await this.receiveFrameInternal();
      if (frame) {
        return frame;
      }

      // If still failing, it's an error
      if (sendRet !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(sendRet, 'Failed to send packet');
      }
    }

    // Try to receive frame
    const frame = await this.receiveFrameInternal();
    return frame;
  }

  /**
   * Flush decoder and get buffered frame.
   *
   * Signals end-of-stream and retrieves remaining frames.
   * Call repeatedly until null to get all buffered frames.
   * Essential for ensuring all frames are decoded.
   *
   * Direct mapping to avcodec_send_packet(NULL).
   *
   * @returns Buffered frame or null if none remaining
   *
   * @throws {Error} If decoder is closed
   *
   * @example
   * ```typescript
   * // After all packets processed
   * let frame;
   * while ((frame = await decoder.flush()) !== null) {
   *   console.log('Got buffered frame');
   *   await processFrame(frame);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flushFrames} For async iteration
   * @see {@link frames} For complete decoding pipeline
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
   * Flush all buffered frames as async generator.
   *
   * Convenient async iteration over remaining frames.
   * Automatically handles repeated flush calls.
   * Useful for end-of-stream processing.
   *
   * @yields Buffered frames
   * @throws {Error} If decoder is closed
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
   * @see {@link flush} For single frame flush
   * @see {@link frames} For complete pipeline
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
   * Decode packet stream to frame stream.
   *
   * High-level async generator for complete decoding pipeline.
   * Automatically filters packets for this stream, manages memory,
   * and flushes buffered frames at end.
   * Primary interface for stream-based decoding.
   *
   * @param packets - Async iterable of packets
   * @yields Decoded frames
   * @throws {Error} If decoder is closed
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
   *   await filter.filterFrame(frame);
   *
   *   // Frame automatically freed
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * import { pipeline } from '@seydx/av/api';
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
    if (!this.isOpen) {
      return;
    }

    this.frame.free();
    this.codecContext.freeContext();

    this.isOpen = false;
  }

  /**
   * Get stream index.
   *
   * Returns the index of the stream being decoded.
   * Used for packet filtering in multi-stream files.
   *
   * @returns Stream index
   *
   * @example
   * ```typescript
   * if (packet.streamIndex === decoder.getStreamIndex()) {
   *   const frame = await decoder.decode(packet);
   * }
   * ```
   *
   * @see {@link getStream} For full stream object
   */
  getStreamIndex(): number {
    return this.streamIndex;
  }

  /**
   * Get stream object.
   *
   * Returns the underlying stream being decoded.
   * Provides access to stream metadata and parameters.
   *
   * @returns Stream object
   *
   * @example
   * ```typescript
   * const stream = decoder.getStream();
   * console.log(`Duration: ${stream.duration}`);
   * console.log(`Time base: ${stream.timeBase.num}/${stream.timeBase.den}`);
   * ```
   *
   * @see {@link Stream} For stream properties
   * @see {@link getStreamIndex} For index only
   */
  getStream(): Stream {
    return this.stream;
  }

  /**
   * Get underlying codec context.
   *
   * Returns the internal codec context for advanced operations.
   * Returns null if decoder is closed.
   *
   * @returns Codec context or null
   *
   * @internal
   */
  getCodecContext(): CodecContext | null {
    return this.isOpen ? this.codecContext : null;
  }

  /**
   * Receive frame from decoder.
   *
   * Internal method to get decoded frames from codec.
   * Handles frame cloning and error checking.
   * Hardware frames include hw_frames_ctx reference.
   *
   * Direct mapping to avcodec_receive_frame().
   *
   * @returns Cloned frame or null
   *
   * @throws {FFmpegError} If receive fails with error other than AVERROR_EAGAIN or AVERROR_EOF
   *
   */
  private async receiveFrameInternal(): Promise<Frame | null> {
    // Clear previous frame data
    this.frame.unref();

    const ret = await this.codecContext.receiveFrame(this.frame);

    if (ret === 0) {
      // Note: hw_frames_ctx is now available in the frame
      // Other components should get it directly from frames, not from HardwareContext

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
