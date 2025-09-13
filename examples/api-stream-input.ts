/**
 * High-Level API Example: Stream Input
 *
 * Shows how to read media from Node.js streams and buffers using the high-level API.
 * Demonstrates the simplified API compared to the low-level FFmpeg bindings.
 *
 * Usage: tsx examples/api-stream-input.ts <input>
 * Example: tsx examples/api-stream-input.ts testdata/demux.mp4
 */

import { readFile } from 'fs/promises';

import { MediaInput } from '../src/api/index.js';
import { AV_LOG_DEBUG, Log } from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: tsx examples/api-stream-input.ts <input>');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

// Read entire file into buffer
const buffer = await readFile(inputFile);
console.log(`Buffer size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

// Open media from buffer
await using input = await MediaInput.open(buffer);

// Count packets by type
const packetCounts: Record<string, number> = {};
let totalPackets = 0;

for await (using packet of input.packets()) {
  const streamInfo = input.streams[packet.streamIndex];
  if (streamInfo) {
    packetCounts[streamInfo.codecpar.codecType] = (packetCounts[streamInfo.codecpar.codecType] || 0) + 1;
  }
  totalPackets++;
  if (totalPackets >= 100) {
    break; // Limit to prevent reading entire file
  }
}

console.log('Packet counts:');
for (const [type, count] of Object.entries(packetCounts)) {
  console.log(`  ${type}: ${count} packets`);
}
