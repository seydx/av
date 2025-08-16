import { bindings } from './binding.js';

import type { CodecContext } from './codec-context.js';
import type { AVCodecID } from './constants.js';
import type { NativeCodecParser, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Wrapper for AVCodecParserContext - parser for splitting elementary streams into frames.
 *
 * Parsers split raw byte streams (currently only video) into coded frames.
 * Many decoders require that coded video frames are preceded by a start code,
 * and this parser splits the stream at these boundaries.
 *
 * Direct wrapper around AVCodecParserContext.
 *
 * @example
 * ```typescript
 * const parser = new CodecParser();
 * parser.init(AV_CODEC_ID_H264);
 *
 * // Parse raw H.264 stream
 * const packet = new Packet();
 * packet.alloc();
 *
 * const bytesConsumed = parser.parse2(
 *   codecContext,
 *   packet,
 *   inputBuffer,
 *   AV_NOPTS_VALUE,
 *   AV_NOPTS_VALUE,
 *   0
 * );
 *
 * if (packet.size > 0) {
 *   // We have a complete frame in packet
 *   await codecContext.sendPacket(packet);
 * }
 *
 * parser.close();
 * ```
 */
export class CodecParser implements NativeWrapper<NativeCodecParser> {
  private native: NativeCodecParser;

  // Constructor

  /**
   * Create a new CodecParser instance.
   *
   * The parser is uninitialized - you must call init() before use.
   * Direct wrapper around AVCodecParserContext.
   *
   * @example
   * ```typescript
   * const parser = new CodecParser();
   * parser.init(AV_CODEC_ID_MPEG1VIDEO);
   * // parser is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.CodecParser();
  }

  // Public Methods

  /**
   * Initialize the parser with a specific codec ID.
   *
   * Direct mapping to av_parser_init()
   *
   * @param codecId - AVCodecID of the codec to parse
   *
   * @throws Error if parser for codec ID not found
   *
   * @example
   * ```typescript
   * const parser = new CodecParser();
   * parser.init(AV_CODEC_ID_H264);
   * // Parser is now ready to parse H.264 streams
   * ```
   */
  init(codecId: AVCodecID): void {
    this.native.init(codecId);
  }

  /**
   * Parse a buffer and extract packets.
   *
   * Direct mapping to av_parser_parse2()
   *
   * @param codecContext - Codec context (used for stream parameters)
   * @param packet - Packet to fill with parsed data
   * @param data - Input buffer containing elementary stream data
   * @param pts - Presentation timestamp of the first byte in data
   * @param dts - Decoding timestamp of the first byte in data
   * @param pos - Byte position of the first byte in data in the stream
   *
   * @returns Number of bytes consumed from the input buffer.
   *          May be 0 if more data is needed to complete a frame.
   *
   * @example
   * ```typescript
   * const inbuf = Buffer.alloc(4096);
   * const bytesRead = fs.readSync(fd, inbuf, 0, 4096, null);
   *
   * let offset = 0;
   * while (offset < bytesRead) {
   *   const consumed = parser.parse2(
   *     codecContext,
   *     packet,
   *     inbuf.subarray(offset),
   *     AV_NOPTS_VALUE,
   *     AV_NOPTS_VALUE,
   *     0
   *   );
   *
   *   offset += consumed;
   *
   *   if (packet.size > 0) {
   *     // Complete packet ready for decoding
   *     await codecContext.sendPacket(packet);
   *   }
   * }
   * ```
   *
   * The parser may combine multiple frames into one packet or split one frame
   * into multiple packets, depending on the codec and stream format.
   */
  parse2(codecContext: CodecContext, packet: Packet, data: Buffer, pts: bigint, dts: bigint, pos: number): number {
    return this.native.parse2(codecContext.getNative(), packet.getNative(), data, pts, dts, pos);
  }

  /**
   * Close the parser and free resources.
   *
   * Direct mapping to av_parser_close()
   *
   * @example
   * ```typescript
   * parser.close();
   * // Parser resources are now freed
   * ```
   *
   * After calling close(), the parser instance should not be used anymore.
   */
  close(): void {
    this.native.close();
  }

  // Internal Methods

  /**
   * @internal
   * Get the underlying native codec parser object.
   * This method is for internal use by other FFmpeg classes.
   *
   * @returns The underlying native codec parser object
   */
  getNative(): NativeCodecParser {
    return this.native;
  }
}
