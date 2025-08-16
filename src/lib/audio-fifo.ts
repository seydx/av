import { bindings } from './binding.js';

import type { AVSampleFormat } from './constants.js';
import type { NativeAudioFifo, NativeWrapper } from './native-types.js';

/**
 * FFmpeg audio FIFO buffer - Low Level API
 *
 * Direct mapping to FFmpeg's AVAudioFifo.
 * Provides a FIFO buffer for audio samples with support for different
 * sample formats including planar and interleaved layouts.
 * User has full control over allocation, configuration and lifecycle.
 *
 * @example
 * ```typescript
 * // Create audio FIFO for stereo float samples
 * const fifo = new AudioFifo();
 * fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
 *
 * // Write samples to FIFO
 * const samplesWritten = await fifo.write(inputBuffers, frameSize);
 *
 * // Read samples from FIFO
 * const samplesRead = await fifo.read(outputBuffers, frameSize);
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
   * Direct wrapper around AVAudioFifo.
   *
   * @example
   * ```typescript
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
   * Direct mapping to av_audio_fifo_size()
   *
   * @returns Number of samples currently in the FIFO
   *
   * @example
   * ```typescript
   * if (fifo.size >= frameSize) {
   *   // Enough samples available for a full frame
   *   await fifo.read(outputBuffer, frameSize);
   * }
   * ```
   */
  get size(): number {
    return this.native.size;
  }

  /**
   * Get the available space in the AVAudioFifo.
   *
   * Direct mapping to av_audio_fifo_space()
   *
   * @returns Number of samples that can be written to the FIFO
   *
   * @example
   * ```typescript
   * if (fifo.space >= frameSize) {
   *   // Enough space for a full frame
   *   await fifo.write(inputBuffer, frameSize);
   * }
   * ```
   */
  get space(): number {
    return this.native.space;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate an AVAudioFifo.
   *
   * Direct mapping to av_audio_fifo_alloc()
   *
   * @param sampleFmt - Sample format
   * @param channels - Number of channels
   * @param nbSamples - Initial allocation size, in samples
   *
   * @example
   * ```typescript
   * const fifo = new AudioFifo();
   * fifo.alloc(AV_SAMPLE_FMT_FLTP, 2, 4096);
   * // FIFO can now hold up to 4096 stereo float samples
   * ```
   *
   * @throws {Error} If allocation fails
   */
  alloc(sampleFmt: AVSampleFormat, channels: number, nbSamples: number): void {
    this.native.alloc(sampleFmt, channels, nbSamples);
  }

  /**
   * Free an AVAudioFifo.
   *
   * Direct mapping to av_audio_fifo_free()
   *
   * Frees the FIFO and all associated resources.
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
   * Direct mapping to av_audio_fifo_write()
   *
   * The write function will write up to nb_samples samples, depending on the
   * available space in the FIFO. The FIFO will be reallocated automatically
   * if needed.
   *
   * @param data - Audio buffer(s) to write from. For planar formats, provide
   *               an array of buffers (one per channel). For interleaved formats,
   *               provide a single buffer.
   * @param nbSamples - Number of samples to write
   *
   * @returns Number of samples actually written, or negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Planar format (separate buffers per channel)
   * const leftChannel = Buffer.alloc(frameSize * 4);  // float32
   * const rightChannel = Buffer.alloc(frameSize * 4);
   * const written = await fifo.write([leftChannel, rightChannel], frameSize);
   *
   * // Interleaved format (single buffer)
   * const interleavedBuffer = Buffer.alloc(frameSize * 2 * 2); // stereo s16
   * const written = await fifo.write(interleavedBuffer, frameSize);
   * ```
   */
  async write(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.write(data, nbSamples);
  }

  /**
   * Read data from an AVAudioFifo.
   *
   * Direct mapping to av_audio_fifo_read()
   *
   * Reads up to nb_samples samples from the FIFO to the supplied data buffer.
   *
   * @param data - Audio buffer(s) to read into. For planar formats, provide
   *               an array of buffers (one per channel). For interleaved formats,
   *               provide a single buffer. Buffers must be pre-allocated with
   *               sufficient size.
   * @param nbSamples - Number of samples to read
   *
   * @returns Number of samples actually read, or negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Planar format (separate buffers per channel)
   * const leftChannel = Buffer.alloc(frameSize * 4);  // float32
   * const rightChannel = Buffer.alloc(frameSize * 4);
   * const read = await fifo.read([leftChannel, rightChannel], frameSize);
   *
   * // Interleaved format (single buffer)
   * const interleavedBuffer = Buffer.alloc(frameSize * 2 * 2); // stereo s16
   * const read = await fifo.read(interleavedBuffer, frameSize);
   * ```
   */
  async read(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.read(data, nbSamples);
  }

  /**
   * Peek data from an AVAudioFifo.
   *
   * Direct mapping to av_audio_fifo_peek()
   *
   * Peek at samples in the FIFO without removing them.
   *
   * @param data - Audio buffer(s) to peek into. For planar formats, provide
   *               an array of buffers (one per channel). For interleaved formats,
   *               provide a single buffer. Buffers must be pre-allocated.
   * @param nbSamples - Number of samples to peek
   *
   * @returns Number of samples actually peeked, or negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Peek at next samples without removing them
   * const peekBuffer = Buffer.alloc(frameSize * 4);
   * const peeked = await fifo.peek(peekBuffer, frameSize);
   * // Samples are still in FIFO after peek
   * ```
   */
  async peek(data: Buffer | Buffer[], nbSamples: number): Promise<number> {
    return this.native.peek(data, nbSamples);
  }

  // Public Methods - Sync Operations

  /**
   * Remove samples from the FIFO without reading them.
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
   * Direct mapping to av_audio_fifo_reset()
   *
   * This empties all data in the FIFO.
   *
   * @example
   * ```typescript
   * fifo.reset();
   * // FIFO is now empty
   * ```
   */
  reset(): void {
    this.native.reset();
  }

  /**
   * Reallocate an AVAudioFifo to a new size.
   *
   * Direct mapping to av_audio_fifo_realloc()
   *
   * @param nbSamples - New allocation size, in samples
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Increase FIFO capacity
   * const ret = fifo.realloc(8192);
   * if (ret < 0) {
   *   throw new Error('Failed to reallocate FIFO');
   * }
   * ```
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
   * {
   *   using fifo = new AudioFifo();
   *   fifo.alloc(AV_SAMPLE_FMT_S16, 2, 1024);
   *   // ... use FIFO
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
