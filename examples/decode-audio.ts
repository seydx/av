#!/usr/bin/env tsx

/**
 * Decode Audio Example - Low Level API
 *
 * Port of FFmpeg's doc/examples/decode_audio.c
 * Decode data from an MP2 input file and generate a raw audio file.
 *
 * Usage: tsx examples/decode-audio.ts <input> <output>
 * Example: tsx examples/decode-audio.ts testdata/audio.mp2 examples/.tmp/decode_audio.pcm
 *
 * Play the output with:
 * ffplay -f f32le -ac 2 -ar 44100 output.raw
 *
 * Note: Input should be raw MP2 audio stream (not in a container).
 * For testing, you can extract raw audio from a container:
 * ffmpeg -i input.mp3 -c:a mp2 -f mp2 test.mp2
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';

import {
  AVERROR_EAGAIN,
  AVERROR_EOF,
  AV_CODEC_ID_MP2,
  AV_INPUT_BUFFER_PADDING_SIZE,
  AV_NOPTS_VALUE,
  AV_SAMPLE_FMT_DBL,
  AV_SAMPLE_FMT_DBLP,
  AV_SAMPLE_FMT_FLT,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
  AV_SAMPLE_FMT_S16P,
  AV_SAMPLE_FMT_S32,
  AV_SAMPLE_FMT_S32P,
  AV_SAMPLE_FMT_U8,
  AV_SAMPLE_FMT_U8P,
  Codec,
  CodecContext,
  CodecParser,
  FFmpegError,
  Frame,
  Packet,
  avGetBytesPerSample,
} from '../src/lib/index.js';

import type { AVSampleFormat } from '../src/lib/index.js';

const AUDIO_INBUF_SIZE = 20480;
const AUDIO_REFILL_THRESH = 4096;

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
    // Planar formats - we'll output them as interleaved
    { sampleFmt: AV_SAMPLE_FMT_U8P, fmtBe: 'u8', fmtLe: 'u8' },
    { sampleFmt: AV_SAMPLE_FMT_S16P, fmtBe: 's16be', fmtLe: 's16le' },
    { sampleFmt: AV_SAMPLE_FMT_S32P, fmtBe: 's32be', fmtLe: 's32le' },
    { sampleFmt: AV_SAMPLE_FMT_FLTP, fmtBe: 'f32be', fmtLe: 'f32le' },
    { sampleFmt: AV_SAMPLE_FMT_DBLP, fmtBe: 'f64be', fmtLe: 'f64le' },
  ];

  for (const entry of sampleFmtEntries) {
    if (sampleFmt === entry.sampleFmt) {
      // Use little-endian on most systems
      return entry.fmtLe;
    }
  }

  console.error(`Sample format ${sampleFmt} is not supported as output format`);
  return null;
}

/**
 * Decode packets and write raw audio data
 */
async function decode(decCtx: CodecContext, pkt: Packet | null, frame: Frame, outfile: number): Promise<void> {
  // Send the packet with the compressed data to the decoder
  const sendRet = await decCtx.sendPacket(pkt);
  FFmpegError.throwIfError(sendRet, 'Error submitting the packet to the decoder');

  // Read all the output frames (in general there may be any number of them)
  while (true) {
    const ret = await decCtx.receiveFrame(frame);
    if (FFmpegError.is(ret, AVERROR_EAGAIN) || FFmpegError.is(ret, AVERROR_EOF)) {
      return;
    }
    FFmpegError.throwIfError(ret, 'Error during decoding');

    const sampleFormat = decCtx.sampleFormat;
    const dataSize = avGetBytesPerSample(sampleFormat);
    if (dataSize < 0) {
      throw new Error(`Failed to calculate data size for sample format ${sampleFormat}`);
    }

    // Get channel layout
    const channelLayout = decCtx.channelLayout;
    const nbChannels = channelLayout?.nbChannels || 2;

    // Write interleaved audio data
    const frameData = frame.data;
    if (!frameData) {
      console.error('No frame data available');
      continue;
    }

    // For planar audio, we need to interleave the channels
    for (let i = 0; i < frame.nbSamples; i++) {
      for (let ch = 0; ch < nbChannels; ch++) {
        if (frameData[ch]) {
          const offset = dataSize * i;
          const sample = frameData[ch].subarray(offset, offset + dataSize);
          fs.writeSync(outfile, sample);
        }
      }
    }
  }
}

/**
 * Main decode audio function
 */
async function decodeAudio(inputFile: string, outputFile: string): Promise<void> {
  let codec: Codec | null = null;
  let codecCtx: CodecContext | null = null;
  let parser: CodecParser | null = null;
  let packet: Packet | null = null;
  let decodedFrame: Frame | null = null;
  let infile: number | null = null;
  let outfile: number | null = null;

  try {
    // Allocate packet
    packet = new Packet();
    packet.alloc();

    // Find the MP2 audio decoder
    codec = Codec.findDecoder(AV_CODEC_ID_MP2);
    if (!codec) {
      throw new Error('MP2 codec not found');
    }

    // Initialize parser
    parser = new CodecParser();
    parser.init(codec.id);

    // Allocate codec context
    codecCtx = new CodecContext();
    codecCtx.allocContext3(codec);

    // Open codec
    const openRet = await codecCtx.open2(codec, null);
    FFmpegError.throwIfError(openRet, 'Could not open codec');

    // Open input file
    infile = fs.openSync(inputFile, 'r');

    // Open output file
    outfile = fs.openSync(outputFile, 'w');

    // Allocate frame
    decodedFrame = new Frame();
    decodedFrame.alloc();

    // Input buffer with padding
    const inbuf = Buffer.alloc(AUDIO_INBUF_SIZE + AV_INPUT_BUFFER_PADDING_SIZE);

    // Read initial data
    let dataOffset = 0;
    let dataSize = fs.readSync(infile, inbuf, 0, AUDIO_INBUF_SIZE, null);

    while (dataSize > 0) {
      // Parse audio data
      const parseRet = parser.parse2(codecCtx, packet, inbuf.subarray(dataOffset, dataOffset + dataSize), AV_NOPTS_VALUE, AV_NOPTS_VALUE, 0);

      FFmpegError.throwIfError(parseRet, 'Error while parsing');

      dataOffset += parseRet;
      dataSize -= parseRet;

      // If we have a complete packet, decode it
      if (packet.size > 0) {
        await decode(codecCtx, packet, decodedFrame, outfile);
      }

      // Refill buffer if needed
      if (dataSize < AUDIO_REFILL_THRESH) {
        // Move remaining data to beginning of buffer
        if (dataSize > 0) {
          inbuf.copy(inbuf, 0, dataOffset, dataOffset + dataSize);
        }
        dataOffset = 0;

        // Read more data
        const len = fs.readSync(infile, inbuf, dataSize, AUDIO_INBUF_SIZE - dataSize, null);
        if (len > 0) {
          dataSize += len;
        } else {
          // No more data to read
          break;
        }
      }
    }

    // Flush the decoder
    console.log('Flushing decoder...');
    await decode(codecCtx, null, decodedFrame, outfile);

    // Print output PCM information
    const sfmt = codecCtx.sampleFormat;
    const sampleRate = codecCtx.sampleRate;
    const channelLayout = codecCtx.channelLayout;
    const nChannels = channelLayout?.nbChannels || 2;

    // Check if format is planar
    const isPlanar = sfmt >= 5; // Planar formats start at index 5 in FFmpeg
    if (isPlanar) {
      console.log('Info: The decoder produced planar audio format.');
      console.log('      This example correctly interleaves all channels for output.');
    }

    const fmt = getFormatFromSampleFmt(sfmt);
    if (fmt) {
      console.log('Play the output audio file with the command:');
      console.log(`ffplay -f ${fmt} -ac ${nChannels} -ar ${sampleRate} ${outputFile}`);
    }

    console.log('Audio decoding completed successfully!');
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    // Cleanup
    if (infile !== null) {
      fs.closeSync(infile);
    }
    if (outfile !== null) {
      fs.closeSync(outfile);
    }
    if (parser) {
      parser.close();
    }
    if (codecCtx) {
      codecCtx.freeContext();
    }
    if (decodedFrame) {
      decodedFrame.free();
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
    console.log('Usage: tsx examples/decode-audio.ts <input> <output>');
    console.log('Example: tsx examples/decode-audio.ts input.mp2 output.raw');
    console.log('');
    console.log('Note: Input should be raw MP2 audio stream.');
    console.log('You can create one with:');
    console.log('  ffmpeg -i input.mp3 -c:a mp2 -f mp2 test.mp2');
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    await decodeAudio(inputFile, outputFile);
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
