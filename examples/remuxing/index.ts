/**
 * Remuxing Example
 *
 * This example demonstrates how to:
 * 1. Copy streams from one container format to another
 * 2. No decoding or encoding - just container change
 * 3. Preserve all stream data and metadata
 * 4. Handle timestamp rescaling between containers
 *
 * Remuxing is useful for:
 * - Converting between container formats (MP4 to MKV, etc.)
 * - Extracting streams without re-encoding
 * - Fixing container issues
 * - Changing container-specific features
 *
 * The pipeline:
 * Input Container -> Copy Packets -> Output Container
 *
 * Key concepts:
 * - No codec operations (no decode/encode)
 * - Direct packet copying
 * - Timestamp rescaling for different container timebases
 * - Stream mapping between input and output
 */

import {
  AV_ERROR_EOF,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_DATA,
  AV_MEDIA_TYPE_SUBTITLE,
  AV_MEDIA_TYPE_VIDEO,
  FormatContext,
  IOContext,
  OutputFormat,
  Packet,
} from '@seydx/ffmpeg';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '@seydx/ffmpeg';

// Stream mapping between input and output
interface StreamMapping {
  inputIndex: number;
  outputIndex: number;
  inputStream: Stream;
  outputStream: Stream;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('remuxing', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using inputFormat = new FormatContext();
  using packet = new Packet();

  // Manual resource management for output
  let outputFormat: FormatContext | null = null;
  let ioContext: IOContext | null = null;
  const streamMappings: StreamMapping[] = [];

  try {
    const inputFile = config.inputFile;
    const outputFile = config.outputFile('remuxed', 'mkv'); // Change to .mkv to demonstrate format change

    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log('');

    // Step 1: Open input file
    console.log('Opening input file...');
    await inputFormat.openInputAsync(inputFile);
    await inputFormat.findStreamInfoAsync();

    console.log(`Format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${inputFormat.duration / 1000000n}s`);
    console.log(`Number of streams: ${inputFormat.nbStreams}`);

    // Step 2: Setup output format
    console.log('\nSetting up output file...');

    // Guess output format from filename
    const outputFormatType = OutputFormat.guess({ filename: outputFile });
    if (!outputFormatType) {
      throw new Error('Could not determine output format from filename');
    }

    outputFormat = new FormatContext('output', outputFormatType, undefined, outputFile);
    console.log(`Output format: ${outputFormatType.name}`);

    // Step 3: Copy all streams from input to output
    console.log('\nCopying stream definitions...');

    for (let i = 0; i < inputFormat.streams.length; i++) {
      const inputStream = inputFormat.streams[i];
      if (!inputStream?.codecParameters) {
        console.log(`  Skipping stream ${i} (no codec parameters)`);
        continue;
      }

      // Create corresponding output stream
      const outputStream = outputFormat.newStream();
      if (!outputStream) {
        throw new Error(`Failed to create output stream for input stream ${i}`);
      }

      // Copy codec parameters from input to output
      // This preserves the exact codec configuration
      if (outputStream.codecParameters && inputStream.codecParameters) {
        // Copy from input TO output (method copies TO the parameter passed)
        inputStream.codecParameters.copy(outputStream.codecParameters);

        // Let the muxer choose the appropriate tag for the container
        outputStream.codecParameters.codecTag = 0;
      }

      // Copy time base - critical for proper timestamp handling
      outputStream.timeBase = inputStream.timeBase;

      // Copy additional metadata
      if (inputStream.metadata) {
        outputStream.metadata = { ...inputStream.metadata };
      }

      // Store stream mapping
      streamMappings.push({
        inputIndex: i,
        outputIndex: outputStream.index,
        inputStream,
        outputStream,
      });

      // Log stream info
      const codecType = inputStream.codecParameters.codecType;
      let typeStr = 'Unknown';
      let details = '';

      switch (codecType) {
        case AV_MEDIA_TYPE_VIDEO:
          typeStr = 'Video';
          details = ` - ${inputStream.codecParameters.width}x${inputStream.codecParameters.height}`;
          break;
        case AV_MEDIA_TYPE_AUDIO:
          typeStr = 'Audio';
          const channels = inputStream.codecParameters.channelLayout?.nbChannels || 0;
          details = ` - ${inputStream.codecParameters.sampleRate} Hz, ${channels} channels`;
          break;
        case AV_MEDIA_TYPE_SUBTITLE:
          typeStr = 'Subtitle';
          break;
        case AV_MEDIA_TYPE_DATA:
          typeStr = 'Data';
          break;
      }

      console.log(`  ${typeStr} stream #${i} -> #${outputStream.index}${details}`);
    }

    if (streamMappings.length === 0) {
      throw new Error('No streams to copy');
    }

    // Step 4: Open output file
    console.log('\nOpening output file...');
    if (outputFormat.outputFormat?.needsFile) {
      ioContext = new IOContext();
      await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
      outputFormat.pb = ioContext;
    }

    // Write header to output file
    console.log('Writing output header...');
    await outputFormat.writeHeaderAsync();

    // Step 5: Copy all packets from input to output
    console.log('\nCopying packets...\n');

    let packetCount = 0;
    let lastProgressTime = Date.now();

    while (true) {
      // Read next packet from input
      const ret = await inputFormat.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        console.log('\nEnd of input file reached');
        break;
      }

      // Find the corresponding output stream
      const mapping = streamMappings.find((m) => m.inputIndex === packet.streamIndex);
      if (!mapping) {
        // Skip packets from streams we're not copying
        packet.unref();
        continue;
      }

      // Update packet stream index to output stream
      packet.streamIndex = mapping.outputIndex;

      // Rescale timestamps from input to output timebase
      // This is critical for proper playback in the new container
      packet.rescaleTs(mapping.inputStream.timeBase, mapping.outputStream.timeBase);

      // Reset position to -1 (will be set by muxer)
      packet.pos = -1n;

      // Write packet to output
      await outputFormat.writeInterleavedFrameAsync(packet);
      packetCount++;

      // Log progress periodically (every second)
      const now = Date.now();
      if (now - lastProgressTime > 1000) {
        const progress = packet.dts ? Number((packet.dts * 100n) / inputFormat.duration) : 0;
        console.log(`  Progress: ${progress.toFixed(1)}% - Packets copied: ${packetCount}`);
        lastProgressTime = now;
      }

      // Release packet data for reuse
      packet.unref();
    }

    // Step 6: Write trailer
    console.log('\nWriting output trailer...');
    await outputFormat.writeTrailerAsync();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total packets copied: ${packetCount}`);
    console.log(`Streams remuxed: ${streamMappings.length}`);
    console.log(`Input format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`Output format: ${outputFormat.outputFormat?.name ?? 'unknown'}`);
    console.log(`Output saved to: ${outputFile}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    outputFormat?.closeInput();
    outputFormat?.[Symbol.dispose]();
    ioContext?.[Symbol.dispose]();

    inputFormat.closeInput();
  }
}

// Run the example
main().catch(console.error);
