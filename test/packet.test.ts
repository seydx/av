import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PKT_FLAG_KEY, Packet, Rational } from '../src/lib/index.js';

describe('Packet', () => {
  it('should create a new packet', () => {
    const packet = new Packet();
    assert(packet);
    assert.strictEqual(packet.streamIndex, -1);
  });

  it('should set and get properties', () => {
    const packet = new Packet();

    packet.streamIndex = 0;
    assert.strictEqual(packet.streamIndex, 0);

    packet.pts = 1000n;
    assert.strictEqual(packet.pts, 1000n);

    packet.dts = 2000n;
    assert.strictEqual(packet.dts, 2000n);

    packet.duration = 40n;
    assert.strictEqual(packet.duration, 40n);

    packet.pos = 12345n;
    assert.strictEqual(packet.pos, 12345n);
  });

  it('should handle packet flags', () => {
    const packet = new Packet();

    packet.flags = AV_PKT_FLAG_KEY;
    assert(packet.isKeyframe);

    packet.isKeyframe = false;
    assert(!packet.isKeyframe);
    assert.strictEqual(packet.flags & AV_PKT_FLAG_KEY, 0);

    packet.isKeyframe = true;
    assert(packet.isKeyframe);
    assert.strictEqual(packet.flags & AV_PKT_FLAG_KEY, AV_PKT_FLAG_KEY);
  });

  it('should set and get data', () => {
    const packet = new Packet();
    const data = Buffer.from('test data');

    packet.data = data;
    assert(packet.data);
    assert(Buffer.isBuffer(packet.data));
    assert(packet.size > 0);
  });

  it('should rescale timestamps', () => {
    const packet = new Packet();
    packet.pts = 90000n; // 1 second at 90kHz
    packet.dts = 90000n;
    packet.duration = 3600n; // 40ms at 90kHz

    const src = new Rational(1, 90000); // 90kHz time base
    const dst = new Rational(1, 1000); // 1kHz time base

    packet.rescaleTs(src, dst);

    // After rescaling: 90000 * (1/90000) / (1/1000) = 1000
    assert.strictEqual(packet.pts, 1000n);
    assert.strictEqual(packet.dts, 1000n);
    assert.strictEqual(packet.duration, 40n);
  });

  it('should support using statement', () => {
    {
      using packet = new Packet();
      packet.streamIndex = 1;
      assert.strictEqual(packet.streamIndex, 1);
    }
    // Packet is automatically disposed here
  });

  it('should clone packet', () => {
    const packet = new Packet();
    packet.streamIndex = 2;
    packet.pts = 5000n;
    packet.flags = AV_PKT_FLAG_KEY;

    const cloned = packet.clone();
    assert.strictEqual(cloned.streamIndex, 2);
    assert.strictEqual(cloned.pts, 5000n);
    assert.strictEqual(cloned.flags, AV_PKT_FLAG_KEY);

    // Modifying clone shouldn't affect original
    cloned.streamIndex = 3;
    assert.strictEqual(packet.streamIndex, 2);
    assert.strictEqual(cloned.streamIndex, 3);
  });
});
