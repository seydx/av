import { bindings } from './binding.js';

import type { AVSampleFormat } from '../constants/constants.js';
import type { NativeAudioFifo, NativeWrapper } from './native-types.js';

/**
 * Audio FIFO (First-In-First-Out) buffer for managing audio samples.
 *
 * Provides a thread-safe buffer for audio sample data, supporting both planar and interleaved formats.
 * Automatically handles buffer reallocation when needed. Essential for audio resampling,
 * format conversion, and buffering operations.
 *
 * Direct mapping to FFmpeg's AVAudioFifo.
 *
 * @example
 * ```typescript
 * import { AudioFifo, FFmpegError } from 'node-av';
 * import { AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * // Create FIFO for stereo float planar audio
 * const fifo = new AudioFifo();
 * fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
 *
 * // Write samples
 * const leftChannel = Buffer.alloc(1024 * 4);  // 1024 float samples
 * const rightChannel = Buffer.alloc(1024 * 4);
 * const written = await fifo.write([leftChannel, rightChannel], 1024);
 * FFmpegError.throwIfError(written, 'write');
 *
 * // Read samples when enough available
 * if (fifo.size >= 512) {
 *   const outLeft = Buffer.alloc(512 * 4);
 *   const outRight = Buffer.alloc(512 * 4);
 *   const read = await fifo.read([outLeft, outRight], 512);
 *   FFmpegError.throwIfError(read, 'read');
 * }
 *
 * // Cleanup
 * fifo.free();
 * ```
 *
 * @see [AudioFifo](https://ffmpeg.org/doxygen/trunk/structAVAudioFifo.html) - FFmpeg Doxygen
 */
export class AudioFifo implements Disposable, NativeWrapper<NativeAudioFifo> {
  private native: NativeAudioFifo;

  constructor() {
    this.native = new bindings.AudioFifo();
  }

  /**
   * Number of samples currently in the FIFO.
   *
   * Direct mapping to av_audio_fifo_size().
   */
  get size(): number {
    return this.native.size;
  }

  /**
   * Number of samples that can be written without reallocation.
   *
   * Direct mapping to av_audio_fifo_space().
   */
  get space(): number {
    return this.native.space;
  }

  /**
   * Allocate an AVAudioFifo buffer.
   *
   * Creates a FIFO buffer for the specified audio format and size.
   * The FIFO will automatically grow if more data is written than allocated.
   *
   * Direct mapping to av_audio_fifo_alloc().
   *
   * @param sampleFmt - Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP)
   *
   * @param channels - Number of audio channels
   *
   * @param nbSamples - Initial buffer size in samples
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * import { AudioFifo } from 'node-av';
   * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
   *
   * // For interleaved 16-bit stereo
   * const fifo1 = new AudioFifo();
   * fifo1.alloc(AV_SAMPLE_FMT_S16, 2, 4096);
   *
   * // For planar float 5.1 audio
   * const fifo2 = new AudioFifo();
   * fifo2.alloc(AV_SAMPLE_FMT_FLTP, 6, 8192);
   * ```
   *
   * @see {@link realloc} To resize the FIFO
   * @see {@link free} To release the FIFO
   */
  alloc(sampleFmt: AVSampleFormat, channels: number, nbSamples: number): void {
    this.native.alloc(sampleFmt, channels, nbSamples);
  }

  /**
   * Free the FIFO buffer and all associated resources.
   *
   * After calling this, the FIFO is invalid and must be reallocated before use.
   *
   * Direct mapping to av_audio_fifo_free().
   *
   * @example
   * ```typescript
   * fifo.free();
   * // FIFO is now invalid, must call alloc() before using again
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   * @see {@link alloc} To allocate
   */
  free(): void {
    this.native.free();
  }

  /**
   * Write audio samples to the FIFO.
   *
   * Writes samples to the FIFO buffer. Automatically reallocates if more space is needed.
   * For planar formats, provide an array of buffers (one per channel).
   * For interleaved formats, provide a single buffer.
   *
   * Direct mapping to av_audio_fifo_write().
   *
   * @param data - Audio data buffer(s). Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Number of samples to write
   *
   * @returns Number of samples written, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Planar format (e.g., FLTP) - separate buffers per channel
   * const leftData = Buffer.alloc(1024 * 4);  // 1024 float samples
   * const rightData = Buffer.alloc(1024 * 4);
   * const written = await fifo.write([leftData, rightData], 1024);
   * FFmpegError.throwIfError(written, 'write');
   * console.log(`Wrote ${written} samples`);
   *
   * // Interleaved format (e.g., S16) - single buffer
   * const interleavedData = Buffer.alloc(1024 * 2 * 2);  // 1024 stereo S16 samples
   * const written2 = await fifo.write(interleavedData, 1024);
   * FFmpegError.throwIfError(written2, 'write');
   * ```
   *
   * @see {@link read} To retrieve samples from FIFO
   * @see {@link space} To check available space
   */
  async write(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return await this.native.write(data, nbSamples);
  }

  /**
   * Write samples to the FIFO synchronously.
   * Synchronous version of write.
   *
   * Adds audio samples to the FIFO buffer.
   * The FIFO automatically handles format and layout conversions.
   * Can write fewer samples than requested if space is limited.
   *
   * Direct mapping to av_audio_fifo_write().
   *
   * @param data - Audio data buffer(s). Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Number of samples to write per channel
   *
   * @returns Number of samples written, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Interleaved stereo data (2 channels * 1024 samples * 4 bytes)
   * const buffer = Buffer.alloc(2 * 1024 * 4);
   * // Fill with audio data...
   *
   * const written = fifo.writeSync(buffer, 1024);
   * FFmpegError.throwIfError(written, 'writeSync');
   * console.log(`Wrote ${written} samples`);
   * ```
   *
   * @see {@link write} For async version
   */
  writeSync(data: Buffer | Buffer[], nbSamples: number): number {
    return this.native.writeSync(data, nbSamples);
  }

  /**
   * Read and remove samples from the FIFO.
   *
   * Reads up to the specified number of samples from the FIFO.
   * The samples are removed from the FIFO after reading.
   * Buffers must be pre-allocated with sufficient size.
   *
   * Direct mapping to av_audio_fifo_read().
   *
   * @param data - Pre-allocated buffer(s) to read into. Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Maximum number of samples to read
   *
   * @returns Number of samples read, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Check available samples
   * const available = fifo.size;
   * if (available >= 1024) {
   *   // Planar format
   *   const leftOut = Buffer.alloc(1024 * 4);
   *   const rightOut = Buffer.alloc(1024 * 4);
   *   const read = await fifo.read([leftOut, rightOut], 1024);
   *   FFmpegError.throwIfError(read, 'read');
   *   console.log(`Read ${read} samples`);
   * }
   * ```
   *
   * @see {@link peek} To read without removing
   * @see {@link size} To check available samples
   */
  async read(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return await this.native.read(data, nbSamples);
  }

  /**
   * Read and remove samples from the FIFO synchronously.
   * Synchronous version of read.
   *
   * Reads up to the specified number of samples from the FIFO.
   * The samples are removed from the FIFO after reading.
   * Buffers must be pre-allocated with sufficient size.
   *
   * Direct mapping to av_audio_fifo_read().
   *
   * @param data - Pre-allocated buffer(s) to read into. Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Maximum number of samples to read
   *
   * @returns Number of samples read, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Read up to 1024 samples
   * const readBuffer = Buffer.alloc(2 * 1024 * 4); // stereo float32
   * const read = fifo.readSync(readBuffer, 1024);
   * FFmpegError.throwIfError(read, 'readSync');
   *
   * console.log(`Read ${read} samples from FIFO`);
   * console.log(`FIFO now has ${fifo.size} samples remaining`);
   * ```
   *
   * @see {@link read} For async version
   */
  readSync(data: Buffer | Buffer[], nbSamples: number): number {
    return this.native.readSync(data, nbSamples);
  }

  /**
   * Read samples from the FIFO without removing them.
   *
   * Similar to read() but leaves the samples in the FIFO.
   * Useful for inspecting upcoming data without consuming it.
   *
   * Direct mapping to av_audio_fifo_peek().
   *
   * @param data - Pre-allocated buffer(s) to peek into. Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Maximum number of samples to peek
   *
   * @returns Number of samples peeked, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Peek at next samples without removing them
   * const peekBuffer = Buffer.alloc(256 * 4);
   * const peeked = await fifo.peek(peekBuffer, 256);
   * FFmpegError.throwIfError(peeked, 'peek');
   *
   * // Samples are still in FIFO
   * console.log(`FIFO still has ${fifo.size} samples`);
   * ```
   *
   * @see {@link read} To read and remove samples
   */
  async peek(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return await this.native.peek(data, nbSamples);
  }

  /**
   * Read samples from the FIFO without removing them synchronously.
   * Synchronous version of peek.
   *
   * Similar to readSync() but leaves the samples in the FIFO.
   * Useful for inspecting upcoming data without consuming it.
   *
   * Direct mapping to av_audio_fifo_peek().
   *
   * @param data - Pre-allocated buffer(s) to peek into. Array for planar, single Buffer for interleaved
   *
   * @param nbSamples - Maximum number of samples to peek
   *
   * @returns Number of samples peeked, or negative AVERROR:
   *   - AVERROR_EINVAL: Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Peek at next samples without removing them
   * const peekBuffer = Buffer.alloc(256 * 4);
   * const peeked = fifo.peekSync(peekBuffer, 256);
   * FFmpegError.throwIfError(peeked, 'peekSync');
   *
   * // Samples are still in FIFO
   * console.log(`FIFO still has ${fifo.size} samples`);
   * ```
   *
   * @see {@link peek} For async version
   */
  peekSync(data: Buffer | Buffer[], nbSamples: number): number {
    return this.native.peekSync(data, nbSamples);
  }

  /**
   * Remove samples from the FIFO without reading them.
   *
   * Discards the specified number of samples from the FIFO.
   * Useful for skipping unwanted audio data.
   *
   * Direct mapping to av_audio_fifo_drain().
   *
   * @param nbSamples - Number of samples to discard
   *
   * @example
   * ```typescript
   * // Skip 100 samples
   * fifo.drain(100);
   * console.log(`FIFO now has ${fifo.size} samples`);
   * ```
   *
   * @see {@link reset} To remove all samples
   */
  drain(nbSamples: number): void {
    this.native.drain(nbSamples);
  }

  /**
   * Remove all samples from the FIFO.
   *
   * Empties the FIFO buffer without deallocating it.
   * The FIFO remains allocated and ready for new data.
   *
   * Direct mapping to av_audio_fifo_reset().
   *
   * @example
   * ```typescript
   * fifo.reset();
   * console.log(fifo.size);  // 0
   * console.log(fifo.space); // Original allocation size
   * ```
   *
   * @see {@link drain} To remove specific number of samples
   */
  reset(): void {
    this.native.reset();
  }

  /**
   * Resize the FIFO buffer.
   *
   * Changes the allocated size of the FIFO. Can grow or shrink the buffer.
   * Existing samples are preserved up to the new size.
   *
   * Direct mapping to av_audio_fifo_realloc().
   *
   * @param nbSamples - New allocation size in samples
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid size
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Grow FIFO to handle larger buffers
   * const ret = fifo.realloc(16384);
   * FFmpegError.throwIfError(ret, 'realloc');
   * console.log(`New space: ${fifo.space} samples`);
   * ```
   *
   * @see {@link alloc} For initial allocation
   */
  realloc(nbSamples: number): number {
    return this.native.realloc(nbSamples);
  }

  /**
   * Get the underlying native AudioFifo object.
   *
   * @returns The native AudioFifo binding object
   *
   * @internal
   */
  getNative(): NativeAudioFifo {
    return this.native;
  }

  /**
   * Dispose of the audio FIFO buffer.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using fifo = new AudioFifo();
   *   fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
   *   // Use fifo...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
