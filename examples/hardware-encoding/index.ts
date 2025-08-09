/**
 * Hardware Encoding Example
 *
 * This example demonstrates how to:
 * 1. Decode video frames from a file using software decoder
 * 2. Encode using hardware acceleration (VideoToolbox on macOS)
 * 3. Save the hardware-encoded video to a new file
 *
 * Hardware encoding offloads the encoding work to the GPU,
 * providing significant performance improvements for video encoding.
 * This example uses VideoToolbox on macOS (h264_videotoolbox).
 *
 * The pipeline:
 * Input -> Software Decoder -> Hardware Encoder (GPU) -> Output
 *
 * Key concepts:
 * - HardwareDeviceContext: Manages GPU device
 * - Hardware encoder automatically handles frame upload to GPU
 * - VideoToolbox accepts standard pixel formats
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  IOContext,
  OutputFormat,
  Packet,
  Rational,
} from '@seydx/ffmpeg';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '@seydx/ffmpeg';

// Stream processing state
interface StreamState {
  // Input/Decoding
  inputStream: Stream;
  decoder: Codec;
  decoderContext: CodecContext;

  // Output/Encoding
  encoder: Codec;
  encoderContext: CodecContext;
  outputStream: Stream;
  hwDeviceContext?: HardwareDeviceContext;

  // Statistics
  framesDecoded: number;
  framesEncoded: number;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('hw-encode', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using inputFormat = new FormatContext();
  using decodePacket = new Packet();
  using decodeFrame = new Frame();
  using encodePacket = new Packet();

  // Output resources (manual management)
  let outputFormat: FormatContext | null = null;
  let ioContext: IOContext | null = null;
  let streamState: StreamState | null = null;

  try {
    const inputFile = config.inputFile;
    const outputFile = config.outputFile('hw_encoded');
    const hwEncoder = config.hardware.encoder;

    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Hardware encoder: ${hwEncoder}`);
    console.log('');

    // Step 1: Open input file and find video stream
    console.log('Opening input file...');
    await inputFormat.openInputAsync(inputFile);
    await inputFormat.findStreamInfoAsync();

    console.log(`Format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${inputFormat.duration / 1000000n}s`);

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

    // Step 2: Setup software decoder
    console.log('\nSetting up decoder...');
    const decoder = Codec.findDecoder(videoStream.codecParameters.codecId);
    if (!decoder) {
      throw new Error('Decoder not found');
    }

    const decoderContext = new CodecContext(decoder);
    videoStream.codecParameters.toCodecContext(decoderContext);
    await decoderContext.openAsync();

    console.log(`  Decoder: ${decoder.name}`);
    console.log(`  Resolution: ${decoderContext.width}x${decoderContext.height}`);
    console.log(`  Pixel format: ${decoderContext.pixelFormat}`);

    // Step 3: Setup hardware encoder
    console.log('\nSetting up hardware encoder...');

    // Try to find hardware encoder
    let encoder = Codec.findEncoderByName(hwEncoder);
    if (!encoder) {
      // Fall back to software encoder
      console.log(`  Hardware encoder '${hwEncoder}' not available`);
      encoder = Codec.findEncoder(decoder.id);
      if (!encoder) {
        throw new Error('No suitable encoder found');
      }
      console.log(`  Falling back to software encoder: ${encoder.name}`);
    } else {
      console.log(`  Using hardware encoder: ${encoder.name}`);
    }

    // Step 4: Setup output format
    console.log('\nSetting up output...');

    const outputFormatType = OutputFormat.guess({ filename: outputFile });
    if (!outputFormatType) {
      throw new Error('Could not determine output format');
    }

    outputFormat = new FormatContext('output', outputFormatType, undefined, outputFile);
    const outputStream = outputFormat.newStream();
    if (!outputStream) {
      throw new Error('Failed to create output stream');
    }

    // Configure encoder
    const encoderContext = new CodecContext(encoder);
    encoderContext.width = decoderContext.width;
    encoderContext.height = decoderContext.height;
    // Use the same timebase as the input stream for proper timing
    encoderContext.timeBase = videoStream.timeBase;
    encoderContext.framerate = videoStream.rFrameRate || new Rational(30, 1);
    encoderContext.bitRate = config.transcoding.videoBitrate;
    encoderContext.pixelFormat = decoderContext.pixelFormat;
    encoderContext.sampleAspectRatio = decoderContext.sampleAspectRatio;

    // Setup hardware acceleration if using hardware encoder
    let hwDeviceContext: HardwareDeviceContext | undefined;
    if (encoder.name?.includes('videotoolbox')) {
      try {
        hwDeviceContext = new HardwareDeviceContext(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
        encoderContext.hwDeviceContext = hwDeviceContext;
        console.log('  Hardware acceleration: VideoToolbox');
        console.log(`  Device type: ${HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_VIDEOTOOLBOX)}`);
      } catch (error) {
        console.warn('  Failed to initialize hardware acceleration:', error);
        console.log('  Continuing with software encoding');
      }
    }

    // Set global header flag if needed
    if (outputFormat.outputFormat?.flags && 0x0040) {
      encoderContext.flags = AV_CODEC_FLAG_GLOBAL_HEADER;
    }

    // Open encoder
    await encoderContext.openAsync();
    console.log(`  Output resolution: ${encoderContext.width}x${encoderContext.height}`);
    console.log(`  Bitrate: ${encoderContext.bitRate / 1000n}kbps`);

    // Copy encoder parameters to output stream
    outputStream.codecParameters?.fromCodecContext(encoderContext);
    outputStream.timeBase = encoderContext.timeBase;

    // Initialize stream state
    streamState = {
      inputStream: videoStream,
      decoder,
      decoderContext,
      encoder,
      encoderContext,
      outputStream,
      hwDeviceContext,
      framesDecoded: 0,
      framesEncoded: 0,
    };

    // Open output file
    if (outputFormat.outputFormat?.needsFile) {
      ioContext = new IOContext();
      await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
      outputFormat.pb = ioContext;
    }

    // Write file header
    await outputFormat.writeHeaderAsync();

    // Step 5: Process video frames
    console.log('\nProcessing video...\n');

    // Helper function to encode frame
    const encodeFrame = async (frame: Frame | null) => {
      if (!streamState) return;

      await streamState.encoderContext.sendFrameAsync(frame);

      while (true) {
        try {
          const ret = await streamState.encoderContext.receivePacketAsync(encodePacket);
          if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
            break;
          }

          // Set packet stream index and rescale timestamps
          encodePacket.streamIndex = streamState.outputStream.index;
          encodePacket.rescaleTs(streamState.encoderContext.timeBase, streamState.outputStream.timeBase);

          // Write packet to output
          await outputFormat!.writeInterleavedFrameAsync(encodePacket);
          streamState.framesEncoded++;

          // Log progress periodically
          if (streamState.framesEncoded === 1 || streamState.framesEncoded % 30 === 0) {
            console.log(`  Encoded frame ${streamState.framesEncoded}`);
          }

          encodePacket.unref();
        } catch (error) {
          if (error instanceof FFmpegError) {
            if (error.code === AV_ERROR_EAGAIN || error.code === AV_ERROR_EOF) {
              break;
            }
          }
          throw error;
        }
      }
    };

    // Main processing loop
    while (true) {
      // Read packet from input
      const ret = await inputFormat.readFrameAsync(decodePacket);
      if (ret === AV_ERROR_EOF) {
        console.log('\nEnd of input file reached');
        break;
      }

      // Process only video packets
      if (decodePacket.streamIndex !== videoStream.index) {
        decodePacket.unref();
        continue;
      }

      // Decode packet
      await decoderContext.sendPacketAsync(decodePacket);
      decodePacket.unref();

      // Get decoded frames and encode them
      while (true) {
        try {
          const ret = await decoderContext.receiveFrameAsync(decodeFrame);
          if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
            break;
          }

          streamState.framesDecoded++;

          // Preserve frame timestamps for proper duration
          decodeFrame.pts = decodeFrame.bestEffortTimestamp || decodeFrame.pts;

          // Encode the decoded frame
          await encodeFrame(decodeFrame);

          decodeFrame.unref();
        } catch (error) {
          if (error instanceof FFmpegError) {
            if (error.code === AV_ERROR_EAGAIN || error.code === AV_ERROR_EOF) {
              break;
            }
          }
          throw error;
        }
      }
    }

    // Step 6: Flush pipeline
    console.log('\nFlushing pipeline...');

    // Flush decoder
    await decoderContext.sendPacketAsync(null);
    while (true) {
      try {
        const ret = await decoderContext.receiveFrameAsync(decodeFrame);
        if (ret === AV_ERROR_EOF) {
          break;
        }

        streamState.framesDecoded++;

        // Preserve frame timestamps for proper duration
        decodeFrame.pts = decodeFrame.bestEffortTimestamp || decodeFrame.pts;

        await encodeFrame(decodeFrame);
        decodeFrame.unref();
      } catch (error) {
        if (error instanceof FFmpegError && error.code === AV_ERROR_EOF) {
          break;
        }
        break;
      }
    }

    // Flush encoder
    await encodeFrame(null);

    // Write file trailer
    await outputFormat.writeTrailerAsync();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Frames decoded: ${streamState.framesDecoded}`);
    console.log(`Frames encoded: ${streamState.framesEncoded}`);
    console.log(`Output saved to: ${outputFile}`);
    if (hwDeviceContext) {
      console.log('Hardware acceleration: Enabled');
    } else {
      console.log('Hardware acceleration: Not used (software encoding)');
    }
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    streamState?.decoderContext.close();
    streamState?.encoderContext.close();
    streamState?.decoderContext[Symbol.dispose]();
    streamState?.encoderContext[Symbol.dispose]();
    streamState?.hwDeviceContext?.[Symbol.dispose]();

    outputFormat?.closeInput();
    outputFormat?.[Symbol.dispose]();
    ioContext?.[Symbol.dispose]();

    inputFormat.closeInput();
  }
}

// Run the example
main().catch(console.error);
