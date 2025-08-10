/**
 * Native FFmpeg Binding Type Definitions
 * =======================================
 *
 * This file contains all TypeScript interfaces for the native C++ FFmpeg bindings.
 * These interfaces represent the exact API surface exposed by the C++ layer.
 *
 * IMPORTANT:
 * - These are internal interfaces - users should use the wrapper classes in lib/
 * - All interfaces map 1:1 to C++ binding implementations
 * - Properties marked as readonly only have getters in C++
 * - Resource-owning classes provide both free() and Symbol.dispose for cleanup
 * - Descriptors (Codec, Filter, InputFormat, OutputFormat, Option) don't need cleanup
 *
 * @internal
 * @packageDocumentation
 */

import type { CodecHardwareConfig, CodecProfile } from './codec.js';
import type {
  AVChromaLocation,
  AVCodecCap,
  AVCodecFlag,
  AVCodecFlag2,
  AVCodecID,
  AVColorPrimaries,
  AVColorRange,
  AVColorSpace,
  AVColorTransferCharacteristic,
  AVDiscard,
  AVDisposition,
  AVFilterFlag,
  AVFormatFlag,
  AVFormatFlags,
  AVHWDeviceType,
  AVIOFlag,
  AVMediaType,
  AVOptionFlag,
  AVOptionType,
  AVPacketFlag,
  AVPictureType,
  AVPixelFormat,
  AVSampleFormat,
  SWSFlag,
} from './constants.js';
import type { ChannelLayout } from './types.js';

// ============================================================================
// CODEC AND ENCODING/DECODING
// ============================================================================

/**
 * Native AVCodec binding interface
 *
 * Represents a codec (encoder or decoder) definition.
 * This is an immutable descriptor - actual encoding/decoding happens via CodecContext.
 *
 * @internal
 */
export interface NativeCodec {
  readonly __brand: 'NativeCodec';

  // ===== Properties =====
  // All properties are readonly - codec definitions are immutable
  readonly name: string | null;
  readonly longName: string | null;
  readonly id: AVCodecID;
  readonly type: AVMediaType;
  readonly capabilities: AVCodecCap;

  // ===== Methods =====
  isDecoder(): boolean;
  isEncoder(): boolean;
  getPixelFormats(): AVPixelFormat[];
  getSampleFormats(): AVSampleFormat[];
  getSampleRates(): number[];
  getChannelLayouts(): ChannelLayout[];
  getProfiles(): CodecProfile[];
  getHardwareConfigs(): CodecHardwareConfig[];

  // Note: No Symbol.dispose - codec definitions don't need cleanup
}

/**
 * Native AVCodecContext binding interface
 *
 * The main interface for encoding and decoding operations.
 * Must be opened before use and properly disposed after.
 *
 * @internal
 */
export interface NativeCodecContext extends Disposable {
  readonly __brand: 'NativeCodecContext';

  // ===== Lifecycle Methods =====
  open(options?: NativeDictionary | null): void;
  openAsync(options?: NativeDictionary | null): Promise<void>;
  close(): void;
  flushBuffers(): void;

  // ===== Encoding/Decoding Methods (Synchronous) =====
  sendPacket(packet: NativePacket | null): number;
  receiveFrame(frame: NativeFrame): number;
  sendFrame(frame: NativeFrame | null): number;
  receivePacket(packet: NativePacket): number;

  // ===== Encoding/Decoding Methods (Asynchronous) =====
  sendPacketAsync(packet: NativePacket | null): Promise<number>;
  receiveFrameAsync(frame: NativeFrame): Promise<number>;
  sendFrameAsync(frame: NativeFrame | null): Promise<number>;
  receivePacketAsync(packet: NativePacket): Promise<number>;

  // ===== General Properties =====
  codecID: AVCodecID;
  mediaType: AVMediaType;
  bitRate: bigint;
  timeBase: { num: number; den: number };
  level: number;
  profile: number;
  threadCount: number;
  threadType: number;
  flags: AVCodecFlag;
  flags2: AVCodecFlag2;
  extraData: Buffer | null;

  // ===== Video Properties =====
  width: number;
  height: number;
  pixelFormat: AVPixelFormat;
  framerate: { num: number; den: number };
  sampleAspectRatio: { num: number; den: number };
  gopSize: number;
  maxBFrames: number;
  colorSpace: AVColorSpace;
  colorRange: AVColorRange;

  // ===== Audio Properties =====
  sampleRate: number;
  sampleFormat: AVSampleFormat;
  channelLayout: ChannelLayout;
  readonly channels: number; // Computed from channelLayout
  frameSize: number;

  // ===== Rate Control Properties =====
  rcMaxRate: bigint;
  rcMinRate: bigint;
  rcBufferSize: number;

  // ===== Utility Properties =====
  readonly isEncoder: boolean;
  readonly isDecoder: boolean;
  readonly options: NativeOptions;

  // ===== Hardware Acceleration =====
  hwDeviceContext: any;
  hwFramesContext: any;
  setHardwarePixelFormat(format: AVPixelFormat): void;
  setHardwareConfig(config: { preferredFormat?: AVPixelFormat; fallbackFormats?: AVPixelFormat[]; requireHardware?: boolean }): void;
  clearHardwareConfig(): void;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVCodecParameters binding interface
 *
 * Codec parameters that can be copied between streams and codec contexts.
 * Used for stream configuration and codec initialization.
 *
 * @internal
 */
export interface NativeCodecParameters extends Disposable {
  readonly __brand: 'NativeCodecParameters';

  // ===== Properties =====
  // All properties are read-write for configuration
  codecType: AVMediaType;
  codecId: AVCodecID;
  codecTag: number;
  bitRate: bigint;
  width: number;
  height: number;
  format: AVPixelFormat | AVSampleFormat; // Depends on codecType
  sampleRate: number;
  channelLayout: ChannelLayout;
  frameSize: number;
  profile: number;
  level: number;
  sampleAspectRatio: { num: number; den: number };
  colorRange: AVColorRange;
  colorSpace: AVColorSpace;
  colorPrimaries: AVColorPrimaries;
  colorTransferCharacteristic: AVColorTransferCharacteristic;
  chromaLocation: AVChromaLocation;
  extraData: Buffer | null;

  // ===== Methods =====
  copy(dst: NativeCodecParameters): void;
  fromCodecContext(ctx: NativeCodecContext): void;
  toCodecContext(ctx: NativeCodecContext): void;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

// ============================================================================
// DATA CONTAINERS
// ============================================================================

/**
 * Native AVPacket binding interface
 *
 * Container for compressed data (one frame of compressed audio/video).
 * Used as input for decoders and output from encoders.
 *
 * @internal
 */
export interface NativePacket extends Disposable {
  readonly __brand: 'NativePacket';

  // ===== Properties =====
  streamIndex: number;
  pts: bigint;
  dts: bigint;
  duration: bigint;
  pos: bigint;
  flags: AVPacketFlag;
  data: Buffer | null;
  readonly size: number; // Computed from data

  // ===== Methods =====
  rescaleTs(src: { num: number; den: number }, dst: { num: number; den: number }): void;
  clone(): NativePacket;
  unref(): void; // Clear data but keep structure for reuse

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVFrame binding interface
 *
 * Container for uncompressed data (raw audio samples or video pixels).
 * Used as output from decoders and input to encoders.
 *
 * @internal
 */
export interface NativeFrame extends Disposable {
  readonly __brand: 'NativeFrame';

  // ===== Common Properties =====
  pts: bigint;
  pktDts: bigint;
  pktPos: bigint;
  pktDuration: bigint;
  keyFrame: boolean;
  pictType: AVPictureType;
  readonly bestEffortTimestamp: bigint; // Computed property

  // ===== Video Properties =====
  width: number;
  height: number;
  format: AVPixelFormat | AVSampleFormat; // Union type for video/audio
  sampleAspectRatio: { num: number; den: number };
  colorRange: AVColorRange;
  colorSpace: AVColorSpace;

  // ===== Audio Properties =====
  nbSamples: number;
  sampleRate: number;
  channelLayout: ChannelLayout;

  // ===== Data Access =====
  readonly data: (Buffer | null)[]; // Array of buffers, one per plane
  readonly linesize: number[]; // Array of line sizes, one per plane

  // ===== Methods =====
  clone(): NativeFrame;
  makeWritable(): void;
  getBuffer(): Buffer | null;
  allocBuffer(align?: number): void;
  unref(): void; // Clear data but keep structure for reuse

  // ===== Hardware Acceleration =====
  transferDataTo(dst: NativeFrame): void;
  transferDataFrom(src: NativeFrame): void;
  hwFramesContext: any;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

// ============================================================================
// CONTAINER FORMATS AND I/O
// ============================================================================

/**
 * Native AVFormatContext binding interface
 *
 * Main interface for reading and writing multimedia container formats.
 * Handles demuxing (reading) and muxing (writing) of media files.
 *
 * @internal
 */
export interface NativeFormatContext extends Disposable {
  readonly __brand: 'NativeFormatContext';

  // ===== Lifecycle Methods =====
  openInput(url: string, inputFormat: NativeInputFormat | null, options: NativeDictionary | null): void;
  openInputAsync(url: string, inputFormat: NativeInputFormat | null, options: NativeDictionary | null): Promise<void>;
  closeInput(): void;

  // ===== Stream Discovery =====
  findStreamInfo(options: NativeDictionary | null): void;
  findStreamInfoAsync(options: NativeDictionary | null): Promise<void>;
  findBestStream(mediaType: AVMediaType, wantedStreamNb: number, relatedStream: number): number;

  // ===== Reading Methods =====
  readFrame(packet: NativePacket): number;
  readFrameAsync(packet: NativePacket): Promise<number>;
  seekFrame(streamIndex: number, timestamp: bigint, flags: number): number;
  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: number): number;
  flush(): void;

  // ===== Writing Methods =====
  writeHeader(options: NativeDictionary | null): void;
  writeHeaderAsync(options: NativeDictionary | null): Promise<void>;
  writeFrame(packet: NativePacket | null): number;
  writeFrameAsync(packet: NativePacket | null): Promise<number>;
  writeInterleavedFrame(packet: NativePacket | null): number;
  writeInterleavedFrameAsync(packet: NativePacket | null): Promise<number>;
  writeTrailer(): void;
  writeTrailerAsync(): Promise<void>;

  // ===== Stream Management =====
  readonly streams: NativeStream[];
  readonly nbStreams: number;
  newStream(codec: NativeCodec | null): NativeStream;

  // ===== Properties (readonly) =====
  readonly url: string;
  readonly duration: bigint;
  readonly startTime: bigint;
  readonly bitRate: bigint;
  readonly inputFormat: NativeInputFormat | null;
  readonly outputFormat: NativeOutputFormat | null;
  readonly options: NativeOptions;

  // ===== Properties (read-write) =====
  metadata: Record<string, string> | null; // Plain object, not NativeDictionary
  flags: AVFormatFlag;
  maxAnalyzeDuration: bigint;
  probesize: bigint;
  pb: any; // AVIOContext

  // ===== Utility Methods =====
  dump(index: number, isOutput: boolean): void;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVStream binding interface
 *
 * Represents a single stream within a format context (audio, video, subtitle, etc.).
 * Each stream has its own codec parameters and timing information.
 *
 * @internal
 */
export interface NativeStream {
  readonly __brand: 'NativeStream';

  // ===== Core Properties (readonly) =====
  readonly index: number;
  readonly duration: bigint;
  readonly nbFrames: bigint;
  readonly startTime: bigint;
  readonly eventFlags: number;
  readonly codecParameters: NativeCodecParameters;
  readonly options: NativeOptions;

  // ===== Core Properties (read-write) =====
  id: number;

  // ===== Timing Properties =====
  timeBase: { num: number; den: number };
  avgFrameRate: { num: number; den: number };
  rFrameRate: { num: number; den: number };
  sampleAspectRatio: { num: number; den: number };

  // ===== Configuration Properties =====
  discard: AVDiscard;
  disposition: AVDisposition;
  metadata: Record<string, string> | null; // Plain object, not NativeDictionary

  // Note: No Symbol.dispose - streams are managed by FormatContext
}

/**
 * Native AVInputFormat binding interface
 *
 * Describes an input format (demuxer) capability.
 * Used to specify or detect the format when opening input files.
 *
 * @internal
 */
export interface NativeInputFormat {
  readonly __brand: 'NativeInputFormat';

  // ===== Properties (all readonly) =====
  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string[]; // Array of supported file extensions
  readonly mimeType: string | null;
  readonly flags: AVFormatFlags;

  // Note: No Symbol.dispose - format descriptors don't need cleanup
}

/**
 * Native AVOutputFormat binding interface
 *
 * Describes an output format (muxer) capability.
 * Used to specify the format when creating output files.
 *
 * @internal
 */
export interface NativeOutputFormat {
  readonly __brand: 'NativeOutputFormat';

  // ===== Properties (all readonly) =====
  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string[]; // Array of supported file extensions
  readonly mimeType: string | null;
  readonly audioCodec: AVCodecID;
  readonly videoCodec: AVCodecID;
  readonly subtitleCodec: AVCodecID;
  readonly flags: AVFormatFlags;

  // Note: No Symbol.dispose - format descriptors don't need cleanup
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Native AVFilter binding interface
 *
 * Describes a filter type that can be instantiated in a filter graph.
 * This is an immutable descriptor - actual filtering happens via FilterContext.
 *
 * @internal
 */
export interface NativeFilter {
  readonly __brand: 'NativeFilter';

  // ===== Properties (all readonly) =====
  readonly name: string | null;
  readonly description: string | null;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly flags: AVFilterFlag;

  // Note: No Symbol.dispose - filter descriptors don't need cleanup
}

/**
 * Native AVFilterContext binding interface
 *
 * An instance of a filter within a filter graph.
 * Represents one processing node in the filtering pipeline.
 *
 * @internal
 */
export interface NativeFilterContext {
  readonly __brand: 'NativeFilterContext';

  // ===== Methods =====
  link(dst: NativeFilterContext, srcPad: number, dstPad: number): void;
  unlink(srcPad: number): void;
  bufferSrcAddFrame(frame: NativeFrame | null): number;
  bufferSrcAddFrameAsync(frame: NativeFrame | null): Promise<number>;
  bufferSinkGetFrame(frame: NativeFrame): number;
  bufferSinkGetFrameAsync(frame: NativeFrame): Promise<number>;

  // ===== Properties (all readonly) =====
  readonly filter: NativeFilter;
  readonly name: string;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly options: NativeOptions;

  // Note: No Symbol.dispose - filter contexts are managed by FilterGraph
}

/**
 * Native AVFilterGraph binding interface
 *
 * Container for a complete filter processing pipeline.
 * Manages multiple connected filter contexts.
 *
 * @internal
 */
export interface NativeFilterGraph extends Disposable {
  readonly __brand: 'NativeFilterGraph';

  // ===== Configuration Methods =====
  config(): void;
  configAsync(): Promise<void>;
  createFilter(filter: NativeFilter, name: string, args: string | null): NativeFilterContext;
  createBuffersrcFilter(name: string, params: object): NativeFilterContext;
  createBuffersinkFilter(name: string, isAudio?: boolean): NativeFilterContext;
  parse(filters: string, inputs?: NativeFilterContext, outputs?: NativeFilterContext): void;
  parseWithInOut(filters: string, inputs: object, outputs: object): void;
  parsePtr(filters: string, inputs?: NativeFilterContext, outputs?: NativeFilterContext): void;
  dump(): string;

  // ===== Properties (readonly) =====
  readonly nbFilters: number;
  readonly filters: NativeFilterContext[];

  // ===== Properties (read-write) =====
  threadType: number;
  nbThreads: number;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

// ============================================================================
// VIDEO/AUDIO PROCESSING
// ============================================================================

/**
 * Native SwsContext (software scale) binding interface
 *
 * Performs video scaling and pixel format conversion.
 * Created with specific input/output parameters that cannot be changed.
 *
 * @internal
 */
export interface NativeSoftwareScaleContext extends Disposable {
  readonly __brand: 'NativeSoftwareScaleContext';

  // ===== Methods =====
  scaleFrame(src: NativeFrame, dst: NativeFrame): void;

  // ===== Properties (all readonly - set at construction) =====
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly sourcePixelFormat: AVPixelFormat;
  readonly destinationWidth: number;
  readonly destinationHeight: number;
  readonly destinationPixelFormat: AVPixelFormat;
  readonly flags: SWSFlag;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native SwrContext (software resample) binding interface
 *
 * Performs audio resampling, channel layout conversion, and sample format conversion.
 * Created with specific input/output parameters that cannot be changed.
 *
 * @internal
 */
export interface NativeSoftwareResampleContext extends Disposable {
  readonly __brand: 'NativeSoftwareResampleContext';

  // ===== Methods =====
  convertFrame(src: NativeFrame | null, dst: NativeFrame): void; // src can be null for flushing
  getDelay(base: bigint): bigint;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVAudioFifo binding interface
 *
 * FIFO buffer for audio samples.
 * Useful for buffering audio between components with different frame sizes.
 *
 * @internal
 */
export interface NativeAudioFifo extends Disposable {
  readonly __brand: 'NativeAudioFifo';

  // ===== Methods =====
  write(frame: NativeFrame): number;
  read(frame: NativeFrame): number;
  size(): number;
  space(): number;
  realloc(nbSamples: number): void;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

// ============================================================================
// HARDWARE ACCELERATION
// ============================================================================

/**
 * Native AVHWDeviceContext binding interface
 *
 * Represents a hardware device for accelerated processing.
 * Required for hardware-accelerated encoding/decoding.
 *
 * @internal
 */
export interface NativeHardwareDeviceContext extends Disposable {
  readonly __brand: 'NativeHardwareDeviceContext';

  // ===== Methods =====
  getHardwareFramesConstraints(): {
    validHwFormats?: AVPixelFormat[];
    validSwFormats?: AVPixelFormat[];
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  } | null;

  // ===== Properties =====
  readonly type: AVHWDeviceType;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVHWFramesContext binding interface
 *
 * Manages a pool of hardware frames for a specific device.
 * Must be configured and initialized before use.
 *
 * @internal
 */
export interface NativeHardwareFramesContext extends Disposable {
  readonly __brand: 'NativeHardwareFramesContext';

  // ===== Methods =====
  initialize(): void;

  // ===== Properties (all read-write for configuration) =====
  width: number;
  height: number;
  hardwarePixelFormat: AVPixelFormat;
  softwarePixelFormat: AVPixelFormat;
  initialPoolSize: number;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Native AVDictionary binding interface
 *
 * Key-value storage for metadata and options.
 * Used throughout FFmpeg for configuration and metadata.
 *
 * @internal
 */
export interface NativeDictionary extends Disposable {
  readonly __brand: 'NativeDictionary';

  // ===== Methods =====
  set(key: string, value: string, flags?: number): void;
  get(key: string, flags?: number): string | null;
  getAll(): Record<string, string>;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  copy(flags?: number): NativeDictionary;
  parseString(str: string, keyValSep?: string, pairsSep?: string, flags?: number): void;
  toString(keyValSep?: string, pairsSep?: string): string;

  // ===== Properties =====
  readonly count: number;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVBitStreamFilter binding interface
 *
 * Describes a bitstream filter that can modify packet data.
 * This is an immutable descriptor - actual filtering happens via BitStreamFilterContext.
 *
 * @internal
 */
export interface NativeBitStreamFilter {
  readonly __brand: 'NativeBitStreamFilter';

  // ===== Methods =====
  getName(): string;
  getCodecIds(): AVCodecID[] | null;
  getPrivClass(): string | null;

  // Note: No Symbol.dispose - filter descriptors don't need cleanup
}

/**
 * Native AVBSFContext binding interface
 *
 * Context for applying bitstream filters to packets.
 * Must be initialized before use.
 *
 * @internal
 */
export interface NativeBitStreamFilterContext extends Disposable {
  readonly __brand: 'NativeBitStreamFilterContext';

  // ===== Methods =====
  init(): void;
  sendPacket(packet: NativePacket | null): number;
  receivePacket(packet: NativePacket): number;
  sendPacketAsync(packet: NativePacket | null): Promise<number>;
  receivePacketAsync(packet: NativePacket): Promise<number>;
  flush(): void;
  free(): void;
  [Symbol.dispose](): void;

  // ===== Properties (readonly) =====
  readonly filter: NativeBitStreamFilter;
  readonly codecParameters: NativeCodecParameters;

  // ===== Properties (read-write) =====
  timeBaseIn: { num: number; den: number };
  timeBaseOut: { num: number; den: number };
}

/**
 * Native AVIOContext binding interface
 *
 * Custom I/O context for reading/writing data.
 * Provides abstraction over file I/O, network I/O, or custom protocols.
 *
 * @internal
 */
export interface NativeIOContext extends Disposable {
  readonly __brand: 'NativeIOContext';

  // ===== Methods =====
  open(url: string, flags: AVIOFlag, options?: Record<string, string>): void;
  openAsync(url: string, flags: AVIOFlag, options?: Record<string, string>): Promise<void>;
  close(): void;
  flush(): void;

  // ===== Properties (all readonly) =====
  readonly size: bigint | null; // Can be null if size is unknown
  readonly pos: bigint;
  readonly seekable: boolean;
  readonly eof: boolean;

  // ===== Resource Management =====
  free(): void;
  [Symbol.dispose](): void;
}

/**
 * Native AVOption binding interface
 *
 * Describes a single configuration option for an FFmpeg component.
 * Used for introspection and validation of options.
 *
 * @internal
 */
export interface NativeOption {
  readonly __brand: 'NativeOption';

  // ===== Properties (all readonly) =====
  readonly name: string | null;
  readonly help: string | null;
  readonly type: AVOptionType;
  readonly flags: AVOptionFlag;
  readonly unit: string | null;
  readonly defaultValue: any;
  readonly min: number;
  readonly max: number;

  // Note: No Symbol.dispose - option descriptors don't need cleanup
}

/**
 * Native AVOptions binding interface
 *
 * Provides access to the options system for an FFmpeg component.
 * Used to get/set configuration values dynamically.
 *
 * @internal
 */
export interface NativeOptions {
  readonly __brand: 'NativeOptions';

  // ===== String Options =====
  get(name: string, searchFlags?: number): string | null;
  set(name: string, value: string, searchFlags?: number): void;

  // ===== Numeric Options =====
  getInt(name: string, searchFlags?: number): number | null;
  setInt(name: string, value: number, searchFlags?: number): void;
  getDouble(name: string, searchFlags?: number): number | null;
  setDouble(name: string, value: number, searchFlags?: number): void;

  // ===== Format Options =====
  getPixelFormat(name: string, searchFlags?: number): AVPixelFormat | null;
  setPixelFormat(name: string, format: AVPixelFormat, searchFlags?: number): void;
  getSampleFormat(name: string, searchFlags?: number): AVSampleFormat | null;
  setSampleFormat(name: string, format: AVSampleFormat, searchFlags?: number): void;

  // ===== Audio Options =====
  getChannelLayout(name: string, searchFlags?: number): string | null;
  setChannelLayout(name: string, layout: string, searchFlags?: number): void;

  // ===== Utility Methods =====
  list(): NativeOption[];
  setDefaults(): void;
  serialize(): string | null;

  // Note: No Symbol.dispose - options contexts are managed by their parent objects
}

// ============================================================================
// WRAPPER INTERFACE
// ============================================================================

/**
 * Base interface for wrapper classes that contain native bindings
 * @internal
 */
export interface NativeWrapper<T extends NativeBinding = NativeBinding> {
  getNative(): T;
}

/**
 * Union type of all native binding interfaces
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
  | NativeIOContext
  | NativeOption
  | NativeOptions;
