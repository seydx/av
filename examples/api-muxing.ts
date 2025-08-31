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
  AV_CHANNEL_LAYOUT_MONO,
  AV_CHANNEL_LAYOUT_STEREO,
  AV_CODEC_ID_AAC,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_MP3,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16P,
  Decoder,
  Encoder,
  FilterAPI,
  MediaInput,
  MediaOutput,
} from '../src/index.js';

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

async function main() {
  console.log('High-Level API: Muxing Example');
  console.log('===============================\n');
  console.log('  Video: ' + videoInputFile);
  console.log('  Audio: ' + audioInputFile);
  console.log('  Output: ' + outputFile);
  console.log('  Mode: ' + (forceCopy ? 'Stream Copy' : 'Auto (Copy if compatible, otherwise transcode)'));
  console.log('');

  // Open separate inputs
  const videoInput = await MediaInput.open(videoInputFile);
  const audioInput = await MediaInput.open(audioInputFile);
  const output = await MediaOutput.open(outputFile);

  // Get streams
  const videoStream = videoInput.video();
  const audioStream = audioInput.audio();

  if (!videoStream) {
    throw new Error('No video stream found in ' + videoInputFile);
  }
  if (!audioStream) {
    throw new Error('No audio stream found in ' + audioInputFile);
  }

  console.log('📊 Input Information:');
  console.log(`  Video: ${videoStream.codecpar.codecId} ${videoStream.codecpar.width}x${videoStream.codecpar.height}`);
  console.log(`  Audio: ${audioStream.codecpar.codecId} ${audioStream.codecpar.sampleRate}Hz, ${audioStream.codecpar.channels} channels`);
  console.log('');

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

  console.log('🔧 Processing mode:');
  console.log(`  Video: ${canCopyVideo ? 'Stream Copy' : 'Transcode to H.264'}`);
  console.log(`  Audio: ${canCopyAudio ? 'Stream Copy' : 'Transcode to AAC'}`);
  if (forceCopy && (!canCopyVideo || !canCopyAudio)) {
    console.log('  ⚠️  Warning: Using stream copy with potentially incompatible codecs');
  }
  console.log('');

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
    videoEncoder = await Encoder.create('libx264', {
      type: 'video',
      width: videoStream.codecpar.width,
      height: videoStream.codecpar.height,
      pixelFormat: AV_PIX_FMT_YUV420P,
      timeBase: { num: 1, den: 25 },
      frameRate: { num: 25, den: 1 },
      sampleAspectRatio: videoStream.sampleAspectRatio,
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
    // MP2 decoders typically output s16p format
    const sourceFormat = {
      type: 'audio' as const,
      sampleRate: audioStream.codecpar.sampleRate,
      sampleFormat: AV_SAMPLE_FMT_S16P, // MP2 decoder outputs s16p
      channelLayout: audioStream.codecpar.channels === 1 ? AV_CHANNEL_LAYOUT_MONO : AV_CHANNEL_LAYOUT_STEREO,
      timeBase: audioStream.timeBase,
    };

    audioFilter = await FilterAPI.create('aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asetnsamples=n=1024:p=0', sourceFormat);

    // AAC encoder
    audioEncoder = await Encoder.create(
      'aac',
      {
        type: 'audio',
        frameSize: 1024,
        sampleRate: 48000,
        sampleFormat: AV_SAMPLE_FMT_FLTP,
        channelLayout: AV_CHANNEL_LAYOUT_STEREO,
        timeBase: { num: 1, den: 48000 },
      },
      {
        bitrate: '192k',
      },
    );

    audioIdx = output.addStream(audioEncoder);
  }

  // Write header
  await output.writeHeader();

  console.log('🎥 Processing...');
  const startTime = Date.now();

  let videoPackets = 0;
  let audioPackets = 0;

  // Process video
  const processVideo = async () => {
    if (canCopyVideo) {
      // Stream copy
      for await (const packet of videoInput.packets(videoStream.index)) {
        await output.writePacket(packet, videoIdx);
        videoPackets++;
      }
    } else {
      // Transcode without filter - direct decode->encode
      let frameCount = 0;
      for await (const packet of videoInput.packets(videoStream.index)) {
        const frame = await videoDecoder!.decode(packet);
        if (frame) {
          // Fix timestamps - set PTS based on frame count
          frame.pts = BigInt(frameCount);

          const encoded = await videoEncoder!.encode(frame);
          if (encoded) {
            await output.writePacket(encoded, videoIdx);
            videoPackets++;
            encoded.free();
          }
          frame.free();
          frameCount++;
        }
      }

      // Flush decoder
      for await (const frame of videoDecoder!.flushFrames()) {
        frame.pts = BigInt(frameCount);
        const encoded = await videoEncoder!.encode(frame);
        if (encoded) {
          await output.writePacket(encoded, videoIdx);
          videoPackets++;
          encoded.free();
        }
        frame.free();
        frameCount++;
      }

      // Flush encoder
      for await (const packet of videoEncoder!.flushPackets()) {
        await output.writePacket(packet, videoIdx);
        videoPackets++;
        packet.free();
      }
    }
  };

  // Process audio
  const processAudio = async () => {
    if (canCopyAudio) {
      // Stream copy
      for await (const packet of audioInput.packets(audioStream.index)) {
        await output.writePacket(packet, audioIdx);
        audioPackets++;
      }
    } else {
      for await (const packet of audioInput.packets(audioStream.index)) {
        const frame = await audioDecoder!.decode(packet);
        if (frame) {
          const filteredFrame = await audioFilter!.process(frame);
          if (filteredFrame) {
            const encoded = await audioEncoder!.encode(filteredFrame);
            if (encoded) {
              await output.writePacket(encoded, audioIdx);
              audioPackets++;
              encoded.free();
            }

            filteredFrame.free();
          }

          frame.free();
        }
      }

      // Flush decoder
      for await (const frame of audioDecoder!.flushFrames()) {
        const filteredFrame = await audioFilter!.process(frame);
        if (filteredFrame) {
          const encoded = await audioEncoder!.encode(filteredFrame);
          if (encoded) {
            await output.writePacket(encoded, audioIdx);
            audioPackets++;
            encoded.free();
          }

          filteredFrame.free();
        }

        frame.free();
      }

      // Flush filter
      for await (const filteredFrame of audioFilter!.flushFrames()) {
        const encoded = await audioEncoder!.encode(filteredFrame);
        if (encoded) {
          await output.writePacket(encoded, audioIdx);
          audioPackets++;
          encoded.free();
        }
        filteredFrame.free();
      }

      // Flush encoder
      for await (const packet of audioEncoder!.flushPackets()) {
        await output.writePacket(packet, audioIdx);
        audioPackets++;
        packet.free();
      }
    }
  };

  // Process both streams in parallel
  await Promise.all([processVideo(), processAudio()]);

  // Write trailer
  await output.writeTrailer();

  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n✅ Muxing complete!');
  console.log(`   Video packets: ${videoPackets}`);
  console.log(`   Audio packets: ${audioPackets}`);
  console.log(`   Time: ${elapsed.toFixed(2)}s`);
  console.log(`   Output: ${outputFile}`);

  // Cleanup
  videoDecoder?.close();
  audioDecoder?.close();
  videoEncoder?.close();
  audioEncoder?.close();
  await videoInput.close();
  await audioInput.close();
  await output.close();
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message ?? error);
  if (error.stack && process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
