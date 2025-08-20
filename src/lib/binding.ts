/**
 * Native bindings loader
 *
 * This module loads the native C++ bindings compiled by node-gyp.
 * All native classes are accessed through this single entry point.
 */

import { createRequire } from 'node:module';

import type { AVHWDeviceType, AVLogLevel, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type {
  NativeAudioFifo,
  NativeBitStreamFilter,
  NativeBitStreamFilterContext,
  NativeCodec,
  NativeCodecContext,
  NativeCodecParameters,
  NativeCodecParser,
  NativeDictionary,
  NativeFFmpegError,
  NativeFilter,
  NativeFilterContext,
  NativeFilterGraph,
  NativeFilterInOut,
  NativeFormatContext,
  NativeFrame,
  NativeHardwareDeviceContext,
  NativeHardwareFramesContext,
  NativeInputFormat,
  NativeIOContext,
  NativeLog,
  NativeOutputFormat,
  NativePacket,
  NativeSoftwareResampleContext,
  NativeSoftwareScaleContext,
  NativeStream,
} from './native-types.js';
import type { ChannelLayout, IRational } from './types.js';

const require = createRequire(import.meta.url);

// Constructor types for native bindings
type NativePacketConstructor = new () => NativePacket;

type NativeFrameConstructor = new () => NativeFrame;

interface NativeCodecConstructor {
  new (): NativeCodec;
  findDecoder(id: number): NativeCodec | null;
  findEncoder(id: number): NativeCodec | null;
  findDecoderByName(name: string): NativeCodec | null;
  findEncoderByName(name: string): NativeCodec | null;
  getCodecList(): NativeCodec[];
  iterateCodecs(opaque?: bigint | null): { codec: NativeCodec; opaque: bigint } | null;
}

type NativeCodecContextConstructor = new () => NativeCodecContext;

type NativeCodecParametersConstructor = new () => NativeCodecParameters;

type NativeCodecParserConstructor = new () => NativeCodecParser;

type NativeFormatContextConstructor = new () => NativeFormatContext;

type NativeStreamConstructor = new () => NativeStream;

interface NativeInputFormatConstructor {
  new (): NativeInputFormat;
  findInputFormat(shortName: string): NativeInputFormat | null;
}

interface NativeOutputFormatConstructor {
  new (): NativeOutputFormat;
  guessFormat(shortName: string | null, filename: string | null, mimeType: string | null): NativeOutputFormat | null;
}

type NativeIOContextConstructor = new () => NativeIOContext;

type NativeDictionaryConstructor = new () => NativeDictionary;

// Error handling
interface NativeFFmpegErrorConstructor {
  new (code?: number): NativeFFmpegError;
  strerror(errnum: number): string;
  makeError(posixError: number): number;
  isError(code: number): boolean;
}

interface NativeFilterConstructor {
  new (): NativeFilter;
  getByName(name: string): NativeFilter | null;
  getList(): NativeFilter[];
}

type NativeFilterContextConstructor = new () => NativeFilterContext;

type NativeFilterGraphConstructor = new () => NativeFilterGraph;

type NativeFilterInOutConstructor = new () => NativeFilterInOut;

// Bitstream Filters
interface NativeBitStreamFilterConstructor {
  new (): NativeBitStreamFilter;
  getByName(name: string): NativeBitStreamFilter | null;
  iterate(): NativeBitStreamFilter[];
}

type NativeBitStreamFilterContextConstructor = new () => NativeBitStreamFilterContext;

// Processing
type NativeAudioFifoConstructor = new () => NativeAudioFifo;
type NativeSoftwareScaleContextConstructor = new () => NativeSoftwareScaleContext;
type NativeSoftwareResampleContextConstructor = new () => NativeSoftwareResampleContext;

// Hardware
interface NativeHardwareDeviceContextConstructor {
  new (): NativeHardwareDeviceContext;
  getTypeName(type: AVHWDeviceType): string | null;
  iterateTypes(): AVHWDeviceType[];
  findTypeByName(name: string): AVHWDeviceType;
}

type NativeHardwareFramesContextConstructor = new () => NativeHardwareFramesContext;

interface NativeLogConstructor {
  new (): NativeLog;
  setLevel(level: AVLogLevel): void;
  getLevel(): AVLogLevel;
  log(level: AVLogLevel, message: string): void;
  setCallback(callback: ((level: AVLogLevel, message: string) => void) | null, options?: any): void;
  resetCallback(): void;
}

// Load the native addon
export const bindings = require('../../build/Release/ffmpeg.node') as {
  // Core Types
  Packet: NativePacketConstructor;
  Frame: NativeFrameConstructor;

  // Codec System
  Codec: NativeCodecConstructor;
  CodecContext: NativeCodecContextConstructor;
  CodecParameters: NativeCodecParametersConstructor;
  CodecParser: NativeCodecParserConstructor;

  // Format System
  FormatContext: NativeFormatContextConstructor;
  Stream: NativeStreamConstructor;
  InputFormat: NativeInputFormatConstructor;
  OutputFormat: NativeOutputFormatConstructor;
  IOContext: NativeIOContextConstructor;

  // Filter System
  Filter: NativeFilterConstructor;
  FilterContext: NativeFilterContextConstructor;
  FilterGraph: NativeFilterGraphConstructor;
  FilterInOut: NativeFilterInOutConstructor;

  // Bitstream Filters
  BitStreamFilter: NativeBitStreamFilterConstructor;
  BitStreamFilterContext: NativeBitStreamFilterContextConstructor;

  // Processing
  AudioFifo: NativeAudioFifoConstructor;
  SoftwareScaleContext: NativeSoftwareScaleContextConstructor;
  SoftwareResampleContext: NativeSoftwareResampleContextConstructor;

  // Hardware
  HardwareDeviceContext: NativeHardwareDeviceContextConstructor;
  HardwareFramesContext: NativeHardwareFramesContextConstructor;

  // Utility
  Dictionary: NativeDictionaryConstructor;
  FFmpegError: NativeFFmpegErrorConstructor;

  // Logging
  Log: NativeLogConstructor;

  // Functions
  getVersion: () => string;

  // Utility functions
  avGetBytesPerSample: (sampleFmt: AVSampleFormat) => number;
  avGetSampleFmtName: (sampleFmt: AVSampleFormat) => string | null;
  avGetPackedSampleFmt: (sampleFmt: AVSampleFormat) => AVSampleFormat;
  avGetPlanarSampleFmt: (sampleFmt: AVSampleFormat) => AVSampleFormat;
  avSampleFmtIsPlanar: (sampleFmt: AVSampleFormat) => boolean;
  avGetPixFmtName: (pixFmt: AVPixelFormat) => string | null;
  avGetPixFmtFromName: (name: string) => number;
  avIsHardwarePixelFormat: (pixFmt: AVPixelFormat) => boolean;
  avGetMediaTypeString: (mediaType: AVMediaType) => string | null;
  avImageAlloc: (width: number, height: number, pixFmt: AVPixelFormat, align: number) => { buffer: Buffer; size: number; linesizes: number[] } | number;
  avImageCopy2: (dstData: Buffer[], dstLinesizes: number[], srcData: Buffer[], srcLinesizes: number[], pixFmt: AVPixelFormat, width: number, height: number) => void;
  avImageGetBufferSize: (pixFmt: AVPixelFormat, width: number, height: number, align: number) => number;
  avImageCopyToBuffer: (
    dst: Buffer,
    dstSize: number,
    srcData: Buffer[] | null,
    srcLinesize: number[] | null,
    pixFmt: AVPixelFormat,
    width: number,
    height: number,
    align: number,
  ) => number;
  avTs2Str: (ts: bigint | number | null) => string;
  avTs2TimeStr: (ts: bigint | number | null, timeBase: IRational) => string;
  avCompareTs: (tsA: bigint | number | null, tbA: IRational, tsB: bigint | number | null, tbB: IRational) => number;
  avRescaleQ: (a: bigint | number | null, bq: IRational, cq: IRational) => bigint;
  avRescaleRnd: (a: bigint | number, b: bigint | number, c: bigint | number, rnd: number) => bigint;
  avUsleep: (usec: number) => void;
  avSamplesAlloc: (nbChannels: number, nbSamples: number, sampleFmt: AVSampleFormat, align: number) => { data: Buffer[]; linesize: number; size: number } | number;
  avSamplesGetBufferSize: (nbChannels: number, nbSamples: number, sampleFmt: AVSampleFormat, align: number) => { size: number; linesize: number } | number;
  avChannelLayoutDescribe: (channelLayout: Partial<ChannelLayout>) => string | null;
};
