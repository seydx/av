import { bindings } from './binding.js';

import type { AVCodecID, AVFormatFlags } from './constants.js';
import type { NativeOutputFormat, NativeWrapper } from './native-types.js';

/**
 * Options for guessing output format
 */
export interface GuessFormatOptions {
  /** Format short name (e.g., 'mp4') */
  shortName?: string;
  /** Output filename to guess from extension */
  filename?: string;
  /** MIME type to match */
  mimeType?: string;
}

/**
 * Output format (muxer) for writing media files
 *
 * OutputFormat represents a muxer that can write specific container
 * formats. Each format handles specific file types like MP4, MKV, AVI, etc.
 * and defines default codecs for audio, video, and subtitles.
 *
 * @example
 * ```typescript
 * // Find a specific output format
 * const mp4Format = OutputFormat.find('mp4');
 * if (mp4Format) {
 *   console.log(`Format: ${mp4Format.longName}`);
 *   console.log(`Default video codec: ${mp4Format.videoCodec}`);
 *   console.log(`Default audio codec: ${mp4Format.audioCodec}`);
 * }
 *
 * // Guess format from filename
 * const format = OutputFormat.guess({ filename: 'output.mp4' });
 *
 * // Use with FormatContext
 * const context = new FormatContext('output', format, null, 'output.mp4');
 * ```
 */
export class OutputFormat implements NativeWrapper<NativeOutputFormat> {
  private native: NativeOutputFormat; // Native output format binding

  /**
   * Create an OutputFormat wrapper
   * @param native Native output format object
   * @internal
   */
  private constructor(native: NativeOutputFormat) {
    this.native = native;
  }

  /**
   * Find an output format by name
   * @param name Format short name (e.g., 'mp4', 'mov', 'avi')
   * @returns OutputFormat instance or null if not found
   * @example
   * ```typescript
   * const format = OutputFormat.find('mp4');
   * if (format) {
   *   console.log(`Found format: ${format.longName}`);
   * }
   * ```
   */
  static find(name: string): OutputFormat | null {
    try {
      const native = bindings.OutputFormat.find(name);
      return native ? new OutputFormat(native) : null;
    } catch (error) {
      console.warn(`Failed to find output format '${name}':`, error);
      return null;
    }
  }

  /**
   * Guess output format based on filename, MIME type, or short name
   * @param options Options for guessing format
   * @returns OutputFormat instance or null if no match found
   * @example
   * ```typescript
   * // Guess from filename extension
   * const format = OutputFormat.guess({ filename: 'output.mp4' });
   *
   * // Guess from MIME type
   * const webmFormat = OutputFormat.guess({ mimeType: 'video/webm' });
   *
   * // Specify short name directly
   * const mkvFormat = OutputFormat.guess({ shortName: 'matroska' });
   * ```
   */
  static guess(options: GuessFormatOptions = {}): OutputFormat | null {
    try {
      const native = bindings.OutputFormat.guess(options);
      return native ? new OutputFormat(native) : null;
    } catch (error) {
      console.warn('Failed to guess output format:', error);
      return null;
    }
  }

  /**
   * Get all available output formats
   * @returns Array of all available OutputFormat instances
   * @example
   * ```typescript
   * const formats = OutputFormat.getAll();
   * console.log(`Available formats: ${formats.length}`);
   * for (const format of formats) {
   *   console.log(`${format.name}: ${format.longName}`);
   * }
   * ```
   */
  static getAll(): OutputFormat[] {
    try {
      const natives = bindings.OutputFormat.getAll();
      return natives.map((native) => new OutputFormat(native));
    } catch (error) {
      console.warn('Failed to get all output formats:', error);
      return [];
    }
  }

  /**
   * Create from native handle
   * @internal
   */
  static fromNative(native: NativeOutputFormat): OutputFormat {
    return new OutputFormat(native);
  }

  /**
   * Get format short name
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Get format long descriptive name
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * Get format flags (combination of AV_FMT_* flags)
   */
  get flags(): AVFormatFlags {
    return this.native.flags;
  }

  /**
   * Get file extensions associated with this format
   * @returns Array of extensions or null
   */
  get extensions(): string[] | null {
    return this.native.extensions;
  }

  /**
   * Get MIME type associated with this format
   */
  get mimeType(): string | null {
    return this.native.mimeType;
  }

  /**
   * Get default audio codec for this format
   */
  get audioCodec(): AVCodecID {
    return this.native.audioCodec;
  }

  /**
   * Get default video codec for this format
   */
  get videoCodec(): AVCodecID {
    return this.native.videoCodec;
  }

  /**
   * Get default subtitle codec for this format
   */
  get subtitleCodec(): AVCodecID {
    return this.native.subtitleCodec;
  }

  /**
   * Check if format needs a file (false for streaming formats)
   */
  get needsFile(): boolean {
    // Check if AVFMT_NOFILE flag is NOT set
    return (this.flags & 0x0001) === 0; // AVFMT_NOFILE = 0x0001
  }

  /**
   * Check if format supports global headers
   */
  get supportsGlobalHeader(): boolean {
    return (this.flags & 0x0040) !== 0; // AVFMT_GLOBALHEADER = 0x0040
  }

  /**
   * Check if format has a specific flag
   * @param flag AVFormatFlags constant
   * @returns true if the format has the flag
   * @example
   * ```typescript
   * if (format.hasFlag(AVFMT_NOFILE)) {
   *   console.log('Format does not require file I/O');
   * }
   * ```
   */
  hasFlag(flag: AVFormatFlags): boolean {
    return (this.flags & flag) !== 0;
  }

  /**
   * Get string representation
   * @returns Format name or 'unknown'
   */
  toString(): string {
    return this.name ?? 'unknown';
  }

  /**
   * Get native output format for internal use
   * @internal
   */
  getNative(): NativeOutputFormat {
    return this.native;
  }
}
