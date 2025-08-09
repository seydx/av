/**
 * Audio Resampling Example
 *
 * This example demonstrates how to:
 * 1. Decode audio from a media file
 * 2. Resample audio to different sample rate, channels, and format
 * 3. Use AudioFifo for buffering resampled audio
 * 4. Handle format conversion between different audio layouts
 *
 * Audio resampling is essential for:
 * - Converting between different sample rates (e.g., 48kHz to 44.1kHz)
 * - Changing channel layouts (e.g., 5.1 to stereo)
 * - Converting sample formats (e.g., int16 to float32)
 *
 * The pipeline:
 * Input -> Decoder -> Resampler -> AudioFifo -> Processing
 *
 * Key concepts:
 * - SoftwareResampleContext: Handles audio format conversion
 * - AudioFifo: Circular buffer for audio samples
 * - Sample formats: Different audio data representations
 * - Channel layouts: Mono, stereo, 5.1, etc.
 */

import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_AUDIO,
  AV_SAMPLE_FMT_FLTP,
  AudioFifo,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  Packet,
  SoftwareResampleContext,
} from '@seydx/ffmpeg';

import { config, ffmpegLog } from '../index.js';

import type { Stream } from '@seydx/ffmpeg';

// Target audio parameters for resampling
const TARGET_SAMPLE_RATE = 44100; // CD quality
const TARGET_CHANNELS = 2; // Stereo
const TARGET_SAMPLE_FORMAT = AV_SAMPLE_FMT_FLTP; // Float planar
const TARGET_CHANNEL_LAYOUT = { nbChannels: 2, order: 1, mask: 3n }; // Stereo layout

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('resample-audio', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Use 'using' for automatic resource cleanup
  using formatContext = new FormatContext();
  using packet = new Packet();
  using decodedFrame = new Frame();
  using resampledFrame = new Frame();

  // Manual resource management
  let codecContext: CodecContext | null = null;
  let resampleContext: SoftwareResampleContext | null = null;
  let audioFifo: AudioFifo | null = null;

  try {
    const inputFile = config.inputFile;

    console.log(`Input: ${inputFile}`);
    console.log('');

    // Step 1: Open input file and find audio stream
    console.log('Opening input file...');
    await formatContext.openInputAsync(inputFile);
    await formatContext.findStreamInfoAsync();

    console.log(`Format: ${formatContext.inputFormat?.name ?? 'unknown'}`);
    console.log(`Duration: ${formatContext.duration / 1000000n}s`);

    // Find first audio stream
    let audioStream: Stream | null = null;
    for (const stream of formatContext.streams) {
      if (stream.codecParameters?.codecType === AV_MEDIA_TYPE_AUDIO) {
        audioStream = stream;
        break;
      }
    }

    if (!audioStream?.codecParameters) {
      throw new Error('No audio stream found in input file');
    }

    // Step 2: Setup decoder
    console.log('\nSetting up audio decoder...');
    const decoder = Codec.findDecoder(audioStream.codecParameters.codecId);
    if (!decoder) {
      throw new Error('Audio decoder not found');
    }

    codecContext = new CodecContext(decoder);
    audioStream.codecParameters.toCodecContext(codecContext);
    await codecContext.openAsync();

    console.log(`  Decoder: ${decoder.name}`);
    console.log(`  Sample rate: ${codecContext.sampleRate} Hz`);
    console.log(`  Channels: ${codecContext.channels}`);
    console.log(`  Sample format: ${codecContext.sampleFormat}`);
    console.log(`  Channel layout: ${codecContext.channelLayout.mask}`);

    // Step 3: Check if resampling is needed
    const needsResampling =
      codecContext.sampleRate !== TARGET_SAMPLE_RATE || codecContext.channels !== TARGET_CHANNELS || codecContext.sampleFormat !== TARGET_SAMPLE_FORMAT;

    if (needsResampling) {
      console.log('\nResampling configuration:');
      console.log(`  Target sample rate: ${TARGET_SAMPLE_RATE} Hz`);
      console.log(`  Target channels: ${TARGET_CHANNELS}`);
      console.log(`  Target sample format: ${TARGET_SAMPLE_FORMAT}`);

      // Create resample context
      resampleContext = new SoftwareResampleContext(
        codecContext.channelLayout,
        codecContext.sampleRate,
        codecContext.sampleFormat,
        TARGET_CHANNEL_LAYOUT,
        TARGET_SAMPLE_RATE,
        TARGET_SAMPLE_FORMAT,
      );

      // Create audio FIFO for buffering resampled audio
      // FIFO helps manage different frame sizes between input and output
      audioFifo = new AudioFifo(TARGET_SAMPLE_FORMAT, TARGET_CHANNELS, 1);

      // Setup resampled frame properties
      resampledFrame.format = TARGET_SAMPLE_FORMAT;
      resampledFrame.sampleRate = TARGET_SAMPLE_RATE;
      resampledFrame.channelLayout = TARGET_CHANNEL_LAYOUT;
      resampledFrame.nbSamples = 1024; // Standard buffer size
      resampledFrame.allocBuffer(0);

      console.log('  Resampler initialized');
    } else {
      console.log('\nNo resampling needed - audio already in target format');
    }

    // Step 4: Process audio frames
    console.log('\nProcessing audio frames...\n');

    let processedFrames = 0;
    let totalSamples = 0n;
    let resampledSamples = 0n;
    const maxFramesToProcess = config.verbose ? 100 : 10; // Process more frames in verbose mode

    // Main decoding loop
    while (processedFrames < maxFramesToProcess) {
      // Read next packet
      const ret = await formatContext.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        console.log('End of file reached');
        break;
      }

      // Skip non-audio packets
      if (packet.streamIndex !== audioStream.index) {
        packet.unref();
        continue;
      }

      // Send packet to decoder
      try {
        await codecContext.sendPacketAsync(packet);
      } catch (error) {
        if (error instanceof FFmpegError && error.code !== AV_ERROR_EAGAIN) {
          throw error;
        }
      }
      packet.unref();

      // Receive decoded frames
      while (true) {
        try {
          const ret = await codecContext.receiveFrameAsync(decodedFrame);
          if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
            break;
          }

          processedFrames++;
          totalSamples += BigInt(decodedFrame.nbSamples);

          // Log frame info periodically
          if (processedFrames === 1 || processedFrames % 10 === 0) {
            console.log(`Frame ${processedFrames}:`);
            console.log(`  Samples: ${decodedFrame.nbSamples}`);
            console.log(`  PTS: ${decodedFrame.pts}`);
          }

          // Resample if needed
          if (resampleContext && audioFifo) {
            // Convert the frame to target format
            resampleContext.convertFrame(decodedFrame, resampledFrame);
            const convertedSamples = resampledFrame.nbSamples;

            if (convertedSamples > 0) {
              resampledSamples += BigInt(convertedSamples);

              // Write resampled audio to FIFO
              audioFifo.write(resampledFrame);

              if (processedFrames === 1 || processedFrames % 10 === 0) {
                console.log(`  Resampled: ${convertedSamples} samples`);
                console.log(`  FIFO size: ${audioFifo.size} samples`);
              }

              // In a real application, you would:
              // 1. Read from FIFO when you have enough samples
              // 2. Process the audio (effects, filters, etc.)
              // 3. Encode to output format
              // 4. Write to output file
            }
          }

          decodedFrame.unref();

          if (processedFrames >= maxFramesToProcess) {
            break;
          }
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

    // Step 5: Flush resampler to get remaining samples
    if (resampleContext) {
      console.log('\nFlushing resampler...');

      // Get remaining samples from resampler's internal buffer
      const delay = resampleContext.getDelay(BigInt(TARGET_SAMPLE_RATE));
      if (delay > 0n) {
        console.log(`  Resampler buffer: ${delay} samples remaining`);

        // Flush by passing null input
        // In a real app, you'd process these remaining samples
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Frames processed: ${processedFrames}`);
    console.log(`Total samples decoded: ${totalSamples}`);

    if (needsResampling) {
      console.log(`Total samples resampled: ${resampledSamples}`);
      const ratio = Number(resampledSamples) / Number(totalSamples);
      console.log(`Resample ratio: ${ratio.toFixed(3)}`);

      if (audioFifo) {
        console.log(`Final FIFO size: ${audioFifo.size} samples`);
      }
    }

    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    codecContext?.close();
    codecContext?.[Symbol.dispose]();
    resampleContext?.[Symbol.dispose]();
    audioFifo?.[Symbol.dispose]();

    formatContext.closeInput();
  }
}

// Run the example
main().catch(console.error);
