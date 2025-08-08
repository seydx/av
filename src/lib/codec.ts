import { bindings } from './binding.js';
import { AV_CODEC_CAP_FRAME_THREADS, AV_CODEC_CAP_HARDWARE, AV_CODEC_CAP_SLICE_THREADS } from './constants.js';

import type { CodecChannelLayout } from './codec-parameters.js';
import type { AVCodecCap, AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';

export interface CodecProfile {
  profile: number;
  name?: string;
}

export class Codec {
  private native: any;

  constructor() {
    this.native = new bindings.Codec();
  }

  // Properties
  get name(): string | null {
    return this.native.name;
  }

  get longName(): string | null {
    return this.native.longName;
  }

  get id(): AVCodecID {
    return this.native.id;
  }

  get type(): AVMediaType {
    return this.native.type;
  }

  get capabilities(): AVCodecCap {
    return this.native.capabilities as AVCodecCap;
  }

  // Methods
  isDecoder(): boolean {
    return this.native.isDecoder();
  }

  isEncoder(): boolean {
    return this.native.isEncoder();
  }

  getPixelFormats(): AVPixelFormat[] {
    return this.native.getPixelFormats();
  }

  getSampleFormats(): AVSampleFormat[] {
    return this.native.getSampleFormats();
  }

  getSampleRates(): number[] {
    return this.native.getSampleRates();
  }

  getChannelLayouts(): CodecChannelLayout[] {
    return this.native.getChannelLayouts();
  }

  getProfiles(): CodecProfile[] {
    return this.native.getProfiles();
  }

  // Capability checks
  hasCapability(cap: AVCodecCap): boolean {
    return (this.capabilities & cap) !== 0;
  }

  supportsHardware(): boolean {
    return this.hasCapability(AV_CODEC_CAP_HARDWARE);
  }

  supportsMultithreading(): boolean {
    return this.hasCapability(AV_CODEC_CAP_FRAME_THREADS) || this.hasCapability(AV_CODEC_CAP_SLICE_THREADS);
  }

  // Static methods
  static findDecoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findDecoder(id);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  static findDecoderByName(name: string): Codec | null {
    const native = bindings.Codec.findDecoderByName(name);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  static findEncoder(id: AVCodecID): Codec | null {
    const native = bindings.Codec.findEncoder(id);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  static findEncoderByName(name: string): Codec | null {
    const native = bindings.Codec.findEncoderByName(name);
    if (!native) return null;

    const codec = new Codec();
    codec.native = native;
    return codec;
  }

  static getAllCodecs(): Codec[] {
    const natives = bindings.Codec.getAllCodecs();
    return natives.map((native: any) => {
      const codec = new Codec();
      codec.native = native;
      return codec;
    });
  }

  // Helper methods
  toString(): string {
    return this.name ?? 'unknown';
  }

  // Internal helper
  getNative(): any {
    return this.native;
  }

  // Static factory to wrap native codec
  static fromNative(nativeCodec: any): Codec {
    const codec = new Codec();
    codec.native = nativeCodec;
    return codec;
  }
}
