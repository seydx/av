/**
 * High-Level API Example: Hardware-Accelerated Transcoding
 *
 * Shows how to use hardware acceleration for video transcoding with the high-level API.
 * Demonstrates zero-copy GPU pipeline when both decoder and encoder use the same hardware.
 *
 * Usage: tsx examples/api-hw-transcode.ts <input> <output>
 * Example: tsx examples/api-hw-transcode.ts testdata/video.mp4 examples/.tmp/api-hw-transcode.mp4
 */

import { AV_HWDEVICE_TYPE_CUDA, AV_LOG_DEBUG, Decoder, Encoder, FF_ENCODER_LIBX264, HardwareContext, Log, MediaInput, MediaOutput } from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

import type { FFEncoderCodec } from '../src/index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: tsx examples/api-hw-transcode.ts <input> <output>');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

// Auto-detect best available hardware
console.log('Detecting hardware acceleration...');

const allHw = HardwareContext.listAvailable();
console.log('All available hardware devices:', allHw);

const hw = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
if (!hw) {
  console.log('No hardware acceleration available, falling back to software');
} else {
  console.log(`Using hardware: ${hw.deviceTypeName}`);

  // List supported codecs
  const encoders = hw.findSupportedCodecs(true);
  const decoders = hw.findSupportedCodecs(false);
  console.log(`Supported decoders: ${decoders.slice(0, 5).join(', ')}${decoders.length > 5 ? '...' : ''}`);
  console.log(`Supported encoders: ${encoders.slice(0, 5).join(', ')}${encoders.length > 5 ? '...' : ''}`);
}

// Open input media
console.log('Opening input:', inputFile);
await using input = await MediaInput.open(inputFile);

// Get video stream
const videoStream = input.video();
if (!videoStream) {
  throw new Error('No video stream found');
}

// Get audio stream
const audioStream = input.audio();
if (!audioStream) {
  throw new Error('No audio stream found');
}

console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);
console.log(`Input audio: ${audioStream.codecpar.sampleRate}Hz ${audioStream.codecpar.channels}ch ${audioStream.codecpar.codecId}`);

// Create hardware decoder
console.log('Creating hardware decoder...');
using decoder = await Decoder.create(videoStream, {
  hardware: hw,
});

// Determine encoder based on hardware availability
let encoderName: FFEncoderCodec = FF_ENCODER_LIBX264; // Default software encoder

if (hw) {
  const encoderCodec = hw.getEncoderCodec('hevc');
  if (encoderCodec?.isHardwareAcceleratedEncoder()) {
    encoderName = encoderCodec.name as FFEncoderCodec;
  }
}

// Create encoder
console.log(`Creating encoder: ${encoderName}...`);
using encoder = await Encoder.create(encoderName, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
});

// Create output using MediaOutput
console.log('Creating output:', outputFile);
await using output = await MediaOutput.open(outputFile);
const videoOutputIndex = output.addStream(encoder);
const audioOutputIndex = output.addStream(audioStream);

// Process frames
console.log('Processing frames...');
let decodedFrames = 0;
let encodedPackets = 0;
let hardwareFrames = 0;
let audioFrames = 0;

const startTime = Date.now();

for await (using packet of input.packets()) {
  if (packet.streamIndex === videoStream.index) {
    // Decode packet to frame
    using frame = await decoder.decode(packet);
    if (frame) {
      decodedFrames++;

      // Check if frame is on GPU (zero-copy path)
      if (frame.isHwFrame()) {
        hardwareFrames++;
      }

      // Re-encode frame (zero-copy if both on same GPU)
      using encodedPacket = await encoder.encode(frame);
      if (encodedPacket) {
        // Write packet (MediaOutput handles timestamp rescaling)
        await output.writePacket(encodedPacket, videoOutputIndex);
        encodedPackets++;
      }
    }
  } else if (packet.streamIndex === audioStream.index) {
    await output.writePacket(packet, audioOutputIndex);
    audioFrames++;
  }
}

// Flush decoder
console.log('Flushing decoder...');
for await (using flushFrame of decoder.flushFrames()) {
  using encodedPacket = await encoder.encode(flushFrame);
  if (encodedPacket) {
    await output.writePacket(encodedPacket, videoOutputIndex);
    encodedPackets++;
  }
}

// Flush encoder
console.log('Flushing encoder...');
for await (using flushPacket of encoder.flushPackets()) {
  await output.writePacket(flushPacket, videoOutputIndex);
  encodedPackets++;
}

const elapsed = (Date.now() - startTime) / 1000;
const avgFps = (decodedFrames / elapsed).toFixed(1);

console.log('Done!');
console.log(`Hardware: ${hw ? hw.deviceTypeName : 'none (software)'}`);
console.log(`Decoded: ${decodedFrames} frames`);
console.log(`Encoded: ${encodedPackets} packets`);
console.log(`GPU frames: ${hardwareFrames} (${((hardwareFrames / decodedFrames) * 100).toFixed(1)}% zero-copy)`);
console.log(`Audio frames: ${audioFrames}`);
console.log(`Time: ${elapsed.toFixed(2)}s`);
console.log(`Average FPS: ${avgFps}`);
console.log(`Output: ${outputFile}`);
