/**
 * High-Level API Example: Muxing (Combining Video and Audio)
 *
 * Production-ready example that combines separate video and audio files into a single output.
 * Handles all edge cases robustly including timestamp issues and format incompatibilities.
 *
 * Usage: tsx examples/api-muxing.ts [options] <video-input> <audio-input> <output>
 *
 * Options:
 *   --copy    Force stream copy mode (no re-encoding)
 *
 * Examples:
 *   tsx examples/api-muxing.ts testdata/video.mp4 testdata/audio.aac examples/.tmp/api-muxed-1.mp4 (full stream copy - H.264 + AAC)
 *   tsx examples/api-muxing.ts testdata/video.mp4 testdata/audio.mp2 examples/.tmp/api-muxed-2.mp4 (video copy, audio transcode to AAC)
 *   tsx examples/api-muxing.ts testdata/video.mp4 testdata/audio.wav examples/.tmp/api-muxed-3.mp4 (video copy, audio transcode to AAC)
 *   tsx examples/api-muxing.ts testdata/video.m1v testdata/audio.mp2 examples/.tmp/api-muxed-4.mp4 (video transcode to H.264, audio transcode to AAC)
 *   tsx examples/api-muxing.ts testdata/video.m1v testdata/audio.mp2 examples/.tmp/api-muxed-5-force-copy.mp4 --copy (force copy - may not be playable)
 */

import {
  AV_CODEC_ID_AAC,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_MP3,
  AV_LOG_DEBUG,
  AV_SAMPLE_FMT_FLTP,
  Decoder,
  Encoder,
  FF_ENCODER_AAC,
  FF_ENCODER_LIBX264,
  FilterAPI,
  FilterPreset,
  Log,
  MediaInput,
  MediaOutput,
} from '../src/index.js';
import { prepareTestEnvironment } from './index.js';

// Parse command line arguments
const args = process.argv.slice(2);
const videoInputFile = args[0];
const audioInputFile = args[1];
const outputFile = args[2];
const forceCopy = args[3] === '--copy';

if (!videoInputFile || !audioInputFile || !outputFile) {
  console.error('Usage: tsx examples/api-muxing.ts [options] <video-input> <audio-input> <output>');
  console.error('');
  console.error('Options:');
  console.error('  --copy    Force stream copy mode (no re-encoding)');
  console.error('');
  console.error('Examples:');
  console.error('  # Full stream copy (H.264 + AAC):');
  console.error('  tsx examples/api-muxing.ts testdata/video.mp4 testdata/audio.aac examples/.tmp/muxed.mp4');
  console.error('');
  console.error('  # Video copy, audio transcode:');
  console.error('  tsx examples/api-muxing.ts testdata/video.mp4 testdata/audio.wav examples/.tmp/muxed.mp4');
  console.error('');
  console.error('  # Full transcode:');
  console.error('  tsx examples/api-muxing.ts testdata/video.m1v testdata/audio.mp2 examples/.tmp/muxed.mp4');
  console.error('');
  console.error('  # Force copy (may not be playable):');
  console.error('  tsx examples/api-muxing.ts testdata/video.m1v testdata/audio.mp2 examples/.tmp/muxed.mp4 --copy');
  process.exit(1);
}

prepareTestEnvironment();
Log.setLevel(AV_LOG_DEBUG);

console.log('Video: ' + videoInputFile);
console.log('Audio: ' + audioInputFile);
console.log('Output: ' + outputFile);
console.log('Mode: ' + (forceCopy ? 'Stream Copy' : 'Auto (Copy if compatible, otherwise transcode)'));

// Open separate inputs
await using videoInput = await MediaInput.open(videoInputFile);
await using audioInput = await MediaInput.open(audioInputFile);
await using output = await MediaOutput.open(outputFile);

// Get streams
const videoStream = videoInput.video();
if (!videoStream) {
  throw new Error('No video stream found in ' + videoInputFile);
}

const audioStream = audioInput.audio();
if (!audioStream) {
  throw new Error('No audio stream found in ' + audioInputFile);
}

console.log(`Video: ${videoStream.codecpar.codecId} ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
console.log(`Audio: ${audioStream.codecpar.codecId} ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);

// Determine if we can do stream copy or need transcoding
let canCopyVideo: boolean;
let canCopyAudio: boolean;

if (forceCopy) {
  // Force stream copy mode
  canCopyVideo = true;
  canCopyAudio = true;
} else {
  // Auto mode: check codec compatibility with MP4 container
  // MP4 supports H.264/H.265 for video
  canCopyVideo = videoStream.codecpar.codecId === AV_CODEC_ID_H264;
  // MP4 officially supports AAC and MP3, but MP2 is problematic
  // MP2 in MP4 might not play in many players, so we transcode it
  canCopyAudio = audioStream.codecpar.codecId === AV_CODEC_ID_AAC || audioStream.codecpar.codecId === AV_CODEC_ID_MP3;
}

console.log('Processing mode:');
console.log(`Video: ${canCopyVideo ? 'Stream Copy' : 'Transcode to H.264'}`);
console.log(`Audio: ${canCopyAudio ? 'Stream Copy' : 'Transcode to AAC'}`);
if (forceCopy && (!canCopyVideo || !canCopyAudio)) {
  console.log('Warning: Using stream copy with potentially incompatible codecs');
}

let videoIdx: number;
let audioIdx: number;
let videoDecoder: Decoder | null = null;
let audioDecoder: Decoder | null = null;
let videoEncoder: Encoder | null = null;
let audioEncoder: Encoder | null = null;
let audioFilter: FilterAPI | null = null;

// Setup video processing
if (canCopyVideo) {
  // Direct stream copy for video
  videoIdx = output.addStream(videoStream);
} else {
  // Need to transcode video
  videoDecoder = await Decoder.create(videoStream);

  // Create encoder with explicit video parameters
  // Use YUV420P for libx264 as it's the most compatible format
  videoEncoder = await Encoder.create(FF_ENCODER_LIBX264, {
    timeBase: videoStream.timeBase,
    frameRate: videoStream.avgFrameRate,
  });

  videoIdx = output.addStream(videoEncoder);
}

// Setup audio processing
if (canCopyAudio) {
  // Direct stream copy for audio
  audioIdx = output.addStream(audioStream);
} else {
  // Need to transcode audio
  audioDecoder = await Decoder.create(audioStream);

  // Create filter chain that converts to the format needed by AAC encoder
  const filterChain = FilterPreset.chain().aformat(AV_SAMPLE_FMT_FLTP, 48000, 'stereo').asetnsamples(1024).build();
  audioFilter = FilterAPI.create(filterChain, {
    timeBase: audioStream.timeBase,
  });

  // AAC encoder
  audioEncoder = await Encoder.create(FF_ENCODER_AAC, {
    timeBase: audioStream.timeBase,
    bitrate: '192k',
  });

  audioIdx = output.addStream(audioEncoder);
}

console.log('Processing...');
const startTime = Date.now();

let videoPackets = 0;
let audioPackets = 0;

// Process video
const processVideo = async () => {
  if (canCopyVideo) {
    // Stream copy
    for await (using packet of videoInput.packets(videoStream.index)) {
      await output.writePacket(packet, videoIdx);
      videoPackets++;
    }
  } else {
    // Transcode without filter - direct decode->encode
    let frameCount = 0;
    for await (using packet of videoInput.packets(videoStream.index)) {
      using frame = await videoDecoder!.decode(packet);
      if (frame) {
        // Fix timestamps - set PTS based on frame count
        frame.pts = BigInt(frameCount);

        using encoded = await videoEncoder!.encode(frame);
        if (encoded) {
          await output.writePacket(encoded, videoIdx);
          videoPackets++;
        }
        frameCount++;
      }
    }

    // Flush decoder
    for await (using frame of videoDecoder!.flushFrames()) {
      frame.pts = BigInt(frameCount);
      using encoded = await videoEncoder!.encode(frame);
      if (encoded) {
        await output.writePacket(encoded, videoIdx);
        videoPackets++;
      }
      frameCount++;
    }

    // Flush encoder
    for await (using packet of videoEncoder!.flushPackets()) {
      await output.writePacket(packet, videoIdx);
      videoPackets++;
    }
  }
};

// Process audio
const processAudio = async () => {
  if (canCopyAudio) {
    // Stream copy
    for await (using packet of audioInput.packets(audioStream.index)) {
      await output.writePacket(packet, audioIdx);
      audioPackets++;
    }
  } else {
    for await (using packet of audioInput.packets(audioStream.index)) {
      using frame = await audioDecoder!.decode(packet);
      if (frame) {
        using filteredFrame = await audioFilter!.process(frame);
        if (filteredFrame) {
          using encoded = await audioEncoder!.encode(filteredFrame);
          if (encoded) {
            await output.writePacket(encoded, audioIdx);
            audioPackets++;
          }
        }
      }
    }

    // Flush decoder
    for await (using frame of audioDecoder!.flushFrames()) {
      using filteredFrame = await audioFilter!.process(frame);
      if (filteredFrame) {
        using encoded = await audioEncoder!.encode(filteredFrame);
        if (encoded) {
          await output.writePacket(encoded, audioIdx);
          audioPackets++;
        }
      }
    }

    // Flush filter
    for await (using filteredFrame of audioFilter!.flushFrames()) {
      using encoded = await audioEncoder!.encode(filteredFrame);
      if (encoded) {
        await output.writePacket(encoded, audioIdx);
        audioPackets++;
      }
    }

    // Flush encoder
    for await (using packet of audioEncoder!.flushPackets()) {
      await output.writePacket(packet, audioIdx);
      audioPackets++;
    }
  }
};

// Process both streams in parallel
await Promise.all([processVideo(), processAudio()]);

// Cleanup
videoDecoder?.close();
audioDecoder?.close();
videoEncoder?.close();
audioEncoder?.close();
audioFilter?.close();

const elapsed = (Date.now() - startTime) / 1000;
console.log('Done!');
console.log(`Video packets: ${videoPackets}`);
console.log(`Audio packets: ${audioPackets}`);
console.log(`Time: ${elapsed.toFixed(2)}s`);
console.log(`Output: ${outputFile}`);
