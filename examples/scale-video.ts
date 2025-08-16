#!/usr/bin/env tsx

/**
 * Scale Video Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/scale_video.c
 * Generate a synthetic video signal and use libswscale to perform rescaling.
 *
 * Usage: tsx examples/scale-video.ts <output_file> <output_size>
 * Example: tsx examples/scale-video.ts examples/.tmp/scale.rgb 640x480
 *
 * Play the output with:
 * ffplay -f rawvideo -pix_fmt rgb24 -video_size 640x480 output.rgb
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import { AV_PIX_FMT_RGB24, AV_PIX_FMT_YUV420P, AV_SWS_BILINEAR, FFmpegError, Frame, SoftwareScaleContext } from '../src/lib/index.js';

/**
 * Fill a YUV420P image with synthetic data
 */
function fillYuvImage(frame: Frame, width: number, height: number, frameIndex: number): void {
  const data = frame.data;
  const linesize = frame.linesize;

  if (!data || !linesize) {
    throw new Error('Frame data or linesize not available');
  }

  // Y plane
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[0]) {
        data[0][y * linesize[0] + x] = x + y + frameIndex * 3;
      }
    }
  }

  // Cb and Cr planes (half resolution for YUV420P)
  for (let y = 0; y < height / 2; y++) {
    for (let x = 0; x < width / 2; x++) {
      if (data[1]) {
        data[1][y * linesize[1] + x] = 128 + y + frameIndex * 2;
      }
      if (data[2]) {
        data[2][y * linesize[2] + x] = 64 + x + frameIndex * 5;
      }
    }
  }
}

/**
 * Parse video size string (e.g., "1920x1080" or "hd1080")
 */
function parseVideoSize(sizeStr: string): { width: number; height: number } {
  // Common size abbreviations
  const sizeAbbreviations: Record<string, { width: number; height: number }> = {
    ntsc: { width: 720, height: 480 },
    pal: { width: 720, height: 576 },
    qntsc: { width: 352, height: 240 },
    qpal: { width: 352, height: 288 },
    sntsc: { width: 640, height: 480 },
    spal: { width: 768, height: 576 },
    film: { width: 352, height: 240 },
    'ntsc-film': { width: 352, height: 240 },
    sqcif: { width: 128, height: 96 },
    qcif: { width: 176, height: 144 },
    cif: { width: 352, height: 288 },
    '4cif': { width: 704, height: 576 },
    '16cif': { width: 1408, height: 1152 },
    qqvga: { width: 160, height: 120 },
    qvga: { width: 320, height: 240 },
    vga: { width: 640, height: 480 },
    svga: { width: 800, height: 600 },
    xga: { width: 1024, height: 768 },
    uxga: { width: 1600, height: 1200 },
    qxga: { width: 2048, height: 1536 },
    sxga: { width: 1280, height: 1024 },
    qsxga: { width: 2560, height: 2048 },
    hsxga: { width: 5120, height: 4096 },
    wvga: { width: 852, height: 480 },
    wxga: { width: 1366, height: 768 },
    wsxga: { width: 1600, height: 1024 },
    wuxga: { width: 1920, height: 1200 },
    woxga: { width: 2560, height: 1600 },
    wqsxga: { width: 3200, height: 2048 },
    wquxga: { width: 3840, height: 2400 },
    whsxga: { width: 6400, height: 4096 },
    whuxga: { width: 7680, height: 4800 },
    cga: { width: 320, height: 200 },
    ega: { width: 640, height: 350 },
    hd480: { width: 852, height: 480 },
    hd720: { width: 1280, height: 720 },
    hd1080: { width: 1920, height: 1080 },
    '2k': { width: 2048, height: 1080 },
    '2kflat': { width: 1998, height: 1080 },
    '2kscope': { width: 2048, height: 858 },
    '4k': { width: 4096, height: 2160 },
    '4kflat': { width: 3996, height: 2160 },
    '4kscope': { width: 4096, height: 1716 },
    nhd: { width: 640, height: 360 },
    hqvga: { width: 240, height: 160 },
    wqvga: { width: 400, height: 240 },
    fwqvga: { width: 432, height: 240 },
    hvga: { width: 480, height: 320 },
    qhd: { width: 960, height: 540 },
    '2kdci': { width: 2048, height: 1080 },
    '4kdci': { width: 4096, height: 2160 },
    uhd2160: { width: 3840, height: 2160 },
    uhd4320: { width: 7680, height: 4320 },
  };

  // Check if it's an abbreviation
  const lowerSize = sizeStr.toLowerCase();
  if (sizeAbbreviations[lowerSize]) {
    return sizeAbbreviations[lowerSize];
  }

  // Try to parse WxH format
  const match = /^(\d+)x(\d+)$/.exec(sizeStr);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }

  throw new Error(`Invalid size '${sizeStr}', must be in the form WxH or a valid size abbreviation`);
}

/**
 * Main scale video function
 */
async function scaleVideo(outputFile: string, outputSize: string): Promise<void> {
  let swsCtx: SoftwareScaleContext | null = null;
  let srcFrame: Frame | null = null;
  let dstFrame: Frame | null = null;
  let outfile: number | null = null;

  try {
    // Parse destination size
    const { width: dstW, height: dstH } = parseVideoSize(outputSize);

    // Source dimensions and formats
    const srcW = 320;
    const srcH = 240;
    const srcPixFmt = AV_PIX_FMT_YUV420P;
    const dstPixFmt = AV_PIX_FMT_RGB24;

    console.log(`Scaling from ${srcW}x${srcH} (YUV420P) to ${dstW}x${dstH} (RGB24)`);

    // Open output file
    outfile = fs.openSync(outputFile, 'w');

    // Create scaling context
    swsCtx = new SoftwareScaleContext();
    swsCtx.getContext(srcW, srcH, srcPixFmt, dstW, dstH, dstPixFmt, AV_SWS_BILINEAR);

    // Allocate source frame
    srcFrame = new Frame();
    srcFrame.alloc();
    srcFrame.width = srcW;
    srcFrame.height = srcH;
    srcFrame.format = srcPixFmt;
    const srcRet = srcFrame.getBuffer(16); // 16-byte alignment
    FFmpegError.throwIfError(srcRet, 'Could not allocate source frame buffer');

    // Allocate destination frame
    dstFrame = new Frame();
    dstFrame.alloc();
    dstFrame.width = dstW;
    dstFrame.height = dstH;
    dstFrame.format = dstPixFmt;
    const dstRet = dstFrame.getBuffer(1); // No alignment needed for file output
    FFmpegError.throwIfError(dstRet, 'Could not allocate destination frame buffer');

    // Calculate destination buffer size (RGB24 = 3 bytes per pixel)
    const dstBufSize = dstW * dstH * 3;

    // Generate and scale 100 frames
    for (let i = 0; i < 100; i++) {
      // Generate synthetic video
      fillYuvImage(srcFrame, srcW, srcH, i);

      // Scale the frame
      const scaleRet = swsCtx.scaleFrame(dstFrame, srcFrame);
      FFmpegError.throwIfError(scaleRet, `Failed to scale frame ${i}`);

      // Write scaled image to file
      const dstData = dstFrame.data;
      if (dstData?.[0]) {
        // RGB24 is packed, so all data is in plane 0
        const rgbData = Buffer.from(dstData[0].buffer, dstData[0].byteOffset, dstBufSize);
        fs.writeSync(outfile, rgbData);
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/100 frames`);
      }
    }

    console.log('\nScaling succeeded!');
    console.log('Play the output file with the command:');
    console.log(`ffplay -f rawvideo -pix_fmt rgb24 -video_size ${dstW}x${dstH} ${outputFile}`);
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (outfile !== null) {
      fs.closeSync(outfile);
    }
    if (srcFrame) {
      srcFrame.free();
    }
    if (dstFrame) {
      dstFrame.free();
    }
    if (swsCtx) {
      swsCtx.freeContext();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Usage: tsx examples/scale-video.ts <output_file> <output_size>');
    console.log('');
    console.log('API example program to show how to scale an image with libswscale.');
    console.log('This program generates a series of pictures, rescales them to the given');
    console.log('output_size and saves them to an output file named output_file.');
    console.log('');
    console.log('Examples:');
    console.log('  tsx examples/scale-video.ts output.rgb 640x480');
    console.log('  tsx examples/scale-video.ts output.rgb hd720');
    console.log('  tsx examples/scale-video.ts output.rgb vga');
    console.log('');
    console.log('Common size abbreviations:');
    console.log('  vga    - 640x480');
    console.log('  hd720  - 1280x720');
    console.log('  hd1080 - 1920x1080');
    console.log('  4k     - 4096x2160');
    process.exit(1);
  }

  const [outputFile, outputSize] = args;

  try {
    await scaleVideo(outputFile, outputSize);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
