import { bindings } from './binding.js';
import { OptionMember } from './option.js';

import type { AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareResampleContext, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * Software audio resampling context.
 *
 * Provides high-quality audio resampling, format conversion, and channel mixing.
 * Supports sample rate conversion, channel layout remapping, and sample format conversion.
 * Uses the libswresample library for efficient audio processing.
 *
 * Direct mapping to FFmpeg's SwrContext.
 *
 * @example
 * ```typescript
 * import { SoftwareResampleContext, FFmpegError } from '@seydx/av';
 * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from '@seydx/av/constants';
 *
 * // Create and configure resample context
 * const swr = new SoftwareResampleContext();
 * const ret = swr.allocSetOpts2(
 *   { order: 0, nbChannels: 2, mask: 0x3 }, // stereo out
 *   AV_SAMPLE_FMT_S16,
 *   44100,
 *   { order: 0, nbChannels: 6, mask: 0x3f }, // 5.1 in
 *   AV_SAMPLE_FMT_FLTP,
 *   48000
 * );
 * FFmpegError.throwIfError(ret, 'allocSetOpts2');
 *
 * // Initialize
 * const initRet = swr.init();
 * FFmpegError.throwIfError(initRet, 'init');
 *
 * // Convert audio
 * const samplesOut = await swr.convert(outBuffers, outSamples, inBuffers, inSamples);
 * FFmpegError.throwIfError(samplesOut, 'convert');
 *
 * // Cleanup
 * swr.free();
 * ```
 */
export class SoftwareResampleContext extends OptionMember<NativeSoftwareResampleContext> implements Disposable, NativeWrapper<NativeSoftwareResampleContext> {
  /**
   * Create a new software resample context.
   *
   * The context is uninitialized - you must call alloc() or allocSetOpts2() before use.
   * No FFmpeg resources are allocated until initialization.
   *
   * Direct wrapper around SwrContext.
   *
   * @example
   * ```typescript
   * import { SoftwareResampleContext, FFmpegError } from '@seydx/av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from '@seydx/av/constants';
   *
   * const swr = new SoftwareResampleContext();
   * const ret = swr.allocSetOpts2(
   *   { order: 0, nbChannels: 2, mask: 0x3 },
   *   AV_SAMPLE_FMT_S16,
   *   44100,
   *   { order: 0, nbChannels: 6, mask: 0x3f },
   *   AV_SAMPLE_FMT_FLTP,
   *   48000
   * );
   * FFmpegError.throwIfError(ret, 'allocSetOpts2');
   * const initRet = swr.init();
   * FFmpegError.throwIfError(initRet, 'init');
   * ```
   */
  constructor() {
    super(new bindings.SoftwareResampleContext());
  }

  /**
   * Allocate SwrContext.
   *
   * Allocates an uninitialized resample context.
   * Options must be set through the AVOptions API before calling init().
   *
   * Direct mapping to swr_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { SoftwareResampleContext, FFmpegError } from '@seydx/av';
   *
   * const swr = new SoftwareResampleContext();
   * swr.alloc();
   * // Set options via AVOptions API
   * const ret = swr.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   *
   * @see {@link allocSetOpts2} For one-step configuration
   * @see {@link init} To initialize after configuration
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Allocate SwrContext if needed and set/reset common parameters.
   *
   * One-step allocation and configuration of the resample context.
   * Automatically allocates the context if not already allocated.
   *
   * Direct mapping to swr_alloc_set_opts2()
   *
   * @param outChLayout - Output channel layout
   * @param outSampleFmt - Output sample format
   * @param outSampleRate - Output sample rate (frequency in Hz)
   * @param inChLayout - Input channel layout
   * @param inSampleFmt - Input sample format
   * @param inSampleRate - Input sample rate (frequency in Hz)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { SoftwareResampleContext, FFmpegError } from '@seydx/av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from '@seydx/av/constants';
   *
   * const ret = swr.allocSetOpts2(
   *   { order: 0, nbChannels: 2, mask: 0x3 }, // stereo
   *   AV_SAMPLE_FMT_S16,
   *   44100,
   *   { order: 0, nbChannels: 6, mask: 0x3f }, // 5.1
   *   AV_SAMPLE_FMT_FLTP,
   *   48000
   * );
   * FFmpegError.throwIfError(ret, 'allocSetOpts2');
   * ```
   *
   * @see {@link init} To initialize after configuration
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
   * Initialize context after user parameters have been set.
   *
   * Completes initialization of the resample context.
   * Must be called after configuration and before conversion.
   *
   * Direct mapping to swr_init()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = swr.init();
   * FFmpegError.throwIfError(ret, 'init');
   * ```
   *
   * @see {@link allocSetOpts2} For configuration
   * @see {@link convert} For audio conversion
   */
  init(): number {
    return this.native.init();
  }

  /**
   * Free the given SwrContext and set the pointer to NULL.
   *
   * Direct mapping to swr_free()
   *
   * @example
   * ```typescript
   * swr.free();
   * // swr is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Closes the context so that swr_is_initialized() returns 0.
   *
   * Direct mapping to swr_close()
   *
   * The context can be brought back to life by running swr_init(),
   * swr_init() can also be used without swr_close().
   * This function is mainly provided for simplifying the usecase
   * where one tries to support libavresample and libswresample.
   *
   * @example
   * ```typescript
   * swr.close();
   * // Context is now closed but not freed
   * // Can be reinitialized with swr.init()
   * ```
   */
  close(): void {
    this.native.close();
  }

  /**
   * Convert audio.
   *
   * Converts audio between different formats, sample rates, and channel layouts.
   * Handles buffering internally when output space is insufficient.
   *
   * Direct mapping to swr_convert()
   *
   * @param outBuffer - Output buffers, only the first one need be set in case of packed audio
   * @param outCount - Amount of space available for output in samples per channel
   * @param inBuffer - Input buffers, only the first one need be set in case of packed audio
   * @param inCount - Number of input samples available in one channel
   *
   * @returns Number of samples output per channel, negative AVERROR on error:
   *   - >=0: Number of samples output per channel
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const samplesOut = await swr.convert(
   *   outBuffers,
   *   outSamples,
   *   inBuffers,
   *   inSamples
   * );
   * FFmpegError.throwIfError(samplesOut, 'convert');
   * console.log(`Converted ${samplesOut} samples per channel`);
   * ```
   *
   * @see {@link getOutSamples} To calculate required output space
   * @see {@link convertFrame} For frame-based conversion
   *
   * @note If more input is provided than output space, then the input will be buffered.
   * You can avoid this buffering by using swr_get_out_samples() to retrieve an
   * upper bound on the required number of output samples for the given number of
   * input samples. Conversion will run directly without copying whenever possible.
   */
  async convert(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): Promise<number> {
    return this.native.convert(outBuffer, outCount, inBuffer, inCount);
  }

  /**
   * Convert the samples in the input AVFrame and write them to the output AVFrame.
   *
   * Frame-based audio conversion with automatic buffer management.
   * Handles format, sample rate, and channel layout conversion.
   *
   * Direct mapping to swr_convert_frame()
   *
   * @param outFrame - Output AVFrame (can be null for flushing)
   * @param inFrame - Input AVFrame (can be null for draining)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(EAGAIN): Need more input or output
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { Frame, FFmpegError } from '@seydx/av';
   *
   * const ret = swr.convertFrame(outFrame, inFrame);
   * FFmpegError.throwIfError(ret, 'convertFrame');
   *
   * // Flush remaining samples
   * const flushRet = swr.convertFrame(outFrame, null);
   * FFmpegError.throwIfError(flushRet, 'flush');
   * ```
   *
   * @see {@link convert} For buffer-based conversion
   * @see {@link getDelay} To check buffered samples
   *
   * @note Input and output AVFrames must have channel_layout, sample_rate and format set.
   * If the output AVFrame does not have the data pointers allocated the nb_samples
   * field will be set and av_frame_get_buffer() is called to allocate the frame.
   */
  convertFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.convertFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  /**
   * Configure or reconfigure the SwrContext using the information provided by the AVFrames.
   *
   * Automatically configures the resample context from frame parameters.
   * Resets the context even on failure and calls close() internally if open.
   *
   * Direct mapping to swr_config_frame()
   *
   * @param outFrame - Output AVFrame (provides output parameters)
   * @param inFrame - Input AVFrame (provides input parameters)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = swr.configFrame(outFrame, inFrame);
   * FFmpegError.throwIfError(ret, 'configFrame');
   * const initRet = swr.init();
   * FFmpegError.throwIfError(initRet, 'init');
   * ```
   *
   * @see {@link init} Must be called after configuration
   */
  configFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.configFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  /**
   * Check whether an swr context has been initialized or not.
   *
   * Checks if the context is ready for audio conversion.
   *
   * Direct mapping to swr_is_initialized()
   *
   * @returns True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * if (swr.isInitialized()) {
   *   // Context is ready for conversion
   *   const ret = await swr.convert(outBuf, outCount, inBuf, inCount);
   *   FFmpegError.throwIfError(ret, 'convert');
   * }
   * ```
   */
  isInitialized(): boolean {
    return this.native.isInitialized();
  }

  /**
   * Gets the delay the next input sample will experience relative to the next output sample.
   *
   * Returns the total buffering delay in the resample context.
   * Accounts for both buffered data and sample rate conversion delays.
   *
   * Direct mapping to swr_get_delay()
   *
   * @param base - Timebase in which the returned delay will be:
   *   - 1: delay in seconds
   *   - 1000: delay in milliseconds
   *   - input sample rate: delay in input samples
   *   - output sample rate: delay in output samples
   *   - LCM of rates: exact rounding-free delay
   *
   * @returns The delay in 1 / base units
   *
   * @example
   * ```typescript
   * // Get delay in milliseconds
   * const delayMs = swr.getDelay(1000n);
   * console.log(`Buffered: ${delayMs}ms`);
   *
   * // Get delay in output samples
   * const delaySamples = swr.getDelay(BigInt(outputSampleRate));
   * console.log(`Buffered: ${delaySamples} samples`);
   * ```
   *
   * @see {@link getOutSamples} To calculate output buffer size
   */
  getDelay(base: bigint): bigint {
    return this.native.getDelay(base);
  }

  /**
   * Find an upper bound on the number of samples that the next swr_convert will output.
   *
   * Calculates maximum output samples for given input samples.
   * Accounts for buffered data and sample rate conversion.
   *
   * Direct mapping to swr_get_out_samples()
   *
   * @param inSamples - Number of input samples
   *
   * @returns Upper bound on output samples or negative AVERROR:
   *   - >=0: Upper bound on the number of samples that the next swr_convert will output
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const outSamples = swr.getOutSamples(inSamples);
   * FFmpegError.throwIfError(outSamples, 'getOutSamples');
   * // Allocate output buffer for outSamples samples
   * const bufferSize = outSamples * bytesPerSample * channels;
   * ```
   *
   * @see {@link convert} For actual conversion
   *
   * @note This depends on the internal state, and anything changing the internal state
   * (like further swr_convert() calls) may change the number of samples returned.
   */
  getOutSamples(inSamples: number): number {
    return this.native.getOutSamples(inSamples);
  }

  /**
   * Convert the next timestamp from input to output.
   *
   * Converts timestamps accounting for sample rate conversion.
   * Timestamps are in 1/(in_sample_rate * out_sample_rate) units.
   *
   * Direct mapping to swr_next_pts()
   *
   * @param pts - Timestamp for the next input sample, INT64_MIN if unknown
   *
   * @returns The output timestamp for the next output sample
   *
   * @example
   * ```typescript
   * const outPts = swr.nextPts(inPts);
   * outFrame.pts = outPts;
   * ```
   *
   * @see {@link setCompensation} For timestamp compensation
   */
  nextPts(pts: bigint): bigint {
    return this.native.nextPts(pts);
  }

  /**
   * Activate resampling compensation ("soft" compensation).
   *
   * Adjusts resampling to compensate for timestamp drift.
   * Automatically called by nextPts() when needed.
   *
   * Direct mapping to swr_set_compensation()
   *
   * @param sampleDelta - Delta in PTS per sample
   * @param compensationDistance - Number of samples to compensate for
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters (NULL context, negative distance, etc.)
   *   - AVERROR(ENOSYS): Compensation unsupported by resampler
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = swr.setCompensation(delta, distance);
   * FFmpegError.throwIfError(ret, 'setCompensation');
   * ```
   *
   * @see {@link nextPts} For automatic compensation
   */
  setCompensation(sampleDelta: number, compensationDistance: number): number {
    return this.native.setCompensation(sampleDelta, compensationDistance);
  }

  /**
   * Set a customized input channel mapping.
   *
   * Remaps input channels to output channels.
   * Use -1 to mute a channel.
   *
   * Direct mapping to swr_set_channel_mapping()
   *
   * @param channelMap - Customized input channel mapping (array of channel indexes, -1 for a muted channel)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * // Map channels: 0->0, 1->1, mute channel 2
   * const ret = swr.setChannelMapping([0, 1, -1]);
   * FFmpegError.throwIfError(ret, 'setChannelMapping');
   * ```
   *
   * @see {@link setMatrix} For custom mixing matrix
   */
  setChannelMapping(channelMap: number[]): number {
    return this.native.setChannelMapping(channelMap);
  }

  /**
   * Set a customized remix matrix.
   *
   * Sets custom coefficients for channel mixing.
   * matrix[i + stride * o] is the weight of input channel i in output channel o.
   *
   * Direct mapping to swr_set_matrix()
   *
   * @param matrix - Remix coefficients
   * @param stride - Offset between lines of the matrix
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * // Set custom mix matrix for stereo to mono
   * const matrix = [0.5, 0.5]; // Mix both channels equally
   * const ret = swr.setMatrix(matrix, 1);
   * FFmpegError.throwIfError(ret, 'setMatrix');
   * ```
   *
   * @see {@link setChannelMapping} For channel remapping
   */
  setMatrix(matrix: number[], stride: number): number {
    return this.native.setMatrix(matrix, stride);
  }

  /**
   * Drops the specified number of output samples.
   *
   * Discards output samples for "hard" timestamp compensation.
   * Automatically called by nextPts() when needed.
   *
   * Direct mapping to swr_drop_output()
   *
   * @param count - Number of samples to be dropped
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = swr.dropOutput(100);
   * FFmpegError.throwIfError(ret, 'dropOutput');
   * ```
   *
   * @see {@link injectSilence} For adding silence
   * @see {@link nextPts} For automatic compensation
   */
  dropOutput(count: number): number {
    return this.native.dropOutput(count);
  }

  /**
   * Injects the specified number of silence samples.
   *
   * Inserts silent samples for "hard" timestamp compensation.
   * Automatically called by nextPts() when needed.
   *
   * Direct mapping to swr_inject_silence()
   *
   * @param count - Number of samples to be injected
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/av';
   *
   * const ret = swr.injectSilence(100);
   * FFmpegError.throwIfError(ret, 'injectSilence');
   * ```
   *
   * @see {@link dropOutput} For dropping samples
   * @see {@link nextPts} For automatic compensation
   */
  injectSilence(count: number): number {
    return this.native.injectSilence(count);
  }

  /**
   * Get the native FFmpeg SwrContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native resample context object
   */
  getNative(): NativeSoftwareResampleContext {
    return this.native;
  }

  /**
   * Dispose of the resample context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * import { SoftwareResampleContext, FFmpegError } from '@seydx/av';
   *
   * {
   *   using swr = new SoftwareResampleContext();
   *   const ret = swr.allocSetOpts2(...);
   *   FFmpegError.throwIfError(ret, 'allocSetOpts2');
   *   const initRet = swr.init();
   *   FFmpegError.throwIfError(initRet, 'init');
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   *
   * @see {@link free} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
