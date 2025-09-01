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
 *
 * @internal
 * @packageDocumentation
 */

import type {
  AVDictFlag,
  AVFilterCmdFlag,
  AVFilterConstants,
  AVFilterFlag,
  AVFrameSideDataType,
  AVHWDeviceType,
  AVHWFrameTransferDirection,
  AVIOFlag,
  AVOptionFlag,
  AVOptionType,
  AVPacketSideDataType,
  AVPixelFormat,
  AVSeekFlag,
  AVSeekWhence,
  SWSFlag,
} from '../constants/constants.js';
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
  AVFormatFlag,
  AVMediaType,
  AVPacketFlag,
  AVPictureType,
  AVProfile,
  AVSampleFormat,
  AVStreamEventFlag,
} from '../constants/index.js';
import type { ChannelLayout, CodecProfile, FilterPad, IRational } from './types.js';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Native AVPacket binding interface
 *
 * Represents compressed audio/video data.
 * Must be allocated before use and properly disposed after.
 *
 * @internal
 */
export interface NativePacket extends Disposable {
  readonly __brand: 'NativePacket';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;
  ref(src: NativePacket): number;
  unref(): void;
  clone(): NativePacket | null;
  rescaleTs(srcTb: IRational, dstTb: IRational): void;
  makeRefcounted(): number;
  makeWritable(): number;

  // ===== Properties =====
  streamIndex: number;
  pts: bigint;
  dts: bigint;
  duration: bigint;
  pos: bigint;
  readonly size: number;
  flags: AVPacketFlag;
  data: Buffer | null;

  // ===== Utility =====
  isKeyframe: boolean;

  // ===== Side Data =====
  getSideData(type: AVPacketSideDataType): Buffer | null;
  addSideData(type: AVPacketSideDataType, data: Buffer): number;
  newSideData(type: AVPacketSideDataType, size: number): Buffer;
  freeSideData(): void;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVFrame binding interface
 *
 * Represents uncompressed audio/video data.
 * Must be allocated before use and properly disposed after.
 *
 * @internal
 */
export interface NativeFrame extends Disposable {
  readonly __brand: 'NativeFrame';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;
  ref(src: NativeFrame): number;
  unref(): void;
  clone(): NativeFrame | null;
  getBuffer(align?: number): number;
  allocBuffer(): number;
  makeWritable(): number;
  copyProps(src: NativeFrame): number;
  copy(src: NativeFrame): number;
  fromBuffer(buffer: Buffer): number;

  // ===== Properties - General =====
  format: AVPixelFormat | AVSampleFormat;
  width: number;
  height: number;
  nbSamples: number;
  pts: bigint;
  pktDts: bigint;
  bestEffortTimestamp: bigint;
  timeBase: IRational;
  keyFrame: number;
  pictType: AVPictureType;
  sampleAspectRatio: IRational;

  // ===== Properties - Audio specific =====
  sampleRate: number;
  channelLayout: ChannelLayout;
  readonly channels: number;

  // ===== Properties - Video specific =====
  readonly linesize: number[];
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;

  // ===== Data access =====
  readonly data: Buffer[] | null;
  readonly extendedData: Buffer[] | null;

  // ===== Hardware Acceleration =====
  hwFramesCtx: NativeHardwareFramesContext | null;
  hwframeTransferData(dst: NativeFrame, flags?: number): Promise<number>;
  isHwFrame(): boolean;
  isSwFrame(): boolean;

  // ===== Utility =====
  readonly isWritable: boolean;

  // ===== Side Data =====
  getSideData(type: AVFrameSideDataType): Buffer | null;
  newSideData(type: AVFrameSideDataType, size: number): Buffer;
  removeSideData(type: AVFrameSideDataType): void;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// CODEC SYSTEM
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

  // ===== Properties (all readonly - codec definitions are immutable) =====
  readonly name: string | null;
  readonly longName: string | null;
  readonly type: AVMediaType;
  readonly id: AVCodecID;
  readonly capabilities: AVCodecCap;
  readonly maxLowres: number;
  readonly profiles: CodecProfile[] | null;
  readonly wrapper: string | null;

  // ===== Supported formats =====
  readonly supportedFramerates: IRational[] | null;
  readonly pixelFormats: AVPixelFormat[] | null;
  readonly supportedSamplerates: number[] | null;
  readonly sampleFormats: AVSampleFormat[] | null;
  readonly channelLayouts: ChannelLayout[] | null;

  // ===== Methods =====
  isEncoder(): boolean;
  isDecoder(): boolean;
  isExperimental(): boolean;
  getHwConfig(index: number): { pixFmt: AVPixelFormat; methods: number; deviceType: AVHWDeviceType } | null;

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

  // ===== Lifecycle Methods - Low Level API =====
  allocContext3(codec?: NativeCodec | null): void;
  freeContext(): void;
  open2(codec?: NativeCodec | null, options?: NativeDictionary | null): Promise<number>;
  close(): number;
  parametersToContext(params: NativeCodecParameters): number;
  parametersFromContext(params: NativeCodecParameters): number;
  flushBuffers(): void;

  // ===== Encoding/Decoding - All Async =====
  sendPacket(packet: NativePacket | null): Promise<number>;
  receiveFrame(frame: NativeFrame): Promise<number>;
  sendFrame(frame: NativeFrame | null): Promise<number>;
  receivePacket(packet: NativePacket): Promise<number>;

  // ===== Properties - General =====
  codecType: AVMediaType;
  codecId: AVCodecID;
  bitRate: bigint;
  timeBase: IRational;
  pktTimebase: IRational;
  readonly delay: number;
  flags: AVCodecFlag;
  flags2: AVCodecFlag2;
  extraData: Buffer | null;
  profile: AVProfile;
  level: number;
  threadCount: number;

  // ===== Properties - Video =====
  width: number;
  height: number;
  gopSize: number;
  pixelFormat: AVPixelFormat;
  maxBFrames: number;
  mbDecision: number;
  readonly hasBFrames: number;
  sampleAspectRatio: IRational;
  framerate: IRational;
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;

  // ===== Properties - Audio =====
  sampleRate: number;
  channels: number;
  sampleFormat: AVSampleFormat;
  frameSize: number;
  readonly frameNumber: number;
  channelLayout: ChannelLayout;

  // ===== Properties - Encoding =====
  qMin: number;
  qMax: number;
  rcBufferSize: number;
  rcMaxRate: bigint;
  rcMinRate: bigint;

  // ===== Properties - Hardware Acceleration =====
  hwDeviceCtx: NativeHardwareDeviceContext | null;
  hwFramesCtx: NativeHardwareFramesContext | null;

  // ===== Hardware Acceleration Methods =====
  setHardwarePixelFormat(hwFormat: AVPixelFormat, swFormat?: AVPixelFormat): void;

  // ===== Utility =====
  readonly isOpen: boolean;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVCodecParserContext binding interface
 *
 * Parser for splitting elementary streams into frames.
 * Used when decoding raw streams without a container.
 *
 * @internal
 */
export interface NativeCodecParser {
  readonly __brand: 'NativeCodecParser';
  // ===== Lifecycle Methods =====
  init(codecId: AVCodecID): void;
  parse2(codecContext: NativeCodecContext, packet: NativePacket, data: Buffer, pts: bigint, dts: bigint, pos: number): number;
  close(): void;
}

/**
 * Native AVCodecParameters binding interface
 *
 * This struct describes the properties of an encoded stream.
 * All fields are read/write.
 *
 * @internal
 */
export interface NativeCodecParameters extends Disposable {
  readonly __brand: 'NativeCodecParameters';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;
  copy(dst: NativeCodecParameters): number;
  fromContext(codecContext: NativeCodecContext): number;
  toContext(codecContext: NativeCodecContext): number;
  toJSON(): Record<string, any>;

  // ===== Properties - General =====
  codecType: AVMediaType;
  codecId: AVCodecID;
  codecTag: number;
  extradata: Buffer | null;
  readonly extradataSize: number;
  format: AVPixelFormat | AVSampleFormat;
  bitRate: bigint;
  profile: AVProfile;
  level: number;

  // ===== Properties - Video =====
  width: number;
  height: number;
  sampleAspectRatio: IRational;
  frameRate: IRational;
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;

  // ===== Properties - Audio =====
  channelLayout: ChannelLayout;
  channels: number;
  sampleRate: number;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVDictionary binding interface
 *
 * Key-value store for options and metadata.
 * Used throughout FFmpeg for configuration and metadata.
 * Direct mapping to FFmpeg's AVDictionary.
 *
 * @internal
 */
export interface NativeDictionary extends Disposable {
  readonly __brand: 'NativeDictionary';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;
  copy(dst: NativeDictionary, flags: AVDictFlag): number;

  // ===== Operations - Low Level API =====
  set(key: string, value: string, flags: AVDictFlag): number;
  get(key: string, flags: AVDictFlag): string | null;
  count(): number;
  getAll(): Record<string, string>;
  parseString(str: string, keyValSep: string, pairsSep: string, flags: AVDictFlag): number;
  getString(keyValSep: string, pairsSep: string): string | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// I/O SYSTEM
// ============================================================================

/**
 * Native AVIOContext binding interface
 *
 * Bytestream I/O context for custom I/O.
 * Used for reading/writing data from/to files, network, memory, etc.
 *
 * @internal
 */
export interface NativeIOContext extends AsyncDisposable {
  readonly __brand: 'NativeIOContext';

  // ===== Lifecycle Methods - Low Level API =====
  allocContext(bufferSize: number, writeFlag: number): void;
  allocContextWithCallbacks(
    bufferSize: number,
    writeFlag: 0 | 1,
    readCallback?: (size: number) => Buffer | null | number,
    writeCallback?: (buffer: Buffer) => number | void,
    seekCallback?: (offset: bigint, whence: AVSeekWhence) => bigint | number,
  ): void;
  freeContext(): void;
  open2(url: string, flags: AVIOFlag): Promise<number>;
  closep(): Promise<number>;

  // ===== I/O Operations - Low Level API =====
  read(size: number): Promise<Buffer | number>;
  write(buffer: Buffer): Promise<void>;
  seek(offset: bigint, whence: AVSeekWhence): Promise<bigint>;
  size(): Promise<bigint>;
  flush(): Promise<void>;
  skip(offset: bigint): Promise<bigint>;
  tell(): bigint; // Stays sync

  // ===== Properties =====
  readonly eof: boolean;
  readonly error: number;
  readonly seekable: number;
  maxPacketSize: number;
  direct: number;
  readonly pos: bigint;
  readonly bufferSize: number;
  readonly writeFlag: boolean;

  // Symbol.asyncDispose for cleanup
  [Symbol.asyncDispose](): Promise<void>;
}

// ============================================================================
// FORMAT SYSTEM
// ============================================================================

/**
 * Native AVInputFormat binding interface
 *
 * Demuxer definition.
 * Describes a supported input container format.
 *
 * @internal
 */
export interface NativeInputFormat {
  readonly __brand: 'NativeInputFormat';

  // ===== Properties (all readonly - format definitions are immutable) =====
  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string | null;
  readonly mimeType: string | null;
  readonly flags: AVFormatFlag; // Input format flags
}

/**
 * Native AVOutputFormat binding interface
 *
 * Muxer definition.
 * Describes a supported output container format.
 *
 * @internal
 */
export interface NativeOutputFormat {
  readonly __brand: 'NativeOutputFormat';

  // ===== Properties (all readonly - format definitions are immutable) =====
  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string | null;
  readonly mimeType: string | null;
  readonly audioCodec: AVCodecID;
  readonly videoCodec: AVCodecID;
  readonly subtitleCodec: AVCodecID;
  readonly flags: AVFormatFlag; // Output format flags
}

/**
 * Native AVStream binding interface
 *
 * Stream structure.
 * Contains information about one stream in a format context.
 * Note: Streams are created and managed by FormatContext - no lifecycle methods.
 *
 * @internal
 */
export interface NativeStream {
  readonly __brand: 'NativeStream';

  // ===== Properties (based on stream.h/stream.cc bindings) =====

  // Basic identification
  readonly index: number;
  id: number;

  // Codec parameters - THE most important property
  codecpar: NativeCodecParameters;

  // Timing
  timeBase: IRational;
  startTime: bigint;
  duration: bigint;
  nbFrames: bigint;

  // Stream properties
  disposition: AVDisposition;
  discard: AVDiscard;

  // Video specific
  sampleAspectRatio: IRational;
  avgFrameRate: IRational;
  rFrameRate: IRational;

  // Metadata
  metadata: NativeDictionary | null;

  // Attached picture (e.g., album art)
  readonly attachedPic: NativePacket | null;

  // Event flags
  eventFlags: AVStreamEventFlag;
}

/**
 * Native AVFormatContext binding interface
 *
 * Main interface for demuxing and muxing operations.
 * Must be allocated before use and properly disposed after.
 *
 * @internal
 */
export interface NativeFormatContext extends AsyncDisposable {
  readonly __brand: 'NativeFormatContext';

  // ===== Lifecycle Methods - Low Level API =====
  allocContext(): void;
  allocOutputContext2(oformat: NativeOutputFormat | null, formatName: string | null, filename: string | null): number;
  freeContext(): void;

  // ===== Input Operations - All Async =====
  openInput(url: string, fmt: NativeInputFormat | null, options: NativeDictionary | null): Promise<number>;
  closeInput(): Promise<void>;
  findStreamInfo(options: NativeDictionary[] | null): Promise<number>;
  readFrame(pkt: NativePacket): Promise<number>;
  seekFrame(streamIndex: number, timestamp: bigint, flags: AVSeekFlag): Promise<number>;
  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: AVSeekFlag): Promise<number>;

  // ===== Output Operations - All Async =====
  openOutput(): Promise<number>;
  closeOutput(): Promise<void>;
  writeHeader(options: NativeDictionary | null): Promise<number>;
  writeFrame(pkt: NativePacket | null): Promise<number>;
  interleavedWriteFrame(pkt: NativePacket | null): Promise<number>;
  writeTrailer(): Promise<number>;
  flush(): void;

  // ===== Stream Management =====
  newStream(c: NativeCodec | null): NativeStream;

  // ===== Debugging =====
  dumpFormat(index: number, url: string, isOutput: boolean): void;

  // ===== Stream Selection =====
  findBestStream(
    type: AVMediaType,
    wantedStreamNb: number,
    relatedStream: number,
    wantDecoder: boolean,
    flags: number,
  ): number | { streamIndex: number; decoder: NativeCodec | null };

  // ===== Properties =====
  url: string | null;
  readonly startTime: bigint;
  readonly duration: bigint;
  readonly bitRate: bigint;
  flags: AVFormatFlag;
  probesize: bigint;
  maxAnalyzeDuration: bigint;
  metadata: NativeDictionary | null;
  readonly iformat: NativeInputFormat | null;
  oformat: NativeOutputFormat | null;
  pb: NativeIOContext | null; // setter only
  readonly nbStreams: number;
  readonly streams: NativeStream[] | null;
  strictStdCompliance: number;
  maxStreams: number;
  readonly nbPrograms: number;
  readonly pbBytes: bigint;
  readonly probeScore: number;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Native FFmpegError binding interface
 *
 * Provides error code translation and string representation.
 * Maps FFmpeg error codes to human-readable messages.
 */
export interface NativeFFmpegError {
  // ===== Properties =====
  readonly code: number; // FFmpeg error code (negative)
  readonly message: string; // Human-readable error message from av_strerror()
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Native AudioFifo binding interface
 *
 * Audio FIFO buffer for sample storage and buffering.
 * Provides thread-safe audio sample buffering with automatic reallocation.
 *
 * @internal
 */
export interface NativeAudioFifo extends Disposable {
  readonly __brand: 'NativeAudioFifo';
  // ===== Lifecycle Methods - Low Level API =====
  alloc(sampleFmt: AVSampleFormat, channels: number, nbSamples: number): void;
  free(): void;

  // ===== I/O Operations (Async) - Low Level API =====
  write(data: Buffer | Buffer[], nbSamples: number): Promise<number>;
  read(data: Buffer | Buffer[], nbSamples: number): Promise<number>;
  peek(data: Buffer | Buffer[], nbSamples: number): Promise<number>;

  // ===== Sync Operations - Low Level API =====
  drain(nbSamples: number): void;
  reset(): void;
  realloc(nbSamples: number): number;

  // ===== Properties =====
  readonly size: number;
  readonly space: number;
}

/**
 * Native SwsContext binding interface
 *
 * Software scaling and format conversion context.
 * Provides pixel format conversion and image scaling capabilities.
 *
 * @internal
 */
export interface NativeSoftwareScaleContext extends Disposable {
  readonly __brand: 'NativeSoftwareScaleContext';

  // ===== Lifecycle Methods - Low Level API =====
  allocContext(): void;
  getContext(srcW: number, srcH: number, srcFormat: AVPixelFormat, dstW: number, dstH: number, dstFormat: AVPixelFormat, flags: SWSFlag): void;
  initContext(): number;
  freeContext(): void;

  // ===== Operations =====
  scale(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): Promise<number>;
  scaleFrame(dst: NativeFrame, src: NativeFrame): Promise<number>;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native SwrContext binding interface
 *
 * Audio resampling, sample format conversion and mixing context.
 * Provides audio format conversion, resampling and channel remapping.
 *
 * @internal
 */
export interface NativeSoftwareResampleContext extends Disposable {
  readonly __brand: 'NativeSoftwareResampleContext';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  allocSetOpts2(
    outChLayout: ChannelLayout,
    outSampleFmt: AVSampleFormat,
    outSampleRate: number,
    inChLayout: ChannelLayout,
    inSampleFmt: AVSampleFormat,
    inSampleRate: number,
  ): number;
  init(): number;
  free(): void;
  close(): void;

  // ===== Operations =====
  convert(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): Promise<number>;
  convertFrame(outFrame: NativeFrame | null, inFrame: NativeFrame | null): number;
  configFrame(outFrame: NativeFrame | null, inFrame: NativeFrame | null): number;

  // ===== Query =====
  isInitialized(): boolean;
  getDelay(base: bigint): bigint;
  getOutSamples(inSamples: number): number;
  nextPts(pts: bigint): bigint;

  // ===== Configuration =====
  setCompensation(sampleDelta: number, compensationDistance: number): number;
  setChannelMapping(channelMap: number[]): number;
  setMatrix(matrix: number[], stride: number): number;
  dropOutput(count: number): number;
  injectSilence(count: number): number;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// FILTER SYSTEM
// ============================================================================

/**
 * Native AVFilter binding interface
 *
 * Represents a filter definition (e.g., "scale", "overlay", etc.).
 * Filters are static definitions - actual processing happens via FilterContext.
 *
 * @internal
 */
export interface NativeFilter {
  readonly __brand: 'NativeFilter';

  // ===== Properties (all readonly - filter definitions are immutable) =====
  readonly name: string | null;
  readonly description: string | null;
  readonly inputs: FilterPad[];
  readonly outputs: FilterPad[];
  readonly flags: AVFilterFlag;
}

/**
 * Native AVFilterContext binding interface
 *
 * An instance of a filter in a filter graph.
 * Must be created through FilterGraph.createFilter() and properly disposed after.
 *
 * @internal
 */
export interface NativeFilterContext extends Disposable {
  readonly __brand: 'NativeFilterContext';

  // ===== Methods - Low Level API =====
  init(options?: NativeDictionary | null): number;
  initStr(args?: string | null): number;
  link(srcPad: number, dst: NativeFilterContext, dstPad: number): number;
  unlink(pad: number): void;
  buffersrcAddFrame(frame: NativeFrame | null): Promise<number>;
  buffersrcParametersSet(params: {
    width?: number;
    height?: number;
    format?: number;
    timeBase?: IRational;
    frameRate?: IRational;
    sampleAspectRatio?: IRational;
    hwFramesCtx?: NativeHardwareFramesContext | null;
    sampleRate?: number;
    channelLayout?: bigint;
  }): number;
  buffersinkGetFrame(frame: NativeFrame): Promise<number>;
  // buffersinkSetFrameSize(frameSize: number): void;
  buffersinkGetWidth(): number;
  buffersinkGetHeight(): number;
  buffersinkGetFormat(): AVPixelFormat | AVSampleFormat;
  buffersinkGetTimeBase(): IRational;
  buffersinkGetFrameRate(): IRational;
  buffersinkGetSampleRate(): number;
  buffersinkGetChannelLayout(): ChannelLayout;
  buffersinkGetSampleAspectRatio(): IRational;
  free(): void;

  // ===== Properties =====
  name: string | null;
  readonly filter: NativeFilter | null;
  readonly graph: NativeFilterGraph | null;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly ready: number;
  hwDeviceCtx: NativeHardwareDeviceContext | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVFilterGraph binding interface
 *
 * Container for all filters and their connections.
 * Must be allocated before use and properly disposed after.
 *
 * @internal
 */
export interface NativeFilterGraph extends Disposable {
  readonly __brand: 'NativeFilterGraph';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;

  // ===== Filter Management =====
  createFilter(filter: NativeFilter, name: string, args?: string | null): NativeFilterContext | null;
  allocFilter(filter: NativeFilter, name: string): NativeFilterContext | null;
  getFilter(name: string): NativeFilterContext | null;

  // ===== Configuration =====
  config(): Promise<number>;
  parse(filters: string, inputs: NativeFilterInOut | null, outputs: NativeFilterInOut | null): number;
  parse2(filters: string): number;
  parsePtr(filters: string, inputs?: NativeFilterInOut | null, outputs?: NativeFilterInOut | null): number;
  validate(): number;

  // ===== Execution =====
  requestOldest(): Promise<number>;
  dump(): string | null;

  // ===== Command Interface =====
  sendCommand(target: string, cmd: string, arg: string, flags?: AVFilterCmdFlag): number | { response: string | null };
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): number;

  // ===== Properties =====
  readonly nbFilters: number;
  readonly filters: NativeFilterContext[] | null;
  threadType: AVFilterConstants;
  nbThreads: number;
  scaleSwsOpts: string | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVFilterInOut binding interface
 *
 * Helper structure for parsing filter graphs.
 * Used with FilterGraph.parse() to define inputs/outputs.
 *
 * @internal
 */
export interface NativeFilterInOut extends Disposable {
  readonly __brand: 'NativeFilterInOut';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(): void;
  free(): void;

  // ===== Properties =====
  name: string | null;
  filterCtx: NativeFilterContext | null;
  padIdx: number;
  next: NativeFilterInOut | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// HARDWARE ACCELERATION
// ============================================================================

/**
 * Native AVHWDeviceContext binding interface
 *
 * Hardware device context for hardware acceleration.
 * Direct mapping to FFmpeg's AVHWDeviceContext.
 */
export interface NativeHardwareDeviceContext extends Disposable {
  readonly __brand: 'NativeHardwareDeviceContext';

  // ===== Methods - Low Level API =====
  alloc(type: AVHWDeviceType): void;
  init(): number;
  create(type: AVHWDeviceType, device: string | null, options: any | null): number;
  createDerived(source: NativeHardwareDeviceContext, type: AVHWDeviceType): number;
  hwconfigAlloc(): bigint | null;
  getHwframeConstraints(hwconfig?: bigint): {
    validHwFormats?: AVPixelFormat[];
    validSwFormats?: AVPixelFormat[];
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  } | null;
  free(): void;

  // ===== Properties =====
  readonly type: AVHWDeviceType;
  readonly hwctx: bigint | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

/**
 * Native AVHWFramesContext binding interface
 *
 * Hardware frames context for hardware acceleration.
 * Direct mapping to FFmpeg's AVHWFramesContext.
 */
export interface NativeHardwareFramesContext extends Disposable {
  readonly __brand: 'NativeHardwareFramesContext';

  // ===== Methods - Low Level API =====
  alloc(device: NativeHardwareDeviceContext): void;
  init(): number;
  getBuffer(frame: NativeFrame, flags?: number): number;
  transferData(dst: NativeFrame, src: NativeFrame, flags?: number): Promise<number>;
  transferGetFormats(direction: AVHWFrameTransferDirection): AVPixelFormat[] | number;
  map(dst: NativeFrame, src: NativeFrame, flags?: number): number;
  createDerived(format: AVPixelFormat, derivedDevice: NativeHardwareDeviceContext, source: NativeHardwareFramesContext, flags?: number): number;
  free(): void;

  // ===== Properties =====
  format: AVPixelFormat;
  swFormat: AVPixelFormat;
  width: number;
  height: number;
  initialPoolSize: number;
  readonly deviceRef: NativeHardwareDeviceContext | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// BITSTREAM FILTERS
// ============================================================================

/**
 * Native BitStreamFilter (avcodec)
 * @internal
 */
export interface NativeBitStreamFilter {
  readonly __brand: 'NativeBitStreamFilter';

  // ===== Properties (all readonly - filter definitions are immutable) =====
  readonly name: string | null;
  readonly codecIds: number[] | null;
}

/**
 * Native BitStreamFilterContext (avcodec)
 * @internal
 */
export interface NativeBitStreamFilterContext extends Disposable {
  readonly __brand: 'NativeBitStreamFilterContext';

  // ===== Lifecycle Methods - Low Level API =====
  alloc(filter: NativeBitStreamFilter): number;
  init(): number;
  free(): void;
  flush(): void;
  // ===== Operations =====
  sendPacket(packet: NativePacket | null): Promise<number>;
  receivePacket(packet: NativePacket): Promise<number>;
  // ===== Utility =====
  isInitialized(): boolean;

  // ===== Properties =====
  readonly inputCodecParameters: NativeCodecParameters | null;
  readonly outputCodecParameters: NativeCodecParameters | null;
  inputTimeBase: IRational;
  readonly outputTimeBase: IRational | null;
  readonly filter: NativeBitStreamFilter | null;

  // Symbol.dispose for cleanup
  [Symbol.dispose](): void;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Native Log binding interface
 *
 * Static-only class for controlling FFmpeg's logging.
 * Direct mapping to av_log functions.
 *
 * @internal
 */
export interface NativeLog {
  readonly __brand: 'NativeLog';
}

/**
 * Native AVOption
 *
 * Represents a single option metadata from FFmpeg's AVOption system.
 * Retrieved via Option.next() or Option.find().
 *
 * @internal
 */
export interface NativeOption {
  readonly __brand: 'NativeOption';

  // ===== Properties =====
  readonly name: string | null;
  readonly help: string | null;
  readonly type: AVOptionType;
  readonly defaultValue: unknown;
  readonly min: number;
  readonly max: number;
  readonly flags: AVOptionFlag;
  readonly unit: string | null;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Interface for classes that wrap native objects
 * @internal
 */
export interface NativeWrapper<T> {
  getNative(): T;
}
