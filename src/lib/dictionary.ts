import { bindings } from './binding.js';

import type { AVDictionaryFlag } from './constants.js';

// Native dictionary interface
interface NativeDictionary {
  set(key: string, value: string, flags?: AVDictionaryFlag): void;
  get(key: string, flags?: AVDictionaryFlag): string | null;
  getAll(): Record<string, string>;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  copy(flags?: AVDictionaryFlag): NativeDictionary;
  parseString(str: string, keyValSep?: string, pairsSep?: string, flags?: AVDictionaryFlag): void;
  toString(keyValSep?: string, pairsSep?: string): string;
  readonly count: number;
}

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
export class Dictionary implements Disposable {
  private native: NativeDictionary;

  constructor(native?: NativeDictionary) {
    this.native = native ?? new bindings.Dictionary();
  }

  /**
   * Create from native handle (internal use)
   */
  static fromNative(native: any): Dictionary {
    return new Dictionary(native);
  }

  /**
   * Set a key-value pair
   * @param key The key
   * @param value The value
   * @param flags Optional flags for setting behavior
   */
  set(key: string, value: string, flags?: AVDictionaryFlag): void {
    this.native.set(key, value, flags);
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
   */
  delete(key: string): void {
    this.native.delete(key);
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
   */
  copy(flags?: AVDictionaryFlag): Dictionary {
    return new Dictionary(this.native.copy(flags));
  }

  /**
   * Parse a string into key-value pairs
   * @param str The string to parse
   * @param keyValSep Separator between key and value (default: '=')
   * @param pairsSep Separator between pairs (default: ' ')
   * @param flags Optional flags for parsing behavior
   *
   * @example
   * ```typescript
   * dict.parseString('key1=value1 key2=value2');
   * dict.parseString('key1:value1,key2:value2', ':', ',');
   * ```
   */
  parseString(str: string, keyValSep = '=', pairsSep = ' ', flags?: AVDictionaryFlag): void {
    this.native.parseString(str, keyValSep, pairsSep, flags);
  }

  /**
   * Convert dictionary to string
   * @param keyValSep Separator between key and value (default: '=')
   * @param pairsSep Separator between pairs (default: ' ')
   * @returns String representation of the dictionary
   */
  toString(keyValSep = '=', pairsSep = ' '): string {
    return this.native.toString(keyValSep, pairsSep);
  }

  /**
   * Get the number of entries
   */
  get count(): number {
    return this.native.count;
  }

  /**
   * Get the number of entries (alias for count)
   */
  get size(): number {
    return this.native.count;
  }

  /**
   * Iterate over entries
   */
  *entries(): IterableIterator<[string, string]> {
    const all = this.getAll();
    for (const [key, value] of Object.entries(all)) {
      yield [key, value];
    }
  }

  /**
   * Iterate over keys
   */
  *keys(): IterableIterator<string> {
    const all = this.getAll();
    for (const key of Object.keys(all)) {
      yield key;
    }
  }

  /**
   * Iterate over values
   */
  *values(): IterableIterator<string> {
    const all = this.getAll();
    for (const value of Object.values(all)) {
      yield value;
    }
  }

  /**
   * Make Dictionary iterable
   */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  /**
   * Dispose of the dictionary and free resources
   */
  [Symbol.dispose](): void {
    this.clear();
  }

  /**
   * Create Dictionary from object
   * @param obj Object with key-value pairs
   * @returns New Dictionary instance
   */
  static fromObject(obj: Record<string, string>): Dictionary {
    const dict = new Dictionary();
    for (const [key, value] of Object.entries(obj)) {
      dict.set(key, value);
    }
    return dict;
  }

  /**
   * Create Dictionary from string
   * @param str String to parse
   * @param keyValSep Separator between key and value
   * @param pairsSep Separator between pairs
   * @returns New Dictionary instance
   */
  static fromString(str: string, keyValSep = '=', pairsSep = ' '): Dictionary {
    const dict = new Dictionary();
    dict.parseString(str, keyValSep, pairsSep);
    return dict;
  }

  /**
   * Get native handle (internal use)
   */
  getNative(): any {
    return this.native;
  }

  /**
   * Convert to plain JavaScript object
   */
  toObject(): Record<string, string> {
    return this.getAll();
  }
}
