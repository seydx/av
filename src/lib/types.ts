/**
 * Common TypeScript type definitions
 *
 * Types that are used across multiple modules but are not
 * directly from FFmpeg constants.
 */

import type { AVLogLevel, AVMediaType } from '../constants/constants.ts';

/**
 * Rational number (fraction) interface
 * Maps to AVRational in FFmpeg
 * Used for time bases, aspect ratios, frame rates
 */
export interface IRational {
  /** Numerator */
  num: number;

  /** Denominator */
  den: number;
}

/**
 * Audio channel layout description
 * Maps to AVChannelLayout in FFmpeg
 */
export interface ChannelLayout {
  /** Number of channels */
  nbChannels: number;

  /** Channel order (AVChannelOrder) */
  order: number;

  /** Channel mask for native layouts */
  mask: bigint;
}

/**
 * Filter pad information
 */
export interface FilterPad {
  /** Name of the pad (e.g., "in", "out") */
  name: string | null;

  /** Media type of the pad (e.g., "video", "audio") */
  type: AVMediaType;
}

/**
 * Codec profile definition
 */
export interface CodecProfile {
  /** Profile ID (FF_PROFILE_*) */
  profile: number;

  /** Human-readable profile name */
  name?: string;
}

/**
 * Log callback options for performance tuning.
 */
export interface LogOptions {
  /**
   * Maximum log level to capture.
   * Messages above this level are ignored at the C level for maximum performance.
   * Default: AV_LOG_INFO
   */
  maxLevel?: AVLogLevel;
}
