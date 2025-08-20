#!/usr/bin/env tsx
/**
 * Full Software Transcode Example
 *
 * This example demonstrates:
 * - Software decoding (CPU)
 * - Software encoding (CPU)
 * - Maximum compatibility and control
 *
 * Use case: When you need maximum compatibility, specific codec features,
 * or when hardware acceleration is not available
 *
 * Usage: tsx api-sw-transcode.ts <input> <output>
 * Example: tsx examples/api-sw-transcode.ts testdata/video.mp4 examples/.tmp/api-sw-transcode.mp4
 */

import { Decoder, Encoder, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_PIX_FMT_YUV420P } from '../src/lib/constants.js';

async function softwareTranscode(inputFile: string, outputFile: string) {
  console.log('🎬 Full Software Transcode Example');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  // Open input file
  const media = await MediaInput.open(inputFile);
  const videoStream = media.video();
  const audioStream = media.audio();

  if (!videoStream) {
    throw new Error('No video stream found in input file');
  }

  console.log('📊 Input Information:');
  console.log(`  Format: ${media.formatLongName}`);
  console.log(`  Duration: ${media.duration.toFixed(2)} seconds`);
  console.log(`  Video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
  if (audioStream) {
    console.log(`  Audio: ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);
  }
  console.log('');

  // Create software decoder (CPU)
  console.log('🔧 Setting up software decoder...');
  const decoder = await Decoder.create(videoStream);
  console.log('  ✓ Software decoder created (CPU)');

  // Create software encoder (CPU)
  console.log('🔧 Setting up software encoder...');
  const encoder = await Encoder.create(
    'libx264',
    {
      type: 'video',
      width: videoStream.codecpar.width,
      height: videoStream.codecpar.height,
      pixelFormat: AV_PIX_FMT_YUV420P,
      timeBase: videoStream.timeBase, // Use input stream's timebase
    },
    {
      bitrate: '2M',
      gopSize: 60,
      options: {
        preset: 'medium',
        crf: 23,
        profile: 'high',
        level: '4.1',
      },
    },
  );
  console.log('  ✓ Software encoder created (libx264)');
  console.log('');

  // Create output using MediaOutput
  const output = await MediaOutput.open(outputFile);
  const outputStreamIndex = output.addStream(encoder);

  // Write header
  await output.writeHeader();

  // Process video
  console.log('🎥 Processing video...');
  console.log('  Pure software pipeline: CPU decode → CPU encode');
  console.log('');

  let frameCount = 0;
  let packetCount = 0;
  const startTime = Date.now();

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      // Software decode
      const frame = await decoder.decode(packet);
      if (frame) {
        frameCount++;

        // Software encode (encoder handles PTS rescaling automatically)
        const encodedPacket = await encoder.encode(frame);
        if (encodedPacket) {
          // Write to output (MediaOutput handles timestamp rescaling)
          await output.writePacket(encodedPacket, outputStreamIndex);
          packetCount++;
          encodedPacket.free();
        }

        frame.free();

        // Progress indicator
        if (frameCount % 30 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const fps = frameCount / elapsed;
          process.stdout.write(`\r  Processed ${frameCount} frames @ ${fps.toFixed(1)} fps`);
        }
      }
    }
  }

  // Flush decoder
  let flushFrame;
  while ((flushFrame = await decoder.flush()) !== null) {
    const encodedPacket = await encoder.encode(flushFrame);
    if (encodedPacket) {
      await output.writePacket(encodedPacket, outputStreamIndex);
      packetCount++;
      encodedPacket.free();
    }
    flushFrame.free();
  }

  // Flush encoder
  let flushPacket;
  while ((flushPacket = await encoder.flush()) !== null) {
    await output.writePacket(flushPacket, outputStreamIndex);
    packetCount++;
    flushPacket.free();
  }

  // Write trailer
  await output.writeTrailer();

  const elapsed = (Date.now() - startTime) / 1000;
  const avgFps = frameCount / elapsed;

  console.log('\n');
  console.log('✅ Transcoding complete!');
  console.log(`  Frames processed: ${frameCount}`);
  console.log(`  Packets written: ${packetCount}`);
  console.log(`  Time: ${elapsed.toFixed(2)} seconds`);
  console.log(`  Average FPS: ${avgFps.toFixed(1)}`);
  console.log('');
  console.log('📊 Performance characteristics:');
  console.log('  - Maximum compatibility');
  console.log('  - Full codec feature support');
  console.log('  - Predictable performance');
  console.log('  - No hardware dependencies');
  console.log('');
  console.log('💡 Tips:');
  console.log('  - Use preset "ultrafast" for speed');
  console.log('  - Use preset "veryslow" for quality');
  console.log('  - Adjust CRF (18-28) for quality/size balance');

  // Cleanup
  decoder.close();
  encoder.close();
  await output.close();
  await media.close();
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: tsx api-sw-transcode.ts <input> <output>');
    console.log('Example: tsx api-sw-transcode.ts input.mp4 output.mp4');
    process.exit(1);
  }

  softwareTranscode(args[0], args[1]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
