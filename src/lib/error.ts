import type { AVError } from './constants.js';
import {
  AV_ERROR_BSF_NOT_FOUND,
  AV_ERROR_BUFFER_TOO_SMALL,
  AV_ERROR_BUG,
  AV_ERROR_BUG2,
  AV_ERROR_DECODER_NOT_FOUND,
  AV_ERROR_DEMUXER_NOT_FOUND,
  AV_ERROR_EAGAIN,
  AV_ERROR_EINVAL,
  AV_ERROR_EIO,
  AV_ERROR_ENCODER_NOT_FOUND,
  AV_ERROR_ENOMEM,
  AV_ERROR_ENOSYS,
  AV_ERROR_EOF,
  AV_ERROR_EPERM,
  AV_ERROR_EPIPE,
  AV_ERROR_ETIMEDOUT,
  AV_ERROR_EXIT,
  AV_ERROR_EXPERIMENTAL,
  AV_ERROR_EXTERNAL,
  AV_ERROR_FILTER_NOT_FOUND,
  AV_ERROR_HTTP_BAD_REQUEST,
  AV_ERROR_HTTP_FORBIDDEN,
  AV_ERROR_HTTP_NOT_FOUND,
  AV_ERROR_HTTP_OTHER_4XX,
  AV_ERROR_HTTP_SERVER_ERROR,
  AV_ERROR_HTTP_UNAUTHORIZED,
  AV_ERROR_INPUT_CHANGED,
  AV_ERROR_INVALIDDATA,
  AV_ERROR_MUXER_NOT_FOUND,
  AV_ERROR_OPTION_NOT_FOUND,
  AV_ERROR_OUTPUT_CHANGED,
  AV_ERROR_PATCHWELCOME,
  AV_ERROR_PROTOCOL_NOT_FOUND,
  AV_ERROR_STREAM_NOT_FOUND,
  AV_ERROR_UNKNOWN,
} from './constants.js';

/**
 * FFmpeg error with native error message support
 */
export class FFmpegError extends Error {
  constructor(
    public readonly code: number | AVError,
    message?: string,
  ) {
    super(message ?? FFmpegError.getErrorMessage(code));
    this.name = 'FFmpegError';
  }

  /**
   * Get human-readable error message for error code
   * Note: FFmpeg uses negative error codes
   */
  static getErrorMessage(code: number | AVError): string {
    // Common POSIX errors
    switch (code) {
      // POSIX errors
      case AV_ERROR_EAGAIN:
        return 'Resource temporarily unavailable';
      case AV_ERROR_ENOMEM:
        return 'Out of memory';
      case AV_ERROR_EINVAL:
        return 'Invalid argument';
      case AV_ERROR_EPIPE:
        return 'Broken pipe';
      case AV_ERROR_EIO:
        return 'I/O error';
      case AV_ERROR_EPERM:
        return 'Operation not permitted';
      case AV_ERROR_ETIMEDOUT:
        return 'Connection timed out';
      case AV_ERROR_ENOSYS:
        return 'Function not implemented';

      // FFmpeg specific errors
      case AV_ERROR_EOF:
        return 'End of file';
      case AV_ERROR_BSF_NOT_FOUND:
        return 'Bitstream filter not found';
      case AV_ERROR_BUFFER_TOO_SMALL:
        return 'Buffer too small';
      case AV_ERROR_BUG:
      case AV_ERROR_BUG2:
        return 'Internal bug, should not have happened';
      case AV_ERROR_DECODER_NOT_FOUND:
        return 'Decoder not found';
      case AV_ERROR_DEMUXER_NOT_FOUND:
        return 'Demuxer not found';
      case AV_ERROR_ENCODER_NOT_FOUND:
        return 'Encoder not found';
      case AV_ERROR_EXIT:
        return 'Immediate exit requested';
      case AV_ERROR_EXPERIMENTAL:
        return 'Experimental feature';
      case AV_ERROR_EXTERNAL:
        return 'External library error';
      case AV_ERROR_FILTER_NOT_FOUND:
        return 'Filter not found';
      case AV_ERROR_HTTP_BAD_REQUEST:
        return 'HTTP 400 Bad Request';
      case AV_ERROR_HTTP_FORBIDDEN:
        return 'HTTP 403 Forbidden';
      case AV_ERROR_HTTP_NOT_FOUND:
        return 'HTTP 404 Not Found';
      case AV_ERROR_HTTP_OTHER_4XX:
        return 'HTTP 4xx Client Error';
      case AV_ERROR_HTTP_SERVER_ERROR:
        return 'HTTP 500 Server Error';
      case AV_ERROR_HTTP_UNAUTHORIZED:
        return 'HTTP 401 Unauthorized';
      case AV_ERROR_INPUT_CHANGED:
        return 'Input changed';
      case AV_ERROR_INVALIDDATA:
        return 'Invalid data found when processing input';
      case AV_ERROR_MUXER_NOT_FOUND:
        return 'Muxer not found';
      case AV_ERROR_OPTION_NOT_FOUND:
        return 'Option not found';
      case AV_ERROR_OUTPUT_CHANGED:
        return 'Output changed';
      case AV_ERROR_PATCHWELCOME:
        return 'Not yet implemented, patches welcome';
      case AV_ERROR_PROTOCOL_NOT_FOUND:
        return 'Protocol not found';
      case AV_ERROR_STREAM_NOT_FOUND:
        return 'Stream not found';
      case AV_ERROR_UNKNOWN:
        return 'Unknown error';
      default:
        // Try to get error string from FFmpeg if available
        // For now, return generic message
        if (code < 0) {
          return `FFmpeg error: ${code}`;
        }
        return `Unknown error code: ${code}`;
    }
  }

  /**
   * Check if error is a specific error code
   */
  is(code: number | AVError): boolean {
    return this.code === code;
  }

  /**
   * Check if error is EAGAIN (would block)
   */
  get isEagain(): boolean {
    return this.code === AV_ERROR_EAGAIN;
  }

  /**
   * Check if error is EOF
   */
  get isEof(): boolean {
    return this.code === AV_ERROR_EOF;
  }

  /**
   * Helper to check if operation should be retried
   */
  get shouldRetry(): boolean {
    return this.isEagain;
  }
}
