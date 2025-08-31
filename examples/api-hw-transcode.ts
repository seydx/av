/**
 * High-Level API Example: Hardware-Accelerated Transcoding
 *
 * Shows how to use hardware acceleration for video transcoding with the high-level API.
 * Demonstrates zero-copy GPU pipeline when both decoder and encoder use the same hardware.
 *
 * Usage: tsx examples/api-hw-transcode.ts <input> <output>
 * Example: tsx examples/api-hw-transcode.ts testdata/video.mp4 examples/.tmp/api-hw-transcode.mp4
 */

import { Decoder, Encoder, HardwareContext, MediaInput, MediaOutput } from '../src/api/index.js';
import { FF_ENCODER_H264_NVENC, FF_ENCODER_H264_QSV, FF_ENCODER_H264_VAAPI, FF_ENCODER_LIBX264 } from '../src/index.js';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: tsx examples/api-hw-transcode.ts <input> <output>');
  process.exit(1);
}

async function main() {
  let hw: HardwareContext | null = null;

  try {
    console.log('High-Level API: Hardware-Accelerated Transcoding');
    console.log('================================================\n');

    // Auto-detect best available hardware
    console.log('Detecting hardware acceleration...');
    hw = await HardwareContext.auto();

    if (!hw) {
      console.log('⚠️  No hardware acceleration available, falling back to software');
    } else {
      console.log(`✅ Using hardware: ${hw.deviceTypeName}`);

      // List supported codecs
      const encoders = hw.findSupportedCodecs(true);
      const decoders = hw.findSupportedCodecs(false);
      console.log(`   Supported decoders: ${decoders.slice(0, 5).join(', ')}${decoders.length > 5 ? '...' : ''}`);
      console.log(`   Supported encoders: ${encoders.slice(0, 5).join(', ')}${encoders.length > 5 ? '...' : ''}`);
    }

    // Open input media
    console.log('\nOpening input:', inputFile);
    const input = await MediaInput.open(inputFile);

    // Get video stream
    const videoStream = input.video();
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    // Get audio stream
    const audioStream = input.audio();
    if (!audioStream) {
      throw new Error('No audio stream found');
    }

    console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} ${videoStream.codecpar.codecId}`);

    // Create hardware decoder
    console.log('\nCreating hardware decoder...');
    const decoder = await Decoder.create(videoStream, {
      hardware: hw,
    });

    // Hardware context is now initialized automatically when hardware is provided
    if (hw) {
      console.log('Hardware context initialized for zero-copy transcoding');
    }

    // Determine encoder based on hardware availability
    let encoderName = FF_ENCODER_LIBX264; // Default software encoder
    let codecOptions: Record<string, string> = {
      preset: 'fast',
      crf: '23',
    };

    if (hw) {
      // Use hardware-specific encoder
      switch (hw.deviceTypeName) {
        case 'videotoolbox':
          encoderName = FF_ENCODER_LIBX264;
          codecOptions = {
            realtime: '1',
          };
          break;
        case 'cuda':
          encoderName = FF_ENCODER_H264_NVENC;
          break;
        case 'vaapi':
          encoderName = FF_ENCODER_H264_VAAPI;
          break;
        case 'qsv':
          encoderName = FF_ENCODER_H264_QSV;
          break;
        default:
          console.log('⚠️  No known H.264 encoder for this hardware, using software');
      }
    }

    console.log(`Creating encoder: ${encoderName}...`);

    // Create encoder with shared decoder for zero-copy when both use hardware
    const encoder = await Encoder.create(encoderName, videoStream, {
      hardware: hw,
      options: codecOptions,
    });

    // Create output using MediaOutput
    const output = await MediaOutput.open(outputFile);
    const videoOutputIndex = output.addStream(encoder);
    const audioOutputIndex = output.addStream(audioStream);

    // Write header
    await output.writeHeader();

    // Process frames
    console.log('\nTranscoding with hardware acceleration...');
    let decodedFrames = 0;
    let encodedPackets = 0;
    let hardwareFrames = 0;
    let audioFrames = 0;

    const startTime = Date.now();

    for await (const packet of input.packets()) {
      if (packet.streamIndex === videoStream.index) {
        // Decode packet to frame
        const frame = await decoder.decode(packet);
        if (frame) {
          decodedFrames++;

          // Check if frame is on GPU (zero-copy path)
          if (frame.isHwFrame()) {
            hardwareFrames++;
          }

          // Re-encode frame (zero-copy if both on same GPU)
          const encodedPacket = await encoder.encode(frame);
          if (encodedPacket) {
            // Write packet (MediaOutput handles timestamp rescaling)
            await output.writePacket(encodedPacket, videoOutputIndex);
            encodedPackets++;
            encodedPacket.free();
          }

          frame.free();
        }
      } else if (packet.streamIndex === audioStream.index) {
        await output.writePacket(packet, audioOutputIndex);
        audioFrames++;
      }
      packet.free();
    }

    // Flush decoder
    console.log('\n\nFlushing decoder...');
    let flushFrame;
    while ((flushFrame = await decoder.flush()) !== null) {
      const encodedPacket = await encoder.encode(flushFrame);
      if (encodedPacket) {
        await output.writePacket(encodedPacket, videoOutputIndex);
        encodedPackets++;
        encodedPacket.free();
      }
      flushFrame.free();
    }

    // Flush encoder
    console.log('Flushing encoder...');
    let flushPacket;
    while ((flushPacket = await encoder.flush()) !== null) {
      await output.writePacket(flushPacket, videoOutputIndex);
      encodedPackets++;
      flushPacket.free();
    }

    // Write trailer
    await output.writeTrailer();

    const elapsed = (Date.now() - startTime) / 1000;
    const avgFps = (decodedFrames / elapsed).toFixed(1);

    // Clean up
    decoder.close();
    encoder.close();
    hw?.dispose();
    await input.close();
    await output.close();

    console.log('\n✅ Transcoding complete!');
    console.log(`   Hardware: ${hw ? hw.deviceTypeName : 'none (software)'}`);
    console.log(`   Decoded: ${decodedFrames} frames`);
    console.log(`   Encoded: ${encodedPackets} packets`);
    console.log(`   GPU frames: ${hardwareFrames} (${((hardwareFrames / decodedFrames) * 100).toFixed(1)}% zero-copy)`);
    console.log(`   Audio frames: ${audioFrames}`);
    console.log(`   Time: ${elapsed.toFixed(2)}s`);
    console.log(`   Average FPS: ${avgFps}`);
    console.log(`   Output: ${outputFile}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
