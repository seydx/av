/**
 * Audio Decoding and Filtering Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/decode_filter_audio.c
 * This example demonstrates how to decode audio from an input file,
 * process it through a filter graph, and output raw audio data.
 *
 * The filter chain used is: "aresample=8000,aformat=sample_fmts=s16:channel_layouts=mono"
 * This resamples to 8000Hz and converts to mono s16le format.
 *
 * Usage: tsx examples/decode-filter-audio.ts <input_file> [output_file]
 * Example: tsx examples/decode-filter-audio.ts testdata/audio.mp2 examples/.tmp/decode_filter_audio.pcm
 *
 * To play the output: ffplay -f s16le -ar 8000 -ac 1 output.pcm
 */

import { createWriteStream } from 'node:fs';

import {
  AV_CHANNEL_ORDER_NATIVE,
  AV_CHANNEL_ORDER_UNSPEC,
  AV_LOG_ERROR,
  AV_LOG_INFO,
  AVERROR_EAGAIN,
  AVERROR_EOF,
  avGetSampleFmtName,
  AVMEDIA_TYPE_AUDIO,
  Codec,
  CodecContext,
  FFmpegError,
  Filter,
  FilterGraph,
  FilterInOut,
  FormatContext,
  Frame,
  Log,
  Packet,
} from '../src/index.js';

import type { FilterContext } from '../src/index.js';

// Filter description - resample to 8kHz mono s16le
const FILTER_DESCR = 'aresample=8000,aformat=sample_fmts=s16:channel_layouts=mono';

// Global context objects
let formatCtx: FormatContext | null = null;
let codecCtx: CodecContext | null = null;
let buffersrcCtx: FilterContext | null = null;
let buffersinkCtx: FilterContext | null = null;
let filterGraph: FilterGraph | null = null;
let audioStreamIndex = -1;

/**
 * Open the input file and find the audio stream
 */
async function openInputFile(filename: string): Promise<void> {
  // Open input file
  formatCtx = new FormatContext();
  let ret = await formatCtx.openInput(filename, null, null);
  FFmpegError.throwIfError(ret, `Cannot open input file: ${filename}`);

  // Find stream information
  ret = await formatCtx.findStreamInfo(null);
  FFmpegError.throwIfError(ret, `Cannot find stream information: ${filename}`);

  // Find the best audio stream
  const result = formatCtx.findBestStream(AVMEDIA_TYPE_AUDIO, -1, -1);
  FFmpegError.throwIfError(result, 'Cannot find best audio stream');

  audioStreamIndex = result;

  // Get the stream and find decoder
  const stream = formatCtx.streams![audioStreamIndex];
  if (!stream?.codecpar) {
    throw new Error('Audio stream or codec parameters not found');
  }

  const codecId = stream.codecpar.codecId;
  const decoder = Codec.findDecoder(codecId);
  if (!decoder) {
    throw new Error('No decoder found for audio stream');
  }

  // Create decoding context
  codecCtx = new CodecContext();
  codecCtx.allocContext3(decoder);

  // Copy codec parameters from stream
  ret = codecCtx.parametersToContext(stream.codecpar);
  FFmpegError.throwIfError(ret, `Cannot copy codec parameters: ${new FFmpegError(ret).message}`);

  // Open the decoder
  ret = await codecCtx.open2(decoder, null);
  FFmpegError.throwIfError(ret, `Cannot open audio decoder: ${new FFmpegError(ret).message}`);
}

/**
 * Initialize the filter graph
 */
async function initFilters(filtersDescr: string): Promise<void> {
  // Get filter definitions
  const abuffersrc = Filter.getByName('abuffer');
  const abuffersink = Filter.getByName('abuffersink');

  if (!abuffersrc || !abuffersink) {
    throw new Error('Could not find buffer source/sink filters');
  }

  // Allocate filter graph
  filterGraph = new FilterGraph();
  filterGraph.alloc();

  // Get stream time base
  const stream = formatCtx!.streams![audioStreamIndex];
  if (!stream) {
    throw new Error('Audio stream not found');
  }
  const timeBase = stream.timeBase;

  // Create buffer source
  // Prepare channel layout description
  let channelLayout = codecCtx!.channelLayout;
  if (channelLayout.order === AV_CHANNEL_ORDER_UNSPEC) {
    // Use default layout for the number of channels
    channelLayout = {
      order: AV_CHANNEL_ORDER_NATIVE,
      nbChannels: channelLayout.nbChannels,
      mask: BigInt((1 << channelLayout.nbChannels) - 1), // Default mask for stereo, mono, etc.
    };
  }

  // Format channel layout string
  let channelLayoutStr: string;
  if (channelLayout.nbChannels === 1) {
    channelLayoutStr = 'mono';
  } else if (channelLayout.nbChannels === 2) {
    channelLayoutStr = 'stereo';
  } else {
    channelLayoutStr = `${channelLayout.nbChannels}c`;
  }

  const sampleFmtName = avGetSampleFmtName(codecCtx!.sampleFormat);

  const args = `time_base=${timeBase.num}/${timeBase.den}:sample_rate=${codecCtx!.sampleRate}:sample_fmt=${sampleFmtName}:channel_layout=${channelLayoutStr}`;

  buffersrcCtx = filterGraph.createFilter(abuffersrc, 'in', args);
  if (!buffersrcCtx) {
    throw new Error('Cannot create audio buffer source');
  }

  // Create buffer sink with output format configuration
  buffersinkCtx = filterGraph.createFilter(abuffersink, 'out');
  if (!buffersinkCtx) {
    throw new Error('Cannot create audio buffer sink');
  }

  // Set the endpoints for the filter graph.
  // The naming is counterintuitive but follows FFmpeg convention:
  // - outputs: where the buffer source outputs to (connects to filter graph input)
  // - inputs: where the buffer sink gets input from (connects to filter graph output)

  // The buffer source output must be connected to the input pad of
  // the first filter described by filters_descr; since the first
  // filter input label is not specified, it is set to "in" by default.
  const outputs = new FilterInOut();
  outputs.alloc(); // Important: Allocate the structure
  outputs.name = 'in';
  outputs.filterCtx = buffersrcCtx;
  outputs.padIdx = 0;
  outputs.next = null;

  // The buffer sink input must be connected to the output pad of
  // the last filter described by filters_descr; since the last
  // filter output label is not specified, it is set to "out" by default.
  const inputs = new FilterInOut();
  inputs.alloc(); // Important: Allocate the structure
  inputs.name = 'out';
  inputs.filterCtx = buffersinkCtx;
  inputs.padIdx = 0;
  inputs.next = null;

  // Parse the filter graph - the filter string should NOT have [in]/[out] labels
  // as those are provided by the FilterInOut structures
  let ret = filterGraph.parsePtr(filtersDescr, inputs, outputs);
  FFmpegError.throwIfError(ret, `Cannot parse filter graph: ${new FFmpegError(ret).message}`);

  // Configure the graph
  ret = await filterGraph.config();
  FFmpegError.throwIfError(ret, `Cannot configure filter graph: ${new FFmpegError(ret).message}`);

  // FilterInOut structures are consumed by parsePtr, no need to free them

  // Log output format info
  Log.log(AV_LOG_INFO, `Filter graph configured: ${filtersDescr}`);
}

/**
 * Write frame data to output
 */
function printFrame(frame: Frame, outputStream: NodeJS.WritableStream): void {
  const nSamples = frame.nbSamples * frame.channelLayout.nbChannels;
  const data = frame.data?.[0];

  if (!data) {
    return;
  }

  // Write s16le data (2 bytes per sample)
  const buffer = Buffer.from(data.buffer, data.byteOffset, nSamples * 2);
  outputStream.write(buffer);
}

/**
 * Main decoding and filtering function
 */
async function decodeFilterAudio(inputFile: string, outputFile?: string): Promise<void> {
  // Create output stream
  const outputStream = outputFile ? createWriteStream(outputFile) : process.stdout;

  try {
    // Open input file
    await openInputFile(inputFile);

    // Initialize filters
    await initFilters(FILTER_DESCR);

    // Allocate frames and packet
    const packet = new Packet();
    packet.alloc();

    const frame = new Frame();
    frame.alloc();

    const filtFrame = new Frame();
    filtFrame.alloc();

    // Read all packets
    while (true) {
      const ret = await formatCtx!.readFrame(packet);
      if (ret < 0) {
        if (ret === AVERROR_EOF) {
          // Send null packet to flush decoder
          if (codecCtx && audioStreamIndex >= 0) {
            codecCtx.sendPacket(null);

            // Receive remaining frames
            while (true) {
              const decRet = await codecCtx.receiveFrame(frame);
              if (decRet < 0) break;

              // Push to filter graph
              if ((await buffersrcCtx!.buffersrcAddFrame(frame)) >= 0) {
                // Pull filtered frames
                while (true) {
                  const filtRet = await buffersinkCtx!.buffersinkGetFrame(filtFrame);
                  if (filtRet < 0) break;
                  printFrame(filtFrame, outputStream);
                  filtFrame.unref();
                }
              }
              frame.unref();
            }

            // Signal EOF to filter graph
            await buffersrcCtx!.buffersrcAddFrame(null);

            // Pull remaining filtered frames
            while (true) {
              const filtRet = await buffersinkCtx!.buffersinkGetFrame(filtFrame);
              if (filtRet < 0) break;
              printFrame(filtFrame, outputStream);
              filtFrame.unref();
            }
          }
          break;
        }
        throw new Error(`Error reading frame: ${new FFmpegError(ret).message}`);
      }

      // Process audio packets
      if (packet.streamIndex === audioStreamIndex) {
        // Send packet to decoder
        let ret = await codecCtx!.sendPacket(packet);
        if (ret < 0 && ret !== AVERROR_EAGAIN) {
          Log.log(AV_LOG_ERROR, `Error sending packet to decoder: ${new FFmpegError(ret).message}`);
          packet.unref();
          continue;
        }

        // Receive frames from decoder
        while (ret >= 0) {
          ret = await codecCtx!.receiveFrame(frame);
          if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
            break;
          } else if (ret < 0) {
            throw new Error(`Error receiving frame from decoder: ${new FFmpegError(ret).message}`);
          }

          // Push decoded frame to filter graph
          const srcRet = await buffersrcCtx!.buffersrcAddFrame(frame);
          if (srcRet < 0) {
            Log.log(AV_LOG_ERROR, `Error feeding filter graph: ${new FFmpegError(srcRet).message}`);
            break;
          }

          // Pull filtered frames
          while (true) {
            const sinkRet = await buffersinkCtx!.buffersinkGetFrame(filtFrame);
            if (sinkRet === AVERROR_EAGAIN || sinkRet === AVERROR_EOF) {
              break;
            }
            FFmpegError.throwIfError(sinkRet, `Error getting filtered frame: ${new FFmpegError(sinkRet).message}`);

            printFrame(filtFrame, outputStream);
            filtFrame.unref();
          }

          frame.unref();
        }
      }

      packet.unref();
    }

    // Cleanup
    packet.free();
    frame.free();
    filtFrame.free();

    if (outputFile) {
      outputStream.end();
      console.log(`Filtered audio written to: ${outputFile}`);
      console.log('To play: ffplay -f s16le -ar 8000 -ac 1 ' + outputFile);
    }
  } finally {
    // Clean up resources
    if (filterGraph) {
      filterGraph.free();
    }
    if (codecCtx) {
      codecCtx.freeContext();
    }
    if (formatCtx) {
      await formatCtx.closeInput();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.length > 2) {
    console.log('usage: tsx examples/decode-filter-audio.ts <input_file> [output_file]');
    console.log('');
    console.log('Decodes audio from input file, filters it through:');
    console.log(`  ${FILTER_DESCR}`);
    console.log('and outputs raw s16le mono 8kHz audio.');
    console.log('');
    console.log('Example:');
    console.log('  tsx examples/decode-filter-audio.ts input.mp3 output.pcm');
    console.log('  ffplay -f s16le -ar 8000 -ac 1 output.pcm');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  // Set log level
  Log.setLevel(AV_LOG_ERROR);

  try {
    await decodeFilterAudio(inputFile, outputFile);
    process.exit(0);
  } catch (error) {
    if (error instanceof FFmpegError) {
      console.error(`FFmpeg Error: ${error.message} (code: ${error.code})`);
    } else {
      console.error('Fatal error:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
