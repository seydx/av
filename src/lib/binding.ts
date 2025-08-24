/**
 * Native bindings loader
 *
 * This module loads the native C++ bindings compiled by node-gyp.
 * All native classes are accessed through this single entry point.
 */

import { createRequire } from 'node:module';

import type { AVHWDeviceType, AVLogLevel, AVMediaType, AVOptionSearchFlags, AVPixelFormat, AVSampleFormat } from './constants.js';
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
  NativeOption,
  NativeOutputFormat,
  NativePacket,
  NativeSoftwareResampleContext,
  NativeSoftwareScaleContext,
  NativeStream,
} from './native-types.js';
import type { ChannelLayout, IRational } from './types.js';

/**
 * Union type for all native FFmpeg objects that support AVOptions.
 *
 * These objects have an AVClass structure as their first member,
 * which enables the AVOption API for runtime configuration.
 */
export type OptionCapableObject =
  | NativeCodecContext
  | NativeFormatContext
  | NativeFilterContext
  | NativeFilterGraph
  | NativeSoftwareScaleContext
  | NativeSoftwareResampleContext
  | NativeIOContext
  | NativeBitStreamFilterContext;

const require = createRequire(import.meta.url);

// Load the native binary directly from binary folder
// This will be downloaded by postinstall script
const nativeBinding = require('../../binary/av.node');

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
  probe(buffer: Buffer, filename?: string): NativeInputFormat | null;
  probeBuffer(ioContext: NativeIOContext, maxProbeSize?: number): Promise<NativeInputFormat | null>;
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

// Option system - static utility class
// This is not a constructor but a collection of static methods for the AVOption API
interface NativeOptionStatic {
  // Iteration
  next(obj: OptionCapableObject, prev?: NativeOption): NativeOption | null;
  find(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): NativeOption | null;
  find2(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): { option: NativeOption; isDifferentTarget: boolean } | null;

  // Getters
  get(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): string | null;
  getInt(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): number | null;
  getDouble(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): number | null;
  getRational(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): IRational | null;
  getPixelFormat(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): AVPixelFormat | null;
  getSampleFormat(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): AVSampleFormat | null;
  getImageSize(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): { width: number; height: number } | null;
  getChannelLayout(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): ChannelLayout | null;
  getDict(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): NativeDictionary | null;

  // Setters
  set(obj: OptionCapableObject, name: string, value: string, searchFlags?: AVOptionSearchFlags): number;
  setInt(obj: OptionCapableObject, name: string, value: number | bigint, searchFlags?: AVOptionSearchFlags): number;
  setDouble(obj: OptionCapableObject, name: string, value: number, searchFlags?: AVOptionSearchFlags): number;
  setRational(obj: OptionCapableObject, name: string, value: { num: number; den: number }, searchFlags?: AVOptionSearchFlags): number;
  setPixelFormat(obj: OptionCapableObject, name: string, value: number, searchFlags?: AVOptionSearchFlags): number;
  setSampleFormat(obj: OptionCapableObject, name: string, value: number, searchFlags?: AVOptionSearchFlags): number;
  setImageSize(obj: OptionCapableObject, name: string, width: number, height: number, searchFlags?: AVOptionSearchFlags): number;
  setChannelLayout(obj: OptionCapableObject, name: string, value: number, searchFlags?: AVOptionSearchFlags): number;
  setDict(obj: OptionCapableObject, name: string, value: NativeDictionary, searchFlags?: AVOptionSearchFlags): number;
  setBin(obj: OptionCapableObject, name: string, value: Buffer, searchFlags?: AVOptionSearchFlags): number;

  // Utility
  setDefaults(obj: OptionCapableObject): void;
  copy(dest: OptionCapableObject, src: OptionCapableObject): number;
  isSetToDefault(obj: OptionCapableObject, name: string, searchFlags?: AVOptionSearchFlags): boolean | null;
  serialize(obj: OptionCapableObject, optFlags?: number, flags?: number, keyValSep?: string, pairsSep?: string): string | null;
  free(obj: OptionCapableObject): void;
  show(obj: OptionCapableObject, reqFlags?: number, rejFlags?: number): number;
}

// Export the loaded native bindings
export const bindings = nativeBinding as {
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

  // Option system
  Option: NativeOptionStatic;

  // Functions
  getVersion: () => string;

  // Utility functions
  avGetBytesPerSample: (sampleFmt: AVSampleFormat) => number;
  avGetSampleFmtName: (sampleFmt: AVSampleFormat) => string | null;
  avGetPackedSampleFmt: (sampleFmt: AVSampleFormat) => AVSampleFormat;
  avGetPlanarSampleFmt: (sampleFmt: AVSampleFormat) => AVSampleFormat;
  avSampleFmtIsPlanar: (sampleFmt: AVSampleFormat) => boolean;
  avGetPixFmtName: (pixFmt: AVPixelFormat) => string | null;
  avGetPixFmtFromName: (name: string) => AVPixelFormat;
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
  avSdpCreate: (contexts: NativeFormatContext[]) => string | null;
};
