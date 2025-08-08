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
  NativeOptions,
  NativeOutputFormat,
  NativePacket,
  NativeSoftwareResampleContext,
  NativeSoftwareScaleContext,
  NativeStream,
} from './native-types.js';

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

interface DictionaryConstructor {
  new (): NativeDictionary;
  fromObject(obj: Record<string, string>): NativeDictionary;
}

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
  guess(options: { shortName?: string; filename?: string; mimeType?: string }): NativeOutputFormat | null;
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
  flags?: number,
) => NativeSoftwareScaleContext;

type SoftwareResampleContextConstructor = new (
  srcChannelLayout: { nbChannels: number; order: number; mask: bigint },
  srcSampleRate: number,
  srcSampleFormat: number,
  dstChannelLayout: { nbChannels: number; order: number; mask: bigint },
  dstSampleRate: number,
  dstSampleFormat: number,
) => NativeSoftwareResampleContext;

interface HardwareDeviceContextConstructor {
  new (type: number, device?: string, options?: NativeDictionary): NativeHardwareDeviceContext;
  findTypeByName(name: string): number;
  getTypeName(type: number): string | null;
  getSupportedTypes(): { type: number; name: string }[];
}

type HardwareFramesContextConstructor = new (deviceContext: NativeHardwareDeviceContext) => NativeHardwareFramesContext;

type AudioFifoConstructor = new (sampleFormat: number, channels: number, nbSamples: number) => NativeAudioFifo;

type OptionsConstructor = new () => NativeOptions;

interface BitStreamFilterConstructor {
  new (): NativeBitStreamFilter;
  getByName(name: string): NativeBitStreamFilter | null;
  iterate(opaque?: any): NativeBitStreamFilter | null; // Still uses iterate
}

type BitStreamFilterContextConstructor = new (filter: NativeBitStreamFilter) => NativeBitStreamFilterContext;

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
  Options: OptionsConstructor;
  BitStreamFilter: BitStreamFilterConstructor;
  BitStreamFilterContext: BitStreamFilterContextConstructor;
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

// Export native type interfaces for internal use
export type {
  NativeAudioFifo,
  NativeBinding,
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
  NativeOptions,
  NativeOutputFormat,
  NativePacket,
  NativeSoftwareResampleContext,
  NativeSoftwareScaleContext,
  NativeStream,
} from './native-types.js';
