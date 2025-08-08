import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_DICT_DONT_OVERWRITE, Dictionary } from '../src/lib/index.js';

describe('Dictionary', () => {
  it('should create a new dictionary', () => {
    const dict = new Dictionary();
    assert(dict);
    assert.strictEqual(dict.count, 0);
  });

  it('should set and get values', () => {
    const dict = new Dictionary();

    dict.set('key1', 'value1');
    assert.strictEqual(dict.get('key1'), 'value1');
    assert.strictEqual(dict.count, 1);

    dict.set('key2', 'value2');
    assert.strictEqual(dict.get('key2'), 'value2');
    assert.strictEqual(dict.count, 2);

    // Non-existent key
    assert.strictEqual(dict.get('nonexistent'), null);
  });

  it('should check if key exists', () => {
    const dict = new Dictionary();

    dict.set('exists', 'yes');
    assert(dict.has('exists'));
    assert(!dict.has('nonexistent'));
  });

  it('should delete entries', () => {
    const dict = new Dictionary();

    dict.set('key1', 'value1');
    dict.set('key2', 'value2');
    assert.strictEqual(dict.count, 2);

    dict.delete('key1');
    assert.strictEqual(dict.count, 1);
    assert(!dict.has('key1'));
    assert(dict.has('key2'));
  });

  it('should clear all entries', () => {
    const dict = new Dictionary();

    dict.set('key1', 'value1');
    dict.set('key2', 'value2');
    dict.set('key3', 'value3');
    assert.strictEqual(dict.count, 3);

    dict.clear();
    assert.strictEqual(dict.count, 0);
    assert(!dict.has('key1'));
  });

  it('should get all entries', () => {
    const dict = new Dictionary();

    dict.set('key1', 'value1');
    dict.set('key2', 'value2');
    dict.set('key3', 'value3');

    const all = dict.getAll();
    assert.deepStrictEqual(all, {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });
  });

  it('should parse string', () => {
    const dict = new Dictionary();

    dict.parseString('key1=value1 key2=value2 key3=value3');
    assert.strictEqual(dict.count, 3);
    assert.strictEqual(dict.get('key1'), 'value1');
    assert.strictEqual(dict.get('key2'), 'value2');
    assert.strictEqual(dict.get('key3'), 'value3');

    // Custom separators
    const dict2 = new Dictionary();
    dict2.parseString('a:1,b:2,c:3', ':', ',');
    assert.strictEqual(dict2.get('a'), '1');
    assert.strictEqual(dict2.get('b'), '2');
    assert.strictEqual(dict2.get('c'), '3');
  });

  it('should convert to string', () => {
    const dict = new Dictionary();

    dict.set('key1', 'value1');
    dict.set('key2', 'value2');

    const str = dict.toString();
    assert(str.includes('key1=value1'));
    assert(str.includes('key2=value2'));

    // Custom separators
    const str2 = dict.toString(':', ',');
    assert(str2.includes('key1:value1'));
    assert(str2.includes('key2:value2'));
  });

  it('should copy dictionary', () => {
    const dict1 = new Dictionary();
    dict1.set('key1', 'value1');
    dict1.set('key2', 'value2');

    const dict2 = dict1.copy();
    assert.strictEqual(dict2.count, 2);
    assert.strictEqual(dict2.get('key1'), 'value1');
    assert.strictEqual(dict2.get('key2'), 'value2');

    // Modifying copy shouldn't affect original
    dict2.set('key3', 'value3');
    assert.strictEqual(dict2.count, 3);
    assert.strictEqual(dict1.count, 2);
  });

  it('should respect DONT_OVERWRITE flag', () => {
    const dict = new Dictionary();

    dict.set('key', 'original');
    dict.set('key', 'new', AV_DICT_DONT_OVERWRITE);

    // Should still have original value
    assert.strictEqual(dict.get('key'), 'original');
  });

  it('should support iteration', () => {
    const dict = new Dictionary();
    dict.set('a', '1');
    dict.set('b', '2');
    dict.set('c', '3');

    // Test entries iteration
    const entries = Array.from(dict.entries());
    assert.strictEqual(entries.length, 3);
    assert.deepStrictEqual(entries.sort(), [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ]);

    // Test keys iteration
    const keys = Array.from(dict.keys());
    assert.deepStrictEqual(keys.sort(), ['a', 'b', 'c']);

    // Test values iteration
    const values = Array.from(dict.values());
    assert.deepStrictEqual(values.sort(), ['1', '2', '3']);

    // Test for...of
    const pairs: Array<[string, string]> = [];
    for (const entry of dict) {
      pairs.push(entry);
    }
    assert.strictEqual(pairs.length, 3);
  });

  it('should create from object', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };

    const dict = Dictionary.fromObject(obj);
    assert.strictEqual(dict.count, 3);
    assert.strictEqual(dict.get('key1'), 'value1');
    assert.strictEqual(dict.get('key2'), 'value2');
    assert.strictEqual(dict.get('key3'), 'value3');
  });

  it('should create from string', () => {
    const dict = Dictionary.fromString('a=1 b=2 c=3');
    assert.strictEqual(dict.count, 3);
    assert.strictEqual(dict.get('a'), '1');
    assert.strictEqual(dict.get('b'), '2');
    assert.strictEqual(dict.get('c'), '3');
  });

  it('should support using statement', () => {
    {
      using dict = new Dictionary();
      dict.set('key', 'value');
      assert.strictEqual(dict.get('key'), 'value');
    }
    // Dictionary is automatically disposed here
  });
});
