import { AVERROR_EOF, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO } from '../constants/constants.js';
import { AVERROR_EAGAIN, avGetPixFmtName, avGetSampleFmtName, Codec, CodecContext, FFmpegError, Packet, Rational } from '../lib/index.js';
import { parseBitrate } from './utils.js';

import type { AVCodecID } from '../constants/constants.js';
import type { FFEncoderCodec } from '../constants/encoders.js';
import type { Frame } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { EncoderOptions, StreamInfo } from './types.js';

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
 * import { Encoder } from '@seydx/av/api';
 * import { AV_CODEC_ID_H264 } from '@seydx/av/constants';
 *
 * // Create H.264 encoder
 * const encoder = await Encoder.create('libx264', {
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
 * // Hardware-accelerated encoding
 * import { HardwareContext } from '@seydx/av/api';
 * import { AV_HWDEVICE_TYPE_CUDA } from '@seydx/av/constants';
 *
 * const hw = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
 * const encoder = await Encoder.create('h264_nvenc', streamInfo, {
 *   hardware: hw,
 *   bitrate: '10M'
 * });
 *
 * // Frames with hw_frames_ctx will be encoded on GPU
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
  private isOpen = true;
  private hardware?: HardwareContext | null;

  /**
   * @param codecContext - Configured codec context
   * @param codec - Encoder codec
   * @param hardware - Optional hardware context
   * @internal
   */
  private constructor(codecContext: CodecContext, codec: Codec, hardware?: HardwareContext | null) {
    this.codecContext = codecContext;
    this.codec = codec;
    this.hardware = hardware;
    this.packet = new Packet();
    this.packet.alloc();
  }

  /**
   * Create an encoder with specified codec and options.
   *
   * Initializes an encoder with the appropriate codec and configuration.
   * Automatically configures parameters based on input stream info.
   * Handles hardware acceleration setup if provided.
   *
   * Direct mapping to avcodec_find_encoder_by_name() or avcodec_find_encoder().
   *
   * @param encoderCodec - Codec name, ID, or instance to use for encoding
   * @param input - Stream information to configure encoder
   * @param options - Encoder configuration options
   * @returns Configured encoder instance
   *
   * @throws {Error} If encoder not found or unsupported format
   * @throws {FFmpegError} If codec initialization fails
   *
   * @example
   * ```typescript
   * // From decoder stream info
   * const streamInfo = decoder.getOutputStreamInfo();
   * const encoder = await Encoder.create('libx264', streamInfo, {
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
   * const encoder = await Encoder.create('aac', {
   *   type: 'audio',
   *   sampleRate: 48000,
   *   sampleFormat: AV_SAMPLE_FMT_FLTP,
   *   channelLayout: AV_CH_LAYOUT_STEREO,
   *   timeBase: { num: 1, den: 48000 }
   * }, {
   *   bitrate: '192k'
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Hardware encoder
   * const hw = HardwareContext.auto();
   * const encoder = await Encoder.create('hevc_videotoolbox', streamInfo, {
   *   hardware: hw,
   *   bitrate: '8M'
   * });
   * ```
   *
   * @see {@link Decoder.getOutputStreamInfo} For stream info source
   * @see {@link EncoderOptions} For configuration options
   */
  static async create(encoderCodec: FFEncoderCodec | AVCodecID | Codec, input: StreamInfo, options: EncoderOptions = {}): Promise<Encoder> {
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

    // It's StreamInfo - apply manually
    if (input.type === 'video' && codec.type === AVMEDIA_TYPE_VIDEO) {
      const videoInfo = input;

      const codecPixelformats = codec.pixelFormats;
      if (codecPixelformats && !codecPixelformats.includes(videoInfo.pixelFormat)) {
        codecContext.freeContext();
        const pixelFormatName = avGetPixFmtName(videoInfo.pixelFormat) ?? 'unknown';
        const codecPixFmtNames = codecPixelformats.map(avGetPixFmtName).filter(Boolean).join(', ');
        throw new Error(`Unsupported pixel format for '${codecName}' encoder: ${pixelFormatName}! Supported formats: ${codecPixFmtNames}`);
      }

      codecContext.width = videoInfo.width;
      codecContext.height = videoInfo.height;
      codecContext.pixelFormat = videoInfo.pixelFormat;

      // Set pkt_timebase and timeBase to input timebase
      codecContext.pktTimebase = new Rational(videoInfo.timeBase.num, videoInfo.timeBase.den);
      codecContext.timeBase = new Rational(videoInfo.timeBase.num, videoInfo.timeBase.den);

      if (videoInfo.frameRate) {
        codecContext.framerate = new Rational(videoInfo.frameRate.num, videoInfo.frameRate.den);
      }
      if (videoInfo.sampleAspectRatio) {
        codecContext.sampleAspectRatio = new Rational(videoInfo.sampleAspectRatio.num, videoInfo.sampleAspectRatio.den);
      }
    } else if (input.type === 'audio' && codec.type === AVMEDIA_TYPE_AUDIO) {
      const audioInfo = input;

      const codecSampleFormats = codec.sampleFormats;
      if (codecSampleFormats && !codecSampleFormats.includes(audioInfo.sampleFormat)) {
        codecContext.freeContext();
        const sampleFormatName = avGetSampleFmtName(audioInfo.sampleFormat) ?? 'unknown';
        const supportedFormats = codecSampleFormats.map(avGetSampleFmtName).filter(Boolean).join(', ');
        throw new Error(`Unsupported sample format for '${codecName}' encoder: ${sampleFormatName}! Supported formats: ${supportedFormats}`);
      }

      codecContext.sampleRate = audioInfo.sampleRate;
      codecContext.sampleFormat = audioInfo.sampleFormat;
      codecContext.channelLayout = audioInfo.channelLayout;
      // Set both pkt_timebase and timeBase for audio
      codecContext.pktTimebase = new Rational(audioInfo.timeBase.num, audioInfo.timeBase.den);
      codecContext.timeBase = new Rational(audioInfo.timeBase.num, audioInfo.timeBase.den);

      if (audioInfo.frameSize) {
        codecContext.frameSize = audioInfo.frameSize;
      }
    } else {
      codecContext.freeContext();
      throw new Error(`Unsupported codec type for encoder! Input type: ${input.type}, Codec type: ${codec.type}`);
    }

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
    if (options.threads !== undefined) {
      codecContext.threadCount = options.threads;
    }

    // Override timeBase if explicitly specified in options
    if (options.timeBase) {
      codecContext.timeBase = new Rational(options.timeBase.num, options.timeBase.den);
    }

    // Apply codec-specific options via AVOptions
    if (options.options) {
      for (const [key, value] of Object.entries(options.options)) {
        codecContext.setOption(key, value.toString());
      }
    }

    const isHWEncoder = codec.isHardwareAcceleratedEncoder();
    if (isHWEncoder && !options.hardware) {
      codecContext.freeContext();
      throw new Error(`Hardware encoder '${codecName}' requires a hardware context`);
    }

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      FFmpegError.throwIfError(openRet, 'Failed to open encoder');
    }

    const encoder = new Encoder(codecContext, codec, isHWEncoder ? options.hardware : undefined);

    return encoder;
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
    return this.isOpen;
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
    return !!this.hardware;
  }

  /**
   * Encode a frame to a packet.
   *
   * Sends a frame to the encoder and attempts to receive an encoded packet.
   * Handles internal buffering - may return null if more frames needed.
   * Automatically manages encoder state and hardware context binding.
   *
   * Direct mapping to avcodec_send_frame() and avcodec_receive_packet().
   *
   * @param frame - Raw frame to encode (or null to flush)
   * @returns Encoded packet or null if more data needed
   *
   * @throws {Error} If encoder is closed
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
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    // Late binding of hw_frames_ctx for hardware encoders
    // Hardware encoders get hw_frames_ctx from the frames they receive
    if (this.hardware && frame?.hwFramesCtx && !this.codecContext.hwFramesCtx) {
      // Use the hw_frames_ctx from the frame
      this.codecContext.hwFramesCtx = frame.hwFramesCtx;
      this.codecContext.pixelFormat = this.hardware.devicePixelFormat;
    }

    // Send frame to encoder
    const sendRet = await this.codecContext.sendFrame(frame);
    if (sendRet < 0 && sendRet !== AVERROR_EOF) {
      // Encoder might be full, try to receive first
      const packet = await this.receivePacket();
      if (packet) return packet;

      // If still failing, it's an error
      if (sendRet !== AVERROR_EAGAIN) {
        FFmpegError.throwIfError(sendRet, 'Failed to send frame');
      }
    }

    // Try to receive packet
    return await this.receivePacket();
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
   *     await filter.filterFrame(frame);
   *     const filtered = await filter.getFrame();
   *     if (filtered) {
   *       yield filtered;
   *     }
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
   * @see {@link encode} For single frame encoding
   * @see {@link Decoder.frames} For frame source
   */
  async *packets(frames: AsyncIterable<Frame>): AsyncGenerator<Packet> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

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
    let packet;
    while ((packet = await this.flush()) !== null) {
      yield packet;
    }
  }

  /**
   * Flush encoder and get buffered packet.
   *
   * Signals end-of-stream and retrieves remaining packets.
   * Call repeatedly until null to get all buffered packets.
   * Essential for ensuring all frames are encoded.
   *
   * Direct mapping to avcodec_send_frame(NULL).
   *
   * @returns Buffered packet or null if none remaining
   *
   * @throws {Error} If encoder is closed
   *
   * @example
   * ```typescript
   * // Flush remaining packets
   * let packet;
   * while ((packet = await encoder.flush()) !== null) {
   *   console.log('Got buffered packet');
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   *
   * @see {@link flushPackets} For async iteration
   * @see {@link packets} For complete encoding pipeline
   */
  async flush(): Promise<Packet | null> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    // Send flush frame (null)
    await this.codecContext.sendFrame(null);

    // Receive packet
    return await this.receivePacket();
  }

  /**
   * Flush all buffered packets as async generator.
   *
   * Convenient async iteration over remaining packets.
   * Automatically handles repeated flush calls.
   * Useful for end-of-stream processing.
   *
   * @yields Buffered packets
   * @throws {Error} If encoder is closed
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
   * @see {@link flush} For single packet flush
   * @see {@link packets} For complete pipeline
   */
  async *flushPackets(): AsyncGenerator<Packet> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    let packet;
    while ((packet = await this.flush()) !== null) {
      yield packet;
    }
  }

  /**
   * Close encoder and free resources.
   *
   * Releases codec context and internal packet buffer.
   * Safe to call multiple times.
   * Does NOT dispose hardware context - caller is responsible.
   * Automatically called by Symbol.dispose.
   *
   * @example
   * ```typescript
   * const encoder = await Encoder.create('libx264', streamInfo);
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
    if (!this.isOpen) return;

    this.packet.free();
    this.codecContext.freeContext();

    this.isOpen = false;
  }

  /**
   * Get encoder codec.
   *
   * Returns the codec used by this encoder.
   * Useful for checking codec capabilities and properties.
   *
   * @returns Codec instance
   *
   * @example
   * ```typescript
   * const codec = encoder.getCodec();
   * console.log(`Using codec: ${codec.name}`);
   * console.log(`Capabilities: ${codec.capabilities}`);
   * ```
   *
   * @see {@link Codec} For codec properties
   */
  getCodec(): Codec {
    return this.codec;
  }

  /**
   * Get underlying codec context.
   *
   * Returns the internal codec context for advanced operations.
   * Returns null if encoder is closed.
   *
   * @returns Codec context or null
   *
   * @internal
   */
  getCodecContext(): CodecContext | null {
    return this.isOpen ? this.codecContext : null;
  }

  /**
   * Receive packet from encoder.
   *
   * Internal method to get encoded packets from codec.
   * Handles packet cloning and error checking.
   *
   * Direct mapping to avcodec_receive_packet().
   *
   * @returns Cloned packet or null
   *
   * @throws {FFmpegError} If receive fails with error other than AVERROR_EAGAIN or AVERROR_EOF
   */
  private async receivePacket(): Promise<Packet | null> {
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
   * Dispose of encoder.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   using encoder = await Encoder.create('libx264', streamInfo);
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
