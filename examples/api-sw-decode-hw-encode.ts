#!/usr/bin/env tsx
/**
 * Software Decode + Hardware Encode Example
 *
 * This example demonstrates:
 * - Software decoding (CPU)
 * - Hardware-accelerated encoding (GPU)
 * - Frame transfer from CPU to GPU memory
 *
 * Use case: When you have complex input formats that need software decoding
 * but want fast hardware encoding (e.g., real-time streaming)
 *
 * Usage: tsx api-sw-decode-hw-encode.ts <input> <output>
 * Example: tsx examples/api-sw-decode-hw-encode.ts testdata/video.mp4 examples/.tmp/api-sw-decode-hw-encode.mp4
 */

import { Decoder, Encoder, HardwareContext, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P } from '../src/lib/constants.js';

import type { EncoderOptions } from '../src/api/index.js';

async function softwareDecodeHwEncode(inputFile: string, outputFile: string) {
  console.log('🎬 Software Decode + Hardware Encode Example');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  // Check for hardware availability
  const hw = await HardwareContext.auto();
  if (!hw) {
    console.log('❌ No hardware acceleration available');
    console.log('   This example requires hardware acceleration for encoding.');
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

  // Create software decoder with format conversion for hardware encoder
  console.log('🔧 Setting up software decoder...');

  // Determine target pixel format based on hardware encoder
  let targetPixelFormat = AV_PIX_FMT_YUV420P;
  if (hw.deviceTypeName === 'videotoolbox') {
    // VideoToolbox prefers NV12 for CPU frames
    targetPixelFormat = AV_PIX_FMT_NV12;
  }

  const decoder = await Decoder.create(media, videoStream.index, {
    targetPixelFormat,
  });
  console.log(`  ✓ Software decoder created (CPU) with conversion to ${targetPixelFormat === AV_PIX_FMT_NV12 ? 'NV12' : 'YUV420P'}`);

  // Create hardware encoder (GPU)
  console.log('🔧 Setting up hardware encoder...');

  // Select appropriate hardware encoder based on platform
  let encoderName: string;

  switch (hw.deviceTypeName) {
    case 'videotoolbox':
      encoderName = 'h264_videotoolbox';
      break;
    case 'cuda':
      encoderName = 'h264_nvenc';
      break;
    case 'vaapi':
      encoderName = 'h264_vaapi';
      break;
    case 'qsv':
      encoderName = 'h264_qsv';
      break;
    default:
      throw new Error(`Unsupported hardware type: ${hw.deviceTypeName}`);
  }

  // For SW decode + HW encode, VideoToolbox encoder accepts CPU frames directly
  // without needing a hardware context - just pass the encoder the appropriate format
  const encoderOptions: EncoderOptions = {
    width: videoStream.codecpar.width,
    height: videoStream.codecpar.height,
    pixelFormat: AV_PIX_FMT_NV12,
    bitrate: '4M',
    gopSize: 60,
    frameRate: videoStream.codecpar.frameRate,
    timeBase: videoStream.timeBase,
    sourceTimeBase: videoStream.timeBase, // For automatic PTS rescaling
  };

  // Only pass hardware context for non-VideoToolbox or if doing HW->HW
  // VideoToolbox encoder accepts CPU frames directly without hardware context
  if (hw.deviceTypeName !== 'videotoolbox') {
    encoderOptions.hardware = hw;
  }

  const encoder = await Encoder.create(encoderName, encoderOptions);
  console.log(`  ✓ Hardware encoder created (${encoderName})`);
  console.log('');

  // Create output using MediaOutput
  const output = await MediaOutput.open(outputFile);
  const outputStreamIndex = output.addStream(encoder);

  // Write header
  await output.writeHeader();

  // Process video
  console.log('🎥 Processing video...');
  console.log('  Software decoding → CPU→GPU transfer → Hardware encoding');
  console.log('');

  let frameCount = 0;
  let packetCount = 0;
  const startTime = Date.now();

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      // Software decode with automatic format conversion
      const frame = await decoder.decode(packet);
      if (frame) {
        frameCount++;

        // Hardware encode (encoder handles PTS rescaling automatically)
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
  console.log('  - Flexible software decoding (CPU)');
  console.log('  - Fast hardware encoding (GPU)');
  console.log('  - CPU→GPU memory transfer overhead');
  console.log('  - Good for real-time streaming');

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
    console.log('Usage: tsx api-sw-decode-hw-encode.ts <input> <output>');
    console.log('Example: tsx api-sw-decode-hw-encode.ts input.mp4 output.mp4');
    process.exit(1);
  }

  softwareDecodeHwEncode(args[0], args[1]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { softwareDecodeHwEncode };
