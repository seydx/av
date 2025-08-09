/**
 * Demuxing and Decoding Example
 *
 * This example demonstrates how to:
 * 1. Open a media file (demuxing)
 * 2. Find and setup decoders for audio/video streams
 * 3. Read packets from the file
 * 4. Decode frames from packets
 *
 * Key concepts:
 * - FormatContext: Container for media file handling
 * - Packet: Compressed data read from file
 * - Frame: Decoded audio/video data
 * - CodecContext: Decoder state and configuration
 *
 * The data flow is:
 * File -> FormatContext -> Packet -> CodecContext -> Frame
 */

import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  Packet,
} from '../../src/lib/index.js';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '../../src/lib/index.js';

// Stream info for decoding
interface StreamInfo {
  decoder: Codec;
  codecContext: CodecContext;
  inputStream: Stream;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('demux-decode', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using packet = new Packet();
  using frame = new Frame();
  using formatContext = new FormatContext();

  const streams = new Map<number, StreamInfo>();

  try {
    console.log(`Opening input file: ${config.inputFile}`);

    // Step 1: Open the input file
    // This identifies the container format (e.g., MP4, MKV, AVI)
    await formatContext.openInputAsync(config.inputFile);

    // Step 2: Analyze the file to find all streams
    // This reads headers to identify codecs, duration, etc.
    await formatContext.findStreamInfoAsync();

    console.log(`Format: ${formatContext.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${formatContext.duration / 1000000n}s`);
    console.log(`Number of streams: ${formatContext.nbStreams}`);
    console.log('');

    // Step 3: Setup decoders for each audio/video stream
    for (const stream of formatContext.streams) {
      const codecParams = stream.codecParameters;
      if (!codecParams) continue;

      // We only handle audio and video streams in this example
      const mediaType = codecParams.codecType;
      if (mediaType !== AV_MEDIA_TYPE_AUDIO && mediaType !== AV_MEDIA_TYPE_VIDEO) {
        continue;
      }

      // Find the appropriate decoder for this stream
      const decoder = Codec.findDecoder(codecParams.codecId);
      if (!decoder) {
        console.warn(`No decoder found for codec ID ${codecParams.codecId} on stream ${stream.index}`);
        continue;
      }

      // Create a decoder context (holds decoder state)
      const codecContext = new CodecContext(decoder);

      // Copy stream parameters to the decoder
      // This includes resolution, sample rate, etc.
      codecParams.toCodecContext(codecContext);

      // Initialize the decoder
      await codecContext.openAsync();

      // Store stream info for later use
      const streamInfo: StreamInfo = {
        decoder,
        codecContext,
        inputStream: stream,
      };

      streams.set(stream.index, streamInfo);

      // Log stream information
      const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'Video' : 'Audio';
      console.log(`${typeStr} Stream #${stream.index}: ${decoder.name}`);

      if (mediaType === AV_MEDIA_TYPE_VIDEO) {
        console.log(`  Resolution: ${codecContext.width}x${codecContext.height}`);
        console.log(`  Pixel format: ${codecContext.pixelFormat}`);
        const fps = stream.rFrameRate;
        if (fps) {
          console.log(`  Frame rate: ${fps.num}/${fps.den} fps`);
        }
      } else {
        console.log(`  Sample rate: ${codecContext.sampleRate} Hz`);
        console.log(`  Channels: ${codecContext.channels}`);
        console.log(`  Sample format: ${codecContext.sampleFormat}`);
      }
    }

    if (streams.size === 0) {
      throw new Error('No audio or video streams found in file');
    }

    console.log('\nStarting demuxing and decoding...\n');

    let frameCount = 0;
    let packetCount = 0;

    // Step 4: Main demuxing loop - read packets from file
    while (true) {
      // Read next packet from the file
      const ret = await formatContext.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        console.log('\nEnd of file reached');
        break;
      }

      packetCount++;

      // Get the decoder for this packet's stream
      const streamInfo = streams.get(packet.streamIndex);
      if (!streamInfo) {
        // This packet is from a stream we're not decoding
        packet.unref();
        continue;
      }

      // Step 5: Send packet to decoder
      // The decoder may buffer the packet internally
      try {
        await streamInfo.codecContext.sendPacketAsync(packet);
      } catch (error) {
        // EAGAIN means the decoder's input buffer is full
        // We need to read frames before sending more packets
        if (error instanceof FFmpegError && error.code !== AV_ERROR_EAGAIN) {
          throw error;
        }
      }

      // Step 6: Receive decoded frames
      // One packet may produce multiple frames (or none)
      while (true) {
        try {
          const ret = await streamInfo.codecContext.receiveFrameAsync(frame);
          if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
            // No more frames available right now
            break;
          }

          frameCount++;

          const mediaType = streamInfo.inputStream.codecParameters?.codecType;
          const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'Video' : 'Audio';

          // Log frame information
          if (mediaType === AV_MEDIA_TYPE_VIDEO) {
            if (frameCount % 30 === 0) {
              // Log every 30th frame to reduce output
              console.log(`${typeStr} Frame #${frameCount} - Stream: ${packet.streamIndex}, PTS: ${frame.pts}, Size: ${frame.width}x${frame.height}`);
            }
          } else {
            if (frameCount % 100 === 0) {
              // Log every 100th audio frame
              console.log(`${typeStr} Frame #${frameCount} - Stream: ${packet.streamIndex}, PTS: ${frame.pts}, Samples: ${frame.nbSamples}`);
            }
          }

          // This is where you would process the decoded frame:
          // - Apply filters
          // - Convert pixel/sample format
          // - Encode to another format
          // - Save to file
          // - Display on screen
          // - Send over network
          // etc.

          // Release frame data for reuse
          frame.unref();
        } catch (error) {
          if (error instanceof FFmpegError) {
            if (error.code === AV_ERROR_EAGAIN || error.code === AV_ERROR_EOF) {
              break;
            }
          }
          throw error;
        }
      }

      // Release packet data for reuse
      packet.unref();
    }

    // Step 7: Flush decoders to get remaining frames
    console.log('\nFlushing decoders...');

    for (const [streamIndex, streamInfo] of streams) {
      // Send null packet to signal end of stream
      try {
        await streamInfo.codecContext.sendPacketAsync(null);
      } catch {
        // Ignore errors during flush
      }

      // Receive remaining buffered frames
      let flushedFrames = 0;
      while (true) {
        try {
          const ret = await streamInfo.codecContext.receiveFrameAsync(frame);
          if (ret === AV_ERROR_EOF) {
            break;
          }

          flushedFrames++;
          frameCount++;
          frame.unref();
        } catch (error) {
          if (error instanceof FFmpegError && error.code === AV_ERROR_EOF) {
            break;
          }
          // Ignore other errors during flush
          break;
        }
      }

      if (flushedFrames > 0) {
        const mediaType = streamInfo.inputStream.codecParameters?.codecType;
        const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'Video' : 'Audio';
        console.log(`  ${typeStr} stream ${streamIndex}: ${flushedFrames} frames flushed`);
      }
    }

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total packets processed: ${packetCount}`);
    console.log(`Total frames decoded: ${frameCount}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup: Close all codec contexts
    for (const streamInfo of streams.values()) {
      streamInfo.codecContext.close();
      streamInfo.codecContext[Symbol.dispose]();
    }

    // Close input (formatContext will be disposed automatically via 'using')
    formatContext.closeInput();
  }
}

// Run the example
main().catch(console.error);
