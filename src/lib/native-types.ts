/**
 * Native FFmpeg Binding Type Definitions
 * =======================================
 *
 * This file contains all TypeScript interfaces for the native C++ FFmpeg bindings.
 * These interfaces represent the exact API surface exposed by the C++ layer.
 *
 * @internal
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

  readonly size: number;
  streamIndex: number;
  pts: bigint;
  dts: bigint;
  duration: bigint;
  pos: bigint;
  flags: AVPacketFlag;
  data: Buffer | null;
  isKeyframe: boolean;

  alloc(): void;
  free(): void;
  ref(src: NativePacket): number;
  unref(): void;
  clone(): NativePacket | null;
  rescaleTs(srcTb: IRational, dstTb: IRational): void;
  makeRefcounted(): number;
  makeWritable(): number;
  getSideData(type: AVPacketSideDataType): Buffer | null;
  addSideData(type: AVPacketSideDataType, data: Buffer): number;
  newSideData(type: AVPacketSideDataType, size: number): Buffer;
  freeSideData(): void;

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

  readonly channels: number;
  readonly linesize: number[];
  readonly data: Buffer[] | null;
  readonly extendedData: Buffer[] | null;
  readonly isWritable: boolean;
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
  sampleRate: number;
  channelLayout: ChannelLayout;
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;
  hwFramesCtx: NativeHardwareFramesContext | null;

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
  toBuffer(): Buffer;
  hwframeTransferData(dst: NativeFrame, flags?: number): Promise<number>;
  hwframeTransferDataSync(dst: NativeFrame, flags?: number): number;
  isHwFrame(): boolean;
  isSwFrame(): boolean;
  getSideData(type: AVFrameSideDataType): Buffer | null;
  newSideData(type: AVFrameSideDataType, size: number): Buffer;
  removeSideData(type: AVFrameSideDataType): void;

  [Symbol.dispose](): void;
}

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

  readonly name: string | null;
  readonly longName: string | null;
  readonly type: AVMediaType;
  readonly id: AVCodecID;
  readonly capabilities: AVCodecCap;
  readonly maxLowres: number;
  readonly profiles: CodecProfile[] | null;
  readonly wrapper: string | null;
  readonly supportedFramerates: IRational[] | null;
  readonly pixelFormats: AVPixelFormat[] | null;
  readonly supportedSamplerates: number[] | null;
  readonly sampleFormats: AVSampleFormat[] | null;
  readonly channelLayouts: ChannelLayout[] | null;

  isEncoder(): boolean;
  isDecoder(): boolean;
  isExperimental(): boolean;
  getHwConfig(index: number): { pixFmt: AVPixelFormat; methods: number; deviceType: AVHWDeviceType } | null;
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

  readonly delay: number;
  readonly hasBFrames: number;
  readonly frameNumber: number;
  readonly isOpen: boolean;
  codecType: AVMediaType;
  codecId: AVCodecID;
  bitRate: bigint;
  timeBase: IRational;
  pktTimebase: IRational;
  flags: AVCodecFlag;
  flags2: AVCodecFlag2;
  extraData: Buffer | null;
  profile: AVProfile;
  level: number;
  threadCount: number;
  width: number;
  height: number;
  gopSize: number;
  pixelFormat: AVPixelFormat;
  maxBFrames: number;
  mbDecision: number;
  sampleAspectRatio: IRational;
  framerate: IRational;
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;
  sampleRate: number;
  channels: number;
  sampleFormat: AVSampleFormat;
  frameSize: number;
  channelLayout: ChannelLayout;
  qMin: number;
  qMax: number;
  rcBufferSize: number;
  rcMaxRate: bigint;
  rcMinRate: bigint;
  hwDeviceCtx: NativeHardwareDeviceContext | null;
  hwFramesCtx: NativeHardwareFramesContext | null;

  allocContext3(codec?: NativeCodec | null): void;
  freeContext(): void;
  open2(codec?: NativeCodec | null, options?: NativeDictionary | null): Promise<number>;
  open2Sync(codec?: NativeCodec | null, options?: NativeDictionary | null): number;
  close(): number;
  parametersToContext(params: NativeCodecParameters): number;
  parametersFromContext(params: NativeCodecParameters): number;
  flushBuffers(): void;
  sendPacket(packet: NativePacket | null): Promise<number>;
  sendPacketSync(packet: NativePacket | null): number;
  receiveFrame(frame: NativeFrame): Promise<number>;
  receiveFrameSync(frame: NativeFrame): number;
  sendFrame(frame: NativeFrame | null): Promise<number>;
  sendFrameSync(frame: NativeFrame | null): number;
  receivePacket(packet: NativePacket): Promise<number>;
  receivePacketSync(packet: NativePacket): number;
  setHardwarePixelFormat(hwFormat: AVPixelFormat, swFormat?: AVPixelFormat): void;

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

  readonly extradataSize: number;
  codecType: AVMediaType;
  codecId: AVCodecID;
  codecTag: number;
  extradata: Buffer | null;
  format: AVPixelFormat | AVSampleFormat;
  bitRate: bigint;
  profile: AVProfile;
  level: number;
  width: number;
  height: number;
  sampleAspectRatio: IRational;
  frameRate: IRational;
  colorRange: AVColorRange;
  colorPrimaries: AVColorPrimaries;
  colorTrc: AVColorTransferCharacteristic;
  colorSpace: AVColorSpace;
  chromaLocation: AVChromaLocation;
  channelLayout: ChannelLayout;
  channels: number;
  sampleRate: number;

  alloc(): void;
  free(): void;
  copy(dst: NativeCodecParameters): number;
  fromContext(codecContext: NativeCodecContext): number;
  toContext(codecContext: NativeCodecContext): number;
  toJSON(): Record<string, any>;

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

  alloc(): void;
  free(): void;
  copy(dst: NativeDictionary, flags: AVDictFlag): number;
  set(key: string, value: string, flags: AVDictFlag): number;
  get(key: string, flags: AVDictFlag): string | null;
  count(): number;
  getAll(): Record<string, string>;
  parseString(str: string, keyValSep: string, pairsSep: string, flags: AVDictFlag): number;
  getString(keyValSep: string, pairsSep: string): string | null;

  [Symbol.dispose](): void;
}

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
  open2Sync(url: string, flags: AVIOFlag): number;
  closep(): Promise<number>;
  closepSync(): number;
  read(size: number): Promise<Buffer | number>;
  readSync(size: number): Buffer | number;
  write(buffer: Buffer): Promise<void>;
  writeSync(buffer: Buffer): void;
  seek(offset: bigint, whence: AVSeekWhence): Promise<bigint>;
  seekSync(offset: bigint, whence: AVSeekWhence): bigint;
  size(): Promise<bigint>;
  sizeSync(): bigint;
  flush(): Promise<void>;
  flushSync(): void;
  skip(offset: bigint): Promise<bigint>;
  skipSync(offset: bigint): bigint;
  tell(): bigint;

  // ===== Properties =====
  readonly eof: boolean;
  readonly error: number;
  readonly seekable: number;
  readonly pos: bigint;
  readonly bufferSize: number;
  readonly writeFlag: boolean;
  maxPacketSize: number;
  direct: number;

  [Symbol.asyncDispose](): Promise<void>;
}

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

  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string | null;
  readonly mimeType: string | null;
  readonly flags: AVFormatFlag;
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

  readonly name: string | null;
  readonly longName: string | null;
  readonly extensions: string | null;
  readonly mimeType: string | null;
  readonly audioCodec: AVCodecID;
  readonly videoCodec: AVCodecID;
  readonly subtitleCodec: AVCodecID;
  readonly flags: AVFormatFlag;
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

  readonly index: number;
  readonly attachedPic: NativePacket | null;
  id: number;
  codecpar: NativeCodecParameters;
  timeBase: IRational;
  startTime: bigint;
  duration: bigint;
  nbFrames: bigint;
  disposition: AVDisposition;
  discard: AVDiscard;
  sampleAspectRatio: IRational;
  avgFrameRate: IRational;
  rFrameRate: IRational;
  metadata: NativeDictionary | null;
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

  readonly startTime: bigint;
  readonly duration: bigint;
  readonly bitRate: bigint;
  readonly iformat: NativeInputFormat | null;
  readonly nbStreams: number;
  readonly streams: NativeStream[] | null;
  readonly nbPrograms: number;
  readonly pbBytes: bigint;
  readonly probeScore: number;
  url: string | null;
  flags: AVFormatFlag;
  probesize: bigint;
  maxAnalyzeDuration: bigint;
  metadata: NativeDictionary | null;
  oformat: NativeOutputFormat | null;
  pb: NativeIOContext | null; // setter only
  strictStdCompliance: number;
  maxStreams: number;

  allocContext(): void;
  allocOutputContext2(oformat: NativeOutputFormat | null, formatName: string | null, filename: string | null): number;
  freeContext(): void;
  openInput(url: string, fmt: NativeInputFormat | null, options: NativeDictionary | null): Promise<number>;
  openInputSync(url: string, fmt: NativeInputFormat | null, options: NativeDictionary | null): number;
  closeInput(): Promise<void>;
  closeInputSync(): void;
  findStreamInfo(options: NativeDictionary[] | null): Promise<number>;
  findStreamInfoSync(options: NativeDictionary | null): number;
  readFrame(pkt: NativePacket): Promise<number>;
  readFrameSync(pkt: NativePacket): number;
  seekFrame(streamIndex: number, timestamp: bigint, flags: AVSeekFlag): Promise<number>;
  seekFrameSync(streamIndex: number, timestamp: bigint, flags: AVSeekFlag): number;
  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags: AVSeekFlag): Promise<number>;
  openOutput(): Promise<number>;
  openOutputSync(): number;
  closeOutput(): Promise<void>;
  closeOutputSync(): void;
  writeHeader(options: NativeDictionary | null): Promise<number>;
  writeHeaderSync(options: NativeDictionary | null): number;
  writeFrame(pkt: NativePacket | null): Promise<number>;
  writeFrameSync(pkt: NativePacket | null): number;
  interleavedWriteFrame(pkt: NativePacket | null): Promise<number>;
  interleavedWriteFrameSync(pkt: NativePacket | null): number;
  writeTrailer(): Promise<number>;
  writeTrailerSync(): number;
  flush(): Promise<void>;
  flushSync(): void;
  newStream(c: NativeCodec | null): NativeStream;
  dumpFormat(index: number, url: string, isOutput: boolean): void;
  findBestStream(
    type: AVMediaType,
    wantedStreamNb: number,
    relatedStream: number,
    wantDecoder: boolean,
    flags: number,
  ): number | { streamIndex: number; decoder: NativeCodec | null };

  [Symbol.dispose](): void;
}

/**
 * Native FFmpegError binding interface
 *
 * Provides error code translation and string representation.
 * Maps FFmpeg error codes to human-readable messages.
 *
 * @internal
 */
export interface NativeFFmpegError {
  readonly __brand: 'NativeFFmpegError';

  readonly code: number;
  readonly message: string;
}

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

  readonly size: number;
  readonly space: number;

  alloc(sampleFmt: AVSampleFormat, channels: number, nbSamples: number): void;
  free(): void;
  write(data: Buffer | Buffer[], nbSamples: number): Promise<number>;
  writeSync(data: Buffer | Buffer[], nbSamples: number): number;
  read(data: Buffer | Buffer[], nbSamples: number): Promise<number>;
  readSync(data: Buffer | Buffer[], nbSamples: number): number;
  peek(data: Buffer | Buffer[], nbSamples: number): Promise<number>;
  peekSync(data: Buffer | Buffer[], nbSamples: number): number;
  drain(nbSamples: number): void;
  reset(): void;
  realloc(nbSamples: number): number;
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

  allocContext(): void;
  getContext(srcW: number, srcH: number, srcFormat: AVPixelFormat, dstW: number, dstH: number, dstFormat: AVPixelFormat, flags: SWSFlag): void;
  initContext(): number;
  freeContext(): void;
  scale(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): Promise<number>;
  scaleSync(srcSlice: Buffer[], srcStride: number[], srcSliceY: number, srcSliceH: number, dst: Buffer[], dstStride: number[]): number;
  scaleFrame(dst: NativeFrame, src: NativeFrame): Promise<number>;
  scaleFrameSync(dst: NativeFrame, src: NativeFrame): number;

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
  convert(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): Promise<number>;
  convertSync(outBuffer: Buffer[] | null, outCount: number, inBuffer: Buffer[] | null, inCount: number): number;
  convertFrame(outFrame: NativeFrame | null, inFrame: NativeFrame | null): number;
  configFrame(outFrame: NativeFrame | null, inFrame: NativeFrame | null): number;
  isInitialized(): boolean;
  getDelay(base: bigint): bigint;
  getOutSamples(inSamples: number): number;
  nextPts(pts: bigint): bigint;
  setCompensation(sampleDelta: number, compensationDistance: number): number;
  setChannelMapping(channelMap: number[]): number;
  setMatrix(matrix: number[], stride: number): number;
  dropOutput(count: number): number;
  injectSilence(count: number): number;

  [Symbol.dispose](): void;
}

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

  readonly filter: NativeFilter | null;
  readonly graph: NativeFilterGraph | null;
  readonly nbInputs: number;
  readonly nbOutputs: number;
  readonly ready: number;
  name: string | null;
  hwDeviceCtx: NativeHardwareDeviceContext | null;

  init(options?: NativeDictionary | null): number;
  initStr(args?: string | null): number;
  link(srcPad: number, dst: NativeFilterContext, dstPad: number): number;
  unlink(pad: number): void;
  buffersrcAddFrame(frame: NativeFrame | null): Promise<number>;
  buffersrcAddFrameSync(frame: NativeFrame | null): number;
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
  buffersinkGetFrameSync(frame: NativeFrame): number;
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

  readonly nbFilters: number;
  readonly filters: NativeFilterContext[] | null;
  threadType: AVFilterConstants;
  nbThreads: number;
  scaleSwsOpts: string | null;

  alloc(): void;
  free(): void;
  createFilter(filter: NativeFilter, name: string, args?: string | null): NativeFilterContext | null;
  allocFilter(filter: NativeFilter, name: string): NativeFilterContext | null;
  getFilter(name: string): NativeFilterContext | null;
  config(): Promise<number>;
  configSync(): number;
  parse(filters: string, inputs: NativeFilterInOut | null, outputs: NativeFilterInOut | null): number;
  parse2(filters: string): number;
  parsePtr(filters: string, inputs?: NativeFilterInOut | null, outputs?: NativeFilterInOut | null): number;
  validate(): number;
  requestOldest(): Promise<number>;
  requestOldestSync(): number;
  dump(): string | null;
  sendCommand(target: string, cmd: string, arg: string, flags?: AVFilterCmdFlag): number | { response: string | null };
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): number;

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

  name: string | null;
  filterCtx: NativeFilterContext | null;
  padIdx: number;
  next: NativeFilterInOut | null;

  alloc(): void;
  free(): void;

  [Symbol.dispose](): void;
}

/**
 * Native AVHWDeviceContext binding interface
 *
 * Hardware device context for hardware acceleration.
 * Direct mapping to FFmpeg's AVHWDeviceContext.
 *
 * @internal
 */
export interface NativeHardwareDeviceContext extends Disposable {
  readonly __brand: 'NativeHardwareDeviceContext';

  readonly type: AVHWDeviceType;
  readonly hwctx: bigint | null;

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

  [Symbol.dispose](): void;
}

/**
 * Native AVHWFramesContext binding interface
 *
 * Hardware frames context for hardware acceleration.
 * Direct mapping to FFmpeg's AVHWFramesContext.
 *
 * @internal
 */
export interface NativeHardwareFramesContext extends Disposable {
  readonly __brand: 'NativeHardwareFramesContext';

  readonly deviceRef: NativeHardwareDeviceContext | null;
  format: AVPixelFormat;
  swFormat: AVPixelFormat;
  width: number;
  height: number;
  initialPoolSize: number;

  alloc(device: NativeHardwareDeviceContext): void;
  init(): number;
  getBuffer(frame: NativeFrame, flags?: number): number;
  transferData(dst: NativeFrame, src: NativeFrame, flags?: number): Promise<number>;
  transferDataSync(dst: NativeFrame, src: NativeFrame, flags?: number): number;
  transferGetFormats(direction: AVHWFrameTransferDirection): AVPixelFormat[] | number;
  map(dst: NativeFrame, src: NativeFrame, flags?: number): number;
  createDerived(format: AVPixelFormat, derivedDevice: NativeHardwareDeviceContext, source: NativeHardwareFramesContext, flags?: number): number;
  free(): void;

  [Symbol.dispose](): void;
}

/**
 * Native AVBitStreamFilter binding interface
 *
 * Represents a bitstream filter definition for modifying packet data.
 * This is an immutable descriptor - actual filtering happens via BitStreamFilterContext.
 * Used for tasks like H.264 annexb conversion, adding/removing metadata, or format adjustments.
 *
 * @internal
 */
export interface NativeBitStreamFilter {
  readonly __brand: 'NativeBitStreamFilter';

  readonly name: string | null;
  readonly codecIds: number[] | null;
}

/**
 * Native AVBSFContext binding interface
 *
 * The main interface for bitstream filtering operations.
 * Processes packets without full decode/encode, modifying headers, metadata, or format.
 * Must be allocated with a filter, initialized, and properly disposed after use.
 *
 * @internal
 */
export interface NativeBitStreamFilterContext extends Disposable {
  readonly __brand: 'NativeBitStreamFilterContext';

  // ===== Properties =====
  readonly inputCodecParameters: NativeCodecParameters | null;
  readonly outputCodecParameters: NativeCodecParameters | null;
  readonly outputTimeBase: IRational | null;
  readonly filter: NativeBitStreamFilter | null;
  inputTimeBase: IRational;

  alloc(filter: NativeBitStreamFilter): number;
  init(): number;
  free(): void;
  flush(): void;
  sendPacket(packet: NativePacket | null): Promise<number>;
  sendPacketSync(packet: NativePacket | null): number;
  receivePacket(packet: NativePacket): Promise<number>;
  receivePacketSync(packet: NativePacket): number;
  isInitialized(): boolean;

  [Symbol.dispose](): void;
}

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

  readonly name: string | null;
  readonly help: string | null;
  readonly type: AVOptionType;
  readonly defaultValue: unknown;
  readonly min: number;
  readonly max: number;
  readonly flags: AVOptionFlag;
  readonly unit: string | null;
}

/**
 * Interface for classes that wrap native objects
 *
 * @internal
 */
export interface NativeWrapper<T> {
  getNative(): T;
}
