/**
 * HardwareContext - High-level Hardware Acceleration API
 *
 * Provides simplified access to hardware acceleration features.
 * Automatically detects and configures hardware devices for encoding/decoding.
 *
 * Wraps the low-level HardwareDeviceContext and HardwareFramesContext.
 * Manages lifecycle of hardware resources with automatic cleanup.
 *
 * @module api/hardware
 */

import {
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX,
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_D3D12VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_MEDIACODEC,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_QSV,
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
  Codec,
  Dictionary,
  FFmpegError,
  HardwareDeviceContext,
  HardwareFramesContext,
} from '../lib/index.js';

import type { AVCodecID, AVHWDeviceType, AVPixelFormat } from '../lib/index.js';
import type { HardwareOptions } from './types.js';

/**
 * HardwareContext - Simplified hardware acceleration management.
 *
 * Provides automatic detection and configuration of hardware acceleration.
 * Manages device contexts and frame contexts for hardware encoding/decoding.
 *
 * Supports various hardware types including VideoToolbox (macOS), CUDA,
 * VAAPI (Linux), D3D11VA/D3D12VA (Windows), and more.
 *
 * @example
 * ```typescript
 * import { HardwareContext } from '@seydx/av/api';
 *
 * // Auto-detect best available hardware
 * const hw = await HardwareContext.auto();
 * if (hw) {
 *   console.log(`Using hardware: ${hw.deviceType}`);
 *   decoder.hwDeviceCtx = hw.deviceContext;
 * }
 *
 * // Use specific hardware
 * const cuda = await HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
 * encoder.hwDeviceCtx = cuda.deviceContext;
 *
 * // Clean up when done
 * hw?.dispose();
 * cuda.dispose();
 * ```
 */
export class HardwareContext implements Disposable {
  private _deviceContext: HardwareDeviceContext;
  private _framesContext?: HardwareFramesContext;
  private _deviceType: AVHWDeviceType;
  private _deviceName?: string;
  private _devicePixelFormat: AVPixelFormat;
  private _isDisposed = false;
  private waitingComponents = new Set<{
    resolve: (ctx: HardwareFramesContext) => void;
    reject: (error: Error) => void;
  }>();

  /**
   * Create a new HardwareContext instance.
   *
   * Private constructor - use HardwareContext.create() or HardwareContext.auto() to create instances.
   *
   * Stores the device context and type for later use.
   *
   * @param deviceContext - Initialized hardware device context
   * @param deviceType - Hardware device type
   * @param deviceName - Optional device name/identifier
   */
  private constructor(deviceContext: HardwareDeviceContext, deviceType: AVHWDeviceType, deviceName?: string) {
    this._deviceContext = deviceContext;
    this._deviceType = deviceType;
    this._deviceName = deviceName;
    this._devicePixelFormat = this.getHardwarePixelFormat();
  }

  /**
   * Auto-detect and create the best available hardware context.
   *
   * Tries hardware types in order of preference based on platform.
   * Returns null if no hardware acceleration is available.
   *
   * Platform-specific preferences:
   * - macOS: VideoToolbox
   * - Windows: D3D12VA, D3D11VA, DXVA2, QSV, CUDA
   * - Linux: VAAPI, VDPAU, CUDA, Vulkan, DRM
   *
   * @param options - Optional hardware configuration
   *
   * @returns Promise resolving to HardwareContext or null
   *
   * @example
   * ```typescript
   * const hw = await HardwareContext.auto();
   * if (hw) {
   *   console.log(`Auto-detected: ${hw.deviceTypeName}`);
   * }
   * ```
   */
  static async auto(options: HardwareOptions = {}): Promise<HardwareContext | null> {
    // Platform-specific preference order
    const preferenceOrder = this.getPreferenceOrder();

    for (const deviceType of preferenceOrder) {
      try {
        const hw = await this.createFromType(deviceType, options.deviceName, options.options);
        if (hw) {
          return hw;
        }
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
   * Creates and initializes a hardware device context using FFmpeg's
   * av_hwdevice_ctx_create() internally.
   *
   * @param device - Device type name (e.g., AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI, AV_HWDEVICE_TYPE_VIDEOTOOLBOX)
   * @param deviceName - Optional device name/index
   * @param options - Optional device initialization options
   *
   * @returns Promise resolving to HardwareContext
   *
   * @throws {Error} If device type is not supported or initialization fails
   *
   * @example
   * ```typescript
   * // Create CUDA context
   * const cuda = await HardwareContext.create(AV_HWDEVICE_TYPE_CUDA, '0');
   *
   * // Create VAAPI context
   * const vaapi = await HardwareContext.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
   * ```
   */
  static async create(device: AVHWDeviceType, deviceName?: string, options?: Record<string, string>): Promise<HardwareContext> {
    if (device === AV_HWDEVICE_TYPE_NONE) {
      throw new Error(`Unknown hardware device type: ${device}`);
    }

    const hw = await this.createFromType(device, deviceName, options);
    if (!hw) {
      throw new Error(`Failed to create hardware context for ${device}`);
    }

    return hw;
  }

  /**
   * List all available hardware device types.
   *
   * Uses av_hwdevice_iterate_types() internally to enumerate
   * all hardware types supported by the FFmpeg build.
   *
   * @returns Array of available device type names
   *
   * @example
   * ```typescript
   * const available = HardwareContext.listAvailable();
   * console.log('Available hardware:', available.join(', '));
   * ```
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
   * This can be assigned to CodecContext.hwDeviceCtx for hardware acceleration.
   *
   * @returns Hardware device context
   */
  get deviceContext(): HardwareDeviceContext {
    return this._deviceContext;
  }

  /**
   * Get the hardware frames context.
   *
   * Created on-demand when needed for frame allocation.
   *
   * @returns Hardware frames context or undefined
   */
  get framesContext(): HardwareFramesContext | undefined {
    return this._framesContext;
  }

  /**
   * Set the hardware frames context.
   *
   * First component to set it "wins" - subsequent sets are ignored.
   * This is typically called by the decoder after decoding the first frame,
   * allowing other components (encoder, filters) to share the same frames context.
   *
   * @param framesContext - The hardware frames context to set
   */
  set framesContext(framesContext: HardwareFramesContext | undefined) {
    // Only set if we don't have one yet (first wins)
    if (framesContext && !this._framesContext) {
      this._framesContext = framesContext;

      // Notify all waiting components
      for (const waiter of this.waitingComponents) {
        waiter.resolve(this._framesContext);
      }
      this.waitingComponents.clear();
    }
  }

  /**
   * Get the device type enum value.
   *
   * @returns AVHWDeviceType enum value
   */
  get deviceType(): AVHWDeviceType {
    return this._deviceType;
  }

  /**
   * Get the hardware device type name.
   *
   * Uses FFmpeg's native av_hwdevice_get_type_name() function.
   *
   * @returns Device type name as string (e.g., 'cuda', 'videotoolbox')
   */
  get deviceTypeName(): string {
    return HardwareDeviceContext.getTypeName(this._deviceType) ?? 'unknown';
  }

  /**
   * Get the device name/identifier.
   *
   * @returns Device name or undefined
   */
  get deviceName(): string | undefined {
    return this._deviceName;
  }

  /**
   * Get the device pixel format.
   *
   * @returns Device pixel format
   */
  get devicePixelFormat(): AVPixelFormat {
    return this._devicePixelFormat;
  }

  /**
   * Check if this hardware context has been disposed.
   *
   * @returns True if disposed
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Create or ensure a frames context exists for this hardware device.
   *
   * If a frames context already exists with different dimensions, throws an error.
   * This is used for raw/generated frames that need hardware processing.
   *
   * @param width - Frame width
   * @param height - Frame height
   * @param swFormat - Software pixel format (default: AV_PIX_FMT_NV12)
   * @param initialPoolSize - Initial frame pool size (default: 20)
   *
   * @returns HardwareFramesContext - Either existing or newly created
   *
   * @throws {Error} If frames context exists with incompatible dimensions
   *
   * @example
   * ```typescript
   * // For raw frames
   * hw.ensureFramesContext(1920, 1080, AV_PIX_FMT_YUV420P);
   * ```
   */
  ensureFramesContext(width: number, height: number, swFormat: AVPixelFormat = AV_PIX_FMT_NV12, initialPoolSize = 20): HardwareFramesContext {
    if (this._framesContext) {
      // Validate compatibility
      if (this._framesContext.width !== width || this._framesContext.height !== height) {
        // prettier-ignore
        throw new Error(
          `Incompatible frames context: existing ${this._framesContext.width}x${this._framesContext.height} ` +
          `vs requested ${width}x${height}. Use separate HardwareContext instances for different sizes.`,
        );
      }
      return this._framesContext;
    }

    // Create new frames context on our device
    const frames = new HardwareFramesContext();
    frames.alloc(this._deviceContext);
    frames.format = this.getHardwarePixelFormat();
    frames.swFormat = swFormat;
    frames.width = width;
    frames.height = height;
    frames.initialPoolSize = initialPoolSize;

    const ret = frames.init();
    FFmpegError.throwIfError(ret, 'Failed to initialize hardware frames context');

    this._framesContext = frames;

    // Notify waiting components
    for (const waiter of this.waitingComponents) {
      waiter.resolve(this._framesContext);
    }
    this.waitingComponents.clear();

    return frames;
  }

  /**
   * Wait for frames context to become available.
   *
   * Used by components that need hw_frames_ctx but don't have it yet.
   * Resolves when another component (typically decoder) sets the frames context.
   *
   * @param timeout - Maximum time to wait in milliseconds (default: 5000)
   *
   * @returns Promise that resolves with the frames context
   *
   * @throws {Error} If timeout expires or HardwareContext is disposed
   *
   * @example
   * ```typescript
   * // Wait up to 3 seconds for frames context
   * const framesCtx = await hw.waitForFramesContext(3000);
   * ```
   */
  async waitForFramesContext(timeout = 5000): Promise<HardwareFramesContext> {
    if (this._framesContext) {
      return Promise.resolve(this._framesContext);
    }

    return Promise.race([
      new Promise<HardwareFramesContext>((resolve, reject) => {
        this.waitingComponents.add({ resolve, reject });
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for frames context')), timeout)),
    ]);
  }

  /**
   * Get the hardware pixel format for this device type.
   *
   * Maps device types to their corresponding pixel formats.
   *
   * Returns the appropriate AV_PIX_FMT_* constant for the hardware type.
   *
   * @returns Hardware pixel format
   */
  getHardwarePixelFormat(): AVPixelFormat {
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
      default:
        return AV_PIX_FMT_NV12; // Common hardware format
    }
  }

  /**
   * Check if this hardware type supports a specific codec.
   *
   * Checks both decoder and encoder support by querying FFmpeg's codec configurations.
   *
   * Uses avcodec_get_hw_config() internally to check hardware support.
   *
   * @param codecId - Codec ID from AVCodecID enum
   * @param isEncoder - Check for encoder support (default: false for decoder)
   *
   * @returns True if codec is supported by this hardware
   */
  supportsCodec(codecId: AVCodecID, isEncoder = false): boolean {
    // Try to find the codec
    const codec = isEncoder ? Codec.findEncoder(codecId) : Codec.findDecoder(codecId);

    if (!codec) {
      return false;
    }

    // Check hardware configurations
    for (let i = 0; ; i++) {
      const config = codec.getHwConfig(i);
      if (!config) {
        break; // No more configurations
      }

      // Check if this hardware device type is supported
      // Accept both HW_DEVICE_CTX and HW_FRAMES_CTX methods
      const supportsDeviceCtx = (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) !== 0;
      const supportsFramesCtx = (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_FRAMES_CTX) !== 0;

      if ((supportsDeviceCtx || supportsFramesCtx) && config.deviceType === this._deviceType) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find all codecs that support this hardware device.
   *
   * Uses FFmpeg's native codec list to find compatible codecs.
   *
   * Iterates through all codecs using av_codec_iterate() and checks
   * their hardware configurations.
   *
   * @param isEncoder - Find encoders (true) or decoders (false)
   *
   * @returns Array of codec names that support this hardware
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
   * Safe to call multiple times - subsequent calls are no-ops.
   * Called automatically by Decoder/Encoder on close.
   *
   * Frees both frames context (if created) and device context.
   * Notifies any waiting components that disposal occurred.
   */
  dispose(): void {
    if (this._isDisposed) {
      return; // Already disposed, safe to return
    }

    // Notify waiting components that we're disposing
    for (const waiter of this.waitingComponents) {
      waiter.reject(new Error('HardwareContext disposed'));
    }
    this.waitingComponents.clear();

    if (this._framesContext) {
      this._framesContext.free();
      this._framesContext = undefined;
    }
    this._deviceContext.free();
    this._isDisposed = true;
  }

  /**
   * Create hardware context from device type.
   *
   * Internal factory method using av_hwdevice_ctx_create().
   *
   * @param deviceType - AVHWDeviceType enum value
   * @param deviceName - Optional device name/index
   * @param options - Optional device options
   *
   * @returns HardwareContext or null if creation fails
   */
  private static async createFromType(deviceType: AVHWDeviceType, deviceName?: string, options?: Record<string, string>): Promise<HardwareContext | null> {
    const device = new HardwareDeviceContext();

    // Convert options to Dictionary if provided
    let optionsDict = null;
    if (options && Object.keys(options).length > 0) {
      optionsDict = Dictionary.fromObject(options);
    }

    const ret = device.create(deviceType, deviceName ?? null, optionsDict);

    // Clean up dictionary if used
    if (optionsDict) {
      optionsDict.free();
    }

    if (ret < 0) {
      device.free();
      return null;
    }

    return new HardwareContext(device, deviceType, deviceName);
  }

  /**
   * Get platform-specific preference order for hardware types.
   *
   * Returns the optimal hardware types for the current platform.
   *
   * @returns Array of AVHWDeviceType values in preference order
   */
  private static getPreferenceOrder(): AVHWDeviceType[] {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: VideoToolbox is preferred
      return [AV_HWDEVICE_TYPE_VIDEOTOOLBOX, AV_HWDEVICE_TYPE_VULKAN, AV_HWDEVICE_TYPE_OPENCL];
    } else if (platform === 'win32') {
      // Windows: D3D12VA (newest), D3D11VA, DXVA2, QSV, CUDA
      return [
        AV_HWDEVICE_TYPE_D3D12VA,
        AV_HWDEVICE_TYPE_D3D11VA,
        AV_HWDEVICE_TYPE_DXVA2,
        AV_HWDEVICE_TYPE_QSV,
        AV_HWDEVICE_TYPE_CUDA,
        AV_HWDEVICE_TYPE_VULKAN,
        AV_HWDEVICE_TYPE_OPENCL,
      ];
    } else {
      // Linux: VAAPI, VDPAU, CUDA, Vulkan, DRM
      return [AV_HWDEVICE_TYPE_VAAPI, AV_HWDEVICE_TYPE_VDPAU, AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VULKAN, AV_HWDEVICE_TYPE_DRM, AV_HWDEVICE_TYPE_OPENCL];
    }
  }

  /**
   * Automatic cleanup when using 'using' statement.
   *
   * Implements the Disposable interface for automatic cleanup.
   *
   * Calls dispose() to free hardware resources.
   *
   * @example
   * ```typescript
   * {
   *   using hw = await HardwareContext.auto();
   *   // Use hardware context...
   * } // Automatically disposed
   * ```
   */
  [Symbol.dispose](): void {
    this.dispose();
  }
}
