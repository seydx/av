#!/usr/bin/env tsx

/**
 * High-Level API Example: Frame Extraction and Processing
 *
 * Shows how to extract frames from video and save them as images.
 * Demonstrates frame manipulation capabilities of the high-level API.
 *
 * Usage: tsx examples/api-frame-extract.ts <input> <output>
 * Example: tsx examples/api-frame-extract.ts testdata/demux.mp4 examples/.tmp
 */

import { mkdir, writeFile } from 'fs/promises';
import { Decoder, Encoder, MediaInput } from '../src/api/index.js';

import { AV_PICTURE_TYPE_B, AV_PICTURE_TYPE_I, AV_PICTURE_TYPE_NONE, AV_PICTURE_TYPE_P, AV_PIX_FMT_RGB24, AV_PIX_FMT_YUVJ420P } from '../src/lib/index.js';

const inputFile = process.argv[2];
const outputDir = process.argv[3];

if (!inputFile || !outputDir) {
  console.error('Usage: tsx examples/api-frame-extract.ts <input> <output>');
  process.exit(1);
}

/**
 * Extract specific frame as PNG
 */
async function extractFrameAsPNG(frameNumber: number) {
  console.log(`\n=== Extracting frame ${frameNumber} as PNG ===`);

  const media = await MediaInput.open(inputFile);
  const videoStream = media.video(0);

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Create decoder
  const decoder = await Decoder.create(videoStream);

  // Create PNG encoder
  const pngEncoder = await Encoder.create('png', {
    type: 'video',
    width: videoStream.codecpar.width,
    height: videoStream.codecpar.height,
    pixelFormat: AV_PIX_FMT_RGB24,
    timeBase: videoStream.timeBase,
  });

  let currentFrame = 0;
  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      const frame = await decoder.decode(packet);
      if (frame) {
        if (currentFrame === frameNumber) {
          console.log(`  Frame ${frameNumber}: ${frame.width}x${frame.height}, PTS: ${frame.pts}`);

          // Encode frame as PNG
          const pngPacket = await pngEncoder.encode(frame);
          if (pngPacket?.data) {
            const filename = `${outputDir}/frame_${frameNumber}.png`;
            await writeFile(filename, pngPacket.data);
            console.log(`  ✅ Saved to ${filename}`);
            pngPacket.free();
          }

          // Flush encoder for single frame
          let flushPacket;
          while ((flushPacket = await pngEncoder.flush()) !== null) {
            if (flushPacket.data) {
              const filename = `${outputDir}/frame_${frameNumber}_flush.png`;
              await writeFile(filename, flushPacket.data);
            }
            flushPacket.free();
          }

          frame.free();
          break;
        }
        currentFrame++;
        frame.free();
      }
    }
    // Don't free - managed by generator
  }

  decoder.close();
  pngEncoder.close();
  media.close();
}

/**
 * Extract frames at regular intervals
 */
async function extractFramesAtInterval(intervalSeconds: number, count: number) {
  console.log(`\n=== Extracting ${count} frames every ${intervalSeconds}s ===`);

  const media = await MediaInput.open(inputFile);
  const videoStream = media.video(0);

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Get frame rate from the stream
  const fps = videoStream.codecpar.frameRate.toDouble();
  const frameInterval = Math.floor(fps * intervalSeconds);

  console.log(`  Video FPS: ~${fps.toFixed(1)}`);
  console.log(`  Frame interval: ${frameInterval} frames`);

  // Create decoder
  const decoder = await Decoder.create(videoStream);

  // Create JPEG encoder for thumbnails
  const jpegEncoder = await Encoder.create(
    'mjpeg',
    {
      type: 'video',
      width: 320, // Thumbnail size
      height: 240,
      pixelFormat: AV_PIX_FMT_YUVJ420P,
      timeBase: videoStream.timeBase,
    },
    {
      bitrate: '2M', // Higher bitrate = better quality
    },
  );

  let currentFrame = 0;
  let extractedCount = 0;

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      const frame = await decoder.decode(packet);
      if (frame) {
        if (currentFrame % frameInterval === 0 && extractedCount < count) {
          console.log(`  Extracting frame ${currentFrame} (${(currentFrame / fps).toFixed(1)}s)`);

          // Encode frame as JPEG
          const jpegPacket = await jpegEncoder.encode(frame);
          if (jpegPacket?.data) {
            const filename = `${outputDir}/thumb_${extractedCount}.jpg`;
            await writeFile(filename, jpegPacket.data);
            console.log(`    Saved: ${filename}`);
            jpegPacket.free();
          }

          extractedCount++;
        }
        currentFrame++;
        frame.free();

        if (extractedCount >= count) {
          break;
        }
      }
    }
    // Don't free - managed by generator
  }

  decoder.close();
  jpegEncoder.close();
  media.close();

  console.log(`  ✅ Extracted ${extractedCount} thumbnails`);
}

/**
 * Analyze frame properties
 */
async function analyzeFrames(count: number) {
  console.log(`\n=== Analyzing first ${count} frames ===`);

  const media = await MediaInput.open(inputFile);
  const videoStream = media.video(0);

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Create decoder
  const decoder = await Decoder.create(videoStream);

  const frameTypes: Record<string, number> = {};
  let minPts = Number.MAX_SAFE_INTEGER;
  let maxPts = Number.MIN_SAFE_INTEGER;
  let totalSize = 0;
  let analyzedFrames = 0;

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      const frame = await decoder.decode(packet);
      if (frame) {
        // Analyze frame
        const frameType = frame.pictType === AV_PICTURE_TYPE_I ? 'I' : frame.pictType === AV_PICTURE_TYPE_P ? 'P' : frame.pictType === AV_PICTURE_TYPE_B ? 'B' : 'Other';
        frameTypes[frameType] = (frameTypes[frameType] || AV_PICTURE_TYPE_NONE) + 1;

        if (frame.pts !== null && frame.pts !== undefined) {
          minPts = Math.min(minPts, Number(frame.pts));
          maxPts = Math.max(maxPts, Number(frame.pts));
        }

        // Calculate frame size (approximate)
        if (frame.linesize?.[0]) {
          totalSize += frame.linesize[0] * frame.height;
        }

        analyzedFrames++;
        frame.free();

        if (analyzedFrames >= count) {
          break;
        }
      }
    }
    // Don't free - managed by generator
  }

  decoder.close();
  media.close();

  console.log('\n  Frame Statistics:');
  console.log(`    Total frames analyzed: ${analyzedFrames}`);
  console.log('    Frame types:', frameTypes);
  console.log(`    PTS range: ${minPts} - ${maxPts}`);
  console.log(`    Average frame size: ${(totalSize / analyzedFrames / 1024).toFixed(2)} KB`);
}

/**
 * Generate animated GIF from video segment
 */
async function generateGIF(startTime: number, duration: number) {
  console.log(`\n=== Generating GIF from ${startTime}s for ${duration}s ===`);

  const media = await MediaInput.open(inputFile);
  const videoStream = media.video(0);

  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Get frame rate from the stream
  const fps = videoStream.codecpar.frameRate.toDouble();
  const startFrame = Math.floor(startTime * fps);
  const endFrame = Math.floor((startTime + duration) * fps);

  console.log(`  Processing frames ${startFrame} to ${endFrame}`);

  // Create decoder
  const decoder = await Decoder.create(videoStream);

  // Create GIF encoder (using libx264 as example, real GIF would need gif encoder)
  // For demo purposes, we'll just extract the frames
  let framesAmount = 0;
  let currentFrame = 0;

  for await (const packet of media.packets()) {
    if (packet.streamIndex === videoStream.index) {
      const frame = await decoder.decode(packet);
      if (frame) {
        if (currentFrame >= startFrame && currentFrame < endFrame) {
          framesAmount++;
        }
        currentFrame++;
        frame.free();

        if (currentFrame >= endFrame) {
          break;
        }
      }
    }
    // Don't free - managed by generator
  }

  console.log(`  Collected ${framesAmount} frames`);
  console.log('  (In a real implementation, these would be encoded as GIF)');

  decoder.close();
  media.close();
}

async function main() {
  try {
    console.log('High-Level API: Frame Extraction Example');
    console.log('========================================');
    console.log('Input:', inputFile);
    console.log('Output Directory:', outputDir);

    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Extract specific frame
    await extractFrameAsPNG(10);

    // Extract thumbnails
    await extractFramesAtInterval(2, 5);

    // Analyze frames
    await analyzeFrames(30);

    // Generate GIF (demo)
    await generateGIF(0, 3);

    console.log('\n✅ All operations completed!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
