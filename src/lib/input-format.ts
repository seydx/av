import { bindings } from './binding.js';

import type { AVFormatFlags } from './constants.js';
import type { NativeInputFormat, NativeWrapper } from './native-types.js';

/**
 * Input format (demuxer) for reading media files
 *
 * InputFormat represents a demuxer that can read and parse specific
 * container formats. Each format handles specific file types like
 * MP4, MKV, AVI, etc.
 *
 * @example
 * ```typescript
 * // Find a specific input format
 * const mp4Format = InputFormat.find('mp4');
 * if (mp4Format) {
 *   console.log(`Format: ${mp4Format.longName}`);
 *   console.log(`Extensions: ${mp4Format.extensions?.join(', ')}`);
 * }
 *
 * // List all available formats
 * const formats = InputFormat.getAll();
 * for (const format of formats) {
 *   console.log(`${format.name}: ${format.longName}`);
 * }
 * ```
 */
export class InputFormat implements NativeWrapper<NativeInputFormat> {
  private native: NativeInputFormat; // Native input format binding

  /**
   * Create an InputFormat wrapper
   * @param native Native input format object
   * @internal
   */
  private constructor(native: NativeInputFormat) {
    this.native = native;
  }

  /**
   * Find an input format by name
   * @param name Format short name (e.g., 'mp4', 'mov', 'avi')
   * @returns InputFormat instance or null if not found
   * @example
   * ```typescript
   * const format = InputFormat.find('mp4');
   * if (format) {
   *   // Use format with FormatContext
   *   formatContext.openInput('file.mp4', format);
   * }
   * ```
   */
  static find(name: string): InputFormat | null {
    try {
      const native = bindings.InputFormat.find(name);
      return native ? new InputFormat(native) : null;
    } catch (error) {
      console.warn(`Failed to find input format '${name}':`, error);
      return null;
    }
  }

  /**
   * Get all available input formats
   * @returns Array of all available InputFormat instances
   * @example
   * ```typescript
   * const formats = InputFormat.getAll();
   * console.log(`Available formats: ${formats.length}`);
   * ```
   */
  static getAll(): InputFormat[] {
    try {
      const natives = bindings.InputFormat.getAll();
      return natives.map((native) => new InputFormat(native));
    } catch (error) {
      console.warn('Failed to get all input formats:', error);
      return [];
    }
  }

  /**
   * Create from native handle
   * @internal
   */
  static fromNative(native: NativeInputFormat): InputFormat {
    return new InputFormat(native);
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
   * Check if format has a specific flag
   * @param flag AVFormatFlags constant
   * @returns true if the format has the flag
   * @example
   * ```typescript
   * if (format.hasFlag(AV_FMT_NOFILE)) {
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
   * Get native input format for internal use
   * @internal
   */
  getNative(): NativeInputFormat {
    return this.native;
  }
}
