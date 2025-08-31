/**
 * Option - FFmpeg AVOption System Bindings
 *
 * Provides low-level access to FFmpeg's AVOption API for getting and setting
 * options on various FFmpeg objects (CodecContext, FormatContext, FilterContext, etc).
 *
 * The AVOption API is FFmpeg's unified system for runtime configuration,
 * allowing type-safe access to object properties with validation.
 *
 * @module lib/option
 */

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
 * Low-level wrapper for a single AVOption.
 *
 * Provides metadata about an option including its name, type, range, and default value.
 * Options are not created directly but retrieved through Option.next() or Option.find().
 *
 * @example
 * ```typescript
 * const opt = Option.find(codecContext, 'bitrate');
 * if (opt) {
 *   console.log(`Option ${opt.name}: ${opt.help}`);
 *   console.log(`Type: ${opt.type}, Default: ${opt.defaultValue}`);
 * }
 * ```
 */
export class OptionInfo {
  private native: NativeOption;

  /** @internal */
  constructor(native: NativeOption) {
    this.native = native;
  }

  /**
   * Option name.
   *
   * The key used to get/set this option.
   */
  get name(): string | null {
    return this.native.name;
  }

  /**
   * Option help text.
   *
   * Human-readable description of the option.
   */
  get help(): string | null {
    return this.native.help;
  }

  /**
   * Option type.
   *
   * Determines the data type and valid range of values.
   */
  get type(): AVOptionType {
    return this.native.type;
  }

  /**
   * Default value.
   *
   * The value used if not explicitly set.
   * Type depends on the option type.
   */
  get defaultValue(): unknown {
    return this.native.defaultValue;
  }

  /**
   * Minimum value.
   *
   * For numeric types, the minimum allowed value.
   */
  get min(): number {
    return this.native.min;
  }

  /**
   * Maximum value.
   *
   * For numeric types, the maximum allowed value.
   */
  get max(): number {
    return this.native.max;
  }

  /**
   * Option flags.
   *
   * Bitfield of AV_OPT_FLAG_* values indicating option properties.
   */
  get flags(): AVOptionFlag {
    return this.native.flags;
  }

  /**
   * Option unit.
   *
   * For options that are part of a named group.
   */
  get unit(): string | null {
    return this.native.unit;
  }

  /**
   * Get the native FFmpeg AVOption pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native option object
   */
  getNative(): NativeOption {
    return this.native;
  }
}

/**
 * Low-level FFmpeg AVOption API.
 *
 * Provides static methods for accessing and modifying options on FFmpeg objects.
 * All methods work with native objects from the low-level API.
 *
 * Uses av_opt_* functions internally.
 *
 * @example
 * ```typescript
 * // Set codec bitrate
 * Option.setInt(codecContext, 'b', 2000000);
 *
 * // Get current bitrate
 * const bitrate = Option.getInt(codecContext, 'b');
 *
 * // Iterate through all options
 * let opt = null;
 * while ((opt = Option.next(codecContext, opt))) {
 *   console.log(`${opt.name}: ${opt.help}`);
 * }
 * ```
 */
export class Option {
  // Private constructor - static class only
  private constructor() {
    throw new Error('Option is a static class and cannot be instantiated');
  }

  // Static Methods - Iteration

  /**
   * Iterate through options of an object.
   *
   * Uses av_opt_next() internally.
   *
   * @param obj - Native object (CodecContext, FormatContext, FilterContext, etc.)
   * @param prev - Previous option for iteration, or null to start
   *
   * @returns Next option or null when done
   *
   * @example
   * ```typescript
   * let opt = null;
   * while ((opt = Option.next(codecContext, opt))) {
   *   console.log(`${opt.name}: ${opt.help}`);
   * }
   * ```
   */
  static next(obj: OptionCapableObject, prev: OptionInfo | null = null): OptionInfo | null {
    const result = bindings.Option.next(obj, prev?.getNative());
    return result ? new OptionInfo(result) : null;
  }

  /**
   * Find an option by name.
   *
   * Uses av_opt_find() internally.
   *
   * @param obj - Native object
   * @param name - Option name to find
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Found option or null
   *
   * @example
   * ```typescript
   * const opt = Option.find(codecContext, 'bitrate');
   * if (opt) {
   *   console.log(`Found option: ${opt.name}`);
   * }
   * ```
   */
  static find(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): OptionInfo | null {
    const result = bindings.Option.find(obj, name, searchFlags);
    return result ? new OptionInfo(result) : null;
  }

  /**
   * Find an option by name with target object information.
   *
   * Uses av_opt_find2() internally.
   *
   * @param obj - Native object
   * @param name - Option name to find
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Object with option and whether target differs, or null
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
   * Get option value as string.
   *
   * Uses av_opt_get() internally.
   * Converts any option type to its string representation.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Value string on success, null if option not found or on error
   */
  static get(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): string | null {
    return bindings.Option.get(obj, name, searchFlags);
  }

  /**
   * Get option value as integer.
   *
   * Uses av_opt_get_int() internally.
   * Option must be of integer type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Integer value on success, null if option not found or on error
   */
  static getInt(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number | null {
    return bindings.Option.getInt(obj, name, searchFlags);
  }

  /**
   * Get option value as double.
   *
   * Uses av_opt_get_double() internally.
   * Option must be of double/float type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Double value on success, null if option not found or on error
   */
  static getDouble(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number | null {
    return bindings.Option.getDouble(obj, name, searchFlags);
  }

  /**
   * Get option value as rational.
   *
   * Uses av_opt_get_q() internally.
   * Option must be of rational type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Rational object {num, den} on success, null if option not found or on error
   */
  static getRational(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): IRational | null {
    return bindings.Option.getRational(obj, name, searchFlags);
  }

  /**
   * Get option value as pixel format.
   *
   * Uses av_opt_get_pixel_fmt() internally.
   * Option must be of pixel format type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns AVPixelFormat enum value on success, null if option not found or on error
   */
  static getPixelFormat(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): AVPixelFormat | null {
    return bindings.Option.getPixelFormat(obj, name, searchFlags);
  }

  /**
   * Get option value as sample format.
   *
   * Uses av_opt_get_sample_fmt() internally.
   * Option must be of sample format type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns AVSampleFormat enum value on success, null if option not found or on error
   */
  static getSampleFormat(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): AVSampleFormat | null {
    return bindings.Option.getSampleFormat(obj, name, searchFlags);
  }

  /**
   * Get option value as image size.
   *
   * Uses av_opt_get_image_size() internally.
   * Option must be of image size type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Size object {width, height} on success, null if option not found or on error
   */
  static getImageSize(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): { width: number; height: number } | null {
    return bindings.Option.getImageSize(obj, name, searchFlags);
  }

  /**
   * Get option value as channel layout.
   *
   * Uses av_opt_get_chlayout() internally.
   * Option must be of channel layout type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns ChannelLayout object on success, null if option not found or on error
   */
  static getChannelLayout(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): ChannelLayout | null {
    return bindings.Option.getChannelLayout(obj, name, searchFlags);
  }

  /**
   * Get option value as dictionary.
   *
   * Uses av_opt_get_dict_val() internally.
   * Option must be of dictionary type.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns Dictionary object on success, null if option not found or on error
   */
  static getDict(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): Dictionary | null {
    const native = bindings.Option.getDict(obj, name, searchFlags);
    return native ? Dictionary.fromNative(native) : null;
  }

  /**
   * Set option value from string.
   *
   * Uses av_opt_set() internally.
   * Can be used for any option type - FFmpeg will parse the string.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - String value to set
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static set(obj: OptionCapableObject, name: string, value: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.set(obj, name, value, searchFlags);
  }

  /**
   * Set option value as integer.
   *
   * Uses av_opt_set_int() internally.
   * More efficient than set() for numeric options.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Number or BigInt value to set
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setInt(obj: OptionCapableObject, name: string, value: number | bigint, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setInt(obj, name, value, searchFlags);
  }

  /**
   * Set option value as double.
   *
   * Uses av_opt_set_double() internally.
   * More efficient than set() for floating point options.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Double value to set
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setDouble(obj: OptionCapableObject, name: string, value: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setDouble(obj, name, value, searchFlags);
  }

  /**
   * Set option value as rational.
   *
   * Uses av_opt_set_q() internally.
   * For framerates, aspect ratios, time bases, etc.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Rational object {num, den} to set
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setRational(obj: OptionCapableObject, name: string, value: IRational, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setRational(obj, name, value, searchFlags);
  }

  /**
   * Set option value as pixel format.
   *
   * Uses av_opt_set_pixel_fmt() internally.
   * More type-safe than using set() with string names.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - AVPixelFormat enum value
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setPixelFormat(obj: OptionCapableObject, name: string, value: AVPixelFormat, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setPixelFormat(obj, name, value, searchFlags);
  }

  /**
   * Set option value as sample format.
   *
   * Uses av_opt_set_sample_fmt() internally.
   * More type-safe than using set() with string names.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - AVSampleFormat enum value
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setSampleFormat(obj: OptionCapableObject, name: string, value: AVSampleFormat, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setSampleFormat(obj, name, value, searchFlags);
  }

  /**
   * Set option value as image size.
   *
   * Uses av_opt_set_image_size() internally.
   * Convenient for setting width and height together.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setImageSize(obj: OptionCapableObject, name: string, width: number, height: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setImageSize(obj, name, width, height, searchFlags);
  }

  /**
   * Set option value as channel layout.
   *
   * Uses av_opt_set_chlayout() internally.
   * For audio channel configuration.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Channel layout mask (e.g., AV_CH_LAYOUT_STEREO)
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setChannelLayout(obj: OptionCapableObject, name: string, value: number, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setChannelLayout(obj, name, value, searchFlags);
  }

  /**
   * Set option value as dictionary.
   *
   * Uses av_opt_set_dict_val() internally.
   * For options that accept key-value pairs.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Dictionary object
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setDict(obj: OptionCapableObject, name: string, value: Dictionary, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setDict(obj, name, value.getNative(), searchFlags);
  }

  /**
   * Set option value as binary data.
   *
   * Uses av_opt_set_bin() internally.
   * For options that accept raw binary data.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param value - Binary data as Buffer
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static setBin(obj: OptionCapableObject, name: string, value: Buffer, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): number {
    return bindings.Option.setBin(obj, name, value, searchFlags);
  }

  /**
   * Set all options to their default values.
   *
   * Uses av_opt_set_defaults() internally.
   *
   * @param obj - Native object
   */
  static setDefaults(obj: OptionCapableObject): void {
    bindings.Option.setDefaults(obj);
  }

  /**
   * Copy options from source to destination.
   *
   * Uses av_opt_copy() internally.
   * Copies all option values from one object to another.
   *
   * @param dest - Destination object
   * @param src - Source object
   *
   * @returns 0 on success, negative AVERROR code on failure
   */
  static copy(dest: OptionCapableObject, src: OptionCapableObject): number {
    return bindings.Option.copy(dest, src);
  }

  /**
   * Check if option is set to its default value.
   *
   * Uses av_opt_is_set_to_default_by_name() internally.
   *
   * @param obj - Native object
   * @param name - Option name
   * @param searchFlags - Search flags (default: 0)
   *
   * @returns true if set to default, false if not, null if option not found or on error
   */
  static isSetToDefault(obj: OptionCapableObject, name: string, searchFlags: AVOptionSearchFlags = AVFLAG_NONE): boolean | null {
    return bindings.Option.isSetToDefault(obj, name, searchFlags);
  }

  /**
   * Serialize options to string.
   *
   * Uses av_opt_serialize() internally.
   * Converts all non-default options to a string representation.
   *
   * @param obj - Native object
   * @param optFlags - Option flags to include (default: 0)
   * @param flags - Serialization flags (default: 0)
   * @param keyValSep - Key-value separator (default: '=')
   * @param pairsSep - Pairs separator (default: ',')
   *
   * @returns Serialized string on success, null on error or if no options to serialize
   */
  static serialize(obj: OptionCapableObject, optFlags = 0, flags = 0, keyValSep = '=', pairsSep = ','): string | null {
    return bindings.Option.serialize(obj, optFlags, flags, keyValSep, pairsSep);
  }

  /**
   * Free options of an object.
   *
   * Uses av_opt_free() internally.
   *
   * @param obj - Native object
   */
  static free(obj: OptionCapableObject): void {
    bindings.Option.free(obj);
  }

  /**
   * Show options to stderr for debugging.
   *
   * Uses av_opt_show2() internally.
   * Prints all available options to stderr.
   *
   * @param obj - Native object
   * @param reqFlags - Required flags (default: 0)
   * @param rejFlags - Rejected flags (default: 0)
   *
   * @returns 0 on success, negative AVERROR code on failure
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
 * class CodecContext extends OptionMember<NativeCodecContext> {
 *   // Inherits setOption, getOption, listOptions
 * }
 * ```
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
   * @param name - Option name
   * @param value - Option value
   * @param type - Option type (defaults to AV_OPT_TYPE_STRING)
   * @param searchFlags - Search flags (default: AV_OPT_SEARCH_CHILDREN)
   * @returns 0 on success, negative AVERROR code on failure
   *
   * @example
   * ```typescript
   * // String options (default)
   * ret = obj.setOption('preset', 'fast');
   * ret = obj.setOption('codec', 'h264', AV_OPT_TYPE_STRING);
   *
   * // Integer options
   * ret = obj.setOption('bitrate', 2000000, AV_OPT_TYPE_INT64);
   * ret = obj.setOption('threads', 4, AV_OPT_TYPE_INT);
   *
   * // Complex types with proper types
   * ret = obj.setOption('framerate', {num: 30, den: 1}, AV_OPT_TYPE_RATIONAL);
   * ret = obj.setOption('pix_fmt', AV_PIX_FMT_YUV420P, AV_OPT_TYPE_PIXEL_FMT);
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
   * @param name - Option name
   * @param type - Option type (defaults to AV_OPT_TYPE_STRING)
   * @param searchFlags - Search flags (default: AV_OPT_SEARCH_CHILDREN)
   * @returns Option value (type depends on type parameter)
   *
   * @example
   * ```typescript
   * // String options (default)
   * const preset = obj.getOption('preset');
   * const codec = obj.getOption('codec', AV_OPT_TYPE_STRING);
   *
   * // Typed options
   * const framerate = obj.getOption('framerate', AV_OPT_TYPE_RATIONAL); // Returns {num, den}
   * const pixFmt = obj.getOption('pix_fmt', AV_OPT_TYPE_PIXEL_FMT); // Returns AVPixelFormat
   * const bitrate = obj.getOption('bitrate', AV_OPT_TYPE_INT64); // Returns number
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
   * @returns Array of option information objects
   *
   * @example
   * ```typescript
   * const options = obj.listOptions();
   * for (const opt of options) {
   *   console.log(`${opt.name}: ${opt.help}`);
   *   console.log(`  Type: ${opt.type}, Default: ${opt.defaultValue}`);
   * }
   * ```
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
