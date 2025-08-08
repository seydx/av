import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BitStreamFilter,
  BitStreamFilterContext,
  BitstreamFilters,
  createBitstreamFilter,
  Packet,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_HEVC,
  AV_CODEC_ID_AAC,
} from '../dist/lib/index.js';

describe('BitStreamFilter', () => {
  it('should get filter by name', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);
    assert.strictEqual(filter.name, 'h264_mp4toannexb');
  });

  it('should return null for non-existent filter', () => {
    const filter = BitStreamFilter.getByName('non_existent_filter');
    assert.strictEqual(filter, null);
  });

  it('should iterate over available filters', () => {
    const filters = BitStreamFilter.getAll();
    assert(Array.isArray(filters));
    assert(filters.length > 0);

    // Check that common filters exist
    const filterNames = filters.map(f => f.name);
    assert(filterNames.includes('h264_mp4toannexb'));
    assert(filterNames.includes('hevc_mp4toannexb'));
  });

  it('should get codec IDs for filter', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);
    const codecIds = filter.codecIds;
    if (codecIds) {
      assert(Array.isArray(codecIds));
      assert(codecIds.includes(AV_CODEC_ID_H264));
    }
  });

  it('should check codec support', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);
    
    // H264 filter should support H264 codec
    assert(filter.supportsCodec(AV_CODEC_ID_H264));
    
    // But not AAC (if it has specific codec IDs)
    const codecIds = filter.codecIds;
    if (codecIds && codecIds.length > 0) {
      assert(!filter.supportsCodec(AV_CODEC_ID_AAC));
    }
  });
});

describe('BitStreamFilterContext', () => {
  it('should allocate and initialize context', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);

    const context = BitStreamFilterContext.alloc(filter);
    assert(context);

    // Should be able to initialize
    assert.doesNotThrow(() => context.init());

    // Clean up
    context.free();
  });

  it('should support using statement', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);

    {
      using context = BitStreamFilterContext.alloc(filter);
      context.init();
      // Context will be automatically freed when going out of scope
    }
    
    // If we got here without errors, the using statement worked
    assert(true);
  });

  it('should get filter from context', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);

    const context = BitStreamFilterContext.alloc(filter);
    const contextFilter = context.filter;
    
    assert(contextFilter);
    assert.strictEqual(contextFilter.name, filter.name);

    context.free();
  });

  it('should handle time base properties', () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    assert(filter);

    const context = BitStreamFilterContext.alloc(filter);
    
    // Set time base
    const timeBase = { num: 1, den: 25 };
    context.timeBaseIn = timeBase;
    
    const retrieved = context.timeBaseIn;
    assert.strictEqual(retrieved.num, timeBase.num);
    assert.strictEqual(retrieved.den, timeBase.den);

    context.free();
  });

  it('should filter packets', () => {
    const filter = BitStreamFilter.getByName('null');  // Use null filter for testing
    assert(filter);

    const context = BitStreamFilterContext.alloc(filter);
    context.init();

    using inputPacket = new Packet();
    using outputPacket = new Packet();

    // Set some test data
    inputPacket.streamIndex = 0;
    inputPacket.pts = 1000n;
    inputPacket.dts = 1000n;
    inputPacket.data = Buffer.from([0x00, 0x00, 0x00, 0x01]);

    // Send packet (null filter should pass through)
    const sendRet = context.sendPacket(inputPacket);
    assert.strictEqual(sendRet, 0);

    // Receive packet
    const receiveRet = context.receivePacket(outputPacket);
    
    // For null filter, it should work
    if (receiveRet === 0) {
      assert.strictEqual(outputPacket.streamIndex, inputPacket.streamIndex);
    }

    context.free();
  });

  it('should flush context', () => {
    const filter = BitStreamFilter.getByName('null');
    assert(filter);

    const context = BitStreamFilterContext.alloc(filter);
    context.init();

    // Should not throw
    assert.doesNotThrow(() => context.flush());

    context.free();
  });
});

describe('createBitstreamFilter helper', () => {
  it('should create and initialize filter', () => {
    const context = createBitstreamFilter(BitstreamFilters.NULL);
    assert(context);
    assert(context.filter);
    assert.strictEqual(context.filter.name, 'null');
    context.free();
  });

  it('should throw for non-existent filter', () => {
    assert.throws(
      () => createBitstreamFilter('non_existent_filter'),
      /not found/
    );
  });
});

describe('BitstreamFilters constants', () => {
  it('should have common filter names', () => {
    assert.strictEqual(BitstreamFilters.H264_MP4_TO_ANNEXB, 'h264_mp4toannexb');
    assert.strictEqual(BitstreamFilters.HEVC_MP4_TO_ANNEXB, 'hevc_mp4toannexb');
    assert.strictEqual(BitstreamFilters.AAC_ADTS_TO_ASC, 'aac_adtstoasc');
    assert.strictEqual(BitstreamFilters.NULL, 'null');
  });
});