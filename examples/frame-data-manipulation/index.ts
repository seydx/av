/**
 * Frame Data Manipulation Example
 *
 * This example demonstrates how to manually create and manipulate
 * audio and video frames by directly accessing their data buffers.
 *
 * Use cases:
 * - Generate synthetic audio/video
 * - Process frame data without codecs
 * - Convert between formats
 * - Apply custom filters/effects
 * - Integration with other libraries (e.g., image processing)
 *
 * Key concepts:
 * - Frame allocation and buffer management
 * - Planar vs packed formats
 * - Line size and data alignment
 * - Making frames writable
 */

import {
  AV_CODEC_ID_PNG,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_PICTURE_TYPE_I,
  AV_PIX_FMT_RGBA,
  AV_SAMPLE_FMT_FLT,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  IOContext,
  OutputFormat,
  Packet,
  Rational,
} from '../../src/lib/index.js';

import { config, ffmpegLog } from '../index.js';

async function manipulateAudioFrame() {
  console.log('=== Audio Frame Manipulation ===\n');

  // Create an audio frame
  using audioFrame = new Frame();

  // Set audio frame properties before allocation
  audioFrame.channelLayout = {
    nbChannels: 2, // Stereo
    order: 1, // Native order
    mask: 3n, // Stereo mask (FL | FR)
  };
  audioFrame.nbSamples = 960;
  audioFrame.format = AV_SAMPLE_FMT_FLT; // 32-bit float
  audioFrame.sampleRate = 48000;

  // Allocate buffer with alignment
  const align = 0; // Use default alignment
  audioFrame.allocBuffer(align);

  console.log('Audio frame created:');
  console.log(`  Channels: ${audioFrame.channelLayout.nbChannels}`);
  console.log(`  Samples: ${audioFrame.nbSamples}`);
  console.log(`  Sample rate: ${audioFrame.sampleRate} Hz`);
  console.log(`  Format: ${audioFrame.sampleFormat} (float)`);

  // Make frame writable before modifying data
  audioFrame.makeWritable();

  // Generate a sine wave
  const frequency = 440; // A4 note
  const amplitude = 0.5;
  const sampleRate = audioFrame.sampleRate;
  const nbSamples = audioFrame.nbSamples;

  // Get frame data buffers (one per channel for planar formats)
  const frameData = audioFrame.data;

  // AV_SAMPLE_FMT_FLT is planar, so we have separate buffers for each channel
  if (frameData.length >= 2 && frameData[0] && frameData[1]) {
    // Generate sine wave for left channel
    const leftChannel = new Float32Array(frameData[0].buffer, frameData[0].byteOffset, nbSamples);
    for (let i = 0; i < nbSamples; i++) {
      leftChannel[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    }

    // Generate sine wave with phase shift for right channel
    const rightChannel = new Float32Array(frameData[1].buffer, frameData[1].byteOffset, nbSamples);
    const phaseShift = Math.PI / 4; // 45 degree phase shift
    for (let i = 0; i < nbSamples; i++) {
      rightChannel[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate + phaseShift);
    }

    console.log('\nGenerated stereo sine wave:');
    console.log(`  Frequency: ${frequency} Hz`);
    console.log(`  Amplitude: ${amplitude}`);
    console.log('  Phase shift: 45°');
    console.log(
      `  First 5 samples (left): ${Array.from(leftChannel.slice(0, 5))
        .map((v) => v.toFixed(3))
        .join(', ')}`,
    );
    console.log(
      `  First 5 samples (right): ${Array.from(rightChannel.slice(0, 5))
        .map((v) => v.toFixed(3))
        .join(', ')}`,
    );
  }

  // Get frame data as bytes
  const audioBytes = audioFrame.getBytes(align);
  console.log(`\nTotal audio data size: ${audioBytes ? audioBytes.length : 0} bytes`);
  console.log(`  dataSize property: ${audioFrame.dataSize} bytes`);
  console.log(`  Is writable: ${audioFrame.isWritable()}`);

  // We could also set frame data from a buffer
  if (audioBytes) {
    // Example: modify and set back
    audioBytes[0] = audioBytes[0] * 0.5; // Reduce first sample
    audioFrame.setBytes(audioBytes, align);
    console.log('  Modified and set frame data back');
  }
}

async function manipulateVideoFrame(): Promise<Frame> {
  console.log('\n=== Video Frame Manipulation ===\n');

  // Create a video frame (don't use 'using' since we return it)
  const videoFrame = new Frame();

  // Set video frame properties
  videoFrame.width = 256;
  videoFrame.height = 256;
  videoFrame.format = AV_PIX_FMT_RGBA; // RGBA format (packed, not planar)

  // Allocate buffer
  const align = 1; // Byte alignment
  videoFrame.allocBuffer(align);

  console.log('Video frame created:');
  console.log(`  Size: ${videoFrame.width}x${videoFrame.height}`);
  console.log(`  Format: ${videoFrame.pixelFormat} (RGBA)`);

  // Make frame writable
  videoFrame.makeWritable();

  // Get frame data
  const frameData = videoFrame.data;
  const linesize = videoFrame.linesize;

  // RGBA is packed format, so all data is in first plane
  if (frameData[0]) {
    const width = videoFrame.width;
    const height = videoFrame.height;
    const stride = linesize[0]; // Bytes per row (may include padding)
    const bytesPerPixel = 4; // RGBA = 4 bytes

    // Create a view of the frame buffer
    const buffer = frameData[0];

    // Generate a gradient pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = y * stride + x * bytesPerPixel;

        // Create gradient: red increases left to right, green top to bottom
        buffer[offset + 0] = Math.floor((x / width) * 255); // R
        buffer[offset + 1] = Math.floor((y / height) * 255); // G
        buffer[offset + 2] = 128; // B (constant)
        buffer[offset + 3] = 255; // A (opaque)
      }
    }

    console.log('\nGenerated gradient pattern:');
    console.log('  Red: increases left to right');
    console.log('  Green: increases top to bottom');
    console.log('  Blue: constant (128)');
    console.log('  Alpha: opaque (255)');

    // Sample some pixels
    console.log('\nSample pixels (RGBA):');
    const samplePixel = (x: number, y: number) => {
      const offset = y * stride + x * bytesPerPixel;
      return `[${buffer[offset]}, ${buffer[offset + 1]}, ${buffer[offset + 2]}, ${buffer[offset + 3]}]`;
    };
    console.log(`  Top-left (0,0): ${samplePixel(0, 0)}`);
    console.log(`  Top-right (255,0): ${samplePixel(255, 0)}`);
    console.log(`  Bottom-left (0,255): ${samplePixel(0, 255)}`);
    console.log(`  Bottom-right (255,255): ${samplePixel(255, 255)}`);
    console.log(`  Center (128,128): ${samplePixel(128, 128)}`);
  }

  // Get frame data as bytes
  const videoBytes = videoFrame.getBytes(align);
  console.log(`\nTotal video data size: ${videoBytes ? videoBytes.length : 0} bytes`);
  console.log(`  Expected size: ${256 * 256 * 4} bytes`);
  console.log(`  dataSize property: ${videoFrame.dataSize} bytes`);
  console.log(`  Is writable: ${videoFrame.isWritable()}`);

  // Set frame timing information
  videoFrame.pts = 0n;
  // Frame doesn't have timeBase or duration, only pts/pktDts/pktDuration
  videoFrame.pts = 0n;
  videoFrame.pktDuration = 1n; // 1 frame duration

  console.log('\nFrame timing:');
  console.log(`  PTS: ${videoFrame.pts}`);
  console.log(`  Frame duration: ${videoFrame.pktDuration}`);

  return videoFrame;
}

async function demonstrateFrameProperties() {
  console.log('\n=== Frame Properties ===\n');

  using frame = new Frame();

  // Set various properties
  frame.width = 1920;
  frame.height = 1080;
  frame.format = AV_PIX_FMT_RGBA;
  frame.sampleAspectRatio = new Rational(1, 1);
  frame.pictType = AV_PICTURE_TYPE_I;
  frame.keyFrame = true;
  frame.quality = 1;

  console.log('Frame properties:');
  console.log(`  Resolution: ${frame.width}x${frame.height}`);
  console.log(`  Aspect ratio: ${frame.sampleAspectRatio.num}:${frame.sampleAspectRatio.den}`);
  console.log(`  Picture type: ${frame.pictType}`);
  console.log(`  Key frame: ${frame.keyFrame}`);
  console.log(`  Quality: ${frame.quality}`);

  // Metadata is not available on Frame

  // Metadata not available on Frame

  // Check if frame is writable
  console.log(`\nIs writable before allocBuffer: ${frame.isWritable()}`);

  // Clone frame (needs allocated buffer)
  frame.allocBuffer(1);
  console.log(`Is writable after allocBuffer: ${frame.isWritable()}`);

  using clonedFrame = frame.clone();
  console.log(`\nCloned frame width: ${clonedFrame.width}`);
  console.log(`Cloned frame dataSize: ${clonedFrame.dataSize} bytes`);
}

async function saveFrameAsImage(frame: Frame, outputFile: string) {
  console.log(`\nSaving frame to ${outputFile}...`);

  using formatContext = new FormatContext();
  using packet = new Packet();

  // Allocate output context for PNG
  const outputFormat = OutputFormat.guess({ filename: outputFile });
  if (!outputFormat) {
    throw new Error('Could not determine output format for PNG');
  }

  formatContext.allocOutputContext(outputFormat, undefined, outputFile);

  // Create stream
  const stream = formatContext.newStream();
  if (!stream?.codecParameters) {
    throw new Error('Failed to create output stream');
  }

  // Find PNG encoder
  const encoder = Codec.findEncoder(AV_CODEC_ID_PNG);
  if (!encoder) {
    throw new Error('PNG encoder not found');
  }

  // Setup encoder context
  using encoderContext = new CodecContext(encoder);
  encoderContext.width = frame.width;
  encoderContext.height = frame.height;
  encoderContext.pixelFormat = frame.pixelFormat ?? AV_PIX_FMT_RGBA;
  encoderContext.timeBase = new Rational(1, 1);

  await encoderContext.openAsync();

  // Copy parameters to stream
  stream.codecParameters.fromCodecContext(encoderContext);

  // Open output file
  using ioContext = new IOContext();
  await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
  formatContext.pb = ioContext;

  // Write header
  await formatContext.writeHeaderAsync();

  // Encode frame
  frame.pts = 0n;
  await encoderContext.sendFrameAsync(frame);

  const ret = await encoderContext.receivePacketAsync(packet);
  if (ret >= 0) {
    packet.streamIndex = stream.index;
    await formatContext.writeFrameAsync(packet);
  }

  // Write trailer
  await formatContext.writeTrailerAsync();

  console.log(`Frame saved to ${outputFile}`);
}

async function main() {
  ffmpegLog('frame-data-manipulation', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  const outputFile = config.outputFile('gradient_frame', 'png');

  try {
    console.log('Frame Data Manipulation Example\n');
    console.log('This example shows how to directly create and manipulate');
    console.log('frame data without using codecs.\n');

    // Manipulate audio frame
    await manipulateAudioFrame();

    // Manipulate video frame
    const videoFrame = await manipulateVideoFrame();

    // Demonstrate frame properties
    await demonstrateFrameProperties();

    // Save the manipulated video frame as PNG
    if (videoFrame) {
      await saveFrameAsImage(videoFrame, outputFile);
    }

    console.log('\n=== Success ===');
    console.log('Frame manipulation completed successfully!');
    console.log(`Check ${outputFile} to see the generated gradient image.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
