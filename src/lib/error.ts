import { bindings } from './binding.js';
import type { NativeFFmpegError } from './native-types.js';

/**
 * FFmpeg Error - Low Level API
 *
 * Direct mapping to FFmpeg's error system.
 * Represents an FFmpeg error with its error code and message.
 * Provides utility methods for error handling.
 *
 * @example
 * ```typescript
 * // Check return codes
 * const ret = await codecContext.sendPacket(packet);
 * if (ret < 0) {
 *   throw new FFmpegError(ret);
 * }
 *
 * // Handle specific errors
 * try {
 *   await formatContext.openInput('file.mp4', null, null);
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

  // Constructor
  /**
   * Create a new FFmpegError instance.
   *
   * Wraps an FFmpeg error code with a JavaScript Error.
   *
   * @param code - FFmpeg error code (negative number)
   *
   * @example
   * ```typescript
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

  // Static Methods

  /**
   * Put a description of the AVERROR code errnum in a string.
   *
   * Direct mapping to av_strerror()
   *
   * @param errnum - Error code to describe
   *
   * @returns Error description string
   *
   * @example
   * ```typescript
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
   * Direct mapping to AVERROR() macro
   *
   * @param posixError - POSIX error code (positive)
   *
   * @returns FFmpeg error code (negative)
   *
   * @example
   * ```typescript
   * import { EAGAIN } from 'errno';
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
   * Helper method for error checking.
   *
   * @param code - FFmpeg return code
   * @param operation - Optional operation name for better error messages
   *
   * @throws {FFmpegError} If code < 0
   *
   * @example
   * ```typescript
   * const ret = await codecContext.sendPacket(packet);
   * FFmpegError.throwIfError(ret, 'sendPacket');
   * // Continues if successful, throws if error
   *
   * // With operation name for better error messages
   * const ret2 = formatContext.allocOutputContext2(null, 'mp4', 'out.mp4');
   * FFmpegError.throwIfError(ret2, 'allocOutputContext2');
   * // Error message: "allocOutputContext2 failed: ..."
   * ```
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
   * Helper method for error type checking.
   *
   * @param code - FFmpeg return code
   * @param errorCode - Error code to check against
   *
   * @returns true if codes match, false otherwise
   *
   * @example
   * ```typescript
   * import { AVERROR_EOF, AVERROR_EAGAIN } from './constants.js';
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

  // Getter Properties

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

  // Internal Methods

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
