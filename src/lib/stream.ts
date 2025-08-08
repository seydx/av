import { bindings } from './binding.js';
import { AV_MEDIA_TYPE_AUDIO, AV_MEDIA_TYPE_SUBTITLE, AV_MEDIA_TYPE_VIDEO, type AVDisposition } from './constants.js';

import type { CodecParameters } from './codec-parameters.js';
import type { Rational } from './rational.js';

export class Stream {
  private native: any;

  constructor() {
    this.native = new bindings.Stream();
  }

  // Core Properties
  get index(): number {
    return this.native.index;
  }

  get id(): number {
    return this.native.id;
  }

  set id(value: number) {
    this.native.id = value;
  }

  get duration(): bigint {
    return this.native.duration;
  }

  get nbFrames(): bigint {
    return this.native.nbFrames;
  }

  get startTime(): bigint {
    return this.native.startTime;
  }

  // Timing Properties
  get timeBase(): Rational {
    return this.native.timeBase;
  }

  set timeBase(value: Rational) {
    this.native.timeBase = value;
  }

  get avgFrameRate(): Rational {
    return this.native.avgFrameRate;
  }

  set avgFrameRate(value: Rational) {
    this.native.avgFrameRate = value;
  }

  get rFrameRate(): Rational {
    return this.native.rFrameRate;
  }

  set rFrameRate(value: Rational) {
    this.native.rFrameRate = value;
  }

  get sampleAspectRatio(): Rational {
    return this.native.sampleAspectRatio;
  }

  set sampleAspectRatio(value: Rational) {
    this.native.sampleAspectRatio = value;
  }

  // Configuration
  get discard(): number {
    return this.native.discard;
  }

  set discard(value: number) {
    this.native.discard = value;
  }

  get disposition(): AVDisposition {
    return this.native.disposition as AVDisposition;
  }

  set disposition(value: AVDisposition) {
    this.native.disposition = value;
  }

  get eventFlags(): number {
    return this.native.eventFlags;
  }

  get metadata(): Record<string, string> | null {
    return this.native.metadata;
  }

  set metadata(value: Record<string, string> | null) {
    this.native.metadata = value;
  }

  // Codec Parameters
  get codecParameters(): CodecParameters | null {
    return this.native.codecParameters;
  }

  // Helper methods
  isVideo(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_VIDEO : false;
  }

  isAudio(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_AUDIO : false;
  }

  isSubtitle(): boolean {
    const params = this.codecParameters;
    return params ? params.codecType === AV_MEDIA_TYPE_SUBTITLE : false;
  }

  hasDisposition(flag: AVDisposition): boolean {
    return (this.disposition & flag) !== 0;
  }

  addDisposition(flag: AVDisposition): void {
    this.disposition = (this.disposition | flag) as AVDisposition;
  }

  removeDisposition(flag: AVDisposition): void {
    this.disposition = (this.disposition & ~flag) as AVDisposition;
  }

  // Internal helper
  getNative(): any {
    return this.native;
  }

  // Static helper to wrap native stream
  static fromNative(nativeStream: any): Stream {
    const stream = new Stream();
    stream.native = nativeStream;
    return stream;
  }
}
