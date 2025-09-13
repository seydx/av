/**
 * High-Level API Example: Hardware-Accelerated Raw Video Processing
 *
 * Shows how to process raw YUV video with hardware acceleration.
 * Demonstrates hardware upload, scaling, and encoding using VideoToolbox/VAAPI/CUDA.
 *
 * Usage: tsx examples/api-hw-raw.ts <raw-input> <output>
 *
 * Options:
 *   --width <n>      Input width (default: 1280)
 *   --height <n>     Input height (default: 720)
 *   --fps <n>        Frame rate (default: 30)
 *
 * Examples:
 *   tsx examples/api-hw-raw.ts testdata/input.yuv examples/.tmp/hw-raw-output.mp4
 *   tsx examples/api-hw-raw.ts raw-video.yuv output.mp4 --width 1920 --height 1080
 *   tsx examples/api-hw-raw.ts input.yuv output.mp4 --fps 60
 */

import {
  AV_LOG_DEBUG,
  AV_PIX_FMT_YUV420P,
  Decoder,
  Encoder,
  FF_ENCODER_LIBX265,
  FilterAPI,
  FilterPreset,
  HardwareContext,
  Log,
  MediaInput,
  MediaOutput,
} from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

import type { FFEncoderCodec } from '../src/index.js';

// Parse command line arguments
const args = process.argv.slice(2);
const inputFile = args.find((arg) => !arg.startsWith('--'));
const outputFile = args[args.indexOf(inputFile ?? '') + 1];

if (!inputFile || !outputFile || outputFile.startsWith('--')) {
  console.error('Usage: tsx examples/api-hw-raw.ts <raw-input> <output> [options]');
  console.error('Options:');
  console.error('  --width <n>      Input width (default: 1280)');
  console.error('  --height <n>     Input height (default: 720)');
  console.error('  --fps <n>        Frame rate (default: 30)');
  process.exit(1);
}

// Parse options
const widthIndex = args.indexOf('--width');
const width = widthIndex !== -1 ? parseInt(args[widthIndex + 1]) : 1280;

const heightIndex = args.indexOf('--height');
const height = heightIndex !== -1 ? parseInt(args[heightIndex + 1]) : 720;

const fpsIndex = args.indexOf('--fps');
const fps = fpsIndex !== -1 ? parseInt(args[fpsIndex + 1]) : 30;

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

console.log(`Input: ${inputFile} (${width}x${height} @ ${fps}fps)`);
console.log(`Output: ${outputFile}`);

// Open raw YUV input
console.log('Opening raw video input...');
await using input = await MediaInput.open({
  type: 'video',
  input: inputFile,
  width,
  height,
  pixelFormat: AV_PIX_FMT_YUV420P,
  frameRate: { num: fps, den: 1 },
});

const videoStream = input.video();
if (!videoStream) {
  throw new Error('No video stream found');
}

console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
console.log(`Codec: ${videoStream.codecpar.codecId}, Format: ${videoStream.codecpar.format}`);
console.log(`Time base: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
console.log(`Frame rate: ${videoStream.avgFrameRate.num}/${videoStream.avgFrameRate.den}`);

// Auto-detect hardware
console.log('Detecting hardware acceleration...');
using hardware = HardwareContext.auto();
if (hardware) {
  console.log(`Using hardware: ${hardware.deviceTypeName}`);
} else {
  console.log('No hardware acceleration available, using software');
}

// Create decoder (will be software for rawvideo)
console.log('Creating decoder...');
using decoder = await Decoder.create(videoStream, {
  hardware, // Will be ignored for rawvideo codec
});

// Determine encoder based on hardware
let encoderName: FFEncoderCodec = FF_ENCODER_LIBX265; // Default software encoder
let filterChain = 'scale=640:360,setpts=N/FRAME_RATE/TB';

if (hardware) {
  const encoderCodec = hardware.getEncoderCodec('hevc');
  if (encoderCodec?.isHardwareAcceleratedEncoder()) {
    encoderName = encoderCodec.name as FFEncoderCodec;
    filterChain = FilterPreset.chain(hardware).hwupload().scale(640, 360).custom('setpts=N/FRAME_RATE/TB').build();
  }
}

console.log(`Creating filter: ${filterChain}`);
using filter = await FilterAPI.create(filterChain, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  hardware,
});

// Create encoder with scaled dimensions
console.log(`Creating encoder: ${encoderName}...`);
using encoder = await Encoder.create(encoderName, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
  bitrate: '1M',
});

// Create output
console.log('Creating output file...');
await using output = await MediaOutput.open(outputFile);
const videoOutputIndex = output.addStream(encoder);

// Process video using generator pipeline
console.log('Processing video...');
const startTime = Date.now();
let packetCount = 0;

const videoInputGenerator = input.packets(videoStream.index);
const videoDecoderGenerator = decoder.frames(videoInputGenerator);
const videoFilterGenerator = filter.frames(videoDecoderGenerator);
const videoEncoderGenerator = encoder.packets(videoFilterGenerator);

for await (using packet of videoEncoderGenerator) {
  await output.writePacket(packet, videoOutputIndex);
  packetCount++;

  // Progress indicator
  if (packetCount % 30 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const fps = packetCount / elapsed;
    console.log(`Processed ${packetCount} packets @ ${fps.toFixed(1)} fps`);
  }
}

console.log('Done!');
