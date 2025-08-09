import assert from 'node:assert';
import { dirname } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AV_ERROR_EAGAIN, AV_ERROR_EOF, BitStreamFilter, BitStreamFilterContext, Packet } from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('BitStreamFilterContext Async Methods', () => {
  it('should have async methods available', () => {
    const filter = BitStreamFilter.getByName('null');
    assert(filter, 'null filter should exist');

    const context = new BitStreamFilterContext(filter);

    // Check that async methods exist
    assert(typeof context.sendPacketAsync === 'function', 'sendPacketAsync should be a function');
    assert(typeof context.receivePacketAsync === 'function', 'receivePacketAsync should be a function');
    assert(typeof context.filterPacketAsync === 'function', 'filterPacketAsync should be a function');

    context.free();
  });

  it('should filter packets asynchronously', async () => {
    // Use null filter which just passes packets through
    const filter = BitStreamFilter.getByName('null');
    assert(filter, 'null filter should exist');

    const context = new BitStreamFilterContext(filter);
    context.init();

    // Create test packets
    using inputPacket = new Packet();
    using outputPacket = new Packet();

    // Set some test data
    inputPacket.streamIndex = 1;
    inputPacket.pts = 1000n;
    inputPacket.dts = 900n;

    // Send packet asynchronously
    const sendResult = await context.sendPacketAsync(inputPacket);
    assert(sendResult >= 0 || sendResult === AV_ERROR_EAGAIN, 'sendPacketAsync should succeed or return EAGAIN');

    // Receive packet asynchronously
    const receiveResult = await context.receivePacketAsync(outputPacket);
    assert(receiveResult >= 0 || receiveResult === AV_ERROR_EAGAIN || receiveResult === AV_ERROR_EOF, 'receivePacketAsync should succeed or return EAGAIN/EOF');

    context.free();
  });

  it('should handle null packet for flushing', async () => {
    const filter = BitStreamFilter.getByName('null');
    assert(filter, 'null filter should exist');

    const context = new BitStreamFilterContext(filter);
    context.init();

    // Send null packet to flush
    const result = await context.sendPacketAsync(null);
    assert(result >= 0 || result === AV_ERROR_EOF, 'Flushing should succeed or return EOF');

    context.free();
  });

  it('should work with h264_mp4toannexb filter if available', async () => {
    const filter = BitStreamFilter.getByName('h264_mp4toannexb');
    if (!filter) {
      console.log('h264_mp4toannexb filter not available, skipping test');
      return;
    }

    const context = new BitStreamFilterContext(filter);
    
    // h264_mp4toannexb requires codec parameters to be set
    // We'll skip initialization since we don't have proper H.264 codec params
    // Just test that the async methods exist
    assert(typeof context.sendPacketAsync === 'function', 'sendPacketAsync should exist');
    assert(typeof context.receivePacketAsync === 'function', 'receivePacketAsync should exist');
    
    context.free();
  });

  it('should handle filterPacketAsync convenience method', async () => {
    const filter = BitStreamFilter.getByName('null');
    assert(filter, 'null filter should exist');

    const context = new BitStreamFilterContext(filter);
    context.init();

    using inputPacket = new Packet();
    using outputPacket = new Packet();

    inputPacket.pts = 2000n;
    inputPacket.dts = 1900n;

    // Use convenience method
    const result = await context.filterPacketAsync(inputPacket, outputPacket);
    assert(result === 0 || result === AV_ERROR_EAGAIN || result === AV_ERROR_EOF, 'filterPacketAsync should return valid result');

    context.free();
  });
});
