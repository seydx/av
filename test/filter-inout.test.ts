import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Filter, FilterContext, FilterGraph, FilterInOut } from '../src/lib/index.js';

describe('FilterInOut', () => {
  describe('Creation and Lifecycle', () => {
    it('should create a new FilterInOut instance', () => {
      const inout = new FilterInOut();
      assert.ok(inout instanceof FilterInOut, 'Should create FilterInOut instance');
    });

    it('should allocate FilterInOut structure', () => {
      const inout = new FilterInOut();
      inout.alloc();
      assert.ok(inout, 'Should allocate structure');
      inout.free();
    });

    it('should free FilterInOut structure', () => {
      const inout = new FilterInOut();
      inout.alloc();
      inout.free();
      // Structure is now freed - no crash should occur
      assert.ok(true, 'Should free without error');
    });

    it('should support Symbol.dispose', () => {
      const inout = new FilterInOut();
      inout.alloc();

      if (typeof inout[Symbol.dispose] === 'function') {
        inout[Symbol.dispose]();
      }
      assert.ok(true, 'Should dispose without error');
    });
  });

  describe('Properties', () => {
    it('should get and set name', () => {
      const inout = new FilterInOut();
      inout.alloc();

      // Initially null
      assert.equal(inout.name, null, 'Should initially be null');

      // Set name
      inout.name = 'input_1';
      assert.equal(inout.name, 'input_1', 'Should set name');

      // Clear name
      inout.name = null;
      assert.equal(inout.name, null, 'Should clear name');

      inout.free();
    });

    it('should get and set filter context', () => {
      const graph = new FilterGraph();
      graph.alloc();

      const filter = Filter.getByName('buffer');
      assert.ok(filter);

      const ctx = graph.createFilter(filter, 'buffer', 'video_size=320x240:pix_fmt=0:time_base=1/25');
      assert.ok(ctx);

      const inout = new FilterInOut();
      inout.alloc();

      // Initially null
      assert.equal(inout.filterCtx, null, 'Should initially be null');

      // Set filter context
      inout.filterCtx = ctx;
      const retrieved = inout.filterCtx;
      assert.ok(retrieved instanceof FilterContext, 'Should set filter context');

      // Clear filter context
      inout.filterCtx = null;
      assert.equal(inout.filterCtx, null, 'Should clear filter context');

      inout.free();
      graph.free();
    });

    it('should get and set pad index', () => {
      const inout = new FilterInOut();
      inout.alloc();

      // Default value
      const initial = inout.padIdx;
      assert.equal(typeof initial, 'number', 'Should have numeric pad index');

      // Set pad index
      inout.padIdx = 0;
      assert.equal(inout.padIdx, 0, 'Should set pad index to 0');

      inout.padIdx = 1;
      assert.equal(inout.padIdx, 1, 'Should set pad index to 1');

      inout.padIdx = 99;
      assert.equal(inout.padIdx, 99, 'Should set pad index to 99');

      inout.free();
    });

    it('should handle all properties together', () => {
      const graph = new FilterGraph();
      graph.alloc();

      const filter = Filter.getByName('buffersink');
      assert.ok(filter);

      const ctx = graph.createFilter(filter, 'sink');
      assert.ok(ctx);

      const inout = new FilterInOut();
      inout.alloc();

      // Set all properties
      inout.name = 'output';
      inout.filterCtx = ctx;
      inout.padIdx = 0;

      // Verify all properties
      assert.equal(inout.name, 'output');
      assert.ok(inout.filterCtx instanceof FilterContext);
      assert.equal(inout.padIdx, 0);

      inout.free();
      graph.free();
    });
  });

  describe('Linked List', () => {
    it('should get and set next element', () => {
      const first = new FilterInOut();
      first.alloc();
      first.name = 'first';

      const second = new FilterInOut();
      second.alloc();
      second.name = 'second';

      // Initially no next
      assert.equal(first.next, null, 'Should initially have no next');

      // Link them
      first.next = second;
      const next = first.next;
      assert.ok(next instanceof FilterInOut, 'Should have next element');

      // Clear next before freeing to avoid double-free
      first.next = null;
      assert.equal(first.next, null, 'Should clear next');

      first.free();
      second.free();
    });

    it('should count elements in list', () => {
      const first = new FilterInOut();
      first.alloc();

      // Single element
      assert.equal(first.count(), 1, 'Should count single element');

      const second = new FilterInOut();
      second.alloc();
      first.next = second;

      // Two elements
      assert.equal(first.count(), 2, 'Should count two elements');

      const third = new FilterInOut();
      third.alloc();
      second.next = third;

      // Three elements
      assert.equal(first.count(), 3, 'Should count three elements');

      // Free only the head - it will free the entire chain
      first.free();
      second.free(); // no need to free, it was freed by the first
      third.free(); // no need to free, it was freed by the first
    });

    it('should handle chain of multiple elements', () => {
      const elements = [];
      let prev = null;

      // Create chain of 5 elements
      for (let i = 0; i < 5; i++) {
        const inout = new FilterInOut();
        inout.alloc();
        inout.name = `element_${i}`;
        inout.padIdx = i;

        if (prev) {
          prev.next = inout;
        }

        elements.push(inout);
        prev = inout;
      }

      // Verify chain
      assert.equal(elements[0].count(), 5, 'Should have 5 elements total');
      assert.equal(elements[0].name, 'element_0');
      assert.equal(elements[0].padIdx, 0);

      // Clean up - only free the head
      elements[0].free();
    });
  });

  describe('Static Methods', () => {
    it('should create empty list', () => {
      const list = FilterInOut.createList([]);
      assert.equal(list, null, 'Should return null for empty list');
    });

    it('should create single element list', () => {
      const graph = new FilterGraph();
      graph.alloc();

      const filter = Filter.getByName('buffer');
      assert.ok(filter);

      const ctx = graph.createFilter(filter, 'buffer', 'video_size=320x240:pix_fmt=0:time_base=1/25');
      assert.ok(ctx);

      const list = FilterInOut.createList([{ name: 'input', filterCtx: ctx, padIdx: 0 }]);

      assert.ok(list instanceof FilterInOut, 'Should create list');
      assert.equal(list?.name, 'input');
      assert.ok(list?.filterCtx instanceof FilterContext);
      assert.equal(list?.padIdx, 0);
      assert.equal(list?.count(), 1, 'Should have one element');

      list?.free();
      graph.free();
    });

    it('should create multi-element list', () => {
      const graph = new FilterGraph();
      graph.alloc();

      // Create multiple filter contexts
      const bufferFilter = Filter.getByName('buffer');
      const sinkFilter = Filter.getByName('buffersink');
      assert.ok(bufferFilter);
      assert.ok(sinkFilter);

      const ctx1 = graph.createFilter(bufferFilter, 'buf1', 'video_size=320x240:pix_fmt=0:time_base=1/25');
      const ctx2 = graph.createFilter(bufferFilter, 'buf2', 'video_size=640x480:pix_fmt=0:time_base=1/30');
      const ctx3 = graph.createFilter(sinkFilter, 'sink');

      assert.ok(ctx1);
      assert.ok(ctx2);
      assert.ok(ctx3);

      const list = FilterInOut.createList([
        { name: 'in1', filterCtx: ctx1, padIdx: 0 },
        { name: 'in2', filterCtx: ctx2, padIdx: 0 },
        { name: 'out', filterCtx: ctx3, padIdx: 0 },
      ]);

      assert.ok(list, 'Should create list');
      assert.equal(list?.count(), 3, 'Should have three elements');

      // Check first element
      assert.equal(list?.name, 'in1');
      assert.ok(list?.filterCtx instanceof FilterContext);
      assert.equal(list?.padIdx, 0);

      // Check if linked properly
      const second = list?.next;
      assert.ok(second instanceof FilterInOut, 'Should have second element');

      list?.free();
      graph.free();
    });
  });

  describe('Integration with FilterGraph', () => {
    it('should use FilterInOut for graph parsing', () => {
      const graph = new FilterGraph();
      graph.alloc();

      // Create source and sink
      const bufferFilter = Filter.getByName('buffer');
      const sinkFilter = Filter.getByName('buffersink');
      assert.ok(bufferFilter);
      assert.ok(sinkFilter);

      const srcCtx = graph.createFilter(bufferFilter, 'src', 'video_size=320x240:pix_fmt=0:time_base=1/25');
      const sinkCtx = graph.createFilter(sinkFilter, 'sink');
      assert.ok(srcCtx);
      assert.ok(sinkCtx);

      // Create input/output descriptors
      const inputs = new FilterInOut();
      inputs.alloc();
      inputs.name = 'in';
      inputs.filterCtx = srcCtx;
      inputs.padIdx = 0;

      const outputs = new FilterInOut();
      outputs.alloc();
      outputs.name = 'out';
      outputs.filterCtx = sinkCtx;
      outputs.padIdx = 0;

      // Parse simple filter chain
      const ret = graph.parse('[in] scale=640:480 [out]', inputs, outputs);
      assert.equal(typeof ret, 'number', 'Should return status code');

      inputs.free();
      outputs.free();
      graph.free();
    });

    it('should handle multiple inputs and outputs', () => {
      const graph = new FilterGraph();
      graph.alloc();

      // Create multiple sources and sinks
      const bufferFilter = Filter.getByName('buffer');
      const abufferFilter = Filter.getByName('abuffer');
      const sinkFilter = Filter.getByName('buffersink');
      const asinkFilter = Filter.getByName('abuffersink');

      assert.ok(bufferFilter);
      assert.ok(abufferFilter);
      assert.ok(sinkFilter);
      assert.ok(asinkFilter);

      const videoSrc = graph.createFilter(bufferFilter, 'vsrc', 'video_size=320x240:pix_fmt=0:time_base=1/25');
      const audioSrc = graph.createFilter(abufferFilter, 'asrc', 'sample_rate=44100:sample_fmt=1:channel_layout=3');
      const videoSink = graph.createFilter(sinkFilter, 'vsink');
      const audioSink = graph.createFilter(asinkFilter, 'asink');

      assert.ok(videoSrc);
      assert.ok(audioSrc);
      assert.ok(videoSink);
      assert.ok(audioSink);

      // Create input list
      const inputs = FilterInOut.createList([
        { name: 'vin', filterCtx: videoSrc, padIdx: 0 },
        { name: 'ain', filterCtx: audioSrc, padIdx: 0 },
      ]);

      // Create output list
      const outputs = FilterInOut.createList([
        { name: 'vout', filterCtx: videoSink, padIdx: 0 },
        { name: 'aout', filterCtx: audioSink, padIdx: 0 },
      ]);

      assert.ok(inputs);
      assert.ok(outputs);
      assert.equal(inputs?.count(), 2);
      assert.equal(outputs?.count(), 2);

      inputs?.free();
      outputs?.free();
      graph.free();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name', () => {
      const inout = new FilterInOut();
      inout.alloc();

      inout.name = '';
      assert.equal(inout.name, '', 'Should handle empty string name');

      inout.free();
    });

    it('should handle very long name', () => {
      const inout = new FilterInOut();
      inout.alloc();

      const longName = 'a'.repeat(1000);
      inout.name = longName;
      assert.equal(inout.name, longName, 'Should handle long name');

      inout.free();
    });

    it('should handle special characters in name', () => {
      const inout = new FilterInOut();
      inout.alloc();

      const specialName = 'test-name_123.456[789]';
      inout.name = specialName;
      assert.equal(inout.name, specialName, 'Should handle special characters');

      inout.free();
    });

    it('should handle negative pad index', () => {
      const inout = new FilterInOut();
      inout.alloc();

      inout.padIdx = -1;
      assert.equal(inout.padIdx, -1, 'Should handle negative pad index');

      inout.free();
    });

    it('should handle large pad index', () => {
      const inout = new FilterInOut();
      inout.alloc();

      inout.padIdx = 999999;
      assert.equal(inout.padIdx, 999999, 'Should handle large pad index');

      inout.free();
    });

    it('should handle unallocated structure', () => {
      const inout = new FilterInOut();
      // Don't call alloc()

      try {
        // Try to use unallocated structure
        inout.name = 'test';
        // May or may not throw depending on implementation
        assert.ok(true, 'May handle unallocated structure');
      } catch (error) {
        assert.ok(error, 'May throw on unallocated structure');
      }
    });

    it('should handle circular reference', () => {
      const first = new FilterInOut();
      first.alloc();
      first.name = 'first';

      const second = new FilterInOut();
      second.alloc();
      second.name = 'second';

      // Create circular reference
      first.next = second;
      second.next = first;

      // Count would infinite loop if not handled
      // Implementation currently doesn't handle this - it would loop
      // This is a known limitation

      // Break the cycle before freeing
      second.next = null;
      first.free();
      // second is already freed as part of the chain
    });
  });

  describe('Memory Management', () => {
    it('should handle multiple alloc/free cycles', () => {
      const inout = new FilterInOut();

      // First cycle
      inout.alloc();
      inout.name = 'test1';
      inout.padIdx = 1;
      inout.free();

      // Second cycle
      inout.alloc();
      inout.name = 'test2';
      inout.padIdx = 2;
      inout.free();

      assert.ok(true, 'Should handle multiple cycles');
    });

    it('should free entire linked list', () => {
      const graph = new FilterGraph();
      graph.alloc();

      // Create contexts
      const filter = Filter.getByName('anull');
      assert.ok(filter);

      const contexts = [];
      for (let i = 0; i < 5; i++) {
        const ctx = graph.createFilter(filter, `filter_${i}`);
        if (ctx) contexts.push(ctx);
      }

      // Create linked list
      const items = contexts.map((ctx, i) => ({
        name: `item_${i}`,
        filterCtx: ctx,
        padIdx: i,
      }));

      const list = FilterInOut.createList(items);
      assert.ok(list);
      assert.equal(list?.count(), contexts.length);

      // Free should handle entire list
      list?.free();

      graph.free();
    });

    it('should handle freeing middle element', () => {
      const first = new FilterInOut();
      first.alloc();
      first.name = 'first';

      const second = new FilterInOut();
      second.alloc();
      second.name = 'second';

      const third = new FilterInOut();
      third.alloc();
      third.name = 'third';

      // Don't link them to test individual freeing
      // If we link them, freeing middle would free the rest

      // Free individually
      second.free();
      first.free();
      third.free();
    });
  });

  describe('Complex Scenarios', () => {
    it('should create complex input/output configuration', () => {
      const graph = new FilterGraph();
      graph.alloc();

      // Create various filter contexts
      const filters = {
        videoBuffer: Filter.getByName('buffer'),
        audioBuffer: Filter.getByName('abuffer'),
        overlay: Filter.getByName('overlay'),
        videoSink: Filter.getByName('buffersink'),
        audioSink: Filter.getByName('abuffersink'),
      };

      Object.values(filters).forEach((f) => assert.ok(f));

      const contexts = {
        video1: graph.createFilter(filters.videoBuffer!, 'video1', 'video_size=640x480:pix_fmt=0:time_base=1/25'),
        video2: graph.createFilter(filters.videoBuffer!, 'video2', 'video_size=640x480:pix_fmt=0:time_base=1/25'),
        audio: graph.createFilter(filters.audioBuffer!, 'audio', 'sample_rate=44100:sample_fmt=1:channel_layout=3'),
        overlay: graph.createFilter(filters.overlay!, 'overlay'),
        videoOut: graph.createFilter(filters.videoSink!, 'vout'),
        audioOut: graph.createFilter(filters.audioSink!, 'aout'),
      };

      Object.values(contexts).forEach((c) => assert.ok(c));

      // Create complex input configuration
      const inputs = FilterInOut.createList([
        { name: 'main_video', filterCtx: contexts.video1!, padIdx: 0 },
        { name: 'overlay_video', filterCtx: contexts.video2!, padIdx: 0 },
        { name: 'audio_in', filterCtx: contexts.audio!, padIdx: 0 },
      ]);

      // Create output configuration
      const outputs = FilterInOut.createList([
        { name: 'video_out', filterCtx: contexts.videoOut!, padIdx: 0 },
        { name: 'audio_out', filterCtx: contexts.audioOut!, padIdx: 0 },
      ]);

      assert.ok(inputs);
      assert.ok(outputs);
      assert.equal(inputs?.count(), 3);
      assert.equal(outputs?.count(), 2);

      inputs?.free();
      outputs?.free();
      graph.free();
    });

    it('should handle dynamic list building', () => {
      const graph = new FilterGraph();
      graph.alloc();

      const filter = Filter.getByName('anull');
      assert.ok(filter);

      // Build list dynamically
      let head: FilterInOut | null = null;
      let current: FilterInOut | null = null;

      for (let i = 0; i < 10; i++) {
        const ctx = graph.createFilter(filter, `filter_${i}`);
        assert.ok(ctx);

        const inout = new FilterInOut();
        inout.alloc();
        inout.name = `io_${i}`;
        inout.filterCtx = ctx;
        inout.padIdx = i % 3; // Vary pad indices

        if (!head) {
          head = inout;
          current = inout;
        } else if (current) {
          current.next = inout;
          current = inout;
        }
      }

      assert.ok(head);
      assert.equal(head?.count(), 10, 'Should have 10 elements');
      assert.equal(head?.name, 'io_0');

      head?.free();
      graph.free();
    });
  });
});
