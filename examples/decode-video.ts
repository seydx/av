/**
 * Decode Video Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/decode_video.c
 * Read from an MPEG1 video file, decode frames, and generate PGM images as output.
 *
 * Usage: tsx examples/decode-video.ts <input> <output_prefix>
 * Example: tsx examples/decode-video.ts testdata/video.m1v examples/.tmp/output.pgm
 *
 * Note: Input should be raw MPEG1 video stream (not in a container).
 * For testing, you can extract raw video from a container:
 * ffmpeg -i input.mp4 -c:v mpeg1video -f mpeg1video test.m1v
 */

import { closeSync, existsSync, mkdirSync, openSync, readSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

import {
  AV_CODEC_ID_MPEG1VIDEO,
  AV_INPUT_BUFFER_PADDING_SIZE,
  AV_NOPTS_VALUE,
  AVERROR_EAGAIN,
  AVERROR_EOF,
  Codec,
  CodecContext,
  CodecParser,
  FFmpegError,
  Frame,
  Packet,
} from '../src/index.js';

const INBUF_SIZE = 4096;

/**
 * Save a frame as PGM image
 */
function pgmSave(data: Buffer, linesize: number, width: number, height: number, filename: string): void {
  const fd = openSync(filename, 'w');

  // Write PGM header
  writeSync(fd, `P5\n${width} ${height}\n255\n`);

  // Write pixel data row by row
  for (let y = 0; y < height; y++) {
    const start = y * linesize;
    const row = data.subarray(start, start + width);
    writeSync(fd, row);
  }

  closeSync(fd);
}

/**
 * Decode packets and save frames
 */
async function decode(decCtx: CodecContext, frame: Frame, pkt: Packet | null, outfilePrefix: string): Promise<void> {
  // Send packet to decoder
  const sendRet = await decCtx.sendPacket(pkt);
  FFmpegError.throwIfError(sendRet, 'Error sending packet for decoding');

  // Receive all available frames
  while (true) {
    const recvRet = await decCtx.receiveFrame(frame);

    if (FFmpegError.is(recvRet, AVERROR_EAGAIN) || FFmpegError.is(recvRet, AVERROR_EOF)) {
      return;
    }

    FFmpegError.throwIfError(recvRet, 'Error during decoding');

    console.log(`Saving frame ${decCtx.frameNumber}`);

    // Get frame data
    const frameData = frame.data;
    if (!frameData?.[0]) {
      console.error('No frame data available');
      continue;
    }

    // Save frame as PGM
    const filename = `${outfilePrefix}-${decCtx.frameNumber}.pgm`;
    pgmSave(frameData[0], frame.linesize[0], frame.width, frame.height, filename);
  }
}

/**
 * Main decode video function
 */
async function decodeVideo(inputFile: string, outputPrefix: string): Promise<void> {
  let codec: Codec | null = null;
  let parser: CodecParser | null = null;
  let codecCtx: CodecContext | null = null;
  let frame: Frame | null = null;
  let packet: Packet | null = null;
  let fileHandle: number | null = null;

  try {
    // Allocate packet
    packet = new Packet();
    packet.alloc();

    // Find the MPEG1 video decoder
    codec = Codec.findDecoder(AV_CODEC_ID_MPEG1VIDEO);
    if (!codec) {
      throw new Error('MPEG1 video decoder not found');
    }

    // Initialize parser
    parser = new CodecParser();
    parser.init(codec.id);

    // Allocate codec context
    codecCtx = new CodecContext();
    codecCtx.allocContext3(codec);

    // Open codec
    const openRet = await codecCtx.open2(codec, null);
    FFmpegError.throwIfError(openRet, 'Could not open codec');

    // Open input file
    fileHandle = openSync(inputFile, 'r');

    // Allocate frame
    frame = new Frame();
    frame.alloc();

    // Input buffer with padding
    const inbuf = Buffer.alloc(INBUF_SIZE + AV_INPUT_BUFFER_PADDING_SIZE);

    let eof = false;
    do {
      // Read raw data from input file
      const bytesRead = readSync(fileHandle, inbuf, 0, INBUF_SIZE, null);
      if (bytesRead === 0) {
        eof = true;
      }

      let dataOffset = 0;
      let dataSize = bytesRead;

      // Use parser to split data into frames
      while (dataSize > 0 || eof) {
        const parseRet = parser.parse2(codecCtx, packet, inbuf.subarray(dataOffset, dataOffset + dataSize), AV_NOPTS_VALUE, AV_NOPTS_VALUE, 0);

        FFmpegError.throwIfError(parseRet, 'Error while parsing');

        dataOffset += parseRet;
        dataSize -= parseRet;

        // If we have a complete packet, decode it
        if (packet.size > 0) {
          await decode(codecCtx, frame, packet, outputPrefix);
        } else if (eof) {
          break;
        }
      }
    } while (!eof);

    // Flush decoder
    console.log('Flushing decoder...');
    await decode(codecCtx, frame, null, outputPrefix);

    console.log('Decoding completed successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (fileHandle !== null) {
      closeSync(fileHandle);
    }
    if (parser) {
      parser.close();
    }
    if (codecCtx) {
      codecCtx.freeContext();
    }
    if (frame) {
      frame.free();
    }
    if (packet) {
      packet.free();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: tsx examples/decode-video.ts <input> <output_prefix>');
    console.log('Example: tsx examples/decode-video.ts input.m1v output');
    console.log('');
    console.log('Note: Input should be raw MPEG1 video stream.');
    console.log('You can create one with:');
    console.log('  ffmpeg -i input.mp4 -c:v mpeg1video -f mpeg1video test.m1v');
    process.exit(1);
  }

  const [inputFile, outputPrefix] = args;

  // Check if input file exists
  if (!existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  // Create output directory if needed
  const outputDir = dirname(outputPrefix);
  if (outputDir && outputDir !== '.' && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    await decodeVideo(inputFile, outputPrefix);
    process.exit(0);
  } catch (error) {
    if (error instanceof FFmpegError) {
      console.error(`FFmpeg Error: ${error.message} (code: ${error.code})`);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
