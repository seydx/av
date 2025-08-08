/**
 * AVOption wrapper for FFmpeg
 * Provides configuration options management
 */

import { bindings } from './binding.js';
import {
  type AVOptionType,
  type AVPixelFormat,
  type AVSampleFormat,
  AV_OPT_FLAG_AUDIO_PARAM,
  AV_OPT_FLAG_DECODING_PARAM,
  AV_OPT_FLAG_DEPRECATED,
  AV_OPT_FLAG_ENCODING_PARAM,
  AV_OPT_FLAG_EXPORT,
  AV_OPT_FLAG_READONLY,
  AV_OPT_FLAG_RUNTIME_PARAM,
  AV_OPT_FLAG_SUBTITLE_PARAM,
  AV_OPT_FLAG_VIDEO_PARAM,
  AV_OPT_SEARCH_FAKE_OBJ,
  AV_OPT_TYPE_BINARY,
  AV_OPT_TYPE_BOOL,
  AV_OPT_TYPE_CHLAYOUT,
  AV_OPT_TYPE_COLOR,
  AV_OPT_TYPE_CONST,
  AV_OPT_TYPE_DICT,
  AV_OPT_TYPE_DOUBLE,
  AV_OPT_TYPE_DURATION,
  AV_OPT_TYPE_FLAGS,
  AV_OPT_TYPE_FLOAT,
  AV_OPT_TYPE_IMAGE_SIZE,
  AV_OPT_TYPE_INT,
  AV_OPT_TYPE_INT64,
  AV_OPT_TYPE_PIXEL_FMT,
  AV_OPT_TYPE_RATIONAL,
  AV_OPT_TYPE_SAMPLE_FMT,
  AV_OPT_TYPE_STRING,
  AV_OPT_TYPE_UINT64,
  AV_OPT_TYPE_VIDEO_RATE,
} from './constants.js';
import { Rational } from './rational.js';

/**
 * Option search flags
 */
export enum OptionSearchFlags {
  /** Search in children of context */
  CHILDREN = 0x1,
  /** Search in fake object */
  FAKE_OBJECT = AV_OPT_SEARCH_FAKE_OBJ,
}

/**
 * Single AVOption descriptor
 */
export class Option {
  /** @internal */
  constructor(private readonly native: any) {}

  /**
   * Get option name
   */
  get name(): string {
    return this.native.name;
  }

  /**
   * Get option help text
   */
  get help(): string | null {
    return this.native.help;
  }

  /**
   * Get option type
   */
  get type(): AVOptionType {
    return this.native.type;
  }

  /**
   * Get default value
   */
  get defaultValue(): any {
    return this.native.defaultValue;
  }

  /**
   * Get minimum value
   */
  get min(): number {
    return this.native.min;
  }

  /**
   * Get maximum value
   */
  get max(): number {
    return this.native.max;
  }

  /**
   * Get option flags
   */
  get flags(): number {
    return this.native.flags;
  }

  /**
   * Get option unit (for grouped options)
   */
  get unit(): string | null {
    return this.native.unit;
  }

  /**
   * Check if option is for encoding
   */
  isEncodingParam(): boolean {
    return (this.flags & AV_OPT_FLAG_ENCODING_PARAM) !== 0;
  }

  /**
   * Check if option is for decoding
   */
  isDecodingParam(): boolean {
    return (this.flags & AV_OPT_FLAG_DECODING_PARAM) !== 0;
  }

  /**
   * Check if option is for audio
   */
  isAudioParam(): boolean {
    return (this.flags & AV_OPT_FLAG_AUDIO_PARAM) !== 0;
  }

  /**
   * Check if option is for video
   */
  isVideoParam(): boolean {
    return (this.flags & AV_OPT_FLAG_VIDEO_PARAM) !== 0;
  }

  /**
   * Check if option is for subtitles
   */
  isSubtitleParam(): boolean {
    return (this.flags & AV_OPT_FLAG_SUBTITLE_PARAM) !== 0;
  }

  /**
   * Check if option is deprecated
   */
  isDeprecated(): boolean {
    return (this.flags & AV_OPT_FLAG_DEPRECATED) !== 0;
  }

  /**
   * Check if option is read-only
   */
  isReadOnly(): boolean {
    return (this.flags & AV_OPT_FLAG_READONLY) !== 0;
  }

  /**
   * Check if option can be changed at runtime
   */
  isRuntimeParam(): boolean {
    return (this.flags & AV_OPT_FLAG_RUNTIME_PARAM) !== 0;
  }

  /**
   * Check if option should be exported
   */
  isExport(): boolean {
    return (this.flags & AV_OPT_FLAG_EXPORT) !== 0;
  }

  /**
   * Get option type name
   */
  getTypeName(): string {
    switch (this.type) {
      case AV_OPT_TYPE_FLAGS:
        return 'flags';
      case AV_OPT_TYPE_INT:
        return 'int';
      case AV_OPT_TYPE_INT64:
        return 'int64';
      case AV_OPT_TYPE_DOUBLE:
        return 'double';
      case AV_OPT_TYPE_FLOAT:
        return 'float';
      case AV_OPT_TYPE_STRING:
        return 'string';
      case AV_OPT_TYPE_RATIONAL:
        return 'rational';
      case AV_OPT_TYPE_BINARY:
        return 'binary';
      case AV_OPT_TYPE_DICT:
        return 'dict';
      case AV_OPT_TYPE_UINT64:
        return 'uint64';
      case AV_OPT_TYPE_CONST:
        return 'const';
      case AV_OPT_TYPE_IMAGE_SIZE:
        return 'image_size';
      case AV_OPT_TYPE_PIXEL_FMT:
        return 'pixel_fmt';
      case AV_OPT_TYPE_SAMPLE_FMT:
        return 'sample_fmt';
      case AV_OPT_TYPE_VIDEO_RATE:
        return 'video_rate';
      case AV_OPT_TYPE_DURATION:
        return 'duration';
      case AV_OPT_TYPE_COLOR:
        return 'color';
      case AV_OPT_TYPE_CHLAYOUT:
        return 'channel_layout';
      case AV_OPT_TYPE_BOOL:
        return 'bool';
      default:
        return 'unknown';
    }
  }
}

/**
 * AVOptions container for configuration management
 */
export class Options {
  /** @internal */
  constructor(private readonly native: any) {}

  /**
   * Create options from native context
   * @internal
   */
  static fromNative(context: any): Options {
    return new Options(new bindings.Options(context));
  }

  /**
   * Set string option
   * @param name Option name
   * @param value String value
   * @param searchFlags Search flags
   */
  set(name: string, value: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.set(name, value, searchFlags);
    } catch {
      throw new Error(`Failed to set option ${name}`);
    }
  }

  /**
   * Get string option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Option value or null
   */
  get(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): string | null {
    try {
      return this.native.get(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * Set integer option
   * @param name Option name
   * @param value Integer value
   * @param searchFlags Search flags
   */
  setInt(name: string, value: number, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.setInt(name, value, searchFlags);
    } catch {
      throw new Error(`Failed to set int option ${name}`);
    }
  }

  /**
   * Get integer option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Option value or null
   */
  getInt(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): number | null {
    try {
      return this.native.getInt(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * Set double option
   * @param name Option name
   * @param value Double value
   * @param searchFlags Search flags
   */
  setDouble(name: string, value: number, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.setDouble(name, value, searchFlags);
    } catch {
      throw new Error(`Failed to set double option ${name}`);
    }
  }

  /**
   * Get double option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Option value or null
   */
  getDouble(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): number | null {
    try {
      return this.native.getDouble(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * Set pixel format option
   * @param name Option name
   * @param format Pixel format
   * @param searchFlags Search flags
   */
  setPixelFormat(name: string, format: AVPixelFormat, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.setPixelFormat(name, format, searchFlags);
    } catch {
      throw new Error(`Failed to set pixel format option ${name}`);
    }
  }

  /**
   * Get pixel format option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Pixel format or null
   */
  getPixelFormat(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): AVPixelFormat | null {
    try {
      return this.native.getPixelFormat(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * Set sample format option
   * @param name Option name
   * @param format Sample format
   * @param searchFlags Search flags
   */
  setSampleFormat(name: string, format: AVSampleFormat, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.setSampleFormat(name, format, searchFlags);
    } catch {
      throw new Error(`Failed to set sample format option ${name}`);
    }
  }

  /**
   * Get sample format option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Sample format or null
   */
  getSampleFormat(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): AVSampleFormat | null {
    try {
      return this.native.getSampleFormat(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * Set channel layout option
   * @param name Option name
   * @param layout Channel layout string
   * @param searchFlags Search flags
   */
  setChannelLayout(name: string, layout: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    try {
      this.native.setChannelLayout(name, layout, searchFlags);
    } catch {
      throw new Error(`Failed to set channel layout option ${name}`);
    }
  }

  /**
   * Get channel layout option
   * @param name Option name
   * @param searchFlags Search flags
   * @returns Channel layout string or null
   */
  getChannelLayout(name: string, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): string | null {
    try {
      return this.native.getChannelLayout(name, searchFlags);
    } catch {
      return null;
    }
  }

  /**
   * List all available options
   * @returns Array of options
   */
  list(): Option[] {
    const options = this.native.list();
    return options.map((opt: any) => new Option(opt));
  }

  /**
   * Set all options to their default values
   */
  setDefaults(): void {
    this.native.setDefaults();
  }

  /**
   * Serialize options to string
   * @returns Serialized options string
   */
  serialize(): string {
    return this.native.serialize() ?? '';
  }

  /**
   * Set multiple options from object
   * @param options Options object
   * @param searchFlags Search flags
   */
  setOptions(options: Record<string, any>, searchFlags: OptionSearchFlags = OptionSearchFlags.CHILDREN): void {
    for (const [key, value] of Object.entries(options)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        this.set(key, value, searchFlags);
      } else if (typeof value === 'number') {
        // Try to determine if it's an int or double
        if (Number.isInteger(value)) {
          this.setInt(key, value, searchFlags);
        } else {
          this.setDouble(key, value, searchFlags);
        }
      } else if (typeof value === 'boolean') {
        this.setInt(key, value ? 1 : 0, searchFlags);
      } else if (value instanceof Rational) {
        this.set(key, `${value.num}/${value.den}`, searchFlags);
      }
    }
  }

  /**
   * Get all options as object
   * @returns Options object
   */
  getOptions(): Record<string, any> {
    const result: Record<string, any> = {};
    const options = this.list();

    for (const option of options) {
      const value = this.get(option.name);
      if (value !== null) {
        result[option.name] = value;
      }
    }

    return result;
  }
}
