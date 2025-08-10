/**
 * Native FFmpeg bindings interface
 * This module provides low-level access to FFmpeg functionality
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  NativeAudioFifo,
  NativeBitStreamFilter,
  NativeBitStreamFilterContext,
  NativeCodec,
  NativeCodecContext,
  NativeCodecParameters,
  NativeDictionary,
  NativeFilter,
  NativeFilterContext,
  NativeFilterGraph,
  NativeFormatContext,
  NativeFrame,
  NativeHardwareDeviceContext,
  NativeHardwareFramesContext,
  NativeInputFormat,
  NativeIOContext,
  NativeOption,
  NativeOptions,
  NativeOutputFormat,
  NativePacket,
  NativeSoftwareResampleContext,
  NativeSoftwareScaleContext,
  NativeStream,
} from './native-types.js';

import type { ChannelLayout } from './types.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const modulePath = join(__dirname, '../../build/Release/ffmpeg.node');

/**
 * Native bindings constructor interfaces
 */
type PacketConstructor = new () => NativePacket;

type FrameConstructor = new () => NativeFrame;

interface CodecConstructor {
  new (): NativeCodec;
  findDecoder(id: number): NativeCodec | null;
  findDecoderByName(name: string): NativeCodec | null;
  findEncoder(id: number): NativeCodec | null;
  findEncoderByName(name: string): NativeCodec | null;
  getAllCodecs(): NativeCodec[]; // Returns array of all codecs
}

type CodecContextConstructor = new (codec?: NativeCodec) => NativeCodecContext;

type CodecParametersConstructor = new () => NativeCodecParameters;

type DictionaryConstructor = new () => NativeDictionary;

interface FormatContextConstructor {
  new (): NativeFormatContext;
  allocFormatContext(): NativeFormatContext;
  allocOutputFormatContext(outputFormat: NativeOutputFormat | null, formatName?: string, filename?: string): NativeFormatContext;
}

type StreamConstructor = new () => NativeStream;

interface InputFormatConstructor {
  new (): NativeInputFormat;
  find(name: string): NativeInputFormat | null;
  getAll(): NativeInputFormat[];
}

interface OutputFormatConstructor {
  new (): NativeOutputFormat;
  find(name: string): NativeOutputFormat | null;
  guess(options?: { shortName?: string; filename?: string; mimeType?: string }): NativeOutputFormat | null;
  getAll(): NativeOutputFormat[];
}

interface FilterConstructor {
  new (): NativeFilter;
  findByName(name: string): NativeFilter | null;
  getAll(): NativeFilter[];
}

type FilterContextConstructor = new () => NativeFilterContext;

type FilterGraphConstructor = new () => NativeFilterGraph;

type SoftwareScaleContextConstructor = new (
  srcWidth: number,
  srcHeight: number,
  srcFormat: number,
  dstWidth: number,
  dstHeight: number,
  dstFormat: number,
  flags: number,
) => NativeSoftwareScaleContext;

type SoftwareResampleContextConstructor = new (
  srcChannelLayout: ChannelLayout,
  srcSampleRate: number,
  srcSampleFormat: number,
  dstChannelLayout: ChannelLayout,
  dstSampleRate: number,
  dstSampleFormat: number,
) => NativeSoftwareResampleContext;

interface HardwareDeviceContextConstructor {
  new (type: number, device?: string, options?: NativeDictionary, flags?: number): NativeHardwareDeviceContext;
  findTypeByName(name: string): number;
  getTypeName(type: number): string | null;
  getSupportedTypes(): { type: number; name: string }[];
}

type HardwareFramesContextConstructor = new (deviceContext: NativeHardwareDeviceContext) => NativeHardwareFramesContext;

interface AudioFifoConstructor {
  new (sampleFormat: number, channels: number, nbSamples: number): NativeAudioFifo;
  alloc(sampleFormat: number, channels: number, nbSamples: number): NativeAudioFifo;
}

type OptionConstructor = new () => NativeOption;

type OptionsConstructor = new () => NativeOptions;

interface BitStreamFilterConstructor {
  new (): NativeBitStreamFilter;
  getByName(name: string): NativeBitStreamFilter | null;
  iterate(opaque?: any): NativeBitStreamFilter | null;
}

type BitStreamFilterContextConstructor = new (filter: NativeBitStreamFilter) => NativeBitStreamFilterContext;

interface IOContextConstructor {
  new (): NativeIOContext;
  open(url: string, flags: number, options?: Record<string, string>): NativeIOContext;
}

/**
 * Complete native bindings interface with typed constructors
 */
export interface NativeBindings {
  // Utility functions
  setLogLevel(level: number): void;
  getLogLevel(): number;
  setLogCallback(callback: ((level: number, message: string) => void) | null): void;
  getVersion(): {
    avcodec: number;
    avformat: number;
    avutil: number;
    swscale: number;
    swresample: number;
  };
  getConfiguration(): {
    avcodec: string;
    avformat: string;
    avutil: string;
    swscale: string;
    swresample: string;
  };
  getLicense(): string;

  // Native class constructors with proper typing
  Packet: PacketConstructor;
  Frame: FrameConstructor;
  Codec: CodecConstructor;
  CodecContext: CodecContextConstructor;
  CodecParameters: CodecParametersConstructor;
  Dictionary: DictionaryConstructor;
  FormatContext: FormatContextConstructor;
  Stream: StreamConstructor;
  InputFormat: InputFormatConstructor;
  OutputFormat: OutputFormatConstructor;
  Filter: FilterConstructor;
  FilterContext: FilterContextConstructor;
  FilterGraph: FilterGraphConstructor;
  SoftwareScaleContext: SoftwareScaleContextConstructor;
  SoftwareResampleContext: SoftwareResampleContextConstructor;
  HardwareDeviceContext: HardwareDeviceContextConstructor;
  HardwareFramesContext: HardwareFramesContextConstructor;
  AudioFifo: AudioFifoConstructor;
  Option: OptionConstructor;
  Options: OptionsConstructor;
  BitStreamFilter: BitStreamFilterConstructor;
  BitStreamFilterContext: BitStreamFilterContextConstructor;
  IOContext: IOContextConstructor;
}

/**
 * Typed native bindings object
 */
const bindings = require(modulePath) as NativeBindings;

/**
 * Get FFmpeg version information
 */
export function getVersion(): {
  avcodec: number;
  avformat: number;
  avutil: number;
  swscale: number;
  swresample: number;
} {
  return bindings.getVersion();
}

/**
 * Get FFmpeg configuration
 */
export function getConfiguration(): {
  avcodec: string;
  avformat: string;
  avutil: string;
  swscale: string;
  swresample: string;
} {
  return bindings.getConfiguration();
}

/**
 * Get FFmpeg license
 */
export function getLicense(): string {
  return bindings.getLicense();
}

// Re-export native bindings for internal use
export { bindings };
