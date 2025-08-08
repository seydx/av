import { bindings } from './binding.js';

import type { Frame } from './frame.js';

/**
 * Software Resample Context wrapper for audio resampling
 */
export class SoftwareResampleContext implements Disposable {
  private context: any;

  /**
   * Create a new software resample context
   *
   * Note: After creation, you should configure the context using AVOptions
   * before initializing it. This is typically done through the Dictionary class.
   */
  constructor() {
    this.context = new bindings.SoftwareResampleContext();
  }

  /**
   * Convert audio frame
   *
   * @param src Source frame (null to flush)
   * @param dst Destination frame
   */
  convertFrame(src: Frame | null, dst: Frame): void {
    this.context.convertFrame(src?.nativeFrame ?? null, dst.nativeFrame);
  }

  /**
   * Get the delay in the resampler
   *
   * @param base Base sample rate to calculate delay
   * @returns Delay in samples
   */
  getDelay(base: bigint): bigint {
    return this.context.getDelay(base);
  }

  /**
   * Get native context for use with other APIs
   */
  get native(): any {
    return this.context;
  }

  /**
   * Dispose of the resample context
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }
}
