import { bindings } from './binding.js';
import { OptionMember } from './option.js';

import type { AVSampleFormat } from '../constants/constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareResampleContext, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Audio resampling and format conversion context.
 *
 * Provides comprehensive audio format conversion including sample rate conversion,
 * channel layout remapping, and sample format conversion. Essential for audio
 * processing pipelines where format compatibility is required between components.
 * Supports high-quality resampling algorithms with configurable parameters.
 *
 * Direct mapping to FFmpeg's SwrContext.
 *
 * @example
 * ```typescript
 * import { SoftwareResampleContext, Frame, FFmpegError } from 'node-av';
 * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';
 *
 * // Create resampler
 * const resampler = new SoftwareResampleContext();
 *
 * // Configure format conversion
 * const outLayout = { nbChannels: 2, order: 1, u: { mask: 3n } }; // Stereo
 * const inLayout = { nbChannels: 1, order: 1, u: { mask: 1n } };  // Mono
 *
 * const ret = resampler.allocSetOpts2(
 *   outLayout, AV_SAMPLE_FMT_S16, 48000,  // Output: Stereo, 16-bit, 48kHz
 *   inLayout, AV_SAMPLE_FMT_FLTP, 44100   // Input: Mono, float, 44.1kHz
 * );
 * FFmpegError.throwIfError(ret, 'allocSetOpts2');
 *
 * const ret2 = resampler.init();
 * FFmpegError.throwIfError(ret2, 'init');
 *
 * // Convert audio frame
 * const outFrame = new Frame();
 * outFrame.nbSamples = 1024;
 * outFrame.format = AV_SAMPLE_FMT_S16;
 * outFrame.channelLayout = outLayout;
 * outFrame.sampleRate = 48000;
 * outFrame.allocBuffer();
 *
 * const ret3 = resampler.convertFrame(outFrame, inFrame);
 * FFmpegError.throwIfError(ret3, 'convertFrame');
 *
 * // Get conversion delay
 * const delay = resampler.getDelay(48000n);
 * console.log(`Resampler delay: ${delay} samples`);
 *
 * // Clean up
 * resampler.free();
 * ```
 *
 * @see [SwrContext](https://ffmpeg.org/doxygen/trunk/structSwrContext.html) - FFmpeg Doxygen
 * @see {@link Frame} For audio frame operations
 */
export class SoftwareResampleContext extends OptionMember<NativeSoftwareResampleContext> implements Disposable, NativeWrapper<NativeSoftwareResampleContext> {
  constructor() {
    super(new bindings.SoftwareResampleContext());
  }

  /**
   * Allocate resample context.
   *
   * Allocates memory for the resampler.
   * Must be called before configuration.
   *
   * Direct mapping to swr_alloc().
   *
   * @example
   * ```typescript
   * const resampler = new SoftwareResampleContext();
   * resampler.alloc();
   * // Now configure with setOption() or allocSetOpts2()
   * ```
   *
   * @see {@link allocSetOpts2} For combined allocation and configuration
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Allocate and configure resampler.
   *
   * Combined allocation and configuration of the resampler with
   * input and output format specifications.
   *
   * Direct mapping to swr_alloc_set_opts2().
   *
   * @param outChLayout - Output channel layout
   *
   * @param outSampleFmt - Output sample format
   *
   * @param outSampleRate - Output sample rate in Hz
   *
   * @param inChLayout - Input channel layout
   *
   * @param inSampleFmt - Input sample format
   *
   * @param inSampleRate - Input sample rate in Hz
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from 'node-av/constants';
   *
   * // Stereo layout
   * const stereo = { nbChannels: 2, order: 1, u: { mask: 3n } };
   * // 5.1 layout
   * const surround = { nbChannels: 6, order: 1, u: { mask: 63n } };
   *
   * // Convert 5.1 float to stereo 16-bit
   * const ret = resampler.allocSetOpts2(
   *   stereo, AV_SAMPLE_FMT_S16, 48000,
   *   surround, AV_SAMPLE_FMT_FLTP, 48000
   * );
   * FFmpegError.throwIfError(ret, 'allocSetOpts2');
   * ```
   *
   * @see {@link init} Must be called after configuration
   */
  allocSetOpts2(
    outChLayout: ChannelLayout,
    outSampleFmt: AVSampleFormat,
    outSampleRate: number,
    inChLayout: ChannelLayout,
    inSampleFmt: AVSampleFormat,
    inSampleRate: number,
  ): number {
    return this.native.allocSetOpts2(outChLayout, outSampleFmt, outSampleRate, inChLayout, inSampleFmt, inSampleRate);
  }

  /**
   * Initialize resampler.
   *
   * Initializes the resampler after configuration.
   * Must be called before any conversion operations.
   *
   * Direct mapping to swr_init().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid configuration
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = resampler.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   *
   * @see {@link allocSetOpts2} For configuration
   * @see {@link isInitialized} To check initialization status
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Free resampler context.
   *
   * Releases all resources associated with the resampler.
   * The context becomes invalid after calling this.
   *
   * Direct mapping to swr_free().
   *
   * @example
   * ```typescript
   * resampler.free();
   * // Resampler is now invalid
   * ```
   *
   * @see {@link close} For closing without freeing
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    this.native.free();
  }

  /**
   * Close resampler context.
   *
   * Closes the resampler but keeps the context allocated.
   * Can be reconfigured and reinitialized after closing.
   *
   * Direct mapping to swr_close().
   *
   * @example
   * ```typescript
   * resampler.close();
   * // Can now reconfigure and reinit
   * ```
   *
   * @see {@link free} For complete deallocation
   */
  close(): void {
    this.native.close();
  }

  /**
   * Convert audio samples.
   *
   * Converts audio samples from input format to output format.
   * Handles resampling, channel remapping, and format conversion.
   *
   * Direct mapping to swr_convert().
   *
   * @param outBuffer - Output sample buffers (one per channel for planar)
   *
   * @param outCount - Maximum output samples per channel
   *
   * @param inBuffer - Input sample buffers (one per channel for planar)
   *
   * @param inCount - Input samples per channel
   *
   * @returns Number of output samples per channel, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_INPUT_CHANGED: Input format changed
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Convert audio buffers
   * const outBuffers = [Buffer.alloc(4096), Buffer.alloc(4096)]; // Stereo
   * const inBuffers = [inputBuffer]; // Mono
   *
   * const samples = await resampler.convert(
   *   outBuffers, 1024,
   *   inBuffers, inputSamples
   * );
   *
   * if (samples < 0) {
   *   FFmpegError.throwIfError(samples, 'convert');
   * }
   * console.log(`Converted ${samples} samples`);
   * ```
   *
   * @see {@link convertFrame} For frame-based conversion
   */
  async convert(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): Promise<number> {
    return await this.native.convert(outBuffer, outCount, inBuffer, inCount);
  }

  /**
   * Convert audio samples synchronously.
   * Synchronous version of convert.
   *
   * Converts audio between formats, sample rates, and channel layouts.
   * Can handle format conversion, resampling, and channel mixing.
   *
   * Direct mapping to swr_convert().
   *
   * @param outBuffer - Output buffer array (one per channel, null to get delay)
   *
   * @param outCount - Number of output samples space per channel
   *
   * @param inBuffer - Input buffer array (one per channel, null to flush)
   *
   * @param inCount - Number of input samples per channel
   *
   * @returns Number of samples output per channel, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Convert stereo float to mono s16
   * const inBuffers = [leftChannel, rightChannel];
   * const outBuffers = [monoOutput];
   *
   * const samples = resampler.convertSync(
   *   outBuffers, 1024,  // Output: 1024 samples max
   *   inBuffers, 1024    // Input: 1024 samples
   * );
   * FFmpegError.throwIfError(samples, 'convertSync');
   * console.log(`Converted ${samples} samples`);
   * ```
   *
   * @see {@link convert} For async version
   */
  convertSync(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): number {
    return this.native.convertSync(outBuffer, outCount, inBuffer, inCount);
  }

  /**
   * Convert audio frame.
   *
   * Converts an entire audio frame to the output format.
   * Simpler interface than convert() for frame-based processing.
   *
   * Direct mapping to swr_convert_frame().
   *
   * @param outFrame - Output frame (null to drain)
   *
   * @param inFrame - Input frame (null to flush)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *   - AVERROR_INPUT_CHANGED: Input format changed
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from 'node-av';
   *
   * // Convert frame
   * const outFrame = new Frame();
   * const ret = resampler.convertFrame(outFrame, inFrame);
   * FFmpegError.throwIfError(ret, 'convertFrame');
   *
   * // Drain remaining samples
   * const drainFrame = new Frame();
   * const ret2 = resampler.convertFrame(drainFrame, null);
   * if (ret2 === 0) {
   *   // Got drained samples
   * }
   * ```
   *
   * @see {@link convert} For buffer-based conversion
   * @see {@link configFrame} To configure from frame
   */
  convertFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.convertFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  /**
   * Configure resampler from frames.
   *
   * Configures the resampler using format information from frames.
   * Alternative to allocSetOpts2() for frame-based setup.
   *
   * Direct mapping to swr_config_frame().
   *
   * @param outFrame - Frame with output format
   *
   * @param inFrame - Frame with input format
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Configure from frames
   * const ret = resampler.configFrame(outFrame, inFrame);
   * FFmpegError.throwIfError(ret, 'configFrame');
   *
   * const ret2 = resampler.init();
   * FFmpegError.throwIfError(ret2, 'init');
   * ```
   *
   * @see {@link allocSetOpts2} For manual configuration
   */
  configFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.configFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  /**
   * Check if initialized.
   *
   * Returns whether the resampler has been initialized.
   *
   * Direct mapping to swr_is_initialized().
   *
   * @returns True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (!resampler.isInitialized()) {
   *   resampler.init();
   * }
   * ```
   *
   * @see {@link init} To initialize
   */
  isInitialized(): boolean {
    return this.native.isInitialized();
  }

  /**
   * Get resampler delay.
   *
   * Returns the number of samples currently buffered in the resampler.
   * These samples will be output when flushing or with new input.
   *
   * Direct mapping to swr_get_delay().
   *
   * @param base - Time base for the returned delay
   *
   * @returns Delay in samples at the given base rate
   *
   * @example
   * ```typescript
   * // Get delay in output sample rate
   * const delay = resampler.getDelay(48000n);
   * console.log(`${delay} samples buffered`);
   *
   * // Get delay in microseconds
   * const delayUs = resampler.getDelay(1000000n);
   * console.log(`${delayUs} microseconds delay`);
   * ```
   */
  getDelay(base: bigint): bigint {
    return this.native.getDelay(base);
  }

  /**
   * Calculate output sample count.
   *
   * Calculates how many output samples will be produced
   * for a given number of input samples.
   *
   * Direct mapping to swr_get_out_samples().
   *
   * @param inSamples - Number of input samples
   *
   * @returns Number of output samples
   *
   * @example
   * ```typescript
   * const outSamples = resampler.getOutSamples(1024);
   * console.log(`1024 input samples -> ${outSamples} output samples`);
   * ```
   */
  getOutSamples(inSamples: number): number {
    return this.native.getOutSamples(inSamples);
  }

  /**
   * Calculate next PTS.
   *
   * Calculates the presentation timestamp for the next output sample.
   *
   * Direct mapping to swr_next_pts().
   *
   * @param pts - Current presentation timestamp
   *
   * @returns Next presentation timestamp
   *
   * @example
   * ```typescript
   * let pts = 0n;
   * pts = resampler.nextPts(pts);
   * console.log(`Next PTS: ${pts}`);
   * ```
   */
  nextPts(pts: bigint): bigint {
    return this.native.nextPts(pts);
  }

  /**
   * Set compensation.
   *
   * Adjusts the resampling rate to compensate for clock drift.
   * Used for audio/video synchronization.
   *
   * Direct mapping to swr_set_compensation().
   *
   * @param sampleDelta - Sample difference to compensate
   *
   * @param compensationDistance - Distance over which to compensate
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Compensate 10 samples over 1000 samples
   * const ret = resampler.setCompensation(10, 1000);
   * FFmpegError.throwIfError(ret, 'setCompensation');
   * ```
   */
  setCompensation(sampleDelta: number, compensationDistance: number): number {
    return this.native.setCompensation(sampleDelta, compensationDistance);
  }

  /**
   * Set channel mapping.
   *
   * Sets custom channel mapping for remixing.
   *
   * Direct mapping to swr_set_channel_mapping().
   *
   * @param channelMap - Array mapping input to output channels
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Map stereo to reverse stereo (swap L/R)
   * const ret = resampler.setChannelMapping([1, 0]);
   * FFmpegError.throwIfError(ret, 'setChannelMapping');
   * ```
   */
  setChannelMapping(channelMap: number[]): number {
    return this.native.setChannelMapping(channelMap);
  }

  /**
   * Set mixing matrix.
   *
   * Sets a custom mixing matrix for channel remapping.
   *
   * Direct mapping to swr_set_matrix().
   *
   * @param matrix - Mixing matrix coefficients
   *
   * @param stride - Matrix row stride
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Custom downmix matrix
   * const matrix = [
   *   1.0, 0.0,  // Left channel
   *   0.0, 1.0,  // Right channel
   * ];
   * const ret = resampler.setMatrix(matrix, 2);
   * FFmpegError.throwIfError(ret, 'setMatrix');
   * ```
   */
  setMatrix(matrix: number[], stride: number): number {
    return this.native.setMatrix(matrix, stride);
  }

  /**
   * Drop output samples.
   *
   * Drops the specified number of output samples.
   * Used for synchronization adjustments.
   *
   * Direct mapping to swr_drop_output().
   *
   * @param count - Number of samples to drop
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Drop 100 output samples
   * const ret = resampler.dropOutput(100);
   * if (ret >= 0) {
   *   console.log(`Dropped ${ret} samples`);
   * }
   * ```
   */
  dropOutput(count: number): number {
    return this.native.dropOutput(count);
  }

  /**
   * Inject silence.
   *
   * Injects silent samples into the output.
   * Used for padding or synchronization.
   *
   * Direct mapping to swr_inject_silence().
   *
   * @param count - Number of silent samples to inject
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Inject 100 silent samples
   * const ret = resampler.injectSilence(100);
   * if (ret >= 0) {
   *   console.log(`Injected ${ret} silent samples`);
   * }
   * ```
   */
  injectSilence(count: number): number {
    return this.native.injectSilence(count);
  }

  /**
   * Get the underlying native SoftwareResampleContext object.
   *
   * @returns The native SoftwareResampleContext binding object
   *
   * @internal
   */
  getNative(): NativeSoftwareResampleContext {
    return this.native;
  }

  /**
   * Dispose of the resampler context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using resampler = new SoftwareResampleContext();
   *   resampler.allocSetOpts2(...);
   *   resampler.init();
   *   // Use resampler...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
