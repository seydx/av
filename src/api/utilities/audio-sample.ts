/**
 * Audio Sample Utilities
 *
 * Provides utilities for working with audio sample buffers in FFmpeg.
 * All methods are static and map directly to FFmpeg's libavutil functions.
 *
 * @module lib/audio-sample-utils
 */

import { bindings } from '../../lib/binding.js';
import { FFmpegError } from '../../lib/error.js';

import type { AVSampleFormat } from '../../lib/constants.js';

/**
 * Audio sample allocation result.
 */
export interface AudioSampleAllocation {
  /** Allocated data buffers (one per channel for planar formats) */
  data: Buffer[];
  /** Line size (bytes per channel) */
  linesize: number;
  /** Total allocated size */
  size: number;
}

/**
 * Audio sample buffer size result.
 */
export interface AudioSampleBufferSize {
  /** Total size in bytes */
  size: number;
  /** Line size (bytes per channel) */
  linesize: number;
}

/**
 * Audio sample buffer utilities.
 *
 * Provides static methods for allocating and managing audio sample buffers.
 * These utilities handle the memory layout for various sample formats,
 * including planar formats where each channel has its own buffer.
 *
 * @example
 * ```typescript
 * import { AudioSampleUtils } from '@seydx/av';
 * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from '@seydx/av/constants';
 *
 * // Allocate audio buffers for stereo float planar
 * const audio = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_FLTP, 0);
 * console.log(`Allocated ${audio.size} bytes`);
 * console.log(`${audio.data.length} buffers (one per channel)`);
 *
 * // Get buffer size for packed format
 * const size = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_S16, 0);
 * console.log(`S16 stereo needs ${size.size} bytes`);
 * ```
 */
export class AudioSampleUtils {
  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Allocate audio sample buffers.
   *
   * Allocates buffers for audio samples. For planar formats, allocates
   * separate buffers for each channel. For packed formats, allocates
   * a single interleaved buffer.
   * Direct mapping to av_samples_alloc()
   *
   * @param nbChannels - Number of audio channels
   * @param nbSamples - Number of samples per channel
   * @param sampleFmt - Audio sample format
   * @param align - Buffer alignment (0 for default)
   * @returns Allocation result with buffers and size information
   * @throws {FFmpegError} On allocation failure
   *
   * @example
   * ```typescript
   * import { AudioSampleUtils } from '@seydx/av';
   * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from '@seydx/av/constants';
   *
   * // Allocate for planar format (separate buffer per channel)
   * const planar = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_FLTP, 0);
   * console.log(`Planar: ${planar.data.length} buffers`); // 2 buffers
   *
   * // Allocate for packed format (single interleaved buffer)
   * const packed = AudioSampleUtils.alloc(2, 1024, AV_SAMPLE_FMT_S16, 0);
   * console.log(`Packed: ${packed.data.length} buffer`);  // 1 buffer
   * ```
   */
  static alloc(nbChannels: number, nbSamples: number, sampleFmt: AVSampleFormat, align: number): AudioSampleAllocation {
    const result = bindings.avSamplesAlloc(nbChannels, nbSamples, sampleFmt, align);
    if (typeof result === 'number') {
      FFmpegError.throwIfError(result, 'Failed to allocate audio samples');
    }
    return result as AudioSampleAllocation;
  }

  /**
   * Get required buffer size for audio samples.
   *
   * Calculates the buffer size needed to store audio samples with the
   * given parameters. Does not allocate any memory.
   * Direct mapping to av_samples_get_buffer_size()
   *
   * @param nbChannels - Number of audio channels
   * @param nbSamples - Number of samples per channel
   * @param sampleFmt - Audio sample format
   * @param align - Buffer alignment (0 for default)
   * @returns Buffer size and line size information
   * @throws {FFmpegError} On invalid parameters
   *
   * @example
   * ```typescript
   * import { AudioSampleUtils } from '@seydx/av';
   * import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_S16P } from '@seydx/av/constants';
   *
   * // Calculate size for packed float (32-bit) stereo
   * const floatSize = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_FLT, 0);
   * console.log(`Float stereo: ${floatSize.size} bytes total`);
   * console.log(`Line size: ${floatSize.linesize} bytes`);
   *
   * // Calculate size for planar 16-bit stereo
   * const planarSize = AudioSampleUtils.getBufferSize(2, 1024, AV_SAMPLE_FMT_S16P, 0);
   * console.log(`S16 planar: ${planarSize.size} bytes total`);
   * console.log(`Per channel: ${planarSize.linesize} bytes`);
   * ```
   */
  static getBufferSize(nbChannels: number, nbSamples: number, sampleFmt: AVSampleFormat, align: number): AudioSampleBufferSize {
    const result = bindings.avSamplesGetBufferSize(nbChannels, nbSamples, sampleFmt, align);
    if (typeof result === 'number') {
      FFmpegError.throwIfError(result, 'Failed to get audio buffer size');
    }
    return result as AudioSampleBufferSize;
  }
}
