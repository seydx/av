#!/usr/bin/env node

/**
 * Hardware Acceleration Example (VideoToolbox)
 *
 * This example demonstrates how to:
 * - Use VideoToolbox hardware encoder on macOS
 * - Encode video using GPU acceleration
 *
 * VideoToolbox is Apple's hardware acceleration framework for macOS/iOS.
 *
 * NOTE: This is a simplified example showing hardware encoding.
 * Full hardware decoding support requires additional bindings.
 *
 * Usage:
 *   npm run hardware-encoding -- -i input.mp4 -o output.mp4
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_IO_FLAG_WRITE,
  AV_LOG_ERROR,
  AV_MEDIA_TYPE_VIDEO,
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
    codec: {
      type: 'string',
      short: 'c',
      default: 'h264_videotoolbox', // Default to H.264 VideoToolbox encoder
    },
  },
});

if (!values.input || !values.output) {
  console.error('Error: Input and output paths are required');
  console.log('Usage: npm run hardware-encoding -- -i <input.mp4> -o <output.mp4> [-c <codec>]');
  console.log('Available codecs:');
  console.log('  h264_videotoolbox  - H.264 hardware encoder (default)');
  console.log('  hevc_videotoolbox  - H.265/HEVC hardware encoder');
  process.exit(1);
}

const disposables: { [Symbol.dispose]: () => void }[] = [];
let inputFormatContext: FormatContext;
let outputFormatContext: FormatContext;
let ioContext: IOContext | null = null;

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
    console.log(`Encoder codec: ${values.codec}`);

    // Open input file
    await openInputFile();

    // Open output file
    await openOutputFile();

    // Process frames
    await processFrames();

    // Write trailer
    await outputFormatContext.writeTrailerAsync();

    console.log('\nHardware encoding completed successfully!');
    console.log(`Frames decoded: ${streamState?.framesDecoded ?? 0}`);
    console.log(`Frames encoded: ${streamState?.framesEncoded ?? 0}`);
  } catch (error) {
    console.error('Error during hardware processing:', error);
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

    // Find decoder
    const decoder = Codec.findDecoder(codecParams.codecId);

    if (!decoder) {
      throw new Error(`Decoder not found for codec ID ${codecParams.codecId}`);
    }

    // Allocate codec context
    const decCodecContext = new CodecContext(decoder);
    disposables.push(decCodecContext);

    // Copy parameters to codec context
    codecParams.toCodecContext(decCodecContext);

    console.log(`Using decoder: ${decoder.name}`);

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
    console.log(`Input pixel format: ${decCodecContext.pixelFormat}`);
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

  // Find encoder - try hardware encoder, fall back to software
  let encoder = Codec.findEncoderByName(values.codec);
  if (!encoder) {
    // Try software encoder
    encoder = Codec.findEncoder(streamState.decCodec.id);
    if (!encoder) {
      throw new Error(`Encoder not found for codec: ${values.codec}`);
    }
    console.log(`Hardware encoder '${values.codec}' not found, using software encoder: ${encoder.name}`);
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

  // Configure hardware acceleration for VideoToolbox
  if (encoder.name?.includes('videotoolbox')) {
    try {
      // Create hardware device context
      const hwDeviceContext = new HardwareDeviceContext(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
      disposables.push(hwDeviceContext);

      // For VideoToolbox, we typically don't need to set up hardware frames context
      // for the encoder when doing software decode -> hardware encode.
      // The encoder will handle the upload internally.
      
      // Set hardware device context on encoder
      streamState.encCodecContext.hwDeviceContext = hwDeviceContext;
      
      // Use regular pixel format - VideoToolbox encoder accepts standard formats
      // and does the GPU upload internally
      streamState.encCodecContext.pixelFormat = streamState.decCodecContext.pixelFormat;

      console.log('Hardware acceleration enabled: VideoToolbox');
      console.log(`Hardware device type: ${HardwareDeviceContext.getTypeName(AV_HWDEVICE_TYPE_VIDEOTOOLBOX)}`);
    } catch (err) {
      console.warn('Failed to initialize hardware acceleration, falling back to software:', err);
      streamState.encCodecContext.pixelFormat = streamState.decCodecContext.pixelFormat;
    }
  } else {
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

  console.log(`Encoder: ${encoder.name}`);
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
      console.log(`Encoded ${streamState.framesEncoded} frames...`);
    }

    streamState.encPacket.unref();
  }
}

// Run the example
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
