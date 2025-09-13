/**
 * High-Level API Example: Encode and Decode
 *
 * Shows basic encoding and decoding operations using the high-level API.
 * Demonstrates how simple it is compared to the low-level FFmpeg API.
 *
 * Usage: tsx examples/api-encode-decode.ts <input> <output>
 * Example: tsx examples/api-encode-decode.ts testdata/video.mp4 examples/.tmp/api-encode-decode.mp4
 */

import { AV_LOG_DEBUG, Decoder, Encoder, FF_ENCODER_LIBX264, Log, MediaInput, MediaOutput } from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: tsx examples/api-encode-decode.ts <input> <output>');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

// Open input media
console.log('Opening input:', inputFile);
await using input = await MediaInput.open(inputFile);

// Get video stream
const videoStream = input.video(0);
if (!videoStream) {
  throw new Error('No video stream found');
}

// Get audio stream
const audioStream = input.audio(0);

console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);
if (audioStream) {
  console.log(`Input audio: ${audioStream.codecpar.sampleRate}Hz ${audioStream.codecpar.channels}ch ${audioStream.codecpar.codecId}`);
}

// Create decoder
console.log('Creating decoder...');
using decoder = await Decoder.create(videoStream);

// Create encoder
console.log('Creating encoder...');
using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
  frameRate: videoStream.avgFrameRate,
  timeBase: videoStream.timeBase,
  bitrate: '1M',
  gopSize: 60,
  options: {
    preset: 'fast',
    crf: '23',
  },
});

// Create output
console.log('Creating output:', outputFile);
await using output = await MediaOutput.open(outputFile);

// Add stream(s) to output
const outputVideoStreamIndex = output.addStream(encoder);
let outputAudioStreamIndex = -1;
if (audioStream) {
  outputAudioStreamIndex = output.addStream(audioStream);
}

// Process frames
console.log('Processing frames...');
let decodedFrames = 0;
let encodedPackets = 0;
let processedAudioPackets = 0;

for await (using packet of input.packets()) {
  if (packet.streamIndex === videoStream.index) {
    // Decode packet to frame
    using frame = await decoder.decode(packet);
    if (frame) {
      decodedFrames++;

      // Re-encode frame
      using encodedPacket = await encoder.encode(frame);
      if (encodedPacket) {
        // Write packet to output
        await output.writePacket(encodedPacket, outputVideoStreamIndex);
        encodedPackets++;
      }

      // Progress
      if (decodedFrames % 10 === 0) {
        console.log(`Decoded: ${decodedFrames} frames, Encoded: ${encodedPackets} packets`);
      }
    }
  } else if (audioStream && packet.streamIndex === audioStream.index) {
    await output.writePacket(packet, outputAudioStreamIndex);
    processedAudioPackets++;
  }
}

// Flush decoder
console.log('Flushing decoder...');
for await (using flushFrame of decoder.flushFrames()) {
  using encodedPacket = await encoder.encode(flushFrame);
  if (encodedPacket) {
    await output.writePacket(encodedPacket, outputVideoStreamIndex);
    encodedPackets++;
  }
}

// Flush encoder
console.log('Flushing encoder...');
for await (using flushPacket of encoder.flushPackets()) {
  await output.writePacket(flushPacket, outputVideoStreamIndex);
  encodedPackets++;
}

console.log('Done!');
console.log(`Decoded ${decodedFrames} frames`);
console.log(`Encoded ${encodedPackets} packets`);
console.log(`Processed audio packets: ${processedAudioPackets}`);
console.log(`Output: ${outputFile}`);
