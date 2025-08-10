/**
 * Bit Stream Filtering Example
 *
 * This example demonstrates how to use bitstream filters to modify
 * encoded data without decoding/re-encoding. Bitstream filters are
 * useful for:
 * - Adding/removing NAL units
 * - Converting between H.264 formats (Annex B <-> AVCC)
 * - Extracting/injecting metadata
 * - Fixing timestamp issues
 *
 * Common filters:
 * - h264_mp4toannexb: Convert H.264 from MP4 to Annex B format
 * - aac_adtstoasc: Convert AAC from ADTS to ASC
 * - vp9_superframe: Merge VP9 invisible frames
 * - null: Pass through without modification (for testing)
 */

import { AV_ERROR_EAGAIN, AV_ERROR_EOF, AV_IO_FLAG_WRITE, BitStreamFilter, BitStreamFilterContext, FormatContext, IOContext, Packet } from '../../src/lib/index.js';

import { config } from '../index.js';

// Stream context for filtering
interface StreamContext {
  filterContext: BitStreamFilterContext;
  filteredPacket: Packet;
}

async function main() {
  // Resources with automatic cleanup
  using inputFormat = new FormatContext();
  using outputFormat = new FormatContext();
  using packet = new Packet();

  // Stream contexts map
  const streamContexts = new Map<number, StreamContext>();

  try {
    // Filter to use (default: h264_mp4toannexb for H.264 conversion)
    const filterName = 'h264_mp4toannexb'; // Common filter for H.264 streams
    const outputFile = config.outputFile('bit_filtered');

    console.log(`Input: ${config.inputFile}`);
    console.log(`Filter: ${filterName}`);
    console.log(`Output: ${outputFile}`);
    console.log('');

    // Step 1: Open input file
    console.log('Opening input file...');
    await inputFormat.openInputAsync(config.inputFile);
    await inputFormat.findStreamInfoAsync();

    console.log(`Format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${inputFormat.duration / 1000000n}s`);
    console.log(`Streams: ${inputFormat.nbStreams}`);
    console.log('');

    // Step 2: Find bitstream filter
    const filter = BitStreamFilter.getByName(filterName);
    if (!filter) {
      throw new Error(`Bitstream filter '${filterName}' not found`);
    }
    console.log(`Using filter: ${filter.name}`);

    // Check which codec IDs this filter supports
    const codecIds = filter.codecIds;
    if (codecIds && codecIds.length > 0) {
      console.log(`Filter supports codecs: ${codecIds.join(', ')}`);
    }
    console.log('');

    // Step 3: Setup output file
    console.log('Setting up output...');
    outputFormat.allocOutputContext(null, '', outputFile);

    // Copy streams and setup filters
    for (let i = 0; i < inputFormat.nbStreams; i++) {
      const inputStream = inputFormat.streams[i];
      const outputStream = outputFormat.newStream();

      if (!inputStream.codecParameters || !outputStream.codecParameters) {
        continue;
      }

      // Copy codec parameters
      inputStream.codecParameters.copy(outputStream.codecParameters);
      outputStream.codecParameters.codecTag = 0;

      // Copy time base
      outputStream.timeBase = inputStream.timeBase;

      // Check if filter supports this codec
      const codecId = inputStream.codecParameters.codecId;
      const supportsCodec = !codecIds || codecIds.length === 0 || codecIds.includes(codecId);

      if (supportsCodec) {
        console.log(`Creating filter for stream ${i} (codec: ${codecId})`);

        // Create filter context for this stream
        const filterContext = new BitStreamFilterContext(filter);

        // Copy codec parameters to filter
        const filterCodecParams = filterContext.codecParameters;
        if (!filterCodecParams) {
          console.log('Warning: No codec parameters on filter context, skipping stream');
          continue;
        }
        inputStream.codecParameters.copy(filterCodecParams);

        // Set time base
        filterContext.timeBaseIn = inputStream.timeBase;
        filterContext.timeBaseOut = inputStream.timeBase;

        // Initialize filter
        filterContext.init();

        streamContexts.set(i, {
          filterContext,
          filteredPacket: new Packet(),
        });
      } else {
        console.log(`Stream ${i} not supported by filter, will copy as-is`);
      }
    }

    // Open output file and write header
    if (outputFormat.outputFormat?.needsFile) {
      // Open the output file with IOContext
      const ioContext = new IOContext();
      await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
      outputFormat.pb = ioContext;
    }
    await outputFormat.writeHeaderAsync();

    // Step 4: Process packets
    console.log('\nProcessing packets...\n');
    let processedPackets = 0;
    let filteredPackets = 0;

    while (true) {
      // Read packet
      const ret = await inputFormat.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        break;
      }

      processedPackets++;

      // Get stream context
      const streamCtx = streamContexts.get(packet.streamIndex);

      if (streamCtx) {
        // Apply filter
        const sendRet = await streamCtx.filterContext.sendPacketAsync(packet);
        if (sendRet >= 0 || sendRet === AV_ERROR_EAGAIN) {
          // Receive filtered packets
          while (true) {
            const receiveRet = await streamCtx.filterContext.receivePacketAsync(streamCtx.filteredPacket);
            if (receiveRet === AV_ERROR_EAGAIN || receiveRet === AV_ERROR_EOF) {
              break;
            }
            if (receiveRet < 0) {
              throw new Error(`Failed to receive packet from filter: ${receiveRet}`);
            }

            // Update stream index
            streamCtx.filteredPacket.streamIndex = packet.streamIndex;

            // Write filtered packet
            await outputFormat.writeFrameAsync(streamCtx.filteredPacket);
            filteredPackets++;

            streamCtx.filteredPacket.unref();
          }
        }
      } else {
        // No filter for this stream, copy as-is
        await outputFormat.writeFrameAsync(packet);
      }

      packet.unref();

      // Show progress
      if (processedPackets % 100 === 0) {
        console.log(`Processed ${processedPackets} packets, filtered ${filteredPackets}`);
      }
    }

    // Step 5: Flush filters
    console.log('\nFlushing filters...');
    for (const [streamIndex, streamCtx] of streamContexts) {
      // Send flush packet
      await streamCtx.filterContext.sendPacketAsync(null);

      // Receive remaining packets
      while (true) {
        const ret = await streamCtx.filterContext.receivePacketAsync(streamCtx.filteredPacket);
        if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
          break;
        }
        if (ret < 0) {
          throw new Error(`Failed to receive packet from filter during flush: ${ret}`);
        }

        streamCtx.filteredPacket.streamIndex = streamIndex;

        await outputFormat.writeFrameAsync(streamCtx.filteredPacket);
        filteredPackets++;

        streamCtx.filteredPacket.unref();
      }

      // Cleanup
      streamCtx.filterContext.flush();
      streamCtx.filterContext[Symbol.dispose]();
      streamCtx.filteredPacket[Symbol.dispose]();
    }

    // Write trailer
    await outputFormat.writeTrailerAsync();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total packets processed: ${processedPackets}`);
    console.log(`Packets after filtering: ${filteredPackets}`);
    console.log(`Filter used: ${filterName}`);
    console.log(`Output saved to: ${outputFile}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    for (const streamCtx of streamContexts.values()) {
      streamCtx.filterContext[Symbol.dispose]();
      streamCtx.filteredPacket[Symbol.dispose]();
    }

    inputFormat.closeInput();
  }
}

// Run the example
main().catch(console.error);
