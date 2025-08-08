import { bindings } from './binding.js';

import type { HardwareDeviceContext } from './hardware-device-context.js';

/**
 * Hardware Frames Context wrapper for hardware frame allocation
 */
export class HardwareFramesContext implements Disposable {
  private context: any;

  private constructor(context: any) {
    this.context = context;
  }

  /**
   * Allocate a hardware frames context
   *
   * @param deviceContext Hardware device context
   */
  static alloc(deviceContext: HardwareDeviceContext): HardwareFramesContext {
    const context = bindings.HardwareFramesContext.alloc(deviceContext.native);

    if (!context) {
      throw new Error('Failed to allocate hardware frames context');
    }

    return new HardwareFramesContext(context);
  }

  /**
   * Initialize the hardware frames context
   * Must be called after setting all properties
   */
  initialize(): void {
    this.context.initialize();
  }

  /**
   * Get/set width
   */
  get width(): number {
    return this.context.width;
  }

  set width(value: number) {
    this.context.width = value;
  }

  /**
   * Get/set height
   */
  get height(): number {
    return this.context.height;
  }

  set height(value: number) {
    this.context.height = value;
  }

  /**
   * Get/set hardware pixel format
   */
  get hardwarePixelFormat(): number {
    return this.context.hardwarePixelFormat;
  }

  set hardwarePixelFormat(value: number) {
    this.context.hardwarePixelFormat = value;
  }

  /**
   * Get/set software pixel format
   */
  get softwarePixelFormat(): number {
    return this.context.softwarePixelFormat;
  }

  set softwarePixelFormat(value: number) {
    this.context.softwarePixelFormat = value;
  }

  /**
   * Get/set initial pool size
   */
  get initialPoolSize(): number {
    return this.context.initialPoolSize;
  }

  set initialPoolSize(value: number) {
    this.context.initialPoolSize = value;
  }

  /**
   * Get native context for use with other APIs
   */
  get native(): any {
    return this.context;
  }

  /**
   * Dispose of the hardware frames context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }
}
