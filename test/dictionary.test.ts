import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { AV_DICT_IGNORE_SUFFIX, AV_DICT_MATCH_CASE, AVFLAG_NONE, Dictionary } from '../src/index.js';

describe('Dictionary', () => {
  let dict: Dictionary;

  beforeEach(() => {
    dict = new Dictionary();
  });

  afterEach(() => {
    try {
      dict.free();
    } catch {
      // Dictionary might already be freed
    }
  });

  describe('Lifecycle', () => {
    it('should create an empty dictionary', () => {
      assert.ok(dict);
      assert.equal(dict.count(), 0);
    });

    it('should allocate and free a dictionary', () => {
      dict.alloc();
      assert.equal(dict.count(), 0);

      dict.free();
      // After free, we can't test properties as dictionary is freed
    });

    it('should support using statement for automatic disposal', () => {
      using testDict = new Dictionary();
      testDict.set('key', 'value', AVFLAG_NONE);
      assert.ok(testDict);
      // testDict will be automatically disposed when leaving scope
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      const ret = dict.set('key1', 'value1', AVFLAG_NONE);
      assert.equal(ret, 0);

      const value = dict.get('key1', AVFLAG_NONE);
      assert.equal(value, 'value1');

      assert.equal(dict.count(), 1);
    });

    it('should handle multiple key-value pairs', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);
      dict.set('key2', 'value2', AVFLAG_NONE);
      dict.set('key3', 'value3', AVFLAG_NONE);

      assert.equal(dict.count(), 3);
      assert.equal(dict.get('key1', AVFLAG_NONE), 'value1');
      assert.equal(dict.get('key2', AVFLAG_NONE), 'value2');
      assert.equal(dict.get('key3', AVFLAG_NONE), 'value3');
    });

    it('should overwrite existing values', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);
      assert.equal(dict.get('key1', AVFLAG_NONE), 'value1');

      dict.set('key1', 'newvalue', AVFLAG_NONE);
      assert.equal(dict.get('key1', AVFLAG_NONE), 'newvalue');
      assert.equal(dict.count(), 1); // Should still be 1 entry
    });

    it('should return null for non-existent keys', () => {
      const value = dict.get('nonexistent', AVFLAG_NONE);
      assert.equal(value, null);
    });

    it('should handle empty string values', () => {
      dict.set('empty', '', AVFLAG_NONE);
      assert.equal(dict.get('empty', AVFLAG_NONE), '');
      assert.equal(dict.count(), 1);
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case-insensitive by default', () => {
      dict.set('Key1', 'value1', AVFLAG_NONE);

      // Should find with different case
      const value = dict.get('key1', AVFLAG_NONE);
      assert.equal(value, 'value1');
    });

    it('should be case-sensitive with AV_DICT_MATCH_CASE flag', () => {
      dict.set('Key1', 'value1', AV_DICT_MATCH_CASE);

      // Should not find with different case
      const value1 = dict.get('key1', AV_DICT_MATCH_CASE);
      assert.equal(value1, null);

      // Should find with exact case
      const value2 = dict.get('Key1', AV_DICT_MATCH_CASE);
      assert.equal(value2, 'value1');
    });
  });

  describe('Prefix Matching', () => {
    it('should support prefix matching with AV_DICT_IGNORE_SUFFIX', () => {
      dict.set('prefix:key1', 'value1', AVFLAG_NONE);
      dict.set('prefix:key2', 'value2', AVFLAG_NONE);
      dict.set('other:key3', 'value3', AVFLAG_NONE);

      // Should find with prefix
      const value = dict.get('prefix', AV_DICT_IGNORE_SUFFIX);
      assert.ok(value === 'value1' || value === 'value2'); // Could match either
    });
  });

  describe('Get All Entries', () => {
    it('should get all entries as object', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);
      dict.set('key2', 'value2', AVFLAG_NONE);
      dict.set('key3', 'value3', AVFLAG_NONE);

      const all = dict.getAll();
      assert.equal(Object.keys(all).length, 3);
      assert.equal(all.key1, 'value1');
      assert.equal(all.key2, 'value2');
      assert.equal(all.key3, 'value3');
    });

    it('should return empty object for empty dictionary', () => {
      const all = dict.getAll();
      assert.deepEqual(all, {});
      assert.equal(Object.keys(all).length, 0);
    });
  });

  describe('String Parsing and Serialization', () => {
    it('should parse options from string', () => {
      const ret = dict.parseString('key1=value1:key2=value2', '=', ':', AVFLAG_NONE);
      assert.ok(ret >= 0);

      assert.equal(dict.count(), 2);
      assert.equal(dict.get('key1', AVFLAG_NONE), 'value1');
      assert.equal(dict.get('key2', AVFLAG_NONE), 'value2');
    });

    it('should serialize to string', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);
      dict.set('key2', 'value2', AVFLAG_NONE);

      const str = dict.getString('=', ':');
      assert.ok(str);
      // Order might vary, so check both possibilities
      assert.ok(str === 'key1=value1:key2=value2' || str === 'key2=value2:key1=value1');
    });

    it('should handle different separators', () => {
      const ret = dict.parseString('key1|value1,key2|value2', '|', ',', AVFLAG_NONE);
      assert.ok(ret >= 0);

      assert.equal(dict.count(), 2);
      assert.equal(dict.get('key1', AVFLAG_NONE), 'value1');
      assert.equal(dict.get('key2', AVFLAG_NONE), 'value2');

      const str = dict.getString('|', ',');
      assert.ok(str);
      assert.ok(str === 'key1|value1,key2|value2' || str === 'key2|value2,key1|value1');
    });

    it('should return null for empty dictionary getString', () => {
      const str = dict.getString('=', ':');
      // Empty dictionary might return null or empty string
      assert.ok(str === null || str === '');
    });
  });

  describe('Copy Operations', () => {
    it('should copy dictionary to another', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);
      dict.set('key2', 'value2', AVFLAG_NONE);

      const dst = new Dictionary();
      const ret = dict.copy(dst, AVFLAG_NONE);
      assert.equal(ret, 0);

      assert.equal(dst.count(), 2);
      assert.equal(dst.get('key1', AVFLAG_NONE), 'value1');
      assert.equal(dst.get('key2', AVFLAG_NONE), 'value2');

      // Clean up
      dst.free();
    });

    it('should overwrite existing entries in destination', () => {
      dict.set('key1', 'value1', AVFLAG_NONE);

      const dst = new Dictionary();
      dst.set('key1', 'oldvalue', AVFLAG_NONE);
      dst.set('key2', 'keep', AVFLAG_NONE);

      const ret = dict.copy(dst, AVFLAG_NONE);
      assert.equal(ret, 0);

      // key1 should be overwritten, key2 should remain
      assert.equal(dst.get('key1', AVFLAG_NONE), 'value1');
      assert.equal(dst.get('key2', AVFLAG_NONE), 'keep');

      // Clean up
      dst.free();
    });
  });

  describe('Special Characters', () => {
    it('should handle keys with spaces', () => {
      dict.set('key with spaces', 'value with spaces', AVFLAG_NONE);
      assert.equal(dict.get('key with spaces', AVFLAG_NONE), 'value with spaces');
    });

    it('should handle special characters in values', () => {
      dict.set('special', '!@#$%^&*()', AVFLAG_NONE);
      assert.equal(dict.get('special', AVFLAG_NONE), '!@#$%^&*()');
    });

    it('should handle unicode characters', () => {
      dict.set('unicode', '你好世界 🌍', AVFLAG_NONE);
      assert.equal(dict.get('unicode', AVFLAG_NONE), '你好世界 🌍');
    });
  });

  describe('Common FFmpeg Options', () => {
    it('should handle codec options', () => {
      // Common codec options
      dict.set('preset', 'fast', AVFLAG_NONE);
      dict.set('crf', '23', AVFLAG_NONE);
      dict.set('profile', 'high', AVFLAG_NONE);
      dict.set('level', '4.1', AVFLAG_NONE);

      assert.equal(dict.get('preset', AVFLAG_NONE), 'fast');
      assert.equal(dict.get('crf', AVFLAG_NONE), '23');
      assert.equal(dict.get('profile', AVFLAG_NONE), 'high');
      assert.equal(dict.get('level', AVFLAG_NONE), '4.1');
    });

    it('should handle format options', () => {
      // Common format options
      dict.set('movflags', 'faststart', AVFLAG_NONE);
      dict.set('fflags', '+genpts', AVFLAG_NONE);
      dict.set('avoid_negative_ts', 'make_zero', AVFLAG_NONE);

      assert.equal(dict.get('movflags', AVFLAG_NONE), 'faststart');
      assert.equal(dict.get('fflags', AVFLAG_NONE), '+genpts');
      assert.equal(dict.get('avoid_negative_ts', AVFLAG_NONE), 'make_zero');
    });

    it('should handle metadata', () => {
      // Common metadata
      dict.set('title', 'My Video', AVFLAG_NONE);
      dict.set('artist', 'John Doe', AVFLAG_NONE);
      dict.set('album', 'Best Album', AVFLAG_NONE);
      dict.set('date', '2024', AVFLAG_NONE);
      dict.set('comment', 'This is a comment', AVFLAG_NONE);

      assert.equal(dict.get('title', AVFLAG_NONE), 'My Video');
      assert.equal(dict.get('artist', AVFLAG_NONE), 'John Doe');
      assert.equal(dict.get('album', AVFLAG_NONE), 'Best Album');
      assert.equal(dict.get('date', AVFLAG_NONE), '2024');
      assert.equal(dict.get('comment', AVFLAG_NONE), 'This is a comment');
    });
  });

  describe('Error Handling', () => {
    it('should handle null or undefined keys gracefully', () => {
      // These operations should not crash
      const value = dict.get('', AVFLAG_NONE);
      assert.equal(value, null);

      // Empty key might be allowed
      const ret = dict.set('', 'value', AVFLAG_NONE);
      // Might succeed or fail depending on FFmpeg version
      assert.ok(typeof ret === 'number');
    });

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(10000);
      const ret = dict.set('longkey', longValue, AVFLAG_NONE);
      assert.equal(ret, 0);

      const retrieved = dict.get('longkey', AVFLAG_NONE);
      assert.equal(retrieved, longValue);
    });
  });
});
