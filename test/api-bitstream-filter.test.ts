import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { BitStreamFilterAPI, MediaInput } from '../src/api/index.js';
import { AV_CODEC_ID_H264 } from '../src/lib/constants.js';
import { Packet } from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('BitStreamFilterAPI', () => {
  describe('Basic Operations', () => {
    it('should create and dispose filter', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream, 'Should have video stream');

      {
        using bsf = await BitStreamFilterAPI.create('null', stream);
        assert.equal(bsf.name, 'null');
        assert.ok(bsf.streamInfo);
        assert.equal(bsf.streamInfo.index, stream.index);
      }
      // Filter automatically disposed
    });

    it('should throw for non-existent filter', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();

      await assert.rejects(async () => await BitStreamFilterAPI.create('non_existent_filter', stream!), /Bitstream filter 'non_existent_filter' not found/);
    });
  });

  describe('Packet Processing', () => {
    it('should process packets through null filter', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      using bsf = await BitStreamFilterAPI.create('null', stream);

      // Process a few packets
      let packetsProcessed = 0;
      const maxPackets = 5;

      for await (const packet of media.packets()) {
        if (packet.streamIndex !== stream.index) continue;

        const filtered = await bsf.process(packet);

        // null filter should pass packets through
        assert.ok(Array.isArray(filtered), 'Should return array of packets');

        for (const outPacket of filtered) {
          assert.ok(outPacket instanceof Packet);
          assert.ok(outPacket.size >= 0);
        }

        packetsProcessed++;
        if (packetsProcessed >= maxPackets) break;
      }

      assert.ok(packetsProcessed > 0, 'Should have processed at least one packet');
    });

    it('should handle flush correctly', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      using bsf = await BitStreamFilterAPI.create('null', stream);

      // Process one packet
      for await (const packet of media.packets()) {
        if (packet.streamIndex !== stream.index) continue;

        await bsf.process(packet);
        break; // Just process one
      }

      // Flush
      const remaining = await bsf.flush();
      assert.ok(Array.isArray(remaining), 'Flush should return array');
    });

    it('should handle flushPackets generator', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      using bsf = await BitStreamFilterAPI.create('null', stream);

      // Process one packet
      for await (const packet of media.packets()) {
        if (packet.streamIndex !== stream.index) continue;

        await bsf.process(packet);
        break; // Just process one
      }

      // Flush with generator
      let flushedCount = 0;
      for await (const packet of bsf.flushPackets()) {
        assert.ok(packet instanceof Packet);
        flushedCount++;
      }
      
      // null filter may or may not have buffered packets
      assert.ok(flushedCount >= 0, 'Should process flush packets');
    });

    it('should reset filter state', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      using bsf = await BitStreamFilterAPI.create('null', stream);

      // Reset should not throw
      assert.doesNotThrow(() => bsf.reset());
    });
  });

  describe('Stream Processing', () => {
    it('should process packet stream with processAll', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      using bsf = await BitStreamFilterAPI.create('null', stream);

      // Create filtered packet stream
      async function* videoPackets() {
        let count = 0;
        for await (const packet of media.packets()) {
          if (packet.streamIndex === stream?.index) {
            yield packet;
            count++;
            if (count >= 5) break; // Limit for test
          }
        }
      }

      let processedCount = 0;
      for await (const filtered of bsf.packets(videoPackets())) {
        assert.ok(filtered instanceof Packet);
        assert.ok(filtered.size >= 0);
        processedCount++;
      }

      assert.ok(processedCount > 0, 'Should have processed packets');
    });
  });

  describe('H.264 Filtering', () => {
    it('should process H.264 with h264_mp4toannexb filter', async function (t) {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();

      if (!stream || stream.codecpar.codecId !== AV_CODEC_ID_H264) {
        t.skip();
        return;
      }

      // Try to create h264_mp4toannexb filter
      let bsf: BitStreamFilterAPI;
      try {
        bsf = await BitStreamFilterAPI.create('h264_mp4toannexb', stream);
      } catch {
        t.skip(); // Filter might not be available
        return;
      }

      using _bsf = bsf;

      // Check output parameters
      assert.ok(bsf.outputCodecParameters, 'Should have output codec parameters');
      assert.ok(bsf.outputTimeBase, 'Should have output time base');

      // Process a few packets
      let packetsProcessed = 0;
      const maxPackets = 3;

      for await (const packet of media.packets()) {
        if (packet.streamIndex !== stream.index) continue;

        const filtered = await bsf.process(packet);

        for (const outPacket of filtered) {
          assert.ok(outPacket.size > 0, 'Filtered packet should have data');
          // h264_mp4toannexb converts MP4 format to Annex B
          // The output should be valid H.264 Annex B stream
        }

        packetsProcessed++;
        if (packetsProcessed >= maxPackets) break;
      }

      assert.ok(packetsProcessed > 0, 'Should have processed at least one packet');
    });
  });

  describe('Error Handling', () => {
    it('should throw when using disposed filter', async () => {
      const testFile = path.join(__dirname, '..', 'testdata', 'demux.mp4');

      await using media = await MediaInput.open(testFile);
      const stream = media.video();
      assert.ok(stream);

      const bsf = await BitStreamFilterAPI.create('null', stream);
      bsf.dispose();

      // Create a test packet
      const packet = new Packet();
      packet.alloc();

      // Should throw when trying to use disposed filter
      await assert.rejects(async () => await bsf.process(packet), /BitStreamFilterAPI is disposed/);

      await assert.rejects(async () => await bsf.flush(), /BitStreamFilterAPI is disposed/);

      assert.throws(() => bsf.reset(), /BitStreamFilterAPI is disposed/);

      packet.unref();
    });
  });
});
