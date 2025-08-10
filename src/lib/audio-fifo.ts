import { bindings } from './binding.js';

import type { AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeAudioFifo, NativeWrapper } from './native-types.js';

/**
 * Audio FIFO (First In First Out) Buffer
 *
 * AudioFifo provides buffering for audio data, allowing you to write
 * and read audio samples in different sized chunks. This is useful
 * for handling audio data when the input and output have different
 * frame sizes.
 *
 * @example
 * ```typescript
 * // Create a FIFO buffer for audio processing
 * const fifo = new AudioFifo(AV_SAMPLE_FMT_FLTP, 2, 1024);
 *
 * // Write samples from frame
 * fifo.write(inputFrame);
 *
 * // Read samples when enough available
 * if (fifo.size >= outputFrameSize) {
 *   fifo.read(outputFrame);
 * }
 * ```
 */
export class AudioFifo implements Disposable, NativeWrapper<NativeAudioFifo> {
  private fifo: NativeAudioFifo; // Native audio FIFO binding

  // ==================== Constructor ====================

  /**
   * Allocate a new audio FIFO buffer
   * @param sampleFormat Sample format of the audio data
   * @param channels Number of audio channels
   * @param nbSamples Initial buffer size in samples
   * @throws Error if allocation fails
   */
  constructor(sampleFormat: AVSampleFormat, channels: number, nbSamples: number) {
    this.fifo = new bindings.AudioFifo(sampleFormat, channels, nbSamples);
    if (!this.fifo) {
      throw new Error('Failed to allocate audio FIFO');
    }
  }

  // ==================== Getters/Setters ====================

  /**
   * Get the number of samples currently in the FIFO
   * @returns Number of samples available for reading
   */
  get size(): number {
    return this.fifo.size();
  }

  /**
   * Get the available space in samples
   * @returns Number of samples that can be written
   */
  get space(): number {
    return this.fifo.space();
  }

  // ==================== Public Methods ====================

  /**
   * Reallocate the FIFO buffer to a new size
   * @param nbSamples New buffer size in samples
   */
  realloc(nbSamples: number): void {
    this.fifo.realloc(nbSamples);
  }

  /**
   * Write samples from a frame to the FIFO
   * @param frame Frame containing audio samples to write
   * @returns Number of samples written
   */
  write(frame: Frame): number {
    return this.fifo.write(frame.getNative());
  }

  /**
   * Read samples from the FIFO into a frame
   * @param frame Frame to read samples into
   * @returns Number of samples read
   */
  read(frame: Frame): number {
    return this.fifo.read(frame.getNative());
  }

  /**
   * Free the audio FIFO and release resources
   */
  free(): void {
    this.fifo.free();
  }

  /**
   * Dispose of the audio FIFO and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  // ==================== Internal Methods ====================

  /**
   * Get the native FIFO object for internal use
   * @internal
   */
  getNative(): NativeAudioFifo {
    return this.fifo;
  }
}
