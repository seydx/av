import {
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX,
  AV_CODEC_ID_AV1,
  AV_CODEC_ID_H263,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_HEVC,
  AV_CODEC_ID_MJPEG,
  AV_CODEC_ID_MPEG2VIDEO,
  AV_CODEC_ID_MPEG4,
  AV_CODEC_ID_PRORES,
  AV_CODEC_ID_VP8,
  AV_CODEC_ID_VP9,
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_D3D12VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_MEDIACODEC,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_QSV,
  AV_HWDEVICE_TYPE_RKMPP,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_VDPAU,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_HWDEVICE_TYPE_VULKAN,
  AV_PIX_FMT_CUDA,
  AV_PIX_FMT_D3D11,
  AV_PIX_FMT_D3D12,
  AV_PIX_FMT_DRM_PRIME,
  AV_PIX_FMT_DXVA2_VLD,
  AV_PIX_FMT_MEDIACODEC,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_OPENCL,
  AV_PIX_FMT_QSV,
  AV_PIX_FMT_VAAPI,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AV_PIX_FMT_VULKAN,
} from '../constants/constants.js';
import { Codec, CodecContext, Dictionary, FFmpegError, HardwareDeviceContext, Rational } from '../lib/index.js';
import { HardwareFilterPresets } from './filter-presets.js';

import type { AVCodecID, AVHWDeviceType, AVPixelFormat, FFEncoderCodec } from '../constants/index.js';
import type { BaseCodecName, HardwareOptions } from './types.js';

/**
 * High-level hardware acceleration management.
 *
 * Provides automatic detection and configuration of hardware acceleration for media processing.
 * Manages device contexts for GPU-accelerated encoding and decoding operations.
 * Supports various hardware types including VideoToolbox, CUDA, VAAPI, D3D11VA, and more.
 * Essential for high-performance video processing with reduced CPU usage.
 *
 * @example
 * ```typescript
 * import { HardwareContext } from 'node-av/api';
 * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
 *
 * // Auto-detect best available hardware
 * const hw = HardwareContext.auto();
 * if (hw) {
 *   console.log(`Using hardware: ${hw.deviceTypeName}`);
 *   const decoder = await Decoder.create(stream, { hardware: hw });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use specific hardware type
 * const cuda = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
 * const encoder = await Encoder.create('h264_nvenc', streamInfo, {
 *   hardware: cuda
 * });
 * cuda.dispose();
 * ```
 *
 * @see {@link Decoder} For hardware-accelerated decoding
 * @see {@link Encoder} For hardware-accelerated encoding
 * @see {@link HardwareFilterPresets} For hardware filter operations
 */
export class HardwareContext implements Disposable {
  /**
   * Hardware-specific filter presets for this device.
   * Provides convenient filter builders for hardware-accelerated operations.
   */
  public readonly filterPresets: HardwareFilterPresets;

  private _deviceContext: HardwareDeviceContext;
  private _deviceType: AVHWDeviceType;
  private _deviceTypeName: string;
  private _devicePixelFormat: AVPixelFormat;
  private _isDisposed = false;

  /**
   * @param deviceContext - Initialized hardware device context
   * @param deviceType - Hardware device type enum
   * @param deviceTypeName - Human-readable device type name
   * @internal
   */
  private constructor(deviceContext: HardwareDeviceContext, deviceType: AVHWDeviceType, deviceTypeName: string) {
    this._deviceContext = deviceContext;
    this._deviceType = deviceType;
    this._deviceTypeName = deviceTypeName;
    this._devicePixelFormat = this.getHardwareDecoderPixelFormat();
    this.filterPresets = new HardwareFilterPresets(deviceType, deviceTypeName);
  }

  /**
   * Auto-detect and create the best available hardware context.
   *
   * Tries hardware types in order of preference based on platform.
   * Returns null if no hardware acceleration is available.
   * Platform-specific preference order ensures optimal performance.
   *
   * @param options - Optional hardware configuration
   * @returns Hardware context or null if unavailable
   *
   * @example
   * ```typescript
   * const hw = HardwareContext.auto();
   * if (hw) {
   *   console.log(`Auto-detected: ${hw.deviceTypeName}`);
   *   // Use for decoder/encoder
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With specific device
   * const hw = HardwareContext.auto({
   *   deviceName: '/dev/dri/renderD128'
   * });
   * ```
   *
   * @see {@link create} For specific hardware type
   * @see {@link listAvailable} To check available types
   */
  static auto(options: HardwareOptions = {}): HardwareContext | null {
    // Platform-specific preference order
    const preferenceOrder = this.getPreferenceOrder();

    for (const deviceType of preferenceOrder) {
      try {
        return this.createFromType(deviceType, options.device, options.options);
      } catch {
        // Try next device type
        continue;
      }
    }

    return null;
  }

  /**
   * Create a hardware context for a specific device type.
   *
   * Creates and initializes a hardware device context.
   * Throws if the device type is not supported or initialization fails.
   *
   * Direct mapping to av_hwdevice_ctx_create().
   *
   * @param deviceType - Hardware device type from AVHWDeviceType
   * @param device - Optional device specifier (e.g., GPU index, device path)
   * @param options - Optional device initialization options
   * @returns Initialized hardware context
   *
   * @throws {Error} If device type unsupported or initialization fails
   *
   * @example
   * ```typescript
   * import { AV_HWDEVICE_TYPE_CUDA } from 'node-av/constants';
   *
   * // CUDA with specific GPU
   * const cuda = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA, '0');
   * ```
   *
   * @example
   * ```typescript
   * import { AV_HWDEVICE_TYPE_VAAPI } from 'node-av/constants';
   *
   * // VAAPI with render device
   * const vaapi = HardwareContext.create(
   *   AV_HWDEVICE_TYPE_VAAPI,
   *   '/dev/dri/renderD128'
   * );
   * ```
   *
   * @see {@link auto} For automatic detection
   * @see {@link HardwareDeviceContext} For low-level API
   */
  static create(deviceType: AVHWDeviceType, device?: string, options?: Record<string, string>): HardwareContext {
    if (deviceType === AV_HWDEVICE_TYPE_NONE) {
      throw new Error('Cannot create hardware context for unknown hardware device type');
    }

    let hw: HardwareContext;

    try {
      hw = this.createFromType(deviceType, device, options);
    } catch (err) {
      throw new Error(`Failed to create hardware context for ${HardwareDeviceContext.getTypeName(deviceType) ?? 'unknown'}: ${(err as Error).message}`);
    }

    return hw;
  }

  /**
   * List all available hardware device types.
   *
   * Enumerates all hardware types supported by the FFmpeg build.
   * Useful for checking hardware capabilities at runtime.
   *
   * Direct mapping to av_hwdevice_iterate_types().
   *
   * @returns Array of available device type names
   *
   * @example
   * ```typescript
   * const available = HardwareContext.listAvailable();
   * console.log('Available hardware:', available.join(', '));
   * // Output: "cuda, vaapi, videotoolbox"
   * ```
   *
   * @see {@link auto} For automatic selection
   */
  static listAvailable(): string[] {
    const types = HardwareDeviceContext.iterateTypes();
    const available: string[] = [];

    for (const type of types) {
      const name = HardwareDeviceContext.getTypeName(type);
      if (name) {
        available.push(name);
      }
    }

    return available;
  }

  /**
   * Get the hardware device context.
   *
   * Used internally by encoders and decoders for hardware acceleration.
   * Can be assigned to CodecContext.hwDeviceCtx.
   *
   * @example
   * ```typescript
   * codecContext.hwDeviceCtx = hw.deviceContext;
   * ```
   */
  get deviceContext(): HardwareDeviceContext {
    return this._deviceContext;
  }

  /**
   * Get the device type enum value.
   *
   * @example
   * ```typescript
   * if (hw.deviceType === AV_HWDEVICE_TYPE_CUDA) {
   *   console.log('Using NVIDIA GPU');
   * }
   * ```
   */
  get deviceType(): AVHWDeviceType {
    return this._deviceType;
  }

  /**
   * Get the hardware device type name.
   *
   * Human-readable device type string.
   *
   * @example
   * ```typescript
   * console.log(`Hardware type: ${hw.deviceTypeName}`);
   * // Output: "cuda" or "videotoolbox" etc.
   * ```
   */
  get deviceTypeName(): string {
    return this._deviceTypeName;
  }

  /**
   * Get the device pixel format.
   *
   * Hardware-specific pixel format for frame allocation.
   *
   * @example
   * ```typescript
   * frame.format = hw.devicePixelFormat;
   * ```
   */
  get devicePixelFormat(): AVPixelFormat {
    return this._devicePixelFormat;
  }

  /**
   * Check if this hardware context has been disposed.
   *
   * @example
   * ```typescript
   * if (!hw.isDisposed) {
   *   hw.dispose();
   * }
   * ```
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Check if this hardware type supports a specific codec.
   *
   * Queries FFmpeg's codec configurations to verify hardware support.
   * Checks both decoder and encoder support based on parameters.
   *
   * Direct mapping to avcodec_get_hw_config().
   *
   * @param codecId - Codec ID from AVCodecID enum
   * @param isEncoder - Check for encoder support (default: decoder)
   * @returns true if codec is supported
   *
   * @example
   * ```typescript
   * import { AV_CODEC_ID_H264 } from 'node-av/constants';
   *
   * if (hw.supportsCodec(AV_CODEC_ID_H264, true)) {
   *   // Can use hardware H.264 encoder
   * }
   * ```
   *
   * @see {@link findSupportedCodecs} For all supported codecs
   */
  supportsCodec(codecId: AVCodecID, isEncoder = false): boolean {
    // Try to find the codec
    const codec = isEncoder ? Codec.findEncoder(codecId) : Codec.findDecoder(codecId);
    if (!codec) {
      return false;
    }

    if (isEncoder) {
      return codec.isHardwareAcceleratedEncoder(this._deviceType);
    } else {
      return codec.isHardwareAcceleratedDecoder(this._deviceType);
    }
  }

  /**
   * Check if this hardware supports a specific pixel format for a codec.
   *
   * Verifies pixel format compatibility with hardware codec.
   * Important for ensuring format compatibility in pipelines.
   *
   * @param codecId - Codec ID from AVCodecID enum
   * @param pixelFormat - Pixel format to check
   * @param isEncoder - Check for encoder (default: decoder)
   * @returns true if pixel format is supported
   *
   * @example
   * ```typescript
   * import { AV_CODEC_ID_H264, AV_PIX_FMT_NV12 } from 'node-av/constants';
   *
   * if (hw.supportsPixelFormat(AV_CODEC_ID_H264, AV_PIX_FMT_NV12)) {
   *   // Can use NV12 format with H.264
   * }
   * ```
   *
   * @see {@link supportsCodec} For basic codec support
   */
  supportsPixelFormat(codecId: AVCodecID, pixelFormat: AVPixelFormat, isEncoder = false): boolean {
    const codec = isEncoder ? Codec.findEncoder(codecId) : Codec.findDecoder(codecId);
    if (!codec) {
      return false;
    }

    const pixelFormats = codec.pixelFormats ?? [];
    if (pixelFormats.length === 0) {
      return false;
    }

    return pixelFormats.some((fmt) => fmt === pixelFormat);
  }

  /**
   * Get the appropriate encoder codec for a given base codec name.
   *
   * Maps generic codec names to hardware-specific encoder implementations.
   * Returns null if no hardware encoder is available for the codec.
   * Automatically tests encoder viability before returning.
   *
   * @param codec - Generic codec name (e.g., 'h264', 'hevc', 'av1') or AVCodecID
   * @returns Hardware encoder codec or null if unsupported
   *
   * @example
   * ```typescript
   * const encoderCodec = await hw.getEncoderCodec('h264');
   * if (encoderCodec) {
   *   console.log(`Using encoder: ${encoderCodec.name}`);
   *   // e.g., "h264_nvenc" for CUDA
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Use with Encoder.create
   * const codec = await hw.getEncoderCodec('hevc');
   * if (codec) {
   *   const encoder = await Encoder.create(codec, streamInfo, {
   *     hardware: hw
   *   });
   * }
   * ```
   *
   * @see {@link Encoder.create} For using the codec
   */
  async getEncoderCodec(codec: BaseCodecName | AVCodecID): Promise<Codec | null> {
    // Build the encoder name
    let codecBaseName = '';
    let encoderSuffix = '';

    if (typeof codec === 'number') {
      codecBaseName = this.getBaseCodecName(codec) ?? '';
    } else {
      codecBaseName = codec;
    }

    if (!codecBaseName) {
      return null;
    }

    // We might only have hardware decode capabilities (d3d11va, d3d12va etc)
    // So we need to check for other hardware encoders
    const getAlternativeEncoder = (): string | null => {
      const nvencCodecName = `${codecBaseName}_nvenc` as FFEncoderCodec;
      const qsvCodecName = `${codecBaseName}_qsv` as FFEncoderCodec;
      const amfCodecName = `${codecBaseName}_amf` as FFEncoderCodec;
      const codecNames = [nvencCodecName, qsvCodecName, amfCodecName];

      let suffix = '';
      for (const name of codecNames) {
        const encoderCodec = Codec.findEncoderByName(name);
        if (!encoderCodec) {
          continue;
        }

        suffix = name.split('_')[1]; // Get suffix after underscore
      }

      if (!suffix) {
        return null;
      }

      return suffix;
    };

    switch (this._deviceType) {
      case AV_HWDEVICE_TYPE_CUDA:
        // CUDA uses NVENC for encoding
        encoderSuffix = 'nvenc';
        break;

      case AV_HWDEVICE_TYPE_D3D11VA:
      case AV_HWDEVICE_TYPE_DXVA2:
        encoderSuffix = getAlternativeEncoder() ?? '';
        break;

      case AV_HWDEVICE_TYPE_D3D12VA:
        // D3D12VA currently only supports HEVC encoding
        if (codecBaseName === 'hevc') {
          encoderSuffix = 'd3d12va';
        } else {
          encoderSuffix = getAlternativeEncoder() ?? '';
        }
        break;

      case AV_HWDEVICE_TYPE_OPENCL:
      case AV_HWDEVICE_TYPE_VDPAU:
      case AV_HWDEVICE_TYPE_DRM:
        encoderSuffix = getAlternativeEncoder() ?? '';
        break;

      default:
        // Use the device type name as suffix
        encoderSuffix = this._deviceTypeName;
    }

    if (!encoderSuffix) {
      return null;
    }

    // Construct the encoder name
    const encoderName = `${codecBaseName}_${encoderSuffix}` as FFEncoderCodec;
    const encoderCodec = Codec.findEncoderByName(encoderName);

    if (!encoderCodec || !(await this.testHardwareEncoder(encoderName))) {
      return null;
    }

    return encoderCodec;
  }

  /**
   * Find all codecs that support this hardware device.
   *
   * Iterates through all available codecs and checks hardware compatibility.
   * Useful for discovering available hardware acceleration options.
   *
   * Direct mapping to av_codec_iterate() with hardware config checks.
   *
   * @param isEncoder - Find encoders (true) or decoders (false)
   * @returns Array of codec names that support this hardware
   *
   * @example
   * ```typescript
   * const decoders = hw.findSupportedCodecs(false);
   * console.log('Hardware decoders:', decoders);
   * // ["h264_cuvid", "hevc_cuvid", ...]
   *
   * const encoders = hw.findSupportedCodecs(true);
   * console.log('Hardware encoders:', encoders);
   * // ["h264_nvenc", "hevc_nvenc", ...]
   * ```
   *
   * @see {@link supportsCodec} For checking specific codec
   */
  findSupportedCodecs(isEncoder = false): string[] {
    const supportedCodecs: string[] = [];
    const codecs = Codec.getCodecList();

    for (const codec of codecs) {
      // Skip if wrong type (encoder vs decoder)
      if (isEncoder && !codec.isEncoder()) continue;
      if (!isEncoder && !codec.isDecoder()) continue;

      // Check if this codec supports our hardware device type
      for (let i = 0; ; i++) {
        const config = codec.getHwConfig(i);
        if (!config) break;

        // Accept both HW_DEVICE_CTX and HW_FRAMES_CTX methods
        const supportsDeviceCtx = (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) !== 0;
        const supportsFramesCtx = (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX) !== 0;

        if ((supportsDeviceCtx || supportsFramesCtx) && config.deviceType === this._deviceType) {
          if (codec.name) {
            supportedCodecs.push(codec.name);
          }
          break; // Found support, move to next codec
        }
      }
    }

    return supportedCodecs;
  }

  /**
   * Clean up and free hardware resources.
   *
   * Releases the hardware device context.
   * Safe to call multiple times.
   * Automatically called by Symbol.dispose.
   *
   * @example
   * ```typescript
   * const hw = HardwareContext.auto();
   * try {
   *   // Use hardware
   * } finally {
   *   hw?.dispose();
   * }
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._deviceContext.free();
    this._isDisposed = true;
  }

  /**
   * Map AVCodecID to base codec name for hardware encoder lookup.
   *
   * Converts codec IDs to generic codec names used for encoder naming.
   * Used internally to find hardware-specific encoder implementations.
   *
   * @param codecId - AVCodecID enum value
   * @returns Base codec name or null if unsupported
   *
   * @internal
   */
  private getBaseCodecName(codecId: AVCodecID): BaseCodecName | null {
    switch (codecId) {
      case AV_CODEC_ID_AV1:
        return 'av1';
      case AV_CODEC_ID_H264:
        return 'h264';
      case AV_CODEC_ID_HEVC:
        return 'hevc';
      case AV_CODEC_ID_H263:
        return 'h263';
      case AV_CODEC_ID_MPEG2VIDEO:
        return 'mpeg2';
      case AV_CODEC_ID_MPEG4:
        return 'mpeg4';
      case AV_CODEC_ID_VP8:
        return 'vp8';
      case AV_CODEC_ID_VP9:
        return 'vp9';
      case AV_CODEC_ID_MJPEG:
        return 'mjpeg';
      case AV_CODEC_ID_PRORES:
        return 'prores';
      default:
        return null;
    }
  }

  /**
   * Get the hardware decoder pixel format for this device type.
   *
   * Maps device types to their corresponding pixel formats.
   * Used internally for frame format configuration.
   *
   * @returns Hardware-specific pixel format
   *
   * @internal
   */
  private getHardwareDecoderPixelFormat(): AVPixelFormat {
    switch (this._deviceType) {
      case AV_HWDEVICE_TYPE_VIDEOTOOLBOX:
        return AV_PIX_FMT_VIDEOTOOLBOX;
      case AV_HWDEVICE_TYPE_VAAPI:
        return AV_PIX_FMT_VAAPI;
      case AV_HWDEVICE_TYPE_CUDA:
        return AV_PIX_FMT_CUDA;
      case AV_HWDEVICE_TYPE_QSV:
        return AV_PIX_FMT_QSV;
      case AV_HWDEVICE_TYPE_D3D11VA:
        return AV_PIX_FMT_D3D11;
      case AV_HWDEVICE_TYPE_DXVA2:
        return AV_PIX_FMT_DXVA2_VLD;
      case AV_HWDEVICE_TYPE_DRM:
        return AV_PIX_FMT_DRM_PRIME;
      case AV_HWDEVICE_TYPE_OPENCL:
        return AV_PIX_FMT_OPENCL;
      case AV_HWDEVICE_TYPE_MEDIACODEC:
        return AV_PIX_FMT_MEDIACODEC;
      case AV_HWDEVICE_TYPE_VULKAN:
        return AV_PIX_FMT_VULKAN;
      case AV_HWDEVICE_TYPE_D3D12VA:
        return AV_PIX_FMT_D3D12;
      case AV_HWDEVICE_TYPE_RKMPP:
        return AV_PIX_FMT_DRM_PRIME; // RKMPP uses DRM Prime buffers
      default:
        return AV_PIX_FMT_NV12; // Common hardware format
    }
  }

  /**
   * Test if a hardware encoder can be created.
   *
   * Attempts to initialize the encoder to verify support.
   * Used internally by getEncoderCodec.
   *
   * @param encoderCodec - Encoder to test
   *
   * @returns true if encoder can be initialized
   *
   * @internal
   */
  private async testHardwareEncoder(encoderCodec: FFEncoderCodec | AVCodecID | Codec): Promise<boolean> {
    let codec: Codec | null = null;

    if (encoderCodec instanceof Codec) {
      codec = encoderCodec;
    } else if (typeof encoderCodec === 'string') {
      codec = Codec.findEncoderByName(encoderCodec);
    } else {
      codec = Codec.findEncoder(encoderCodec);
    }

    if (!codec?.pixelFormats || !codec.isHardwareAcceleratedEncoder()) {
      return false;
    }

    const codecContext = new CodecContext();
    codecContext.allocContext3(codec);
    codecContext.hwDeviceCtx = this._deviceContext;
    codecContext.timeBase = new Rational(1, 30);
    codecContext.pixelFormat = codec.pixelFormats[0];
    codecContext.width = 100;
    codecContext.height = 100;
    const ret = await codecContext.open2(codec);
    codecContext.freeContext();
    return ret >= 0;
  }

  /**
   * Create hardware context from device type.
   *
   * Internal factory method using av_hwdevice_ctx_create().
   *
   * @param deviceType - AVHWDeviceType enum value
   * @param device - Optional device specifier
   * @param options - Optional device options
   *
   * @returns Hardware context or null if creation fails
   *
   * @internal
   */
  private static createFromType(deviceType: AVHWDeviceType, device?: string, options?: Record<string, string>): HardwareContext {
    const deviceCtx = new HardwareDeviceContext();

    // Convert options to Dictionary if provided
    let optionsDict = null;
    if (options && Object.keys(options).length > 0) {
      optionsDict = Dictionary.fromObject(options);
    }

    const ret = deviceCtx.create(deviceType, device, optionsDict);

    // Clean up dictionary if used
    if (optionsDict) {
      optionsDict.free();
    }

    const deviceTypeName = HardwareDeviceContext.getTypeName(deviceType);

    if (ret < 0 || !deviceTypeName) {
      deviceCtx.free();
      FFmpegError.throwIfError(ret);
      throw new Error('Unknown error creating hardware device context');
    }

    return new HardwareContext(deviceCtx, deviceType, deviceTypeName);
  }

  /**
   * Get platform-specific preference order for hardware types.
   *
   * Returns available hardware types sorted by platform preference.
   * Ensures optimal hardware selection for each platform.
   *
   * @returns Array of AVHWDeviceType values in preference order
   *
   * @internal
   */
  private static getPreferenceOrder(): AVHWDeviceType[] {
    // Get all available hardware types on this system
    const available = HardwareDeviceContext.iterateTypes();
    if (available.length === 0) {
      return [];
    }

    const platform = process.platform;
    let preferenceOrder: AVHWDeviceType[];

    if (platform === 'darwin') {
      // macOS: VideoToolbox is preferred
      preferenceOrder = [AV_HWDEVICE_TYPE_VIDEOTOOLBOX];
    } else if (platform === 'win32') {
      // Windows: Match FFmpeg's hw_configs order
      // DXVA2 → D3D11VA → D3D12VA → NVDEC (CUDA)
      preferenceOrder = [
        AV_HWDEVICE_TYPE_DXVA2,
        AV_HWDEVICE_TYPE_D3D11VA,
        AV_HWDEVICE_TYPE_D3D12VA,
        AV_HWDEVICE_TYPE_CUDA,
        AV_HWDEVICE_TYPE_QSV,
        AV_HWDEVICE_TYPE_VULKAN,
        AV_HWDEVICE_TYPE_OPENCL,
      ];
    } else {
      // Linux: Match FFmpeg's hw_configs order
      // NVDEC (CUDA) → VAAPI → VDPAU → Vulkan
      // RKMPP is platform-specific for ARM/Rockchip
      const isARM = process.arch === 'arm64' || process.arch === 'arm';

      if (isARM) {
        // ARM platforms: Prioritize RKMPP for Rockchip SoCs
        preferenceOrder = [AV_HWDEVICE_TYPE_RKMPP, AV_HWDEVICE_TYPE_VAAPI, AV_HWDEVICE_TYPE_VULKAN, AV_HWDEVICE_TYPE_DRM, AV_HWDEVICE_TYPE_OPENCL];
      } else {
        // x86_64 Linux: CUDA → VAAPI → VDPAU → Vulkan
        preferenceOrder = [AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI, AV_HWDEVICE_TYPE_VDPAU, AV_HWDEVICE_TYPE_VULKAN, AV_HWDEVICE_TYPE_DRM, AV_HWDEVICE_TYPE_OPENCL];
      }
    }

    // Filter preference order to only include available types
    const availableSet = new Set(available);
    const sortedAvailable = preferenceOrder.filter((type) => availableSet.has(type));

    // Add any available types not in our preference list at the end
    for (const type of available) {
      if (!preferenceOrder.includes(type)) {
        sortedAvailable.push(type);
      }
    }

    return sortedAvailable;
  }

  /**
   * Dispose of hardware context.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling dispose().
   *
   * @example
   * ```typescript
   * {
   *   using hw = HardwareContext.auto();
   *   // Use hardware context...
   * } // Automatically disposed
   * ```
   *
   * @see {@link dispose} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.dispose();
  }
}
