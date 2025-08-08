/**
 * Native binding type definitions
 * These types represent the internal C++ binding objects with their actual methods
 * @internal
 */

import type {
  AVCodecCap,
  AVCodecFlag,
  AVCodecFlag2,
  AVCodecID,
  AVColorRange,
  AVColorSpace,
  AVFieldOrder,
  AVMediaType,
  AVPixelFormat,
  AVSampleFormat,
} from './constants.js';
import type { Rational } from './rational.js';

// ============================================================================
// Native Codec Types
// ============================================================================

/**
 * Native AVCodec binding interface
 * @internal
 */
export interface NativeCodec {
  readonly __brand: 'NativeCodec';

  // Properties
  readonly name: string;
  readonly longName: string;
  readonly id: AVCodecID;
  readonly type: AVMediaType;
  readonly capabilities: AVCodecCap;

  // Methods
  isDecoder(): boolean;
  isEncoder(): boolean;
  getPixelFormats(): AVPixelFormat[];
  getSampleFormats(): AVSampleFormat[];
  getSampleRates(): number[];
  getChannelLayouts(): {
    nbChannels: number;
    order: number;
    mask: bigint;
  }[];
  getProfiles(): {
    profile: number;
    name?: string;
  }[];
}

/**
 * Native AVCodecContext binding interface
 * @internal
 */
export interface NativeCodecContext {
  readonly __brand: 'NativeCodecContext';

  // Lifecycle
  open(options?: NativeDictionary | null): void;
  close(): void;
  flushBuffers(): void;

  // Encoding/Decoding
  sendPacket(packet: NativePacket | null): number;
  receiveFrame(frame: NativeFrame): number;
  sendFrame(frame: NativeFrame | null): number;
  receivePacket(packet: NativePacket): number;

  // Properties
  codecID: AVCodecID;
  mediaType: AVMediaType;
  bitRate: bigint;
  timeBase: Rational;
  level: number;
  profile: number;
  threadCount: number;
  threadType: number;
  flags: AVCodecFlag;
  flags2: AVCodecFlag2;
  extraData: Buffer | null;

  // Video Properties
  width: number;
  height: number;
  pixelFormat: AVPixelFormat;
  framerate: Rational;
  sampleAspectRatio: Rational;
  gopSize: number;
  maxBFrames: number;
  colorSpace: AVColorSpace;
  colorRange: AVColorRange;

  // Audio Properties
  sampleRate: number;
  sampleFormat: AVSampleFormat;
  channelLayout: {
    nbChannels: number;
    order: number;
    mask: bigint;
  };
  readonly channels: number;
  frameSize: number;

  // Rate Control
  rcMaxRate: bigint;
  rcMinRate: bigint;
  rcBufferSize: number;

  // Utility
  readonly isEncoder: boolean;
  readonly isDecoder: boolean;
  readonly options: NativeOptions;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVCodecParameters binding interface
 * @internal
 */
export interface NativeCodecParameters {
  readonly __brand: 'NativeCodecParameters';

  // Properties
  codecType: AVMediaType;
  codecId: AVCodecID;
  codecTag: number;
  bitRate: bigint;
  width: number;
  height: number;
  format: number;
  sampleRate: number;
  channelLayout: {
    nbChannels: number;
    order: number;
    mask: bigint;
  };
  frameSize: number;
  profile: number;
  level: number;
  sampleAspectRatio: Rational;
  colorRange: AVColorRange;
  colorSpace: AVColorSpace;
  colorPrimaries: number;
  colorTransferCharacteristic: number;
  chromaLocation: number;
  fieldOrder: AVFieldOrder;
  extraData: Buffer | null;

  // Methods
  copy(dst: NativeCodecParameters): void;
  fromCodecContext(ctx: NativeCodecContext): void;
  toCodecContext(ctx: NativeCodecContext): void;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

// ============================================================================
// Native Container Types
// ============================================================================

/**
 * Native AVPacket binding interface
 * @internal
 */
export interface NativePacket {
  readonly __brand: 'NativePacket';

  // Properties
  streamIndex: number;
  pts: bigint;
  dts: bigint;
  duration: bigint;
  pos: bigint;
  size: number;
  flags: number;
  data: Buffer | null;

  // Methods
  ref(): void;
  unref(): void;
  rescaleTs(src: Rational, dst: Rational): void;
  clone(): NativePacket;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVFrame binding interface
 * @internal
 */
export interface NativeFrame {
  readonly __brand: 'NativeFrame';

  // Properties
  width: number;
  height: number;
  nbSamples: number;
  format: number;
  keyFrame: boolean;
  pictType: number;
  sampleAspectRatio: Rational;
  pts: bigint;
  pktDts: bigint;
  timeBase: Rational;
  sampleRate: number;
  channelLayout: {
    nbChannels: number;
    order: number;
    mask: bigint;
  };
  readonly channels: number;
  linesize: number[];
  data: Buffer | null;

  // Methods
  ref(): void;
  unref(): void;
  clone(): NativeFrame;
  makeWritable(): void;
  getData(plane: number): Buffer | null;
  setData(plane: number, data: Buffer): void;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

// ============================================================================
// Native Format Types
// ============================================================================

/**
 * Native AVFormatContext binding interface
 * @internal
 */
export interface NativeFormatContext {
  readonly __brand: 'NativeFormatContext';

  // Lifecycle
  openInput(url: string, inputFormat: NativeInputFormat | null, options: NativeDictionary | null): void;
  closeInput(): void;

  // Stream Discovery
  findStreamInfo(options: NativeDictionary | null): void;
  findBestStream(mediaType: AVMediaType, wantedStreamNb: number, relatedStream: number): number;

  // Reading
  readFrame(packet: NativePacket): number;
  seekFrame(streamIndex: number, timestamp: bigint, flags: number): number;
  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: number): number;
  flush(): void;

  // Writing
  writeHeader(options: NativeDictionary | null): void;
  writeFrame(packet: NativePacket | null): number;
  writeInterleavedFrame(packet: NativePacket | null): number;
  writeTrailer(): void;

  // Stream Management
  readonly streams: NativeStream[];
  readonly nbStreams: number;
  newStream(codec: NativeCodec | null): NativeStream;

  // Properties
  readonly url: string;
  readonly duration: bigint;
  readonly startTime: bigint;
  readonly bitRate: bigint;
  metadata: NativeDictionary;
  flags: number;
  maxAnalyzeDuration: bigint;
  probesize: bigint;
  readonly inputFormat: NativeInputFormat | null;
  readonly outputFormat: NativeOutputFormat | null;
  readonly options: NativeOptions;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVStream binding interface
 * @internal
 */
export interface NativeStream {
  readonly __brand: 'NativeStream';

  // Properties
  readonly index: number;
  id: number;
  timeBase: Rational;
  startTime: bigint;
  duration: bigint;
  nbFrames: bigint;
  disposition: number;
  discard: number;
  sampleAspectRatio: Rational;
  metadata: NativeDictionary;
  avgFrameRate: Rational;
  rFrameRate: Rational;
  readonly codecParameters: NativeCodecParameters;
  readonly options: NativeOptions;
}

/**
 * Native AVInputFormat binding interface
 * @internal
 */
export interface NativeInputFormat {
  readonly __brand: 'NativeInputFormat';

  readonly name: string;
  readonly longName: string;
  readonly extensions: string;
  readonly mimeType: string;
  readonly flags: number;
}

/**
 * Native AVOutputFormat binding interface
 * @internal
 */
export interface NativeOutputFormat {
  readonly __brand: 'NativeOutputFormat';

  readonly name: string;
  readonly longName: string;
  readonly extensions: string;
  readonly mimeType: string;
  readonly audioCodec: AVCodecID;
  readonly videoCodec: AVCodecID;
  readonly subtitleCodec: AVCodecID;
  readonly flags: number;
}

// ============================================================================
// Native Filter Types
// ============================================================================

/**
 * Native AVFilter binding interface
 * @internal
 */
export interface NativeFilter {
  readonly __brand: 'NativeFilter';

  readonly name: string;
  readonly description: string;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly flags: number;
}

/**
 * Native AVFilterContext binding interface
 * @internal
 */
export interface NativeFilterContext {
  readonly __brand: 'NativeFilterContext';

  // Methods
  link(srcPad: number, dst: NativeFilterContext, dstPad: number): void;
  unlink(srcPad: number): void;
  sendFrame(frame: NativeFrame | null): number;
  receiveFrame(frame: NativeFrame): number;

  // Properties
  readonly filter: NativeFilter;
  readonly name: string;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly options: NativeOptions;
}

/**
 * Native AVFilterGraph binding interface
 * @internal
 */
export interface NativeFilterGraph {
  readonly __brand: 'NativeFilterGraph';

  // Methods
  config(): void;
  createFilter(filter: NativeFilter, name: string, args: string | null): NativeFilterContext;
  getFilter(name: string): NativeFilterContext | null;
  parse(filters: string, inputs: NativeFilterContext[], outputs: NativeFilterContext[]): void;
  parsePtr(filters: string): { inputs: NativeFilterContext[]; outputs: NativeFilterContext[] };

  // Properties
  readonly nbFilters: number;
  readonly filters: NativeFilterContext[];
  threadType: number;
  nbThreads: number;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

// ============================================================================
// Native Processing Types
// ============================================================================

/**
 * Native SwsContext (software scale) binding interface
 * @internal
 */
export interface NativeSoftwareScaleContext {
  readonly __brand: 'NativeSoftwareScaleContext';

  scale(src: NativeFrame, dst: NativeFrame): void;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native SwrContext (software resample) binding interface
 * @internal
 */
export interface NativeSoftwareResampleContext {
  readonly __brand: 'NativeSoftwareResampleContext';

  convert(dst: NativeFrame, src: NativeFrame): number;
  getDelay(sampleRate: number): bigint;
  flush(dst: NativeFrame): number;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVAudioFifo binding interface
 * @internal
 */
export interface NativeAudioFifo {
  readonly __brand: 'NativeAudioFifo';

  write(frame: NativeFrame): number;
  read(frame: NativeFrame, nbSamples: number): number;
  readonly size: number;
  readonly space: number;
  reset(): void;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

// ============================================================================
// Native Hardware Types
// ============================================================================

/**
 * Native AVHWDeviceContext binding interface
 * @internal
 */
export interface NativeHardwareDeviceContext {
  readonly __brand: 'NativeHardwareDeviceContext';

  readonly type: number;
  deriveFrom(source: NativeHardwareDeviceContext, type: number, options: NativeDictionary | null): void;
}

/**
 * Native AVHWFramesContext binding interface
 * @internal
 */
export interface NativeHardwareFramesContext {
  readonly __brand: 'NativeHardwareFramesContext';

  readonly deviceContext: NativeHardwareDeviceContext;
  format: AVPixelFormat;
  swFormat: AVPixelFormat;
  width: number;
  height: number;
  initialPoolSize: number;

  init(): void;
  getBuffer(frame: NativeFrame, flags: number): void;
  transferDataFrom(dst: NativeFrame, src: NativeFrame): void;
  transferDataTo(dst: NativeFrame, src: NativeFrame): void;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

// ============================================================================
// Native Utility Types
// ============================================================================

/**
 * Native AVDictionary binding interface
 * @internal
 */
export interface NativeDictionary {
  readonly __brand: 'NativeDictionary';

  set(key: string, value: string, flags?: number): void;
  get(key: string, flags?: number): string | null;
  getAll(): Record<string, string>;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  copy(flags?: number): NativeDictionary;
  parseString(str: string, keyValSep?: string, pairsSep?: string, flags?: number): void;
  toString(keyValSep?: string, pairsSep?: string): string;
  readonly count: number;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVBitStreamFilter binding interface
 * @internal
 */
export interface NativeBitStreamFilter {
  readonly __brand: 'NativeBitStreamFilter';

  getName(): string;
  getCodecIds(): AVCodecID[] | null;
  getPrivClass(): string | null;
}

/**
 * Native AVBSFContext binding interface
 * @internal
 */
export interface NativeBitStreamFilterContext {
  readonly __brand: 'NativeBitStreamFilterContext';

  init(): void;
  sendPacket(packet: NativePacket | null): number;
  receivePacket(packet: NativePacket): number;
  flush(): void;
  readonly filter: NativeBitStreamFilter;
  timeBaseIn: Rational;
  timeBaseOut: Rational;
  free(): void;
  readonly codecParameters: NativeCodecParameters;

  // Symbol.dispose
  [Symbol.dispose](): void;
}

/**
 * Native AVOptions binding interface
 * @internal
 */
export interface NativeOptions {
  readonly __brand: 'NativeOptions';

  get(name: string, searchFlags?: number): string | null;
  set(name: string, value: string, searchFlags?: number): void;
  setInt(name: string, value: number | bigint, searchFlags?: number): void;
  setDouble(name: string, value: number, searchFlags?: number): void;
  setRational(name: string, value: Rational, searchFlags?: number): void;
  setImageSize(name: string, width: number, height: number, searchFlags?: number): void;
  setPixelFormat(name: string, format: AVPixelFormat, searchFlags?: number): void;
  setSampleFormat(name: string, format: AVSampleFormat, searchFlags?: number): void;
  setVideoRate(name: string, rate: Rational, searchFlags?: number): void;
  setChannelLayout(name: string, layout: bigint, searchFlags?: number): void;
  setDict(dict: NativeDictionary, searchFlags?: number): void;
}

/**
 * Base interface for wrapper classes that contain native bindings
 * @internal
 */
export interface NativeWrapper<T extends NativeBinding = NativeBinding> {
  getNative(): T;
}

/**
 * Native binding object - base type for all native bindings
 * @internal
 */
export type NativeBinding =
  | NativeCodecContext
  | NativeCodec
  | NativePacket
  | NativeFrame
  | NativeFormatContext
  | NativeStream
  | NativeCodecParameters
  | NativeDictionary
  | NativeFilter
  | NativeFilterContext
  | NativeFilterGraph
  | NativeInputFormat
  | NativeOutputFormat
  | NativeSoftwareScaleContext
  | NativeSoftwareResampleContext
  | NativeAudioFifo
  | NativeHardwareDeviceContext
  | NativeHardwareFramesContext
  | NativeBitStreamFilter
  | NativeBitStreamFilterContext
  | NativeOptions;
