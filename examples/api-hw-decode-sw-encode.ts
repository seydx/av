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

import {
  AV_LOG_DEBUG,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_YUV420P,
  Decoder,
  Encoder,
  FF_ENCODER_LIBX264,
  FilterAPI,
  FilterPreset,
  HardwareContext,
  Log,
  MediaInput,
  MediaOutput,
} from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.log('Usage: tsx api-hw-decode-sw-encode.ts <input> <output>');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

// Check for hardware availability
console.log('Checking for hardware acceleration...');
using hw = HardwareContext.auto();
if (!hw) {
  throw new Error('No hardware acceleration available! This example requires hardware acceleration for decoding.');
}

console.log(`Hardware detected: ${hw.deviceTypeName}`);

// Open input file
await using input = await MediaInput.open(inputFile);

const audioStream = input.audio();
const videoStream = input.video();
if (!videoStream) {
  throw new Error('No video stream found in input file');
}

console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);
if (audioStream) {
  console.log(`Input audio: ${audioStream.codecpar.sampleRate}Hz ${audioStream.codecpar.channels}ch ${audioStream.codecpar.codecId}`);
}

// Create hardware decoder
console.log('Setting up hardware decoder...');
const decoder = await Decoder.create(videoStream, {
  hardware: hw,
});

// Create filter to convert from hardware to software format
console.log('Setting up format conversion filter...');
const filterChain = FilterPreset.chain(hw).hwdownload().format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]).build();
using filter = FilterAPI.create(filterChain, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  hardware: hw,
});

// Create software encoder (CPU)
console.log('Setting up software encoder...');
using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  options: {
    preset: 'medium',
    crf: '23',
  },
});

// Create output using MediaOutput
await using output = await MediaOutput.open(outputFile);
const outputVideoStreamIndex = output.addStream(encoder);
const outputAudioStreamIndex = audioStream ? output.addStream(audioStream) : -1;

// Process video
console.log('Processing video...');

let frameCount = 0;
const startTime = Date.now();

for await (using packet of input.packets()) {
  if (packet.streamIndex === videoStream.index) {
    // Hardware decode
    using frame = await decoder.decode(packet);
    if (frame) {
      // Convert from hardware to CPU format
      using cpuFrame = await filter.process(frame);
      if (cpuFrame) {
        frameCount++;

        // Software encode
        using encodedPacket = await encoder.encode(cpuFrame);
        if (encodedPacket) {
          // Write to output
          await output.writePacket(encodedPacket, outputVideoStreamIndex);
        }
      }

      // Progress indicator
      if (frameCount % 30 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const fps = frameCount / elapsed;
        console.log(`Processed ${frameCount} frames @ ${fps.toFixed(1)} fps`);
      }
    }
  } else if (audioStream && packet.streamIndex === audioStream.index) {
    // Pass through audio packets directly
    await output.writePacket(packet, outputAudioStreamIndex);
  }
}

// Flush decoder
for await (using flushFrame of decoder.flushFrames()) {
  using cpuFrame = await filter.process(flushFrame);
  if (cpuFrame) {
    using encodedPacket = await encoder.encode(cpuFrame);
    if (encodedPacket) {
      await output.writePacket(encodedPacket, outputVideoStreamIndex);
    }
  }
}

// Flush filter
for await (using cpuFrame of filter.flushFrames()) {
  using encodedPacket = await encoder.encode(cpuFrame);
  if (encodedPacket) {
    await output.writePacket(encodedPacket, outputVideoStreamIndex);
  }
}

// Flush encoder
for await (using flushPacket of encoder.flushPackets()) {
  await output.writePacket(flushPacket, outputVideoStreamIndex);
}

console.log('Done!');
