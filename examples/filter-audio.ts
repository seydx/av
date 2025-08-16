#!/usr/bin/env tsx

/**
 * Audio Filtering Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/filter_audio.c
 * This example generates a sine wave audio, passes it through a simple filter
 * chain, and then computes the MD5 checksum of the output data.
 *
 * The filter chain it uses is:
 * (input) -> abuffer -> volume -> aformat -> abuffersink -> (output)
 *
 * abuffer: This provides the endpoint where you can feed the decoded samples.
 * volume: In this example we hardcode it to 0.90.
 * aformat: This converts the samples to the samplefreq, channel layout,
 *          and sample format required by the audio device.
 * abuffersink: This provides the endpoint where you can read the samples after
 *              they have passed through the filter chain.
 *
 * Usage: tsx examples/filter-audio.ts <duration>
 * Example: tsx examples/filter-audio.ts 1.0
 */

import crypto from 'node:crypto';
import {
  AV_CHANNEL_ORDER_NATIVE,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  FFmpegError,
  Filter,
  FilterGraph,
  Frame,
  avGetBytesPerSample,
  avGetSampleFmtName,
  avSampleFmtIsPlanar,
} from '../src/lib/index.js';

import type { AVSampleFormat, ChannelLayout, FilterContext } from '../src/lib/index.js';

// Configuration
const INPUT_SAMPLERATE = 48000;
const INPUT_FORMAT = AV_SAMPLE_FMT_FLTP;
const INPUT_CHANNEL_LAYOUT: ChannelLayout = {
  order: AV_CHANNEL_ORDER_NATIVE,
  nbChannels: 2,
  mask: BigInt(0x3), // Stereo (FL+FR)
};

const VOLUME_VAL = 0.9;
const FRAME_SIZE = 1024;

/**
 * Initialize the filter graph
 */
function initFilterGraph(): {
  graph: FilterGraph;
  src: FilterContext;
  sink: FilterContext;
} {
  // Create a new filtergraph
  const filterGraph = new FilterGraph();
  filterGraph.alloc();

  // Create the abuffer filter (input)
  const abuffer = Filter.getByName('abuffer');
  if (!abuffer) {
    throw new Error('Could not find the abuffer filter');
  }

  // For abuffer, we need to provide the channel layout, sample format, sample rate, and time base
  const channelLayoutStr = 'stereo'; // Stereo
  const sampleFmtName = avGetSampleFmtName(INPUT_FORMAT);

  // abuffer filter requires parameters at creation time
  const abufferArgs = `time_base=1/${INPUT_SAMPLERATE}:sample_rate=${INPUT_SAMPLERATE}:sample_fmt=${sampleFmtName}:channel_layout=${channelLayoutStr}`;

  const abufferCtx = filterGraph.createFilter(abuffer, 'src', abufferArgs);
  if (!abufferCtx) {
    throw new Error('Could not allocate the abuffer instance');
  }

  // Create volume filter
  const volume = Filter.getByName('volume');
  if (!volume) {
    throw new Error('Could not find the volume filter');
  }

  // Volume filter can be initialized with arguments at creation time
  const volumeArgs = `volume=${VOLUME_VAL}`;
  const volumeCtx = filterGraph.createFilter(volume, 'volume', volumeArgs);
  if (!volumeCtx) {
    throw new Error('Could not allocate the volume instance');
  }

  // Create the aformat filter
  const aformat = Filter.getByName('aformat');
  if (!aformat) {
    throw new Error('Could not find the aformat filter');
  }

  // Initialize aformat filter with arguments at creation time
  const aformatOptions = `sample_fmts=${avGetSampleFmtName(AV_SAMPLE_FMT_S16)}:sample_rates=44100:channel_layouts=stereo`;
  const aformatCtx = filterGraph.createFilter(aformat, 'aformat', aformatOptions);
  if (!aformatCtx) {
    throw new Error('Could not allocate the aformat instance');
  }

  // Create the abuffersink filter (output)
  const abuffersink = Filter.getByName('abuffersink');
  if (!abuffersink) {
    throw new Error('Could not find the abuffersink filter');
  }

  // abuffersink takes no options
  const abuffersinkCtx = filterGraph.createFilter(abuffersink, 'sink');
  if (!abuffersinkCtx) {
    throw new Error('Could not allocate the abuffersink instance');
  }

  // Connect the filters
  let linkRet = abufferCtx.link(0, volumeCtx, 0);
  if (linkRet >= 0) {
    linkRet = volumeCtx.link(0, aformatCtx, 0);
  }
  if (linkRet >= 0) {
    linkRet = aformatCtx.link(0, abuffersinkCtx, 0);
  }
  FFmpegError.throwIfError(linkRet, 'Error connecting filters');

  // Configure the graph
  const configRet = filterGraph.config();
  FFmpegError.throwIfError(configRet, `Error configuring the filter graph: ${new FFmpegError(configRet).message}`);

  return {
    graph: filterGraph,
    src: abufferCtx,
    sink: abuffersinkCtx,
  };
}

/**
 * Process output - compute MD5 checksum
 */
function processOutput(frame: Frame): void {
  const planar = avSampleFmtIsPlanar(frame.format as AVSampleFormat);
  const channels = frame.channelLayout.nbChannels;
  const planes = planar ? channels : 1;
  const bps = avGetBytesPerSample(frame.format as AVSampleFormat);
  const planeSize = bps * frame.nbSamples * (planar ? 1 : channels);

  for (let i = 0; i < planes; i++) {
    const data = frame.extendedData?.[i];
    if (!data) continue;

    // Create MD5 hash of the plane data
    const hash = crypto.createHash('md5');
    const planeData = Buffer.from(data.buffer, data.byteOffset, planeSize);
    hash.update(planeData);
    const checksum = hash.digest('hex');

    console.log(`plane ${i}: 0x${checksum.toUpperCase()}`);
  }
  console.log();
}

/**
 * Generate input frame - synthesize a sine wave
 */
function getInput(frame: Frame, frameNum: number): void {
  // Set up the frame properties
  frame.sampleRate = INPUT_SAMPLERATE;
  frame.format = INPUT_FORMAT;
  frame.channelLayout = INPUT_CHANNEL_LAYOUT;
  frame.nbSamples = FRAME_SIZE;
  frame.pts = BigInt(frameNum * FRAME_SIZE);

  // Allocate the buffer for the data
  const ret = frame.allocBuffer();
  if (ret < 0) {
    throw new Error(`Error allocating frame buffer: ${new FFmpegError(ret).message}`);
  }

  // Fill the data for each channel
  for (let i = 0; i < INPUT_CHANNEL_LAYOUT.nbChannels; i++) {
    const data = frame.extendedData?.[i];
    if (!data) continue;

    const floatArray = new Float32Array(data.buffer, data.byteOffset, frame.nbSamples);
    for (let j = 0; j < frame.nbSamples; j++) {
      floatArray[j] = Math.sin((2 * Math.PI * (frameNum + j) * (i + 1)) / FRAME_SIZE);
    }
  }
}

/**
 * Main filtering function
 */
async function filterAudio(duration: number): Promise<void> {
  const nbFrames = Math.floor((duration * INPUT_SAMPLERATE) / FRAME_SIZE);
  if (nbFrames <= 0) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  // Allocate the frame
  const frame = new Frame();
  frame.alloc();

  let graph: FilterGraph | null = null;
  let src: FilterContext | null = null;
  let sink: FilterContext | null = null;

  try {
    // Set up the filtergraph
    const filterSetup = initFilterGraph();
    graph = filterSetup.graph;
    src = filterSetup.src;
    sink = filterSetup.sink;

    // The main filtering loop
    for (let i = 0; i < nbFrames; i++) {
      // Get an input frame to be filtered
      getInput(frame, i);

      // Send the frame to the input of the filtergraph
      let ret = src.buffersrcAddFrame(frame);
      if (ret < 0) {
        throw new Error(`Error feeding frame to filter: ${new FFmpegError(ret).message}`);
      }

      // Get all the filtered output that is available
      const filterFrame = new Frame();
      filterFrame.alloc();

      while (true) {
        ret = sink.buffersinkGetFrame(filterFrame);
        if (ret < 0) {
          // No more frames available for now
          if (ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
            throw new Error(`Error getting filtered frame: ${new FFmpegError(ret).message}`);
          }
          break;
        }

        processOutput(filterFrame);
        filterFrame.unref();
      }

      filterFrame.free();

      frame.unref();
    }

    console.log('Filtering completed successfully');
  } catch (error) {
    console.error('Error during filtering:', error);
    throw error;
  } finally {
    // Cleanup
    frame.free();
    graph?.free();
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('usage: tsx examples/filter-audio.ts <duration>');
    console.log('');
    console.log('API example program that demonstrates audio filtering.');
    console.log('This program generates a sine wave, filters it through a');
    console.log('volume and format conversion chain, and outputs MD5 checksums.');
    console.log('');
    console.log('Example:');
    console.log('  tsx examples/filter-audio.ts 1.0');
    process.exit(1);
  }

  const duration = parseFloat(args[0]);
  if (isNaN(duration) || duration <= 0) {
    console.error(`Invalid duration: ${args[0]}`);
    process.exit(1);
  }

  try {
    await filterAudio(duration);
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
