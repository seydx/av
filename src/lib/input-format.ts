import { bindings } from './binding.js';

import type { AVFormatFlag } from '../constants/constants.js';
import type { NativeInputFormat, NativeIOContext, NativeWrapper } from './native-types.js';

/**
 * Input format descriptor for demuxing media files.
 *
 * Represents a demuxer that can read and parse specific media container formats.
 * Each format handles specific file types (e.g., MP4, MKV, AVI) and knows how to
 * extract streams and packets from them. Used to identify and open media files
 * for reading.
 *
 * Direct mapping to FFmpeg's AVInputFormat.
 *
 * @example
 * ```typescript
 * import { InputFormat, FormatContext, FFmpegError } from 'node-av';
 *
 * // Find format by name
 * const mp4Format = InputFormat.findInputFormat('mp4');
 * if (mp4Format) {
 *   console.log(`Format: ${mp4Format.name}`);
 *   console.log(`Description: ${mp4Format.longName}`);
 *   console.log(`Extensions: ${mp4Format.extensions}`);
 * }
 *
 * // Probe format from file data
 * const fileData = Buffer.from([...]); // First few KB of file
 * const detectedFormat = InputFormat.probe(fileData, 'video.mp4');
 * if (detectedFormat) {
 *   console.log(`Detected: ${detectedFormat.name}`);
 * }
 *
 * // Use with format context
 * const formatContext = new FormatContext();
 * formatContext.inputFormat = mp4Format;
 * const ret = await formatContext.openInput('video.mp4');
 * FFmpegError.throwIfError(ret, 'openInput');
 * ```
 *
 * @see [AVInputFormat](https://ffmpeg.org/doxygen/trunk/structAVInputFormat.html) - FFmpeg Doxygen
 * @see {@link FormatContext} For using formats to open files
 * @see {@link OutputFormat} For muxing formats
 */
export class InputFormat implements NativeWrapper<NativeInputFormat> {
  private native: NativeInputFormat;

  /**
   * @param native - The native input format instance
   * @internal
   */
  constructor(native: NativeInputFormat) {
    this.native = native;
  }

  /**
   * Find input format by short name.
   *
   * Searches for a demuxer by its short name identifier.
   *
   * Direct mapping to av_find_input_format().
   *
   * @param shortName - Format short name (e.g., 'mp4', 'mkv', 'avi')
   * @returns Input format if found, null otherwise
   *
   * @example
   * ```typescript
   * // Find specific formats
   * const mp4 = InputFormat.findInputFormat('mp4');
   * const mkv = InputFormat.findInputFormat('matroska');
   * const avi = InputFormat.findInputFormat('avi');
   *
   * // Check if format is available
   * if (!mp4) {
   *   console.error('MP4 format not available');
   * }
   * ```
   *
   * @see {@link probe} To auto-detect format
   */
  static findInputFormat(shortName: string): InputFormat | null {
    const native = bindings.InputFormat.findInputFormat(shortName);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  /**
   * Probe format from buffer data.
   *
   * Analyzes buffer content to determine the media format.
   * Optionally uses filename for additional format hints.
   *
   * Direct mapping to av_probe_input_format2().
   *
   * @param buffer - Buffer containing file header/start
   * @param filename - Optional filename for format hints
   * @returns Detected format, or null if not recognized
   *
   * @example
   * ```typescript
   * import { readFileSync } from 'fs';
   *
   * // Read first 4KB for probing
   * const data = readFileSync('video.mp4').subarray(0, 4096);
   * const format = InputFormat.probe(data, 'video.mp4');
   *
   * if (format) {
   *   console.log(`Detected format: ${format.name}`);
   * } else {
   *   console.error('Unknown format');
   * }
   * ```
   *
   * @see {@link probeBuffer} For IO context probing
   * @see {@link findInputFormat} To get format by name
   */
  static probe(buffer: Buffer, filename?: string): InputFormat | null {
    const native = bindings.InputFormat.probe(buffer, filename);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  /**
   * Probe format from IO context.
   *
   * Reads data from an IO context to determine format.
   * Useful for custom IO scenarios and network streams.
   *
   * Direct mapping to av_probe_input_buffer2().
   *
   * @param ioContext - IO context to read from
   * @param ioContext.getNative - Method to get native IO context
   * @param maxProbeSize - Maximum bytes to read for probing
   * @returns Detected format, or null if not recognized
   *
   * @example
   * ```typescript
   * import { IOContext } from 'node-av';
   *
   * // Create custom IO context
   * const ioContext = new IOContext();
   * // ... configure IO context ...
   *
   * // Probe format
   * const format = await InputFormat.probeBuffer(ioContext, 32768);
   * if (format) {
   *   console.log(`Stream format: ${format.name}`);
   * }
   * ```
   *
   * @see {@link probe} For buffer probing
   */
  static async probeBuffer(ioContext: { getNative(): NativeIOContext }, maxProbeSize?: number): Promise<InputFormat | null> {
    const native = await bindings.InputFormat.probeBuffer(ioContext.getNative(), maxProbeSize);
    if (!native) {
      return null;
    }
    return new InputFormat(native);
  }

  /**
   * Format short name.
   *
   * Short identifier for the format (e.g., 'mp4', 'mkv').
   *
   * Direct mapping to AVInputFormat->name.
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Format long name.
   *
   * Human-readable description of the format.
   *
   * Direct mapping to AVInputFormat->long_name.
   */
  get longName(): string | null {
    return this.native.longName;
  }

  /**
   * File extensions.
   *
   * Comma-separated list of file extensions for this format.
   *
   * Direct mapping to AVInputFormat->extensions.
   */
  get extensions(): string | null {
    return this.native.extensions;
  }

  /**
   * MIME type.
   *
   * MIME type(s) associated with this format.
   *
   * Direct mapping to AVInputFormat->mime_type.
   */
  get mimeType(): string | null {
    return this.native.mimeType;
  }

  /**
   * Format flags.
   *
   * Combination of AVFMT_* flags indicating format capabilities.
   *
   * Direct mapping to AVInputFormat->flags.
   */
  get flags(): AVFormatFlag {
    return this.native.flags;
  }

  /**
   * Get the underlying native InputFormat object.
   *
   * @returns The native InputFormat binding object
   *
   * @internal
   */
  getNative(): NativeInputFormat {
    return this.native;
  }
}
