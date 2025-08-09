#!/usr/bin/env node

/**
 * Filtering Example
 *
 * This example demonstrates how to:
 * - Decode video frames from a file
 * - Apply video filters using a filter graph
 * - Process filtered frames
 *
 * The example applies a "transpose=cclock" filter which rotates
 * the video 90 degrees clockwise.
 *
 * Usage:
 *   npm run filtering -- -i input.mp4
 */

import type { FilterContext, Stream } from '@seydx/ffmpeg';
import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_IO_FLAG_WRITE,
  AV_LOG_ERROR,
  AV_MEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FilterGraph,
  FormatContext,
  Frame,
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
    filter: {
      type: 'string',
      short: 'f',
      default: 'transpose=cclock', // Default filter: rotate 90 degrees clockwise
    },
  },
});

if (!values.input || !values.output) {
  console.error('Error: Input and output paths are required');
  console.log('Usage: npm run filtering -- -i <input.mp4> -o <output.mp4> [-f <filter_string>]');
  console.log('Default filter: transpose=cclock (rotate 90 degrees clockwise)');
  console.log('Other examples:');
  console.log('  -f "scale=640:480"           # Scale to 640x480');
  console.log('  -f "hflip"                    # Horizontal flip');
  console.log('  -f "vflip"                    # Vertical flip');
  console.log('  -f "negate"                   # Negate colors');
  console.log('  -f "edgedetect"               # Edge detection');
  console.log('  -f "scale=iw*2:ih*2"          # Double the size');
  console.log('  -f "crop=100:100:0:0"         # Crop 100x100 from top-left');
  process.exit(1);
}

// Stream state
interface StreamState {
  buffersinkContext?: FilterContext;
  buffersrcContext?: FilterContext;
  decCodec?: Codec;
  decCodecContext?: CodecContext;
  decFrame?: Frame;
  filterFrame?: Frame;
  filterGraph?: FilterGraph;
  inputStream?: any;
  encCodec?: Codec;
  encCodecContext?: CodecContext;
  encPacket?: Packet;
  outputStream?: Stream;
  frameCount: number;
  encodedFrames: number;
}

const disposables: { [Symbol.dispose]: () => void }[] = [];
let inputFormatContext: FormatContext;
let outputFormatContext: FormatContext;
let ioContext: IOContext | null = null;
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
    console.log(`Filter: ${values.filter}`);

    // Open input file
    await openInputFile();

    // Initialize filter
    await initFilter();

    // Open output file
    await openOutputFile();

    // Process all frames
    await processFrames();

    // Write trailer
    await outputFormatContext.writeTrailerAsync();

    console.log('\nFiltering completed successfully!');
    console.log(`Total frames processed: ${streamState?.frameCount ?? 0}`);
    console.log(`Total frames encoded: ${streamState?.encodedFrames ?? 0}`);
    console.log(`Output written to: ${values.output}`);
  } catch (error) {
    console.error('Error during filtering:', error);
    process.exit(1);
  } finally {
    // Clean up resources
    for (const disposable of disposables) {
      disposable[Symbol.dispose]();
    }

    // Remove log callback to allow process to exit
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

    // Initialize stream state
    streamState = {
      inputStream: stream,
      frameCount: 0,
      encodedFrames: 0,
    };

    // Find decoder
    const decoder = Codec.findDecoder(codecParams.codecId);
    if (!decoder) {
      throw new Error(`Decoder not found for codec ID ${codecParams.codecId}`);
    }
    streamState.decCodec = decoder;

    // Allocate codec context
    streamState.decCodecContext = new CodecContext(decoder);
    disposables.push(streamState.decCodecContext);

    // Copy parameters to codec context
    codecParams.toCodecContext(streamState.decCodecContext);

    // Open decoder
    await streamState.decCodecContext.openAsync();

    // Allocate frame for decoding
    streamState.decFrame = new Frame();
    disposables.push(streamState.decFrame);

    console.log(`Video stream found: ${streamState.decCodecContext.width}x${streamState.decCodecContext.height}`);
    console.log(`Pixel format: ${streamState.decCodecContext.pixelFormat}`);
    console.log(`Framerate: ${streamState.decCodecContext.framerate?.num}/${streamState.decCodecContext.framerate?.den}`);

    break; // Only process first video stream
  }

  if (!streamState) {
    throw new Error('No video stream found in input file');
  }
}

async function initFilter() {
  if (!streamState?.decCodecContext) {
    throw new Error('Stream not initialized');
  }

  console.log('Initializing filter graph...');

  // Allocate filter graph
  streamState.filterGraph = new FilterGraph();
  disposables.push(streamState.filterGraph);

  // Create buffer source parameters
  const buffersrcParams = {
    width: streamState.decCodecContext.width,
    height: streamState.decCodecContext.height,
    pixelFormat: streamState.decCodecContext.pixelFormat,
    timeBase: streamState.inputStream.timeBase,
    sampleAspectRatio: streamState.decCodecContext.sampleAspectRatio,
  };

  // Create buffer source and sink
  streamState.buffersrcContext = streamState.filterGraph.createBuffersrcFilter('in', buffersrcParams);
  streamState.buffersinkContext = streamState.filterGraph.createBuffersinkFilter('out', false);

  // Parse the filter graph with the user-specified filter
  streamState.filterGraph.parseWithInOut(
    values.filter,
    { name: 'in', filterContext: streamState.buffersrcContext, padIdx: 0 },
    { name: 'out', filterContext: streamState.buffersinkContext, padIdx: 0 },
  );

  // Configure the filter graph
  await streamState.filterGraph.configAsync();

  // Allocate frame for filtered output
  streamState.filterFrame = new Frame();
  disposables.push(streamState.filterFrame);

  console.log('Filter graph configured successfully');
}

async function openOutputFile() {
  if (!streamState?.decCodecContext || !streamState.buffersinkContext) {
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

  // Find encoder
  const encoder = Codec.findEncoder(streamState.decCodec!.id);
  if (!encoder) {
    throw new Error('Encoder not found');
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

  // Set encoder properties
  // For filters that change dimensions (e.g., transpose swaps width/height)
  // we need to handle this specially
  if (values.filter?.includes('transpose')) {
    // Transpose swaps width and height
    streamState.encCodecContext.width = streamState.decCodecContext.height;
    streamState.encCodecContext.height = streamState.decCodecContext.width;
  } else if (values.filter?.includes('scale=')) {
    // Parse scale dimensions from filter string
    const scaleMatch = /scale=(\d+|iw\*\d+|iw\/\d+):(\d+|ih\*\d+|ih\/\d+)/.exec(values.filter);
    if (scaleMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const parseScaleDim = (dim: string, original: number) => {
        if (dim.includes('iw')) {
          dim = dim.replace('iw', String(streamState!.decCodecContext!.width));
        }
        if (dim.includes('ih')) {
          dim = dim.replace('ih', String(streamState!.decCodecContext!.height));
        }
        return parseInt(dim, 10);
      };
      streamState.encCodecContext.width = parseScaleDim(scaleMatch[1], streamState.decCodecContext.width);
      streamState.encCodecContext.height = parseScaleDim(scaleMatch[2], streamState.decCodecContext.height);
    } else {
      streamState.encCodecContext.width = streamState.decCodecContext.width;
      streamState.encCodecContext.height = streamState.decCodecContext.height;
    }
  } else {
    // Default: use original dimensions
    streamState.encCodecContext.width = streamState.decCodecContext.width;
    streamState.encCodecContext.height = streamState.decCodecContext.height;
  }

  streamState.encCodecContext.pixelFormat = streamState.decCodecContext.pixelFormat;
  streamState.encCodecContext.timeBase = streamState.inputStream.timeBase;

  // Set encoder parameters
  streamState.encCodecContext.bitRate = 400000n; // 400 kbps
  streamState.encCodecContext.framerate = streamState.decCodecContext.framerate;
  streamState.encCodecContext.sampleAspectRatio = streamState.decCodecContext.sampleAspectRatio;

  // Some formats require global headers
  if (outputFormatContext.outputFormat && outputFormatContext.outputFormat.flags & 0x0040) {
    // AVFMT_GLOBALHEADER
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

  // Check if we need an IO context (for file output)
  if (outputFormatContext.outputFormat?.needsFile) {
    // Open IO context for writing
    ioContext = new IOContext();
    disposables.push(ioContext);
    await ioContext.openAsync(values.output!, AV_IO_FLAG_WRITE);
    outputFormatContext.pb = ioContext;
  }

  // Write header
  await outputFormatContext.writeHeaderAsync();

  // Allocate packet for encoding
  streamState.encPacket = new Packet();
  disposables.push(streamState.encPacket);

  console.log(`Output encoder: ${streamState.encCodecContext.width}x${streamState.encCodecContext.height}`);
  console.log(`Output format: ${outputFormatContext.outputFormat?.name ?? 'unknown'}`);
}

async function processFrames() {
  if (!streamState?.decCodecContext) {
    return;
  }

  console.log('\nProcessing frames...');

  using packet = new Packet();

  // Read and process all packets
  while (true) {
    // Read next packet
    const ret = await inputFormatContext.readFrameAsync(packet);
    if (ret < 0) {
      break; // End of file
    }

    // Skip non-video packets
    if (packet.streamIndex !== streamState.inputStream.index) {
      packet.unref();
      continue;
    }

    // Send packet to decoder
    await streamState.decCodecContext.sendPacketAsync(packet);
    packet.unref();

    // Receive and filter decoded frames
    while (true) {
      const recvRet = await streamState.decCodecContext.receiveFrameAsync(streamState.decFrame!);
      if (recvRet < 0) {
        break; // No more frames available
      }

      // Filter the frame
      await filterFrame(streamState.decFrame!);
      streamState.decFrame!.unref();
    }
  }

  // Flush decoder
  await streamState.decCodecContext.sendPacketAsync(null);
  while (true) {
    const recvRet = await streamState.decCodecContext.receiveFrameAsync(streamState.decFrame!);
    if (recvRet < 0) {
      break;
    }
    await filterFrame(streamState.decFrame!);
    streamState.decFrame!.unref();
  }

  // Flush filter
  await filterFrame(null);

  // Flush encoder
  await encodeFrame(null);
}

async function encodeFrame(frame: Frame | null) {
  if (!streamState?.encCodecContext || !streamState.encPacket) {
    return;
  }

  // Send frame to encoder (null signals flush)
  await streamState.encCodecContext.sendFrameAsync(frame);

  // Receive encoded packets
  while (true) {
    const ret = await streamState.encCodecContext.receivePacketAsync(streamState.encPacket);
    if (ret < 0) {
      break; // No more packets
    }

    // Set packet stream index
    streamState.encPacket.streamIndex = streamState.outputStream!.index;

    // Rescale timestamps from encoder timebase to stream timebase
    streamState.encPacket.rescaleTs(streamState.encCodecContext.timeBase, streamState.outputStream!.timeBase);

    // Write packet to output
    await outputFormatContext.writeInterleavedFrameAsync(streamState.encPacket);
    streamState.encodedFrames++;

    streamState.encPacket.unref();
  }
}

async function filterFrame(frame: Frame | null) {
  if (!streamState?.buffersrcContext || !streamState.buffersinkContext || !streamState.filterFrame) {
    return;
  }

  // Add frame to buffer source (null signals end of stream)
  await streamState.buffersrcContext.bufferSrcAddFrameAsync(frame);

  // Pull filtered frames from buffer sink
  while (true) {
    const ret = await streamState.buffersinkContext.bufferSinkGetFrameAsync(streamState.filterFrame);
    if (ret < 0) {
      // No more frames available (EAGAIN) or end of stream (EOF)
      break;
    }

    // Process the filtered frame
    streamState.frameCount++;

    // Log frame info periodically
    if (streamState.frameCount === 1 || streamState.frameCount % 30 === 0) {
      console.log(`Frame ${streamState.frameCount}: ${streamState.filterFrame.width}x${streamState.filterFrame.height}`, `pts=${streamState.filterFrame.pts}`);
    }

    // Encode the filtered frame
    await encodeFrame(streamState.filterFrame);

    streamState.filterFrame.unref();
  }
}

// Run the filtering
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
