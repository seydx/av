import { bindings } from './binding.js';

import type { AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Rational } from './rational.js';

export interface CodecChannelLayout {
  nbChannels: number;
  order: number;
  mask: bigint;
}

export class CodecParameters {
  private native: any;

  constructor() {
    this.native = new bindings.CodecParameters();
  }

  // Media Type & Codec
  get codecType(): AVMediaType {
    return this.native.codecType;
  }

  set codecType(value: AVMediaType) {
    this.native.codecType = value;
  }

  get codecId(): AVCodecID {
    return this.native.codecId;
  }

  set codecId(value: AVCodecID) {
    this.native.codecId = value;
  }

  get codecTag(): number {
    return this.native.codecTag;
  }

  set codecTag(value: number) {
    this.native.codecTag = value;
  }

  // Bitrate
  get bitRate(): bigint {
    return this.native.bitRate;
  }

  set bitRate(value: bigint) {
    this.native.bitRate = value;
  }

  // Video Parameters
  get width(): number {
    return this.native.width;
  }

  set width(value: number) {
    this.native.width = value;
  }

  get height(): number {
    return this.native.height;
  }

  set height(value: number) {
    this.native.height = value;
  }

  get format(): number {
    return this.native.format;
  }

  set format(value: number) {
    this.native.format = value;
  }

  get pixelFormat(): AVPixelFormat {
    return this.native.format;
  }

  set pixelFormat(value: AVPixelFormat) {
    this.native.format = value;
  }

  get sampleAspectRatio(): Rational {
    return this.native.sampleAspectRatio;
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = value;
  }

  // Audio Parameters
  get sampleRate(): number {
    return this.native.sampleRate;
  }

  set sampleRate(value: number) {
    this.native.sampleRate = value;
  }

  get sampleFormat(): AVSampleFormat {
    return this.native.format;
  }

  set sampleFormat(value: AVSampleFormat) {
    this.native.format = value;
  }

  get channelLayout(): CodecChannelLayout {
    return this.native.channelLayout;
  }

  set channelLayout(value: CodecChannelLayout) {
    this.native.channelLayout = value;
  }

  get frameSize(): number {
    return this.native.frameSize;
  }

  set frameSize(value: number) {
    this.native.frameSize = value;
  }

  // Profile & Level
  get profile(): number {
    return this.native.profile;
  }

  set profile(value: number) {
    this.native.profile = value;
  }

  get level(): number {
    return this.native.level;
  }

  set level(value: number) {
    this.native.level = value;
  }

  // Color Properties
  get colorRange(): number {
    return this.native.colorRange;
  }

  set colorRange(value: number) {
    this.native.colorRange = value;
  }

  get colorSpace(): number {
    return this.native.colorSpace;
  }

  set colorSpace(value: number) {
    this.native.colorSpace = value;
  }

  get colorPrimaries(): number {
    return this.native.colorPrimaries;
  }

  set colorPrimaries(value: number) {
    this.native.colorPrimaries = value;
  }

  get colorTransferCharacteristic(): number {
    return this.native.colorTransferCharacteristic;
  }

  set colorTransferCharacteristic(value: number) {
    this.native.colorTransferCharacteristic = value;
  }

  get chromaLocation(): number {
    return this.native.chromaLocation;
  }

  set chromaLocation(value: number) {
    this.native.chromaLocation = value;
  }

  // Extra Data
  get extraData(): Buffer | null {
    return this.native.extraData;
  }

  set extraData(value: Buffer | null) {
    this.native.extraData = value;
  }

  // Methods
  copy(dst: CodecParameters): void {
    this.native.copy(dst.native);
  }

  fromCodecContext(ctx: any): void {
    this.native.fromCodecContext(ctx.native ?? ctx);
  }

  toCodecContext(ctx: any): void {
    this.native.toCodecContext(ctx.native ?? ctx);
  }

  // Symbol.dispose support
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }

  // Internal helper
  getNative(): any {
    return this.native;
  }

  // Static factory to wrap native codec parameters
  static fromNative(nativeParams: any): CodecParameters {
    const params = new CodecParameters();
    params.native = nativeParams;
    return params;
  }
}
