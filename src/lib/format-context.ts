import { bindings } from './binding.js';
import { AV_ERROR_EOF } from './constants.js';
import { Dictionary } from './dictionary.js';
import { FFmpegError } from './error.js';
import { InputFormat } from './input-format.js';
import { Options } from './option.js';
import { OutputFormat } from './output-format.js';
import { Stream } from './stream.js';

import type { AVMediaType } from './constants.js';
import type { Packet } from './packet.js';

export enum SeekFlags {
  BACKWARD = 1, // Seek backward
  BYTE = 2, // Seeking based on position in bytes
  ANY = 4, // Seek to any frame, even non-keyframes
  FRAME = 8, // Seeking based on frame number
}

export class FormatContext implements Disposable {
  private context: any;
  private _options?: Options;

  constructor() {
    this.context = new bindings.FormatContext();
  }

  // Static factory methods
  static allocFormatContext(): FormatContext {
    const ctx = new FormatContext();
    ctx.context = bindings.FormatContext.allocFormatContext();
    return ctx;
  }

  static allocOutputFormatContext(outputFormat?: OutputFormat | null, formatName?: string, filename?: string): FormatContext {
    const ctx = new FormatContext();
    ctx.context = bindings.FormatContext.allocOutputFormatContext(outputFormat?.getNative() ?? null, formatName, filename);
    return ctx;
  }

  // Lifecycle
  async openInput(url: string, inputFormat?: InputFormat | null, options?: Dictionary): Promise<void> {
    return this.context.openInput(url, inputFormat?.getNative() ?? null, options?.getNative() ?? null);
  }

  closeInput(): void {
    this.context.closeInput();
  }

  // Stream Discovery
  async findStreamInfo(options?: Dictionary): Promise<void> {
    return this.context.findStreamInfo(options?.getNative() ?? null);
  }

  findBestStream(mediaType: AVMediaType, wantedStreamNb?: number, relatedStream?: number): number {
    return this.context.findBestStream(mediaType, wantedStreamNb ?? -1, relatedStream ?? -1);
  }

  // Reading
  readFrame(packet: Packet): number {
    const ret = this.context.readFrame(packet.nativePacket);
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
  writeHeader(options?: Dictionary): void {
    this.context.writeHeader(options?.getNative() ?? null);
  }

  writeFrame(packet: Packet | null): number {
    return this.context.writeFrame(packet ? packet.nativePacket : null);
  }

  writeInterleavedFrame(packet: Packet | null): number {
    return this.context.writeInterleavedFrame(packet ? packet.nativePacket : null);
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

  newStream(codec?: any): Stream {
    const nativeStream = this.context.newStream(codec);
    return Stream.fromNative(nativeStream);
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

  get metadata(): Dictionary | null {
    const native = this.context.metadata;
    if (!native) return null;
    // Convert the plain object to Dictionary
    return Dictionary.fromObject(native);
  }

  set metadata(value: Dictionary | null) {
    // Convert Dictionary to plain object for native code
    this.context.metadata = value?.toObject() ?? null;
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

  /**
   * Get AVOptions for this format context
   * Allows runtime configuration of format parameters
   */
  get options(): Options {
    this._options ??= new Options(this.context.options);
    return this._options;
  }

  // Format Info
  get inputFormat(): InputFormat | null {
    const native = this.context.inputFormat;
    if (!native) return null;
    return InputFormat.fromNative(native);
  }

  get outputFormat(): OutputFormat | null {
    const native = this.context.outputFormat;
    if (!native) return null;
    return OutputFormat.fromNative(native);
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
