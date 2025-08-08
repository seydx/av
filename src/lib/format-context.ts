import { bindings } from './binding.js';
import { AV_ERROR_EOF } from './constants.js';
import { FFmpegError } from './error.js';
import { Stream } from './stream.js';

import type { AVMediaType } from './constants.js';
import type { Packet } from './packet.js';

export enum SeekFlags {
  BACKWARD = 1, // Seek backward
  BYTE = 2, // Seeking based on position in bytes
  ANY = 4, // Seek to any frame, even non-keyframes
  FRAME = 8, // Seeking based on frame number
}

export interface FormatInfo {
  name: string;
  longName?: string;
  mimeType?: string;
  flags: number;
}

export class FormatContext {
  private context: any;

  constructor() {
    this.context = new bindings.FormatContext();
  }

  // Static factory methods
  static allocFormatContext(): FormatContext {
    const ctx = new FormatContext();
    ctx.context = bindings.FormatContext.allocFormatContext();
    return ctx;
  }

  static allocOutputFormatContext(formatName: string, filename?: string): FormatContext {
    const ctx = new FormatContext();
    ctx.context = bindings.FormatContext.allocOutputFormatContext(formatName, filename);
    return ctx;
  }

  // Lifecycle
  async openInput(url: string, inputFormat?: any, options?: Record<string, any>): Promise<void> {
    return this.context.openInput(url, inputFormat, options);
  }

  closeInput(): void {
    this.context.closeInput();
  }

  // Stream Discovery
  async findStreamInfo(options?: Record<string, any>): Promise<void> {
    return this.context.findStreamInfo(options);
  }

  findBestStream(mediaType: AVMediaType, wantedStreamNb?: number, relatedStream?: number): number {
    return this.context.findBestStream(mediaType, wantedStreamNb ?? -1, relatedStream ?? -1);
  }

  // Reading
  readFrame(packet: Packet): number {
    const ret = this.context.readFrame((packet as any).nativePacket);
    if (ret < 0 && ret !== AV_ERROR_EOF) {
      throw new FFmpegError(ret, 'Failed to read frame');
    }
    return ret;
  }

  seekFrame(streamIndex: number, timestamp: bigint, flags: number): number {
    return this.context.seekFrame(streamIndex, timestamp, flags);
  }

  seekFile(streamIndex: number, minTs: bigint, ts: bigint, maxTs: bigint, flags?: number): number {
    return this.context.seekFile(streamIndex, minTs, ts, maxTs, flags ?? 0);
  }

  flush(): void {
    this.context.flush();
  }

  // Writing
  writeHeader(options?: Record<string, any>): void {
    this.context.writeHeader(options);
  }

  writeFrame(packet: Packet | null): number {
    return this.context.writeFrame(packet ? (packet as any).nativePacket : null);
  }

  writeInterleavedFrame(packet: Packet | null): number {
    return this.context.writeInterleavedFrame(packet ? (packet as any).nativePacket : null);
  }

  writeTrailer(): void {
    this.context.writeTrailer();
  }

  // Stream Management
  get streams(): Stream[] {
    const nativeStreams = this.context.streams;
    return nativeStreams.map((s: any) => Stream.fromNative(s));
  }

  get nbStreams(): number {
    return this.context.nbStreams;
  }

  newStream(codec?: any): number {
    return this.context.newStream(codec);
  }

  // Properties
  get url(): string | null {
    return this.context.url;
  }

  get duration(): bigint {
    return this.context.duration;
  }

  get startTime(): bigint {
    return this.context.startTime;
  }

  get bitRate(): bigint {
    return this.context.bitRate;
  }

  get metadata(): Record<string, string> | null {
    return this.context.metadata;
  }

  set metadata(value: Record<string, string> | null) {
    this.context.metadata = value;
  }

  get flags(): number {
    return this.context.flags;
  }

  set flags(value: number) {
    this.context.flags = value;
  }

  get maxAnalyzeDuration(): bigint {
    return this.context.maxAnalyzeDuration;
  }

  set maxAnalyzeDuration(value: bigint) {
    this.context.maxAnalyzeDuration = value;
  }

  get probesize(): bigint {
    return this.context.probesize;
  }

  set probesize(value: bigint) {
    this.context.probesize = value;
  }

  // Format Info
  get inputFormat(): FormatInfo | null {
    return this.context.inputFormat;
  }

  get outputFormat(): FormatInfo | null {
    return this.context.outputFormat;
  }

  // Utility
  dump(index = 0, isOutput = false): void {
    this.context.dump(index, isOutput);
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
