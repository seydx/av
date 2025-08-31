import { bindings } from './binding.js';

import type { AVError } from '../constants/constants.js';
import type { NativeFFmpegError } from './native-types.js';

/**
 * POSIX error names that can be converted to FFmpeg error codes.
 * These are platform-specific and resolved at runtime.
 */
export enum PosixError {
  EAGAIN = 'EAGAIN',
  ENOMEM = 'ENOMEM',
  EINVAL = 'EINVAL',
  EIO = 'EIO',
  EPIPE = 'EPIPE',
  ENOSPC = 'ENOSPC',
  ENOENT = 'ENOENT',
  EACCES = 'EACCES',
  EPERM = 'EPERM',
  EEXIST = 'EEXIST',
  ENODEV = 'ENODEV',
  ENOTDIR = 'ENOTDIR',
  EISDIR = 'EISDIR',
  EBUSY = 'EBUSY',
  EMFILE = 'EMFILE',
  ERANGE = 'ERANGE',
}

// Cache for error codes to avoid repeated native calls
const errorCache: Record<string, AVError> = {};

/**
 * Get a cached FFmpeg error code by name.
 * @internal
 */
function getCachedError(name: PosixError): AVError {
  if (!(name in errorCache)) {
    errorCache[name] = bindings.FFmpegError.getAverror(name);
  }
  return errorCache[name];
}

// Platform-specific POSIX errors used by FFmpeg
// These MUST be computed at runtime because POSIX error codes
// differ between operating systems (e.g., EAGAIN is 35 on macOS but 11 on Linux)
export const AVERROR_EAGAIN = getCachedError(PosixError.EAGAIN);
export const AVERROR_ENOMEM = getCachedError(PosixError.ENOMEM);
export const AVERROR_EINVAL = getCachedError(PosixError.EINVAL);
export const AVERROR_EIO = getCachedError(PosixError.EIO);
export const AVERROR_EPIPE = getCachedError(PosixError.EPIPE);
export const AVERROR_ENOSPC = getCachedError(PosixError.ENOSPC);
export const AVERROR_ENOENT = getCachedError(PosixError.ENOENT);
export const AVERROR_EACCES = getCachedError(PosixError.EACCES);
export const AVERROR_EPERM = getCachedError(PosixError.EPERM);
export const AVERROR_EEXIST = getCachedError(PosixError.EEXIST);
export const AVERROR_ENODEV = getCachedError(PosixError.ENODEV);
export const AVERROR_ENOTDIR = getCachedError(PosixError.ENOTDIR);
export const AVERROR_EISDIR = getCachedError(PosixError.EISDIR);
export const AVERROR_EBUSY = getCachedError(PosixError.EBUSY);
export const AVERROR_EMFILE = getCachedError(PosixError.EMFILE);
export const AVERROR_ERANGE = getCachedError(PosixError.ERANGE);

/**
 * FFmpeg error handling.
 *
 * Represents FFmpeg errors with error codes and human-readable messages.
 * Provides utilities for error checking and throwing.
 * Essential for proper error handling in FFmpeg operations.
 *
 * Direct mapping to FFmpeg's error system.
 *
 * @example
 * ```typescript
 * import { FFmpegError } from 'node-av';
 *
 * // Check return codes
 * const ret = await codecContext.sendPacket(packet);
 * FFmpegError.throwIfError(ret, 'sendPacket');
 *
 * // Handle specific errors
 * try {
 *   const openRet = await formatContext.openInput('file.mp4', null, null);
 *   FFmpegError.throwIfError(openRet, 'openInput');
 * } catch (error) {
 *   if (error instanceof FFmpegError) {
 *     console.error(`Error code: ${error.code}`);
 *     console.error(`Message: ${error.message}`);
 *   }
 * }
 * ```
 */
export class FFmpegError extends Error {
  private native: NativeFFmpegError;

  /**
   * Create a new FFmpegError instance.
   *
   * Wraps an FFmpeg error code with a JavaScript Error.
   * Automatically retrieves the error message from FFmpeg.
   *
   * Direct wrapper around FFmpeg error codes.
   *
   * @param code - FFmpeg error code (negative number)
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EOF } from 'node-av/constants';
   *
   * const error = new FFmpegError(AVERROR_EOF);
   * console.log(error.message); // "End of file"
   * console.log(error.code);    // -541478725
   * ```
   */
  constructor(code?: number) {
    const native = new bindings.FFmpegError(code);
    const message = code !== undefined ? native.message : 'FFmpeg Error';
    super(message);

    this.native = native;
    this.name = 'FFmpegError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FFmpegError);
    }
  }

  /**
   * Put a description of the AVERROR code errnum in a string.
   *
   * Converts an error code to a human-readable message.
   *
   * Direct mapping to av_strerror()
   *
   * @param errnum - Error code to describe
   *
   * @returns Error description string
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EAGAIN, AVERROR_EOF } from 'node-av/constants';
   *
   * const message = FFmpegError.strerror(AVERROR_EAGAIN);
   * console.log(message); // "Resource temporarily unavailable"
   *
   * const message2 = FFmpegError.strerror(AVERROR_EOF);
   * console.log(message2); // "End of file"
   * ```
   */
  static strerror(errnum: number): string {
    return bindings.FFmpegError.strerror(errnum);
  }

  /**
   * Get FFmpeg error code by POSIX error name dynamically.
   *
   * This method provides platform-independent access to POSIX error codes
   * converted to FFmpeg format. The POSIX error codes are resolved at runtime
   * to ensure correct platform-specific values.
   *
   * @param errorName - POSIX error name from the PosixError enum
   *
   * @returns FFmpeg error code (negative)
   *
   * @throws {TypeError} If the error name is unknown
   *
   * @example
   * ```typescript
   * import { FFmpegError, PosixError } from 'node-av';
   *
   * // Get platform-specific error codes at runtime
   * const AVERROR_EAGAIN = FFmpegError.AVERROR(PosixError.EAGAIN);
   * const AVERROR_EIO = FFmpegError.AVERROR(PosixError.EIO);
   *
   * // Use in comparisons
   * const ret = await codecContext.receiveFrame(frame);
   * if (ret === FFmpegError.AVERROR(PosixError.EAGAIN)) {
   *   console.log('Need more input');
   * }
   *
   * // Or use the pre-cached constants
   * import { AVERROR_EAGAIN } from 'node-av';
   * if (ret === AVERROR_EAGAIN) {
   *   console.log('Need more input');
   * }
   * ```
   *
   * @see {@link getKnownErrors} To get all available POSIX error codes
   * @see {@link PosixError} For the list of supported POSIX errors
   */
  static AVERROR(errorName: PosixError): AVError {
    return bindings.FFmpegError.getAverror(errorName);
  }

  /**
   * Check if a value is an error code.
   *
   * @param code - Value to check
   *
   * @returns true if code is negative (error), false otherwise
   *
   * @example
   * ```typescript
   * const ret = await formatContext.readFrame(packet);
   * if (FFmpegError.isFFmpegError(ret)) {
   *   console.error('Read frame failed');
   * }
   * ```
   */
  static isFFmpegError(code: number): boolean {
    if (typeof code !== 'number') {
      return false;
    }
    return code < 0;
  }

  /**
   * Create FFmpegError from error code if it's an error.
   *
   * Helper method to conditionally create error objects.
   *
   * @param code - FFmpeg return code
   *
   * @returns FFmpegError if code < 0, null otherwise
   *
   * @example
   * ```typescript
   * const ret = await formatContext.openInput('video.mp4', null, null);
   * const error = FFmpegError.fromCode(ret);
   * if (error) {
   *   console.error(`Failed: ${error.message}`);
   *   console.error(`Code: ${error.code}`);
   * }
   * ```
   */
  static fromCode(code: number): FFmpegError | null {
    if (code >= 0) {
      return null;
    }
    return new FFmpegError(code);
  }

  /**
   * Throw FFmpegError if code indicates error.
   *
   * Checks return code and throws an error if negative.
   * Essential for FFmpeg error handling pattern.
   *
   * @param code - FFmpeg return code
   * @param operation - Optional operation name for better error messages
   *
   * @throws {FFmpegError} If code < 0
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = await codecContext.sendPacket(packet);
   * FFmpegError.throwIfError(ret, 'sendPacket');
   * // Continues if successful, throws if error
   *
   * // With operation name for better error messages
   * const ret2 = formatContext.allocOutputContext2(null, 'mp4', 'out.mp4');
   * FFmpegError.throwIfError(ret2, 'allocOutputContext2');
   * // Error message: "allocOutputContext2 failed: ..."
   * ```
   *
   * @see {@link fromCode} To create error without throwing
   * @see {@link isFFmpegError} To check if value is error
   */
  static throwIfError(code: number, operation?: string): void {
    if (FFmpegError.isFFmpegError(code)) {
      const error = new FFmpegError(code);
      if (operation) {
        (error as any).message = `${operation} failed: ${error.message}`;
      }
      throw error;
    }
  }

  /**
   * Check if error code matches specific error.
   *
   * Compares return code with specific error constant.
   * Useful for handling different error conditions.
   *
   * @param code - FFmpeg return code
   * @param errorCode - Error code to check against
   *
   * @returns true if codes match, false otherwise
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EOF, AVERROR_EAGAIN } from 'node-av/constants';
   *
   * const ret = await codecContext.receiveFrame(frame);
   * if (FFmpegError.is(ret, AVERROR_EOF)) {
   *   console.log('End of stream reached');
   * } else if (FFmpegError.is(ret, AVERROR_EAGAIN)) {
   *   console.log('Need more input');
   * }
   * ```
   */
  static is(code: number, errorCode: number): boolean {
    return code === errorCode;
  }

  /**
   * Get error code.
   *
   * Direct mapping to AVERROR code
   *
   * FFmpeg error code (negative number).
   */
  get code(): number {
    return this.native.code;
  }

  /**
   * Get human-readable error message.
   *
   * Direct mapping to av_strerror() output
   *
   * Error description string.
   */
  get message(): string {
    return this.native.message;
  }

  /**
   * Get the native FFmpeg error object.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native error object
   */
  getNative(): NativeFFmpegError {
    return this.native;
  }
}
