/**
 * Video Decoding and Filtering Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/decode_filter_video.c
 * This example demonstrates how to decode video from an input file,
 * process it through a filter graph, and display it as ASCII art.
 *
 * The filter chain used is: "scale=78:24,transpose=cclock"
 * This scales the video to 78x24 and rotates it counter-clockwise.
 *
 * Usage: tsx examples/decode-filter-video.ts <input_file>
 * Example: tsx examples/decode-filter-video.ts testdata/video.mp4
 */

import {
  AVERROR_EAGAIN,
  AVERROR_EOF,
  AVMEDIA_TYPE_VIDEO,
  AV_LOG_ERROR,
  AV_LOG_INFO,
  AV_NOPTS_VALUE,
  AV_TIME_BASE,
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
  avRescaleQ,
  avUsleep,
} from '../src/index.js';

import type { FilterContext, Rational } from '../src/index.js';

// Filter description - scale to 78x24, rotate counter-clockwise, and convert to gray8
const FILTER_DESCR = 'scale=78:24,transpose=cclock,format=gray8';

// Global context objects
let formatCtx: FormatContext | null = null;
let codecCtx: CodecContext | null = null;
let buffersrcCtx: FilterContext | null = null;
let buffersinkCtx: FilterContext | null = null;
let filterGraph: FilterGraph | null = null;
let videoStreamIndex = -1;
let lastPts = AV_NOPTS_VALUE;

/**
 * Open the input file and find the video stream
 */
async function openInputFile(filename: string): Promise<void> {
  // Open input file
  formatCtx = new FormatContext();
  let ret = await formatCtx.openInput(filename, null, null);
  FFmpegError.throwIfError(ret, `Cannot open input file: ${filename}`);

  // Find stream information
  ret = await formatCtx.findStreamInfo(null);
  FFmpegError.throwIfError(ret, `Cannot find stream information: ${filename}`);

  // Find the best video stream
  const result = formatCtx.findBestStream(AVMEDIA_TYPE_VIDEO, -1, -1);
  FFmpegError.throwIfError(result, 'Cannot find a video stream in the input file');

  videoStreamIndex = result;

  // Get the stream and find decoder
  const stream = formatCtx.streams![videoStreamIndex];
  if (!stream?.codecpar) {
    throw new Error('Video stream or codec parameters not found');
  }

  const codecId = stream.codecpar.codecId;
  const decoder = Codec.findDecoder(codecId);
  if (!decoder) {
    throw new Error('No decoder found for video stream');
  }

  // Create decoding context
  codecCtx = new CodecContext();
  codecCtx.allocContext3(decoder);

  // Copy codec parameters from stream
  ret = codecCtx.parametersToContext(stream.codecpar);
  FFmpegError.throwIfError(ret, 'Cannot copy codec parameters');

  // Open the decoder
  ret = await codecCtx.open2(decoder, null);
  FFmpegError.throwIfError(ret, 'Cannot open video decoder');
}

/**
 * Initialize the filter graph
 *
 * This demonstrates the alternative workflow using allocFilter + setOpt + init
 * instead of createFilter with args. This gives more flexibility for setting
 * options programmatically before initialization.
 */
async function initFilters(filtersDescr: string): Promise<void> {
  // Get filter definitions
  const buffersrc = Filter.getByName('buffer');
  const buffersink = Filter.getByName('buffersink');

  if (!buffersrc || !buffersink) {
    throw new Error('Could not find buffer source/sink filters');
  }

  // Allocate filter graph
  filterGraph = new FilterGraph();
  filterGraph.alloc();

  // Get stream time base
  const stream = formatCtx!.streams![videoStreamIndex];
  if (!stream) {
    throw new Error('Video stream not found');
  }
  const timeBase = stream.timeBase;

  // === Alternative workflow: allocFilter + setOpt + init ===

  // Allocate buffer source without initializing
  buffersrcCtx = filterGraph.allocFilter(buffersrc, 'in');
  if (!buffersrcCtx) {
    throw new Error('Cannot allocate buffer source');
  }

  // Set buffer source options individually
  buffersrcCtx.setOption('video_size', `${codecCtx!.width}x${codecCtx!.height}`);
  buffersrcCtx.setOption('pix_fmt', codecCtx!.pixelFormat.toString());
  buffersrcCtx.setOption('time_base', `${timeBase.num}/${timeBase.den}`);
  buffersrcCtx.setOption('pixel_aspect', `${codecCtx!.sampleAspectRatio.num}/${codecCtx!.sampleAspectRatio.den}`);

  // Initialize the buffer source with the set options
  let ret = buffersrcCtx.init();
  FFmpegError.throwIfError(ret, 'Cannot initialize buffer source');

  // Allocate buffer sink without initializing
  buffersinkCtx = filterGraph.allocFilter(buffersink, 'out');
  if (!buffersinkCtx) {
    throw new Error('Cannot allocate buffer sink');
  }

  // Set pixel format option for buffer sink (to ensure gray8 output)
  // Note: This demonstrates that we can set options before init
  // The format filter in the chain will still do the conversion

  // Initialize the buffer sink
  ret = buffersinkCtx.init();
  FFmpegError.throwIfError(ret, 'Cannot initialize buffer sink');

  // Set the endpoints for the filter graph
  // The buffer source output must be connected to the input pad of
  // the first filter described by filters_descr
  const outputs = new FilterInOut();
  outputs.alloc();
  outputs.name = 'in';
  outputs.filterCtx = buffersrcCtx;
  outputs.padIdx = 0;
  outputs.next = null;

  // The buffer sink input must be connected to the output pad of
  // the last filter described by filters_descr
  const inputs = new FilterInOut();
  inputs.alloc();
  inputs.name = 'out';
  inputs.filterCtx = buffersinkCtx;
  inputs.padIdx = 0;
  inputs.next = null;

  // Parse the filter graph
  let configRet = filterGraph.parsePtr(filtersDescr, inputs, outputs);
  FFmpegError.throwIfError(configRet, 'Cannot parse filter graph');

  // Configure the graph
  configRet = await filterGraph.config();
  FFmpegError.throwIfError(configRet, 'Cannot configure filter graph');

  // Log output format info
  Log.log(AV_LOG_INFO, `Filter graph configured: ${filtersDescr}`);
}

/**
 * Display frame as ASCII art
 */
function displayFrame(frame: Frame, timeBase: Rational): void {
  // Handle frame timing
  if (frame.pts !== AV_NOPTS_VALUE) {
    if (lastPts !== AV_NOPTS_VALUE) {
      // Sleep roughly the right amount of time
      const delay = avRescaleQ(frame.pts - lastPts, timeBase, { num: 1, den: AV_TIME_BASE });
      if (delay > 0n && delay < 1000000n) {
        // Sleep for the delay in microseconds
        avUsleep(Number(delay));
      }
    }
    lastPts = frame.pts;
  }

  // Clear screen with ANSI escape codes
  // Move cursor to home position (1,1) and clear screen
  process.stdout.write('\x1B[1;1H\x1B[2J');

  // Trivial ASCII grayscale display
  const data = frame.data?.[0];
  if (!data) return;

  const grayChars = ' .-+#';
  let output = '';

  for (let y = 0; y < frame.height; y++) {
    const rowOffset = y * frame.linesize[0];
    for (let x = 0; x < frame.width; x++) {
      const pixel = data[rowOffset + x];
      const charIndex = Math.floor(pixel / 52);
      output += grayChars[Math.min(charIndex, grayChars.length - 1)];
    }
    output += '\n';
  }

  process.stdout.write(output);
}

/**
 * Main decoding and filtering function
 */
async function decodeFilterVideo(inputFile: string): Promise<void> {
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
          if (codecCtx && videoStreamIndex >= 0) {
            await codecCtx.sendPacket(null);

            // Receive remaining frames
            while (true) {
              const decRet = await codecCtx.receiveFrame(frame);
              if (decRet < 0) break;

              frame.pts = frame.pts !== AV_NOPTS_VALUE ? frame.pts : BigInt(0);

              // Push to filter graph
              if ((await buffersrcCtx!.buffersrcAddFrame(frame)) >= 0) {
                // Pull filtered frames
                while (true) {
                  const filtRet = await buffersinkCtx!.buffersinkGetFrame(filtFrame);
                  if (filtRet < 0) break;

                  const stream = formatCtx!.streams![videoStreamIndex];
                  displayFrame(filtFrame, stream.timeBase);
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

              const stream = formatCtx!.streams![videoStreamIndex];
              displayFrame(filtFrame, stream.timeBase);
              filtFrame.unref();
            }
          }
          break;
        }
        throw new Error(`Error reading frame: ${new FFmpegError(ret).message}`);
      }

      // Process video packets
      if (packet.streamIndex === videoStreamIndex) {
        // Send packet to decoder
        const sendRet = await codecCtx!.sendPacket(packet);
        if (sendRet < 0 && sendRet !== AVERROR_EAGAIN) {
          Log.log(AV_LOG_ERROR, `Error sending packet to decoder: ${new FFmpegError(sendRet).message}`);
          packet.unref();
          continue;
        }

        // Receive frames from decoder
        while (true) {
          const recvRet = await codecCtx!.receiveFrame(frame);
          if (recvRet === AVERROR_EAGAIN || recvRet === AVERROR_EOF) {
            break;
          } else if (recvRet < 0) {
            throw new Error(`Error receiving frame from decoder: ${new FFmpegError(recvRet).message}`);
          }

          frame.pts = frame.bestEffortTimestamp;

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

            const stream = formatCtx!.streams![videoStreamIndex];
            displayFrame(filtFrame, stream.timeBase);
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

    console.log('\nVideo playback completed');
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

  if (args.length !== 1) {
    console.log('usage: tsx examples/decode-filter-video.ts <input_file>');
    console.log('');
    console.log('Decodes video from input file, filters it through:');
    console.log(`  ${FILTER_DESCR}`);
    console.log('and displays it as ASCII art.');
    console.log('');
    console.log('Example:');
    console.log('  tsx examples/decode-filter-video.ts input.mp4');
    process.exit(1);
  }

  const inputFile = args[0];

  // Set log level
  Log.setLevel(AV_LOG_ERROR);

  try {
    await decodeFilterVideo(inputFile);
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
