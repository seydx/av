import { bindings } from './binding.js';
import type { NativeFFmpegError } from './native-types.js';

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
 * import { FFmpegError } from '@seydx/ffmpeg';
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
   * import { FFmpegError } from '@seydx/ffmpeg';
   * import { AVERROR_EOF } from '@seydx/ffmpeg/constants';
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
   * import { FFmpegError } from '@seydx/ffmpeg';
   * import { AVERROR_EAGAIN, AVERROR_EOF } from '@seydx/ffmpeg/constants';
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
   * Convert a POSIX error code to FFmpeg error code.
   *
   * Converts standard POSIX error codes to FFmpeg's error format.
   *
   * Direct mapping to AVERROR() macro
   *
   * @param posixError - POSIX error code (positive)
   *
   * @returns FFmpeg error code (negative)
   *
   * @example
   * ```typescript
   * import { FFmpegError } from '@seydx/ffmpeg';
   * import { EAGAIN } from 'errno';
   *
   * const ffmpegError = FFmpegError.makeError(EAGAIN);
   * // ffmpegError is now AVERROR(EAGAIN)
   *
   * if (ret === ffmpegError) {
   *   console.log('Resource temporarily unavailable');
   * }
   * ```
   */
  static makeError(posixError: number): number {
    return bindings.FFmpegError.makeError(posixError);
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
    return bindings.FFmpegError.isError(code);
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
   * import { FFmpegError } from '@seydx/ffmpeg';
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
    if (code < 0) {
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
   * import { FFmpegError } from '@seydx/ffmpeg';
   * import { AVERROR_EOF, AVERROR_EAGAIN } from '@seydx/ffmpeg/constants';
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
