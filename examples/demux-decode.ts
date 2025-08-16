#!/usr/bin/env tsx

/**
 * Demux and Decode Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/demux_decode.c
 * Show how to use the libavformat and libavcodec API to demux and decode audio
 * and video data. Write the output as raw audio and video files to be played by ffplay.
 *
 * Usage: tsx examples/demux-decode.ts <input_file> <video_output_file> <audio_output_file>
 * Example: tsx examples/demux-decode.ts testdata/video.mp4 examples/.tmp/demuxe_decode.yuv examples/.tmp/demuxe_decode.pcm
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_SAMPLE_FMT_DBL,
  AV_SAMPLE_FMT_FLT,
  AV_SAMPLE_FMT_S16,
  AV_SAMPLE_FMT_S32,
  AV_SAMPLE_FMT_U8,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  Packet,
  avGetBytesPerSample,
  avGetMediaTypeString,
  avGetPackedSampleFmt,
  avGetPixFmtName,
  avGetSampleFmtName,
  avImageAllocArrays,
  avImageCopy2,
  avSampleFmtIsPlanar,
  avTs2TimeStr,
} from '../src/lib/index.js';

import type { AVMediaType, AVPixelFormat, AVSampleFormat, Stream } from '../src/lib/index.js';

// Global state
let srcFilename: string;
let videoDstFilename: string;
let audioDstFilename: string;
let videoDstFile: number | null = null;
let audioDstFile: number | null = null;

// Video decoding state
let videoDecCtx: CodecContext | null = null;
let videoStream: Stream | null = null;
let videoStreamIdx = -1;
let width = 0;
let height = 0;
let pixFmt: AVPixelFormat;
const videoDstData: Buffer[] = [];
const videoDstLinesize: number[] = [];
let videoDstBufsize = 0;
let videoFrameCount = 0;

// Audio decoding state
let audioDecCtx: CodecContext | null = null;
let audioStream: Stream | null = null;
let audioStreamIdx = -1;
let audioFrameCount = 0;

/**
 * Get format string from sample format for ffplay
 */
function getFormatFromSampleFmt(sampleFmt: AVSampleFormat): string | null {
  const sampleFmtEntries: {
    sampleFmt: AVSampleFormat;
    fmtBe: string;
    fmtLe: string;
  }[] = [
    { sampleFmt: AV_SAMPLE_FMT_U8, fmtBe: 'u8', fmtLe: 'u8' },
    { sampleFmt: AV_SAMPLE_FMT_S16, fmtBe: 's16be', fmtLe: 's16le' },
    { sampleFmt: AV_SAMPLE_FMT_S32, fmtBe: 's32be', fmtLe: 's32le' },
    { sampleFmt: AV_SAMPLE_FMT_FLT, fmtBe: 'f32be', fmtLe: 'f32le' },
    { sampleFmt: AV_SAMPLE_FMT_DBL, fmtBe: 'f64be', fmtLe: 'f64le' },
  ];

  for (const entry of sampleFmtEntries) {
    if (sampleFmt === entry.sampleFmt) {
      // Use little-endian on most systems
      return entry.fmtLe;
    }
  }

  console.error(`sample format ${avGetSampleFmtName(sampleFmt)} is not supported as output format`);
  return null;
}

/**
 * Output a video frame to file
 */
function outputVideoFrame(frame: Frame): number {
  if (frame.width !== width || frame.height !== height || frame.format !== pixFmt) {
    // prettier-ignore
    console.error(
      'Error: Width, height and pixel format have to be constant in a rawvideo file, but the width, height or pixel format of the input video changed:\n' +
      `old: width = ${width}, height = ${height}, format = ${avGetPixFmtName(pixFmt)}\n` +
      `new: width = ${frame.width}, height = ${frame.height}, format = ${avGetPixFmtName(frame.format as AVPixelFormat)}`,
    );
    return -1;
  }

  console.log(`video_frame n:${videoFrameCount++}`);

  // Copy decoded frame to destination buffer:
  // this is required since rawvideo expects non aligned data
  avImageCopy2(videoDstData, videoDstLinesize, frame.data!, frame.linesize, pixFmt, width, height);

  // Write to rawvideo file
  if (videoDstFile !== null) {
    fs.writeSync(videoDstFile, videoDstData[0]);
  }
  return 0;
}

/**
 * Output an audio frame to file
 */
function outputAudioFrame(frame: Frame): number {
  const unpadded_linesize = frame.nbSamples * avGetBytesPerSample(frame.format as AVSampleFormat);
  const timeBase = audioDecCtx!.timeBase;
  const ptsStr = avTs2TimeStr(frame.pts, timeBase);

  console.log(`audio_frame n:${audioFrameCount++} nb_samples:${frame.nbSamples} pts:${ptsStr}`);

  // Write the raw audio data samples of the first plane. This works
  // fine for packed formats (e.g. AV_SAMPLE_FMT_S16). However,
  // most audio decoders output planar audio, which uses a separate
  // plane of audio samples for each channel (e.g. AV_SAMPLE_FMT_S16P).
  // In other words, this code will write only the first audio channel
  // in these cases.
  // You should use libswresample or libavfilter to convert the frame
  // to packed data.
  if (audioDstFile !== null && frame.extendedData?.[0]) {
    const audioData = Buffer.from(frame.extendedData[0].buffer, frame.extendedData[0].byteOffset, unpadded_linesize);
    fs.writeSync(audioDstFile, audioData);
  }

  return 0;
}

/**
 * Decode a packet
 */
async function decodePacket(dec: CodecContext, pkt: Packet | null, frame: Frame): Promise<number> {
  let ret = 0;

  // Submit the packet to the decoder
  ret = await dec.sendPacket(pkt);
  if (ret < 0) {
    console.error(`Error submitting a packet for decoding: ${new FFmpegError(ret).message}`);
    return ret;
  }

  // Get all the available frames from the decoder
  while (ret >= 0) {
    ret = await dec.receiveFrame(frame);
    if (ret < 0) {
      // Those two return values are special and mean there is no output
      // frame available, but there were no errors during decoding
      if (ret === AV_ERROR_EOF || ret === AV_ERROR_EAGAIN) {
        return 0;
      }

      console.error(`Error during decoding: ${new FFmpegError(ret).message}`);
      return ret;
    }

    // Write the frame data to output file
    if (dec.codecType === AV_MEDIA_TYPE_VIDEO) {
      ret = outputVideoFrame(frame);
    } else {
      ret = outputAudioFrame(frame);
    }

    frame.unref();
  }

  return ret;
}

/**
 * Open codec context for a stream
 */
async function openCodecContext(
  fmtCtx: FormatContext,
  type: AVMediaType,
): Promise<{
  streamIdx: number;
  decCtx: CodecContext | null;
  stream: Stream | null;
}> {
  let ret: number;
  let st: Stream | null = null;
  let dec: Codec | null = null;
  let decCtx: CodecContext | null = null;

  ret = fmtCtx.findBestStream(type, -1, -1);
  if (ret < 0) {
    console.error(`Could not find ${avGetMediaTypeString(type)} stream in input file '${srcFilename}'`);
    return { streamIdx: -1, decCtx: null, stream: null };
  }

  const streamIndex = ret;
  const streams = fmtCtx.streams ?? [];
  st = streams[streamIndex];

  if (!st) {
    console.error(`Stream ${streamIndex} not found`);
    return { streamIdx: -1, decCtx: null, stream: null };
  }

  // Find decoder for the stream
  dec = Codec.findDecoder(st.codecpar.codecId);
  if (!dec) {
    console.error(`Failed to find ${avGetMediaTypeString(type)} codec`);
    return { streamIdx: -1, decCtx: null, stream: null };
  }

  // Allocate a codec context for the decoder
  decCtx = new CodecContext();
  decCtx.allocContext3(dec);

  // Copy codec parameters from input stream to output codec context
  ret = decCtx.parametersToContext(st.codecpar);
  if (ret < 0) {
    console.error(`Failed to copy ${avGetMediaTypeString(type)} codec parameters to decoder context`);
    return { streamIdx: -1, decCtx: null, stream: null };
  }

  // Init the decoders
  ret = await decCtx.open2(dec, null);
  if (ret < 0) {
    console.error(`Failed to open ${avGetMediaTypeString(type)} codec`);
    return { streamIdx: -1, decCtx: null, stream: null };
  }

  return { streamIdx: streamIndex, decCtx, stream: st };
}

/**
 * Main demux and decode function
 */
async function demuxDecode(): Promise<void> {
  let fmtCtx: FormatContext | null = null;
  let frame: Frame | null = null;
  let pkt: Packet | null = null;
  let ret = 0;

  try {
    // Open input file, and allocate format context
    fmtCtx = new FormatContext();
    ret = await fmtCtx.openInput(srcFilename, null, null);
    FFmpegError.throwIfError(ret, `Could not open source file ${srcFilename}`);

    // Retrieve stream information
    ret = await fmtCtx.findStreamInfo(null);
    FFmpegError.throwIfError(ret, `Could not find stream information: ${srcFilename}`);

    // Open video codec context
    const videoResult = await openCodecContext(fmtCtx, AV_MEDIA_TYPE_VIDEO);
    if (videoResult.streamIdx >= 0) {
      videoStreamIdx = videoResult.streamIdx;
      videoDecCtx = videoResult.decCtx;
      videoStream = videoResult.stream;

      videoDstFile = fs.openSync(videoDstFilename, 'w');

      // Allocate image where the decoded image will be put
      width = videoDecCtx!.width;
      height = videoDecCtx!.height;
      pixFmt = videoDecCtx!.pixelFormat;

      const allocResult = avImageAllocArrays(width, height, pixFmt, 1);
      videoDstData.push(...allocResult.data);
      videoDstLinesize.push(...allocResult.linesizes);
      videoDstBufsize = allocResult.size;
      if (videoDstBufsize <= 0) {
        throw new Error('Could not allocate raw video buffer');
      }
    }

    // Open audio codec context
    const audioResult = await openCodecContext(fmtCtx, AV_MEDIA_TYPE_AUDIO);
    if (audioResult.streamIdx >= 0) {
      audioStreamIdx = audioResult.streamIdx;
      audioDecCtx = audioResult.decCtx;
      audioStream = audioResult.stream;

      audioDstFile = fs.openSync(audioDstFilename, 'w');
    }

    // Dump input information to console
    fmtCtx.dumpFormat(0, srcFilename, false);

    if (!audioStream && !videoStream) {
      throw new Error('Could not find audio or video stream in the input, aborting');
    }

    frame = new Frame();
    frame.alloc();

    pkt = new Packet();
    pkt.alloc();

    if (videoStream) {
      console.log(`Demuxing video from file '${srcFilename}' into '${videoDstFilename}'`);
    }
    if (audioStream) {
      console.log(`Demuxing audio from file '${srcFilename}' into '${audioDstFilename}'`);
    }

    // Read frames from the file
    while ((await fmtCtx.readFrame(pkt)) >= 0) {
      // Check if the packet belongs to a stream we are interested in, otherwise skip it
      if (pkt.streamIndex === videoStreamIdx && videoDecCtx) {
        ret = await decodePacket(videoDecCtx, pkt, frame);
      } else if (pkt.streamIndex === audioStreamIdx && audioDecCtx) {
        ret = await decodePacket(audioDecCtx, pkt, frame);
      }
      pkt.unref();
      if (ret < 0) {
        break;
      }
    }

    // Flush the decoders
    if (videoDecCtx) {
      await decodePacket(videoDecCtx, null, frame);
    }
    if (audioDecCtx) {
      await decodePacket(audioDecCtx, null, frame);
    }

    console.log('Demuxing succeeded.');

    if (videoStream) {
      console.log('Play the output video file with the command:');
      console.log(`ffplay -f rawvideo -pix_fmt ${avGetPixFmtName(pixFmt)} -video_size ${width}x${height} ${videoDstFilename}`);
    }

    if (audioStream && audioDecCtx) {
      let sfmt = audioDecCtx.sampleFormat;
      let nChannels = audioDecCtx.channelLayout.nbChannels;

      if (avSampleFmtIsPlanar(sfmt)) {
        const packed = avGetSampleFmtName(sfmt);
        console.log(`Warning: the sample format the decoder produced is planar (${packed}). ` + 'This example will output the first channel only.');
        sfmt = avGetPackedSampleFmt(sfmt);
        nChannels = 1;
      }

      const fmt = getFormatFromSampleFmt(sfmt);
      if (fmt) {
        console.log('Play the output audio file with the command:');
        console.log(`ffplay -f ${fmt} -ac ${nChannels} -ar ${audioDecCtx.sampleRate} ${audioDstFilename}`);
      }
    }
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    // CodecContext objects are cleaned up automatically
    if (fmtCtx) {
      fmtCtx.closeInput();
    }
    if (videoDstFile !== null) {
      fs.closeSync(videoDstFile);
    }
    if (audioDstFile !== null) {
      fs.closeSync(audioDstFile);
    }
    if (pkt) {
      pkt.free();
    }
    if (frame) {
      frame.free();
    }
    // Free video dst data
    if (videoDstData[0]) {
      // videoDstData[0] is allocated by avImageAlloc
      // In TypeScript we don't need to free it explicitly as it's a Buffer
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.log('usage: tsx examples/demux-decode.ts <input_file> <video_output_file> <audio_output_file>');
    console.log('');
    console.log('API example program to show how to read frames from an input file.');
    console.log('This program reads frames from a file, decodes them, and writes decoded');
    console.log('video frames to a rawvideo file named video_output_file, and decoded');
    console.log('audio frames to a rawaudio file named audio_output_file.');
    console.log('');
    console.log('Example:');
    console.log('  tsx examples/demux-decode.ts input.mp4 output.yuv output.pcm');
    process.exit(1);
  }

  srcFilename = args[0];
  videoDstFilename = args[1];
  audioDstFilename = args[2];

  try {
    await demuxDecode();
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
