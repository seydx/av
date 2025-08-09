import { bindings } from './binding.js';
import { AV_CODEC_CAP_FRAME_THREADS, AV_CODEC_CAP_HARDWARE, AV_CODEC_CAP_SLICE_THREADS } from './constants.js';

import type { CodecChannelLayout } from './codec-parameters.js';
import type { AVCodecCap, AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { NativeCodec, NativeWrapper } from './native-types.js';

/**
 * Profile information for a codec
 */
export interface CodecProfile {
  /** Profile identifier */
  profile: number;
  /** Human-readable profile name */
  name?: string;
}

/**
 * Hardware configuration for a codec
 */
export interface CodecHardwareConfig {
  /** Hardware pixel format */
  pixelFormat: AVPixelFormat;
  /** Hardware configuration methods */
  methods: number;
  /** Hardware device type */
  deviceType: number;
}

/**
 * FFmpeg codec wrapper for encoding and decoding
 *
 * Represents an encoder or decoder that can process audio/video data.
 * Codecs are typically found using the static finder methods and then
 * used to create CodecContext instances.
 *
 * @example
 * ```typescript
 * // Find a decoder by codec ID
 * const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
 * if (decoder) {
 *   const context = new CodecContext(decoder);
 *   // Configure and use context...
 * }
 *
 * // Find an encoder by name
 * const encoder = Codec.findEncoderByName('libx264');
 * ```
 */
export class Codec implements NativeWrapper<NativeCodec> {
  private native: NativeCodec; // Native codec binding object

  // ==================== Constructor ====================

  /**
   * Create a new Codec instance
   * @internal Generally use static finder methods instead
   */
  constructor() {
    this.native = new bindings.Codec();
  }

  // ==================== Static Methods ====================

  /**
   * Find a decoder by codec ID
   * @param id Codec ID (e.g., AV_CODEC_ID_H264)
   * @returns The codec or null if not found
   * @example
   * ```typescript
   * const decoder = Codec.findDecoder(AV_CODEC_ID_H264);
   * ```
   */
  static findDecoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findDecoder(id);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  /**
   * Find a decoder by name
   * @param name Codec name (e.g., 'h264', 'aac')
   * @returns The codec or null if not found
   * @example
   * ```typescript
   * const decoder = Codec.findDecoderByName('h264');
   * ```
   */
  static findDecoderByName(name: string): Codec | null {
    const native = bindings.Codec.findDecoderByName(name);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  /**
   * Find an encoder by codec ID
   * @param id Codec ID (e.g., AV_CODEC_ID_H264)
   * @returns The codec or null if not found
   * @example
   * ```typescript
   * const encoder = Codec.findEncoder(AV_CODEC_ID_H264);
   * ```
   */
  static findEncoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findEncoder(id);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  /**
   * Find an encoder by name
   * @param name Codec name (e.g., 'libx264', 'libopus')
   * @returns The codec or null if not found
   * @example
   * ```typescript
   * const encoder = Codec.findEncoderByName('libx264');
   * ```
   */
  static findEncoderByName(name: string): Codec | null {
    const native = bindings.Codec.findEncoderByName(name);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  /**
   * Get all available codecs
   * @returns Array of all registered codecs
   */
  static getAllCodecs(): Codec[] {
    try {
      const natives = bindings.Codec.getAllCodecs();
      return natives.map((native) => Codec.fromNative(native));
    } catch (error) {
      console.warn('Failed to get all codecs:', error);
      return [];
    }
  }

  /**
   * Create a Codec instance from a native codec object
   * @internal
   */
  static fromNative(nativeCodec: NativeCodec): Codec {
    const codec = new Codec();
    codec.native = nativeCodec;
    return codec;
  }

  // ==================== Getters/Setters ====================

  /**
   * Get the codec short name
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Get the codec long descriptive name
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * Get the codec ID
   */
  get id(): AVCodecID {
    return this.native.id;
  }

  /**
   * Get the media type (audio/video/subtitle)
   */
  get type(): AVMediaType {
    return this.native.type;
  }

  /**
   * Get codec capabilities flags
   */
  get capabilities(): AVCodecCap {
    return this.native.capabilities;
  }

  // ==================== Public Methods ====================

  /**
   * Check if this is a decoder
   * @returns true if the codec can decode
   */
  isDecoder(): boolean {
    return this.native.isDecoder();
  }

  /**
   * Check if this is an encoder
   * @returns true if the codec can encode
   */
  isEncoder(): boolean {
    return this.native.isEncoder();
  }

  /**
   * Get supported pixel formats
   * @returns Array of supported pixel formats
   */
  getPixelFormats(): AVPixelFormat[] {
    return this.native.getPixelFormats();
  }

  /**
   * Get supported sample formats
   * @returns Array of supported sample formats
   */
  getSampleFormats(): AVSampleFormat[] {
    return this.native.getSampleFormats();
  }

  /**
   * Get supported sample rates
   * @returns Array of supported sample rates in Hz
   */
  getSampleRates(): number[] {
    return this.native.getSampleRates();
  }

  /**
   * Get supported channel layouts
   * @returns Array of supported channel layouts
   */
  getChannelLayouts(): CodecChannelLayout[] {
    return this.native.getChannelLayouts();
  }

  /**
   * Get supported profiles
   * @returns Array of codec profiles
   */
  getProfiles(): CodecProfile[] {
    return this.native.getProfiles();
  }

  /**
   * Get hardware configurations for this codec
   * @returns Array of hardware configurations
   */
  getHardwareConfigs(): CodecHardwareConfig[] {
    return this.native.getHardwareConfigs();
  }

  /**
   * Check if codec has a specific capability
   * @param cap Capability flag to check
   * @returns true if the codec has the capability
   */
  hasCapability(cap: AVCodecCap): boolean {
    return (this.capabilities & cap) !== 0;
  }

  /**
   * Check if codec supports hardware acceleration
   * @returns true if hardware acceleration is supported
   */
  supportsHardware(): boolean {
    return this.hasCapability(AV_CODEC_CAP_HARDWARE);
  }

  /**
   * Check if codec supports multithreading
   * @returns true if frame or slice threading is supported
   */
  supportsMultithreading(): boolean {
    return this.hasCapability(AV_CODEC_CAP_FRAME_THREADS) || this.hasCapability(AV_CODEC_CAP_SLICE_THREADS);
  }

  /**
   * Get string representation of the codec
   * @returns The codec name or 'unknown'
   */
  toString(): string {
    return this.name ?? 'unknown';
  }

  // ==================== Internal Methods ====================

  /**
   * Get native codec for internal use
   * @internal
   */
  getNative(): NativeCodec {
    return this.native;
  }
}
