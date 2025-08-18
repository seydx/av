#!/usr/bin/env tsx

/**
 * High-Level API Example: Encode and Decode
 *
 * Shows basic encoding and decoding operations using the high-level API.
 * Demonstrates how simple it is compared to the low-level FFmpeg API.
 *
 * Usage: tsx examples/api-encode-decode.ts <input> <output>
 * Example: tsx examples/api-encode-decode.ts testdata/video.mp4 examples/.tmp/api-encode-decode.mp4
 */

import { Decoder, Encoder, MediaInput } from '../src/api/index.js';
import { AV_FMT_NOFILE, AV_IO_FLAG_WRITE, AV_PIX_FMT_YUV420P, FormatContext, IOContext } from '../src/lib/index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: tsx examples/api-encode-decode.ts <input> <output>');
  process.exit(1);
}

async function main() {
  try {
    console.log('High-Level API: Encode/Decode Example');
    console.log('======================================\n');

    // Open input media
    console.log('Opening input:', inputFile);
    const media = await MediaInput.open(inputFile);

    // Get video stream
    const videoStream = media.video(0);
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);

    // Create decoder
    console.log('\nCreating decoder...');
    const decoder = await Decoder.create(media, videoStream.index);

    // Create encoder with different settings
    console.log('Creating encoder...');
    const encoder = await Encoder.create('libx264', {
      width: Math.floor(videoStream.codecpar.width / 2), // Half resolution
      height: Math.floor(videoStream.codecpar.height / 2),
      pixelFormat: AV_PIX_FMT_YUV420P,
      bitrate: '1M',
      gopSize: 60,
      frameRate: videoStream.codecpar.frameRate,
      timeBase: videoStream.timeBase, // Use input stream's timebase
      codecOptions: {
        preset: 'fast',
        crf: '23',
      },
    });

    // Create output format context (using low-level API for now)
    const output = new FormatContext();
    output.allocOutputContext2(null, null, outputFile);

    // Add video stream
    const outStream = output.newStream(null);
    if (!outStream) {
      throw new Error('Failed to create output stream');
    }

    // Copy encoder parameters to stream
    const encoderCtx = encoder.getCodecContext();
    if (encoderCtx) {
      outStream.codecpar.fromContext(encoderCtx);
      outStream.timeBase = encoderCtx.timeBase;
    }

    // Open output file
    if (output.oformat && !(output.oformat.flags & AV_FMT_NOFILE)) {
      const ioContext = new IOContext();
      await ioContext.open2(outputFile, AV_IO_FLAG_WRITE);
      output.pb = ioContext;
    }

    // Write header
    await output.writeHeader(null);

    // Process frames
    console.log('\nProcessing frames...');
    let decodedFrames = 0;
    let encodedPackets = 0;

    for await (const packet of media.packets()) {
      if (packet.streamIndex === videoStream.index) {
        // Decode packet to frame
        const frame = await decoder.decode(packet);
        if (frame) {
          decodedFrames++;

          // Re-encode frame
          const encodedPacket = await encoder.encode(frame);
          if (encodedPacket) {
            // Set stream index and rescale timestamps from encoder timebase to output stream timebase
            encodedPacket.streamIndex = 0;
            encodedPacket.rescaleTs(encoderCtx?.timeBase ?? { num: 1, den: 25 }, outStream.timeBase);

            // Write packet
            await output.interleavedWriteFrame(encodedPacket);
            encodedPackets++;
            encodedPacket.free();
          }

          frame.free();

          // Progress
          if (decodedFrames % 10 === 0) {
            process.stdout.write(`\rDecoded: ${decodedFrames} frames, Encoded: ${encodedPackets} packets`);
          }
        }
      }
      // Don't free - managed by generator
    }

    // Flush decoder
    console.log('\n\nFlushing decoder...');
    let flushFrame;
    while ((flushFrame = await decoder.flush()) !== null) {
      const encodedPacket = await encoder.encode(flushFrame);
      if (encodedPacket) {
        encodedPacket.streamIndex = 0;
        encodedPacket.rescaleTs(encoderCtx?.timeBase ?? { num: 1, den: 25 }, outStream.timeBase);
        await output.interleavedWriteFrame(encodedPacket);
        encodedPackets++;
        encodedPacket.free();
      }
      flushFrame.free();
    }

    // Flush encoder
    console.log('Flushing encoder...');
    let flushPacket;
    while ((flushPacket = await encoder.flush()) !== null) {
      flushPacket.streamIndex = 0;
      flushPacket.rescaleTs(encoderCtx?.timeBase ?? { num: 1, den: 25 }, outStream.timeBase);
      await output.interleavedWriteFrame(flushPacket);
      encodedPackets++;
      flushPacket.free();
    }

    // Write trailer
    await output.writeTrailer();

    // Clean up
    decoder.close();
    encoder.close();
    await media.close();

    // Don't manually close pb - it will be closed by freeContext
    // await output.pb?.closep(); // This causes double-free!
    output.freeContext();

    console.log('\n✅ Done!');
    console.log(`   Decoded ${decodedFrames} frames`);
    console.log(`   Encoded ${encodedPackets} packets`);
    console.log(`   Output: ${outputFile}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
