/**
 * Video Scaling Example
 *
 * This example demonstrates how to:
 * 1. Decode a frame from a video file
 * 2. Use SoftwareScaleContext to resize video frames
 * 3. Convert pixel formats during scaling
 * 4. Export the result as a PNG image
 *
 * Video scaling is used for:
 * - Creating thumbnails from videos
 * - Resizing videos for different resolutions
 * - Converting between pixel formats
 * - Generating preview images
 *
 * The pipeline:
 * Input -> Decoder -> Scaler -> PNG Export
 *
 * Key concepts:
 * - SoftwareScaleContext: Software-based video scaling
 * - Pixel format conversion: YUV to RGB conversion
 * - Scaling algorithms: Bilinear, bicubic, lanczos, etc.
 * - Frame data layout: Planar vs packed formats
 */

import {
  AV_ERROR_EOF,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_RGBA,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  Packet,
  SoftwareScaleContext,
} from '@seydx/ffmpeg';

import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { PNG } from 'pngjs';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '@seydx/ffmpeg';

// Scaling algorithm constants
const SWS_BILINEAR = 2; // Good balance of speed and quality

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('scale-video', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using formatContext = new FormatContext();
  using packet = new Packet();
  using srcFrame = new Frame();
  using dstFrame = new Frame();

  // Manual resource management
  let codecContext: CodecContext | null = null;
  let swsContext: SoftwareScaleContext | null = null;

  try {
    const inputFile = config.inputFile;
    const outputFile = config.outputFile('thumbnail', 'png');
    // Use config dimensions or defaults for thumbnail
    const dstWidth = config.transcoding.outputWidth || 320;
    const dstHeight = config.transcoding.outputHeight || 180;
    const scalingAlgorithm = SWS_BILINEAR; // Good balance of speed and quality

    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Target size: ${dstWidth}x${dstHeight}`);
    console.log('');

    // Step 1: Open input file and find video stream
    console.log('Opening input file...');
    await formatContext.openInputAsync(inputFile);
    await formatContext.findStreamInfoAsync();

    console.log(`Format: ${formatContext.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${formatContext.duration / 1000000n}s`);

    // Find first video stream
    let videoStream: Stream | null = null;
    for (const stream of formatContext.streams) {
      if (stream.codecParameters?.codecType === AV_MEDIA_TYPE_VIDEO) {
        videoStream = stream;
        break;
      }
    }

    if (!videoStream?.codecParameters) {
      throw new Error('No video stream found in input file');
    }

    // Step 2: Setup decoder
    console.log('\nSetting up decoder...');
    const decoder = Codec.findDecoder(videoStream.codecParameters.codecId);
    if (!decoder) {
      throw new Error('Video decoder not found');
    }

    codecContext = new CodecContext(decoder);
    videoStream.codecParameters.toCodecContext(codecContext);
    await codecContext.openAsync();

    console.log(`  Decoder: ${decoder.name}`);
    console.log(`  Source resolution: ${codecContext.width}x${codecContext.height}`);
    console.log(`  Pixel format: ${codecContext.pixelFormat}`);

    // Step 3: Decode first keyframe
    console.log('\nSeeking to first keyframe...');
    let frameDecoded = false;
    let attempts = 0;
    const maxAttempts = 100; // Limit attempts to avoid infinite loop

    while (!frameDecoded && attempts < maxAttempts) {
      // Read packet
      const ret = await formatContext.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        throw new Error('End of file reached before finding a frame');
      }

      attempts++;

      // Skip non-video packets
      if (packet.streamIndex !== videoStream.index) {
        packet.unref();
        continue;
      }

      // Send packet to decoder
      await codecContext.sendPacketAsync(packet);
      packet.unref();

      // Try to receive decoded frame
      try {
        const recvRet = await codecContext.receiveFrameAsync(srcFrame);
        if (recvRet >= 0) {
          frameDecoded = true;
          console.log(`  Frame decoded at attempt ${attempts}`);
          console.log(`  Frame size: ${srcFrame.width}x${srcFrame.height}`);
          console.log(`  Frame format: ${srcFrame.format}`);
        }
      } catch {
        // Frame not ready yet, continue
      }
    }

    if (!frameDecoded) {
      throw new Error('Could not decode any frame from video');
    }

    // Step 4: Setup scaler
    console.log('\nSetting up scaler...');
    console.log(`  Scaling: ${srcFrame.width}x${srcFrame.height} -> ${dstWidth}x${dstHeight}`);
    console.log(`  Format conversion: ${srcFrame.format} -> RGBA`);
    // Create software scale context
    swsContext = new SoftwareScaleContext(
      srcFrame.width,
      srcFrame.height,
      srcFrame.format,
      dstWidth,
      dstHeight,
      AV_PIX_FMT_RGBA, // Convert to RGBA for PNG export
      scalingAlgorithm,
    );

    // Step 5: Scale the frame
    console.log('\nScaling frame...');
    swsContext.scaleFrame(srcFrame, dstFrame);
    console.log(`  Output frame: ${dstFrame.width}x${dstFrame.height}`);
    console.log('  Output format: RGBA');

    // Step 6: Export as PNG
    console.log('\nExporting to PNG...');
    // Get frame data
    const frameData = dstFrame.data;
    if (!frameData || frameData.length === 0) {
      throw new Error('No frame data available after scaling');
    }

    // Create PNG from RGBA data
    const png = new PNG({
      width: dstFrame.width,
      height: dstFrame.height,
    });

    // Frame data is in planar format, first plane contains RGBA data
    const rgbaData = frameData[0];
    if (!rgbaData) {
      throw new Error('No RGBA data in scaled frame');
    }

    // Verify data size
    const expectedSize = dstFrame.width * dstFrame.height * 4; // RGBA = 4 bytes per pixel
    if (rgbaData.length < expectedSize) {
      throw new Error(`Insufficient frame data: got ${rgbaData.length}, expected ${expectedSize}`);
    }

    // Copy to PNG buffer
    rgbaData.copy(png.data, 0, 0, expectedSize);

    // Write PNG to file
    console.log(`  Writing to: ${outputFile}`);
    const outputStream = createWriteStream(outputFile);
    await pipeline(png.pack(), outputStream);

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Input video: ${codecContext.width}x${codecContext.height}`);
    console.log(`Output image: ${dstWidth}x${dstHeight}`);
    console.log(`Scale factor: ${(dstWidth / codecContext.width).toFixed(2)}x${(dstHeight / codecContext.height).toFixed(2)}`);
    console.log(`Output saved to: ${outputFile}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    codecContext?.close();
    codecContext?.[Symbol.dispose]();
    swsContext?.[Symbol.dispose]();
    formatContext.closeInput();
  }
}

// Run the example
main().catch(console.error);
