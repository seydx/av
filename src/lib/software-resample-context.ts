import { bindings } from './binding.js';

import type { Frame } from './frame.js';
import type { NativeSoftwareResampleContext, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Software audio resampler for format conversion
 *
 * Handles audio resampling, channel layout conversion, and sample format
 * conversion using libswresample. Used when you need to convert audio
 * between different formats, sample rates, or channel layouts.
 *
 * @example
 * ```typescript
 * // Create resampler for 48kHz stereo to 44.1kHz stereo
 * const resampler = new SoftwareResampleContext(
 *   { nbChannels: 2, order: 1, mask: 3n }, // Stereo input
 *   48000, // 48kHz
 *   AV_SAMPLE_FMT_FLTP,
 *   { nbChannels: 2, order: 1, mask: 3n }, // Stereo output
 *   44100, // 44.1kHz
 *   AV_SAMPLE_FMT_S16
 * );
 *
 * // Convert frames
 * resampler.convertFrame(inputFrame, outputFrame);
 * ```
 */
export class SoftwareResampleContext implements Disposable, NativeWrapper<NativeSoftwareResampleContext> {
  private context: NativeSoftwareResampleContext; // Native resample context binding

  // ==================== Constructor ====================

  /**
   * Create a new software resample context
   * @param srcChannelLayout Source channel layout
   * @param srcSampleRate Source sample rate in Hz
   * @param srcSampleFormat Source sample format
   * @param dstChannelLayout Destination channel layout
   * @param dstSampleRate Destination sample rate in Hz
   * @param dstSampleFormat Destination sample format
   * @example
   * ```typescript
   * // Convert from 48kHz float to 44.1kHz 16-bit
   * const resampler = new SoftwareResampleContext(
   *   srcLayout, 48000, AV_SAMPLE_FMT_FLTP,
   *   dstLayout, 44100, AV_SAMPLE_FMT_S16
   * );
   * ```
   */
  constructor(
    srcChannelLayout: ChannelLayout,
    srcSampleRate: number,
    srcSampleFormat: number,
    dstChannelLayout: ChannelLayout,
    dstSampleRate: number,
    dstSampleFormat: number,
  ) {
    this.context = new bindings.SoftwareResampleContext(srcChannelLayout, srcSampleRate, srcSampleFormat, dstChannelLayout, dstSampleRate, dstSampleFormat);
  }

  // ==================== Public Methods ====================

  /**
   * Convert audio frame from source to destination format
   * @param src Source frame (null to flush)
   * @param dst Destination frame (must be allocated)
   * @example
   * ```typescript
   * const dstFrame = new Frame();
   * dstFrame.format = AV_SAMPLE_FMT_S16;
   * dstFrame.sampleRate = 44100;
   * dstFrame.channelLayout = dstLayout;
   * dstFrame.nbSamples = 1024;
   * dstFrame.allocBuffer();
   *
   * resampler.convertFrame(srcFrame, dstFrame);
   * ```
   */
  convertFrame(src: Frame | null, dst: Frame): void {
    this.context.convertFrame(src?.getNative() ?? null, dst.getNative());
  }

  /**
   * Get the delay in the resampler
   * @param base Base sample rate to calculate delay
   * @returns Delay in samples
   * @example
   * ```typescript
   * // Get remaining samples in resampler buffer
   * const delay = resampler.getDelay(44100n);
   * console.log(`Buffered samples: ${delay}`);
   * ```
   */
  getDelay(base: bigint): bigint {
    return this.context.getDelay(base);
  }

  /**
   * Dispose of the resample context and free resources
   */
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get native resample context for internal use
   * @internal
   */
  getNative(): NativeSoftwareResampleContext {
    return this.context;
  }
}
