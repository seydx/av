import { bindings } from './binding.js';

import type { AVPixelFormat } from './constants.js';
import type { HardwareDeviceContext } from './hardware-device-context.js';
import type { NativeHardwareFramesContext, NativeWrapper } from './native-types.js';

/**
 * Hardware frames context for GPU memory management
 *
 * Manages hardware frame allocation and configuration for GPU-accelerated
 * video processing. Works in conjunction with HardwareDeviceContext to
 * allocate frames in GPU memory.
 *
 * @example
 * ```typescript
 * // Create hardware frames context
 * const hwDevice = new HardwareDeviceContext(AV_HWDEVICE_TYPE_CUDA);
 * const hwFrames = new HardwareFramesContext(hwDevice);
 *
 * // Configure frame properties
 * hwFrames.width = 1920;
 * hwFrames.height = 1080;
 * hwFrames.hardwarePixelFormat = AV_PIX_FMT_CUDA;
 * hwFrames.softwarePixelFormat = AV_PIX_FMT_NV12;
 * hwFrames.initialPoolSize = 20;
 *
 * // Initialize the context
 * hwFrames.initialize();
 * ```
 */
export class HardwareFramesContext implements Disposable, NativeWrapper<NativeHardwareFramesContext> {
  private context: NativeHardwareFramesContext; // Native hardware frames context binding

  // ==================== Constructor ====================

  /**
   * Allocate a hardware frames context
   * @param deviceContext Hardware device context to use
   * @throws Error if allocation fails
   */
  constructor(deviceContext: HardwareDeviceContext) {
    this.context = new bindings.HardwareFramesContext(deviceContext.getNative());

    if (!this.context) {
      throw new Error('Failed to allocate hardware frames context');
    }
  }

  // ==================== Getters/Setters ====================

  /**
   * Get/set frame width in pixels
   */
  get width(): number {
    return this.context.width;
  }

  set width(value: number) {
    this.context.width = value;
  }

  /**
   * Get/set frame height in pixels
   */
  get height(): number {
    return this.context.height;
  }

  set height(value: number) {
    this.context.height = value;
  }

  /**
   * Get/set hardware pixel format (GPU format)
   */
  get hardwarePixelFormat(): AVPixelFormat {
    return this.context.hardwarePixelFormat;
  }

  set hardwarePixelFormat(value: AVPixelFormat) {
    this.context.hardwarePixelFormat = value;
  }

  /**
   * Get/set software pixel format (CPU format)
   */
  get softwarePixelFormat(): AVPixelFormat {
    return this.context.softwarePixelFormat;
  }

  set softwarePixelFormat(value: AVPixelFormat) {
    this.context.softwarePixelFormat = value;
  }

  /**
   * Get/set initial frame pool size
   */
  get initialPoolSize(): number {
    return this.context.initialPoolSize;
  }

  set initialPoolSize(value: number) {
    this.context.initialPoolSize = value;
  }

  // ==================== Public Methods ====================

  /**
   * Initialize the hardware frames context
   * Must be called after setting all properties
   * @throws Error if initialization fails
   * @example
   * ```typescript
   * hwFrames.width = 1920;
   * hwFrames.height = 1080;
   * hwFrames.hardwarePixelFormat = AV_PIX_FMT_CUDA;
   * hwFrames.initialize(); // Initialize after configuration
   * ```
   */
  initialize(): void {
    this.context.initialize();
  }

  /**
   * Dispose of the hardware frames context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get native hardware frames context for internal use
   * @internal
   */
  getNative(): NativeHardwareFramesContext {
    return this.context;
  }
}
