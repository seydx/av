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

import { Decoder, Encoder, FF_ENCODER_LIBX264, MediaInput, MediaOutput } from '../src/index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.log('Usage: tsx api-sw-transcode.ts <input> <output>');
  console.log('Example: tsx api-sw-transcode.ts input.mp4 output.mp4');
  process.exit(1);
}

console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

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

// Create software decoder (CPU)
console.log('Setting up software decoder...');
const decoder = await Decoder.create(videoStream);

// Create software encoder (CPU)
console.log('Setting up software encoder...');
const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  bitrate: '2M',
  gopSize: 60,
  options: {
    preset: 'medium',
    crf: 23,
    profile: 'high',
    level: '4.1',
  },
});

// Create output using MediaOutput
await using output = await MediaOutput.open(outputFile);
const outputStreamIndex = output.addStream(encoder);

// Process video
console.log('🎥 Processing video...');
console.log('  Pure software pipeline: CPU decode → CPU encode');
console.log('');

let frameCount = 0;
let packetCount = 0;
const startTime = Date.now();

for await (using packet of input.packets(videoStream.index)) {
  // Software decode
  using frame = await decoder.decode(packet);
  if (frame) {
    frameCount++;

    // Software encode (encoder handles PTS rescaling automatically)
    using encodedPacket = await encoder.encode(frame);
    if (encodedPacket) {
      // Write to output (MediaOutput handles timestamp rescaling)
      await output.writePacket(encodedPacket, outputStreamIndex);
      packetCount++;
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
  using encodedPacket = await encoder.encode(flushFrame);
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
