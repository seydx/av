import { bindings } from './binding.js';

import type { AVCodecID } from '../constants/constants.js';
import type { CodecContext } from './codec-context.js';
import type { NativeCodecParser, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Parser for extracting codec frames from raw bitstream data.
 *
 * Analyzes and splits raw bitstream data into individual codec frames.
 * Essential for processing elementary streams, extracting NAL units,
 * and handling frame boundaries in raw codec data. Commonly used for
 * parsing H.264/H.265 streams, AAC ADTS streams, and other raw formats.
 *
 * Direct mapping to FFmpeg's AVCodecParserContext.
 *
 * @example
 * ```typescript
 * import { CodecParser, CodecContext, Packet, FFmpegError } from 'node-av';
 * import { AV_CODEC_ID_H264 } from 'node-av/constants';
 *
 * // Create and initialize parser
 * const parser = new CodecParser();
 * parser.init(AV_CODEC_ID_H264);
 *
 * // Parse raw data into packets
 * const packet = new Packet();
 * packet.alloc();
 *
 * const rawData = Buffer.from([...]); // Raw H.264 stream
 * const ret = parser.parse2(
 *   codecContext,
 *   packet,
 *   rawData,
 *   0n,  // pts
 *   0n,  // dts
 *   0    // position
 * );
 *
 * if (ret > 0) {
 *   // Got complete packet, ret is consumed bytes
 *   console.log(`Parsed ${ret} bytes into packet`);
 * }
 *
 * // Cleanup
 * parser.close();
 * ```
 *
 * @see {@link [AVCodecParserContext](https://ffmpeg.org/doxygen/trunk/structAVCodecParserContext.html)}
 * @see {@link CodecContext} For decoding parsed packets
 */
export class CodecParser implements Disposable, NativeWrapper<NativeCodecParser> {
  private native: NativeCodecParser;

  constructor() {
    this.native = new bindings.CodecParser();
  }

  /**
   * Initialize parser for specific codec.
   *
   * Sets up the parser to handle a specific codec format.
   * Must be called before parsing data.
   *
   * Direct mapping to av_parser_init().
   *
   * @param codecId - Codec ID to parse
   *
   * @throws {Error} If codec parser not available
   *
   * @example
   * ```typescript
   * import { AV_CODEC_ID_AAC } from 'node-av/constants';
   *
   * const parser = new CodecParser();
   * parser.init(AV_CODEC_ID_AAC);
   * // Parser ready for AAC ADTS streams
   * ```
   *
   * @see {@link parse2} To parse data
   * @see {@link close} To cleanup
   */
  init(codecId: AVCodecID): void {
    this.native.init(codecId);
  }

  /**
   * Parse bitstream data into packets.
   *
   * Analyzes raw bitstream data and extracts complete codec frames.
   * May require multiple calls to accumulate enough data for a complete frame.
   * Returns the number of bytes consumed from the input buffer.
   *
   * Direct mapping to av_parser_parse2().
   *
   * @param codecContext - Codec context for parser state
   * @param packet - Packet to receive parsed frame
   * @param data - Raw bitstream data to parse
   * @param pts - Presentation timestamp for data
   * @param dts - Decoding timestamp for data
   * @param pos - Byte position in stream
   * @returns Number of bytes consumed from data, negative on error:
   *   - AVERROR_EINVAL: Invalid parameters
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * let offset = 0;
   * while (offset < rawData.length) {
   *   const remaining = rawData.subarray(offset);
   *   const ret = parser.parse2(
   *     codecContext,
   *     packet,
   *     remaining,
   *     pts,
   *     dts,
   *     offset
   *   );
   *
   *   if (ret < 0) {
   *     FFmpegError.throwIfError(ret, 'parse2');
   *   }
   *
   *   offset += ret;
   *
   *   if (packet.size > 0) {
   *     // Got complete packet
   *     await processPacket(packet);
   *     packet.unref();
   *   }
   * }
   * ```
   *
   * @see {@link init} To initialize parser
   */
  parse2(codecContext: CodecContext, packet: Packet, data: Buffer, pts: bigint, dts: bigint, pos: number): number {
    return this.native.parse2(codecContext.getNative(), packet.getNative(), data, pts, dts, pos);
  }

  /**
   * Close the codec parser.
   *
   * Releases all resources associated with the parser.
   * The parser becomes invalid after calling this.
   *
   * Direct mapping to av_parser_close().
   *
   * @example
   * ```typescript
   * parser.close();
   * // Parser is now invalid
   * ```
   *
   * @see {@link init} To initialize
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  close(): void {
    this.native.close();
  }

  /**
   * Get the underlying native CodecParser object.
   *
   * @returns The native CodecParser binding object
   *
   * @internal
   */
  getNative(): NativeCodecParser {
    return this.native;
  }

  /**
   * Dispose of the codec parser.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   using parser = new CodecParser();
   *   parser.init(AV_CODEC_ID_H264);
   *   // Use parser...
   * } // Automatically closed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
