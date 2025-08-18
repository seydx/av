import type { AVPixelFormat, AVSampleFormat, AVSoftwareScaleFlag } from '../lib/constants.js';
import type { HardwareFramesContext } from '../lib/hardware-frames-context.js';
import type { ChannelLayout, IRational } from '../lib/types.js';
import type { Decoder } from './decoder.js';
import type { HardwareContext } from './hardware.js';

/**
 * Custom IO callbacks for creating IOContext.
 *
 * Defines callback functions for custom I/O operations with FFmpeg.
 * Used to implement custom protocols or special data handling.
 *
 * @interface IOCallbacks
 */
export interface IOCallbacks {
  read?: (size: number) => Buffer | null | number;
  write?: (buffer: Buffer) => number | void;
  seek?: (offset: bigint, whence: number) => bigint | number;
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
  /** Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal) */
  hardware?: HardwareContext;
  /**
   * Target pixel format(s) for automatic conversion.
   * Can be a single format or an array of formats to try in order.
   *
   * Single format (simple API):
   * - AV_PIX_FMT_YUV420P for software encoders
   * - AV_PIX_FMT_NV12 for VideoToolbox
   * - AV_PIX_FMT_RGB24 for image processing
   *
   * Array of formats (advanced API):
   * - [AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P] for VideoToolbox with fallback
   * - [AV_PIX_FMT_P010LE, AV_PIX_FMT_YUV420P10LE] for 10-bit encoding
   *
   * When an array is provided, the decoder builds a filter chain using these formats.
   */
  targetPixelFormat?: AVPixelFormat | AVPixelFormat[];
}

/**
 * Options for encoder creation.
 *
 * Comprehensive configuration for media encoding.
 * Supports both video and audio encoding with hardware acceleration.
 *
 * @interface EncoderOptions
 */
export interface EncoderOptions {
  // Video options
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Expected Pixel format - */
  pixelFormat?: AVPixelFormat;
  /** Group of Pictures size */
  gopSize?: number;
  /** Max B-frames between non-B-frames */
  maxBFrames?: number;
  /** Frame rate as rational {num, den} */
  frameRate?: IRational;

  // Audio options
  /** Audio sample rate in Hz */
  sampleRate?: number;
  /** Channel layout configuration */
  channelLayout?: ChannelLayout;
  /** Sample format (as string or number) */
  sampleFormat?: AVSampleFormat;
  /** Audio frame size */
  frameSize?: number;

  // Common options
  /** Target bitrate (number, bigint, or string like '5M') */
  bitrate?: number | bigint | string;
  /** Number of threads (0 for auto) */
  threads?: number;
  /**
   * Output timebase for the encoder (rational {num, den})
   * Determines the time units for encoded packets
   * If not set, uses codec default (often 1/25 for video)
   *
   * Common values:
   * - Same as input: Use input stream's timeBase for 1:1 timing
   * - Custom rate: { num: 1, den: 30 } for 30fps output
   */
  timeBase?: IRational;

  /**
   * Source timebase for automatic PTS rescaling
   * When frames come from a different timebase (e.g., from decoder),
   * the encoder will automatically convert timestamps
   *
   * @example
   * ```typescript
   * // Simple case - preserve original timing (only set timeBase)
   * { timeBase: stream.timeBase }
   *
   * // Frame rate conversion - source to different output
   * {
   *   timeBase: { num: 1, den: 30 },        // Output: 30fps
   *   sourceTimeBase: stream.timeBase       // Source: original
   * }
   * ```
   */
  sourceTimeBase?: IRational;

  // Codec-specific options (passed to AVOptions)
  /** Additional codec-specific options */
  codecOptions?: Record<string, string | number>;

  /** Hardware acceleration: Pass a HardwareContext instance (user is responsible for disposal) */
  hardware?: HardwareContext;

  /**
   * Share hardware frames context from decoder for zero-copy transcoding.
   * When provided, the encoder will use the decoder's frames context if both use hardware.
   * This enables zero-copy GPU pipeline for maximum performance.
   */
  sharedDecoder?: Decoder;
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
 * Filter configuration for video streams.
 *
 * Defines video-specific parameters for filter configuration.
 * Used when creating filters from video sources or decoders.
 */
export interface VideoFilterConfig {
  type: 'video';
  width: number;
  height: number;
  pixelFormat: AVPixelFormat;
  timeBase: { num: number; den: number };
  frameRate?: { num: number; den: number };
  sampleAspectRatio?: { num: number; den: number };
  hwFramesCtx?: HardwareFramesContext | null;
}

/**
 * Filter configuration for audio streams.
 *
 * Defines audio-specific parameters for filter configuration.
 * Used when creating filters from audio sources or decoders.
 */
export interface AudioFilterConfig {
  type: 'audio';
  sampleRate: number;
  sampleFormat: AVSampleFormat;
  channelLayout: bigint;
  timeBase: { num: number; den: number };
}

/**
 * Union type for all filter configurations.
 */
export type FilterConfig = VideoFilterConfig | AudioFilterConfig;

/**
 * Options for filter output configuration.
 *
 * Specifies the desired output format for filtered frames.
 * The filter will automatically insert format conversion filters as needed.
 */
export interface FilterOutputOptions {
  /**
   * Desired pixel formats for video output.
   * The filter will choose the first compatible format.
   */
  pixelFormats?: AVPixelFormat[];

  /**
   * Desired sample formats for audio output.
   * The filter will choose the first compatible format.
   */
  sampleFormats?: AVSampleFormat[];

  /**
   * Desired sample rates for audio output.
   */
  sampleRates?: number[];

  /**
   * Desired channel layouts for audio output.
   */
  channelLayouts?: bigint[];
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
   * Output format constraints.
   * The filter will ensure output matches these requirements.
   */
  output?: FilterOutputOptions;

  /**
   * Software scaler options (for video filters).
   * Example: "flags=bicubic"
   */
  scaleSwsOpts?: string;
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
    algorithm?: AVSoftwareScaleFlag;
  };
  /** Convert pixel format */
  format?: {
    to: AVPixelFormat;
  };
}
