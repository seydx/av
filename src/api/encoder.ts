import { AVERROR_EAGAIN, AVERROR_EOF } from '../constants/constants.js';
import { Codec, CodecContext, Dictionary, FFmpegError, Packet, Rational } from '../lib/index.js';
import { parseBitrate } from './utils.js';

import type { AVCodecID, AVPixelFormat, AVSampleFormat } from '../constants/constants.js';
import type { FFEncoderCodec } from '../constants/encoders.js';
import type { Frame } from '../lib/index.js';
import type { EncoderOptions } from './types.js';

/**
 * High-level encoder for audio and video streams.
 *
 * Provides a simplified interface for encoding media frames to packets.
 * Handles codec initialization, hardware acceleration setup, and packet management.
 * Supports both synchronous frame-by-frame encoding and async iteration over packets.
 * Essential component in media processing pipelines for converting raw frames to compressed data.
 *
 * @example
 * ```typescript
 * import { Encoder } from 'node-av/api';
 * import { AV_CODEC_ID_H264, FF_ENCODER_LIBX264 } from 'node-av/constants';
 *
 * // Create H.264 encoder
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
 *   type: 'video',
 *   width: 1920,
 *   height: 1080,
 *   pixelFormat: AV_PIX_FMT_YUV420P,
 *   timeBase: { num: 1, den: 30 },
 *   frameRate: { num: 30, den: 1 }
 * }, {
 *   bitrate: '5M',
 *   gopSize: 60
 * });
 *
 * // Encode frames
 * const packet = await encoder.encode(frame);
 * if (packet) {
 *   await output.writePacket(packet);
 *   packet.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Hardware-accelerated encoding with lazy initialization
 * import { HardwareContext } from 'node-av/api';
 * import { FF_ENCODER_H264_VIDEOTOOLBOX } from 'node-av/constants';
 *
 * const hw = HardwareContext.auto();
 * const encoderCodec = hw?.getEncoderCodec('h264') ?? FF_ENCODER_H264_VIDEOTOOLBOX;
 * const encoder = await Encoder.create(encoderCodec, {
 *   timeBase: video.timeBase,
 *   bitrate: '10M'
 * });
 *
 * // Hardware context will be detected from first frame's hw_frames_ctx
 * for await (const packet of encoder.packets(frames)) {
 *   await output.writePacket(packet);
 *   packet.free();
 * }
 * ```
 *
 * @see {@link Decoder} For decoding packets to frames
 * @see {@link MediaOutput} For writing encoded packets
 * @see {@link HardwareContext} For GPU acceleration
 */
export class Encoder implements Disposable {
  private codecContext: CodecContext;
  private packet: Packet;
  private codec: Codec;
  private initialized = false;
  private isClosed = false;
  private opts?: Dictionary | null;

  /**
   * @param codecContext - Configured codec context
   * @param codec - Encoder codec
   * @param opts - Encoder options as Dictionary
   * @internal
   */
  private constructor(codecContext: CodecContext, codec: Codec, opts?: Dictionary | null) {
    this.codecContext = codecContext;
    this.codec = codec;
    this.opts = opts;
    this.packet = new Packet();
    this.packet.alloc();
  }

  /**
   * Create an encoder with specified codec and options.
   *
   * Initializes an encoder with the appropriate codec and configuration.
   * Uses lazy initialization - encoder is opened when first frame is received.
   * Hardware context will be automatically detected from first frame if not provided.
   *
   * Direct mapping to avcodec_find_encoder_by_name() or avcodec_find_encoder().
   *
   * @param encoderCodec - Codec name, ID, or instance to use for encoding
   * @param options - Encoder configuration options including required timeBase
   * @returns Configured encoder instance
   *
   * @throws {Error} If encoder not found or timeBase not provided
   *
   * @throws {FFmpegError} If codec allocation fails
   *
   * @example
   * ```typescript
   * // From decoder stream info
   * const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
   *   timeBase: video.timeBase,
   *   bitrate: '5M',
   *   gopSize: 60,
   *   options: {
   *     preset: 'fast',
   *     crf: '23'
   *   }
   * });
   * ```
   *
   * @example
   * ```typescript
   * // With custom stream info
   * const encoder = await Encoder.create(FF_ENCODER_AAC, {
   *   timeBase: audio.timeBase,
   *   bitrate: '192k'
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Hardware encoder
   * const hw = HardwareContext.auto();
   * const encoderCodec = hw?.getEncoderCodec('h264') ?? FF_ENCODER_H264_VIDEOTOOLBOX;
   * const encoder = await Encoder.create(encoderCodec, {
   *   timeBase: video.timeBase,
   *   bitrate: '8M'
   * });
   * ```
   *
   * @see {@link EncoderOptions} For configuration options
   */
  static async create(encoderCodec: FFEncoderCodec | AVCodecID | Codec, options: EncoderOptions): Promise<Encoder> {
    let codec: Codec | null = null;
    let codecName = '';

    if (encoderCodec instanceof Codec) {
      codec = encoderCodec;
      codecName = codec.name ?? 'Unknown';
    } else if (typeof encoderCodec === 'string') {
      codec = Codec.findEncoderByName(encoderCodec);
      codecName = codec?.name ?? encoderCodec;
    } else {
      codec = Codec.findEncoder(encoderCodec);
      codecName = codec?.name ?? encoderCodec.toString();
    }

    if (!codec) {
      throw new Error(`Encoder ${codecName} not found`);
    }

    // Allocate codec context
    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);

    // Apply encoder-specific options
    if (options.gopSize !== undefined) {
      codecContext.gopSize = options.gopSize;
    }

    if (options.maxBFrames !== undefined) {
      codecContext.maxBFrames = options.maxBFrames;
    }

    // Apply common options
    if (options.bitrate !== undefined) {
      const bitrate = typeof options.bitrate === 'string' ? parseBitrate(options.bitrate) : BigInt(options.bitrate);
      codecContext.bitRate = bitrate;
    }

    if (options.minRate !== undefined) {
      const minRate = typeof options.minRate === 'string' ? parseBitrate(options.minRate) : BigInt(options.minRate);
      codecContext.rcMinRate = minRate;
    }

    if (options.maxRate !== undefined) {
      const maxRate = typeof options.maxRate === 'string' ? parseBitrate(options.maxRate) : BigInt(options.maxRate);
      codecContext.rcMaxRate = maxRate;
    }

    if (options.bufSize !== undefined) {
      const bufSize = typeof options.bufSize === 'string' ? parseBitrate(options.bufSize) : BigInt(options.bufSize);
      codecContext.rcBufferSize = Number(bufSize);
    }

    if (options.threads !== undefined) {
      codecContext.threadCount = options.threads;
    }

    codecContext.timeBase = new Rational(options.timeBase.num, options.timeBase.den);
    codecContext.pktTimebase = new Rational(options.timeBase.num, options.timeBase.den);

    if (options.frameRate) {
      codecContext.framerate = new Rational(options.frameRate.num, options.frameRate.den);
    }

    const opts = options.options ? Dictionary.fromObject(options.options) : undefined;

    return new Encoder(codecContext, codec, opts);
  }

  /**
   * Check if encoder is open.
   *
   * @example
   * ```typescript
   * if (encoder.isEncoderOpen) {
   *   const packet = await encoder.encode(frame);
   * }
   * ```
   */
  get isEncoderOpen(): boolean {
    return !this.isClosed;
  }

  /**
   * Check if encoder has been initialized.
   *
   * Returns true after first frame has been processed and encoder opened.
   * Useful for checking if encoder has received frame properties.
   *
   * @returns true if encoder has been initialized with frame data
   *
   * @example
   * ```typescript
   * if (!encoder.isEncoderInitialized) {
   *   console.log('Encoder will initialize on first frame');
   * }
   * ```
   */
  get isEncoderInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if encoder uses hardware acceleration.
   *
   * @returns true if hardware-accelerated
   *
   * @example
   * ```typescript
   * if (encoder.isHardware()) {
   *   console.log('Using GPU acceleration');
   * }
   * ```
   *
   * @see {@link HardwareContext} For hardware setup
   */
  isHardware(): boolean {
    return this.codec.isHardwareAcceleratedEncoder();
  }

  /**
   * Check if encoder is ready for processing.
   *
   * @returns true if initialized and ready
   *
   * @example
   * ```typescript
   * if (encoder.isReady()) {
   *   const packet = await encoder.encode(frame);
   * }
   * ```
   */
  isReady(): boolean {
    return this.initialized && !this.isClosed;
  }

  /**
   * Encode a frame to a packet.
   *
   * Sends a frame to the encoder and attempts to receive an encoded packet.
   * On first frame, automatically initializes encoder with frame properties.
   * Handles internal buffering - may return null if more frames needed.
   *
   * Direct mapping to avcodec_send_frame() and avcodec_receive_packet().
   *
   * @param frame - Raw frame to encode (or null to flush)
   * @returns Encoded packet or null if more data needed
   *
   * @throws {Error} If encoder is closed
   *
   * @throws {FFmpegError} If encoding fails
   *
   * @example
   * ```typescript
   * const packet = await encoder.encode(frame);
   * if (packet) {
   *   console.log(`Encoded packet with PTS: ${packet.pts}`);
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Encode loop
   * for await (const frame of decoder.frames(input.packets())) {
   *   const packet = await encoder.encode(frame);
   *   if (packet) {
   *     await output.writePacket(packet);
   *     packet.free();
   *   }
   *   frame.free();
   * }
   * ```
   *
   * @see {@link packets} For automatic frame iteration
   * @see {@link flush} For end-of-stream handling
   */
  async encode(frame: Frame | null): Promise<Packet | null> {
    if (this.isClosed) {
      if (!frame) {
        return null;
      }

      throw new Error('Encoder is closed');
    }

    // Open encoder if not already done
    if (!this.initialized) {
      if (!frame) {
        return null;
      }

      await this.initialize(frame);
    }

    // Send frame to encoder
    const sendRet = await this.codecContext.sendFrame(frame);
    if (sendRet < 0 && sendRet !== AVERROR_EOF) {
      // Encoder might be full, try to receive first
      const packet = await this.receive();
      if (packet) return packet;

      // If still failing, it's an error
      if (sendRet !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(sendRet, 'Failed to send frame');
      }
    }

    // Try to receive packet
    return await this.receive();
  }

  /**
   * Encode frame stream to packet stream.
   *
   * High-level async generator for complete encoding pipeline.
   * Automatically manages frame memory, encoder state,
   * and flushes buffered packets at end.
   * Primary interface for stream-based encoding.
   *
   * @param frames - Async iterable of frames (freed automatically)
   * @yields Encoded packets (caller must free)
   * @throws {Error} If encoder is closed
   *
   * @throws {FFmpegError} If encoding fails
   *
   * @example
   * ```typescript
   * // Basic encoding pipeline
   * for await (const packet of encoder.packets(decoder.frames(input.packets()))) {
   *   await output.writePacket(packet);
   *   packet.free(); // Must free output packets
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With frame filtering
   * async function* filteredFrames() {
   *   for await (const frame of decoder.frames(input.packets())) {
   *     const filtered = await filter.process(frame);
   *     if (filtered) {
   *       yield filtered;
   *     }
   *     frame.free();
   *   }
   * }
   *
   * for await (const packet of encoder.packets(filteredFrames())) {
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Pipeline integration
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
   * @see {@link encode} For single frame encoding
   * @see {@link Decoder.frames} For frame source
   */
  async *packets(frames: AsyncIterable<Frame>): AsyncGenerator<Packet> {
    // Process frames
    for await (const frame of frames) {
      try {
        const packet = await this.encode(frame);
        if (packet) {
          yield packet;
        }
      } finally {
        // Free the input frame after encoding
        frame.free();
      }
    }

    // Flush encoder after all frames
    await this.flush();
    while (true) {
      const remaining = await this.receive();
      if (!remaining) break;
      yield remaining;
    }
  }

  /**
   * Flush encoder and signal end-of-stream.
   *
   * Sends null frame to encoder to signal end-of-stream.
   * Does nothing if encoder was never initialized or is closed.
   * Must call receive() to get remaining buffered packets.
   *
   * Direct mapping to avcodec_send_frame(NULL).
   *
   * @example
   * ```typescript
   * // Signal end of stream
   * await encoder.flush();
   *
   * // Then get remaining packets
   * let packet;
   * while ((packet = await encoder.receive()) !== null) {
   *   console.log('Got buffered packet');
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link flushPackets} For async iteration
   * @see {@link receive} For getting buffered packets
   */
  async flush(): Promise<void> {
    if (this.isClosed || !this.initialized) {
      return;
    }

    // Send flush frame (null)
    const ret = await this.codecContext.sendFrame(null);
    if (ret < 0 && ret !== AVERROR_EOF) {
      if (ret !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(ret, 'Failed to flush encoder');
      }
    }
  }

  /**
   * Flush all buffered packets as async generator.
   *
   * Convenient async iteration over remaining packets.
   * Automatically handles flush and repeated receive calls.
   * Returns immediately if encoder was never initialized or is closed.
   *
   * @yields Buffered packets
   *
   * @example
   * ```typescript
   * // Flush at end of encoding
   * for await (const packet of encoder.flushPackets()) {
   *   console.log('Processing buffered packet');
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link flush} For signaling end-of-stream
   * @see {@link packets} For complete pipeline
   */
  async *flushPackets(): AsyncGenerator<Packet> {
    // Send flush signal
    await this.flush();

    let packet;
    while ((packet = await this.receive()) !== null) {
      yield packet;
    }
  }

  /**
   * Receive packet from encoder.
   *
   * Gets encoded packets from the codec's internal buffer.
   * Handles packet cloning and error checking.
   * Returns null if encoder is closed, not initialized, or no packets available.
   * Call repeatedly until null to drain all buffered packets.
   *
   * Direct mapping to avcodec_receive_packet().
   *
   * @returns Cloned packet or null if no packets available
   *
   * @throws {FFmpegError} If receive fails with error other than AVERROR_EAGAIN or AVERROR_EOF
   *
   * @example
   * ```typescript
   * const packet = await encoder.receive();
   * if (packet) {
   *   console.log(`Got packet with PTS: ${packet.pts}`);
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Drain all buffered packets
   * let packet;
   * while ((packet = await encoder.receive()) !== null) {
   *   console.log(`Packet size: ${packet.size}`);
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link encode} For sending frames and receiving packets
   * @see {@link flush} For signaling end-of-stream
   */
  async receive(): Promise<Packet | null> {
    if (this.isClosed || !this.initialized) {
      return null;
    }

    // Clear previous packet data
    this.packet.unref();

    const ret = await this.codecContext.receivePacket(this.packet);

    if (ret === 0) {
      // Got a packet, clone it for the user
      return this.packet.clone();
    } else if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
      // Need more data or end of stream
      return null;
    } else {
      // Error
      FFmpegError.throwIfError(ret, 'Failed to receive packet');
      return null;
    }
  }

  /**
   * Close encoder and free resources.
   *
   * Releases codec context and internal packet buffer.
   * Safe to call multiple times.
   * Automatically called by Symbol.dispose.
   *
   * @example
   * ```typescript
   * const encoder = await Encoder.create(FF_ENCODER_LIBX264, { ... });
   * try {
   *   // Use encoder
   * } finally {
   *   encoder.close();
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

    this.packet.free();
    this.codecContext.freeContext();

    this.initialized = false;
  }

  /**
   * Initialize encoder from first frame.
   *
   * Sets codec context parameters from frame properties.
   * Configures hardware context if present in frame.
   * Opens encoder with accumulated options.
   *
   * @param frame - First frame to encode
   *
   * @throws {FFmpegError} If encoder open fails
   *
   * @internal
   */
  private async initialize(frame: Frame): Promise<void> {
    if (frame.isVideo()) {
      this.codecContext.width = frame.width;
      this.codecContext.height = frame.height;
      this.codecContext.pixelFormat = frame.format as AVPixelFormat;
      this.codecContext.sampleAspectRatio = frame.sampleAspectRatio;
    } else {
      this.codecContext.sampleRate = frame.sampleRate;
      this.codecContext.sampleFormat = frame.format as AVSampleFormat;
      this.codecContext.channelLayout = frame.channelLayout;
    }

    this.codecContext.hwDeviceCtx = frame.hwFramesCtx?.deviceRef ?? null;
    this.codecContext.hwFramesCtx = frame.hwFramesCtx;

    // Open codec
    const openRet = await this.codecContext.open2(this.codec, this.opts);
    if (openRet < 0) {
      this.codecContext.freeContext();
      FFmpegError.throwIfError(openRet, 'Failed to open encoder');
    }

    this.initialized = true;
  }

  /**
   * Get encoder codec.
   *
   * Returns the codec used by this encoder.
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
   * Returns null if encoder is closed or not initialized.
   *
   * @returns Codec context or null if closed/not initialized
   *
   * @internal
   *
   * @see {@link CodecContext} For context details
   */
  getCodecContext(): CodecContext | null {
    return !this.isClosed && this.initialized ? this.codecContext : null;
  }

  /**
   * Dispose of encoder.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   using encoder = await Encoder.create(FF_ENCODER_LIBX264, { ... });
   *   // Encode frames...
   * } // Automatically closed
   * ```
   *
   * @see {@link close} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
