import { bindings } from './binding.js';
import type { AVCodecID, AVFormatFlags } from './constants.js';

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
 * OutputFormat represents a muxer in FFmpeg
 * Used to write media files
 */
export class OutputFormat {
  private native: any;

  private constructor(native: any) {
    this.native = native;
  }

  /**
   * Find an output format by name
   * @param name Format short name (e.g., 'mp4', 'mov', 'avi')
   * @returns OutputFormat instance or null if not found
   */
  static find(name: string): OutputFormat | null {
    const native = bindings.OutputFormat.find(name);
    return native ? new OutputFormat(native) : null;
  }

  /**
   * Guess output format based on filename, MIME type, or short name
   * @param options Options for guessing format
   * @returns OutputFormat instance or null if no match found
   */
  static guess(options: GuessFormatOptions = {}): OutputFormat | null {
    const native = bindings.OutputFormat.guess(options);
    return native ? new OutputFormat(native) : null;
  }

  /**
   * Get all available output formats
   * @returns Array of all available OutputFormat instances
   */
  static getAll(): OutputFormat[] {
    const natives = bindings.OutputFormat.getAll();
    return natives.map((native: any) => new OutputFormat(native));
  }

  /**
   * Create from native handle (internal use)
   */
  static fromNative(native: any): OutputFormat {
    return new OutputFormat(native);
  }

  /**
   * Format short name
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Format long descriptive name
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * Format flags (combination of AV_FMT_* flags)
   */
  get flags(): AVFormatFlags {
    return this.native.flags as AVFormatFlags;
  }

  /**
   * File extensions associated with this format
   * @returns Array of extensions or null
   */
  get extensions(): string[] | null {
    return this.native.extensions;
  }

  /**
   * MIME type associated with this format
   */
  get mimeType(): string | null {
    return this.native.mimeType;
  }

  /**
   * Default audio codec for this format
   */
  get audioCodec(): AVCodecID {
    return this.native.audioCodec as AVCodecID;
  }

  /**
   * Default video codec for this format
   */
  get videoCodec(): AVCodecID {
    return this.native.videoCodec as AVCodecID;
  }

  /**
   * Default subtitle codec for this format
   */
  get subtitleCodec(): AVCodecID {
    return this.native.subtitleCodec as AVCodecID;
  }

  /**
   * Check if format has a specific flag
   * @param flag AVFormatFlags constant
   */
  hasFlag(flag: AVFormatFlags): boolean {
    return (this.flags & flag) !== 0;
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
   * Get string representation
   */
  toString(): string {
    return this.name ?? 'unknown';
  }

  /**
   * Get native handle (internal use)
   */
  getNative(): any {
    return this.native;
  }
}
