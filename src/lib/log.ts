/**
 * Log utilities for FFmpeg
 * Provides logging level management and formatting
 */

import {
  type AVLogLevel,
  AV_LOG_DEBUG,
  AV_LOG_ERROR,
  AV_LOG_FATAL,
  AV_LOG_INFO,
  AV_LOG_PANIC,
  AV_LOG_QUIET,
  AV_LOG_TRACE,
  AV_LOG_VERBOSE,
  AV_LOG_WARNING,
} from './constants.js';

/**
 * Log utilities
 */
export class Log {
  /**
   * Get log level name
   * @param level Log level
   * @returns Log level name
   */
  static getLevelName(level: AVLogLevel): string {
    switch (level) {
      case AV_LOG_QUIET:
        return 'quiet';
      case AV_LOG_PANIC:
        return 'panic';
      case AV_LOG_FATAL:
        return 'fatal';
      case AV_LOG_ERROR:
        return 'error';
      case AV_LOG_WARNING:
        return 'warning';
      case AV_LOG_INFO:
        return 'info';
      case AV_LOG_VERBOSE:
        return 'verbose';
      case AV_LOG_DEBUG:
        return 'debug';
      case AV_LOG_TRACE:
        return 'trace';
      default:
        return `level_${level}`;
    }
  }

  /**
   * Get log level short name (for display)
   * @param level Log level
   * @returns Short log level name
   */
  static getLevelShortName(level: AVLogLevel): string {
    switch (level) {
      case AV_LOG_QUIET:
        return 'Q';
      case AV_LOG_PANIC:
        return 'P';
      case AV_LOG_FATAL:
        return 'F';
      case AV_LOG_ERROR:
        return 'E';
      case AV_LOG_WARNING:
        return 'W';
      case AV_LOG_INFO:
        return 'I';
      case AV_LOG_VERBOSE:
        return 'V';
      case AV_LOG_DEBUG:
        return 'D';
      case AV_LOG_TRACE:
        return 'T';
      default:
        return '?';
    }
  }

  /**
   * Get log level color for terminal output
   * @param level Log level
   * @returns ANSI color code
   */
  static getLevelColor(level: AVLogLevel): string {
    switch (level) {
      case AV_LOG_QUIET:
        return '\x1b[90m'; // Gray
      case AV_LOG_PANIC:
      case AV_LOG_FATAL:
        return '\x1b[35m'; // Magenta
      case AV_LOG_ERROR:
        return '\x1b[31m'; // Red
      case AV_LOG_WARNING:
        return '\x1b[33m'; // Yellow
      case AV_LOG_INFO:
        return '\x1b[32m'; // Green
      case AV_LOG_VERBOSE:
        return '\x1b[36m'; // Cyan
      case AV_LOG_DEBUG:
        return '\x1b[34m'; // Blue
      case AV_LOG_TRACE:
        return '\x1b[90m'; // Gray
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Check if log level is an error level
   * @param level Log level
   * @returns True if error level
   */
  static isError(level: AVLogLevel): boolean {
    return level <= AV_LOG_ERROR;
  }

  /**
   * Check if log level is a warning level
   * @param level Log level
   * @returns True if warning level
   */
  static isWarning(level: AVLogLevel): boolean {
    return level === AV_LOG_WARNING;
  }

  /**
   * Check if log level is an info level
   * @param level Log level
   * @returns True if info level
   */
  static isInfo(level: AVLogLevel): boolean {
    return level === AV_LOG_INFO;
  }

  /**
   * Check if log level is a debug level
   * @param level Log level
   * @returns True if debug level
   */
  static isDebug(level: AVLogLevel): boolean {
    return level >= AV_LOG_VERBOSE;
  }

  /**
   * Parse log level from string
   * @param str Log level string
   * @returns Log level value
   */
  static fromString(str: string): AVLogLevel {
    switch (str.toLowerCase()) {
      case 'quiet':
      case 'q':
      case 'silent':
        return AV_LOG_QUIET;
      case 'panic':
      case 'p':
        return AV_LOG_PANIC;
      case 'fatal':
      case 'f':
        return AV_LOG_FATAL;
      case 'error':
      case 'e':
      case 'err':
        return AV_LOG_ERROR;
      case 'warning':
      case 'warn':
      case 'w':
        return AV_LOG_WARNING;
      case 'info':
      case 'i':
        return AV_LOG_INFO;
      case 'verbose':
      case 'v':
        return AV_LOG_VERBOSE;
      case 'debug':
      case 'd':
        return AV_LOG_DEBUG;
      case 'trace':
      case 't':
        return AV_LOG_TRACE;
      default:
        // Try to parse as number
        const num = parseInt(str, 10);
        if (!isNaN(num)) {
          return num as AVLogLevel;
        }
        return AV_LOG_INFO; // Default
    }
  }

  /**
   * Compare log levels
   * @param level1 First log level
   * @param level2 Second log level
   * @returns -1 if level1 is less severe, 1 if more severe, 0 if equal
   */
  static compare(level1: AVLogLevel, level2: AVLogLevel): number {
    if (level1 < level2) return -1;
    if (level1 > level2) return 1;
    return 0;
  }

  /**
   * Check if message should be logged based on current level
   * @param messageLevel Level of the message
   * @param currentLevel Current log level threshold
   * @returns True if message should be logged
   */
  static shouldLog(messageLevel: AVLogLevel, currentLevel: AVLogLevel): boolean {
    return messageLevel <= currentLevel;
  }

  /**
   * Format log message with timestamp and level
   * @param level Log level
   * @param message Message to format
   * @param includeColor Include ANSI color codes
   * @returns Formatted message
   */
  static formatMessage(level: AVLogLevel, message: string, includeColor = false): string {
    const timestamp = new Date().toISOString();
    const levelName = this.getLevelShortName(level);

    if (includeColor) {
      const color = this.getLevelColor(level);
      const reset = '\x1b[0m';
      return `${color}[${timestamp}] [${levelName}] ${message}${reset}`;
    }

    return `[${timestamp}] [${levelName}] ${message}`;
  }
}
