#!/usr/bin/env tsx

/**
 * High-Level API Example: Pipeline API with Hardware-Accelerated RTSP
 *
 * Shows how to use the Pipeline API for RTSP streaming with hardware acceleration.
 * Demonstrates simplified stream processing with automatic flow control.
 *
 * Usage: tsx examples/api-pipeline-hw-rtsp.ts <rtsp-url> <output>
 *
 * Options:
 *   --duration <n>   Recording duration in seconds (default: 10)
 *   --scale <WxH>    Scale video to WxH (default: 640x360)
 *
 * Examples:
 *   tsx examples/api-pipeline-hw-rtsp.ts rtsp://camera.local/stream examples/.tmp/pipeline-rtsp.mp4
 *   tsx examples/api-pipeline-hw-rtsp.ts rtsp://admin:pass@192.168.1.100/ch1 output.mp4 --duration 30
 *   tsx examples/api-pipeline-hw-rtsp.ts rtsp://server/live output.mp4 --scale 1280x720
 */

import { Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput, pipeline } from '../src/api/index.js';
import { AV_PIX_FMT_YUV420P } from '../src/lib/index.js';

import type { PipelineControl } from '../src/api/pipeline.js';

// Parse command line arguments
const args = process.argv.slice(2);
const rtspUrl = args[0];
const outputFile = args[1];

if (!rtspUrl || !outputFile || rtspUrl.startsWith('--') || outputFile.startsWith('--')) {
  console.error('Usage: tsx examples/api-pipeline-hw-rtsp.ts <rtsp-url> <output> [options]');
  console.error('Options:');
  console.error('  --duration <n>   Recording duration in seconds (default: 10)');
  console.error('  --scale <WxH>    Scale video to WxH (default: 640x360)');
  process.exit(1);
}

// Parse options
const durationIndex = args.indexOf('--duration');
const duration = durationIndex !== -1 ? parseInt(args[durationIndex + 1]) : 10;

const scaleIndex = args.indexOf('--scale');
let scaleWidth = 640;
let scaleHeight = 360;
if (scaleIndex !== -1) {
  const [w, h] = args[scaleIndex + 1].split('x');
  scaleWidth = parseInt(w);
  scaleHeight = parseInt(h);
}

let pipelineControl: PipelineControl | undefined;

async function processRtsp() {
  try {
    console.log('High-Level API: Pipeline with Hardware-Accelerated RTSP');
    console.log('========================================================\n');
    console.log(`Input: ${rtspUrl}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Scale to: ${scaleWidth}x${scaleHeight}\n`);

    // Open RTSP stream
    console.log('Connecting to RTSP stream...');
    await using input = await MediaInput.open(rtspUrl, {
      options: {
        rtsp_transport: 'tcp',
        analyzeduration: '5000000',
        probesize: '5000000',
      },
    });
    console.log('Connected!\n');

    // Get streams
    const videoStream = input.video();
    if (!videoStream) {
      throw new Error('No video stream found in RTSP source');
    }

    const audioStream = input.audio();
    if (!audioStream) {
      console.warn('⚠️  No audio stream found, processing video only\n');
    }

    // Display input information
    console.log('Input Information:');
    console.log(`  Video: ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
    console.log(`  Codec: ${videoStream.codecpar.codecId}`);
    console.log(`  Time base: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
    console.log(`  Frame rate: ${videoStream.avgFrameRate.num}/${videoStream.avgFrameRate.den}`);
    if (audioStream) {
      console.log(`  Audio: ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);
    }
    console.log();

    // Auto-detect hardware
    console.log('Detecting hardware acceleration...');
    using hardware = await HardwareContext.auto();
    if (hardware) {
      console.log(`Using hardware: ${hardware.deviceTypeName}\n`);
    } else {
      console.log('No hardware acceleration available, using software\n');
    }

    // Create components
    console.log('Creating pipeline components...');

    using decoder = await Decoder.create(videoStream, {
      hardware,
    });
    console.log('  ✓ Decoder created');

    // Determine encoder and filter based on hardware
    let encoderName = 'libx265';
    let filterChain = `scale=${scaleWidth}:${scaleHeight},setpts=N/FRAME_RATE/TB`;

    if (hardware) {
      switch (hardware.deviceTypeName) {
        case 'videotoolbox':
          encoderName = 'hevc_videotoolbox';
          filterChain = `scale_vt=${scaleWidth}:${scaleHeight},setpts=N/FRAME_RATE/TB`;
          break;
        case 'vaapi':
          encoderName = 'hevc_vaapi';
          filterChain = `scale_vaapi=${scaleWidth}:${scaleHeight},setpts=N/FRAME_RATE/TB`;
          break;
        case 'cuda':
          encoderName = 'hevc_nvenc';
          filterChain = `scale_cuda=${scaleWidth}:${scaleHeight},setpts=N/FRAME_RATE/TB`;
          break;
        case 'qsv':
          encoderName = 'hevc_qsv';
          filterChain = `scale_qsv=${scaleWidth}:${scaleHeight},setpts=N/FRAME_RATE/TB`;
          break;
      }
    }

    using filter = await FilterAPI.create(filterChain, videoStream, {
      hardware,
    });
    console.log(`  ✓ Filter created: ${filterChain}`);

    using encoder = await Encoder.create(
      encoderName,
      {
        type: 'video',
        width: scaleWidth,
        height: scaleHeight,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: videoStream.timeBase,
        frameRate: videoStream.avgFrameRate,
        sampleAspectRatio: videoStream.sampleAspectRatio,
      },
      {
        hardware,
        bitrate: '2M',
        gopSize: 60,
      },
    );
    console.log(`  ✓ Encoder created: ${encoderName}\n`);

    // Create output
    console.log('Creating output file...');
    await using output = await MediaOutput.open(outputFile);

    // Setup pipeline based on available streams
    console.log('Setting up pipeline...\n');

    if (audioStream) {
      // Pipeline with audio passthrough
      console.log('Using named pipeline with audio passthrough');
      pipelineControl = pipeline(
        { video: input, audio: input },
        {
          video: [decoder, filter, encoder],
          audio: 'passthrough', // Direct stream copy for audio
        },
        output,
      );
    } else {
      // Video-only pipeline
      console.log('Using simple pipeline (video only)');
      pipelineControl = pipeline(input, decoder, filter, encoder, output);
    }

    console.log('Pipeline started, recording...\n');
    const startTime = Date.now();

    // Set up timeout for recording duration
    const timeout = setTimeout(() => {
      console.log(`\n⏱️  Recording duration reached (${duration}s), stopping...`);
      if (pipelineControl) {
        pipelineControl.stop();
      }
    }, duration * 1000);

    // Show progress
    const progressInterval = setInterval(() => {
      if (pipelineControl && !pipelineControl.isStopped()) {
        const elapsed = (Date.now() - startTime) / 1000;
        process.stdout.write(`\rRecording: ${elapsed.toFixed(1)}s / ${duration}s`);
      }
    }, 100);

    try {
      // Wait for pipeline to complete
      await pipelineControl.completion;
    } finally {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    }

    const elapsed = (Date.now() - startTime) / 1000;

    console.log('\n');
    console.log('✅ Recording complete!');
    console.log(`  Duration: ${elapsed.toFixed(2)} seconds`);
    console.log(`  Output file: ${outputFile}`);
    if (hardware) {
      console.log(`  Hardware used: ${hardware.deviceTypeName}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    await processRtsp();
  } catch {
    // Stop pipeline if error occurs
    if (pipelineControl) {
      pipelineControl.stop();
    }
    process.exit(1);
  }
}

main();
