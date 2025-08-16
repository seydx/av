import { bindings } from './binding.js';

import type { AVLogLevel } from './constants.js';
import type { LogOptions } from './types.js';

/**
 * FFmpeg logging system control.
 *
 * Controls FFmpeg's global logging behavior including log levels and message capture.
 * Provides direct access to FFmpeg's logging system with options for performance optimization.
 * FFmpeg can generate thousands of log messages per second, so filtering is important.
 *
 * Direct mapping to FFmpeg's logging API (av_log_*).
 *
 * @example
 * ```typescript
 * import { Log, AV_LOG_WARNING, AV_LOG_ERROR, AV_LOG_QUIET } from '@seydx/ffmpeg';
 *
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
 * Warning: Setting a callback can significantly impact performance!
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
   * Lower levels mean fewer log messages and better performance.
   * Messages above this level are not generated at all by FFmpeg.
   *
   * Direct mapping to av_log_set_level()
   *
   * @param level - Log level (AV_LOG_* constant):
   *   - AV_LOG_QUIET: Disable all logging
   *   - AV_LOG_PANIC: Only extremely fatal issues
   *   - AV_LOG_FATAL: Fatal errors only
   *   - AV_LOG_ERROR: Errors that can't be recovered
   *   - AV_LOG_WARNING: Warnings about potential issues
   *   - AV_LOG_INFO: Informational messages
   *   - AV_LOG_VERBOSE: Detailed information
   *   - AV_LOG_DEBUG: Debug information
   *   - AV_LOG_TRACE: Very detailed trace information
   *
   * @example
   * ```typescript
   * import { Log, AV_LOG_ERROR, AV_LOG_TRACE, AV_LOG_QUIET } from '@seydx/ffmpeg';
   *
   * // Only show errors and fatal messages
   * Log.setLevel(AV_LOG_ERROR);
   *
   * // Show everything (warning: very verbose!)
   * Log.setLevel(AV_LOG_TRACE);
   *
   * // Disable all logging for maximum performance
   * Log.setLevel(AV_LOG_QUIET);
   * ```
   *
   * @see {@link getLevel} To retrieve current level
   */
  static setLevel(level: AVLogLevel): void {
    bindings.Log.setLevel(level);
  }

  /**
   * Get the current global log level.
   *
   * Returns the current FFmpeg log level setting.
   *
   * Direct mapping to av_log_get_level()
   *
   * @returns Current log level (AV_LOG_* constant)
   *
   * @example
   * ```typescript
   * import { Log, AV_LOG_INFO } from '@seydx/ffmpeg';
   *
   * const currentLevel = Log.getLevel();
   * console.log(`Current log level: ${currentLevel}`);
   *
   * // Temporarily change log level
   * const savedLevel = Log.getLevel();
   * Log.setLevel(AV_LOG_INFO);
   * // ... do something ...
   * Log.setLevel(savedLevel); // Restore
   * ```
   *
   * @see {@link setLevel} To change the level
   */
  static getLevel(): AVLogLevel {
    return bindings.Log.getLevel();
  }

  /**
   * Log a message through FFmpeg's logging system.
   *
   * Sends a message through FFmpeg's internal logging system.
   * The message will be processed according to the current log level and callback.
   *
   * Direct mapping to av_log()
   *
   * @param level - Log level (AV_LOG_* constant)
   * @param message - Message to log
   *
   * @example
   * ```typescript
   * import { Log, AV_LOG_INFO, AV_LOG_ERROR, AV_LOG_WARNING } from '@seydx/ffmpeg';
   *
   * Log.log(AV_LOG_INFO, 'Starting processing...');
   * Log.log(AV_LOG_WARNING, 'Frame rate might be inaccurate');
   * Log.log(AV_LOG_ERROR, 'Failed to open codec');
   *
   * // With formatting
   * const frameNum = 42;
   * Log.log(AV_LOG_INFO, `Processing frame ${frameNum}`);
   * ```
   */
  static log(level: AVLogLevel, message: string): void {
    bindings.Log.log(level, message);
  }

  /**
   * Set a callback to capture FFmpeg log messages.
   *
   * Installs a custom callback to intercept FFmpeg's log messages.
   * This implementation uses ThreadSafeFunction for zero-blocking operation.
   * Messages are processed asynchronously without impacting FFmpeg performance.
   * Use options.maxLevel to filter messages at the C level for best performance.
   *
   * Direct mapping to av_log_set_callback()
   *
   * @param callback - Function to receive log messages, or null to reset
   * @param options - Options to control performance impact:
   *   - maxLevel: Only capture messages at or below this level (filtered in C++)
   *   - buffered: Buffer messages for batch processing
   *
   * @example
   * ```typescript
   * import { Log, AV_LOG_ERROR, AV_LOG_WARNING } from '@seydx/ffmpeg';
   *
   * // Simple callback (warning: can be slow!)
   * Log.setCallback((level, message) => {
   *   console.log(`[${level}] ${message}`);
   * });
   *
   * // Performance-optimized callback (filters at C level)
   * Log.setCallback((level, message) => {
   *   errorReporter.log(message);
   * }, {
   *   maxLevel: AV_LOG_ERROR  // Only capture errors (filtered in C++)
   * });
   *
   * // Structured logging
   * Log.setCallback((level, message) => {
   *   myLogger.log({
   *     level: level,
   *     message: message,
   *     timestamp: Date.now(),
   *     source: 'ffmpeg'
   *   });
   * }, {
   *   maxLevel: AV_LOG_WARNING
   * });
   *
   * // Reset to default (output to stderr)
   * Log.setCallback(null);
   * ```
   *
   * Note: Messages are processed asynchronously and non-blocking.
   *
   * @see {@link resetCallback} To remove callback
   */
  static setCallback(callback: ((level: AVLogLevel, message: string) => void) | null, options?: LogOptions): void {
    if (callback === null) {
      bindings.Log.setCallback(null);
    } else {
      bindings.Log.setCallback(callback, options);
    }
  }

  /**
   * Reset logging to default behavior.
   *
   * Removes any custom callback and restores FFmpeg's default logging to stderr.
   * Also clears any buffered messages from previous callbacks.
   *
   * Direct mapping to av_log_set_callback(av_log_default_callback)
   *
   * @example
   * ```typescript
   * import { Log } from '@seydx/ffmpeg';
   *
   * // Remove custom callback
   * Log.resetCallback();
   * // Now logs go to stderr again
   *
   * // Equivalent to:
   * Log.setCallback(null);
   * ```
   *
   * @see {@link setCallback} To install custom callback
   */
  static resetCallback(): void {
    bindings.Log.resetCallback();
  }
}
