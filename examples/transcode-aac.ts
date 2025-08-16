#!/usr/bin/env tsx

/**
 * Audio transcoding to AAC in MP4 container Example - Low Level API
 *
 * Convert an input audio file to AAC in an MP4 container.
 * Formats other than MP4 are supported based on the output file extension.
 *
 * Usage: transcode-aac.ts <input file> <output file>
 * Example: tsx examples/transcode-aac.ts testdata/audio.wav examples/.tmp/transcode_aac.m4a
 */

import type { AVCodecFlag } from '../src/lib/index.js';
import {
  AudioFifo,
  AV_CHANNEL_LAYOUT_STEREO,
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_CODEC_ID_AAC,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_FMT_GLOBALHEADER,
  avSamplesAlloc,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  OutputFormat,
  Packet,
  Rational,
  SoftwareResampleContext,
} from '../src/lib/index.js';

// The output bit rate in bit/s
const OUTPUT_BIT_RATE = 96000;

// Global timestamp for the audio frames
let pts = 0n;

/**
 * Open an input file and the required decoder.
 */
async function openInputFile(filename: string): Promise<{
  inputFormatContext: FormatContext;
  inputCodecContext: CodecContext;
}> {
  const inputFormatContext = new FormatContext();

  // Open the input file to read from it
  const openRet = await inputFormatContext.openInput(filename, null, null);
  FFmpegError.throwIfError(openRet, `openInput '${filename}'`);

  // Get information on the input file (number of streams etc.)
  const streamInfoRet = await inputFormatContext.findStreamInfo(null);
  FFmpegError.throwIfError(streamInfoRet, 'findStreamInfo');

  // Make sure that there is only one stream in the input file
  if (inputFormatContext.nbStreams !== 1) {
    inputFormatContext.closeInput();
    throw new Error(`Expected one audio input stream, but found ${inputFormatContext.nbStreams}`);
  }

  const stream = inputFormatContext.streams![0];

  // Find a decoder for the audio stream
  const inputCodec = Codec.findDecoder(stream.codecpar.codecId);
  if (!inputCodec) {
    inputFormatContext.closeInput();
    throw new Error('Could not find input codec');
  }

  // Allocate a new decoding context
  const inputCodecContext = new CodecContext();
  inputCodecContext.allocContext3(inputCodec);

  // Initialize the stream parameters with demuxer information
  const paramRet = inputCodecContext.parametersToContext(stream.codecpar);
  FFmpegError.throwIfError(paramRet, 'parametersToContext');

  // Open the decoder for the audio stream to use it later
  const openCodecRet = await inputCodecContext.open2(inputCodec, null);
  FFmpegError.throwIfError(openCodecRet, 'open2 decoder');

  // Set the packet timebase for the decoder
  inputCodecContext.pktTimebase = stream.timeBase;

  return { inputFormatContext, inputCodecContext };
}

/**
 * Open an output file and the required encoder.
 * Also set some basic encoder parameters.
 */
async function openOutputFile(
  filename: string,
  inputCodecContext: CodecContext,
): Promise<{
  outputFormatContext: FormatContext;
  outputCodecContext: CodecContext;
}> {
  // Guess the desired container format based on the file extension
  const outputFormat = OutputFormat.guessFormat(null, filename, null);
  if (!outputFormat) {
    throw new Error('Could not find output file format');
  }

  // Create a new format context for the output container format
  const outputFormatContext = new FormatContext();
  outputFormatContext.allocOutputContext2(outputFormat, null, filename);

  // Find the encoder to be used by its name
  const outputCodec = Codec.findEncoder(AV_CODEC_ID_AAC);
  if (!outputCodec) {
    outputFormatContext.freeContext();
    throw new Error('Could not find an AAC encoder');
  }

  // Create a new audio stream in the output file container
  const stream = outputFormatContext.newStream(null);
  if (!stream) {
    outputFormatContext.freeContext();
    throw new Error('Could not create new stream');
  }

  // Allocate codec context
  const outputCodecContext = new CodecContext();
  outputCodecContext.allocContext3(outputCodec);

  // Set the basic encoder parameters
  // The input file's sample rate is used to avoid a sample rate conversion
  outputCodecContext.channelLayout = AV_CHANNEL_LAYOUT_STEREO;
  outputCodecContext.sampleRate = inputCodecContext.sampleRate;
  outputCodecContext.sampleFormat = outputCodec.sampleFormats![0];
  outputCodecContext.bitRate = BigInt(OUTPUT_BIT_RATE);

  // Set the sample rate for the container
  stream.timeBase = new Rational(1, inputCodecContext.sampleRate);

  // Some container formats (like MP4) require global headers to be present
  // Mark the encoder so that it behaves accordingly
  if (outputFormat.flags & AV_FMT_GLOBALHEADER) {
    outputCodecContext.flags = (outputCodecContext.flags | AV_CODEC_FLAG_GLOBAL_HEADER) as AVCodecFlag;
  }

  // Open the encoder for the audio stream to use it later
  const openRet = await outputCodecContext.open2(outputCodec, null);
  FFmpegError.throwIfError(openRet, 'open2 encoder');

  // Copy codec parameters to stream
  const paramRet = stream.codecpar.fromContext(outputCodecContext);
  FFmpegError.throwIfError(paramRet, 'fromContext');

  // Open output file
  const openOutputRet = outputFormatContext.openOutput();
  FFmpegError.throwIfError(openOutputRet, 'openOutput');

  return { outputFormatContext, outputCodecContext };
}

/**
 * Initialize the audio resampler based on the input and output codec settings.
 */
function initResampler(inputCodecContext: CodecContext, outputCodecContext: CodecContext): SoftwareResampleContext {
  const resampleContext = new SoftwareResampleContext();

  // Create a resampler context for the conversion
  const allocRet = resampleContext.allocSetOpts2(
    outputCodecContext.channelLayout,
    outputCodecContext.sampleFormat,
    outputCodecContext.sampleRate,
    inputCodecContext.channelLayout,
    inputCodecContext.sampleFormat,
    inputCodecContext.sampleRate,
  );

  FFmpegError.throwIfError(allocRet, 'allocSetOpts2');

  // Perform a sanity check so that the number of converted samples is
  // not greater than the number of samples to be converted
  if (outputCodecContext.sampleRate !== inputCodecContext.sampleRate) {
    resampleContext.free();
    throw new Error('Sample rate conversion is not supported in this example');
  }

  // Open the resampler with the specified parameters
  const initRet = resampleContext.init();
  FFmpegError.throwIfError(initRet, 'resampleContext.init');

  return resampleContext;
}

/**
 * Initialize a FIFO buffer for the audio samples to be encoded.
 */
function initFifo(outputCodecContext: CodecContext): AudioFifo {
  const fifo = new AudioFifo();

  // Create the FIFO buffer based on the specified output sample format
  fifo.alloc(outputCodecContext.sampleFormat, outputCodecContext.channelLayout.nbChannels, 1);

  return fifo;
}

/**
 * Decode one audio frame from the input file.
 */
async function decodeAudioFrame(inputFormatContext: FormatContext, inputCodecContext: CodecContext, frame: Frame): Promise<{ dataPresent: boolean; finished: boolean }> {
  const inputPacket = new Packet();
  inputPacket.alloc();

  let dataPresent = false;
  let finished = false;

  try {
    // Read one audio frame from the input file into a temporary packet
    const readRet = await inputFormatContext.readFrame(inputPacket);
    if (readRet < 0) {
      // If we are at the end of the file, flush the decoder below
      if (readRet === AV_ERROR_EOF) {
        finished = true;
      } else {
        FFmpegError.throwIfError(readRet, 'readFrame');
      }
    }

    // Send the audio frame stored in the temporary packet to the decoder
    const sendRet = await inputCodecContext.sendPacket(finished ? null : inputPacket);
    if (sendRet < 0 && sendRet !== AV_ERROR_EOF) {
      FFmpegError.throwIfError(sendRet, 'sendPacket');
    }

    // Receive one frame from the decoder
    const receiveRet = await inputCodecContext.receiveFrame(frame);

    if (receiveRet === AV_ERROR_EAGAIN) {
      // Decoder asks for more data
      dataPresent = false;
    } else if (receiveRet === AV_ERROR_EOF) {
      // End of input file reached
      finished = true;
    } else if (receiveRet < 0) {
      FFmpegError.throwIfError(receiveRet, 'receiveFrame');
    } else {
      // Success - we have decoded data
      dataPresent = true;
    }
  } finally {
    inputPacket.free();
  }

  return { dataPresent, finished };
}

/**
 * Convert the input audio samples into the output sample format.
 */
function convertSamples(inputData: Buffer[], convertedData: Buffer[], frameSize: number, resampleContext: SoftwareResampleContext): void {
  // Convert the samples using the resampler
  const convertRet = resampleContext.convert(convertedData, frameSize, inputData, frameSize);
  FFmpegError.throwIfError(convertRet, 'convert');
}

/**
 * Add converted input audio samples to the FIFO buffer for later processing.
 */
async function addSamplesToFifo(fifo: AudioFifo, convertedInputSamples: Buffer[], frameSize: number): Promise<void> {
  // Make the FIFO as large as it needs to be to hold both
  // the old and the new samples
  const currentSize = fifo.size;
  const reallocRet = fifo.realloc(currentSize + frameSize);
  FFmpegError.throwIfError(reallocRet, 'realloc FIFO');

  // Store the new samples in the FIFO buffer
  const writeRet = await fifo.write(convertedInputSamples, frameSize);
  if (writeRet < frameSize) {
    throw new Error('Could not write data to FIFO');
  }
}

/**
 * Read one audio frame from the input file, decode, convert and store
 * it in the FIFO buffer.
 */
async function readDecodeConvertAndStore(
  fifo: AudioFifo,
  inputFormatContext: FormatContext,
  inputCodecContext: CodecContext,
  outputCodecContext: CodecContext,
  resampleContext: SoftwareResampleContext,
): Promise<boolean> {
  const inputFrame = new Frame();
  inputFrame.alloc();

  try {
    // Decode one frame worth of audio samples
    const { dataPresent, finished } = await decodeAudioFrame(inputFormatContext, inputCodecContext, inputFrame);

    // If we are at the end of the file and there are no more samples
    // in the decoder which are delayed, we are actually finished
    if (finished) {
      return true;
    }

    // If there is decoded data, convert and store it
    if (dataPresent) {
      // Initialize the temporary storage for the converted input samples
      const { data: convertedInputSamples } = avSamplesAlloc(outputCodecContext.channelLayout.nbChannels, inputFrame.nbSamples, outputCodecContext.sampleFormat, 0);

      if (!convertedInputSamples) {
        throw new Error('Could not allocate converted input samples');
      }

      // Convert the input samples to the desired output sample format
      const inputData = inputFrame.extendedData ?? inputFrame.data ?? [];
      convertSamples(inputData, convertedInputSamples, inputFrame.nbSamples, resampleContext);

      // Add the converted input samples to the FIFO buffer for later processing
      await addSamplesToFifo(fifo, convertedInputSamples, inputFrame.nbSamples);
    }

    return false;
  } finally {
    inputFrame.free();
  }
}

/**
 * Encode one frame worth of audio to the output file.
 */
async function encodeAudioFrame(frame: Frame | null, outputFormatContext: FormatContext, outputCodecContext: CodecContext): Promise<boolean> {
  const outputPacket = new Packet();
  outputPacket.alloc();

  let dataPresent = false;

  try {
    // Set a timestamp based on the sample rate for the container
    if (frame) {
      frame.pts = pts;
      pts += BigInt(frame.nbSamples);
    }

    // Send the audio frame to the encoder
    const sendRet = await outputCodecContext.sendFrame(frame);
    if (sendRet < 0 && sendRet !== AV_ERROR_EOF) {
      FFmpegError.throwIfError(sendRet, 'sendFrame');
    }

    // Receive one encoded frame from the encoder
    const receiveRet = await outputCodecContext.receivePacket(outputPacket);

    if (receiveRet === AV_ERROR_EAGAIN) {
      // Encoder asks for more data
      dataPresent = false;
    } else if (receiveRet === AV_ERROR_EOF) {
      // Last frame has been encoded
      dataPresent = false;
    } else if (receiveRet < 0) {
      FFmpegError.throwIfError(receiveRet, 'receivePacket');
    } else {
      // Success - we have encoded data
      dataPresent = true;

      // Write one audio frame from the temporary packet to the output file
      const writeRet = await outputFormatContext.writeFrame(outputPacket);
      FFmpegError.throwIfError(writeRet, 'writeFrame');
    }
  } finally {
    outputPacket.free();
  }

  return dataPresent;
}

/**
 * Load one audio frame from the FIFO buffer, encode and write it to the
 * output file.
 */
async function loadEncodeAndWrite(fifo: AudioFifo, outputFormatContext: FormatContext, outputCodecContext: CodecContext): Promise<void> {
  // Use the maximum number of possible samples per frame
  // If there is less than the maximum possible frame size in the FIFO
  // buffer use this number. Otherwise, use the maximum possible frame size
  const frameSize = Math.min(fifo.size, outputCodecContext.frameSize);

  // Initialize temporary storage for one output frame
  const outputFrame = new Frame();
  outputFrame.alloc();
  outputFrame.nbSamples = frameSize;
  outputFrame.channelLayout = outputCodecContext.channelLayout;
  outputFrame.format = outputCodecContext.sampleFormat;
  outputFrame.sampleRate = outputCodecContext.sampleRate;

  // Allocate the samples of the created frame
  const bufferRet = outputFrame.getBuffer();
  FFmpegError.throwIfError(bufferRet, 'getBuffer');

  try {
    // Read as many samples from the FIFO buffer as required to fill the frame
    const data = outputFrame.data ?? [];
    const readRet = await fifo.read(data, frameSize);
    if (readRet < frameSize) {
      throw new Error('Could not read data from FIFO');
    }

    // Encode one frame worth of audio samples
    await encodeAudioFrame(outputFrame, outputFormatContext, outputCodecContext);
  } finally {
    outputFrame.free();
  }
}

/**
 * Main transcoding function
 */
async function transcodeAAC(inputFile: string, outputFile: string): Promise<void> {
  console.log(`Transcoding ${inputFile} to ${outputFile}...`);

  let inputFormatContext: FormatContext | null = null;
  let inputCodecContext: CodecContext | null = null;
  let outputFormatContext: FormatContext | null = null;
  let outputCodecContext: CodecContext | null = null;
  let resampleContext: SoftwareResampleContext | null = null;
  let fifo: AudioFifo | null = null;

  try {
    // Open the input file for reading
    const input = await openInputFile(inputFile);
    inputFormatContext = input.inputFormatContext;
    inputCodecContext = input.inputCodecContext;

    // Open the output file for writing
    const output = await openOutputFile(outputFile, inputCodecContext);
    outputFormatContext = output.outputFormatContext;
    outputCodecContext = output.outputCodecContext;

    // Initialize the resampler to be able to convert audio sample formats
    resampleContext = initResampler(inputCodecContext, outputCodecContext);

    // Initialize the FIFO buffer to store audio samples to be encoded
    fifo = initFifo(outputCodecContext);

    // Write the header of the output file container
    const headerRet = await outputFormatContext.writeHeader(null);
    FFmpegError.throwIfError(headerRet, 'writeHeader');

    // Loop as long as we have input samples to read or output samples to write
    while (true) {
      // Use the encoder's desired frame size for processing
      const outputFrameSize = outputCodecContext.frameSize;
      let finished = false;

      // Make sure that there is one frame worth of samples in the FIFO buffer
      // so that the encoder can do its work
      while (fifo.size < outputFrameSize) {
        // Decode one frame worth of audio samples, convert it to the
        // output sample format and put it into the FIFO buffer
        finished = await readDecodeConvertAndStore(fifo, inputFormatContext, inputCodecContext, outputCodecContext, resampleContext);

        // If we are at the end of the input file, we continue
        // encoding the remaining audio samples to the output file
        if (finished) {
          break;
        }
      }

      // If we have enough samples for the encoder, we encode them
      // At the end of the file, we pass the remaining samples to the encoder
      while (fifo.size >= outputFrameSize || (finished && fifo.size > 0)) {
        // Take one frame worth of audio samples from the FIFO buffer,
        // encode it and write it to the output file
        await loadEncodeAndWrite(fifo, outputFormatContext, outputCodecContext);
      }

      // If we are at the end of the input file and have encoded
      // all remaining samples, we can exit this loop and finish
      if (finished) {
        // Flush the encoder as it may have delayed frames
        let dataWritten = true;
        while (dataWritten) {
          dataWritten = await encodeAudioFrame(null, outputFormatContext, outputCodecContext);
        }
        break;
      }
    }

    // Write the trailer of the output file container
    const trailerRet = await outputFormatContext.writeTrailer();
    FFmpegError.throwIfError(trailerRet, 'writeTrailer');

    console.log('Transcoding completed successfully!');
  } finally {
    // Clean up resources
    if (fifo) {
      fifo.free();
    }
    if (resampleContext) {
      resampleContext.free();
    }
    if (outputCodecContext) {
      outputCodecContext.freeContext();
    }
    if (outputFormatContext) {
      outputFormatContext.closeOutput();
      outputFormatContext.freeContext();
    }
    if (inputCodecContext) {
      inputCodecContext.freeContext();
    }
    if (inputFormatContext) {
      inputFormatContext.closeInput();
    }
  }
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: transcode-aac.ts <input file> <output file>');
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  try {
    await transcodeAAC(inputFile, outputFile);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the program
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
