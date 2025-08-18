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

import { AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX, AV_ERROR_EAGAIN, AV_ERROR_EOF, AV_MEDIA_TYPE_AUDIO, AV_SAMPLE_FMT_FLTP } from '../lib/constants.js';
import { avRescaleQ, Codec, CodecContext, Packet, Rational } from '../lib/index.js';

import type { AVPixelFormat } from '../lib/constants.js';
import type { Frame } from '../lib/index.js';
import type { IRational } from '../lib/types.js';
import type { EncoderOptions } from './types.js';

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
 *   codecOptions: {
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
  private sourceTimeBase?: IRational; // For automatic PTS rescaling from source

  /**
   * Private constructor - use Encoder.create() instead.
   *
   * Initializes the encoder with a codec context and allocates a packet buffer.
   *
   * @param codecContext - Initialized codec context
   * @param codecName - Name of the codec
   */
  private constructor(codecContext: CodecContext, codecName: string) {
    this.codecContext = codecContext;
    this.codecName = codecName;
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
   * @param options - Encoder configuration options
   *
   * @returns Promise resolving to configured Encoder
   *
   * @throws {Error} If codec not found or configuration fails
   *
   * @example
   * ```typescript
   * // Video encoder
   * const videoEncoder = await Encoder.create('libx264', {
   *   width: 1920,
   *   height: 1080,
   *   pixelFormat: 'yuv420p',
   *   bitrate: '5M'
   * });
   *
   * // Audio encoder
   * const audioEncoder = await Encoder.create('aac', {
   *   sampleRate: 48000,
   *   channelLayout: { nbChannels: 2, order: 0, mask: 3n },
   *   bitrate: '192k'
   * });
   * ```
   */
  static async create(codecName: string, options: EncoderOptions = {}): Promise<Encoder> {
    const actualCodecName = codecName;

    // Find encoder by name
    const codec = Codec.findEncoderByName(actualCodecName);
    if (!codec) {
      throw new Error(`Encoder ${actualCodecName} not found`);
    }

    // Allocate codec context
    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);

    // Set default time base (required for most encoders)
    // Will be overridden if specified in options
    codecContext.timeBase = new Rational(1, 25);

    // Apply video options
    if (options.width !== undefined) {
      codecContext.width = options.width;
    }
    if (options.height !== undefined) {
      codecContext.height = options.height;
    }
    // Don't set pixel format yet if we have hardware - it will be set based on hardware requirements
    if (options.pixelFormat !== undefined && !options.hardware) {
      codecContext.pixelFormat = options.pixelFormat;
    }
    if (options.gopSize !== undefined) {
      codecContext.gopSize = options.gopSize;
    }
    if (options.maxBFrames !== undefined) {
      codecContext.maxBFrames = options.maxBFrames;
    }
    if (options.frameRate) {
      codecContext.framerate = new Rational(options.frameRate.num, options.frameRate.den);
    }

    // Apply audio options
    if (options.sampleRate !== undefined) {
      codecContext.sampleRate = options.sampleRate;
    }
    if (options.channelLayout) {
      codecContext.channelLayout = options.channelLayout;
    }
    if (options.sampleFormat !== undefined) {
      codecContext.sampleFormat = options.sampleFormat;
    } else if (codec.type === AV_MEDIA_TYPE_AUDIO) {
      // Set default sample format for audio encoders
      codecContext.sampleFormat = AV_SAMPLE_FMT_FLTP; // Most common for modern codecs
    }
    if (options.frameSize !== undefined) {
      codecContext.frameSize = options.frameSize;
    }

    // Apply common options
    if (options.bitrate !== undefined) {
      const bitrate = typeof options.bitrate === 'string' ? Encoder.parseBitrate(options.bitrate) : BigInt(options.bitrate);
      codecContext.bitRate = bitrate;
    }
    if (options.threads !== undefined) {
      codecContext.threadCount = options.threads;
    }
    if (options.timeBase) {
      codecContext.timeBase = new Rational(options.timeBase.num, options.timeBase.den);
    }

    // Apply codec-specific options via AVOptions
    if (options.codecOptions) {
      for (const [key, value] of Object.entries(options.codecOptions)) {
        codecContext.setOpt(key, value.toString());
      }
    }

    // Apply hardware acceleration if provided
    // Note: Encoder does NOT take ownership of the HardwareContext
    // The caller is responsible for disposing it

    // Check if we should share frames context from decoder for zero-copy
    if (options.sharedDecoder && options.hardware) {
      const decoderCtx = options.sharedDecoder.getCodecContext?.();

      // If decoder has hardware frames context (from initialize), share it
      if (decoderCtx?.hwFramesCtx) {
        // Share the decoder's frames context for zero-copy
        codecContext.hwFramesCtx = decoderCtx.hwFramesCtx;
        codecContext.pixelFormat = options.hardware.getHardwarePixelFormat();

        // Skip normal hardware setup
        options.hardware = undefined;
      }
    }

    // If we're not sharing from decoder, set up hardware normally
    if (options.hardware) {
      // Check if this encoder needs frames context (VideoToolbox, etc.)
      // by looking at its hardware config
      let needsFramesContext = false;
      const codec = Codec.findEncoderByName(actualCodecName);
      if (codec) {
        for (let i = 0; ; i++) {
          const config = codec.getHwConfig(i);
          if (!config) break;

          // Check if this encoder uses HW_FRAMES_CTX method
          if ((config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX) !== 0 && config.deviceType === options.hardware.deviceType) {
            needsFramesContext = true;
            break;
          }
        }
      }

      if (needsFramesContext && options.width && options.height) {
        // Setup frames context for encoders that need it (e.g., VideoToolbox)
        // For hardware encoders, we need to set the pixel format to the hardware format
        const hwPixFmt = options.hardware.getHardwarePixelFormat();
        codecContext.pixelFormat = hwPixFmt;

        // Software format for frames context (what format we'll upload from)
        const swPixFmt = options.pixelFormat;

        options.hardware.setupEncoderFramesContext(codecContext, options.width, options.height, swPixFmt);
      } else {
        // Just set device context for encoders that only need that
        codecContext.hwDeviceCtx = options.hardware.deviceContext;
        // Set pixel format for non-frames-context hardware
        if (options.pixelFormat !== undefined) {
          codecContext.pixelFormat = options.pixelFormat;
        }
      }
    }

    // Open codec
    const openRet = await codecContext.open2(codec, null);
    if (openRet < 0) {
      codecContext.freeContext();
      throw new Error(`Failed to open encoder: ${openRet}`);
    }

    const encoder = new Encoder(codecContext, codecName);

    // Store source timebase for automatic PTS rescaling
    if (options.sourceTimeBase) {
      encoder.sourceTimeBase = options.sourceTimeBase;
    }

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

    // Automatic PTS rescaling if source timebase differs from encoder timebase
    if (frame && this.sourceTimeBase && frame.pts !== undefined && frame.pts !== null) {
      // Rescale PTS from source timebase to encoder timebase
      frame.pts = avRescaleQ(frame.pts, this.sourceTimeBase, this.codecContext.timeBase);
    }

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
   * Async iterator that encodes frames and yields packets.
   *
   * Encodes all provided frames and yields resulting packets.
   * Automatically handles encoder flushing at the end.
   *
   * Processes frames in sequence, encoding each and yielding packets.
   * After all frames are processed, flushes the encoder for remaining packets.
   *
   * @param frames - Async iterable of frames to encode
   *
   * @yields Encoded packets
   *
   * @example
   * ```typescript
   * // Transcode video
   * for await (const packet of encoder.packets(decoder.frames(media.packets()))) {
   *   await output.writePacket(packet);
   *   packet.free();
   * }
   * ```
   */
  async *packets(frames: AsyncIterable<Frame>): AsyncGenerator<Packet> {
    if (!this.isOpen) {
      throw new Error('Encoder is closed');
    }

    // Process frames
    for await (const frame of frames) {
      const packet = await this.encode(frame);
      if (packet) {
        yield packet;
      }
    }

    // Flush encoder after all frames
    let packet;
    while ((packet = await this.flush()) !== null) {
      yield packet;
    }
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
   * Parse bitrate string to bigint.
   *
   * Supports suffixes: K (kilo), M (mega), G (giga).
   *
   * Converts human-readable bitrate strings to numeric values.
   *
   * @param str - Bitrate string (e.g., '5M', '192k')
   *
   * @returns Bitrate as bigint
   *
   * @example
   * ```typescript
   * parseBitrate('5M')   // 5000000n
   * parseBitrate('192k') // 192000n
   * parseBitrate('1.5G') // 1500000000n
   * ```
   */
  private static parseBitrate(str: string): bigint {
    const match = /^(\d+(?:\.\d+)?)\s*([KMG])?$/i.exec(str);
    if (!match) {
      throw new Error(`Invalid bitrate: ${str}`);
    }

    let value = parseFloat(match[1]);
    const unit = match[2]?.toUpperCase();

    switch (unit) {
      case 'K':
        value *= 1000;
        break;
      case 'M':
        value *= 1000000;
        break;
      case 'G':
        value *= 1000000000;
        break;
    }

    return BigInt(Math.floor(value));
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
