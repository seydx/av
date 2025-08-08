/**
 * Remuxing Example
 *
 * This example demonstrates how to:
 * 1. Open an input media file
 * 2. Copy streams to output file
 * 3. Copy packets without re-encoding
 * 4. Change container format (e.g., MP4 to MKV)
 *
 * Based on go-astiav's remuxing example
 */

import { parseArgs } from 'node:util';

import type { Stream } from '@seydx/ffmpeg';
import {
  AV_ERROR_EOF,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  FormatContext,
  IOContext,
  Packet,
  getLogLevelName,
  setLogCallback,
  setLogLevel,
} from '@seydx/ffmpeg';

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
    verbose: {
      type: 'boolean',
      short: 'v',
      default: false,
    },
  },
});

if (!values.input || !values.output) {
  console.error('Usage: remuxing -i <input file> -o <output file>');
  console.error('Example: remuxing -i input.mp4 -o output.mkv');
  process.exit(1);
}

async function main() {
  // Setup FFmpeg logging if verbose
  if (values.verbose) {
    setLogLevel(AV_LOG_DEBUG);
    setLogCallback((level, message) => {
      const levelName = getLogLevelName(level);
      console.log(`[${levelName}] ${message}`);
    });
  }

  // Resources that need cleanup
  const packet = new Packet();
  const inputFormatContext = new FormatContext();
  const outputFormatContext = new FormatContext();
  let ioContext: IOContext | null = null;

  try {
    console.log(`Opening input file: ${values.input}`);

    // Open input file
    await inputFormatContext.openInputAsync(values.input!);

    // Find stream information
    await inputFormatContext.findStreamInfoAsync();

    console.log(`Input format: ${inputFormatContext.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${inputFormatContext.duration / 1000000n}s`);
    console.log(`Number of streams: ${inputFormatContext.nbStreams}`);

    // Allocate output format context
    outputFormatContext.allocOutputContext(null, '', values.output!);

    console.log(`Output format: ${outputFormatContext.outputFormat?.name ?? 'unknown'}`);

    // Maps to track stream relationships
    const inputStreams = new Map<number, Stream>();
    const outputStreams = new Map<number, Stream>();

    // Copy streams from input to output
    for (const inputStream of inputFormatContext.streams) {
      const codecParams = inputStream.codecParameters;
      if (!codecParams) continue;

      // Only process audio or video streams
      const mediaType = codecParams.codecType;
      if (mediaType !== AV_MEDIA_TYPE_AUDIO && mediaType !== AV_MEDIA_TYPE_VIDEO) {
        continue;
      }

      // Store input stream
      inputStreams.set(inputStream.index, inputStream);

      // Create new stream in output
      const outputStream = outputFormatContext.newStream(null);
      if (!outputStream) {
        throw new Error(`Failed to create output stream for input stream ${inputStream.index}`);
      }

      // Copy codec parameters from input to output
      const outputCodecParams = outputStream.codecParameters;
      if (outputCodecParams) {
        console.log(`  Before copy - Input codec_id: ${codecParams.codecId}, Output codec_id: ${outputCodecParams.codecId}`);
        codecParams.copy(outputCodecParams);
        console.log(`  After copy - Output codec_id: ${outputCodecParams.codecId}`);
        // Reset codec tag (let muxer choose the appropriate one)
        outputCodecParams.codecTag = 0;
      }

      // Store output stream mapped to input stream index
      outputStreams.set(inputStream.index, outputStream);

      const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'video' : 'audio';
      console.log(`Copying stream #${inputStream.index}: ${typeStr}`);
    }

    if (outputStreams.size === 0) {
      throw new Error('No audio or video streams found to copy');
    }

    // Check if we need an IO context (for file output)
    const outputFormat = outputFormatContext.outputFormat;
    if (outputFormat?.needsFile) {
      // Open IO context for writing
      ioContext = new IOContext();
      await ioContext.openAsync(values.output!, AV_IO_FLAG_WRITE);
      outputFormatContext.pb = ioContext;
    }

    // Write header to output file
    await outputFormatContext.writeHeaderAsync();

    console.log('\nStarting remuxing...\n');

    let packetCount = 0;

    // Main remuxing loop
    while (true) {
      try {
        // Read next packet from input
        const ret = await inputFormatContext.readFrameAsync(packet);
        if (ret === AV_ERROR_EOF) {
          console.log('\nEnd of file reached');
          break;
        }

        // Get corresponding streams
        const inputStream = inputStreams.get(packet.streamIndex);
        const outputStream = outputStreams.get(packet.streamIndex);

        if (!inputStream || !outputStream) {
          // Skip packets from streams we're not copying
          packet.unref();
          continue;
        }

        packetCount++;

        // Update packet for output
        packet.streamIndex = outputStream.index;

        // Rescale timestamps from input to output timebase
        packet.rescaleTs(inputStream.timeBase, outputStream.timeBase);

        // Reset position
        packet.pos = -1n;

        // Write packet to output
        await outputFormatContext.writeInterleavedFrameAsync(packet);

        if (packetCount % 100 === 0) {
          console.log(`Processed ${packetCount} packets...`);
        }

        packet.unref();
      } catch (error: any) {
        if (error.code === AV_ERROR_EOF) {
          console.log('\nEnd of file reached');
          break;
        }
        throw error;
      }
    }

    // Write trailer to finalize output file
    await outputFormatContext.writeTrailerAsync();

    console.log('\n=== Summary ===');
    console.log(`Total packets remuxed: ${packetCount}`);
    console.log(`Output file: ${values.output}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    packet[Symbol.dispose]();

    // Close IO context if opened
    if (ioContext) {
      ioContext.close();
    }

    // Close input
    inputFormatContext.closeInput();

    // Note: Output format context is automatically cleaned up
    // when it goes out of scope
  }
}

// Run the example
main().catch(console.error);
