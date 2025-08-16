import { bindings } from './binding.js';

import { AV_DICT_NONE, type AVDictFlag } from './constants.js';
import type { NativeDictionary, NativeWrapper } from './native-types.js';

/**
 * FFmpeg Dictionary for options and metadata - Low Level API
 *
 * Direct mapping to FFmpeg's AVDictionary.
 * Used throughout FFmpeg for codec options, format options, and metadata.
 * User has full control over allocation and lifecycle.
 *
 * @example
 * ```typescript
 * // Using Dictionary for codec options
 * const options = new Dictionary();
 * options.set('preset', 'fast', 0);
 * options.set('crf', '23', 0);
 *
 * const codecContext = new CodecContext();
 * codecContext.allocContext3(codec);
 * await codecContext.open2(codec, options);
 *
 * // Using Dictionary for format options
 * const formatOptions = new Dictionary();
 * formatOptions.set('movflags', 'faststart', 0);
 * await formatContext.writeHeader(formatOptions);
 *
 * // Reading metadata
 * const metadata = stream.metadata;
 * if (metadata) {
 *   const title = metadata.get('title', 0);
 *   const artist = metadata.get('artist', 0);
 *   console.log(`Title: ${title}, Artist: ${artist}`);
 * }
 *
 * // Cleanup
 * options.free();
 * formatOptions.free();
 * ```
 *
 * @example
 * ```typescript
 * // Parsing options from string
 * const dict = new Dictionary();
 * dict.parseString('bitrate=128k:preset=fast', '=', ':', 0);
 *
 * // Getting all options as object
 * const allOptions = dict.getAll();
 * console.log(allOptions); // { bitrate: '128k', preset: 'fast' }
 *
 * // Converting back to string
 * const str = dict.getString('=', ':');
 * console.log(str); // "bitrate=128k:preset=fast"
 *
 * dict.free();
 * ```
 */
export class Dictionary implements Disposable, NativeWrapper<NativeDictionary> {
  private native: NativeDictionary;

  // Constructor
  /**
   * Create a new dictionary.
   *
   * The dictionary is uninitialized and will be auto-allocated on first set() call.
   * Direct wrapper around AVDictionary.
   *
   * @example
   * ```typescript
   * const dict = new Dictionary();
   * dict.set('key', 'value', 0); // Auto-allocates on first use
   * ```
   */
  constructor() {
    this.native = new bindings.Dictionary();
  }

  /**
   * Create a Dictionary wrapper from an existing native dictionary.
   * Used internally when wrapping dictionaries from FFmpeg.
   * @internal
   */
  static fromNative(native: NativeDictionary): Dictionary {
    const dict = Object.create(Dictionary.prototype) as Dictionary;
    (dict as any).native = native;
    return dict;
  }

  // Public Methods - Lifecycle

  /**
   * Allocate a new dictionary.
   *
   * Usually not needed as set() will auto-allocate.
   * This is mainly for compatibility - FFmpeg doesn't have explicit av_dict_alloc.
   *
   * @example
   * ```typescript
   * const dict = new Dictionary();
   * dict.alloc(); // Explicit allocation (optional)
   * ```
   */
  alloc(): void {
    return this.native.alloc();
  }

  /**
   * Free all the memory allocated for an AVDictionary struct and all keys and values.
   *
   * Direct mapping to av_dict_free()
   * After calling this, the dictionary is empty and can be reused.
   *
   * @example
   * ```typescript
   * dict.free();
   * // Dictionary is now empty and can be reused
   * dict.set('new_key', 'new_value', 0);
   * ```
   */
  free(): void {
    return this.native.free();
  }

  /**
   * Copy entries from this dictionary to destination.
   *
   * Direct mapping to av_dict_copy()
   *
   * @param dst - Target dictionary to copy to
   * @param flags - AV_DICT_* flags for the copy operation
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * const src = new Dictionary();
   * src.set('key1', 'value1');
   * src.set('key2', 'value2');
   *
   * const dst = new Dictionary();
   * const ret = src.copy(dst);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * Common flags:
   * - AV_DICT_NONE: Default behavior
   * - AV_DICT_DONT_OVERWRITE: Don't overwrite existing entries
   * - AV_DICT_MULTIKEY: Allow multiple entries with same key
   */
  copy(dst: Dictionary, flags: AVDictFlag = AV_DICT_NONE): number {
    return this.native.copy(dst.getNative(), flags);
  }

  // Public Methods - Operations

  /**
   * Set the given entry in the dictionary.
   * If key or value are NULL/empty, the entry is deleted.
   *
   * Direct mapping to av_dict_set()
   * The dictionary will be auto-allocated on first call if needed.
   *
   * @param key - Entry key to add/modify
   * @param value - Entry value to add/modify
   * @param flags - AV_DICT_* flags
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * dict.set('bitrate', '128k');
   * dict.set('preset', 'fast', AV_DICT_DONT_OVERWRITE);
   *
   * // Delete an entry
   * dict.set('bitrate', '');
   * ```
   *
   * Common flags:
   * - AV_DICT_NONE: Default behavior (replace existing, copy strings)
   * - AV_DICT_DONT_OVERWRITE: Don't overwrite existing entries
   * - AV_DICT_APPEND: Append to existing value (with comma separator)
   * - AV_DICT_MULTIKEY: Allow multiple entries with same key
   * - AV_DICT_MATCH_CASE: Case sensitive key matching
   */
  set(key: string, value: string, flags: AVDictFlag = AV_DICT_NONE): number {
    return this.native.set(key, value, flags);
  }

  /**
   * Get a dictionary entry with matching key.
   *
   * Direct mapping to av_dict_get()
   *
   * @param key - Key to search for
   * @param flags - AV_DICT_* flags for matching
   *
   * @returns Entry value or null if not found
   *
   * @example
   * ```typescript
   * const value = dict.get('bitrate');
   * if (value) {
   *   console.log(`Bitrate: ${value}`);
   * }
   *
   * // Case sensitive search
   * const title = dict.get('Title', AV_DICT_MATCH_CASE);
   * ```
   *
   * Common flags:
   * - AV_DICT_NONE: Default (case insensitive)
   * - AV_DICT_MATCH_CASE: Case sensitive matching
   * - AV_DICT_IGNORE_SUFFIX: Match entries starting with key
   */
  get(key: string, flags: AVDictFlag = AV_DICT_NONE): string | null {
    return this.native.get(key, flags);
  }

  /**
   * Get number of entries in dictionary.
   *
   * Direct mapping to av_dict_count()
   *
   * @returns Number of entries
   *
   * @example
   * ```typescript
   * const count = dict.count();
   * console.log(`Dictionary has ${count} entries`);
   * ```
   */
  count(): number {
    return this.native.count();
  }

  /**
   * Get all entries as a JavaScript object.
   *
   * Helper method for easier access from JavaScript.
   * Internally iterates through all entries using av_dict_get().
   *
   * @returns Object with all key-value pairs
   *
   * @example
   * ```typescript
   * const allOptions = dict.getAll();
   * for (const [key, value] of Object.entries(allOptions)) {
   *   console.log(`${key}: ${value}`);
   * }
   *
   * // Check if dictionary is empty
   * if (Object.keys(dict.getAll()).length === 0) {
   *   console.log('Dictionary is empty');
   * }
   * ```
   */
  getAll(): Record<string, string> {
    return this.native.getAll();
  }

  /**
   * Parse the key/value pairs from a string.
   *
   * Direct mapping to av_dict_parse_string()
   * FFmpeg allows multi-character separators for parseString.
   *
   * @param str - String to parse (e.g., "key1=value1:key2=value2")
   * @param keyValSep - String separator between key and value (e.g., '=' or ':=')
   * @param pairsSep - String separator between pairs (e.g., ':' or ',' or ';')
   * @param flags - AV_DICT_* flags (default: AV_DICT_NONE)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR(ENOMEM): Memory allocation failure
   *
   * @example
   * ```typescript
   * // Parse codec options with single-char separators
   * const ret = dict.parseString('bitrate=128k:preset=fast', '=', ':');
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Parse with multi-char separators
   * dict.parseString('title:=My Video;;artist:=Me', ':=', ';;');
   * ```
   */
  parseString(str: string, keyValSep: string, pairsSep: string, flags: AVDictFlag = AV_DICT_NONE): number {
    return this.native.parseString(str, keyValSep, pairsSep, flags);
  }

  /**
   * Get dictionary as a string.
   *
   * Direct mapping to av_dict_get_string()
   *
   * @param keyValSep - Character to separate key from value
   * @param pairsSep - Character to separate pairs
   *
   * @returns String representation or null on error
   *
   * @example
   * ```typescript
   * const str = dict.getString('=', ':');
   * console.log(str); // "key1=value1:key2=value2"
   *
   * // Export as comma-separated
   * const csv = dict.getString('=', ',');
   * console.log(csv); // "key1=value1,key2=value2"
   * ```
   *
   * @see parseString() - To parse a string back to dictionary
   */
  getString(keyValSep: string, pairsSep: string): string | null {
    return this.native.getString(keyValSep, pairsSep);
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVDictionary pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native dictionary object
   */
  getNative(): NativeDictionary {
    return this.native;
  }

  /**
   * Dispose of the dictionary.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using dict = new Dictionary();
   *   dict.set('key', 'value', 0);
   *   // ... use dictionary
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
