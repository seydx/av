/**
 * High-Level API Example: Synchronous Hardware-Accelerated Video Filtering
 *
 * Shows how to apply hardware-accelerated video filters using the Filter API and multiple hardware contexts.
 *
 * Usage: tsx examples/api-hw-filter-sync.ts <input> <output>
 * Example: tsx examples/api-hw-filter-sync.ts /Users/seydx/Downloads/sample.mp4 examples/.tmp/api-hw-filter-sync.mp4
 */

import {
  AV_HWDEVICE_TYPE_OPENCL,
  AV_LOG_DEBUG,
  AV_PIX_FMT_GRAY8,
  AV_PIX_FMT_NV12,
  Codec,
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

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: tsx examples/api-hw-transcode.ts <input> <output>');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

console.log('Detecting hardware acceleration...');
const allHw = HardwareContext.listAvailable();
console.log('All available hardware devices:', allHw);

const hwOpencl = HardwareContext.create(AV_HWDEVICE_TYPE_OPENCL);
if (!hwOpencl) {
  throw new Error('OpenCL hardware acceleration not available');
}

// Auto-detect best available hardware
const hw = HardwareContext.auto();
if (!hw) {
  console.log('No hardware acceleration available, falling back to software');
} else {
  console.log(`Using hardware: ${hwOpencl.deviceTypeName}`);
}

// Open input media
console.log('Opening input:', inputFile);
using input = MediaInput.openSync(inputFile);

// Get video stream
const videoStream = input.video();
if (!videoStream) {
  throw new Error('No video stream found');
}

console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);

// Create hardware decoder
console.log('Creating hardware decoder...');
using decoder = Decoder.createSync(videoStream, {
  hardware: hwOpencl,
});

// Create filter
const filterChain = FilterPreset.chain(hwOpencl).format(AV_PIX_FMT_GRAY8).hwupload().sobel().hwdownload().format([AV_PIX_FMT_GRAY8, AV_PIX_FMT_NV12]).build();
console.log('Creating filter with:', filterChain);
using filter = FilterAPI.create(filterChain, {
  timeBase: videoStream.timeBase,
  hardware: hwOpencl,
});

// Determine encoder based on hardware
const encoderCodec = hw?.getEncoderCodec('hevc') ?? Codec.findEncoderByName(FF_ENCODER_LIBX265);
if (!encoderCodec) {
  throw new Error('No HEVC encoder found for the selected hardware');
}

// Create encoder
console.log(`Creating encoder: ${encoderCodec.name}...`);
using encoder = Encoder.createSync(encoderCodec, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
});

// Create output using MediaOutput
console.log('Creating output:', outputFile);
using output = MediaOutput.openSync(outputFile);
const videoOutputIndex = output.addStream(encoder);

// Process frames
console.log('Processing frames...');

const inputGenerator = input.packetsSync(videoStream.index);
const decoderGenerator = decoder.framesSync(inputGenerator);
const filterGenerator = filter.framesSync(decoderGenerator);
const encoderGenerator = encoder.packetsSync(filterGenerator);

for (using packet of encoderGenerator) {
  console.log(`Encoded packet: pts=${packet.pts}, dts=${packet.dts}, size=${packet.size}`);
  output.writePacketSync(packet, videoOutputIndex);
}

console.log('Done!');
