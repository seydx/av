import { bindings } from './binding.js';

import type { AVSampleFormat } from './constants.js';
import type { NativeAudioFifo, NativeWrapper } from './native-types.js';

/**
 * Audio FIFO buffer for sample management.
 *
 * Provides a first-in-first-out buffer for audio samples.
 * Supports both planar and interleaved audio formats.
 * Automatically handles reallocation when needed.
 *
 * Direct mapping to FFmpeg's AVAudioFifo.
 *
 * @example
 * ```typescript
 * import { AudioFifo, FFmpegError } from '@seydx/ffmpeg';
 * import { AV_SAMPLE_FMT_FLTP } from '@seydx/ffmpeg/constants';
 *
 * // Create audio FIFO for stereo float samples
 * const fifo = new AudioFifo();
 * fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
 *
 * // Write samples to FIFO
 * const samplesWritten = await fifo.write(inputBuffers, frameSize);
 * FFmpegError.throwIfError(samplesWritten, 'write');
 *
 * // Read samples from FIFO
 * const samplesRead = await fifo.read(outputBuffers, frameSize);
 * FFmpegError.throwIfError(samplesRead, 'read');
 *
 * // Check available samples
 * console.log(`Samples in FIFO: ${fifo.size}`);
 *
 * // Cleanup
 * fifo.free();
 * ```
 */
export class AudioFifo implements Disposable, NativeWrapper<NativeAudioFifo> {
  private native: NativeAudioFifo;

  // Constructor
  /**
   * Create a new audio FIFO buffer.
   *
   * The FIFO is uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVAudioFifo.
   *
   * @example
   * ```typescript
   * import { AudioFifo } from '@seydx/ffmpeg';
   * import { AV_SAMPLE_FMT_S16 } from '@seydx/ffmpeg/constants';
   *
   * const fifo = new AudioFifo();
   * fifo.alloc(AV_SAMPLE_FMT_S16, 2, 1024);
   * // FIFO is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.AudioFifo();
  }

  // Getter Properties

  /**
   * Get the current number of samples in the AVAudioFifo.
   *
   * Returns the number of samples currently buffered in the FIFO.
   *
   * Direct mapping to av_audio_fifo_size()
   *
   * @returns Number of samples currently in the FIFO
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * if (fifo.size >= frameSize) {
   *   // Enough samples available for a full frame
   *   const ret = await fifo.read(outputBuffer, frameSize);
   *   FFmpegError.throwIfError(ret, 'read');
   * }
   * ```
   *
   * @readonly
   */
  get size(): number {
    return this.native.size;
  }

  /**
   * Get the available space in the AVAudioFifo.
   *
   * Returns the number of samples that can be written without reallocation.
   *
   * Direct mapping to av_audio_fifo_space()
   *
   * @returns Number of samples that can be written to the FIFO
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * if (fifo.space >= frameSize) {
   *   // Enough space for a full frame
   *   const ret = await fifo.write(inputBuffer, frameSize);
   *   FFmpegError.throwIfError(ret, 'write');
   * }
   * ```
   *
   * @readonly
   */
  get space(): number {
    return this.native.space;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an AVAudioFifo.
   *
   * Allocates a FIFO buffer for the specified audio format and size.
   * The FIFO will automatically grow if more data is written than allocated.
   *
   * Direct mapping to av_audio_fifo_alloc()
   *
   * @param sampleFmt - Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP)
   * @param channels - Number of channels
   * @param nbSamples - Initial allocation size, in samples
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { AudioFifo } from '@seydx/ffmpeg';
   * import { AV_SAMPLE_FMT_FLTP } from '@seydx/ffmpeg/constants';
   *
   * const fifo = new AudioFifo();
   * fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
   * // FIFO can now hold up to 4096 stereo float samples
   * ```
   *
   * @see {@link realloc} To resize the FIFO
   */
  alloc(sampleFmt: AVSampleFormat, channels: number, nbSamples: number): void {
    this.native.alloc(sampleFmt, channels, nbSamples);
  }

  /**
   * Free an AVAudioFifo.
   *
   * Frees the FIFO buffer and all associated resources.
   * The FIFO object becomes invalid after this call.
   *
   * Direct mapping to av_audio_fifo_free()
   *
   * @example
   * ```typescript
   * fifo.free();
   * // FIFO is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  // Public Methods - I/O Operations (Async)

  /**
   * Write data to an AVAudioFifo.
   *
   * Writes audio samples to the FIFO buffer.
   * Automatically reallocates the FIFO if more space is needed.
   *
   * Direct mapping to av_audio_fifo_write()
   *
   * @param data - Audio buffer(s) to write from.
   *               For planar formats: array of buffers (one per channel).
   *               For interleaved formats: single buffer.
   * @param nbSamples - Number of samples to write
   *
   * @returns Number of samples actually written, or negative AVERROR on error:
   *   - >=0: Number of samples written
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * // Planar format (separate buffers per channel)
   * const leftChannel = Buffer.alloc(frameSize * 4);  // float32
   * const rightChannel = Buffer.alloc(frameSize * 4);
   * const written = await fifo.write([leftChannel, rightChannel], frameSize);
   * FFmpegError.throwIfError(written, 'write');
   *
   * // Interleaved format (single buffer)
   * const interleavedBuffer = Buffer.alloc(frameSize * 2 * 2); // stereo s16
   * const written2 = await fifo.write(interleavedBuffer, frameSize);
   * FFmpegError.throwIfError(written2, 'write');
   * ```
   *
   * @see {@link read} To read samples from FIFO
   */
  async write(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.write(data, nbSamples);
  }

  /**
   * Read data from an AVAudioFifo.
   *
   * Reads and removes samples from the FIFO buffer.
   * Reads up to nb_samples or the available amount, whichever is less.
   *
   * Direct mapping to av_audio_fifo_read()
   *
   * @param data - Audio buffer(s) to read into.
   *               For planar formats: array of buffers (one per channel).
   *               For interleaved formats: single buffer.
   *               Buffers must be pre-allocated with sufficient size.
   * @param nbSamples - Number of samples to read
   *
   * @returns Number of samples actually read, or negative AVERROR on error:
   *   - >=0: Number of samples read
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * // Planar format (separate buffers per channel)
   * const leftChannel = Buffer.alloc(frameSize * 4);  // float32
   * const rightChannel = Buffer.alloc(frameSize * 4);
   * const read = await fifo.read([leftChannel, rightChannel], frameSize);
   * FFmpegError.throwIfError(read, 'read');
   *
   * // Interleaved format (single buffer)
   * const interleavedBuffer = Buffer.alloc(frameSize * 2 * 2); // stereo s16
   * const read2 = await fifo.read(interleavedBuffer, frameSize);
   * FFmpegError.throwIfError(read2, 'read');
   * ```
   *
   * @see {@link peek} To read without removing
   * @see {@link write} To write samples to FIFO
   */
  async read(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.read(data, nbSamples);
  }

  /**
   * Peek data from an AVAudioFifo.
   *
   * Reads samples from the FIFO without removing them.
   * Useful for inspecting upcoming data.
   *
   * Direct mapping to av_audio_fifo_peek()
   *
   * @param data - Audio buffer(s) to peek into.
   *               For planar formats: array of buffers (one per channel).
   *               For interleaved formats: single buffer.
   *               Buffers must be pre-allocated.
   * @param nbSamples - Number of samples to peek
   *
   * @returns Number of samples actually peeked, or negative AVERROR on error:
   *   - >=0: Number of samples peeked
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * // Peek at next samples without removing them
   * const peekBuffer = Buffer.alloc(frameSize * 4);
   * const peeked = await fifo.peek(peekBuffer, frameSize);
   * FFmpegError.throwIfError(peeked, 'peek');
   * // Samples are still in FIFO after peek
   * ```
   *
   * @see {@link read} To read and remove samples
   */
  async peek(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.peek(data, nbSamples);
  }

  // Public Methods - Sync Operations

  /**
   * Remove samples from the FIFO without reading them.
   *
   * Discards the specified number of samples from the FIFO.
   * Useful for skipping unwanted audio data.
   *
   * Direct mapping to av_audio_fifo_drain()
   *
   * @param nbSamples - Number of samples to drain
   *
   * @example
   * ```typescript
   * // Skip next 100 samples
   * fifo.drain(100);
   * ```
   */
  drain(nbSamples: number): void {
    this.native.drain(nbSamples);
  }

  /**
   * Reset the AVAudioFifo buffer.
   *
   * Empties all data in the FIFO without deallocating the buffer.
   * The FIFO remains allocated and ready for use.
   *
   * Direct mapping to av_audio_fifo_reset()
   *
   * @example
   * ```typescript
   * fifo.reset();
   * // FIFO is now empty but still allocated
   * ```
   */
  reset(): void {
    this.native.reset();
  }

  /**
   * Reallocate an AVAudioFifo to a new size.
   *
   * Changes the size of the FIFO buffer.
   * Can be used to grow or shrink the buffer.
   *
   * Direct mapping to av_audio_fifo_realloc()
   *
   * @param nbSamples - New allocation size, in samples
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   *
   * // Increase FIFO capacity
   * const ret = fifo.realloc(8192);
   * FFmpegError.throwIfError(ret, 'realloc');
   * ```
   *
   * @see {@link alloc} For initial allocation
   */
  realloc(nbSamples: number): number {
    return this.native.realloc(nbSamples);
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVAudioFifo pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native AudioFifo object
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
   * import { AudioFifo } from '@seydx/ffmpeg';
   * import { AV_SAMPLE_FMT_S16 } from '@seydx/ffmpeg/constants';
   *
   * {
   *   using fifo = new AudioFifo();
   *   fifo.alloc(AV_SAMPLE_FMT_S16, 2, 1024);
   *   // ... use FIFO
   * } // Automatically freed when leaving scope
   * ```
   *
   * @see {@link free} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
