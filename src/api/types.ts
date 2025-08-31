import type { AVPixelFormat, AVSampleFormat, SWSFlag } from '../constants/constants.js';
import type { ChannelLayout, IRational } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';

/**
 * Video stream information.
 *
 * Contains all necessary parameters to describe a video stream.
 * Used for encoder and filter initialization.
 *
 * @interface VideoInfo
 */
export interface VideoInfo {
  /** Discriminator for TypeScript type narrowing */
  type: 'video';

  /** Video width in pixels */
  width: number;

  /** Video height in pixels */
  height: number;

  /** Pixel format */
  pixelFormat: AVPixelFormat;

  /** Time base (required for timing) */
  timeBase: IRational;

  /** Frame rate (optional, can be derived from timeBase) */
  frameRate?: IRational;

  /** Sample aspect ratio (optional, defaults to 1:1) */
  sampleAspectRatio?: IRational;
}

/**
 * Audio stream information.
 *
 * Contains all necessary parameters to describe an audio stream.
 * Used for encoder and filter initialization.
 *
 * @interface AudioInfo
 */
export interface AudioInfo {
  /** Discriminator for TypeScript type narrowing */
  type: 'audio';

  /** Sample rate in Hz */
  sampleRate: number;

  /** Sample format */
  sampleFormat: AVSampleFormat;

  /** Channel layout configuration */
  channelLayout: ChannelLayout;

  /** Time base (required for timing) */
  timeBase: IRational;

  /**
   * Number of samples per frame.
   *
   * Some encoders require specific frame sizes:
   * - AAC: typically 1024 samples
   * - MP3: typically 1152 samples
   * - Opus: flexible, but often 960 or 2880
   *
   * If not specified, the encoder's default will be used.
   *
   * @example
   * ```typescript
   * const encoder = await Encoder.create('aac', {
   *   type: 'audio',
   *   sampleRate: 48000,
   *   sampleFormat: AV_SAMPLE_FMT_FLTP,
   *   channelLayout: AV_CHANNEL_LAYOUT_STEREO,
   *   timeBase: { num: 1, den: 48000 },
   *   frameSize: 1024
   * });
   * ```
   */
  frameSize?: number;
}

/**
 * Union type for stream information.
 * Can be either video or audio stream info.
 */
export type StreamInfo = VideoInfo | AudioInfo;

/**
 * Raw video data configuration.
 *
 * Specifies parameters for opening raw video files like YUV.
 *
 * @interface VideoRawData
 *
 * @example
 * ```typescript
 * const rawVideo: VideoRawData = {
 *   type: 'video',
 *   data: 'testdata/input.yuv',
 *   width: 1280,
 *   height: 720,
 *   pixelFormat: 'yuv420p',
 *   frameRate: 30
 * };
 * const input = await MediaInput.open(rawVideo);
 * ```
 */
export interface VideoRawData {
  /**
   * Type discriminator for TypeScript.
   */
  type: 'video';

  /**
   * Raw audio input source (file path, Buffer, or stream).
   */
  input: string | Buffer;

  /**
   * Video dimensions.
   */
  width: number;
  height: number;

  /**
   * Pixel format (e.g., AV_PIX_FMT_YUV420P, AV_PIX_FMT_NV12, AV_PIX_FMT_RGB24).
   */
  pixelFormat: AVPixelFormat;

  /**
   * Frame rate as a rational
   */
  frameRate: IRational;
}

/**
 * Raw audio data configuration.
 *
 * Specifies parameters for opening raw audio files like PCM.
 *
 * @interface AudioRawData
 *
 * @example
 * ```typescript
 * const rawAudio: AudioRawData = {
 *   type: 'audio',
 *   data: 'testdata/audio.pcm',
 *   sampleRate: 48000,
 *   channels: 2,
 *   sampleFormat: 's16le'
 * };
 * const input = await MediaInput.open(rawAudio);
 * ```
 */
export interface AudioRawData {
  /**
   * Type discriminator for TypeScript.
   */
  type: 'audio';

  /**
   * Raw audio input source (file path, Buffer, or stream).
   */
  input: string | Buffer;

  /**
   * Sample rate in Hz (e.g., 44100, 48000).
   */
  sampleRate: number;

  /**
   * Number of audio channels.
   */
  channels: number;

  /**
   * Sample format (e.g., AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_S32).
   */
  sampleFormat: AVSampleFormat;
}

/**
 * Raw data configuration for MediaInput.
 *
 * @type RawData
 */
export type RawData = VideoRawData | AudioRawData;

/**
 * Options for MediaInput opening.
 *
 * Configures how media files are opened and packets are read.
 *
 * @interface MediaInputOptions
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
   * @example
   * ```typescript
   * const input = await MediaInput.open('video.m1v', {
   *   bufferSize: 4096 // Use a smaller buffer size
   * });
   * ```
   */
  bufferSize?: number;

  /**
   * Force specific input format.
   *
   * Use this to specify the input format explicitly instead of auto-detection.
   * Useful for raw formats like 'rawvideo', 'rawaudio', etc.
   *
   * @example
   * ```typescript
   * // Open raw YUV video
   * const input = await MediaInput.open('input.yuv', {
   *   format: 'rawvideo',
   *   options: {
   *     video_size: '1920x1080',
   *     pixel_format: 'yuv420p',
   *     framerate: '30'
   *   }
   * });
   * ```
   */
  format?: string;

  /**
   * FFmpeg format options passed directly to the input.
   * These are equivalent to options specified before -i in ffmpeg CLI.
   *
   * @example
   * ```typescript
   * // For RTSP with low latency:
   * const input = await MediaInput.open('rtsp://...', {
   *   options: {
   *     'rtsp_transport': 'tcp',
   *     'fflags': '+discardcorrupt+nobuffer',
   *     'flags': 'low_delay',
   *     'analyzeduration': '0',
   *     'probesize': '500000'
   *   }
   * });
   *
   * // For seeking in MP4:
   * const input = await MediaInput.open('video.mp4', {
   *   options: {
   *     'ss': '10', // Start at 10 seconds
   *   }
   * });
   * ```
   */
  options?: Record<string, string | number>;
}

/**
 * Options for decoder creation.
 *
 * Configuration parameters for initializing a media decoder.
 * Supports hardware acceleration and threading configuration.
 *
 * @interface DecoderOptions
 */
export interface DecoderOptions {
  /** Number of threads to use (0 for auto) */
  threads?: number;

  /** Additional codec-specific options (passed to AVOptions) */
  options?: Record<string, string | number>;

  /** Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal) */
  hardware?: HardwareContext | null;
}

/**
 * Options for encoder creation.
 *
 * Encoder-specific configuration options.
 * Stream parameters (width, height, format, etc.) are taken from the provided stream.
 *
 * @interface EncoderOptions
 */
export interface EncoderOptions {
  // Encoder-specific options
  /** Target bitrate (number, bigint, or string like '5M') */
  bitrate?: number | bigint | string;

  /** Group of Pictures size */
  gopSize?: number;

  /** Max B-frames between non-B-frames */
  maxBFrames?: number;

  /** Number of threads (0 for auto) */
  threads?: number;

  /**
   * Override output timebase (rational {num, den})
   * If not set, uses the stream's timebase
   */
  timeBase?: IRational;

  /** Additional codec-specific options (passed to AVOptions) */
  options?: Record<string, string | number>;

  /** Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal) */
  hardware?: HardwareContext | null;
}

/**
 * Options for MediaOutput creation.
 *
 * Configures output container format.
 *
 * @interface MediaOutputOptions
 */
export interface MediaOutputOptions {
  /**
   * Preferred output format.
   *
   * If not specified, format is guessed from file extension.
   * Use this to override automatic format detection.
   *
   * @example
   * ```typescript
   * const output = await MediaOutput.open('output.bin', {
   *   format: 'mp4' // Force MP4 format despite .bin extension
   * });
   * ```
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
   * @example
   * ```typescript
   * const output = await MediaOutput.open('output.mp4', {
   *   bufferSize: 8192 // Use an 8KB buffer
   * });
   * ```
   */
  bufferSize?: number;
}

/**
 * Options for creating a filter instance.
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

  /** Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal) */
  hardware?: HardwareContext | null;
}

/**
 * Hardware acceleration configuration options.
 *
 * Parameters for configuring hardware-accelerated encoding/decoding.
 * Supports device selection and initialization options.
 *
 * @interface HardwareOptions
 */
export interface HardwareOptions {
  /**
   * Preferred device type (e.g., 'cuda', 'vaapi', 'videotoolbox').
   * If not specified, auto-detection will be used.
   */
  device?: string;

  /**
   * Device name or index (e.g., '0' for first GPU).
   */
  deviceName?: string;

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
 * @interface IOInputCallbacks
 */
export interface IOInputCallbacks {
  /**
   * Read callback - called when FFmpeg needs to read data.
   * @param size - Number of bytes to read
   * @returns Buffer with data, null for EOF, or negative error code
   */
  read: (size: number) => Buffer | null | number;

  /**
   * Seek callback - called when FFmpeg needs to seek in the stream.
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
 * @interface IOOutputCallbacks
 * @internal
 */
export interface IOOutputCallbacks {
  /**
   * Write callback - called when FFmpeg needs to write data.
   * @param buffer - Buffer containing data to write
   * @returns Number of bytes written or void
   */
  write: (buffer: Buffer) => number | void;

  /**
   * Seek callback - called when FFmpeg needs to seek in the output.
   * @param offset - Offset to seek to
   * @param whence - Seek origin (AVSEEK_SET, AVSEEK_CUR, AVSEEK_END)
   * @returns New position or negative error code
   */
  seek?: (offset: bigint, whence: number) => bigint | number;

  /**
   * Read callback - some formats may need to read back data.
   * @param size - Number of bytes to read
   * @returns Buffer with data, null for EOF, or negative error code
   */
  read?: (size: number) => Buffer | null | number;
}

/**
 * Options for image conversion and manipulation.
 *
 * Configuration for frame transformation operations.
 * Supports cropping, resizing, and format conversion.
 *
 * @interface ImageOptions
 */
export interface ImageOptions {
  /** Crop the image */
  crop?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Resize the image */
  resize?: {
    width: number;
    height: number;
    algorithm?: SWSFlag;
  };
  /** Convert pixel format */
  format?: {
    to: AVPixelFormat;
  };
}
