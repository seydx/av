/**
 * Hardware Transcoding Example
 *
 * This example demonstrates full GPU-accelerated transcoding:
 * 1. Hardware-accelerated video decoding (GPU)
 * 2. Frames stay in GPU memory (zero-copy)
 * 3. Hardware-accelerated encoding (GPU)
 * 4. Minimal CPU involvement
 *
 * This provides maximum performance for video transcoding by keeping
 * all video data on the GPU throughout the entire pipeline.
 *
 * The pipeline:
 * Input -> HW Decoder (GPU) -> GPU Memory -> HW Encoder (GPU) -> Output
 *
 * Key concepts:
 * - HardwareDeviceContext: Manages the GPU device
 * - Hardware pixel format (AV_PIX_FMT_VIDEOTOOLBOX)
 * - Zero-copy frame transfer between decoder and encoder
 * - Checking hardware configuration support
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AV_PIX_FMT_YUV420P,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  IOContext,
  OutputFormat,
  Packet,
  Rational,
  type AVPixelFormat,
} from '../../src/lib/index.js';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '../../src/lib/index.js';

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

  // Hardware
  hwDevice: HardwareDeviceContext;
  hwPixelFormat: AVPixelFormat;

  // Statistics
  framesDecoded: number;
  framesEncoded: number;
}

/**
 * Check if a codec supports hardware acceleration
 */
function checkHardwareSupport(codec: Codec, deviceType: number): AVPixelFormat | null {
  const configs = codec.getHardwareConfigs();

  for (const config of configs) {
    if (config.deviceType === deviceType && config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) {
      return config.pixelFormat;
    }
  }

  return null;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('hw-transcode', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using inputFormat = new FormatContext();
  using decodePacket = new Packet();
  using hwFrame = new Frame();
  using cpuFrame = new Frame(); // Fallback for software processing
  using encodePacket = new Packet();

  // Output resources (manual management)
  let outputFormat: FormatContext | null = null;
  let ioContext: IOContext | null = null;
  let streamState: StreamState | null = null;
  let hwDevice: HardwareDeviceContext | null = null;

  try {
    const inputFile = 'rtsp://admin:adminadmin@192.168.178.173/Preview_01_main';
    const outputFile = config.outputFile('hw_transcoded');
    const hwEncoder = config.hardware.encoder;

    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Hardware encoder: ${hwEncoder}`);
    console.log('');

    // Step 1: Create hardware device context
    console.log('Initializing hardware device...');
    try {
      hwDevice = new HardwareDeviceContext(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
      console.log('  Device: VideoToolbox');
      console.log(`  Type: ${HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_VIDEOTOOLBOX)}`);
    } catch (error) {
      throw new Error(`Failed to create hardware device: ${error}`);
    }

    // Step 2: Open input file
    console.log('\nOpening input file...');
    await inputFormat.openInputAsync(inputFile);
    await inputFormat.findStreamInfoAsync();

    console.log(`Format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${inputFormat.duration / 1000000n}s`);

    // Find video stream
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

    // Step 3: Setup hardware decoder
    console.log('\nSetting up hardware decoder...');
    const decoder = Codec.findDecoder(videoStream.codecParameters.codecId);
    if (!decoder) {
      throw new Error('Decoder not found');
    }

    // Check if decoder supports hardware acceleration
    const hwPixelFormat = checkHardwareSupport(decoder, AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
    if (!hwPixelFormat) {
      console.warn('  Hardware decoding not supported for this codec');
      console.log('  Falling back to software decoding');
    } else {
      console.log(`  Hardware pixel format: ${hwPixelFormat}`);
    }

    const decoderContext = new CodecContext(decoder);
    videoStream.codecParameters.toCodecContext(decoderContext);

    // Configure hardware acceleration for decoder
    if (hwPixelFormat) {
      decoderContext.hwDeviceContext = hwDevice;
      decoderContext.setHardwarePixelFormat(hwPixelFormat);
      console.log('  Hardware acceleration enabled for decoder');
    }

    await decoderContext.openAsync();
    console.log(`  Decoder: ${decoder.name}`);
    console.log(`  Resolution: ${decoderContext.width}x${decoderContext.height}`);

    // Step 4: Setup hardware encoder
    console.log('\nSetting up hardware encoder...');

    let encoder = Codec.findEncoderByName(hwEncoder);
    if (!encoder) {
      console.log(`  Hardware encoder '${hwEncoder}' not available`);
      encoder = Codec.findEncoder(decoder.id);
      if (!encoder) {
        throw new Error('No suitable encoder found');
      }
      console.log(`  Using software encoder: ${encoder.name}`);
    } else {
      console.log(`  Using hardware encoder: ${encoder.name}`);
    }

    // Step 5: Setup output format
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
    encoderContext.sampleAspectRatio = decoderContext.sampleAspectRatio;

    // Configure hardware acceleration for encoder
    if (encoder.name?.includes('videotoolbox')) {
      encoderContext.hwDeviceContext = hwDevice;
      // Use hardware pixel format if decoder outputs hardware frames
      if (hwPixelFormat) {
        encoderContext.pixelFormat = AV_PIX_FMT_VIDEOTOOLBOX;
        console.log('  Hardware acceleration enabled for encoder');
        console.log('  Zero-copy pipeline: GPU frames stay in GPU memory');
      } else {
        // Software decode -> hardware encode
        encoderContext.pixelFormat = AV_PIX_FMT_YUV420P;
        console.log('  Mixed pipeline: Software decode -> Hardware encode');
      }
    } else {
      encoderContext.pixelFormat = AV_PIX_FMT_YUV420P;
      console.log('  Software encoding');
    }

    // Set global header flag if needed
    if (outputFormat.outputFormat?.flags && 0x0040) {
      encoderContext.flags = AV_CODEC_FLAG_GLOBAL_HEADER;
    }

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
      hwDevice,
      hwPixelFormat: hwPixelFormat ?? AV_PIX_FMT_YUV420P,
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

    // Step 6: Process video frames
    console.log('\nProcessing video...\n');

    // Helper function to encode frame
    const encodeFrame = async (frame: Frame | null) => {
      if (!streamState) return;

      await streamState.encoderContext.sendFrameAsync(frame);

      while (true) {
        const ret = await streamState.encoderContext.receivePacketAsync(encodePacket);
        if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
          break;
        }

        if (ret < 0) {
          // Encoding error, skip this packet
          console.warn(`  ⚠️ Encoding error: ${ret}`);
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
          console.log(`  Frame ${streamState.framesEncoded} encoded`);
        }

        encodePacket.unref();
      }
    };

    const maxFrames = 200; // Limit for testing
    let frameCount = 0;

    // Main processing loop
    while (frameCount < maxFrames) {
      frameCount++;

      // Read packet from input
      const ret = await inputFormat.readFrameAsync(decodePacket);
      if (ret === AV_ERROR_EOF) {
        console.log('\nEnd of input file reached');
        break;
      }

      if (frameCount > maxFrames) {
        console.log(`\nProcessed ${frameCount} frames, stopping early for testing`);
        break;
      }

      // Process only video packets
      if (decodePacket.streamIndex !== videoStream.index) {
        decodePacket.unref();
        continue;
      }

      // Decode packet
      const sendRet = await decoderContext.sendPacketAsync(decodePacket);

      // Handle send errors gracefully
      if (sendRet < 0 && sendRet !== AV_ERROR_EAGAIN) {
        console.warn(`  ⚠️ Send packet error: ${sendRet}`);
        decodePacket.unref();
        continue;
      }

      decodePacket.unref();

      // Get decoded frames and encode them
      while (true) {
        // Use hardware frame for zero-copy pipeline
        const frame = hwPixelFormat ? hwFrame : cpuFrame;
        const ret = await decoderContext.receiveFrameAsync(frame);

        if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
          break;
        }

        // Handle decoder errors gracefully
        if (ret < 0) {
          console.warn(`  ⚠️ Receive frame error: ${ret}`);
          frame.unref();
          continue;
        }

        streamState.framesDecoded++;

        // Preserve frame timestamps for proper duration
        frame.pts = frame.bestEffortTimestamp || frame.pts;

        // For hardware frames, check if transfer is needed
        if (hwPixelFormat && frame.format === hwPixelFormat) {
          // Frame is already in GPU memory - direct encode (zero-copy)
          await encodeFrame(frame);
        } else if (!hwPixelFormat && encoderContext.pixelFormat === AV_PIX_FMT_VIDEOTOOLBOX) {
          // Software decode -> hardware encode (frame will be uploaded by encoder)
          await encodeFrame(frame);
        } else {
          // Software pipeline or format conversion needed
          await encodeFrame(frame);
        }

        frame.unref();
      }
    }

    // Step 7: Flush pipeline
    console.log('\nFlushing pipeline...');

    // Flush decoder
    await decoderContext.sendPacketAsync(null);
    while (true) {
      const frame = hwPixelFormat ? hwFrame : cpuFrame;
      const ret = await decoderContext.receiveFrameAsync(frame);

      if (ret === AV_ERROR_EOF) {
        break;
      }

      if (ret < 0) {
        // Error during flush, stop flushing
        break;
      }

      streamState.framesDecoded++;

      // Preserve frame timestamps for proper duration
      frame.pts = frame.bestEffortTimestamp || frame.pts;

      await encodeFrame(frame);
      frame.unref();
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

    if (hwPixelFormat && encoder.name?.includes('videotoolbox')) {
      console.log('Pipeline: Full hardware acceleration (zero-copy)');
    } else if (hwPixelFormat) {
      console.log('Pipeline: Hardware decode -> Software encode');
    } else if (encoder.name?.includes('videotoolbox')) {
      console.log('Pipeline: Software decode -> Hardware encode');
    } else {
      console.log('Pipeline: Full software processing');
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
    hwDevice?.[Symbol.dispose]();

    outputFormat?.closeInput();
    outputFormat?.[Symbol.dispose]();
    ioContext?.[Symbol.dispose]();

    inputFormat.closeInput();
  }
}

// Run the example
main().catch(console.error);
