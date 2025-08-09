#!/usr/bin/env node

/**
 * Audio Resampling Example
 *
 * This example demonstrates how to:
 * - Decode audio from a file
 * - Resample audio to different sample rate and format
 * - Use AudioFifo for buffering audio samples
 *
 * Usage:
 *   npm run resampling-audio -- -i input.mp4
 */

import {
  AV_LOG_ERROR,
  AV_MEDIA_TYPE_AUDIO,
  AV_SAMPLE_FMT_FLTP,
  AudioFifo,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  Packet,
  SoftwareResampleContext,
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
  },
});

if (!values.input) {
  console.error('Error: Input path is required');
  console.log('Usage: npm run resampling-audio -- -i <input.mp4>');
  process.exit(1);
}

// Target audio parameters
const TARGET_SAMPLE_RATE = 44100; // CD quality
const TARGET_CHANNELS = 2; // Stereo
const TARGET_SAMPLE_FORMAT = AV_SAMPLE_FMT_FLTP; // Float planar

async function main() {
  // Set up logging
  setLogLevel(AV_LOG_ERROR);
  setLogCallback((level, msg) => {
    console.log(`[FFmpeg ${level}] ${msg}`);
  });

  console.log(`Opening input file: ${values.input}`);

  // Open input file
  using formatContext = new FormatContext();
  await formatContext.openInputAsync(values.input!);
  await formatContext.findStreamInfoAsync();

  // Find first audio stream
  const streams = formatContext.streams;
  let audioStreamIndex = -1;
  let audioStream = null;

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    const codecParams = stream?.codecParameters;
    if (codecParams && codecParams.codecType === AV_MEDIA_TYPE_AUDIO) {
      // AVMEDIA_TYPE_AUDIO = 1
      audioStreamIndex = i;
      audioStream = stream;
      break;
    }
  }

  if (!audioStream?.codecParameters) {
    throw new Error('No audio stream found in input file');
  }

  // Find decoder
  const codecParams = audioStream.codecParameters;
  const decoder = Codec.findDecoder(codecParams.codecId);
  if (!decoder) {
    throw new Error('Decoder not found');
  }

  // Create codec context and copy parameters
  using codecContext = new CodecContext(decoder);
  codecParams.toCodecContext(codecContext);
  await codecContext.openAsync();

  console.log('Audio stream info:');
  console.log(`  Sample rate: ${codecContext.sampleRate} Hz`);
  console.log(`  Channels: ${codecContext.channels}`);
  console.log(`  Sample format: ${codecContext.sampleFormat}`);

  // Create resampler if needed
  const needsResampling =
    codecContext.sampleRate !== TARGET_SAMPLE_RATE || codecContext.channels !== TARGET_CHANNELS || codecContext.sampleFormat !== TARGET_SAMPLE_FORMAT;

  let resampleContext: SoftwareResampleContext | null = null;
  let audioFifo: AudioFifo | null = null;

  if (needsResampling) {
    console.log('\nResampling to:');
    console.log(`  Sample rate: ${TARGET_SAMPLE_RATE} Hz`);
    console.log(`  Channels: ${TARGET_CHANNELS}`);
    console.log(`  Sample format: ${TARGET_SAMPLE_FORMAT}`);

    // Create resample context
    resampleContext = new SoftwareResampleContext(
      codecContext.channelLayout,
      codecContext.sampleRate,
      codecContext.sampleFormat,
      { nbChannels: TARGET_CHANNELS, order: 1, mask: 3n }, // Stereo layout
      TARGET_SAMPLE_RATE,
      TARGET_SAMPLE_FORMAT,
    );

    // Create audio FIFO for buffering
    audioFifo = new AudioFifo(TARGET_SAMPLE_FORMAT, TARGET_CHANNELS, 1);
  }

  // Decode and resample audio
  using packet = new Packet();
  using decodedFrame = new Frame();
  using resampledFrame = new Frame();

  // Setup resampled frame properties and allocate buffer
  if (resampleContext) {
    resampledFrame.format = TARGET_SAMPLE_FORMAT;
    resampledFrame.sampleRate = TARGET_SAMPLE_RATE;
    resampledFrame.channelLayout = { nbChannels: TARGET_CHANNELS, order: 1, mask: 3n };
    resampledFrame.nbSamples = 1024; // Use a reasonable buffer size
    resampledFrame.allocBuffer(0);
  }

  let processedFrames = 0;
  const maxFramesToProcess = 10; // Process first 10 frames for demo

  console.log('\nProcessing audio frames...\n');

  while (processedFrames < maxFramesToProcess) {
    // Read packet
    const ret = await formatContext.readFrameAsync(packet);
    if (ret < 0) {
      console.log('End of file reached');
      break;
    }

    // Skip non-audio packets
    if (packet.streamIndex !== audioStreamIndex) {
      packet.unref();
      continue;
    }

    // Send packet to decoder
    await codecContext.sendPacketAsync(packet);
    packet.unref();

    // Receive decoded frames
    while (true) {
      const recvRet = await codecContext.receiveFrameAsync(decodedFrame);
      if (recvRet < 0) {
        break; // No more frames
      }

      processedFrames++;
      console.log(`Frame ${processedFrames}:`);
      console.log(`  Samples: ${decodedFrame.nbSamples}`);
      console.log(`  PTS: ${decodedFrame.pts}`);

      if (resampleContext && audioFifo) {
        // Resample the frame
        resampleContext.convertFrame(decodedFrame, resampledFrame);

        // Check if samples were converted
        const convertedSamples = resampledFrame.nbSamples;
        if (convertedSamples > 0) {
          console.log(`  Resampled to ${convertedSamples} samples`);

          // Write to FIFO (for demonstration - in real app you'd process this)
          audioFifo.write(resampledFrame);
          console.log(`  FIFO size: ${audioFifo.size} samples`);
        }
      }

      // Clear frame for next iteration
      decodedFrame.unref();

      if (processedFrames >= maxFramesToProcess) {
        break;
      }
    }
  }

  console.log(`\nProcessed ${processedFrames} audio frames`);

  if (needsResampling) {
    // Get any remaining samples from resampler
    if (resampleContext) {
      const delay = resampleContext.getDelay(BigInt(TARGET_SAMPLE_RATE));
      if (delay > 0n) {
        console.log(`\nResampler has ${delay} samples in buffer`);
      }
    }

    // Clean up resampling resources
    resampleContext?.[Symbol.dispose]();
    audioFifo?.[Symbol.dispose]();
  }

  console.log('\nDone!');

  // Remove log callback to allow process to exit
  setLogCallback(null);
}

// Run the example
main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
