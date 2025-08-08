import { AV_ERROR_EAGAIN, AV_ERROR_EOF } from './constants.js';
import { FFmpegError } from './error.js';
import { Options } from './option.js';

import type { AVCodecFlag, AVCodecFlag2, AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { Packet } from './packet.js';
import type { Rational } from './rational.js';

import { bindings } from './binding.js';

export interface ChannelLayout {
  nbChannels: number;
  order: number;
  mask: bigint;
}

export class CodecContext implements Disposable {
  private context: any;
  private _options?: Options;

  constructor(codec?: any) {
    this.context = codec ? new bindings.CodecContext(codec) : new bindings.CodecContext();
  }

  // Lifecycle
  open(options?: Record<string, any>): void {
    this.context.open(options);
  }

  close(): void {
    this.context.close();
  }

  flushBuffers(): void {
    this.context.flushBuffers();
  }

  // Encoding/Decoding
  sendPacket(packet: Packet | null): number {
    const ret = this.context.sendPacket((packet as any)?.nativePacket ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send packet');
    }
    return ret;
  }

  receiveFrame(frame: Frame): number {
    const ret = this.context.receiveFrame((frame as any).nativeFrame);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive frame');
    }
    return ret;
  }

  sendFrame(frame: Frame | null): number {
    const ret = this.context.sendFrame((frame as any)?.nativeFrame ?? null);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to send frame');
    }
    return ret;
  }

  receivePacket(packet: Packet): number {
    const ret = this.context.receivePacket((packet as any).nativePacket);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to receive packet');
    }
    return ret;
  }

  // Properties - General
  get codecID(): AVCodecID {
    return this.context.codecID as AVCodecID;
  }

  set codecID(value: AVCodecID) {
    this.context.codecID = value;
  }

  get mediaType(): AVMediaType {
    return this.context.mediaType as AVMediaType;
  }

  set mediaType(value: AVMediaType) {
    this.context.mediaType = value;
  }

  get bitRate(): bigint {
    return this.context.bitRate;
  }

  set bitRate(value: bigint) {
    this.context.bitRate = value;
  }

  get timeBase(): Rational {
    return this.context.timeBase;
  }

  set timeBase(value: Rational) {
    this.context.timeBase = value;
  }

  get level(): number {
    return this.context.level;
  }

  set level(value: number) {
    this.context.level = value;
  }

  get profile(): number {
    return this.context.profile;
  }

  set profile(value: number) {
    this.context.profile = value;
  }

  get threadCount(): number {
    return this.context.threadCount;
  }

  set threadCount(value: number) {
    this.context.threadCount = value;
  }

  get threadType(): number {
    return this.context.threadType;
  }

  set threadType(value: number) {
    this.context.threadType = value;
  }

  /**
   * Codec flags. Use AV_CODEC_FLAG_* constants.
   * Example: ctx.flags |= AV_CODEC_FLAG_COPY_OPAQUE to pass opaque data through codec
   */
  get flags(): AVCodecFlag {
    return this.context.flags as AVCodecFlag;
  }

  set flags(value: AVCodecFlag) {
    this.context.flags = value;
  }

  get flags2(): AVCodecFlag2 {
    return this.context.flags2 as AVCodecFlag2;
  }

  set flags2(value: AVCodecFlag2) {
    this.context.flags2 = value;
  }

  get extraData(): Buffer | null {
    return this.context.extraData;
  }

  set extraData(value: Buffer | null) {
    this.context.extraData = value;
  }

  /**
   * Get AVOptions for this codec context
   * Allows runtime configuration of codec parameters
   */
  get options(): Options {
    this._options ??= new Options(this.context.options);
    return this._options;
  }

  // Properties - Video
  get width(): number {
    return this.context.width;
  }

  set width(value: number) {
    this.context.width = value;
  }

  get height(): number {
    return this.context.height;
  }

  set height(value: number) {
    this.context.height = value;
  }

  get pixelFormat(): AVPixelFormat {
    return this.context.pixelFormat as AVPixelFormat;
  }

  set pixelFormat(value: AVPixelFormat) {
    this.context.pixelFormat = value;
  }

  get framerate(): Rational {
    return this.context.framerate;
  }

  set framerate(value: Rational) {
    this.context.framerate = value;
  }

  get sampleAspectRatio(): Rational {
    return this.context.sampleAspectRatio;
  }

  set sampleAspectRatio(value: Rational) {
    this.context.sampleAspectRatio = value;
  }

  get gopSize(): number {
    return this.context.gopSize;
  }

  set gopSize(value: number) {
    this.context.gopSize = value;
  }

  get maxBFrames(): number {
    return this.context.maxBFrames;
  }

  set maxBFrames(value: number) {
    this.context.maxBFrames = value;
  }

  get colorSpace(): number {
    return this.context.colorSpace;
  }

  set colorSpace(value: number) {
    this.context.colorSpace = value;
  }

  get colorRange(): number {
    return this.context.colorRange;
  }

  set colorRange(value: number) {
    this.context.colorRange = value;
  }

  // Properties - Audio
  get sampleRate(): number {
    return this.context.sampleRate;
  }

  set sampleRate(value: number) {
    this.context.sampleRate = value;
  }

  get sampleFormat(): AVSampleFormat {
    return this.context.sampleFormat as AVSampleFormat;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.context.sampleFormat = value;
  }

  get channelLayout(): ChannelLayout {
    return this.context.channelLayout;
  }

  set channelLayout(value: ChannelLayout) {
    this.context.channelLayout = value;
  }

  get channels(): number {
    return this.context.channels;
  }

  get frameSize(): number {
    return this.context.frameSize;
  }

  set frameSize(value: number) {
    this.context.frameSize = value;
  }

  // Properties - Rate Control
  get rcMaxRate(): bigint {
    return this.context.rcMaxRate;
  }

  set rcMaxRate(value: bigint) {
    this.context.rcMaxRate = value;
  }

  get rcMinRate(): bigint {
    return this.context.rcMinRate;
  }

  set rcMinRate(value: bigint) {
    this.context.rcMinRate = value;
  }

  get rcBufferSize(): number {
    return this.context.rcBufferSize;
  }

  set rcBufferSize(value: number) {
    this.context.rcBufferSize = value;
  }

  // Utility
  get isEncoder(): boolean {
    return this.context.isEncoder;
  }

  get isDecoder(): boolean {
    return this.context.isDecoder;
  }

  // Symbol.dispose support
  [Symbol.dispose](): void {
    this.context[Symbol.dispose]();
  }

  // Internal helper
  getNative(): any {
    return this.context;
  }
}
