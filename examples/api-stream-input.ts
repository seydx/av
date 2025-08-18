#!/usr/bin/env tsx

/**
 * High-Level API Example: Stream Input
 *
 * Shows how to read media from Node.js streams and buffers using the high-level API.
 * Demonstrates the simplified API compared to the low-level FFmpeg bindings.
 *
 * Usage: tsx examples/api-stream-input.ts <input>
 * Example: tsx examples/api-stream-input.ts testdata/demux.mp4
 */

import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { Decoder, MediaInput } from '../src/api/index.js';
import { AV_MEDIA_TYPE_AUDIO, AV_MEDIA_TYPE_VIDEO } from '../src/index.js';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: tsx examples/api-stream-input.ts <input>');
  process.exit(1);
}

async function processFromStream() {
  console.log('=== Reading from Node.js Stream ===\n');

  // Create a readable stream
  const stream = createReadStream(inputFile);

  // Open media from stream
  const media = await MediaInput.open(stream);

  console.log(`Duration: ${media.duration}ms`);
  console.log('Metadata:', media.metadata);
  console.log('\nStreams:');

  for (const stream of media.streams) {
    console.log(`  [${stream.index}] ${stream.codecpar.codecType}: ${stream.codecpar.codecId}`);
    if (stream.codecpar.codecType === AV_MEDIA_TYPE_VIDEO) {
      console.log(`      Resolution: ${stream.codecpar.width}x${stream.codecpar.height}`);
      console.log(`      Pixel Format: ${stream.codecpar.format}`);
    } else if (stream.codecpar.codecType === AV_MEDIA_TYPE_AUDIO) {
      console.log(`      Sample Rate: ${stream.codecpar.sampleRate}Hz`);
      console.log(`      Channels: ${stream.codecpar.channels}`);
      console.log(`      Pixel Format: ${stream.codecpar.format}`);
    }
  }

  // Get video stream
  const videoStream = media.video(0);
  if (videoStream) {
    console.log('\nCounting packets without decoding...');

    let videoPackets = 0;
    let audioPackets = 0;
    let totalPackets = 0;

    for await (const packet of media.packets()) {
      totalPackets++;
      if (packet.streamIndex === 0) {
        videoPackets++;
      } else if (packet.streamIndex === 1) {
        audioPackets++;
      }
      // Don't free packets - they're managed by the generator

      if (totalPackets >= 20) break; // Just count first 20
    }

    console.log(`  Video packets: ${videoPackets}`);
    console.log(`  Audio packets: ${audioPackets}`);
    console.log(`  Total packets: ${totalPackets}`);

    // Now try decoding
    console.log('\nDecoding first 5 frames...');

    // Create decoder
    const decoder = await Decoder.create(media, videoStream.index);
    console.log('  Decoder created successfully');

    // Re-open from file since stream was consumed
    const media2 = await MediaInput.open(inputFile);
    let frameCount = 0;
    let packetCount = 0;

    for await (const packet of media2.packets()) {
      if (packet.streamIndex === videoStream.index) {
        packetCount++;
        try {
          const frame = await decoder.decode(packet);
          if (frame) {
            frameCount++;
            console.log(`  Frame ${frameCount}: ${frame.width}x${frame.height}, PTS: ${frame.pts}`);
            frame.free();
            if (frameCount >= 5) break;
          }
        } catch (error) {
          console.error(`  Error decoding packet: ${error}`);
          break;
        }
      }
      // Don't free - managed by generator
    }

    console.log(`  Decoded ${frameCount} frames from ${packetCount} packets`);
    decoder.close();
    media2.close();
  }

  media.close();
}

async function processFromBuffer() {
  console.log('\n=== Reading from Buffer ===\n');

  // Read entire file into buffer
  const buffer = await readFile(inputFile);
  console.log(`Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // Open media from buffer
  const media = await MediaInput.open(buffer);

  // Count packets by type
  const packetCounts: Record<string, number> = {};
  let totalPackets = 0;

  for await (const packet of media.packets()) {
    const streamInfo = media.streams[packet.streamIndex];
    if (streamInfo) {
      packetCounts[streamInfo.codecpar.codecType] = (packetCounts[streamInfo.codecpar.codecType] || 0) + 1;
    }
    // Don't free packets - they're managed by the generator
    totalPackets++;
    if (totalPackets >= 100) break; // Limit to prevent reading entire file
  }

  console.log('Packet counts:');
  for (const [type, count] of Object.entries(packetCounts)) {
    console.log(`  ${type}: ${count} packets`);
  }

  media.close();
}

async function main() {
  try {
    console.log('High-Level API: Stream Input Example');
    console.log('=====================================\n');

    await processFromStream();
    await processFromBuffer();

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
