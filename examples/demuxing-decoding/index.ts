/**
 * Demuxing and Decoding Example
 *
 * This example demonstrates how to:
 * 1. Open a media file
 * 2. Find and setup decoders for audio/video streams
 * 3. Read packets from the file
 * 4. Decode frames from packets
 *
 * Based on go-astiav's demuxing_decoding example
 */

import { parseArgs } from 'node:util';

import type { Stream } from '@seydx/ffmpeg';
import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_LOG_DEBUG,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  Packet,
  getLogLevelName,
  setLogCallback,
  setLogLevel,
} from '@seydx/ffmpeg';

// Stream info for decoding
interface StreamInfo {
  decoder: Codec;
  codecContext: CodecContext;
  inputStream: Stream;
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    input: {
      type: 'string',
      short: 'i',
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      default: false,
    },
  },
});

if (!values.input) {
  console.error('Usage: demuxing-decoding.ts -i <input file>');
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
  const frame = new Frame();
  const formatContext = new FormatContext();
  const streams = new Map<number, StreamInfo>();

  try {
    console.log(`Opening input file: ${values.input}`);

    // Open input file
    await formatContext.openInputAsync(values.input!);

    // Find stream information
    await formatContext.findStreamInfoAsync();

    console.log(`Format: ${formatContext.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${formatContext.duration / 1000000n}s`);
    console.log(`Number of streams: ${formatContext.nbStreams}`);

    // Setup decoders for each audio/video stream
    for (const stream of formatContext.streams) {
      const codecParams = stream.codecParameters;
      if (!codecParams) continue;

      // Skip non audio/video streams
      const mediaType = codecParams.codecType;
      if (mediaType !== AV_MEDIA_TYPE_AUDIO && mediaType !== AV_MEDIA_TYPE_VIDEO) {
        continue;
      }

      // Find decoder
      const decoder = Codec.findDecoder(codecParams.codecId);
      if (!decoder) {
        console.warn(`No decoder found for codec ID ${codecParams.codecId} on stream ${stream.index}`);
        continue;
      }

      // Create and configure codec context
      const codecContext = new CodecContext(decoder);

      // Copy codec parameters to context
      codecParams.toCodecContext(codecContext);

      // Open codec
      await codecContext.openAsync();

      // Store stream info
      const streamInfo: StreamInfo = {
        decoder,
        codecContext,
        inputStream: stream,
      };

      streams.set(stream.index, streamInfo);

      const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'video' : 'audio';
      console.log(`Stream #${stream.index}: ${typeStr} (${decoder.name})`);

      if (mediaType === AV_MEDIA_TYPE_VIDEO) {
        console.log(`  Resolution: ${codecContext.width}x${codecContext.height}`);
        console.log(`  Pixel format: ${codecContext.pixelFormat}`);
        console.log(`  Frame rate: ${stream.rFrameRate?.num}/${stream.rFrameRate?.den}`);
      } else {
        console.log(`  Sample rate: ${codecContext.sampleRate} Hz`);
        console.log(`  Channels: ${codecContext.channels}`);
        console.log(`  Sample format: ${codecContext.sampleFormat}`);
      }
    }

    if (streams.size === 0) {
      throw new Error('No audio or video streams found');
    }

    console.log('\nStarting demuxing and decoding...\n');

    let frameCount = 0;
    let packetCount = 0;

    // Main demuxing loop
    while (true) {
      try {
        // Read next packet
        const ret = await formatContext.readFrameAsync(packet);
        if (ret === AV_ERROR_EOF) {
          console.log('\nEnd of file reached');
          break;
        }

        packetCount++;

        // Get stream info for this packet
        const streamInfo = streams.get(packet.streamIndex);
        if (!streamInfo) {
          packet.unref();
          continue;
        }

        // Send packet to decoder
        try {
          await streamInfo.codecContext.sendPacketAsync(packet);
        } catch (error) {
          if (error instanceof FFmpegError && error.code !== AV_ERROR_EAGAIN) {
            throw error;
          }
        }

        // Receive all available frames
        while (true) {
          try {
            const ret = await streamInfo.codecContext.receiveFrameAsync(frame);
            if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
              break;
            }

            frameCount++;

            const mediaType = streamInfo.inputStream.codecParameters?.codecType;
            const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'video' : 'audio';

            // Log frame info
            if (mediaType === AV_MEDIA_TYPE_VIDEO) {
              console.log(`[${typeStr}] Frame #${frameCount} - Stream: ${packet.streamIndex}, PTS: ${frame.pts}, Size: ${frame.width}x${frame.height}`);
            } else {
              console.log(`[${typeStr}] Frame #${frameCount} - Stream: ${packet.streamIndex}, PTS: ${frame.pts}, Samples: ${frame.nbSamples}`);
            }

            // In a real application, you would process the frame here
            // For example: convert, filter, encode, save to file, etc.

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

        packet.unref();
      } catch (error) {
        if (error instanceof FFmpegError && error.code === AV_ERROR_EOF) {
          console.log('\nEnd of file reached');
          break;
        }
        throw error;
      }
    }

    // Flush decoders
    console.log('\nFlushing decoders...');
    for (const [streamIndex, streamInfo] of streams) {
      // Send null packet to signal end of stream
      try {
        await streamInfo.codecContext.sendPacketAsync(null);
      } catch {
        // Ignore errors during flush
      }

      // Receive remaining frames
      while (true) {
        try {
          const ret = await streamInfo.codecContext.receiveFrameAsync(frame);
          if (ret === AV_ERROR_EOF) {
            break;
          }

          frameCount++;
          const mediaType = streamInfo.inputStream.codecParameters?.codecType;
          const typeStr = mediaType === AV_MEDIA_TYPE_VIDEO ? 'video' : 'audio';
          console.log(`[${typeStr}] Flushed frame from stream ${streamIndex}, PTS: ${frame.pts}`);

          frame.unref();
        } catch (error) {
          if (error instanceof FFmpegError && error.code === AV_ERROR_EOF) {
            break;
          }
          // Ignore other errors during flush
          break;
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total packets processed: ${packetCount}`);
    console.log(`Total frames decoded: ${frameCount}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    packet[Symbol.dispose]();
    frame[Symbol.dispose]();

    // Close codec contexts
    for (const streamInfo of streams.values()) {
      streamInfo.codecContext.close();
    }

    // Close input
    formatContext.closeInput();
  }
}

// Run the example
main().catch(console.error);
