import { bindings } from './binding.js';

import type { CodecContext } from './codec-context.js';
import type { AVCodecID } from './constants.js';
import type { NativeCodecParser, NativeWrapper } from './native-types.js';
import type { Packet } from './packet.js';

/**
 * Codec parser for splitting elementary streams into frames.
 *
 * Parsers split raw byte streams (currently only video) into coded frames.
 * Many decoders require that coded video frames are preceded by a start code,
 * and this parser splits the stream at these boundaries. Parsers are essential
 * for handling raw elementary streams from sources like network streams or
 * raw video files without container format.
 *
 * Direct wrapper around AVCodecParserContext.
 *
 * @example
 * ```typescript
 * import { CodecParser, CodecContext, Packet, FFmpegError } from '@seydx/av';
 * import { AV_CODEC_ID_H264, AV_NOPTS_VALUE } from '@seydx/av/constants';
 *
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
 *   const ret = await codecContext.sendPacket(packet);
 *   FFmpegError.throwIfError(ret, 'sendPacket');
 * }
 *
 * parser.close();
 * ```
 *
 * @see {@link CodecContext} For decoding parsed packets
 * @see {@link Packet} For storing parsed frame data
 */
export class CodecParser implements NativeWrapper<NativeCodecParser> {
  private native: NativeCodecParser;

  /**
   * Create a new CodecParser instance.
   *
   * The parser is uninitialized - you must call init() before use.
   * No FFmpeg resources are allocated until init() is called.
   *
   * Direct wrapper around AVCodecParserContext allocation.
   *
   * @example
   * ```typescript
   * import { CodecParser } from '@seydx/av';
   * import { AV_CODEC_ID_MPEG1VIDEO } from '@seydx/av/constants';
   *
   * const parser = new CodecParser();
   * parser.init(AV_CODEC_ID_MPEG1VIDEO);
   * // parser is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.CodecParser();
  }

  /**
   * Initialize the parser with a specific codec ID.
   *
   * Allocates and initializes the AVCodecParserContext for the specified codec.
   * Must be called before parse2() can be used.
   *
   * Direct mapping to av_parser_init()
   *
   * @param codecId - AVCodecID of the codec to parse
   *
   * @throws {Error} Parser for codec ID not found
   *
   * @example
   * ```typescript
   * import { CodecParser } from '@seydx/av';
   * import { AV_CODEC_ID_H264, AV_CODEC_ID_HEVC } from '@seydx/av/constants';
   *
   * const parser = new CodecParser();
   *
   * // Initialize for H.264
   * parser.init(AV_CODEC_ID_H264);
   * // Parser is now ready to parse H.264 streams
   *
   * // For HEVC/H.265
   * const hevcParser = new CodecParser();
   * hevcParser.init(AV_CODEC_ID_HEVC);
   * ```
   *
   * @see {@link parse2} For parsing data after initialization
   */
  init(codecId: AVCodecID): void {
    this.native.init(codecId);
  }

  /**
   * Parse a buffer and extract packets from elementary stream.
   *
   * Parses the input buffer and extracts complete coded frames. The parser
   * maintains internal state to handle partial frames across multiple calls.
   * The parser may combine multiple frames into one packet or split one frame
   * into multiple packets, depending on the codec and stream format.
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
   * @returns Number of bytes consumed from the input buffer:
   *   - >0: Number of bytes consumed from input
   *   - 0: More data needed to complete a frame
   *
   * @example
   * ```typescript
   * import { CodecParser, CodecContext, Packet, FFmpegError } from '@seydx/av';
   * import { AV_NOPTS_VALUE } from '@seydx/av/constants';
   * import * as fs from 'fs';
   *
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
   *     const ret = await codecContext.sendPacket(packet);
   *     FFmpegError.throwIfError(ret, 'sendPacket');
   *   }
   * }
   * ```
   *
   * @see {@link init} Must be called before parse2
   * @see {@link close} Should be called when done parsing
   */
  parse2(codecContext: CodecContext, packet: Packet, data: Buffer, pts: bigint, dts: bigint, pos: number): number {
    return this.native.parse2(codecContext.getNative(), packet.getNative(), data, pts, dts, pos);
  }

  /**
   * Close the parser and free all resources.
   *
   * Releases all resources associated with the parser context.
   * After calling close(), the parser instance should not be used anymore.
   *
   * Direct mapping to av_parser_close()
   *
   * @example
   * ```typescript
   * import { CodecParser } from '@seydx/av';
   *
   * const parser = new CodecParser();
   * // ... use parser ...
   *
   * parser.close();
   * // Parser resources are now freed
   * // Do not use parser after this point
   * ```
   */
  close(): void {
    this.native.close();
  }

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
