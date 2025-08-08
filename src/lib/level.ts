/**
 * Level utilities for FFmpeg
 * Provides codec level definitions
 */

import { AV_LEVEL_UNKNOWN } from './constants.js';

/**
 * Level utilities
 */
export class Level {
  /**
   * Check if level is unknown
   * @param level Level value
   * @returns True if unknown
   */
  static isUnknown(level: number): boolean {
    return level === AV_LEVEL_UNKNOWN;
  }

  /**
   * Get level name
   * @param level Level value
   * @returns Level name or numeric string
   */
  static getName(level: number): string {
    if (level === AV_LEVEL_UNKNOWN) {
      return 'unknown';
    }
    // For known levels, return the numeric value
    // Common H.264 levels: 10, 11, 12, 13, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 51, 52
    // These map to 1.0, 1.1, 1.2, 1.3, 2.0, 2.1, 2.2, 3.0, 3.1, 3.2, 4.0, 4.1, 4.2, 5.0, 5.1, 5.2
    if (level >= 10 && level <= 52) {
      const major = Math.floor(level / 10);
      const minor = level % 10;
      return `${major}.${minor}`;
    }
    return level.toString();
  }

  /**
   * Parse level from string
   * @param str Level string (e.g., "4.1" or "41")
   * @returns Level value
   */
  static fromString(str: string): number {
    if (str.toLowerCase() === 'unknown') {
      return AV_LEVEL_UNKNOWN;
    }
    // Handle format like "4.1"
    if (str.includes('.')) {
      const parts = str.split('.');
      if (parts.length === 2) {
        const major = parseInt(parts[0], 10);
        const minor = parseInt(parts[1], 10);
        if (!isNaN(major) && !isNaN(minor)) {
          return major * 10 + minor;
        }
      }
    }
    // Handle direct numeric format like "41"
    const level = parseInt(str, 10);
    return isNaN(level) ? AV_LEVEL_UNKNOWN : level;
  }
}
