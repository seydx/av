/**
 * Discard utilities for FFmpeg
 * Provides discard levels for frame/packet dropping
 */

import { AV_DISCARD_ALL, AV_DISCARD_BIDIR, AV_DISCARD_DEFAULT, AV_DISCARD_NONE, AV_DISCARD_NONINTRA, AV_DISCARD_NONKEY, AV_DISCARD_NONREF } from './constants.js';

import type { AVDiscard } from './constants.js';

/**
 * Discard utilities
 */
export class Discard {
  /**
   * Get name of discard level
   * @param discard Discard level
   * @returns Discard name
   */
  static getName(discard: AVDiscard): string {
    switch (discard) {
      case AV_DISCARD_NONE:
        return 'none';
      case AV_DISCARD_DEFAULT:
        return 'default';
      case AV_DISCARD_NONREF:
        return 'non-reference';
      case AV_DISCARD_BIDIR:
        return 'bidirectional';
      case AV_DISCARD_NONINTRA:
        return 'non-intra';
      case AV_DISCARD_NONKEY:
        return 'non-key';
      case AV_DISCARD_ALL:
        return 'all';
      default:
        return 'unknown';
    }
  }

  /**
   * Get description of discard level
   * @param discard Discard level
   * @returns Discard description
   */
  static getDescription(discard: AVDiscard): string {
    switch (discard) {
      case AV_DISCARD_NONE:
        return 'Discard nothing';
      case AV_DISCARD_DEFAULT:
        return 'Discard useless packets like 0 size packets in AVI';
      case AV_DISCARD_NONREF:
        return 'Discard all non-reference frames';
      case AV_DISCARD_BIDIR:
        return 'Discard all bidirectional frames';
      case AV_DISCARD_NONINTRA:
        return 'Discard all non-intra frames';
      case AV_DISCARD_NONKEY:
        return 'Discard all frames except keyframes';
      case AV_DISCARD_ALL:
        return 'Discard all frames';
      default:
        return 'Unknown discard level';
    }
  }

  /**
   * Check if discard level will drop reference frames
   * @param discard Discard level
   * @returns True if reference frames are dropped
   */
  static dropsReferenceFrames(discard: AVDiscard): boolean {
    return discard >= AV_DISCARD_NONREF;
  }

  /**
   * Check if discard level will drop keyframes
   * @param discard Discard level
   * @returns True if keyframes are dropped
   */
  static dropsKeyframes(discard: AVDiscard): boolean {
    return discard >= AV_DISCARD_ALL;
  }

  /**
   * Check if discard level will drop B-frames
   * @param discard Discard level
   * @returns True if B-frames are dropped
   */
  static dropsBidirectionalFrames(discard: AVDiscard): boolean {
    return discard >= AV_DISCARD_BIDIR;
  }
}
