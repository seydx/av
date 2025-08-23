#!/usr/bin/env tsx

/**
 * AVIO Read Callback Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/avio_read_callback.c
 * Make libavformat demuxer access media content through a custom
 * AVIOContext read callback.
 *
 * This demonstrates custom I/O using JavaScript callbacks to read from a buffer in memory.
 *
 * Usage: tsx examples/avio-read-callback.ts <input>
 * Example: tsx examples/avio-read-callback.ts testdata/video.mp4
 */

import fs from 'node:fs';

import { AVERROR_EOF, AVSEEK_SIZE, FFmpegError, FormatContext, IOContext, SEEK_CUR, SEEK_END, SEEK_SET } from '../src/lib/index.js';

/**
 * Buffer data structure for reading
 */
class BufferData {
  private buffer: Buffer;
  private position = 0;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  /**
   * Read data from buffer
   */
  read(size: number): Buffer | null {
    if (this.position >= this.buffer.length) {
      return null; // EOF
    }

    const bytesToRead = Math.min(size, this.buffer.length - this.position);
    const data = this.buffer.subarray(this.position, this.position + bytesToRead);
    this.position += bytesToRead;

    console.log(`Read ${bytesToRead} bytes from position ${this.position - bytesToRead}`);
    return data;
  }

  /**
   * Seek in buffer
   */
  seek(offset: bigint, whence: number): bigint {
    let newPos: number;

    // Handle AVSEEK_SIZE
    if (whence === AVSEEK_SIZE) {
      return BigInt(this.buffer.length);
    }

    const offsetNum = Number(offset);
    switch (whence) {
      case SEEK_SET:
        newPos = offsetNum;
        break;
      case SEEK_CUR:
        newPos = this.position + offsetNum;
        break;
      case SEEK_END:
        newPos = this.buffer.length + offsetNum;
        break;
      default:
        return BigInt(-1);
    }

    if (newPos < 0 || newPos > this.buffer.length) {
      return BigInt(-1);
    }

    this.position = newPos;
    return BigInt(this.position);
  }

  get size(): number {
    return this.buffer.length;
  }

  get remaining(): number {
    return this.buffer.length - this.position;
  }
}

/**
 * Main function demonstrating custom I/O with callbacks
 */
async function customIORead(inputFile: string): Promise<void> {
  let fmtCtx: FormatContext | null = null;
  let ioCtx: IOContext | null = null;

  try {
    // Read entire file into memory
    console.log(`Reading file: ${inputFile}`);
    const fileBuffer = fs.readFileSync(inputFile);
    console.log(`File size: ${fileBuffer.length} bytes`);

    // Create buffer data structure
    const bufferData = new BufferData(fileBuffer);

    // Create custom I/O context with callbacks
    ioCtx = new IOContext();
    ioCtx.allocContextWithCallbacks(
      4096, // Buffer size
      0, // Read mode
      // Read callback
      (size: number) => {
        const data = bufferData.read(size);
        if (data === null) {
          return AVERROR_EOF; // Signal EOF
        }
        return data;
      },
      undefined, // No write callback
      // Seek callback
      (offset: bigint, whence: number) => {
        const newPos = bufferData.seek(offset, whence);
        return newPos;
      },
    );

    // Create format context
    fmtCtx = new FormatContext();
    fmtCtx.allocContext();

    // Assign custom I/O context
    fmtCtx.pb = ioCtx;

    // Open input (with null filename since we're using custom I/O)
    // Note: We pass a dummy filename for FFmpeg's internal use
    const openRet = await fmtCtx.openInput('dummy', null, null);
    FFmpegError.throwIfError(openRet, 'openInput');

    // Find stream information
    const findRet = await fmtCtx.findStreamInfo(null);
    FFmpegError.throwIfError(findRet, 'findStreamInfo');

    // Dump format information
    console.log('\nFormat information:');
    fmtCtx.dumpFormat(0, inputFile, false);

    // Show that we successfully read through our custom callbacks
    console.log('\nSuccessfully read format through custom I/O callbacks!');
    console.log(`Number of streams: ${fmtCtx.nbStreams}`);
    const streams = fmtCtx.streams;
    if (streams) {
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        if (stream?.codecpar) {
          const codecType = stream.codecpar.codecType;
          const typeName = codecType === 0 ? 'Video' : codecType === 1 ? 'Audio' : codecType === 3 ? 'Subtitle' : 'Other';
          console.log(`Stream #${i}: ${typeName}`);

          if (codecType === 0) {
            // Video
            console.log(`  Resolution: ${stream.codecpar.width}x${stream.codecpar.height}`);
          } else if (codecType === 1) {
            // Audio
            console.log(`  Sample rate: ${stream.codecpar.sampleRate} Hz`);
            console.log(`  Channels: ${stream.codecpar.channels}`);
          }
        }
      }
    }

    // Show metadata if available
    const metadata = fmtCtx.metadata;
    if (metadata) {
      console.log('\nFile metadata:');
      const entries = metadata.getAll();
      for (const key of Object.keys(entries)) {
        console.log(`  ${key}: ${entries[key]}`);
      }
      metadata.free();
    }
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (ioCtx) {
      ioCtx.freeContext();
    }
    if (fmtCtx) {
      await fmtCtx.closeInput();
      fmtCtx.freeContext();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: tsx examples/avio-read-callback.ts <input>');
    console.log('API example program to show how to read from a custom buffer');
    console.log('accessed through AVIOContext callbacks.');
    process.exit(1);
  }

  const [inputFile] = args;

  // Check if file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    await customIORead(inputFile);
    process.exit(0);
  } catch (error) {
    if (error instanceof FFmpegError) {
      console.error(`FFmpeg Error: ${error.message} (code: ${error.code})`);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
