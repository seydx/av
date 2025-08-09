#!/usr/bin/env node

/**
 * Transcoding Example
 *
 * This example demonstrates how to:
 * - Decode video and audio from input file
 * - Apply filters (format conversion, scaling, etc.)
 * - Re-encode to different codecs
 * - Write to output file
 *
 * Usage:
 *   npm run transcoding -- -i input.mp4 -o output.mp4
 */

import type { FilterContext, Stream } from '@seydx/ffmpeg';
import {
  AV_CODEC_ID_AAC,
  AV_CODEC_ID_H264,
  AV_FMT_GLOBALHEADER,
  AV_FMT_NOFILE,
  AV_IO_FLAG_WRITE,
  AV_LOG_ERROR,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PICTURE_TYPE_NONE,
  Codec,
  CodecContext,
  FilterGraph,
  FormatContext,
  Frame,
  IOContext,
  Packet,
  Rational,
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
  },
});

if (!values.input || !values.output) {
  console.error('Error: Input and output paths are required');
  console.log('Usage: npm run transcoding -- -i <input.mp4> -o <output.mp4>');
  process.exit(1);
}

// Stream information
interface StreamInfo {
  // Filter components
  buffersinkContext?: FilterContext;
  buffersrcContext?: FilterContext;
  filterGraph?: FilterGraph;
  filterFrame?: Frame;

  // Decoder components
  decCodec?: Codec;
  decCodecContext?: CodecContext;
  decFrame?: Frame;

  // Encoder components
  encCodec?: Codec;
  encCodecContext?: CodecContext;
  encPkt?: Packet;

  // Stream references
  inputStream: Stream;
  outputStream?: Stream;
}

// Global variables
let inputFormatContext: FormatContext;
let outputFormatContext: FormatContext;
const streams = new Map<number, StreamInfo>(); // Indexed by input stream index
const disposables: { [Symbol.dispose]: () => void }[] = [];

async function main() {
  try {
    // Set up logging
    setLogLevel(AV_LOG_ERROR);
    setLogCallback((level, msg) => {
      console.log(`[FFmpeg ${level}] ${msg}`);
    });

    console.log(`Transcoding from ${values.input} to ${values.output}`);

    // Open input file
    await openInputFile();

    // Open output file
    await openOutputFile();

    // Initialize filters
    await initFilters();

    // Allocate packet for reading
    using pkt = new Packet();

    // Main transcoding loop
    while (true) {
      // Read frame from input
      const ret = await inputFormatContext.readFrameAsync(pkt);
      if (ret < 0) {
        break; // End of file
      }

      // Get stream
      const stream = streams.get(pkt.streamIndex);
      if (!stream) {
        pkt.unref();
        continue; // Skip unknown streams
      }

      // Rescale packet timestamps
      pkt.rescaleTs(stream.inputStream.timeBase, stream.decCodecContext!.timeBase);

      // Send packet to decoder
      await stream.decCodecContext!.sendPacketAsync(pkt);
      pkt.unref();

      // Receive and process decoded frames
      while (true) {
        const recvRet = await stream.decCodecContext!.receiveFrameAsync(stream.decFrame!);
        if (recvRet < 0) {
          break; // No more frames available
        }

        // Filter, encode and write frame
        await filterEncodeWriteFrame(stream.decFrame!, stream);
        stream.decFrame!.unref();
      }
    }

    // Flush all streams
    for (const stream of streams.values()) {
      // Flush filter
      await filterEncodeWriteFrame(null, stream);

      // Flush encoder
      await encodeWriteFrame(null, stream);
    }

    // Write trailer
    await outputFormatContext.writeTrailerAsync();

    console.log('Transcoding completed successfully!');
  } catch (error) {
    console.error('Error during transcoding:', error);
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

  // Process each stream
  const inputStreams = inputFormatContext.streams;
  for (let i = 0; i < inputStreams.length; i++) {
    const inputStream = inputStreams[i];
    if (!inputStream) continue;

    const codecParams = inputStream.codecParameters;
    if (!codecParams) continue;

    // Only process audio and video streams
    const mediaType = codecParams.codecType;
    if (mediaType !== AV_MEDIA_TYPE_AUDIO && mediaType !== AV_MEDIA_TYPE_VIDEO) {
      continue;
    }

    // Create stream info
    const streamInfo: StreamInfo = {
      inputStream: inputStream,
    };

    // Find decoder
    const decoder = Codec.findDecoder(codecParams.codecId);
    if (!decoder) {
      throw new Error(`Decoder not found for codec ID ${codecParams.codecId}`);
    }
    streamInfo.decCodec = decoder;

    // Allocate codec context
    streamInfo.decCodecContext = new CodecContext(streamInfo.decCodec);
    disposables.push(streamInfo.decCodecContext);

    // Copy parameters to codec context
    codecParams.toCodecContext(streamInfo.decCodecContext);

    // Set framerate for video
    if (mediaType === AV_MEDIA_TYPE_VIDEO) {
      // TODO: Implement guessFrameRate
      // streamInfo.decCodecContext.framerate = inputFormatContext.guessFrameRate(inputStream, null);
    }

    // Open decoder
    await streamInfo.decCodecContext.openAsync();

    // Set time base
    streamInfo.decCodecContext.timeBase = inputStream.timeBase;

    // Allocate frame for decoding
    streamInfo.decFrame = new Frame();
    disposables.push(streamInfo.decFrame);

    // Store stream info
    streams.set(i, streamInfo);
  }

  console.log(`Found ${streams.size} streams to transcode`);
}

async function openOutputFile() {
  console.log('Opening output file...');

  // Allocate output format context
  outputFormatContext = new FormatContext('output', null, '', values.output);
  disposables.push(outputFormatContext);

  // Create output streams
  for (const streamInfo of streams.values()) {
    // Create new stream
    streamInfo.outputStream = outputFormatContext.newStream(null);
    if (!streamInfo.outputStream) {
      throw new Error('Failed to create output stream');
    }

    // Choose output codec
    const codecId = streamInfo.decCodecContext!.mediaType === AV_MEDIA_TYPE_VIDEO ? AV_CODEC_ID_H264 : AV_CODEC_ID_AAC;

    // Find encoder
    const encoder = Codec.findEncoder(codecId);
    if (!encoder) {
      throw new Error(`Encoder not found for codec ID ${codecId}`);
    }
    streamInfo.encCodec = encoder;

    // Allocate encoder context
    streamInfo.encCodecContext = new CodecContext(streamInfo.encCodec);
    disposables.push(streamInfo.encCodecContext);

    // Configure encoder based on media type
    if (streamInfo.decCodecContext!.mediaType === AV_MEDIA_TYPE_AUDIO) {
      // Audio encoder configuration
      const channelLayouts = streamInfo.encCodec.getChannelLayouts();
      if (channelLayouts && channelLayouts.length > 0) {
        streamInfo.encCodecContext.channelLayout = channelLayouts[0];
      } else {
        streamInfo.encCodecContext.channelLayout = streamInfo.decCodecContext!.channelLayout;
      }

      streamInfo.encCodecContext.sampleRate = streamInfo.decCodecContext!.sampleRate;

      const sampleFormats = streamInfo.encCodec.getSampleFormats();
      if (sampleFormats && sampleFormats.length > 0) {
        streamInfo.encCodecContext.sampleFormat = sampleFormats[0];
      } else {
        streamInfo.encCodecContext.sampleFormat = streamInfo.decCodecContext!.sampleFormat;
      }

      streamInfo.encCodecContext.timeBase = new Rational(1, streamInfo.encCodecContext.sampleRate);
    } else {
      // Video encoder configuration
      streamInfo.encCodecContext.height = streamInfo.decCodecContext!.height;

      const pixelFormats = streamInfo.encCodec.getPixelFormats();
      if (pixelFormats && pixelFormats.length > 0) {
        streamInfo.encCodecContext.pixelFormat = pixelFormats[0];
      } else {
        streamInfo.encCodecContext.pixelFormat = streamInfo.decCodecContext!.pixelFormat;
      }

      streamInfo.encCodecContext.sampleAspectRatio = streamInfo.decCodecContext!.sampleAspectRatio;
      streamInfo.encCodecContext.timeBase = streamInfo.decCodecContext!.timeBase;
      streamInfo.encCodecContext.width = streamInfo.decCodecContext!.width;
    }

    // Set global header flag if required
    if (outputFormatContext.outputFormat?.flags && outputFormatContext.outputFormat.flags & AV_FMT_GLOBALHEADER) {
      // TODO: Fix flags type
      // streamInfo.encCodecContext.flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
    }

    // Open encoder
    await streamInfo.encCodecContext.openAsync();

    // Copy encoder parameters to output stream
    if (streamInfo.outputStream.codecParameters) {
      streamInfo.outputStream.codecParameters.fromCodecContext(streamInfo.encCodecContext);
    }

    // Set output stream time base
    streamInfo.outputStream.timeBase = streamInfo.encCodecContext.timeBase;

    // Allocate encoding packet
    streamInfo.encPkt = new Packet();
    disposables.push(streamInfo.encPkt);
  }

  // Open output file if needed
  if (outputFormatContext.outputFormat?.flags && !(outputFormatContext.outputFormat.flags & AV_FMT_NOFILE)) {
    const ioContext = new IOContext();
    await ioContext.openAsync(values.output!, AV_IO_FLAG_WRITE);
    outputFormatContext.pb = ioContext;
    disposables.push(ioContext);
  }

  // Write header
  await outputFormatContext.writeHeaderAsync();
}

async function initFilters() {
  console.log('Initializing filters...');

  for (const streamInfo of streams.values()) {
    if (!streamInfo.decCodecContext || !streamInfo.encCodecContext) {
      continue;
    }

    // Allocate filter graph
    streamInfo.filterGraph = new FilterGraph();
    disposables.push(streamInfo.filterGraph);

    // Determine media type
    const isAudio = streamInfo.decCodecContext.mediaType === AV_MEDIA_TYPE_AUDIO;

    // Create buffer source parameters
    const buffersrcParams: any = {};
    let filterSpec = '';

    if (isAudio) {
      // Audio buffer source parameters
      buffersrcParams.sampleRate = streamInfo.decCodecContext.sampleRate;
      buffersrcParams.sampleFormat = streamInfo.decCodecContext.sampleFormat;
      buffersrcParams.channelLayout = streamInfo.decCodecContext.channelLayout;
      buffersrcParams.channelLayoutString = 'stereo'; // TODO: Get actual layout string

      // Create filter specification for audio format conversion
      const sampleFormatName = getSampleFormatName(streamInfo.encCodecContext.sampleFormat);
      filterSpec = `aformat=sample_fmts=${sampleFormatName}:channel_layouts=stereo`;
    } else {
      // Video buffer source parameters
      buffersrcParams.width = streamInfo.decCodecContext.width;
      buffersrcParams.height = streamInfo.decCodecContext.height;
      buffersrcParams.pixelFormat = streamInfo.decCodecContext.pixelFormat;
      buffersrcParams.timeBase = streamInfo.inputStream.timeBase;
      buffersrcParams.sampleAspectRatio = streamInfo.decCodecContext.sampleAspectRatio;

      // Create filter specification for video format conversion
      const pixelFormatName = getPixelFormatName(streamInfo.encCodecContext.pixelFormat);
      filterSpec = `format=pix_fmts=${pixelFormatName}`;
    }

    // Create buffer source and sink
    streamInfo.buffersrcContext = streamInfo.filterGraph.createBuffersrcFilter('in', buffersrcParams);
    streamInfo.buffersinkContext = streamInfo.filterGraph.createBuffersinkFilter('out', isAudio);

    // Parse the filter graph with connections
    streamInfo.filterGraph.parseWithInOut(
      filterSpec,
      { name: 'in', filterContext: streamInfo.buffersrcContext, padIdx: 0 },
      { name: 'out', filterContext: streamInfo.buffersinkContext, padIdx: 0 },
    );

    // Configure the filter graph
    await streamInfo.filterGraph.configAsync();

    // Allocate filter frame
    streamInfo.filterFrame = new Frame();
    disposables.push(streamInfo.filterFrame);
  }
}

// Helper functions to get format names (simplified versions)
function getSampleFormatName(format: number): string {
  // Map common sample formats
  const formats: Record<number, string> = {
    0: 'u8',
    1: 's16',
    2: 's32',
    3: 'flt',
    4: 'dbl',
    5: 'u8p',
    6: 's16p',
    7: 's32p',
    8: 'fltp',
    9: 'dblp',
  };
  return formats[format] || 'fltp';
}

function getPixelFormatName(format: number): string {
  // Map common pixel formats
  const formats: Record<number, string> = {
    0: 'yuv420p',
    1: 'yuyv422',
    2: 'rgb24',
    3: 'bgr24',
    4: 'yuv422p',
    5: 'yuv444p',
    12: 'yuv420p',
    26: 'bgra',
    28: 'rgba',
  };
  return formats[format] || 'yuv420p';
}

async function filterEncodeWriteFrame(frame: Frame | null, stream: StreamInfo) {
  if (!stream.buffersrcContext || !stream.buffersinkContext || !stream.filterFrame) {
    // No filters configured, pass frame directly to encoder
    if (frame) {
      await encodeWriteFrame(frame, stream);
    }
    return;
  }

  // Add frame to buffer source (null signals end of stream)
  await stream.buffersrcContext.bufferSrcAddFrameAsync(frame);

  // Pull filtered frames from buffer sink
  while (true) {
    const ret = await stream.buffersinkContext.bufferSinkGetFrameAsync(stream.filterFrame);
    if (ret < 0) {
      // No more frames available (EAGAIN) or end of stream (EOF)
      break;
    }

    // Reset picture type for encoder
    if (stream.decCodecContext?.mediaType === AV_MEDIA_TYPE_VIDEO) {
      stream.filterFrame.pictType = AV_PICTURE_TYPE_NONE; // AV_PICTURE_TYPE_NONE
    }

    // Encode and write the filtered frame
    await encodeWriteFrame(stream.filterFrame, stream);
    stream.filterFrame.unref();
  }
}

async function encodeWriteFrame(frame: Frame | null, stream: StreamInfo) {
  if (!stream.encCodecContext || !stream.encPkt || !stream.outputStream) {
    return;
  }

  // Send frame to encoder
  await stream.encCodecContext.sendFrameAsync(frame);

  // Receive encoded packets
  while (true) {
    const ret = await stream.encCodecContext.receivePacketAsync(stream.encPkt);
    if (ret < 0) {
      break; // No more packets
    }

    // Set packet stream index
    stream.encPkt.streamIndex = stream.outputStream.index;

    // Rescale timestamps
    stream.encPkt.rescaleTs(stream.encCodecContext.timeBase, stream.outputStream.timeBase);

    // Write packet
    await outputFormatContext.writeInterleavedFrameAsync(stream.encPkt);
    stream.encPkt.unref();
  }
}

// Run the transcoding
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
