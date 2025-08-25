import { bindings } from './binding.js';

import type { AVFormatFlag } from './constants.js';
import type { NativeInputFormat, NativeIOContext, NativeWrapper } from './native-types.js';

/**
 * Input format (demuxer) descriptor.
 *
 * Describes a supported input container format for demuxing.
 * Provides format information like name, extensions, and capabilities.
 * These are read-only format descriptors managed by FFmpeg.
 *
 * Direct mapping to FFmpeg's AVInputFormat.
 *
 * @example
 * ```typescript
 * import { InputFormat, FormatContext, FFmpegError } from 'node-av';
 *
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
 * const ret = await ctx.openInput('video.dat', movFormat, null);
 * FFmpegError.throwIfError(ret, 'openInput');
 * ```
 *
 * @see {@link FormatContext} For using input formats
 * @see {@link OutputFormat} For output formats
 */
export class InputFormat implements NativeWrapper<NativeInputFormat> {
  private native: NativeInputFormat;

  /**
   * Constructor is internal - use static factory methods.
   *
   * InputFormats are obtained via static methods, not created directly.
   * FFmpeg manages these format descriptors internally.
   *
   * @internal
   *
   * @param native - Native AVInputFormat to wrap
   *
   * @example
   * ```typescript
   * import { InputFormat } from 'node-av';
   *
   * // Don't use constructor directly
   * // const format = new InputFormat(); // Wrong
   *
   * // Use static factory methods instead
   * const format = InputFormat.findInputFormat('mp4'); // Correct
   * ```
   */
  constructor(native: NativeInputFormat) {
    this.native = native;
  }

  /**
   * Find a registered input format with matching name.
   *
   * Searches FFmpeg's registered demuxers by short name.
   * Useful for forcing a specific format when auto-detection fails.
   *
   * Direct mapping to av_find_input_format()
   *
   * @param shortName - Short name of the format (e.g., 'mp4', 'mov', 'avi')
   *
   * @returns InputFormat if found, null otherwise
   *
   * @example
   * ```typescript
   * import { InputFormat, FormatContext, FFmpegError } from 'node-av';
   *
   * const format = InputFormat.findInputFormat('mp4');
   * if (format) {
   *   console.log(`Found: ${format.longName}`);
   * }
   *
   * // Force specific format when opening
   * const movFormat = InputFormat.findInputFormat('mov');
   * if (movFormat) {
   *   const ctx = new FormatContext();
   *   ctx.allocContext();
   *   const ret = await ctx.openInput('video.dat', movFormat, null);
   *   FFmpegError.throwIfError(ret, 'openInput');
   * }
   * ```
   */
  static findInputFormat(shortName: string): InputFormat | null {
    const native = bindings.InputFormat.findInputFormat(shortName);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  /**
   * Probe input format from buffer data.
   *
   * Attempts to detect the input format based on buffer contents.
   * This is a synchronous operation that analyzes buffer data to identify the format.
   *
   * Direct mapping to av_probe_input_format3()
   *
   * @param buffer - Buffer containing media data to probe
   * @param filename - Optional filename hint to aid detection
   *
   * @returns InputFormat if detected, null otherwise
   *
   * @example
   * ```typescript
   * import { InputFormat } from 'node-av';
   * import { readFileSync } from 'fs';
   *
   * // Read first few KB of a media file
   * const buffer = readFileSync('video.mp4', { length: 4096 });
   * const format = InputFormat.probe(buffer, 'video.mp4');
   *
   * if (format) {
   *   console.log(`Detected format: ${format.longName}`);
   * }
   * ```
   */
  static probe(buffer: Buffer, filename?: string): InputFormat | null {
    const native = bindings.InputFormat.probe(buffer, filename);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  /**
   * Probe input format from IOContext buffer.
   *
   * Attempts to detect the input format by reading from an IOContext.
   * This is an asynchronous operation that reads data from the IOContext to identify the format.
   * The IOContext position may be changed during probing.
   *
   * Direct mapping to av_probe_input_buffer2()
   *
   * @param ioContext - IOContext to read data from for probing
   * @param maxProbeSize - Maximum bytes to read for probing (0 for default)
   *
   * @returns Promise resolving to InputFormat if detected, null otherwise
   *
   * @example
   * ```typescript
   * import { InputFormat, IOContext } from 'node-av';
   *
   * // Open an IOContext
   * const io = new IOContext();
   * await io.open2('video.mp4', AVIO_FLAG_READ);
   *
   * // Probe the format
   * const format = await InputFormat.probeBuffer(io);
   *
   * if (format) {
   *   console.log(`Detected format: ${format.longName}`);
   * }
   *
   * await io.closep();
   * ```
   */
  static async probeBuffer(ioContext: { getNative(): NativeIOContext }, maxProbeSize?: number): Promise<InputFormat | null> {
    const native = await bindings.InputFormat.probeBuffer(ioContext.getNative(), maxProbeSize);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

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
