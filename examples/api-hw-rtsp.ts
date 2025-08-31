/**
 * High-Level API Example: Hardware-Accelerated RTSP Streaming
 *
 * Shows how to capture and transcode RTSP streams with hardware acceleration.
 * Demonstrates real-time video processing with automatic hardware detection.
 *
 * Usage: tsx examples/api-hw-rtsp.ts <rtsp-url> <output>
 *
 * Options:
 *   --duration <n>   Recording duration in seconds (default: 10)
 *   --scale <WxH>    Scale video to WxH (default: 640x360)
 *
 * Examples:
 *   tsx examples/api-hw-rtsp.ts rtsp://camera.local/stream examples/.tmp/rtsp-output.mp4
 *   tsx examples/api-hw-rtsp.ts rtsp://admin:pass@192.168.1.100/ch1 output.mp4 --duration 30
 *   tsx examples/api-hw-rtsp.ts rtsp://server/live output.mp4 --scale 1280x720
 */

import { AV_PIX_FMT_YUV420P, Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput } from '../src/index.js';

// Parse command line arguments
const args = process.argv.slice(2);
const rtspUrl = args[0];
const outputFile = args[1];

if (!rtspUrl || !outputFile || rtspUrl.startsWith('--') || outputFile.startsWith('--')) {
  console.error('Usage: tsx examples/api-hw-rtsp.ts <rtsp-url> <output> [options]');
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

let stop = false;

async function processRtsp() {
  try {
    console.log('High-Level API: Hardware-Accelerated RTSP Streaming');
    console.log('====================================================\n');
    console.log(`Input: ${rtspUrl}`);
    console.log(`Output: ${outputFile}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Scale to: ${scaleWidth}x${scaleHeight}\n`);

    // Open RTSP stream
    console.log('Connecting to RTSP stream...');
    await using input = await MediaInput.open(rtspUrl, {
      options: {
        rtsp_transport: 'tcp', // Use TCP for more reliable streaming
        analyzeduration: '5000000', // 5 seconds analyze duration
        probesize: '5000000', // 5MB probe size
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
    console.log(`  Format: ${videoStream.codecpar.format}`);
    console.log(`  Time base: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
    console.log(`  Frame rate: ${videoStream.avgFrameRate.num}/${videoStream.avgFrameRate.den}`);
    if (audioStream) {
      console.log(`  Audio: ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);
      console.log(`  Audio codec: ${audioStream.codecpar.codecId}`);
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

    // Create decoder
    console.log('Creating video decoder...');
    using decoder = await Decoder.create(videoStream, {
      hardware,
    });
    console.log('Video decoder created\n');

    // Determine encoder based on hardware
    let encoderName = 'libx265'; // Default software encoder
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

    // Create filter
    console.log(`Creating filter: ${filterChain}`);
    using filter = await FilterAPI.create(filterChain, videoStream, {
      hardware,
    });
    console.log('Filter created\n');

    // Create encoder
    console.log(`Creating encoder: ${encoderName}...`);
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
    console.log('Encoder created\n');

    // Create output
    console.log('Creating output file...');
    await using output = await MediaOutput.open(outputFile);

    // Add video stream
    const videoOutputIndex = output.addStream(encoder);

    // Add audio stream if available (direct copy)
    let audioOutputIndex = -1;
    if (audioStream) {
      audioOutputIndex = output.addStream(audioStream);
      console.log('Audio stream will be copied directly');
    }

    await output.writeHeader();
    console.log('Output file ready\n');

    // Set up timeout for recording duration
    const timeout = setTimeout(() => {
      console.log(`\n⏱️  Recording duration reached (${duration}s), stopping...`);
      stop = true;
    }, duration * 1000);

    // Process streams
    console.log('Recording started...');
    const startTime = Date.now();
    let videoPackets = 0;
    let audioPackets = 0;

    try {
      // Create video processing pipeline
      const videoInputGenerator = input.packets(videoStream.index);
      const videoDecoderGenerator = decoder.frames(videoInputGenerator);
      const videoFilterGenerator = filter.frames(videoDecoderGenerator);
      const videoEncoderGenerator = encoder.packets(videoFilterGenerator);

      // Process video and audio in parallel
      const processVideo = async () => {
        for await (const packet of videoEncoderGenerator) {
          if (stop) break;
          await output.writePacket(packet, videoOutputIndex);
          videoPackets++;

          // Progress indicator
          if (videoPackets % 30 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            process.stdout.write(`\rRecording: ${elapsed.toFixed(1)}s - Video: ${videoPackets} packets`);
          }
        }
      };

      const processAudio = async () => {
        if (audioOutputIndex === -1) return;

        for await (const packet of input.packets(audioStream!.index)) {
          if (stop) break;
          await output.writePacket(packet, audioOutputIndex);
          audioPackets++;
        }
      };

      // Run both in parallel
      await Promise.all([processVideo(), processAudio()]);
    } finally {
      clearTimeout(timeout);
    }

    await output.writeTrailer();

    const elapsed = (Date.now() - startTime) / 1000;

    console.log('\n');
    console.log('✅ Recording complete!');
    console.log(`  Duration: ${elapsed.toFixed(2)} seconds`);
    console.log(`  Video packets: ${videoPackets}`);
    if (audioPackets > 0) {
      console.log(`  Audio packets: ${audioPackets}`);
    }
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
    process.exit(1);
  }
}

main();
