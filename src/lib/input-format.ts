import { bindings } from './binding.js';
import type { AVFormatFlags } from './constants.js';

/**
 * InputFormat represents a demuxer in FFmpeg
 * Used to read and parse media files
 */
export class InputFormat {
  private native: any;

  private constructor(native: any) {
    this.native = native;
  }

  /**
   * Find an input format by name
   * @param name Format short name (e.g., 'mp4', 'mov', 'avi')
   * @returns InputFormat instance or null if not found
   */
  static find(name: string): InputFormat | null {
    const native = bindings.InputFormat.find(name);
    return native ? new InputFormat(native) : null;
  }

  /**
   * Get all available input formats
   * @returns Array of all available InputFormat instances
   */
  static getAll(): InputFormat[] {
    const natives = bindings.InputFormat.getAll();
    return natives.map((native: any) => new InputFormat(native));
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
   * Check if format has a specific flag
   * @param flag AVFormatFlags constant
   */
  hasFlag(flag: AVFormatFlags): boolean {
    return (this.flags & flag) !== 0;
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
