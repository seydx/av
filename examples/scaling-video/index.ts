#!/usr/bin/env node

/**
 * Video Scaling Example
 *
 * This example demonstrates how to:
 * - Decode a frame from a video file
 * - Use SoftwareScaleContext to scale video frames
 * - Export the result as a PNG image
 *
 * Usage:
 *   npm run scaling-video -- -i input.mp4 -o output.png -w 100 -h 100
 */

import { AV_LOG_ERROR, AV_PIX_FMT_RGBA, Codec, CodecContext, FormatContext, Frame, Packet, SoftwareScaleContext, setLogCallback, setLogLevel } from '@seydx/ffmpeg';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { PNG } from 'pngjs';

// Parse command line arguments
const { values } = parseArgs({
  options: {
    input: {
      type: 'string',
      short: 'i',
    },
    output: {
      type: 'string',
      short: 'o',
    },
    width: {
      type: 'string',
      short: 'w',
      default: '100',
    },
    height: {
      type: 'string',
      short: 'h',
      default: '100',
    },
  },
});

if (!values.input || !values.output) {
  console.error('Error: Input and output paths are required');
  console.log('Usage: npm run scaling-video -- -i <input.mp4> -o <output.png> -w <width> -h <height>');
  process.exit(1);
}

const dstWidth = parseInt(values.width || '50');
const dstHeight = parseInt(values.height || '50');

if (dstWidth <= 0 || dstHeight <= 0) {
  console.error('Error: Width and height must be positive numbers');
  process.exit(1);
}

async function main() {
  // Set up logging
  setLogLevel(AV_LOG_ERROR);
  setLogCallback((level, msg) => {
    console.log(`[FFmpeg ${level}] ${msg}`);
  });

  console.log(`Opening input file: ${values.input}`);

  // Open input file
  using formatContext = new FormatContext();
  await formatContext.openInputAsync(values.input!);
  await formatContext.findStreamInfoAsync();

  // Find first video stream
  const streams = formatContext.streams;
  let videoStreamIndex = -1;
  let videoStream = null;

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    const codecParams = stream?.codecParameters;
    if (codecParams && codecParams.codecType === 0) {
      // AVMEDIA_TYPE_VIDEO = 0
      videoStreamIndex = i;
      videoStream = stream;
      break;
    }
  }

  if (!videoStream?.codecParameters) {
    throw new Error('No video stream found in input file');
  }

  // Find decoder
  const codecParams = videoStream.codecParameters;
  const decoder = Codec.findDecoder(codecParams.codecId);
  if (!decoder) {
    throw new Error('Decoder not found');
  }

  // Create codec context and copy parameters
  using codecContext = new CodecContext(decoder);
  codecParams.toCodecContext(codecContext);
  await codecContext.openAsync();

  console.log(`Video stream: ${codecContext.width}x${codecContext.height}, pixel format: ${codecContext.pixelFormat}`);

  // Read and decode first frame
  using packet = new Packet();
  using srcFrame = new Frame();

  let frameDecoded = false;
  while (!frameDecoded) {
    const ret = await formatContext.readFrameAsync(packet);
    if (ret < 0) {
      throw new Error('Could not read frame from input');
    }

    // Skip non-video packets
    if (packet.streamIndex !== videoStreamIndex) {
      packet.unref();
      continue;
    }

    // Send packet to decoder
    await codecContext.sendPacketAsync(packet);
    packet.unref();

    // Try to receive decoded frame
    const recvRet = await codecContext.receiveFrameAsync(srcFrame);
    if (recvRet >= 0) {
      frameDecoded = true;
      console.log(`Decoded frame: ${srcFrame.width}x${srcFrame.height}, format: ${srcFrame.format}`);
    }
  }

  console.log(`Creating scale context for ${dstWidth}x${dstHeight}...`);

  // Create destination frame
  using dstFrame = new Frame();

  // Create software scale context
  // Note: SWS_BILINEAR = 2
  const SWS_BILINEAR = 2;
  using swsContext = new SoftwareScaleContext(srcFrame.width, srcFrame.height, srcFrame.format, dstWidth, dstHeight, AV_PIX_FMT_RGBA, SWS_BILINEAR);

  console.log('Scaling frame...');

  // Scale the frame
  swsContext.scaleFrame(srcFrame, dstFrame);

  console.log(`Destination frame: ${dstFrame.width}x${dstFrame.height}, format: ${dstFrame.format}`);

  // Convert frame data to PNG
  console.log('Converting to PNG...');

  // Get frame data
  const frameData = dstFrame.data;
  if (!frameData || frameData.length === 0) {
    throw new Error('No frame data available');
  }

  // Create PNG from RGBA data
  const png = new PNG({
    width: dstFrame.width,
    height: dstFrame.height,
  });

  // Copy RGBA data to PNG buffer
  // Frame data is in planar format, first plane contains RGBA data
  const rgbaData = frameData[0];
  if (!rgbaData) {
    throw new Error('No RGBA data in frame');
  }

  // Copy data ensuring we have the right amount
  const expectedSize = dstFrame.width * dstFrame.height * 4; // RGBA = 4 bytes per pixel
  if (rgbaData.length < expectedSize) {
    throw new Error(`Insufficient frame data: got ${rgbaData.length}, expected ${expectedSize}`);
  }

  // Copy to PNG buffer
  rgbaData.copy(png.data, 0, 0, expectedSize);

  // Write PNG to file
  console.log(`Writing PNG to ${values.output}...`);
  const outputStream = createWriteStream(values.output!);
  await pipeline(png.pack(), outputStream);

  console.log('Done! Image saved to:', values.output);
}

// Run the example
main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
