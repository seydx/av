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

import {
  AV_LOG_DEBUG,
  AV_PICTURE_TYPE_B,
  AV_PICTURE_TYPE_I,
  AV_PICTURE_TYPE_NONE,
  AV_PICTURE_TYPE_P,
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_RGB8,
  Decoder,
  Encoder,
  FF_ENCODER_GIF,
  FF_ENCODER_MJPEG,
  FF_ENCODER_PNG,
  FilterAPI,
  FilterPreset,
  Log,
  MediaInput,
  MediaOutput,
} from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

const inputFile = process.argv[2];
const outputDir = process.argv[3];

if (!inputFile || !outputDir) {
  console.error('Usage: tsx examples/api-frame-extract.ts <input> <output>');
  process.exit(1);
}

async function extractFrameAsPNG(frameNumber: number) {
  await using input = await MediaInput.open(inputFile);

  const videoStream = input.video(0);
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Create decoder
  using decoder = await Decoder.create(videoStream);

  // Create filter to convert to RGB24
  const filterChain = FilterPreset.chain().format(AV_PIX_FMT_RGB24).build();
  using filter = FilterAPI.create(filterChain, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
  });

  // Create PNG encoder
  using pngEncoder = await Encoder.create(FF_ENCODER_PNG, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
  });

  let currentFrame = 0;
  for await (using packet of input.packets(videoStream.index)) {
    using frame = await decoder.decode(packet);
    if (frame) {
      using filteredFrame = await filter.process(frame);
      if (filteredFrame) {
        if (currentFrame === frameNumber) {
          console.log(`Frame ${frameNumber}: ${filteredFrame.width}x${filteredFrame.height}, PTS: ${filteredFrame.pts}`);

          // Encode frame as PNG
          using pngPacket = await pngEncoder.encode(filteredFrame);
          if (pngPacket?.data) {
            const filename = `${outputDir}/frame_${frameNumber}.png`;
            await writeFile(filename, pngPacket.data);
            console.log(`Saved to ${filename}`);
          }

          // Flush encoder for single frame
          for await (using flushPacket of pngEncoder.flushPackets()) {
            if (flushPacket.data) {
              const filename = `${outputDir}/frame_${frameNumber}_flush.png`;
              await writeFile(filename, flushPacket.data);
              console.log(`Saved to ${filename}`);
            }
          }

          break;
        }
        currentFrame++;
      }
    }
  }
}

async function extractFramesAtInterval(intervalSeconds: number, count: number) {
  await using input = await MediaInput.open(inputFile);

  const videoStream = input.video(0);
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Get frame rate from the stream
  const fps = videoStream.avgFrameRate.toDouble();
  const frameInterval = Math.floor(fps * intervalSeconds);

  console.log(`Video FPS: ~${fps.toFixed(1)}`);
  console.log(`Frame interval: ${frameInterval} frames`);

  // Create decoder
  using decoder = await Decoder.create(videoStream);

  // Create JPEG encoder for thumbnails
  using jpegEncoder = await Encoder.create(FF_ENCODER_MJPEG, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
    bitrate: '2M',
    options: {
      strict: 'experimental',
    },
  });

  let currentFrame = 0;
  let extractedCount = 0;

  for await (using packet of input.packets(videoStream.index)) {
    using frame = await decoder.decode(packet);
    if (frame) {
      if (currentFrame % frameInterval === 0 && extractedCount < count) {
        console.log(`Extracting frame ${currentFrame} (${(currentFrame / fps).toFixed(1)}s)`);

        // Encode frame as JPEG
        using jpegPacket = await jpegEncoder.encode(frame);
        if (jpegPacket?.data) {
          const filename = `${outputDir}/thumb_${extractedCount}.jpg`;
          await writeFile(filename, jpegPacket.data);
          console.log(`Saved: ${filename}`);
        }

        extractedCount++;
      }
      currentFrame++;

      if (extractedCount >= count) {
        break;
      }
    }
  }

  console.log(`Extracted ${extractedCount} thumbnails`);
}

async function analyzeFrames(count: number) {
  await using input = await MediaInput.open(inputFile);

  const videoStream = input.video(0);
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Create decoder
  using decoder = await Decoder.create(videoStream);

  const frameTypes: Record<string, number> = {};
  let minPts = Number.MAX_SAFE_INTEGER;
  let maxPts = Number.MIN_SAFE_INTEGER;
  let totalSize = 0;
  let analyzedFrames = 0;

  for await (using packet of input.packets(videoStream.index)) {
    using frame = await decoder.decode(packet);
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
      if (analyzedFrames >= count) {
        break;
      }
    }
  }

  console.log('Frame Statistics:');
  console.log(`Total frames analyzed: ${analyzedFrames}`);
  console.log('Frame types:', frameTypes);
  console.log(`PTS range: ${minPts} - ${maxPts}`);
  console.log(`Average frame size: ${(totalSize / analyzedFrames / 1024).toFixed(2)} KB`);
}

async function generateGIF(startTime: number, duration: number) {
  await using input = await MediaInput.open(inputFile);
  await using output = await MediaOutput.open(`${outputDir}/output.gif`);

  const videoStream = input.video(0);
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  // Get frame rate from the stream
  const fps = videoStream.avgFrameRate.toDouble();
  const startFrame = Math.floor(startTime * fps);
  const endFrame = Math.floor((startTime + duration) * fps);

  console.log(`Processing frames ${startFrame} to ${endFrame}`);

  // Create decoder
  using decoder = await Decoder.create(videoStream);

  // Create filter to convert to RGB24 (GIF requires this)
  const filterChain = FilterPreset.chain().format(AV_PIX_FMT_RGB8).build();
  using filter = FilterAPI.create(filterChain, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
  });

  // Create encoder
  using encoder = await Encoder.create(FF_ENCODER_GIF, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
    options: {
      // GIF specific options can be set here
      // e.g., loop count, palette size, etc.
      // For simplicity, we use defaults
    },
  });

  const outputStreamIndex = output.addStream(encoder);

  for await (using packet of input.packets(videoStream.index)) {
    using frame = await decoder.decode(packet);
    if (frame) {
      using filteredFrame = await filter.process(frame);
      if (filteredFrame) {
        using encodedPacket = await encoder.encode(filteredFrame);
        if (encodedPacket) {
          await output.writePacket(encodedPacket, outputStreamIndex);
        }
      }
    }
  }
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

console.log('Input:', inputFile);
console.log('Output Directory:', outputDir);

// Create output directory
await mkdir(outputDir, { recursive: true });

// Extract specific frame
console.log('Extracting specific frame:');
await extractFrameAsPNG(10);

// Extract thumbnails
console.log('Extracting thumbnails:');
await extractFramesAtInterval(2, 5);

// Analyze frames
console.log('Analyzing frames:');
await analyzeFrames(30);

// Generate GIF (demo)
console.log('Generating GIF:');
await generateGIF(0, 3);

console.log('Done!');
