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

import { Decoder, Encoder, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_PIX_FMT_YUV420P } from '../src/lib/index.js';

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
    const decoder = await Decoder.create(videoStream);

    // Create encoder with different settings
    console.log('Creating encoder...');
    const encoder = await Encoder.create(
      'libx264',
      {
        type: 'video',
        width: Math.floor(videoStream.codecpar.width / 2), // Half resolution
        height: Math.floor(videoStream.codecpar.height / 2),
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: videoStream.codecpar.frameRate,
        timeBase: videoStream.timeBase, // Use input stream's timebase
      },
      {
        bitrate: '1M',
        gopSize: 60,
        options: {
          preset: 'fast',
          crf: '23',
        },
      },
    );

    // Create output using MediaOutput
    console.log('Creating output:', outputFile);
    const output = await MediaOutput.open(outputFile);

    // Add encoder stream to output
    const outputStreamIndex = output.addStream(encoder);

    // Write header
    await output.writeHeader();

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
            // Write packet to output (MediaOutput handles timestamp rescaling)
            await output.writePacket(encodedPacket, outputStreamIndex);
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
        await output.writePacket(encodedPacket, outputStreamIndex);
        encodedPackets++;
        encodedPacket.free();
      }
      flushFrame.free();
    }

    // Flush encoder
    console.log('Flushing encoder...');
    let flushPacket;
    while ((flushPacket = await encoder.flush()) !== null) {
      await output.writePacket(flushPacket, outputStreamIndex);
      encodedPackets++;
      flushPacket.free();
    }

    // Write trailer
    await output.writeTrailer();

    // Clean up
    decoder.close();
    encoder.close();
    await media.close();
    await output.close();

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
