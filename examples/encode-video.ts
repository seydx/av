/**
 * Encode Video Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/encode_video.c
 * Generate synthetic video data and encode it to an output file.
 *
 * Usage: tsx examples/encode-video.ts <output> <codec>
 * Example: tsx examples/encode-video.ts examples/.tmp/encode_video.h264 libx264
 *
 * For MPEG codecs, the output is an elementary stream that can be played with:
 * ffplay -i output.h264
 * ffplay -i output.m1v (for mpeg1video)
 */

import { closeSync, openSync, writeSync } from 'node:fs';

import {
  AV_CODEC_ID_H264,
  AV_CODEC_ID_MPEG1VIDEO,
  AV_CODEC_ID_MPEG2VIDEO,
  AV_PIX_FMT_YUV420P,
  AVERROR_EAGAIN,
  AVERROR_EOF,
  Codec,
  CodecContext,
  FFmpegError,
  Frame,
  Packet,
  Rational,
  type FFEncoderCodec,
} from '../src/index.js';

/**
 * Encode one frame and write packets to file
 */
async function encode(encCtx: CodecContext, frame: Frame | null, pkt: Packet, outfile: number): Promise<void> {
  // Send the frame to the encoder
  if (frame) {
    console.log(`Send frame ${frame.pts}`);
  }

  const sendRet = await encCtx.sendFrame(frame);
  FFmpegError.throwIfError(sendRet, 'Error sending a frame for encoding');

  while (true) {
    const ret = await encCtx.receivePacket(pkt);
    if (FFmpegError.is(ret, AVERROR_EAGAIN) || FFmpegError.is(ret, AVERROR_EOF)) {
      return;
    }
    FFmpegError.throwIfError(ret, 'Error during encoding');

    const data = pkt.data;
    if (data) {
      console.log(`Write packet ${pkt.pts} (size=${pkt.size})`);
      writeSync(outfile, data);
    }
    pkt.unref();
  }
}

/**
 * Main encode video function
 */
async function encodeVideo(filename: string, codecName: FFEncoderCodec): Promise<void> {
  let codec: Codec | null = null;
  let codecCtx: CodecContext | null = null;
  let packet: Packet | null = null;
  let frame: Frame | null = null;
  let outfile: number | null = null;

  try {
    // Find the encoder
    codec = Codec.findEncoderByName(codecName);
    if (!codec) {
      throw new Error(`Codec '${codecName}' not found`);
    }

    // Allocate codec context
    codecCtx = new CodecContext();
    codecCtx.allocContext3(codec);

    // Allocate packet
    packet = new Packet();
    packet.alloc();

    // Set sample parameters
    codecCtx.bitRate = 400000n;
    // Resolution must be a multiple of two
    codecCtx.width = 352;
    codecCtx.height = 288;
    // Frames per second
    codecCtx.timeBase = new Rational(1, 25);
    codecCtx.framerate = new Rational(25, 1);

    // Emit one intra frame every ten frames
    // check frame pict_type before passing frame
    // to encoder, if frame->pict_type is AV_PICTURE_TYPE_I
    // then gop_size is ignored and the output of encoder
    // will always be I frame irrespective to gop_size
    codecCtx.gopSize = 10;
    codecCtx.maxBFrames = 1;
    codecCtx.pixelFormat = AV_PIX_FMT_YUV420P;

    // For H264, set preset
    if (codec.id === AV_CODEC_ID_H264) {
      const ret = codecCtx.setOption('preset', 'slow');
      FFmpegError.throwIfError(ret, 'Could not set codec options');
    }

    // Open codec
    const openRet = await codecCtx.open2(codec, null);
    FFmpegError.throwIfError(openRet, 'Could not open codec');

    // Open output file
    outfile = openSync(filename, 'w');

    // Allocate frame
    frame = new Frame();
    frame.alloc();
    frame.format = codecCtx.pixelFormat;
    frame.width = codecCtx.width;
    frame.height = codecCtx.height;

    // Allocate frame buffer
    const bufferRet = frame.getBuffer(0);
    FFmpegError.throwIfError(bufferRet, 'Could not allocate the video frame data');

    // Encode 1 second of video (25 frames)
    for (let i = 0; i < 25; i++) {
      // Make sure the frame data is writable
      // On the first round, the frame is fresh from getBuffer()
      // and therefore we know it is writable.
      // But on the next rounds, encode() will have called
      // sendFrame(), and the codec may have kept a reference to
      // the frame in its internal structures, that makes the frame
      // unwritable.
      // makeWritable() checks that and allocates a new buffer
      // for the frame only if necessary.
      const writableRet = frame.makeWritable();
      FFmpegError.throwIfError(writableRet, 'Could not make frame writable');

      // Prepare a dummy image.
      // In real code, this is where you would have your own logic for
      // filling the frame. FFmpeg does not care what you put in the
      // frame.

      const frameData = frame.data;
      if (!frameData?.[0] || !frameData[1] || !frameData[2]) {
        throw new Error('Frame data not allocated');
      }

      const linesize = frame.linesize;
      if (!linesize?.[0] || !linesize[1] || !linesize[2]) {
        throw new Error('Frame linesize not available');
      }

      // Y plane
      for (let y = 0; y < codecCtx.height; y++) {
        for (let x = 0; x < codecCtx.width; x++) {
          frameData[0][y * linesize[0] + x] = x + y + i * 3;
        }
      }

      // Cb and Cr planes (half resolution for YUV420P)
      for (let y = 0; y < codecCtx.height / 2; y++) {
        for (let x = 0; x < codecCtx.width / 2; x++) {
          frameData[1][y * linesize[1] + x] = 128 + y + i * 2;
          frameData[2][y * linesize[2] + x] = 64 + x + i * 5;
        }
      }

      frame.pts = BigInt(i);

      // Encode the image
      await encode(codecCtx, frame, packet, outfile);
    }

    // Flush the encoder
    console.log('Flushing encoder...');
    await encode(codecCtx, null, packet, outfile);

    // Add sequence end code to have a real MPEG file.
    // It makes only sense because this tiny example writes packets
    // directly. This is called "elementary stream" and only works for some
    // codecs. To create a valid file, you usually need to write packets
    // into a proper file format or protocol; see mux.c.
    if (codec.id === AV_CODEC_ID_MPEG1VIDEO || codec.id === AV_CODEC_ID_MPEG2VIDEO) {
      const endcode = Buffer.from([0x00, 0x00, 0x01, 0xb7]);
      writeSync(outfile, endcode);
    }

    console.log('Video encoding completed successfully!');
    console.log(`Output written to: ${filename}`);
    console.log('You can play it with:');
    if (codec.id === AV_CODEC_ID_H264) {
      console.log(`  ffplay -i ${filename}`);
    } else if (codec.id === AV_CODEC_ID_MPEG1VIDEO) {
      console.log(`  ffplay -f m1v ${filename}`);
    } else if (codec.id === AV_CODEC_ID_MPEG2VIDEO) {
      console.log(`  ffplay -f m2v ${filename}`);
    } else {
      console.log(`  ffplay ${filename}`);
    }
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (outfile !== null) {
      closeSync(outfile);
    }
    if (codecCtx) {
      codecCtx.freeContext();
    }
    if (frame) {
      frame.free();
    }
    if (packet) {
      packet.free();
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: tsx examples/encode-video.ts <output> <codec>');
    console.log('Example: tsx examples/encode-video.ts output.h264 libx264');
    console.log('         tsx examples/encode-video.ts output.m1v mpeg1video');
    console.log('         tsx examples/encode-video.ts output.m2v mpeg2video');
    console.log('');
    console.log('Common video codecs:');
    console.log('  libx264      - H.264/AVC encoder');
    console.log('  libx265      - H.265/HEVC encoder');
    console.log('  mpeg1video   - MPEG-1 video');
    console.log('  mpeg2video   - MPEG-2 video');
    console.log('  libvpx       - VP8 encoder');
    console.log('  libvpx-vp9   - VP9 encoder');
    process.exit(1);
  }

  const [filename, codecName] = args;

  try {
    await encodeVideo(filename, codecName as FFEncoderCodec);
    process.exit(0);
  } catch (error) {
    if (error instanceof FFmpegError) {
      console.error(`FFmpeg Error: ${error.message} (code: ${error.code})`);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
