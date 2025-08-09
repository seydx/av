#!/usr/bin/env node

/**
 * Full Hardware Transcoding Example (VideoToolbox)
 *
 * This example demonstrates complete hardware acceleration:
 * - Hardware-accelerated decoding
 * - Hardware-accelerated encoding
 * - Zero-copy pipeline (frames stay on GPU)
 *
 * VideoToolbox is Apple's hardware acceleration framework for macOS/iOS.
 *
 * Usage:
 *   npm run hardware-transcoding -- -i input.mp4 -o output.mp4
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_IO_FLAG_WRITE,
  AV_LOG_ERROR,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_VIDEOTOOLBOX,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  HardwareFramesContext,
  IOContext,
  OutputFormat,
  Packet,
  setLogCallback,
  setLogLevel,
} from '@seydx/ffmpeg';
import { parseArgs } from 'node:util';

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
    decoder: {
      type: 'string',
      short: 'd',
      default: 'h264_videotoolbox', // Hardware decoder
    },
    encoder: {
      type: 'string',
      short: 'e',
      default: 'h264_videotoolbox', // Hardware encoder
    },
  },
});

if (!values.input || !values.output) {
  console.error('Error: Input and output paths are required');
  console.log('Usage: npm run hardware-transcoding -- -i <input.mp4> -o <output.mp4> [-d <decoder>] [-e <encoder>]');
  console.log('Hardware decoders:');
  console.log('  h264_videotoolbox  - H.264 hardware decoder');
  console.log('  hevc_videotoolbox  - H.265/HEVC hardware decoder');
  console.log('Hardware encoders:');
  console.log('  h264_videotoolbox  - H.264 hardware encoder');
  console.log('  hevc_videotoolbox  - H.265/HEVC hardware encoder');
  process.exit(1);
}

const disposables: { [Symbol.dispose]: () => void }[] = [];
let inputFormatContext: FormatContext;
let outputFormatContext: FormatContext;
let ioContext: IOContext | null = null;
let hwDeviceContext: HardwareDeviceContext | null = null;

interface StreamState {
  inputStream: any;
  decCodec: Codec;
  decCodecContext: CodecContext;
  encCodec: Codec;
  encCodecContext: CodecContext;
  outputStream: any;
  decFrame: Frame;
  encPacket: Packet;
  framesDecoded: number;
  framesEncoded: number;
}

let streamState: StreamState | null = null;

async function main() {
  try {
    // Set up logging
    setLogLevel(AV_LOG_ERROR);
    setLogCallback((level, msg) => {
      console.log(`[FFmpeg ${level}] ${msg}`);
    });

    console.log(`Input file: ${values.input}`);
    console.log(`Output file: ${values.output}`);
    console.log(`Decoder: ${values.decoder}`);
    console.log(`Encoder: ${values.encoder}`);

    // Create hardware device context (shared between decoder and encoder)
    hwDeviceContext = new HardwareDeviceContext(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
    disposables.push(hwDeviceContext);
    console.log('Created VideoToolbox hardware device context');

    // Open input file
    await openInputFile();

    // Open output file
    await openOutputFile();

    // Process frames
    await processFrames();

    // Write trailer
    await outputFormatContext.writeTrailerAsync();

    console.log('\nHardware transcoding completed successfully!');
    console.log(`Frames decoded: ${streamState?.framesDecoded ?? 0}`);
    console.log(`Frames encoded: ${streamState?.framesEncoded ?? 0}`);
  } catch (error) {
    console.error('Error during hardware transcoding:', error);
    process.exit(1);
  } finally {
    // Clean up resources
    for (const disposable of disposables) {
      disposable[Symbol.dispose]();
    }

    // Remove log callback
    setLogCallback(null);
  }
}

async function openInputFile() {
  console.log('Opening input file...');

  // Allocate input format context
  inputFormatContext = new FormatContext();
  disposables.push(inputFormatContext);

  // Open input
  await inputFormatContext.openInputAsync(values.input!);
  await inputFormatContext.findStreamInfoAsync();

  // Find first video stream
  const streams = inputFormatContext.streams;
  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (!stream) continue;

    const codecParams = stream.codecParameters;
    if (!codecParams) continue;

    // Only process video streams
    if (codecParams.codecType !== AV_MEDIA_TYPE_VIDEO) {
      continue;
    }

    // Find hardware decoder
    let decoder = Codec.findDecoderByName(values.decoder);
    if (!decoder) {
      // Fall back to software decoder
      decoder = Codec.findDecoder(codecParams.codecId);
      if (!decoder) {
        throw new Error(`Decoder not found for codec ID ${codecParams.codecId}`);
      }
      console.log(`Hardware decoder '${values.decoder}' not found, using software decoder: ${decoder.name}`);
    } else {
      console.log(`Using hardware decoder: ${decoder.name}`);
    }

    // Allocate codec context
    const decCodecContext = new CodecContext(decoder);
    disposables.push(decCodecContext);

    // Copy parameters to codec context
    codecParams.toCodecContext(decCodecContext);

    // Set up hardware acceleration for decoder if using hardware codec
    if (decoder.name?.includes('videotoolbox')) {
      decCodecContext.hwDeviceContext = hwDeviceContext;

      // Create hardware frames context for decoder
      const hwFramesContext = new HardwareFramesContext(hwDeviceContext!);
      disposables.push(hwFramesContext);

      // Configure hardware frames for decoder
      hwFramesContext.width = decCodecContext.width;
      hwFramesContext.height = decCodecContext.height;
      hwFramesContext.hardwarePixelFormat = AV_PIX_FMT_VIDEOTOOLBOX;
      hwFramesContext.softwarePixelFormat = AV_PIX_FMT_NV12; // VideoToolbox prefers NV12
      hwFramesContext.initialPoolSize = 20;

      // Initialize hardware frames context
      hwFramesContext.initialize();

      // Set hardware frames context on decoder
      decCodecContext.hwFramesContext = hwFramesContext;

      console.log('Hardware acceleration configured for decoder');
    }

    // Open decoder
    await decCodecContext.openAsync();

    // Initialize stream state
    streamState = {
      inputStream: stream,
      decCodec: decoder,
      decCodecContext,
      encCodec: null!,
      encCodecContext: null!,
      outputStream: null,
      decFrame: new Frame(),
      encPacket: new Packet(),
      framesDecoded: 0,
      framesEncoded: 0,
    };

    disposables.push(streamState.decFrame);
    disposables.push(streamState.encPacket);

    console.log(`Video stream found: ${decCodecContext.width}x${decCodecContext.height}`);
    console.log(`Decoder pixel format: ${decCodecContext.pixelFormat}`);
    break;
  }

  if (!streamState) {
    throw new Error('No video stream found in input file');
  }
}

async function openOutputFile() {
  if (!streamState) {
    throw new Error('Stream not initialized');
  }

  console.log('Opening output file...');

  // Allocate output format context
  const outputFormat = OutputFormat.guess({ filename: values.output! });
  if (!outputFormat) {
    throw new Error('Could not guess output format');
  }

  outputFormatContext = new FormatContext('output', outputFormat, undefined, values.output);
  disposables.push(outputFormatContext);

  // Find hardware encoder
  let encoder = Codec.findEncoderByName(values.encoder);
  if (!encoder) {
    // Try software encoder
    encoder = Codec.findEncoder(streamState.decCodec.id);
    if (!encoder) {
      throw new Error(`Encoder not found: ${values.encoder}`);
    }
    console.log(`Hardware encoder '${values.encoder}' not found, using software encoder: ${encoder.name}`);
  } else {
    console.log(`Using hardware encoder: ${encoder.name}`);
  }
  streamState.encCodec = encoder;

  // Create output stream
  streamState.outputStream = outputFormatContext.newStream();
  if (!streamState.outputStream) {
    throw new Error('Failed to create output stream');
  }

  // Allocate encoder context
  streamState.encCodecContext = new CodecContext(encoder);
  disposables.push(streamState.encCodecContext);

  // Set encoder parameters
  streamState.encCodecContext.width = streamState.decCodecContext.width;
  streamState.encCodecContext.height = streamState.decCodecContext.height;
  streamState.encCodecContext.timeBase = streamState.inputStream.timeBase;
  streamState.encCodecContext.bitRate = 2000000n; // 2 Mbps
  streamState.encCodecContext.framerate = streamState.decCodecContext.framerate;
  streamState.encCodecContext.sampleAspectRatio = streamState.decCodecContext.sampleAspectRatio;

  // Configure hardware acceleration for encoder
  if (encoder.name?.includes('videotoolbox')) {
    // Set hardware device context on encoder
    streamState.encCodecContext.hwDeviceContext = hwDeviceContext;

    // Check if decoder is also hardware-accelerated
    if (streamState.decCodec.name?.includes('videotoolbox')) {
      // Full hardware pipeline - frames stay on GPU
      // Create hardware frames context for encoder (can share with decoder)
      const hwFramesContext = new HardwareFramesContext(hwDeviceContext!);
      disposables.push(hwFramesContext);

      // Configure hardware frames for encoder
      hwFramesContext.width = streamState.encCodecContext.width;
      hwFramesContext.height = streamState.encCodecContext.height;
      hwFramesContext.hardwarePixelFormat = AV_PIX_FMT_VIDEOTOOLBOX;
      hwFramesContext.softwarePixelFormat = AV_PIX_FMT_NV12;
      hwFramesContext.initialPoolSize = 20;

      // Initialize hardware frames context
      hwFramesContext.initialize();

      // Set hardware frames context on encoder
      streamState.encCodecContext.hwFramesContext = hwFramesContext;
      streamState.encCodecContext.pixelFormat = AV_PIX_FMT_VIDEOTOOLBOX;

      console.log('Full hardware pipeline configured (zero-copy)');
    } else {
      // Software decode -> hardware encode
      // Encoder will handle GPU upload internally
      streamState.encCodecContext.pixelFormat = AV_PIX_FMT_NV12; // VideoToolbox prefers NV12
      console.log('Hardware encoding with software decoding configured');
    }
  } else {
    // Software encoder
    streamState.encCodecContext.pixelFormat = streamState.decCodecContext.pixelFormat;
  }

  // Some formats require global headers
  if (outputFormatContext.outputFormat && outputFormatContext.outputFormat.flags & 0x0040) {
    streamState.encCodecContext.flags = AV_CODEC_FLAG_GLOBAL_HEADER;
  }

  // Open encoder
  await streamState.encCodecContext.openAsync();

  // Copy encoder parameters to output stream
  const outputCodecParams = streamState.outputStream.codecParameters;
  if (outputCodecParams) {
    outputCodecParams.fromCodecContext(streamState.encCodecContext);
  }

  // Set stream time base
  streamState.outputStream.timeBase = streamState.encCodecContext.timeBase;

  // Open output file
  if (outputFormatContext.outputFormat?.needsFile) {
    ioContext = new IOContext();
    disposables.push(ioContext);
    await ioContext.openAsync(values.output!, AV_IO_FLAG_WRITE);
    outputFormatContext.pb = ioContext;
  }

  // Write header
  await outputFormatContext.writeHeaderAsync();

  console.log(`Output format: ${outputFormatContext.outputFormat?.name ?? 'unknown'}`);
}

async function processFrames() {
  if (!streamState) {
    return;
  }

  console.log('\nProcessing frames...');

  using packet = new Packet();

  // Read and process all packets
  while (true) {
    // Read next packet
    const ret = await inputFormatContext.readFrameAsync(packet);
    if (ret === AV_ERROR_EOF) {
      break;
    }

    // Skip non-video packets
    if (packet.streamIndex !== streamState.inputStream.index) {
      packet.unref();
      continue;
    }

    // Send packet to decoder
    await streamState.decCodecContext.sendPacketAsync(packet);
    packet.unref();

    // Receive decoded frames
    while (true) {
      const recvRet = await streamState.decCodecContext.receiveFrameAsync(streamState.decFrame);
      if (recvRet < 0) {
        break;
      }

      streamState.framesDecoded++;

      // Encode frame
      await encodeFrame(streamState.decFrame);

      streamState.decFrame.unref();
    }
  }

  // Flush decoder
  await streamState.decCodecContext.sendPacketAsync(null);
  while (true) {
    const recvRet = await streamState.decCodecContext.receiveFrameAsync(streamState.decFrame);
    if (recvRet < 0) {
      break;
    }

    streamState.framesDecoded++;
    await encodeFrame(streamState.decFrame);
    streamState.decFrame.unref();
  }

  // Flush encoder
  await encodeFrame(null);
}

async function encodeFrame(frame: Frame | null) {
  if (!streamState) {
    return;
  }

  // Send frame to encoder
  await streamState.encCodecContext.sendFrameAsync(frame);

  // Receive encoded packets
  while (true) {
    const ret = await streamState.encCodecContext.receivePacketAsync(streamState.encPacket);
    if (ret < 0) {
      break;
    }

    // Set packet stream index
    streamState.encPacket.streamIndex = streamState.outputStream.index;

    // Rescale timestamps
    streamState.encPacket.rescaleTs(streamState.encCodecContext.timeBase, streamState.outputStream.timeBase);

    // Write packet
    await outputFormatContext.writeInterleavedFrameAsync(streamState.encPacket);
    streamState.framesEncoded++;

    // Log progress
    if (streamState.framesEncoded % 30 === 0) {
      console.log(`Transcoded ${streamState.framesEncoded} frames...`);
    }

    streamState.encPacket.unref();
  }
}

// Run the example
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
