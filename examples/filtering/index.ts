/**
 * Video Filtering Example
 *
 * This example demonstrates how to:
 * 1. Decode video frames from a file
 * 2. Apply video filters using FFmpeg's filter graph
 * 3. Encode the filtered frames to a new file
 *
 * Filter graphs allow you to chain multiple filters together,
 * creating complex video processing pipelines. This example
 * shows various filters like scaling, rotation, and effects.
 *
 * The filter pipeline:
 * Input -> Decoder -> Filter Graph -> Encoder -> Output
 *
 * Common filters demonstrated:
 * - scale: Resize video
 * - transpose: Rotate video
 * - hflip/vflip: Mirror video
 * - crop: Extract a region
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FilterGraph,
  FormatContext,
  Frame,
  IOContext,
  OutputFormat,
  Packet,
} from '../../src/lib/index.js';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '../../src/lib/index.js';

// Stream processing state
interface StreamState {
  // Decoding
  inputStream: Stream;
  decoder: Codec;
  decoderContext: CodecContext;

  // Filtering
  filterGraph: FilterGraph;

  // Encoding
  encoder: Codec;
  encoderContext: CodecContext;
  outputStream: Stream;

  // Statistics
  processedFrames: number;
  encodedFrames: number;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('filtering', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Resources with automatic cleanup via 'using'
  using inputFormat = new FormatContext();
  using decodeFrame = new Frame();
  using filterFrame = new Frame();
  using packet = new Packet();
  using encodePacket = new Packet();

  // Output resources (manual management needed)
  let outputFormat: FormatContext | null = null;
  let ioContext: IOContext | null = null;
  let streamState: StreamState | null = null;

  try {
    // Different filter examples - uncomment the one you want to try
    const filterString = config.filter1; // Default: scale to 640x360
    // const filterString = config.filter2; // Rotate 90 degrees counter-clockwise
    // const filterString = config.filter3; // Horizontal flip
    // const filterString = config.filter4; // Vertical flip
    // const filterString = config.filter5; // Crop 100x100 from top-left
    // const filterString = 'scale=640:360,transpose=cclock'; // Chain multiple filters

    const outputFile = config.outputFile('filtered');

    console.log(`Input: ${config.inputFile}`);
    console.log(`Filter: ${filterString}`);
    console.log(`Output: ${outputFile}`);
    console.log('');

    // Step 1: Open input file and find video stream
    console.log('Opening input file...');
    await inputFormat.openInputAsync(config.inputFile);
    await inputFormat.findStreamInfoAsync();

    // Find first video stream
    let videoStream: Stream | null = null;
    for (const stream of inputFormat.streams) {
      if (stream.codecParameters?.codecType === AV_MEDIA_TYPE_VIDEO) {
        videoStream = stream;
        break;
      }
    }

    if (!videoStream?.codecParameters) {
      throw new Error('No video stream found in input file');
    }

    // Step 2: Setup decoder
    console.log('Setting up decoder...');
    const decoder = Codec.findDecoder(videoStream.codecParameters.codecId);
    if (!decoder) {
      throw new Error('Decoder not found');
    }

    const decoderContext = new CodecContext(decoder);
    videoStream.codecParameters.toCodecContext(decoderContext);
    await decoderContext.openAsync();

    console.log(`  Input: ${decoderContext.width}x${decoderContext.height}`);
    console.log(`  Pixel format: ${decoderContext.pixelFormat}`);

    // Step 3: Setup filter graph using the new unified API
    console.log('Setting up filter graph...');
    using filterGraph = new FilterGraph();

    // Build the complete filter pipeline with one call
    filterGraph.buildPipeline({
      input: {
        width: decoderContext.width,
        height: decoderContext.height,
        pixelFormat: decoderContext.pixelFormat,
        timeBase: videoStream.timeBase,
        sampleAspectRatio: decoderContext.sampleAspectRatio,
      },
      filters: filterString,
    });

    console.log('  Filter graph configured');

    // Step 4: Setup output format and encoder
    console.log('Setting up output...');

    const outputFormatType = OutputFormat.guess({ filename: outputFile });
    if (!outputFormatType) {
      throw new Error('Could not determine output format');
    }

    outputFormat = new FormatContext('output', outputFormatType, undefined, outputFile);
    const outputStream = outputFormat.newStream();
    if (!outputStream) {
      throw new Error('Failed to create output stream');
    }

    // Find encoder (use same codec as input)
    const encoder = Codec.findEncoder(decoder.id);
    if (!encoder) {
      throw new Error('Encoder not found');
    }

    const encoderContext = new CodecContext(encoder);

    // Configure encoder based on filter output
    // Some filters change dimensions (e.g., transpose swaps width/height)
    if (filterString.includes('transpose')) {
      // Transpose swaps dimensions
      encoderContext.width = decoderContext.height;
      encoderContext.height = decoderContext.width;
    } else if (filterString.includes('scale=')) {
      // Parse scale dimensions from filter
      const match = /scale=(\d+):(\d+)/.exec(filterString);
      if (match) {
        encoderContext.width = parseInt(match[1], 10);
        encoderContext.height = parseInt(match[2], 10);
      } else {
        encoderContext.width = decoderContext.width;
        encoderContext.height = decoderContext.height;
      }
    } else if (filterString.includes('crop=')) {
      // Parse crop dimensions
      const match = /crop=(\d+):(\d+)/.exec(filterString);
      if (match) {
        encoderContext.width = parseInt(match[1], 10);
        encoderContext.height = parseInt(match[2], 10);
      } else {
        encoderContext.width = decoderContext.width;
        encoderContext.height = decoderContext.height;
      }
    } else {
      // Default: use original dimensions
      encoderContext.width = decoderContext.width;
      encoderContext.height = decoderContext.height;
    }

    // Copy other encoder settings
    encoderContext.pixelFormat = decoderContext.pixelFormat;
    encoderContext.timeBase = videoStream.timeBase;
    encoderContext.framerate = decoderContext.framerate;
    encoderContext.sampleAspectRatio = decoderContext.sampleAspectRatio;
    encoderContext.bitRate = 400000n; // 400 kbps

    // Some containers require global headers
    if (outputFormat.outputFormat && outputFormat.outputFormat.flags & 0x0040) {
      encoderContext.flags = AV_CODEC_FLAG_GLOBAL_HEADER;
    }

    await encoderContext.openAsync();
    console.log(`  Output: ${encoderContext.width}x${encoderContext.height}`);

    // Copy encoder parameters to output stream
    outputStream.codecParameters?.fromCodecContext(encoderContext);
    outputStream.timeBase = encoderContext.timeBase;

    // Open output file for writing
    if (outputFormat.outputFormat?.needsFile) {
      ioContext = new IOContext();
      await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
      outputFormat.pb = ioContext;
    }

    // Write file header
    await outputFormat.writeHeaderAsync();

    // Store state
    streamState = {
      inputStream: videoStream,
      decoder,
      decoderContext,
      filterGraph,
      encoder,
      encoderContext,
      outputStream,
      processedFrames: 0,
      encodedFrames: 0,
    };

    // Step 5: Process video frames
    console.log('\nProcessing video...\n');

    // Main processing loop
    while (true) {
      // Read packet from input
      const ret = await inputFormat.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        break;
      }

      // Skip non-video packets
      if (packet.streamIndex !== videoStream.index) {
        packet.unref();
        continue;
      }

      // Decode packet to frame
      await decoderContext.sendPacketAsync(packet);
      packet.unref();

      // Process all frames from packet
      while (true) {
        const ret = await decoderContext.receiveFrameAsync(decodeFrame);
        if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
          break;
        }

        // Process frame through filter graph using the new unified API
        const filterRet = await filterGraph.processFrame(decodeFrame, filterFrame);
        decodeFrame.unref();

        // Check result
        if (filterRet === 0) {
          // Success - we got a filtered frame
          streamState.processedFrames++;

          // Log progress periodically
          if (streamState.processedFrames === 1 || streamState.processedFrames % 30 === 0) {
            console.log(`  Frame ${streamState.processedFrames}: ${filterFrame.width}x${filterFrame.height}, pts=${filterFrame.pts}`);
          }

          // Encode filtered frame
          await encoderContext.sendFrameAsync(filterFrame);
          filterFrame.unref();

          // Get encoded packets
          while (true) {
            const ret = await encoderContext.receivePacketAsync(encodePacket);
            if (ret < 0) {
              break;
            }

            // Write packet to output
            encodePacket.streamIndex = outputStream.index;
            encodePacket.rescaleTs(encoderContext.timeBase, outputStream.timeBase);
            await outputFormat.writeInterleavedFrameAsync(encodePacket);
            streamState.encodedFrames++;
            encodePacket.unref();
          }
        } else if (filterRet === AV_ERROR_EAGAIN) {
          // Filter needs more input frames - continue
          continue;
        } else if (filterRet === AV_ERROR_EOF) {
          // Filter finished - should not happen in normal processing
          break;
        } else if (filterRet < 0) {
          // Error occurred
          throw new Error(`Filter processing failed: ${filterRet}`);
        }
      }
    }

    // Step 6: Flush pipeline
    console.log('\nFlushing pipeline...');

    // Flush decoder
    await decoderContext.sendPacketAsync(null);
    while (true) {
      const ret = await decoderContext.receiveFrameAsync(decodeFrame);
      if (ret < 0) break;

      const filterRet = await filterGraph.processFrame(decodeFrame, filterFrame);
      decodeFrame.unref();

      if (filterRet === 0) {
        await encoderContext.sendFrameAsync(filterFrame);
        filterFrame.unref();
        streamState.processedFrames++;
      }
    }

    // Flush filter by sending null frame
    // This signals EOF to the filter and allows us to get any buffered frames
    console.log('Flushing filter...');
    const flushRet = await filterGraph.processFrame(null, filterFrame);
    // Process the first frame from flush if we got one
    if (flushRet === 0 && filterFrame.width > 0 && filterFrame.height > 0) {
      try {
        await encoderContext.sendFrameAsync(filterFrame);
        filterFrame.unref();
        streamState.processedFrames++;
      } catch (e) {
        console.warn('Could not encode buffered frame after flush:', e);
      }
    }

    // Now retrieve any remaining buffered frames using getFilteredFrame
    // This method only retrieves frames without sending null again
    console.log('Getting remaining buffered frames from filter...');
    while (true) {
      const ret = await filterGraph.getFilteredFrame(filterFrame);

      if (ret === AV_ERROR_EOF || ret === AV_ERROR_EAGAIN || ret < 0) {
        // No more frames available
        if (ret === AV_ERROR_EOF) {
          console.log('  No more frames from filter (EOF)');
        } else if (ret === AV_ERROR_EAGAIN) {
          console.log('  No more frames from filter (EAGAIN)');
        } else if (ret < 0) {
          console.log(`  Error getting filtered frame: ${ret}`);
        }
        break;
      }

      // Check if frame is valid before encoding
      if (filterFrame.width > 0 && filterFrame.height > 0) {
        try {
          await encoderContext.sendFrameAsync(filterFrame);
          filterFrame.unref();
          streamState.processedFrames++;
        } catch (e) {
          console.warn('Could not encode buffered frame after flush:', e);
        }
      } else {
        // Invalid frame, skip
        filterFrame.unref();
      }
    }

    // Most simple filters like scale don't buffer frames

    // Flush encoder
    await encoderContext.sendFrameAsync(null);
    while (true) {
      const ret = await encoderContext.receivePacketAsync(encodePacket);
      if (ret < 0) break;

      encodePacket.streamIndex = outputStream.index;
      encodePacket.rescaleTs(encoderContext.timeBase, outputStream.timeBase);
      await outputFormat.writeInterleavedFrameAsync(encodePacket);
      streamState.encodedFrames++;
      encodePacket.unref();
    }

    // Write trailer
    await outputFormat.writeTrailerAsync();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Frames processed: ${streamState.processedFrames}`);
    console.log(`Frames encoded: ${streamState.encodedFrames}`);
    console.log(`Output saved to: ${outputFile}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    streamState?.decoderContext.close();
    streamState?.decoderContext[Symbol.dispose]();
    streamState?.encoderContext.close();
    streamState?.encoderContext[Symbol.dispose]();

    if (outputFormat) {
      outputFormat[Symbol.dispose]();
    }
    if (ioContext) {
      ioContext[Symbol.dispose]();
    }
  }
}

// Run the example
main().catch(console.error);
