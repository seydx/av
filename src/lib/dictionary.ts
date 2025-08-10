import { bindings } from './binding.js';
import { FFmpegError } from './error.js';

import type { AVDictionaryFlag } from './constants.js';
import type { NativeDictionary, NativeWrapper } from './native-types.js';

/**
 * AVDictionary wrapper - key-value store for FFmpeg options and metadata
 *
 * Dictionary is used throughout FFmpeg for:
 * - Codec options when opening codecs
 * - Format options when opening files
 * - Stream metadata (title, language, etc.)
 * - Filter options
 *
 * @example
 * ```typescript
 * // Create dictionary with options
 * const options = new Dictionary();
 * options.set('movflags', 'faststart');
 * options.set('preset', 'fast');
 *
 * // Use with format context
 * await formatContext.openInput('input.mp4', null, options);
 *
 * // Parse from string
 * const metadata = new Dictionary();
 * metadata.parseString('title=My Video artist=Me');
 * ```
 */
export class Dictionary implements Disposable, NativeWrapper<NativeDictionary> {
  private native: NativeDictionary; // Native dictionary binding

  /**
   * Create a new Dictionary
   * @param native Optional native dictionary object (for internal use)
   */
  constructor(native?: NativeDictionary) {
    this.native = native ?? new bindings.Dictionary();
  }

  /**
   * Create a Dictionary from an object
   * @param obj Plain object with key-value pairs
   * @returns New Dictionary instance
   * @example
   * ```typescript
   * const dict = Dictionary.fromObject({
   *   preset: 'fast',
   *   crf: '23'
   * });
   * ```
   */
  static fromObject(obj: Record<string, string>): Dictionary {
    const dict = new Dictionary();
    for (const [key, value] of Object.entries(obj)) {
      dict.set(key, value);
    }
    return dict;
  }

  /**
   * Create a Dictionary from a string
   * @param str String to parse
   * @param keyValSep Key-value separator (default '=')
   * @param pairsSep Pairs separator (default ' ')
   * @returns New Dictionary instance
   * @example
   * ```typescript
   * const dict = Dictionary.fromString('preset=fast crf=23');
   * ```
   */
  static fromString(str: string, keyValSep = '=', pairsSep = ' '): Dictionary {
    const dict = new Dictionary();
    dict.parseString(str, keyValSep, pairsSep);
    return dict;
  }

  /**
   * Create from native handle
   * @internal
   */
  static fromNative(native: NativeDictionary): Dictionary {
    return new Dictionary(native);
  }

  /**
   * Get the number of entries in the dictionary
   */
  get count(): number {
    return this.native.count;
  }

  /**
   * Get the number of entries (alias for count)
   */
  get size(): number {
    return this.count;
  }

  /**
   * Set a key-value pair
   * @param key The key
   * @param value The value
   * @param flags Optional flags for setting behavior
   * @throws FFmpegError if setting the entry fails
   */
  set(key: string, value: string, flags?: AVDictionaryFlag): void {
    try {
      this.native.set(key, value, flags);
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Get value for a key
   * @param key The key to look up
   * @param flags Optional flags for search behavior
   * @returns The value or null if not found
   */
  get(key: string, flags?: AVDictionaryFlag): string | null {
    return this.native.get(key, flags);
  }

  /**
   * Get all key-value pairs as an object
   * @returns Object with all key-value pairs
   */
  getAll(): Record<string, string> {
    return this.native.getAll();
  }

  /**
   * Check if a key exists
   * @param key The key to check
   * @returns true if the key exists
   */
  has(key: string): boolean {
    return this.native.has(key);
  }

  /**
   * Delete a key-value pair
   * @param key The key to delete
   * @throws FFmpegError if deletion fails
   */
  delete(key: string): void {
    try {
      this.native.delete(key);
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.native.clear();
  }

  /**
   * Create a copy of this dictionary
   * @param flags Optional flags for copy behavior
   * @returns A new Dictionary instance with copied values
   * @throws FFmpegError if copying fails
   */
  copy(flags?: AVDictionaryFlag): Dictionary {
    try {
      return new Dictionary(this.native.copy(flags));
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Parse a string into key-value pairs
   * @param str The string to parse
   * @param keyValSep Separator between key and value (default: '=')
   * @param pairsSep Separator between pairs (default: ' ')
   * @param flags Optional flags for parsing behavior
   * @throws FFmpegError if parsing fails
   * @example
   * ```typescript
   * dict.parseString('key1=value1 key2=value2');
   * dict.parseString('key1:value1,key2:value2', ':', ',');
   * ```
   */
  parseString(str: string, keyValSep = '=', pairsSep = ' ', flags?: AVDictionaryFlag): void {
    try {
      this.native.parseString(str, keyValSep, pairsSep, flags);
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Convert dictionary to string
   * @param keyValSep Separator between key and value (default: '=')
   * @param pairsSep Separator between pairs (default: ' ')
   * @returns String representation of the dictionary
   * @throws FFmpegError if conversion fails
   */
  toString(keyValSep = '=', pairsSep = ' '): string {
    try {
      return this.native.toString(keyValSep, pairsSep);
    } catch (error) {
      throw FFmpegError.fromNativeError(error);
    }
  }

  /**
   * Convert to plain JavaScript object
   * @returns Plain object with all key-value pairs
   */
  toObject(): Record<string, string> {
    return this.getAll();
  }

  /**
   * Iterate over entries
   * @yields Key-value pairs as tuples
   */
  *entries(): IterableIterator<[string, string]> {
    const all = this.getAll();
    for (const [key, value] of Object.entries(all)) {
      yield [key, value];
    }
  }

  /**
   * Iterate over keys
   * @yields Dictionary keys
   */
  *keys(): IterableIterator<string> {
    const all = this.getAll();
    for (const key of Object.keys(all)) {
      yield key;
    }
  }

  /**
   * Iterate over values
   * @yields Dictionary values
   */
  *values(): IterableIterator<string> {
    const all = this.getAll();
    for (const value of Object.values(all)) {
      yield value;
    }
  }

  /**
   * Free the dictionary and release resources
   */
  free(): void {
    this.native.free();
  }

  /**
   * Make Dictionary iterable
   * @yields Key-value pairs as tuples
   */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  /**
   * Dispose of the dictionary and free resources
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native dictionary for internal use
   * @internal
   */
  getNative(): NativeDictionary {
    return this.native;
  }
}
