import { bindings } from './binding.js';

import type { AVLogLevel } from './constants.js';
import type { LogOptions } from './types.js';

/**
 * FFmpeg logging control - Low Level API
 *
 * Direct mapping to FFmpeg's logging system.
 * Controls log levels and optionally captures log messages.
 *
 * @example
 * ```typescript
 * // Set log level (simple, no performance impact)
 * Log.setLevel(AV_LOG_WARNING);
 *
 * // Capture errors only (minimal performance impact)
 * Log.setCallback((level, message) => {
 *   console.error(`FFmpeg Error: ${message}`);
 * }, { maxLevel: AV_LOG_ERROR });
 *
 * // Non-blocking callback with no performance impact
 * Log.setCallback((level, message) => {
 *   myLogger.log(level, message);
 * });
 *
 * // Reset to default logging
 * Log.resetCallback();
 * ```
 *
 * @warning Setting a callback can significantly impact performance!
 * FFmpeg can generate thousands of log messages per second.
 * Use maxLevel to filter messages and buffered mode for better performance.
 */
export class Log {
  // Private constructor - this is a static-only class
  private constructor() {
    throw new Error('Log class cannot be instantiated');
  }

  // Static Methods - Low Level API

  /**
   * Set FFmpeg's global log level.
   *
   * Direct mapping to av_log_set_level()
   *
   * Lower levels mean fewer log messages and better performance.
   * Messages above this level are not generated at all.
   *
   * @param level - Log level (AV_LOG_* constant)
   *
   * @example
   * ```typescript
   * // Only show errors and fatal messages
   * Log.setLevel(AV_LOG_ERROR);
   *
   * // Show everything (warning: very verbose!)
   * Log.setLevel(AV_LOG_TRACE);
   *
   * // Disable all logging
   * Log.setLevel(AV_LOG_QUIET);
   * ```
   */
  static setLevel(level: AVLogLevel): void {
    bindings.Log.setLevel(level);
  }

  /**
   * Get the current global log level.
   *
   * Direct mapping to av_log_get_level()
   *
   * @returns Current log level
   *
   * @example
   * ```typescript
   * const currentLevel = Log.getLevel();
   * console.log(`Current log level: ${currentLevel}`);
   * ```
   */
  static getLevel(): AVLogLevel {
    return bindings.Log.getLevel();
  }

  /**
   * Log a message through FFmpeg's logging system.
   *
   * Direct mapping to av_log()
   *
   * @param level - Log level (AV_LOG_* constant)
   * @param message - Message to log
   *
   * @example
   * ```typescript
   * Log.log(AV_LOG_INFO, 'Starting processing...');
   * Log.log(AV_LOG_ERROR, 'Error during decode');
   * ```
   */
  static log(level: AVLogLevel, message: string): void {
    bindings.Log.log(level, message);
  }

  /**
   * Set a callback to capture FFmpeg log messages.
   *
   * Direct mapping to av_log_set_callback()
   *
   * @param callback - Function to receive log messages, or null to reset
   * @param options - Options to control performance impact
   *
   * @note This implementation uses ThreadSafeFunction for zero-blocking operation.
   * Messages are processed asynchronously without impacting FFmpeg performance.
   * Use options.maxLevel to filter messages at the C level for best performance.
   *
   * @example
   * ```typescript
   * // Simple callback (warning: can be slow!)
   * Log.setCallback((level, message) => {
   *   console.log(`[${level}] ${message}`);
   * });
   *
   * // Performance-optimized callback (filters at C level)
   * Log.setCallback((level, message) => {
   *   errorReporter.log(message);
   * }, {
   *   maxLevel: AV_LOG_ERROR  // Only capture errors (filtered in C)
   * });
   *
   * // Reset to default (output to stderr)
   * Log.setCallback(null);
   * ```
   *
   * @note Messages are processed asynchronously and non-blocking.
   */
  static setCallback(callback: ((level: AVLogLevel, message: string) => void) | null, options?: LogOptions): void {
    if (callback === null) {
      bindings.Log.setCallback(null);
    } else {
      bindings.Log.setCallback(callback, options);
    }
  }

  /**
   * Reset logging to default behavior (output to stderr).
   *
   * Direct mapping to av_log_set_callback(av_log_default_callback)
   *
   * Removes any custom callback and clears buffered messages.
   *
   * @example
   * ```typescript
   * // Remove custom callback
   * Log.resetCallback();
   * // Now logs go to stderr again
   * ```
   */
  static resetCallback(): void {
    bindings.Log.resetCallback();
  }
}
