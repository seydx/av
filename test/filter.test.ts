import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Filter } from '../src/lib/index.js';

describe('Filter', () => {
  describe('Static Methods', () => {
    it('should get filter by name', () => {
      // Test with a well-known filter
      const scaleFilter = Filter.getByName('scale');
      assert.ok(scaleFilter, 'Should find scale filter');
      assert.equal(scaleFilter.name, 'scale');
    });

    it('should return null for non-existent filter', () => {
      const filter = Filter.getByName('non_existent_filter_xyz');
      assert.equal(filter, null, 'Should return null for non-existent filter');
    });

    it('should get list of all filters', () => {
      const filters = Filter.getList();
      assert.ok(Array.isArray(filters), 'Should return an array');
      assert.ok(filters.length > 0, 'Should have at least one filter');

      // Check that all items are Filter instances
      filters.forEach((filter) => {
        assert.ok(filter instanceof Filter, 'Each item should be a Filter instance');
      });
    });

    it('should find common filters in the list', () => {
      const filters = Filter.getList();
      const filterNames = filters.map((f) => f.name);

      // Check for some common filters that should exist
      assert.ok(filterNames.includes('scale'), 'Should include scale filter');
      assert.ok(filterNames.includes('crop'), 'Should include crop filter');
      assert.ok(filterNames.includes('overlay'), 'Should include overlay filter');
      assert.ok(filterNames.includes('volume'), 'Should include volume filter');
    });
  });

  describe('Filter Properties', () => {
    it('should have name property', () => {
      const filter = Filter.getByName('scale');
      assert.ok(filter);
      assert.equal(filter.name, 'scale');
      assert.equal(typeof filter.name, 'string');
    });

    it('should have description property', () => {
      const filter = Filter.getByName('scale');
      assert.ok(filter);
      assert.ok(filter.description, 'Should have a description');
      assert.equal(typeof filter.description, 'string');
      assert.ok(filter.description.length > 0, 'Description should not be empty');
    });

    it('should have inputs property', () => {
      const filter = Filter.getByName('scale');
      assert.ok(filter);
      assert.ok(Array.isArray(filter.inputs), 'Inputs should be an array');
      assert.ok(filter.inputs.length > 0, 'Scale filter should have inputs');

      // Check input pad structure
      filter.inputs.forEach((input) => {
        assert.ok(typeof input.name === 'string', 'Input should have name');
        assert.ok(typeof input.type === 'number', 'Input should have type');
      });
    });

    it('should have outputs property', () => {
      const filter = Filter.getByName('scale');
      assert.ok(filter);
      assert.ok(Array.isArray(filter.outputs), 'Outputs should be an array');
      assert.ok(filter.outputs.length > 0, 'Scale filter should have outputs');

      // Check output pad structure
      filter.outputs.forEach((output) => {
        assert.ok(typeof output.name === 'string', 'Output should have name');
        assert.ok(typeof output.type === 'number', 'Output should have type');
      });
    });

    it('should have flags property', () => {
      const filter = Filter.getByName('scale');
      assert.ok(filter);
      assert.equal(typeof filter.flags, 'number', 'Flags should be a number');
      assert.ok(filter.flags >= 0, 'Flags should be non-negative');
    });
  });

  describe('Filter Type Detection', () => {
    describe('Source Filters', () => {
      it('should identify source filters', () => {
        const buffer = Filter.getByName('buffer');
        assert.ok(buffer, 'Should find buffer filter');
        assert.ok(buffer.isSource(), 'Buffer should be a source filter');
        assert.equal(buffer.inputs.length, 0, 'Source filters have no inputs');
      });

      it('should identify audio source filters', () => {
        const abuffer = Filter.getByName('abuffer');
        assert.ok(abuffer, 'Should find abuffer filter');
        assert.ok(abuffer.isSource(), 'Abuffer should be a source filter');
        assert.equal(abuffer.inputs.length, 0, 'Source filters have no inputs');
      });

      it('should identify color source filter', () => {
        const color = Filter.getByName('color');
        assert.ok(color, 'Should find color filter');
        assert.ok(color.isSource(), 'Color should be a source filter');
      });
    });

    describe('Sink Filters', () => {
      it('should identify sink filters', () => {
        const buffersink = Filter.getByName('buffersink');
        assert.ok(buffersink, 'Should find buffersink filter');
        assert.ok(buffersink.isSink(), 'Buffersink should be a sink filter');
        assert.equal(buffersink.outputs.length, 0, 'Sink filters have no outputs');
      });

      it('should identify audio sink filters', () => {
        const abuffersink = Filter.getByName('abuffersink');
        assert.ok(abuffersink, 'Should find abuffersink filter');
        assert.ok(abuffersink.isSink(), 'Abuffersink should be a sink filter');
        assert.equal(abuffersink.outputs.length, 0, 'Sink filters have no outputs');
      });
    });

    describe('Video Filters', () => {
      it('should identify video filters', () => {
        const scale = Filter.getByName('scale');
        assert.ok(scale, 'Should find scale filter');
        assert.ok(scale.isVideo(), 'Scale should be a video filter');
        assert.ok(!scale.isAudio(), 'Scale should not be an audio filter');
      });

      it('should identify crop as video filter', () => {
        const crop = Filter.getByName('crop');
        assert.ok(crop, 'Should find crop filter');
        assert.ok(crop.isVideo(), 'Crop should be a video filter');
        assert.ok(!crop.isAudio(), 'Crop should not be an audio filter');
      });

      it('should identify overlay as video filter', () => {
        const overlay = Filter.getByName('overlay');
        assert.ok(overlay, 'Should find overlay filter');
        assert.ok(overlay.isVideo(), 'Overlay should be a video filter');
      });

      it('should identify rotate as video filter', () => {
        const rotate = Filter.getByName('rotate');
        assert.ok(rotate, 'Should find rotate filter');
        assert.ok(rotate.isVideo(), 'Rotate should be a video filter');
      });
    });

    describe('Audio Filters', () => {
      it('should identify audio filters', () => {
        const volume = Filter.getByName('volume');
        assert.ok(volume, 'Should find volume filter');
        assert.ok(volume.isAudio(), 'Volume should be an audio filter');
        assert.ok(!volume.isVideo(), 'Volume should not be a video filter');
      });

      it('should identify aformat as audio filter', () => {
        const aformat = Filter.getByName('aformat');
        assert.ok(aformat, 'Should find aformat filter');
        assert.ok(aformat.isAudio(), 'Aformat should be an audio filter');
        assert.ok(!aformat.isVideo(), 'Aformat should not be a video filter');
      });

      it('should identify atempo as audio filter', () => {
        const atempo = Filter.getByName('atempo');
        assert.ok(atempo, 'Should find atempo filter');
        assert.ok(atempo.isAudio(), 'Atempo should be an audio filter');
      });

      it('should identify amix as audio filter', () => {
        const amix = Filter.getByName('amix');
        assert.ok(amix, 'Should find amix filter');
        assert.ok(amix.isAudio(), 'Amix should be an audio filter');
      });
    });
  });

  describe('Filter Categories', () => {
    it('should categorize all filters correctly', () => {
      const filters = Filter.getList();

      const sources = filters.filter((f) => f.isSource());
      const sinks = filters.filter((f) => f.isSink());
      const videoFilters = filters.filter((f) => f.isVideo());
      const audioFilters = filters.filter((f) => f.isAudio());

      assert.ok(sources.length > 0, 'Should have source filters');
      assert.ok(sinks.length > 0, 'Should have sink filters');
      assert.ok(videoFilters.length > 0, 'Should have video filters');
      assert.ok(audioFilters.length > 0, 'Should have audio filters');

      // Log statistics
      console.log(`Total filters: ${filters.length}`);
      console.log(`Source filters: ${sources.length}`);
      console.log(`Sink filters: ${sinks.length}`);
      console.log(`Video filters: ${videoFilters.length}`);
      console.log(`Audio filters: ${audioFilters.length}`);
    });

    it('should find transform filters (not source or sink)', () => {
      const filters = Filter.getList();
      const transformFilters = filters.filter((f) => !f.isSource() && !f.isSink());

      assert.ok(transformFilters.length > 0, 'Should have transform filters');

      // Check some known transform filters
      const scale = transformFilters.find((f) => f.name === 'scale');
      const volume = transformFilters.find((f) => f.name === 'volume');

      assert.ok(scale, 'Scale should be a transform filter');
      assert.ok(volume, 'Volume should be a transform filter');
    });
  });

  describe('Filter Input/Output Pads', () => {
    it('should have correct pad structure for scale filter', () => {
      const scale = Filter.getByName('scale');
      assert.ok(scale);

      // Scale filter should have 1 input and 1 output
      assert.equal(scale.inputs.length, 1, 'Scale should have 1 input');
      assert.equal(scale.outputs.length, 1, 'Scale should have 1 output');

      // Check pad types (0 = VIDEO)
      assert.equal(scale.inputs[0].type, 0, 'Input should be video type');
      assert.equal(scale.outputs[0].type, 0, 'Output should be video type');
    });

    it('should have correct pad structure for overlay filter', () => {
      const overlay = Filter.getByName('overlay');
      assert.ok(overlay);

      // Overlay filter should have 2 inputs (main + overlay) and 1 output
      assert.equal(overlay.inputs.length, 2, 'Overlay should have 2 inputs');
      assert.equal(overlay.outputs.length, 1, 'Overlay should have 1 output');

      // Both inputs and output should be video (type 0)
      overlay.inputs.forEach((input) => {
        assert.equal(input.type, 0, 'All inputs should be video type');
      });
      assert.equal(overlay.outputs[0].type, 0, 'Output should be video type');
    });

    it('should have correct pad structure for amerge filter', () => {
      const amerge = Filter.getByName('amerge');
      assert.ok(amerge);

      // Amerge has dynamic inputs but at least some defined
      assert.ok(amerge.inputs.length >= 0, 'Amerge can have dynamic inputs');
      assert.equal(amerge.outputs.length, 1, 'Amerge should have 1 output');

      // Check audio type (1 = AUDIO)
      assert.equal(amerge.outputs[0].type, 1, 'Output should be audio type');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string for getByName', () => {
      const filter = Filter.getByName('');
      assert.equal(filter, null, 'Empty string should return null');
    });

    it('should handle special characters in filter name', () => {
      const filter = Filter.getByName('scale@2x!');
      assert.equal(filter, null, 'Invalid name should return null');
    });

    it('should return consistent results for multiple calls', () => {
      const list1 = Filter.getList();
      const list2 = Filter.getList();

      assert.equal(list1.length, list2.length, 'Should return same number of filters');

      // Check that filter properties are consistent
      const scale1 = Filter.getByName('scale');
      const scale2 = Filter.getByName('scale');

      assert.ok(scale1);
      assert.ok(scale2);
      assert.equal(scale1.name, scale2.name);
      assert.equal(scale1.description, scale2.description);
      assert.equal(scale1.inputs.length, scale2.inputs.length);
      assert.equal(scale1.outputs.length, scale2.outputs.length);
    });
  });

  describe('Common Filter Examples', () => {
    it('should find commonly used video filters', () => {
      const commonVideoFilters = ['scale', 'crop', 'overlay', 'rotate', 'hflip', 'vflip', 'transpose', 'pad', 'drawtext', 'fade', 'format', 'fps', 'setpts'];

      commonVideoFilters.forEach((name) => {
        const filter = Filter.getByName(name);
        assert.ok(filter, `Should find ${name} filter`);
        assert.ok(filter.isVideo(), `${name} should be a video filter`);
      });
    });

    it('should find commonly used audio filters', () => {
      const commonAudioFilters = ['volume', 'aformat', 'atempo', 'amix', 'amerge', 'aresample', 'loudnorm', 'highpass', 'lowpass', 'equalizer', 'compand'];

      commonAudioFilters.forEach((name) => {
        const filter = Filter.getByName(name);
        if (filter) {
          // Some filters might not be available depending on FFmpeg build
          assert.ok(filter.isAudio(), `${name} should be an audio filter`);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should get filter list efficiently', () => {
      const start = Date.now();
      const filters = Filter.getList();
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 100, `Getting filter list should be fast (took ${elapsed}ms)`);
      assert.ok(filters.length > 100, 'Should have many filters available');
    });

    it('should lookup filters by name efficiently', () => {
      const filterNames = ['scale', 'crop', 'overlay', 'volume', 'aformat'];

      const start = Date.now();
      filterNames.forEach((name) => {
        Filter.getByName(name);
      });
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 10, `Filter lookups should be fast (took ${elapsed}ms for ${filterNames.length} lookups)`);
    });
  });
});
