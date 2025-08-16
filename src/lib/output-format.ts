import { bindings } from './binding.js';

import type { AVCodecID, AVFormatFlag } from './constants.js';
import type { NativeOutputFormat, NativeWrapper } from './native-types.js';

/**
 * Output format (muxer) descriptor.
 *
 * Describes a supported output container format for muxing.
 * Provides format information, default codecs, and capabilities.
 * These are read-only format descriptors managed by FFmpeg.
 *
 * Direct mapping to FFmpeg's AVOutputFormat.
 *
 * @example
 * ```typescript
 * import { OutputFormat, FormatContext, FFmpegError } from '@seydx/ffmpeg';
 *
 * // Guess output format from filename
 * const format = OutputFormat.guessFormat(null, 'output.mp4', null);
 * if (format) {
 *   console.log(`Format: ${format.longName}`);
 *   console.log(`Default video codec: ${format.videoCodec}`);
 *   console.log(`Default audio codec: ${format.audioCodec}`);
 * }
 *
 * // Use with FormatContext
 * const ctx = new FormatContext();
 * const mp4Format = OutputFormat.guessFormat('mp4', null, null);
 * const ret = ctx.allocOutputContext2(mp4Format, null, 'output.mp4');
 * FFmpegError.throwIfError(ret, 'allocOutputContext2');
 * ```
 *
 * @see {@link FormatContext} For using output formats
 * @see {@link InputFormat} For input formats
 */
export class OutputFormat implements NativeWrapper<NativeOutputFormat> {
  private native: NativeOutputFormat;

  // Constructor
  /**
   * Constructor is internal - use static factory methods.
   *
   * OutputFormats are obtained via static methods, not created directly.
   * FFmpeg manages these format descriptors internally.
   *
   * @internal
   *
   * @param native - Native AVOutputFormat to wrap
   *
   * @example
   * ```typescript
   * import { OutputFormat } from '@seydx/ffmpeg';
   *
   * // Don't use constructor directly
   * // const format = new OutputFormat(); // ❌ Wrong
   *
   * // Use static factory methods instead
   * const format = OutputFormat.guessFormat('mp4', null, null); // ✅ Correct
   * ```
   */
  constructor(native: NativeOutputFormat) {
    this.native = native;
  }

  // Static Methods - Low Level API

  /**
   * Return the output format which best matches the provided parameters.
   *
   * Guesses the appropriate output format based on name, filename, or MIME type.
   * Uses the first provided parameter in order: shortName, filename extension, mimeType.
   *
   * Direct mapping to av_guess_format()
   *
   * @param shortName - Short name of the format (e.g., 'mp4', 'mov', 'avi'), may be null
   * @param filename - Filename to use for guessing (extension is used), may be null
   * @param mimeType - MIME type to use for guessing, may be null
   *
   * @returns OutputFormat if found, null otherwise
   *
   * @example
   * ```typescript
   * import { OutputFormat } from '@seydx/ffmpeg';
   *
   * // Guess by short name
   * const mp4Format = OutputFormat.guessFormat('mp4', null, null);
   * if (mp4Format) {
   *   console.log(`Format: ${mp4Format.longName}`);
   * }
   *
   * // Guess by filename extension
   * const format = OutputFormat.guessFormat(null, 'video.mkv', null);
   * if (format) {
   *   console.log(`Guessed format: ${format.name}`);
   * }
   *
   * // Guess by mime type
   * const webmFormat = OutputFormat.guessFormat(null, null, 'video/webm');
   * ```
   */
  static guessFormat(shortName: string | null, filename: string | null, mimeType: string | null): OutputFormat | null {
    const native = bindings.OutputFormat.guessFormat(shortName, filename, mimeType);
    if (!native) {
      return null;
    }
    return new OutputFormat(native);
  }

  // Getter Properties

  /**
   * A comma separated list of short names for the format.
   *
   * Direct mapping to AVOutputFormat->name
   *
   * @readonly
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Descriptive name for the format.
   *
   * Direct mapping to AVOutputFormat->long_name
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
   * Direct mapping to AVOutputFormat->extensions
   *
   * @readonly
   */
  get extensions(): string | null {
    return this.native.extensions;
  }

  /**
   * Comma-separated list of mime types.
   *
   * Direct mapping to AVOutputFormat->mime_type
   *
   * @readonly
   */
  get mimeType(): string | null {
    return this.native.mimeType;
  }

  /**
   * Default audio codec for this format.
   *
   * Direct mapping to AVOutputFormat->audio_codec
   *
   * AV_CODEC_ID_NONE if no default.
   * @readonly
   */
  get audioCodec(): AVCodecID {
    return this.native.audioCodec;
  }

  /**
   * Default video codec for this format.
   *
   * Direct mapping to AVOutputFormat->video_codec
   *
   * AV_CODEC_ID_NONE if no default.
   * @readonly
   */
  get videoCodec(): AVCodecID {
    return this.native.videoCodec;
  }

  /**
   * Default subtitle codec for this format.
   *
   * Direct mapping to AVOutputFormat->subtitle_codec
   *
   * AV_CODEC_ID_NONE if no default.
   * @readonly
   */
  get subtitleCodec(): AVCodecID {
    return this.native.subtitleCodec;
  }

  /**
   * Format flags.
   *
   * Direct mapping to AVOutputFormat->flags
   *
   * Combination of AVFMT_* flags:
   * - AVFMT_NOFILE: No file is opened
   * - AVFMT_NEEDNUMBER: Needs '%d' in filename
   * - AVFMT_GLOBALHEADER: Format wants global headers
   * - AVFMT_NOTIMESTAMPS: Format does not need/have timestamps
   * - AVFMT_VARIABLE_FPS: Format allows variable fps
   * - AVFMT_NODIMENSIONS: Format does not need width/height
   * - AVFMT_NOSTREAMS: Format does not require streams
   * - AVFMT_ALLOW_FLUSH: Format allows flushing
   * - AVFMT_TS_NONSTRICT: Format does not require strictly increasing timestamps
   * - AVFMT_TS_NEGATIVE: Format allows negative timestamps
   * @readonly
   */
  get flags(): AVFormatFlag {
    return this.native.flags;
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVOutputFormat pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native output format object
   */
  getNative(): NativeOutputFormat {
    return this.native;
  }
}
