import {
  AV_OPT_SEARCH_CHILDREN,
  AV_OPT_TYPE_BINARY,
  AV_OPT_TYPE_BINARY_INT_ARRAY,
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
  AV_OPT_TYPE_UINT,
  AV_OPT_TYPE_UINT64,
  AV_OPT_TYPE_VIDEO_RATE,
  AVFLAG_NONE,
} from '../constants/constants.js';
import { bindings } from './binding.js';
import { Dictionary } from './dictionary.js';
import { Rational } from './rational.js';

import type {
  AVOptionFlag,
  AVOptionSearchFlags,
  AVOptionType,
  AVOptionTypeBinary,
  AVOptionTypeBinaryIntArray,
  AVOptionTypeBool,
  AVOptionTypeChLayout,
  AVOptionTypeColor,
  AVOptionTypeConst,
  AVOptionTypeDict,
  AVOptionTypeDouble,
  AVOptionTypeDuration,
  AVOptionTypeFlags,
  AVOptionTypeFloat,
  AVOptionTypeImageSize,
  AVOptionTypeInt,
  AVOptionTypeInt64,
  AVOptionTypePixelFmt,
  AVOptionTypeRational,
  AVOptionTypeSampleFmt,
  AVOptionTypeString,
  AVOptionTypeUint,
  AVOptionTypeUint64,
  AVOptionTypeVideoRate,
  AVPixelFormat,
  AVSampleFormat,
} from '../constants/index.js';
import type { OptionCapableObject } from './binding.js';
import type { NativeOption } from './native-types.js';
import type { ChannelLayout, IRational } from './types.js';

/**
 * Option information descriptor.
 *
 * Describes a single option available on an FFmpeg object.
 * Contains metadata about the option including name, type, default value,
 * valid range, and documentation. Used to discover and validate options.
 *
 * Direct mapping to FFmpeg's AVOption.
 *
 * @example
 * ```typescript
 * import { Option } from 'node-av';
 *
 * // Get option info
 * const optInfo = Option.find(obj, 'bitrate');
 * if (optInfo) {
 *   console.log(`Option: ${optInfo.name}`);
 *   console.log(`Help: ${optInfo.help}`);
 *   console.log(`Type: ${optInfo.type}`);
 *   console.log(`Default: ${optInfo.defaultValue}`);
 *   console.log(`Range: ${optInfo.min} - ${optInfo.max}`);
 * }
 * ```
 *
 * @see [AVOption](https://ffmpeg.org/doxygen/trunk/structAVOption.html) - FFmpeg Doxygen
 */
export class OptionInfo {
  private native: NativeOption;

  /**
   * @param native - The native option instance
   * @internal
   */
  constructor(native: NativeOption) {
    this.native = native;
  }

  /**
   * Option name.
   *
   * The name used to get/set this option.
   *
   * Direct mapping to AVOption->name.
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Option help text.
   *
   * Human-readable description of the option's purpose.
   *
   * Direct mapping to AVOption->help.
   */
  get help(): string | null {
    return this.native.help;
  }

  /**
   * Option type.
   *
   * Data type of the option value (AV_OPT_TYPE_*).
   *
   * Direct mapping to AVOption->type.
   */
  get type(): AVOptionType {
    return this.native.type;
  }

  /**
   * Default value.
   *
   * The default value for this option.
   * Type depends on the option type.
   *
   * Direct mapping to AVOption->default_val.
   */
  get defaultValue(): unknown {
    return this.native.defaultValue;
  }

  /**
   * Minimum value.
   *
   * Minimum valid value for numeric options.
   *
   * Direct mapping to AVOption->min.
   */
  get min(): number {
    return this.native.min;
  }

  /**
   * Maximum value.
   *
   * Maximum valid value for numeric options.
   *
   * Direct mapping to AVOption->max.
   */
  get max(): number {
    return this.native.max;
  }

  /**
   * Option flags.
   *
   * Combination of AV_OPT_FLAG_* indicating option properties.
   *
   * Direct mapping to AVOption->flags.
   */
  get flags(): AVOptionFlag {
    return this.native.flags;
  }

  /**
   * Option unit.
   *
   * Unit string for grouping related options.
   *
   * Direct mapping to AVOption->unit.
   */
  get unit(): string | null {
    return this.native.unit;
  }

  /**
   * Get the underlying native Option object.
   *
   * @returns The native Option binding object
   *
   * @internal
   */
  getNative(): NativeOption {
    return this.native;
  }
}

/**
 * FFmpeg option management utilities.
 *
 * Provides static methods for getting, setting, and querying options
 * on FFmpeg objects that support the AVOption API. Handles type conversion
 * and validation for various option types including strings, numbers,
 * rationals, pixel formats, and more.
 *
 * Direct mapping to FFmpeg's AVOption API.
 *
 * @example
 * ```typescript
 * import { Option, FFmpegError } from 'node-av';
 * import { AV_OPT_SEARCH_CHILDREN, AV_PIX_FMT_YUV420P } from 'node-av/constants';
 *
 * // Set various option types
 * let ret = Option.set(obj, 'preset', 'fast');
 * FFmpegError.throwIfError(ret, 'set preset');
 *
 * ret = Option.setInt(obj, 'bitrate', 2000000);
 * FFmpegError.throwIfError(ret, 'set bitrate');
 *
 * ret = Option.setRational(obj, 'framerate', { num: 30, den: 1 });
 * FFmpegError.throwIfError(ret, 'set framerate');
 *
 * // Get option values
 * const preset = Option.get(obj, 'preset');
 * const bitrate = Option.getInt(obj, 'bitrate');
 * const framerate = Option.getRational(obj, 'framerate');
 *
 * // List all options
 * let opt = null;
 * while ((opt = Option.next(obj, opt))) {
 *   console.log(`${opt.name}: ${opt.help}`);
 * }
 * ```
 *
 * @see [AVOption API](https://ffmpeg.org/doxygen/trunk/group__avoptions.html) - FFmpeg Doxygen
 * @see {@link OptionMember} For inherited option support
 */
export class Option {
  /**
   * Iterate to next option.
   *
   * Iterates through available options on an object.
   *
   * Direct mapping to av_opt_next().
   *
   * @param obj - Object with options
   * @param prev - Previous option (null to get first)
   * @returns Next option, or null if no more
   *
   * @example
   * ```typescript
   * let opt = null;
   * while ((opt = Option.next(obj, opt))) {
   *   console.log(`Option: ${opt.name}`);
   * }
   * ```
   */
  static next(obj: OptionCapableObject, prev: OptionInfo | null = null): OptionInfo | null {
    const result = bindings.Option.next(obj, prev?.getNative());
    return result ? new OptionInfo(result) : null;
  }

  /**
   * Find option by name.
   *
   * Searches for an option with the specified name.
   *
   * Direct mapping to av_opt_find().
   *
   * @param obj - Object to search
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Option info if found, null otherwise
   *
   * @example
   * ```typescript
   * const opt = Option.find(obj, 'bitrate');
   * if (opt) {
   *   console.log(`Found: ${opt.name}, Type: ${opt.type}`);
   * }
   * ```
   */
  static find(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): OptionInfo | null {
    const result = bindings.Option.find(obj, name, searchFlags);
    return result ? new OptionInfo(result) : null;
  }

  /**
   * Find option with target info.
   *
   * Like find() but also indicates if option was found on different target.
   *
   * Direct mapping to av_opt_find2().
   *
   * @param obj - Object to search
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Object with option and target info
   *
   * @example
   * ```typescript
   * const result = Option.find2(obj, 'bitrate', AV_OPT_SEARCH_CHILDREN);
   * if (result?.option) {
   *   console.log(`Found on ${result.isDifferentTarget ? 'child' : 'object'}`);
   * }
   * ```
   */
  static find2(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): { option: OptionInfo | null; isDifferentTarget: boolean } | null {
    const result = bindings.Option.find2(obj, name, searchFlags);
    if (!result) return null;
    return {
      option: result.option ? new OptionInfo(result.option) : null,
      isDifferentTarget: result.isDifferentTarget,
    };
  }

  /**
   * Get string option value.
   *
   * Direct mapping to av_opt_get().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Option value as string, or null
   */
  static get(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): string | null {
    return bindings.Option.get(obj, name, searchFlags);
  }

  /**
   * Get integer option value.
   *
   * Direct mapping to av_opt_get_int().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Option value as integer, or null
   */
  static getInt(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number | null {
    return bindings.Option.getInt(obj, name, searchFlags);
  }

  /**
   * Get double option value.
   *
   * Direct mapping to av_opt_get_double().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Option value as double, or null
   */
  static getDouble(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number | null {
    return bindings.Option.getDouble(obj, name, searchFlags);
  }

  /**
   * Get rational option value.
   *
   * Direct mapping to av_opt_get_q().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Option value as rational, or null
   */
  static getRational(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): IRational | null {
    return bindings.Option.getRational(obj, name, searchFlags);
  }

  /**
   * Get pixel format option value.
   *
   * Direct mapping to av_opt_get_pixel_fmt().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Pixel format value, or null
   */
  static getPixelFormat(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): AVPixelFormat | null {
    return bindings.Option.getPixelFormat(obj, name, searchFlags);
  }

  /**
   * Get sample format option value.
   *
   * Direct mapping to av_opt_get_sample_fmt().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Sample format value, or null
   */
  static getSampleFormat(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): AVSampleFormat | null {
    return bindings.Option.getSampleFormat(obj, name, searchFlags);
  }

  /**
   * Get image size option value.
   *
   * Direct mapping to av_opt_get_image_size().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Width and height, or null
   */
  static getImageSize(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): { width: number; height: number } | null {
    return bindings.Option.getImageSize(obj, name, searchFlags);
  }

  /**
   * Get channel layout option value.
   *
   * Direct mapping to av_opt_get_chlayout().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Channel layout, or null
   */
  static getChannelLayout(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): ChannelLayout | null {
    return bindings.Option.getChannelLayout(obj, name, searchFlags);
  }

  /**
   * Get dictionary option value.
   *
   * Direct mapping to av_opt_get_dict_val().
   *
   * @param obj - Object to query
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns Dictionary value, or null
   */
  static getDict(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): Dictionary | null {
    const native = bindings.Option.getDict(obj, name, searchFlags);
    return native ? Dictionary.fromNative(native) : null;
  }

  /**
   * Set string option value.
   *
   * Direct mapping to av_opt_set().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - String value
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static set(obj: OptionCapableObject, name: string, value: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.set(obj, name, value, searchFlags);
  }

  /**
   * Set integer option value.
   *
   * Direct mapping to av_opt_set_int().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Integer value
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setInt(obj: OptionCapableObject, name: string, value: number | bigint, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setInt(obj, name, value, searchFlags);
  }

  /**
   * Set double option value.
   *
   * Direct mapping to av_opt_set_double().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Double value
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setDouble(obj: OptionCapableObject, name: string, value: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setDouble(obj, name, value, searchFlags);
  }

  /**
   * Set rational option value.
   *
   * Direct mapping to av_opt_set_q().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Rational value
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setRational(obj: OptionCapableObject, name: string, value: IRational, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setRational(obj, name, value, searchFlags);
  }

  /**
   * Set pixel format option value.
   *
   * Direct mapping to av_opt_set_pixel_fmt().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Pixel format
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setPixelFormat(obj: OptionCapableObject, name: string, value: AVPixelFormat, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setPixelFormat(obj, name, value, searchFlags);
  }

  /**
   * Set sample format option value.
   *
   * Direct mapping to av_opt_set_sample_fmt().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Sample format
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setSampleFormat(obj: OptionCapableObject, name: string, value: AVSampleFormat, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setSampleFormat(obj, name, value, searchFlags);
  }

  /**
   * Set image size option value.
   *
   * Direct mapping to av_opt_set_image_size().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param width - Image width
   * @param height - Image height
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setImageSize(obj: OptionCapableObject, name: string, width: number, height: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setImageSize(obj, name, width, height, searchFlags);
  }

  /**
   * Set channel layout option value.
   *
   * Direct mapping to av_opt_set_chlayout().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Channel layout
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setChannelLayout(obj: OptionCapableObject, name: string, value: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setChannelLayout(obj, name, value, searchFlags);
  }

  /**
   * Set dictionary option value.
   *
   * Direct mapping to av_opt_set_dict_val().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Dictionary value
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setDict(obj: OptionCapableObject, name: string, value: Dictionary, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setDict(obj, name, value.getNative(), searchFlags);
  }

  /**
   * Set binary option value.
   *
   * Direct mapping to av_opt_set_bin().
   *
   * @param obj - Object to modify
   * @param name - Option name
   * @param value - Binary data
   * @param searchFlags - Search flags
   * @returns 0 on success, negative AVERROR on error
   */
  static setBin(obj: OptionCapableObject, name: string, value: Buffer, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setBin(obj, name, value, searchFlags);
  }

  /**
   * Set defaults on object.
   *
   * Sets all options to their default values.
   *
   * Direct mapping to av_opt_set_defaults().
   *
   * @param obj - Object to reset
   */
  static setDefaults(obj: OptionCapableObject): void {
    bindings.Option.setDefaults(obj);
  }

  /**
   * Copy options between objects.
   *
   * Copies option values from source to destination.
   *
   * Direct mapping to av_opt_copy().
   *
   * @param dest - Destination object
   * @param src - Source object
   * @returns 0 on success, negative AVERROR on error
   */
  static copy(dest: OptionCapableObject, src: OptionCapableObject): number {
    return bindings.Option.copy(dest, src);
  }

  /**
   * Check if option is set to default.
   *
   * Direct mapping to av_opt_is_set_to_default().
   *
   * @param obj - Object to check
   * @param name - Option name
   * @param searchFlags - Search flags
   * @returns True if default, false if modified, null if not found
   */
  static isSetToDefault(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): boolean | null {
    return bindings.Option.isSetToDefault(obj, name, searchFlags);
  }

  /**
   * Serialize options to string.
   *
   * Direct mapping to av_opt_serialize().
   *
   * @param obj - Object to serialize
   * @param optFlags - Option flags filter
   * @param flags - Serialization flags
   * @param keyValSep - Key-value separator
   * @param pairsSep - Pairs separator
   * @returns Serialized string, or null on error
   */
  static serialize(obj: OptionCapableObject, optFlags = 0, flags = 0, keyValSep = '=', pairsSep = ','): string | null {
    return bindings.Option.serialize(obj, optFlags, flags, keyValSep, pairsSep);
  }

  /**
   * Free option resources.
   *
   * Direct mapping to av_opt_free().
   *
   * @param obj - Object to free options from
   */
  static free(obj: OptionCapableObject): void {
    bindings.Option.free(obj);
  }

  /**
   * Show options for debugging.
   *
   * Direct mapping to av_opt_show2().
   *
   * @param obj - Object to show options for
   * @param reqFlags - Required flags
   * @param rejFlags - Rejected flags
   * @returns 0 on success, negative AVERROR on error
   */
  static show(obj: OptionCapableObject, reqFlags = 0, rejFlags = 0): number {
    return bindings.Option.show(obj, reqFlags, rejFlags);
  }
}

/**
 * Base class for FFmpeg objects that support AVOptions.
 *
 * Provides a common interface for getting, setting, and listing options
 * on FFmpeg objects that have an AVClass structure. This includes codecs,
 * formats, filters, and various processing contexts.
 *
 * Classes that support AVOptions should extend this class to inherit
 * the option management functionality.
 *
 * @template T - The native FFmpeg object type that supports AVOptions
 *
 * @example
 * ```typescript
 * import { OptionMember, FFmpegError } from 'node-av';
 * import { AV_OPT_TYPE_INT, AV_OPT_TYPE_STRING, AV_OPT_TYPE_RATIONAL } from 'node-av/constants';
 *
 * class CodecContext extends OptionMember<NativeCodecContext> {
 *   constructor(native: NativeCodecContext) {
 *     super(native);
 *   }
 * }
 *
 * // Use inherited methods
 * const codec = new CodecContext(native);
 *
 * // Set options with automatic type handling
 * let ret = codec.setOption('preset', 'fast');
 * FFmpegError.throwIfError(ret, 'set preset');
 *
 * ret = codec.setOption('bitrate', 2000000, AV_OPT_TYPE_INT);
 * FFmpegError.throwIfError(ret, 'set bitrate');
 *
 * ret = codec.setOption('framerate', { num: 30, den: 1 }, AV_OPT_TYPE_RATIONAL);
 * FFmpegError.throwIfError(ret, 'set framerate');
 *
 * // Get typed options
 * const preset = codec.getOption('preset');
 * const bitrate = codec.getOption('bitrate', AV_OPT_TYPE_INT);
 * const framerate = codec.getOption('framerate', AV_OPT_TYPE_RATIONAL);
 *
 * // List all available options
 * const options = codec.listOptions();
 * for (const opt of options) {
 *   console.log(`${opt.name}: ${opt.help}`);
 * }
 * ```
 *
 * @see {@link Option} For static option methods
 * @see {@link OptionInfo} For option metadata
 */
export class OptionMember<T extends OptionCapableObject> {
  protected native: T;

  constructor(native: T) {
    this.native = native;
  }

  // String options
  setOption(name: string, value: string, type?: AVOptionTypeString, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: string, type: AVOptionTypeColor, searchFlags?: AVOptionSearchFlags): number;

  // Integer options
  setOption(name: string, value: number, type: AVOptionTypeInt, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: bigint, type: AVOptionTypeInt64, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number, type: AVOptionTypeUint, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: bigint, type: AVOptionTypeUint64, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number, type: AVOptionTypeFlags, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: boolean, type: AVOptionTypeBool, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number, type: AVOptionTypeDuration, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number, type: AVOptionTypeConst, searchFlags?: AVOptionSearchFlags): number;

  // Float options
  setOption(name: string, value: number, type: AVOptionTypeDouble, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number, type: AVOptionTypeFloat, searchFlags?: AVOptionSearchFlags): number;

  // Complex types
  setOption(name: string, value: IRational, type: AVOptionTypeRational, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: IRational, type: AVOptionTypeVideoRate, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: AVPixelFormat, type: AVOptionTypePixelFmt, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: AVSampleFormat, type: AVOptionTypeSampleFmt, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: { width: number; height: number }, type: AVOptionTypeImageSize, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number | bigint, type: AVOptionTypeChLayout, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: Buffer, type: AVOptionTypeBinary, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: number[], type: AVOptionTypeBinaryIntArray, searchFlags?: AVOptionSearchFlags): number;
  setOption(name: string, value: Dictionary, type: AVOptionTypeDict, searchFlags?: AVOptionSearchFlags): number;

  /**
   * Set an option on this object.
   *
   * Uses the AVOption API to set options.
   * Available options depend on the specific object type.
   *
   * Direct mapping to av_opt_set* functions.
   *
   * @param name - Option name
   * @param value - Option value
   * @param type - Option type (defaults to AV_OPT_TYPE_STRING)
   * @param searchFlags - Search flags (default: AV_OPT_SEARCH_CHILDREN)
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_ENOENT: Option not found
   *   - AVERROR_ERANGE: Value out of range
   *   - AVERROR_EINVAL: Invalid value
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AV_OPT_TYPE_STRING, AV_OPT_TYPE_INT64, AV_OPT_TYPE_RATIONAL, AV_OPT_TYPE_PIXEL_FMT } from 'node-av/constants';
   *
   * // String options (default)
   * let ret = obj.setOption('preset', 'fast');
   * FFmpegError.throwIfError(ret, 'set preset');
   *
   * ret = obj.setOption('codec', 'h264', AV_OPT_TYPE_STRING);
   * FFmpegError.throwIfError(ret, 'set codec');
   *
   * // Integer options
   * ret = obj.setOption('bitrate', 2000000, AV_OPT_TYPE_INT64);
   * FFmpegError.throwIfError(ret, 'set bitrate');
   *
   * ret = obj.setOption('threads', 4, AV_OPT_TYPE_INT);
   * FFmpegError.throwIfError(ret, 'set threads');
   *
   * // Complex types with proper types
   * ret = obj.setOption('framerate', {num: 30, den: 1}, AV_OPT_TYPE_RATIONAL);
   * FFmpegError.throwIfError(ret, 'set framerate');
   *
   * ret = obj.setOption('pix_fmt', AV_PIX_FMT_YUV420P, AV_OPT_TYPE_PIXEL_FMT);
   * FFmpegError.throwIfError(ret, 'set pixel format');
   * ```
   */
  setOption(name: string, value: any, type: AVOptionType = AV_OPT_TYPE_STRING, searchFlags: AVOptionSearchFlags = AV_OPT_SEARCH_CHILDREN): number {
    // Use specific setter based on type
    switch (type) {
      case AV_OPT_TYPE_STRING:
      case AV_OPT_TYPE_COLOR: // Colors are set as strings
        return Option.set(this.native, name, String(value), searchFlags);

      case AV_OPT_TYPE_INT:
        const intVal = Number(value);
        if (!Number.isInteger(intVal)) {
          throw new TypeError(`Option '${name}': Expected integer value, got ${value}`);
        }
        return Option.setInt(this.native, name, intVal, searchFlags);

      case AV_OPT_TYPE_UINT:
        const uintVal = Number(value);
        if (!Number.isInteger(uintVal) || uintVal < 0) {
          throw new RangeError(`Option '${name}': Expected non-negative integer value, got ${value}`);
        }
        return Option.setInt(this.native, name, uintVal, searchFlags);

      case AV_OPT_TYPE_FLAGS:
      case AV_OPT_TYPE_DURATION:
      case AV_OPT_TYPE_CONST:
        return Option.setInt(this.native, name, Number(value), searchFlags);

      case AV_OPT_TYPE_BOOL:
        // Convert to 0 or 1 for FFmpeg
        return Option.setInt(this.native, name, value ? 1 : 0, searchFlags);

      case AV_OPT_TYPE_INT64:
        // Accept both bigint and number
        if (typeof value === 'bigint') {
          return Option.setInt(this.native, name, value, searchFlags);
        } else if (typeof value === 'number') {
          if (!Number.isInteger(value)) {
            throw new TypeError(`Option '${name}': Expected integer value for INT64, got ${value}`);
          }
          return Option.setInt(this.native, name, value, searchFlags);
        } else {
          throw new TypeError(`Option '${name}': Expected bigint or number for INT64, got ${typeof value}`);
        }

      case AV_OPT_TYPE_UINT64:
        // Accept both bigint and number, but must be non-negative
        if (typeof value === 'bigint') {
          if (value < 0n) {
            throw new RangeError(`Option '${name}': Expected non-negative value for UINT64, got ${value}`);
          }
          return Option.setInt(this.native, name, value, searchFlags);
        } else if (typeof value === 'number') {
          if (!Number.isInteger(value) || value < 0) {
            throw new RangeError(`Option '${name}': Expected non-negative integer for UINT64, got ${value}`);
          }
          return Option.setInt(this.native, name, value, searchFlags);
        } else {
          throw new TypeError(`Option '${name}': Expected bigint or number for UINT64, got ${typeof value}`);
        }

      case AV_OPT_TYPE_DOUBLE:
      case AV_OPT_TYPE_FLOAT:
        return Option.setDouble(this.native, name, Number(value), searchFlags);

      case AV_OPT_TYPE_RATIONAL:
      case AV_OPT_TYPE_VIDEO_RATE:
        if (typeof value !== 'object' || !('num' in value) || !('den' in value)) {
          throw new TypeError(`Option '${name}': Expected Rational object with {num, den}, got ${JSON.stringify(value)}`);
        }
        if (value.den === 0) {
          throw new RangeError(`Option '${name}': Rational denominator cannot be zero`);
        }
        return Option.setRational(this.native, name, value as IRational, searchFlags);

      case AV_OPT_TYPE_PIXEL_FMT:
        const pixFmt = Number(value);
        if (!Number.isInteger(pixFmt)) {
          throw new TypeError(`Option '${name}': Expected integer pixel format value, got ${value}`);
        }
        return Option.setPixelFormat(this.native, name, pixFmt as AVPixelFormat, searchFlags);

      case AV_OPT_TYPE_SAMPLE_FMT:
        const sampleFmt = Number(value);
        if (!Number.isInteger(sampleFmt)) {
          throw new TypeError(`Option '${name}': Expected integer sample format value, got ${value}`);
        }
        return Option.setSampleFormat(this.native, name, sampleFmt as AVSampleFormat, searchFlags);

      case AV_OPT_TYPE_IMAGE_SIZE:
        // Expect value as {width, height}
        if (typeof value === 'object' && 'width' in value && 'height' in value) {
          const width = Number(value.width);
          const height = Number(value.height);
          if (!Number.isInteger(width) || width <= 0) {
            throw new RangeError(`Option '${name}': Width must be a positive integer, got ${value.width}`);
          }
          if (!Number.isInteger(height) || height <= 0) {
            throw new RangeError(`Option '${name}': Height must be a positive integer, got ${value.height}`);
          }
          return Option.setImageSize(this.native, name, width, height, searchFlags);
        }
        throw new TypeError(`Option '${name}': Expected object with {width, height}, got ${JSON.stringify(value)}`);

      case AV_OPT_TYPE_CHLAYOUT:
        return Option.setChannelLayout(this.native, name, Number(value), searchFlags);

      case AV_OPT_TYPE_BINARY:
        if (Buffer.isBuffer(value)) {
          return Option.setBin(this.native, name, value, searchFlags);
        }
        throw new Error('Invalid value for BINARY option: expected Buffer');

      case AV_OPT_TYPE_BINARY_INT_ARRAY:
        if (Array.isArray(value)) {
          // Convert array of integers to buffer
          const buffer = Buffer.allocUnsafe(value.length * 4);
          for (let i = 0; i < value.length; i++) {
            buffer.writeInt32LE(value[i], i * 4);
          }
          return Option.setBin(this.native, name, buffer, searchFlags);
        }
        throw new Error('Invalid value for BINARY_INT_ARRAY option: expected number[]');

      case AV_OPT_TYPE_DICT:
        if (value instanceof Dictionary) {
          return Option.setDict(this.native, name, value, searchFlags);
        }
        throw new Error('Invalid value for DICT option: expected Dictionary');

      default:
        // Fallback to string
        return Option.set(this.native, name, String(value), searchFlags);
    }
  }

  // String options
  getOption(name: string, type?: AVOptionTypeString, searchFlags?: AVOptionSearchFlags): string | null;
  getOption(name: string, type: AVOptionTypeColor, searchFlags?: AVOptionSearchFlags): string | null;

  // Integer options
  getOption(name: string, type: AVOptionTypeInt, searchFlags?: AVOptionSearchFlags): number | null;
  getOption(name: string, type: AVOptionTypeInt64, searchFlags?: AVOptionSearchFlags): bigint | null;
  getOption(name: string, type: AVOptionTypeUint, searchFlags?: AVOptionSearchFlags): number | null;
  getOption(name: string, type: AVOptionTypeUint64, searchFlags?: AVOptionSearchFlags): bigint | null;
  getOption(name: string, type: AVOptionTypeFlags, searchFlags?: AVOptionSearchFlags): number | null;
  getOption(name: string, type: AVOptionTypeBool, searchFlags?: AVOptionSearchFlags): boolean | null;
  getOption(name: string, type: AVOptionTypeDuration, searchFlags?: AVOptionSearchFlags): number | null;
  getOption(name: string, type: AVOptionTypeConst, searchFlags?: AVOptionSearchFlags): number | null;

  // Float options
  getOption(name: string, type: AVOptionTypeDouble, searchFlags?: AVOptionSearchFlags): number | null;
  getOption(name: string, type: AVOptionTypeFloat, searchFlags?: AVOptionSearchFlags): number | null;

  // Complex types
  getOption(name: string, type: AVOptionTypeRational, searchFlags?: AVOptionSearchFlags): IRational | null;
  getOption(name: string, type: AVOptionTypeVideoRate, searchFlags?: AVOptionSearchFlags): IRational | null;
  getOption(name: string, type: AVOptionTypePixelFmt, searchFlags?: AVOptionSearchFlags): AVPixelFormat | null;
  getOption(name: string, type: AVOptionTypeSampleFmt, searchFlags?: AVOptionSearchFlags): AVSampleFormat | null;
  getOption(name: string, type: AVOptionTypeImageSize, searchFlags?: AVOptionSearchFlags): { width: number; height: number } | null;
  getOption(name: string, type: AVOptionTypeChLayout, searchFlags?: AVOptionSearchFlags): ChannelLayout | null;
  getOption(name: string, type: AVOptionTypeDict, searchFlags?: AVOptionSearchFlags): Dictionary | null;
  getOption(name: string, type: AVOptionTypeBinary, searchFlags?: AVOptionSearchFlags): string | null;

  /**
   * Get an option value from this object.
   *
   * Uses the AVOption API to retrieve options.
   *
   * Direct mapping to av_opt_get* functions.
   *
   * @param name - Option name
   * @param type - Option type (defaults to AV_OPT_TYPE_STRING)
   * @param searchFlags - Search flags (default: AV_OPT_SEARCH_CHILDREN)
   * @returns Option value (type depends on type parameter), or null if not found
   *
   * @example
   * ```typescript
   * import { AV_OPT_TYPE_STRING, AV_OPT_TYPE_RATIONAL, AV_OPT_TYPE_PIXEL_FMT, AV_OPT_TYPE_INT64 } from 'node-av/constants';
   *
   * // String options (default)
   * const preset = obj.getOption('preset');
   * const codec = obj.getOption('codec', AV_OPT_TYPE_STRING);
   *
   * // Typed options
   * const framerate = obj.getOption('framerate', AV_OPT_TYPE_RATIONAL); // Returns {num, den}
   * const pixFmt = obj.getOption('pix_fmt', AV_OPT_TYPE_PIXEL_FMT); // Returns AVPixelFormat
   * const bitrate = obj.getOption('bitrate', AV_OPT_TYPE_INT64); // Returns bigint
   * ```
   */
  getOption(name: string, type: AVOptionType = AV_OPT_TYPE_STRING, searchFlags: AVOptionSearchFlags = AV_OPT_SEARCH_CHILDREN): any {
    // Use specific getter based on type
    switch (type) {
      case AV_OPT_TYPE_STRING:
      case AV_OPT_TYPE_COLOR:
        return Option.get(this.native, name, searchFlags);

      case AV_OPT_TYPE_INT:
      case AV_OPT_TYPE_UINT:
      case AV_OPT_TYPE_FLAGS:
      case AV_OPT_TYPE_DURATION:
      case AV_OPT_TYPE_CONST:
        return Option.getInt(this.native, name, searchFlags);

      case AV_OPT_TYPE_INT64:
      case AV_OPT_TYPE_UINT64:
        // For INT64/UINT64, we should return bigint for proper precision
        const int64Val = Option.getInt(this.native, name, searchFlags);
        return int64Val !== null ? BigInt(int64Val) : null;

      case AV_OPT_TYPE_BOOL:
        const val = Option.getInt(this.native, name, searchFlags);
        return val !== null ? Boolean(val) : null;

      case AV_OPT_TYPE_DOUBLE:
      case AV_OPT_TYPE_FLOAT:
        return Option.getDouble(this.native, name, searchFlags);

      case AV_OPT_TYPE_RATIONAL:
      case AV_OPT_TYPE_VIDEO_RATE:
        const rational = Option.getRational(this.native, name, searchFlags);
        return rational ? new Rational(rational.num, rational.den) : null;

      case AV_OPT_TYPE_PIXEL_FMT:
        return Option.getPixelFormat(this.native, name, searchFlags);

      case AV_OPT_TYPE_SAMPLE_FMT:
        return Option.getSampleFormat(this.native, name, searchFlags);

      case AV_OPT_TYPE_IMAGE_SIZE:
        return Option.getImageSize(this.native, name, searchFlags);

      case AV_OPT_TYPE_CHLAYOUT:
        return Option.getChannelLayout(this.native, name, searchFlags);

      case AV_OPT_TYPE_DICT:
        return Option.getDict(this.native, name, searchFlags);

      case AV_OPT_TYPE_BINARY:
        // Binary data can only be retrieved as string
        return Option.get(this.native, name, searchFlags);

      case AV_OPT_TYPE_BINARY_INT_ARRAY:
        // Getting binary int arrays is not supported (requires av_opt_get_bin())
        // These are typically write-only options like 'pix_fmts' in buffersink
        throw new Error('Getting BINARY_INT_ARRAY options is not supported. These are typically write-only options.');

      default:
        // Fallback to string
        return Option.get(this.native, name, searchFlags);
    }
  }

  /**
   * List all available options for this object.
   *
   * Uses the AVOption API to enumerate all options.
   * Useful for discovering available settings and their types.
   *
   * Direct mapping to av_opt_next() iteration.
   *
   * @returns Array of option information objects
   *
   * @example
   * ```typescript
   * const options = obj.listOptions();
   * for (const opt of options) {
   *   console.log(`${opt.name}: ${opt.help}`);
   *   console.log(`  Type: ${opt.type}, Default: ${opt.defaultValue}`);
   *   console.log(`  Range: ${opt.min} - ${opt.max}`);
   * }
   * ```
   *
   * @see {@link OptionInfo} For option metadata structure
   */
  listOptions(): OptionInfo[] {
    const options: OptionInfo[] = [];
    let opt: OptionInfo | null = null;
    while ((opt = Option.next(this.native, opt))) {
      options.push(opt);
    }
    return options;
  }
}
