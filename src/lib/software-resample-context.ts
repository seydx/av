import { bindings } from './binding.js';

import type { AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeSoftwareResampleContext, NativeWrapper } from './native-types.js';
import type { ChannelLayout } from './types.js';

/**
 * FFmpeg software resampling context - Low Level API
 *
 * Direct mapping to FFmpeg's SwrContext.
 * User has full control over allocation, configuration and lifecycle.
 *
 * @example
 * ```typescript
 * // Create and configure resample context - full control
 * const swr = new SoftwareResampleContext();
 * const ret = swr.allocSetOpts2(
 *   { order: 0, nbChannels: 2, mask: 0x3 }, // stereo out
 *   AV_SAMPLE_FMT_S16,
 *   44100,
 *   { order: 0, nbChannels: 6, mask: 0x3f }, // 5.1 in
 *   AV_SAMPLE_FMT_FLTP,
 *   48000
 * );
 * if (ret < 0) throw new FFmpegError(ret);
 *
 * // Initialize
 * const initRet = swr.init();
 * if (initRet < 0) throw new FFmpegError(initRet);
 *
 * // Convert audio
 * const samplesOut = swr.convert(outBuffers, outSamples, inBuffers, inSamples);
 *
 * // Cleanup
 * swr.free();
 * ```
 */
export class SoftwareResampleContext implements Disposable, NativeWrapper<NativeSoftwareResampleContext> {
  private native: NativeSoftwareResampleContext;

  // Constructor
  /**
   * Create a new software resample context.
   *
   * The context is uninitialized - you must call alloc() or allocSetOpts2() before use.
   * Direct wrapper around SwrContext.
   *
   * @example
   * ```typescript
   * const swr = new SoftwareResampleContext();
   * swr.allocSetOpts2(
   *   stereoLayout, AV_SAMPLE_FMT_S16, 44100,
   *   surroundLayout, AV_SAMPLE_FMT_FLTP, 48000
   * );
   * swr.init();
   * ```
   */
  constructor() {
    this.native = new bindings.SoftwareResampleContext();
  }

  // Public Methods - Lifecycle

  /**
   * Allocate SwrContext.
   *
   * Direct mapping to swr_alloc()
   *
   * If you use this function you will need to set options through the
   * AVOptions API before calling swr_init().
   *
   * @example
   * ```typescript
   * const swr = new SoftwareResampleContext();
   * swr.alloc();
   * // Set options via AVOptions API
   * swr.init();
   * ```
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Allocate SwrContext if needed and set/reset common parameters.
   *
   * Direct mapping to swr_alloc_set_opts2()
   *
   * This function does not require swr to be allocated with swr_alloc(). On the
   * other hand, swr_alloc() can use swr_alloc_set_opts2() to set the parameters
   * on the allocated context.
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
   * const ret = swr.allocSetOpts2(
   *   { order: 0, nbChannels: 2, mask: 0x3 }, // stereo
   *   AV_SAMPLE_FMT_S16,
   *   44100,
   *   { order: 0, nbChannels: 6, mask: 0x3f }, // 5.1
   *   AV_SAMPLE_FMT_FLTP,
   *   48000
   * );
   * if (ret < 0) throw new FFmpegError(ret);
   * ```
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
   * Direct mapping to swr_init()
   *
   * The context must be configured using the AVOption API.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = swr.init();
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
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

  // Public Methods - Conversion

  /**
   * Convert audio.
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
   * const samplesOut = swr.convert(
   *   outBuffers,
   *   outSamples,
   *   inBuffers,
   *   inSamples
   * );
   * if (samplesOut < 0) {
   *   throw new FFmpegError(samplesOut);
   * }
   * ```
   *
   * @note If more input is provided than output space, then the input will be buffered.
   * You can avoid this buffering by using swr_get_out_samples() to retrieve an
   * upper bound on the required number of output samples for the given number of
   * input samples. Conversion will run directly without copying whenever possible.
   */
  convert(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): number {
    return this.native.convert(outBuffer, outCount, inBuffer, inCount);
  }

  /**
   * Convert the samples in the input AVFrame and write them to the output AVFrame.
   *
   * Direct mapping to swr_convert_frame()
   *
   * Input and output AVFrames must have channel_layout, sample_rate and format set.
   *
   * If the output AVFrame does not have the data pointers allocated the nb_samples
   * field will be set using av_frame_get_buffer() is called to allocate the frame.
   *
   * The output AVFrame can be NULL or have fewer allocated samples than required.
   * In this case, any remaining samples not written to the output will be added
   * to an internal FIFO buffer, to be returned at the next call to this function
   * or to swr_convert().
   *
   * If converting sample rate, there may be data remaining in the internal
   * resampling delay buffer. swr_get_delay() tells the number of
   * remaining samples. To get this data as output, call this function or
   * swr_convert() with NULL input.
   *
   * If the SwrContext configuration does not match the output and
   * input AVFrame settings the conversion does not take place and depending on
   * which AV_FRAME_CONFIG_CHANGE_* flags are set, the error code is returned.
   *
   * @param outFrame - Output AVFrame
   * @param inFrame - Input AVFrame
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(EAGAIN): Need more input or output
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = swr.convertFrame(outFrame, inFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  convertFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.convertFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  /**
   * Configure or reconfigure the SwrContext using the information
   * provided by the AVFrames.
   *
   * Direct mapping to swr_config_frame()
   *
   * The original resampling context is reset even on failure.
   * The function calls swr_close() internally if the context is open.
   *
   * @param outFrame - Output AVFrame
   * @param inFrame - Input AVFrame
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid frame parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * const ret = swr.configFrame(outFrame, inFrame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * swr.init();
   * ```
   */
  configFrame(outFrame: Frame | null, inFrame: Frame | null): number {
    return this.native.configFrame(outFrame?.getNative() ?? null, inFrame?.getNative() ?? null);
  }

  // Public Methods - Status

  /**
   * Check whether an swr context has been initialized or not.
   *
   * Direct mapping to swr_is_initialized()
   *
   * @returns positive if it has been initialized, 0 if not initialized
   *
   * @example
   * ```typescript
   * if (swr.isInitialized()) {
   *   // Context is ready for conversion
   *   swr.convert(outBuf, outCount, inBuf, inCount);
   * }
   * ```
   */
  isInitialized(): boolean {
    return this.native.isInitialized();
  }

  /**
   * Gets the delay the next input sample will experience relative to the next output sample.
   *
   * Direct mapping to swr_get_delay()
   *
   * SwrContext can buffer data if more input has been provided than available
   * output space, also converting between sample rates needs a delay.
   * This function returns the sum of all such delays.
   * The exact delay is not necessarily an integer value in either input or
   * output sample rate. Especially when downsampling by a large value, the
   * output sample rate may be a poor choice to represent the delay, similarly
   * for upsampling and the input sample rate.
   *
   * @param base - Timebase in which the returned delay will be:
   *   - if it's set to 1 the returned delay is in seconds
   *   - if it's set to 1000 the returned delay is in milliseconds
   *   - if it's set to the input sample rate then the returned delay is in input samples
   *   - if it's set to the output sample rate then the returned delay is in output samples
   *   - if it's the least common multiple of in_sample_rate and out_sample_rate then an exact rounding-free delay will be returned
   *
   * @returns The delay in 1 / base units
   *
   * @example
   * ```typescript
   * // Get delay in milliseconds
   * const delayMs = swr.getDelay(1000n);
   *
   * // Get delay in output samples
   * const delaySamples = swr.getDelay(BigInt(outputSampleRate));
   * ```
   */
  getDelay(base: bigint): bigint {
    return this.native.getDelay(base);
  }

  /**
   * Find an upper bound on the number of samples that the next swr_convert
   * call will output, if called with in_samples of input samples.
   *
   * Direct mapping to swr_get_out_samples()
   *
   * This depends on the internal state, and anything changing the internal state
   * (like further swr_convert() calls) will may change the number of samples
   * swr_get_out_samples() returns for the same number of input samples.
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
   * const outSamples = swr.getOutSamples(inSamples);
   * if (outSamples < 0) {
   *   throw new FFmpegError(outSamples);
   * }
   * // Allocate output buffer based on outSamples
   * ```
   */
  getOutSamples(inSamples: number): number {
    return this.native.getOutSamples(inSamples);
  }

  /**
   * Convert the next timestamp from input to output
   * timestamps are in 1/(in_sample_rate * out_sample_rate) units.
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
   * // Use outPts for the output frame
   * ```
   */
  nextPts(pts: bigint): bigint {
    return this.native.nextPts(pts);
  }

  // Public Methods - Configuration

  /**
   * Activate resampling compensation ("soft" compensation).
   *
   * Direct mapping to swr_set_compensation()
   *
   * This function is internally called when needed in swr_next_pts().
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
   * const ret = swr.setCompensation(delta, distance);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  setCompensation(sampleDelta: number, compensationDistance: number): number {
    return this.native.setCompensation(sampleDelta, compensationDistance);
  }

  /**
   * Set a customized input channel mapping.
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
   * // Map channels: 0->0, 1->1, mute channel 2
   * const ret = swr.setChannelMapping([0, 1, -1]);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  setChannelMapping(channelMap: number[]): number {
    return this.native.setChannelMapping(channelMap);
  }

  /**
   * Set a customized remix matrix.
   *
   * Direct mapping to swr_set_matrix()
   *
   * @param matrix - Remix coefficients; matrix[i + stride * o] is the weight of input channel i in output channel o
   * @param stride - Offset between lines of the matrix
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * // Set custom mix matrix for stereo to mono
   * const matrix = [0.5, 0.5]; // Mix both channels equally
   * const ret = swr.setMatrix(matrix, 1);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  setMatrix(matrix: number[], stride: number): number {
    return this.native.setMatrix(matrix, stride);
  }

  /**
   * Drops the specified number of output samples.
   *
   * Direct mapping to swr_drop_output()
   *
   * This function, along with swr_inject_silence(), is called by swr_next_pts()
   * if needed for "hard" compensation.
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
   * const ret = swr.dropOutput(100);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  dropOutput(count: number): number {
    return this.native.dropOutput(count);
  }

  /**
   * Injects the specified number of silence samples.
   *
   * Direct mapping to swr_inject_silence()
   *
   * This function, along with swr_drop_output(), is called by swr_next_pts()
   * if needed for "hard" compensation.
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
   * const ret = swr.injectSilence(100);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  injectSilence(count: number): number {
    return this.native.injectSilence(count);
  }

  // Internal Methods

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
   * {
   *   using swr = new SoftwareResampleContext();
   *   swr.allocSetOpts2(...);
   *   swr.init();
   *   // ... use context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
