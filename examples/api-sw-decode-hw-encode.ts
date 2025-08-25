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

import { Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput } from '../src/api/index.js';

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

  // Create software decoder
  console.log('🔧 Setting up software decoder...');
  const decoder = await Decoder.create(videoStream);
  console.log('  ✓ Software decoder created (CPU)');

  // Create filter to upload frames to hardware
  console.log('🔧 Setting up hardware upload filter...');
  const filter = await FilterAPI.create('hwupload', videoStream, { hardware: hw });
  console.log('  ✓ Hardware upload filter created (CPU→HW)');

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

  // Hardware encoder needs hardware context
  const encoder = await Encoder.create(encoderName, videoStream, {
    bitrate: '4M',
    gopSize: 60,
    hardware: hw,
  });
  console.log(`  ✓ Hardware encoder created (${encoderName})`);
  console.log('');

  // Create output using MediaOutput
  const output = await MediaOutput.open(outputFile);
  const outputStreamIndex = output.addStream(encoder);

  // Write header
  await output.writeHeader();

  // Process video
  console.log('🎥 Processing video...');
  console.log('  Software decoding → Hardware upload → Hardware encoding');
  console.log('');

  let frameCount = 0;
  let packetCount = 0;
  const startTime = Date.now();

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      // Software decode
      const frame = await decoder.decode(packet);
      if (frame) {
        // Upload to hardware
        const hwFrame = await filter.process(frame);
        if (hwFrame) {
          frameCount++;

          // Hardware encode
          const encodedPacket = await encoder.encode(hwFrame);
          if (encodedPacket) {
            // Write to output
            await output.writePacket(encodedPacket, outputStreamIndex);
            packetCount++;
            encodedPacket.free();
          }

          hwFrame.free();
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
    const hwFrame = await filter.process(flushFrame);
    if (hwFrame) {
      const encodedPacket = await encoder.encode(hwFrame);
      if (encodedPacket) {
        await output.writePacket(encodedPacket, outputStreamIndex);
        packetCount++;
        encodedPacket.free();
      }
      hwFrame.free();
    }
    flushFrame.free();
  }

  // Flush filter
  for await (const hwFrame of filter.flushFrames()) {
    const encodedPacket = await encoder.encode(hwFrame);
    if (encodedPacket) {
      await output.writePacket(encodedPacket, outputStreamIndex);
      packetCount++;
      encodedPacket.free();
    }
    hwFrame.free();
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
