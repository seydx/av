/**
 * Encoder - High-level wrapper for media encoding
 *
 * Simplifies FFmpeg's encoding API with automatic codec selection,
 * parameter configuration, and packet management.
 *
 * Handles codec initialization, frame encoding, and packet output.
 * Supports hardware acceleration and zero-copy transcoding.
 *
 * @module api/encoder
 */

import {
  AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  Packet,
  Rational,
} from '../lib/index.js';
import { Stream } from '../lib/stream.js';
import { parseBitrate } from './utils.js';

import type { AVPixelFormat, Frame } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { EncoderOptions, StreamInfo } from './types.js';

/**
 * High-level encoder for media streams.
 *
 * Handles codec initialization, frame encoding, and packet output.
 * Supports various codecs with flexible configuration options.
 *
 * Manages codec context lifecycle and provides automatic cleanup.
 * Supports hardware acceleration with shared frames context for zero-copy.
 *
 * @example
 * ```typescript
 * // Create H.264 encoder
 * const encoder = await Encoder.create('libx264', {
 *   width: 1920,
 *   height: 1080,
 *   pixelFormat: 'yuv420p',
 *   bitrate: '5M',
 *   gopSize: 60,
 *   options: {
 *     preset: 'fast',
 *     crf: 23
 *   }
 * });
 *
 * // Encode frames
 * const packet = await encoder.encode(frame);
 * if (packet) {
 *   // Write packet to output
 * }
 *
 * // Flush encoder
 * let packet;
 * while ((packet = await encoder.flush()) !== null) {
 *   // Process final packets
 * }
 * encoder.close();
 * ```
 *
 * @example
 * ```typescript
 * // With hardware acceleration
 * const hw = await HardwareContext.auto();
 * const encoder = await Encoder.create('h264_videotoolbox', {
 *   width: 1920,
 *   height: 1080,
 *   pixelFormat: 'nv12',
 *   bitrate: '5M',
 *   hardware: hw
 * });
 * // ... use encoder
 * encoder.close(); // Also disposes hardware
 * hw?.dispose(); // Safe to call again (no-op)
 * ```
 */
export class Encoder implements Disposable {
  private codecContext: CodecContext;
  private packet: Packet;
  private codecName: string;
  private isOpen = true;
  private supportedFormats: AVPixelFormat[] = [];
  private preferredFormat?: AVPixelFormat;
  private hardware?: HardwareContext | null; // Store reference to check for late framesContext
  private isHardwareEncoder = false; // Track if this is a hardware encoder

  /**
   * Private constructor - use Encoder.create() instead.
   *
   * Initializes the encoder with a codec context and allocates a packet buffer.
   *
   * @param codecContext - Initialized codec context
   * @param codecName - Name of the codec
   * @param hardware - Optional hardware context for late framesContext binding
   */
  private constructor(codecContext: CodecContext, codecName: string, hardware?: HardwareContext | null) {
    this.codecContext = codecContext;
    this.codecName = codecName;
    this.hardware = hardware;
    this.packet = new Packet();
    this.packet.alloc();
  }

  /**
   * Create an encoder with specified codec and options.
   *
   * Factory method that handles codec discovery, context setup,
   * and initialization.
   *
   * Uses avcodec_find_encoder_by_name() to locate the codec,
   * configures the context with provided options, and opens it.
   * Handles hardware setup including shared frames context for zero-copy.
   *
   * @param codecName - Name of codec (e.g., 'libx264', 'aac', 'libopus')
   * @param input - Stream or StreamInfo to copy parameters from
   * @param options - Encoder configuration options
   *
   * @returns Promise resolving to configured Encoder
   *
   * @throws {Error} If codec not found or configuration fails
   *
   * @example
   * ```typescript
   * // Video encoder from stream
   * const videoStream = media.video();
   * const videoEncoder = await Encoder.create('libx264', videoStream, {
   *   bitrate: '5M',
   *   gopSize: 60
   * });
   *
   * // Audio encoder from stream
   * const audioStream = media.audio();
   * const audioEncoder = await Encoder.create('aac', audioStream, {
   *   bitrate: '192k'
   * });
   *
   * ```
   */
  static async create(codecName: string, input: Stream | StreamInfo, options: EncoderOptions = {}): Promise<Encoder> {
    const actualCodecName = codecName;

    // Find encoder by name
    const codec = Codec.findEncoderByName(actualCodecName);
    if (!codec) {
      throw new Error(`Encoder ${actualCodecName} not found`);
    }

    // Allocate codec context
    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);

    // Apply parameters based on input type
    if (input instanceof Stream) {
      // It's a Stream - use parametersToContext like in Decoder
      const ret = codecContext.parametersToContext(input.codecpar);
      if (ret < 0) {
        codecContext.freeContext();
        throw new Error(`Failed to copy codec parameters: ${ret}`);
      }

      // Set framerate for video (not copied by parametersToContext)
      if (codec.type === AV_MEDIA_TYPE_VIDEO) {
        // Set pkt_timebase to input timebase so encoder knows how to interpret frame PTS
        codecContext.pktTimebase = input.timeBase;

        // Set timeBase to input timeBase - encoder will use this or choose its own
        codecContext.timeBase = input.timeBase;

        if (input.avgFrameRate && input.avgFrameRate.num > 0 && input.avgFrameRate.den > 0) {
          codecContext.framerate = new Rational(input.avgFrameRate.num, input.avgFrameRate.den);
        } else if (input.rFrameRate && input.rFrameRate.num > 0 && input.rFrameRate.den > 0) {
          codecContext.framerate = new Rational(input.rFrameRate.num, input.rFrameRate.den);
        }
      } else {
        // For audio, set pkt_timebase and use input timeBase
        codecContext.pktTimebase = input.timeBase;
        codecContext.timeBase = input.timeBase;
      }
    } else {
      // It's StreamInfo - apply manually
      if (input.type === 'video' && codec.type === AV_MEDIA_TYPE_VIDEO) {
        const videoInfo = input;
        codecContext.width = videoInfo.width;
        codecContext.height = videoInfo.height;
        // Only set pixelFormat if provided (might be omitted for hardware encoders)
        if (videoInfo.pixelFormat !== undefined) {
          codecContext.pixelFormat = videoInfo.pixelFormat;
        }

        // Set pkt_timebase and timeBase to input timebase
        codecContext.pktTimebase = new Rational(videoInfo.timeBase.num, videoInfo.timeBase.den);
        codecContext.timeBase = new Rational(videoInfo.timeBase.num, videoInfo.timeBase.den);

        if (videoInfo.frameRate) {
          codecContext.framerate = new Rational(videoInfo.frameRate.num, videoInfo.frameRate.den);
        }
        if (videoInfo.sampleAspectRatio) {
          codecContext.sampleAspectRatio = new Rational(videoInfo.sampleAspectRatio.num, videoInfo.sampleAspectRatio.den);
        }
      } else if (input.type === 'audio' && codec.type === AV_MEDIA_TYPE_AUDIO) {
        const audioInfo = input;
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
        throw new Error(`Codec type mismatch: ${input.type} info but ${codec.type === AV_MEDIA_TYPE_VIDEO ? 'video' : 'audio'} codec`);
      }
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
        codecContext.setOpt(key, value.toString());
      }
    }

    // Check if this encoder supports hardware acceleration
    let supportsHardware = false;
    let isHardwareEncoder = false;

    // Check encoder's hardware configurations
    for (let i = 0; ; i++) {
      const config = codec.getHwConfig(i);
      if (!config) break;

      // Check if encoder supports HW_FRAMES_CTX method
      if ((config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX) !== 0) {
        supportsHardware = true;

        // If hardware context provided, check if it matches this encoder
        if (options.hardware && config.deviceType === options.hardware.deviceType) {
          isHardwareEncoder = true;
          break;
        }
      }
    }

    // Validation: Hardware encoder MUST have HardwareContext
    if (supportsHardware && !options.hardware) {
      throw new Error(`Hardware encoder '${actualCodecName}' requires a hardware context. ` + 'Please provide one via options.hardware');
    }

    // Apply hardware acceleration if provided and encoder supports it
    if (options.hardware && isHardwareEncoder) {
      // For hardware encoders, always set the hardware pixel format
      // (overrides what was copied from stream parameters)
      codecContext.pixelFormat = options.hardware.getHardwarePixelFormat();

      // Check if frames context already available (shared from decoder)
      if (options.hardware.framesContext) {
        codecContext.hwFramesCtx = options.hardware.framesContext;
      }
      // Else: Will set hwFramesCtx later in encode() when first frame arrives
      // DO NOT create frames context here - wait for first frame!
    }
    // Note: Software encoder silently ignores hardware context

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      throw new Error(`Failed to open encoder: ${openRet}`);
    }

    const encoder = new Encoder(codecContext, codecName, isHardwareEncoder ? options.hardware : undefined);
    encoder.isHardwareEncoder = isHardwareEncoder;

    // Get supported formats from codec (for validation and helpers)
    if (codec.pixelFormats) {
      encoder.supportedFormats = codec.pixelFormats;
      encoder.preferredFormat = encoder.supportedFormats[0];
    }

    return encoder;
  }

  /**
   * Check if encoder is open.
   */
  get isEncoderOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Encode a frame and return a packet if available.
   *
   * Sends frame to encoder and attempts to receive a packet.
   * May return null if encoder needs more data.
   *
   * Uses avcodec_send_frame() and avcodec_receive_packet() internally.
   * The encoder may buffer frames before producing packets.
   *
   * @param frame - Frame to encode (or null to flush)
   *
   * @returns Promise resolving to Packet or null
   *
   * @throws {Error} If encoder is closed or encode fails
   *
   * @example
   * ```typescript
   * const packet = await encoder.encode(frame);
   * if (packet) {
   *   // Write packet to output
   *   await output.writePacket(packet);
   * }
   * ```
   */
  async encode(frame: Frame | null): Promise<Packet | null> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    // Late binding of hw_frames_ctx ONLY for hardware encoders
    if (this.hardware && this.isHardwareEncoder && !this.codecContext.hwFramesCtx) {
      if (this.hardware.framesContext) {
        // Use shared frames context from decoder
        this.codecContext.hwFramesCtx = this.hardware.framesContext;
      } else if (frame?.width && frame.height) {
        // First frame - create frames context for upload
        this.hardware.ensureFramesContext(frame.width, frame.height);
        this.codecContext.hwFramesCtx = this.hardware.framesContext ?? null;
      }
    }
    // Software encoder completely ignores hardware context

    // NO MANUAL RESCALING! FFmpeg's avcodec_send_frame() does this internally
    // The encoder needs pkt_timebase to be set for proper rescaling

    // Send frame to encoder
    const sendRet = await this.codecContext.sendFrame(frame);
    if (sendRet < 0 && sendRet !== AV_ERROR_EOF) {
      // Encoder might be full, try to receive first
      const packet = await this.receivePacket();
      if (packet) return packet;

      // If still failing, it's an error
      if (sendRet !== AV_ERROR_EAGAIN) {
        throw new Error(`Failed to send frame: ${sendRet}`);
      }
    }

    // Try to receive packet
    return this.receivePacket();
  }

  /**
   * Async iterator that encodes frames and yields packets.
   *
   * Encodes all provided frames and yields resulting packets.
   * Automatically handles encoder flushing at the end.
   * Input frames are automatically freed after encoding.
   *
   * Processes frames in sequence, encoding each and yielding packets.
   * After all frames are processed, flushes the encoder for remaining packets.
   *
   * IMPORTANT: The yielded packets MUST be freed by the caller!
   * Input frames are automatically freed after processing.
   *
   * @param frames - Async iterable of frames to encode (will be freed automatically)
   *
   * @yields Encoded packets (ownership transferred to caller)
   *
   * @example
   * ```typescript
   * // Transcode video
   * for await (const packet of encoder.packets(decoder.frames(media.packets()))) {
   *   await output.writePacket(packet);
   *   packet.free(); // Must free output packet
   * }
   * ```
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
   * Flush encoder and get remaining packets.
   *
   * Sends null frame to trigger flush mode.
   * Call repeatedly until it returns null.
   *
   * Uses avcodec_send_frame(NULL) to signal end of stream.
   * Retrieves buffered packets from the encoder.
   *
   * @returns Promise resolving to Packet or null
   *
   * @throws {Error} If encoder is closed
   *
   * @example
   * ```typescript
   * // Flush all remaining packets
   * let packet;
   * while ((packet = await encoder.flush()) !== null) {
   *   // Write final packets
   *   await output.writePacket(packet);
   * }
   * ```
   */
  async flush(): Promise<Packet | null> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    // Send flush frame (null)
    await this.codecContext.sendFrame(null);

    // Receive packet
    return this.receivePacket();
  }

  /**
   * Flush encoder and yield all remaining packets as a generator.
   *
   * More convenient than calling flush() in a loop.
   * Automatically sends flush signal and yields all buffered packets.
   *
   * @returns Async generator of remaining packets
   *
   * @throws {Error} If encoder is closed
   *
   * @example
   * ```typescript
   * // Process all remaining packets with generator
   * for await (const packet of encoder.flushPackets()) {
   *   await output.writePacket(packet, streamIdx);
   *   using _ = packet; // Auto cleanup
   * }
   * ```
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
   * After closing, the encoder cannot be used again.
   *
   * Frees the packet buffer and codec context.
   * Note: Does NOT dispose the HardwareContext - caller is responsible for that.
   */
  close(): void {
    if (!this.isOpen) return;

    this.packet.free();
    this.codecContext.freeContext();

    // NOTE: We do NOT dispose the hardware context here anymore
    // The caller who created the HardwareContext is responsible for disposing it
    // This allows reusing the same HardwareContext for multiple encoders

    this.isOpen = false;
  }

  /**
   * Get the codec name.
   */
  getCodecName(): string {
    return this.codecName;
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
   * Get the preferred pixel format for this encoder.
   *
   * Returns the first supported format, which is usually the most efficient.
   *
   * @returns Preferred pixel format or null if not available
   *
   * @example
   * ```typescript
   * const format = encoder.getPreferredPixelFormat();
   * if (format) {
   *   console.log(`Encoder prefers format: ${format}`);
   * }
   * ```
   */
  getPreferredPixelFormat(): AVPixelFormat | null {
    return this.preferredFormat ?? null;
  }

  /**
   * Get all supported pixel formats for this encoder.
   *
   * Returns a list of pixel formats that this encoder can accept.
   *
   * @returns Array of supported pixel formats
   *
   * @example
   * ```typescript
   * const formats = encoder.getSupportedPixelFormats();
   * console.log(`Encoder supports: ${formats.join(', ')}`);
   * ```
   */
  getSupportedPixelFormats(): AVPixelFormat[] {
    return this.supportedFormats;
  }

  /**
   * Receive a packet from the encoder.
   *
   * Internal method to receive encoded packets.
   *
   * Uses avcodec_receive_packet() to get encoded packets from the codec.
   * Clones the packet for the user to prevent internal buffer corruption.
   *
   * @returns Packet or null if no packet available
   */
  private async receivePacket(): Promise<Packet | null> {
    // Clear previous packet data
    this.packet.unref();

    const ret = await this.codecContext.receivePacket(this.packet);

    if (ret === 0) {
      // Got a packet, clone it for the user
      return this.packet.clone();
    } else if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
      // Need more data or end of stream
      return null;
    } else {
      // Error
      throw new Error(`Failed to receive packet: ${ret}`);
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
