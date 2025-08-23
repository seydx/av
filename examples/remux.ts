#!/usr/bin/env tsx

/**
 * Remux Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/remux.c
 * Remux streams from one container format to another.
 * Data is copied from the input to the output without transcoding.
 *
 * Usage: tsx examples/remux.ts <input> <output>
 * Example: tsx examples/remux.ts testdata/video.mp4 examples/.tmp/remux.mkv
 */

import { AVERROR_EOF, AVFMT_NOFILE, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_SUBTITLE, AVMEDIA_TYPE_VIDEO, FFmpegError, FormatContext, Packet } from '../src/lib/index.js';

/**
 * Log packet information for debugging
 */
function logPacket(fmtCtx: FormatContext, pkt: Packet, tag: string): void {
  const streams = fmtCtx.streams;
  if (!streams) return;

  const stream = streams[pkt.streamIndex];
  if (!stream) return;

  const timeBase = stream.timeBase;
  const ptsTime = pkt.pts !== null ? ((Number(pkt.pts) * timeBase.num) / timeBase.den).toFixed(6) : 'N/A';
  const dtsTime = pkt.dts !== null ? ((Number(pkt.dts) * timeBase.num) / timeBase.den).toFixed(6) : 'N/A';
  const durationTime = pkt.duration !== null ? ((Number(pkt.duration) * timeBase.num) / timeBase.den).toFixed(6) : 'N/A';

  console.log(
    `${tag}: pts:${pkt.pts} pts_time:${ptsTime} dts:${pkt.dts} dts_time:${dtsTime}` +
      // eslint-disable-next-line @stylistic/indent-binary-ops
      ` duration:${pkt.duration} duration_time:${durationTime} stream_index:${pkt.streamIndex}`,
  );
}

/**
 * Main remux function
 */
async function remux(inputFile: string, outputFile: string): Promise<void> {
  let ifmtCtx: FormatContext | null = null;
  let ofmtCtx: FormatContext | null = null;
  let pkt: Packet | null = null;
  const streamMapping: number[] = [];

  try {
    // Allocate packet
    pkt = new Packet();
    pkt.alloc();

    // Open input file
    ifmtCtx = new FormatContext();
    const openRet = await ifmtCtx.openInput(inputFile, null, null);
    FFmpegError.throwIfError(openRet, 'openInput');

    // Retrieve stream information
    const findRet = await ifmtCtx.findStreamInfo(null);
    FFmpegError.throwIfError(findRet, 'findStreamInfo');

    // Dump input format (for debugging)
    console.log('Input format:');
    ifmtCtx.dumpFormat(0, inputFile, false);

    // Create output context
    ofmtCtx = new FormatContext();
    const allocRet = ofmtCtx.allocOutputContext2(null, null, outputFile);
    FFmpegError.throwIfError(allocRet, 'allocOutputContext2');

    // Get output format info
    const ofmt = ofmtCtx.oformat;
    if (!ofmt) {
      throw new Error('Could not get output format');
    }

    // Map streams from input to output
    let streamIndex = 0;
    const inputStreams = ifmtCtx.streams;
    if (!inputStreams) {
      throw new Error('No input streams found');
    }

    for (let i = 0; i < ifmtCtx.nbStreams; i++) {
      const inStream = inputStreams[i];
      if (!inStream) continue;

      const inCodecpar = inStream.codecpar;
      if (!inCodecpar) continue;

      // Only process audio, video, and subtitle streams
      if (inCodecpar.codecType !== AVMEDIA_TYPE_AUDIO && inCodecpar.codecType !== AVMEDIA_TYPE_VIDEO && inCodecpar.codecType !== AVMEDIA_TYPE_SUBTITLE) {
        streamMapping[i] = -1;
        continue;
      }

      streamMapping[i] = streamIndex++;

      // Create output stream
      const outStream = ofmtCtx.newStream(null);
      if (!outStream) {
        throw new Error('Failed allocating output stream');
      }

      // Copy codec parameters
      const copyRet = inCodecpar.copy(outStream.codecpar);
      FFmpegError.throwIfError(copyRet, 'codecpar.copy');

      // Reset codec tag
      if (outStream.codecpar) {
        outStream.codecpar.codecTag = 0;
      }
    }

    // Dump output format (for debugging)
    console.log('\nOutput format:');
    ofmtCtx.dumpFormat(0, outputFile, true);

    // Open output file if needed
    if (!(ofmt.flags & AVFMT_NOFILE)) {
      const openRet = await ofmtCtx.openOutput();
      FFmpegError.throwIfError(openRet, 'openOutput');
    }

    // Write header
    const headerRet = await ofmtCtx.writeHeader(null);
    FFmpegError.throwIfError(headerRet, 'writeHeader');

    // Main remuxing loop
    while (true) {
      // Read packet from input
      const readRet = await ifmtCtx.readFrame(pkt);

      if (FFmpegError.is(readRet, AVERROR_EOF)) {
        break; // End of file
      }
      FFmpegError.throwIfError(readRet, 'readFrame');

      // Get stream index mapping
      const inStreamIndex = pkt.streamIndex;
      if (inStreamIndex >= streamMapping.length || streamMapping[inStreamIndex] < 0) {
        // Skip this packet
        pkt.unref();
        continue;
      }

      // Get input and output streams
      const inStream = inputStreams[inStreamIndex];
      const outStreamIndex = streamMapping[inStreamIndex];
      pkt.streamIndex = outStreamIndex;

      const outputStreams = ofmtCtx.streams;
      if (!outputStreams) {
        pkt.unref();
        continue;
      }

      const outStream = outputStreams[outStreamIndex];
      if (!inStream || !outStream) {
        pkt.unref();
        continue;
      }

      // Log input packet
      logPacket(ifmtCtx, pkt, 'in');

      // Rescale timestamps
      pkt.rescaleTs(inStream.timeBase, outStream.timeBase);
      pkt.pos = -1n;

      // Log output packet
      logPacket(ofmtCtx, pkt, 'out');

      // Write packet to output
      const writeRet = await ofmtCtx.interleavedWriteFrame(pkt);
      // Note: interleavedWriteFrame takes ownership of packet and unrefs it

      FFmpegError.throwIfError(writeRet, 'Error muxing packet');
    }

    // Write trailer
    const trailerRet = await ofmtCtx.writeTrailer();
    FFmpegError.throwIfError(trailerRet, 'writeTrailer');

    console.log('\nRemuxing completed successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (pkt) {
      pkt.free();
    }

    if (ifmtCtx) {
      await ifmtCtx.closeInput();
      ifmtCtx.freeContext();
    }

    if (ofmtCtx) {
      const ofmt = ofmtCtx.oformat;
      // Close output file if it was opened
      if (ofmt && !(ofmt.flags & AVFMT_NOFILE)) {
        await ofmtCtx.closeOutput();
      }
      ofmtCtx.freeContext();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: tsx examples/remux.ts <input> <output>');
    console.log('API example program to remux a media file with libavformat.');
    console.log('The output format is guessed according to the file extension.');
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  try {
    await remux(inputFile, outputFile);
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
