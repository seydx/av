/**
 * Show Metadata Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/show_metadata.c
 * Demonstrates the use of the libavformat metadata API.
 * Shows all metadata from an input file.
 *
 * Usage: tsx examples/show-metadata.ts <input>
 * Example: tsx examples/show-metadata.ts testdata/video.mp4
 */

import { FFmpegError, FormatContext } from '../src/lib/index.js';

/**
 * Main function to show metadata
 */
async function showMetadata(inputFile: string): Promise<void> {
  let fmtCtx: FormatContext | null = null;

  try {
    // Open input file
    fmtCtx = new FormatContext();
    const openRet = await fmtCtx.openInput(inputFile, null, null);
    FFmpegError.throwIfError(openRet, 'openInput');

    // Find stream information
    const findRet = await fmtCtx.findStreamInfo(null);
    FFmpegError.throwIfError(findRet, 'findStreamInfo');

    // Get metadata dictionary
    const metadata = fmtCtx.metadata;
    if (!metadata) {
      console.log('No metadata found in file');
      return;
    }

    // Iterate over all metadata entries
    console.log('File metadata:');
    console.log('==============');

    const entries = metadata.getAll();
    const keys = Object.keys(entries);
    for (const key of keys) {
      console.log(`${key}=${entries[key]}`);
    }

    if (keys.length === 0) {
      console.log('(no metadata entries)');
    }

    // Also show stream metadata if available
    const streams = fmtCtx.streams;
    if (streams) {
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        if (stream?.metadata) {
          console.log(`\nStream #${i} metadata:`);
          console.log('==================');
          const streamEntries = stream.metadata.getAll();
          const streamKeys = Object.keys(streamEntries);
          for (const key of streamKeys) {
            console.log(`${key}=${streamEntries[key]}`);
          }
          if (streamKeys.length === 0) {
            console.log('(no metadata entries)');
          }
        }
      }
    }

    // Clean up metadata dictionary
    metadata.free();
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
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
    console.log('Usage: tsx examples/show-metadata.ts <input>');
    console.log('Example program to demonstrate the use of the libavformat metadata API.');
    process.exit(1);
  }

  const [inputFile] = args;

  try {
    await showMetadata(inputFile);
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
