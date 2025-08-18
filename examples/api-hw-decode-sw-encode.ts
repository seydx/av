#!/usr/bin/env tsx
/**
 * Hardware Decode + Software Encode Example
 *
 * This example demonstrates:
 * - Hardware-accelerated decoding (GPU)
 * - Software encoding (CPU)
 * - Frame transfer from GPU to CPU memory
 *
 * Use case: When you need hardware decoding speed but want
 * software encoder quality/flexibility (e.g., x264 with specific settings)
 *
 * Usage: tsx api-hw-decode-sw-encode.ts <input> <output>
 * Example: tsx examples/api-hw-decode-sw-encode.ts testdata/video.mp4 examples/.tmp/api-hw-decode-sw-encode.mp4
 */

import { Decoder, Encoder, HardwareContext, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_PIX_FMT_NV12 } from '../src/lib/constants.js';

async function hwDecodeSoftwareEncode(inputFile: string, outputFile: string) {
  console.log('🎬 Hardware Decode + Software Encode Example');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  // Check for hardware availability
  const hw = await HardwareContext.auto();
  if (!hw) {
    console.log('❌ No hardware acceleration available');
    console.log('   This example requires hardware acceleration for decoding.');
    return;
  }

  console.log(`✅ Hardware detected: ${hw.deviceTypeName}`);
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

  // Create hardware decoder with automatic format conversion to CPU YUV420P
  console.log('🔧 Setting up hardware decoder with automatic format conversion...');

  const decoder = await Decoder.create(media, videoStream.index, {
    hardware: hw,
    targetPixelFormat: AV_PIX_FMT_NV12,
  });
  console.log(`  ✓ Hardware decoder created (${hw.deviceTypeName}) with automatic format conversion`);

  // Create software encoder (CPU)
  console.log('🔧 Setting up software encoder...');
  const encoder = await Encoder.create('libx264', {
    width: videoStream.codecpar.width,
    height: videoStream.codecpar.height,
    pixelFormat: AV_PIX_FMT_NV12,
    bitrate: '2M',
    gopSize: 60,
    frameRate: videoStream.codecpar.frameRate,
    timeBase: videoStream.timeBase,
    sourceTimeBase: videoStream.timeBase, // For automatic PTS rescaling
    codecOptions: {
      preset: 'medium',
      crf: 23,
    },
  });
  console.log('  ✓ Software encoder created (libx264)');
  console.log('');

  // Create output using MediaOutput
  const output = await MediaOutput.open(outputFile);
  const outputStreamIndex = output.addStream(encoder);

  // Write header
  await output.writeHeader();

  // Process video
  console.log('🎥 Processing video...');
  console.log('  Hardware decoding → CPU transfer → Software encoding');
  console.log('');

  let frameCount = 0;
  let packetCount = 0;
  const startTime = Date.now();

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      // Hardware decode with automatic format conversion to CPU YUV420P
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
  console.log('  - Fast hardware decoding (GPU)');
  console.log('  - High-quality software encoding (CPU)');
  console.log('  - GPU→CPU memory transfer overhead');
  console.log('  - Good for quality-critical encoding');

  // Cleanup
  decoder.close();
  encoder.close();
  hw.dispose();
  await output.close();
  await media.close();
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: tsx api-hw-decode-sw-encode.ts <input> <output>');
    console.log('Example: tsx api-hw-decode-sw-encode.ts input.mp4 output.mp4');
    process.exit(1);
  }

  hwDecodeSoftwareEncode(args[0], args[1]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
