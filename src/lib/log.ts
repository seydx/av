/**
 * FFmpeg logging functionality
 */

import { bindings } from './binding.js';
import { AV_LOG_DEBUG, AV_LOG_ERROR, AV_LOG_FATAL, AV_LOG_INFO, AV_LOG_PANIC, AV_LOG_QUIET, AV_LOG_VERBOSE, AV_LOG_WARNING } from './constants.js';

import type { AVLogLevel } from './constants.js';

/**
 * Log callback function type
 */
export type LogCallback = (level: number, message: string) => void;

/**
 * Set the FFmpeg log level
 * @param level The log level to set
 * @example
 * ```typescript
 * import { setLogLevel, AV_LOG_DEBUG } from 'ffmpeg-node';
 * setLogLevel(AV_LOG_DEBUG);
 * ```
 */
export function setLogLevel(level: AVLogLevel): void {
  bindings.setLogLevel(level);
}

/**
 * Get the current FFmpeg log level
 * @returns The current log level
 */
export function getLogLevel(): AVLogLevel {
  return bindings.getLogLevel() as AVLogLevel;
}

/**
 * Set a callback function for FFmpeg log messages
 * @param callback The callback function to handle log messages, or null to remove
 * @example
 * ```typescript
 * // Set a callback
 * setLogCallback((level, message) => {
 *   console.log(`[FFmpeg ${level}]: ${message}`);
 * });
 *
 * // Remove the callback
 * setLogCallback(null);
 * ```
 */
export function setLogCallback(callback: LogCallback | null): void {
  bindings.setLogCallback(callback);
}

/**
 * Get the log level name from a numeric level
 * @param level The numeric log level
 * @returns The name of the log level
 */
export function getLogLevelName(level: number): string {
  if (level <= AV_LOG_QUIET) return 'QUIET';
  if (level <= AV_LOG_PANIC) return 'PANIC';
  if (level <= AV_LOG_FATAL) return 'FATAL';
  if (level <= AV_LOG_ERROR) return 'ERROR';
  if (level <= AV_LOG_WARNING) return 'WARNING';
  if (level <= AV_LOG_INFO) return 'INFO';
  if (level <= AV_LOG_VERBOSE) return 'VERBOSE';
  if (level <= AV_LOG_DEBUG) return 'DEBUG';
  return 'TRACE';
}
