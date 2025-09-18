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

import { Decoder, Encoder, FilterAPI, FilterPreset, HardwareContext, MediaInput, MediaOutput } from '../src/api/index.js';
import { AV_LOG_DEBUG, AV_PIX_FMT_NV12, Log } from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.log('Usage: tsx api-sw-decode-hw-encode.ts <input> <output>');
  console.log('Example: tsx api-sw-decode-hw-encode.ts input.mp4 output.mp4');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

// Check for hardware availability
const hw = HardwareContext.auto();
if (!hw) {
  throw new Error('No hardware acceleration available! This example requires hardware acceleration for encoding.');
}

console.log(`Hardware detected: ${hw.deviceTypeName}`);

// Open input file
await using input = await MediaInput.open(inputFile);
const videoStream = input.video();
const audioStream = input.audio();

if (!videoStream) {
  throw new Error('No video stream found in input file');
}

console.log('Input Information:');
console.log(`Format: ${input.formatLongName}`);
console.log(`Duration: ${input.duration.toFixed(2)} seconds`);
console.log(`Video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
if (audioStream) {
  console.log(`Audio: ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);
}

// Create software decoder
console.log('Setting up software decoder...');
using decoder = await Decoder.create(videoStream);

// Create filter to upload frames to hardware
console.log('Setting up hardware upload filter...');
const filterChain = FilterPreset.chain(hw).format(AV_PIX_FMT_NV12).hwupload().build();
using filter = FilterAPI.create(filterChain, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  hardware: hw,
});

// Create hardware encoder (GPU)
console.log('Setting up hardware encoder...');

// Select appropriate hardware encoder based on platform
const encoderCodec = hw.getEncoderCodec('h264');
if (!encoderCodec) {
  throw new Error(`Unsupported hardware type: ${hw.deviceTypeName}`);
}

// Hardware encoder needs hardware context (will take from filter)
using encoder = await Encoder.create(encoderCodec, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  bitrate: '4M',
  gopSize: 60,
});

// Create output using MediaOutput
await using output = await MediaOutput.open(outputFile);
const outputStreamIndex = output.addStream(encoder);

// Process video
console.log('Processing...');

let frameCount = 0;
let packetCount = 0;
const startTime = Date.now();

for await (using packet of input.packets(videoStream.index)) {
  // Software decode
  using frame = await decoder.decode(packet);
  if (frame) {
    // Upload to hardware
    using hwFrame = await filter.process(frame);
    if (hwFrame) {
      frameCount++;

      // Hardware encode
      using encodedPacket = await encoder.encode(hwFrame);
      if (encodedPacket) {
        // Write to output
        await output.writePacket(encodedPacket, outputStreamIndex);
        packetCount++;
      }
    }

    // Progress indicator
    if (frameCount % 30 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const fps = frameCount / elapsed;
      console.log(`Processed ${frameCount} frames @ ${fps.toFixed(1)} fps`);
    }
  }
}

// Flush decoder
for await (using flushFrame of decoder.flushFrames()) {
  using hwFrame = await filter.process(flushFrame);
  if (hwFrame) {
    using encodedPacket = await encoder.encode(hwFrame);
    if (encodedPacket) {
      await output.writePacket(encodedPacket, outputStreamIndex);
      packetCount++;
    }
  }
}

// Flush filter
for await (using hwFrame of filter.flushFrames()) {
  using encodedPacket = await encoder.encode(hwFrame);
  if (encodedPacket) {
    await output.writePacket(encodedPacket, outputStreamIndex);
    packetCount++;
  }
}

// Flush encoder
for await (using flushPacket of encoder.flushPackets()) {
  await output.writePacket(flushPacket, outputStreamIndex);
  packetCount++;
}

const elapsed = (Date.now() - startTime) / 1000;
const avgFps = frameCount / elapsed;

console.log('Done!');
console.log(`Frames processed: ${frameCount}`);
console.log(`Packets written: ${packetCount}`);
console.log(`Time: ${elapsed.toFixed(2)} seconds`);
console.log(`Average FPS: ${avgFps.toFixed(1)}`);
