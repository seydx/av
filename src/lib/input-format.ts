import { bindings } from './binding.js';

import type { AVFormatFlag } from './constants.js';
import type { NativeInputFormat, NativeWrapper } from './native-types.js';

/**
 * FFmpeg Input Format (Demuxer) - Low Level API
 *
 * Direct mapping to FFmpeg's AVInputFormat.
 * Describes a supported input container format.
 * These are read-only format descriptors.
 *
 * @example
 * ```typescript
 * // Find a specific input format
 * const mp4Format = InputFormat.findInputFormat('mp4');
 * if (mp4Format) {
 *   console.log(`Format: ${mp4Format.longName}`);
 *   console.log(`Extensions: ${mp4Format.extensions}`);
 * }
 *
 * // Use with FormatContext
 * const ctx = new FormatContext();
 * ctx.allocContext();
 *
 * // Force a specific input format
 * const movFormat = InputFormat.findInputFormat('mov');
 * await ctx.openInput('video.dat', movFormat, null);
 * ```
 */
export class InputFormat implements NativeWrapper<NativeInputFormat> {
  private native: NativeInputFormat;

  // Constructor
  /**
   * Constructor is internal - use static factory methods.
   * InputFormats are obtained via static methods, not created directly.
   * @internal
   *
   * @example
   * ```typescript
   * // Don't use constructor directly
   * // const format = new InputFormat(); // ❌ Wrong
   *
   * // Use static factory methods instead
   * const format = InputFormat.findInputFormat('mp4'); // ✅ Correct
   * ```
   */
  constructor(native: NativeInputFormat) {
    this.native = native;
  }

  // Static Methods - Low Level API

  /**
   * Find a registered input format with matching name.
   *
   * Direct mapping to av_find_input_format()
   *
   * @param shortName - Short name of the format (e.g., 'mp4', 'mov', 'avi')
   *
   * @returns InputFormat if found, null otherwise
   *
   * @example
   * ```typescript
   * const format = InputFormat.findInputFormat('mp4');
   * if (format) {
   *   console.log(`Found: ${format.longName}`);
   * }
   *
   * // Force specific format when opening
   * const movFormat = InputFormat.findInputFormat('mov');
   * await ctx.openInput('video.dat', movFormat, null);
   * ```
   */
  static findInputFormat(shortName: string): InputFormat | null {
    const native = bindings.InputFormat.findInputFormat(shortName);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  // Getter Properties

  /**
   * A comma separated list of short names for the format.
   *
   * Direct mapping to AVInputFormat->name
   *
   * @readonly
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Descriptive name for the format.
   *
   * Direct mapping to AVInputFormat->long_name
   *
   * Meant to be more human-readable than the short name.
   * @readonly
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * Comma-separated list of file extensions.
   *
   * Direct mapping to AVInputFormat->extensions
   *
   * If extensions are defined, then no probe is done.
   * @readonly
   */
  get extensions(): string | null {
    return this.native.extensions;
  }

  /**
   * Comma-separated list of mime types.
   *
   * Direct mapping to AVInputFormat->mime_type
   *
   * @readonly
   */
  get mimeType(): string | null {
    return this.native.mimeType;
  }

  /**
   * Format flags.
   *
   * Direct mapping to AVInputFormat->flags
   *
   * Combination of AVFMT_* flags:
   * - AVFMT_NOFILE: No file is opened
   * - AVFMT_NEEDNUMBER: Needs '%d' in filename
   * - AVFMT_SHOW_IDS: Show format stream IDs
   * - AVFMT_GLOBALHEADER: Format wants global headers
   * - AVFMT_NOTIMESTAMPS: Format does not need/have timestamps
   * - AVFMT_GENERIC_INDEX: Use generic index building code
   * - AVFMT_TS_DISCONT: Format allows timestamp discontinuities
   * - AVFMT_NOBINSEARCH: Format does not allow seeking by bytes
   * - AVFMT_NOGENSEARCH: Format does not allow seeking by timestamp
   * - AVFMT_NO_BYTE_SEEK: Format does not allow seeking by bytes
   * - AVFMT_SEEK_TO_PTS: Seeking is based on PTS
   * @readonly
   */
  get flags(): AVFormatFlag {
    return this.native.flags;
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVInputFormat pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native input format object
   */
  getNative(): NativeInputFormat {
    return this.native;
  }
}
