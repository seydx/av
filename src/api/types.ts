import type { AVPixelFormat, AVSampleFormat } from '../constants/constants.js';
import type { IRational } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';

/**
 * Raw video data configuration.
 *
 * Specifies parameters for opening raw video files like YUV.
 *
 */
export interface VideoRawData {
  /** Type discriminator for TypeScript */
  type: 'video';

  /** Raw audio input source (file path, Buffer, or stream) */
  input: string | Buffer;

  /** Video width */
  width: number;

  /** Video height */
  height: number;

  /** Pixel format (e.g., AV_PIX_FMT_YUV420P, AV_PIX_FMT_NV12, AV_PIX_FMT_RGB24) */
  pixelFormat: AVPixelFormat;

  /** Frame rate as a rational */
  frameRate: IRational;
}

/**
 * Raw audio data configuration.
 *
 * Specifies parameters for opening raw audio files like PCM.
 *
 */
export interface AudioRawData {
  /** Type discriminator for TypeScript */
  type: 'audio';

  /** Raw audio input source (file path, Buffer, or stream) */
  input: string | Buffer;

  /** Sample rate in Hz (e.g., 44100, 48000) */
  sampleRate: number;

  /** Number of audio channels */
  channels: number;

  /** Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_S32) */
  sampleFormat: AVSampleFormat;
}

export type RawData = VideoRawData | AudioRawData;

/**
 * Options for MediaInput opening.
 *
 * Configures how media files are opened and packets are read.
 * Supports format detection, buffering, and FFmpeg options.
 */
export interface MediaInputOptions {
  /**
   * Buffer size for reading/writing operations.
   *
   * This option allows you to specify the buffer size used for I/O operations.
   * A larger buffer size may improve performance by reducing the number of I/O calls,
   * while a smaller buffer size may reduce memory usage.
   *
   * @default 8192
   *
   */
  bufferSize?: number;

  /**
   * Force specific input format.
   *
   * Use this to specify the input format explicitly instead of auto-detection.
   * Useful for raw formats like 'rawvideo', 'rawaudio', etc.
   *
   */
  format?: string;

  /**
   * FFmpeg format options passed directly to the input.
   * These are equivalent to options specified before -i in ffmpeg CLI.
   *
   */
  options?: Record<string, string | number>;
}

/**
 * Options for decoder creation.
 *
 * Configuration parameters for initializing a media decoder.
 * Supports hardware acceleration and threading configuration.
 *
 */
export interface DecoderOptions {
  /** Number of threads to use (0 for auto) */
  threads?: number;

  /** Additional codec-specific options (passed to AVOptions) */
  options?: Record<string, string | number>;

  /** Hardware acceleration: Pass a HardwareContext instance */
  hardware?: HardwareContext | null;
}

/**
 * Options for encoder creation.
 *
 * Encoder-specific configuration options.
 * Stream parameters (width, height, format, etc.) are taken from the provided stream.
 *
 */
export interface EncoderOptions {
  /** Target bitrate (number, bigint, or string like '5M') */
  bitrate?: number | bigint | string;

  /** Minimum bitrate (number, bigint, or string like '5M') */
  minRate?: number | bigint | string;

  /** Maximum bitrate (number, bigint, or string like '5M') */
  maxRate?: number | bigint | string;

  /** Buffer size (number, bigint, or string like '5M') */
  bufSize?: number | bigint | string;

  /** Group of Pictures size */
  gopSize?: number;

  /** Max B-frames between non-B-frames */
  maxBFrames?: number;

  /** Number of threads (0 for auto) */
  threads?: number;

  /** Timebase (rational {num, den}) */
  timeBase: IRational;

  /** Frame rate (rational {num, den}) */
  frameRate?: IRational;

  /** Additional codec-specific options (passed to AVOptions) */
  options?: Record<string, string | number>;
}

/**
 * Options for MediaOutput creation.
 *
 * Configures output container format and buffering.
 */
export interface MediaOutputOptions {
  /**
   * Preferred output format.
   *
   * If not specified, format is guessed from file extension.
   * Use this to override automatic format detection.
   *
   */
  format?: string;

  /**
   * Buffer size for I/O operations.
   *
   * This option controls the size of the internal buffer used for
   * reading and writing data. A larger buffer may improve performance
   * by reducing the number of I/O operations, but will also increase
   * memory usage.
   *
   * @default 4096
   *
   * ```
   */
  bufferSize?: number;
}

/**
 * Options for creating a filter instance.
 *
 */
export interface FilterOptions {
  /**
   * Number of threads for parallel processing.
   * 0 = auto-detect based on CPU cores.
   */
  threads?: number;

  /**
   * Software scaler options (for video filters).
   * Example: "flags=bicubic"
   */
  scaleSwsOpts?: string;

  /** Timebase (rational {num, den}) */
  timeBase: IRational;

  /** Frame rate (rational {num, den}) */
  frameRate?: IRational;

  /** Hardware acceleration: Pass a HardwareContext instance */
  hardware?: HardwareContext | null;
}

/**
 * Hardware acceleration configuration options.
 *
 * Parameters for configuring hardware-accelerated encoding/decoding.
 * Supports device selection and initialization options.
 *
 */
export interface HardwareOptions {
  /**
   * Device path or index (e.g., '0' for first GPU).
   */
  device?: string;

  /**
   * Device initialization options.
   */
  options?: Record<string, string>;
}

/**
 * Custom I/O callbacks for implementing custom input sources.
 *
 * Defines callback functions for custom read operations with FFmpeg.
 * Used by IOStream.create() for custom input protocols.
 *
 */
export interface IOInputCallbacks {
  /**
   * Read callback - called when FFmpeg needs to read data.
   *
   * @param size - Number of bytes to read
   * @returns Buffer with data, null for EOF, or negative error code
   */
  read: (size: number) => Buffer | null | number;

  /**
   * Seek callback - called when FFmpeg needs to seek in the stream.
   *
   * @param offset - Offset to seek to
   * @param whence - Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END, or AVSEEK_SIZE)
   * @returns New position or negative error code
   */
  seek?: (offset: bigint, whence: number) => bigint | number;
}

/**
 * Custom I/O callbacks for implementing custom output targets.
 *
 * Defines callback functions for custom write operations with FFmpeg.
 * Used internally by MediaOutput for custom output protocols.
 *
 */
export interface IOOutputCallbacks {
  /**
   * Write callback - called when FFmpeg needs to write data.
   *
   * @param buffer - Buffer containing data to write
   * @returns Number of bytes written or void
   */
  write: (buffer: Buffer) => number | void;

  /**
   * Seek callback - called when FFmpeg needs to seek in the output.
   *
   * @param offset - Offset to seek to
   * @param whence - Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END)
   * @returns New position or negative error code
   */
  seek?: (offset: bigint, whence: number) => bigint | number;

  /**
   * Read callback - some formats may need to read back data.
   *
   * @param size - Number of bytes to read
   * @returns Buffer with data, null for EOF, or negative error code
   */
  read?: (size: number) => Buffer | null | number;
}

/**
 * Base codec names supported across different hardware types.
 */
export type BaseCodecName =
  | 'av1' // AV1 codec (amf, mediacodec, nvenc, qsv, vaapi)
  | 'h264' // H.264/AVC (amf, mediacodec, nvenc, qsv, vaapi, v4l2m2m, mf, omx, rkmpp, videotoolbox, vulkan)
  | 'hevc' // H.265/HEVC (amf, mediacodec, nvenc, qsv, vaapi, v4l2m2m, mf, rkmpp, videotoolbox, d3d12va, vulkan)
  | 'h263' // H.263 (v4l2m2m)
  | 'mpeg2' // MPEG-2 (qsv, vaapi)
  | 'mpeg4' // MPEG-4 Part 2 (mediacodec, v4l2m2m, omx)
  | 'vp8' // VP8 (mediacodec, vaapi, v4l2m2m)
  | 'vp9' // VP9 (mediacodec, qsv, vaapi)
  | 'mjpeg' // Motion JPEG (qsv, vaapi, rkmpp, videotoolbox)
  | 'prores'; // ProRes (videotoolbox only)
