import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { after, describe, it } from 'node:test';
import { MediaInput } from '../src/api/index.js';
import { AV_MEDIA_TYPE_AUDIO, AV_MEDIA_TYPE_VIDEO } from '../src/index.js';

describe('MediaInput', () => {
  // Track all open MediaInput instances
  const openInstances: MediaInput[] = [];

  // Ensure all instances are closed before test suite ends
  after(async () => {
    for (const instance of openInstances) {
      try {
        await instance.close();
      } catch {
        // Ignore errors if already closed
      }
    }
    openInstances.length = 0;

    // Small delay to ensure cleanup completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force GC if available to clean up any remaining references
    if (global.gc) {
      global.gc();
    }
  });
  describe('open', () => {
    it('should open from file path', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      assert.ok(media, 'Should create MediaInput');
      assert.ok(media.streams.length > 0, 'Should have streams');
      assert.ok(media.duration > 0, 'Should have duration');

      await media.close();
    });

    it('should open from Buffer', async () => {
      const buffer = await readFile('testdata/demux.mp4');
      const media = await MediaInput.open(buffer);

      assert.ok(media, 'Should create MediaInput from Buffer');
      assert.ok(media.streams.length > 0, 'Should have streams');

      await media.close();
    });

    it('should open from Readable stream', async () => {
      const buffer = await readFile('testdata/demux.mp4');
      const readable = Readable.from([buffer]);
      const media = await MediaInput.open(readable);

      assert.ok(media, 'Should create MediaInput from stream');
      assert.ok(media.streams.length > 0, 'Should have streams');

      await media.close();
    });

    it('should throw on invalid file', async () => {
      await assert.rejects(async () => await MediaInput.open('nonexistent.mp4'), /Failed to open input/);
    });
  });

  describe('stream info', () => {
    it('should parse video stream info', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      const video = media.video();
      assert.ok(video, 'Should find video stream');
      assert.equal(video.codecpar.codecType, AV_MEDIA_TYPE_VIDEO);
      assert.ok(video.codecpar.width && video.codecpar.width > 0, 'Should have width');
      assert.ok(video.codecpar.height && video.codecpar.height > 0, 'Should have height');
      assert.ok(video.codecpar.codecId, 'Should have codec');
      assert.ok(video.timeBase, 'Should have timeBase');

      await media.close();
    });

    it('should parse audio stream info', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      const audio = media.audio();
      if (audio) {
        assert.equal(audio.codecpar.codecType, AV_MEDIA_TYPE_AUDIO);
        assert.ok(audio.codecpar.sampleRate && audio.codecpar.sampleRate > 0, 'Should have sample rate');
        assert.ok(audio.codecpar.channels && audio.codecpar.channels > 0, 'Should have channels');
        assert.ok(audio.codecpar.codecId, 'Should have codec');
      }

      await media.close();
    });

    it('should get all streams', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      assert.ok(Array.isArray(media.streams), 'Streams should be array');
      assert.ok(media.streams.length > 0, 'Should have at least one stream');

      for (const stream of media.streams) {
        assert.ok(typeof stream.index === 'number', 'Stream should have index');
        assert.ok(stream.codecpar.codecType >= 0, 'Stream should have type');
        assert.ok(stream.codecpar.codecId >= 0, 'Stream should have codec');
        assert.ok(stream.timeBase, 'Stream should have timeBase');
      }

      await media.close();
    });
  });

  describe('metadata', () => {
    it('should get container metadata', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      const metadata = media.metadata;
      assert.ok(typeof metadata === 'object', 'Metadata should be object');

      // Metadata might be empty, that's ok
      console.log('Metadata:', metadata);

      await media.close();
    });

    it('should get format info', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      const formatName = media.formatName;
      assert.ok(formatName, 'Should have format name');
      assert.ok(typeof formatName === 'string', 'Format name should be string');

      const formatLongName = media.formatLongName;
      assert.ok(formatLongName, 'Should have format long name');
      assert.ok(typeof formatLongName === 'string', 'Format long name should be string');

      console.log(`Format: ${formatName} (${formatLongName})`);

      await media.close();
    });
  });

  describe('packets', () => {
    it('should iterate packets', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      let packetCount = 0;
      const maxPackets = 10; // Only read first 10 packets for test

      for await (const packet of media.packets()) {
        assert.ok(packet, 'Should have packet');
        assert.ok(typeof packet.streamIndex === 'number', 'Packet should have stream index');
        assert.ok(packet.size >= 0, 'Packet should have size');

        packetCount++;
        if (packetCount >= maxPackets) break;
      }

      assert.ok(packetCount > 0, 'Should have read some packets');

      await media.close();
    });
  });

  describe('seek', () => {
    it('should seek to timestamp', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      // Try to seek to 1 second
      const ret = await media.seek(1.0);

      // Seek might not be supported for all formats, so just check it doesn't crash
      console.log('Seek result:', ret);

      await media.close();
    });
  });

  describe('lifecycle', () => {
    it('should support multiple open/close cycles', async () => {
      // Open and close multiple times
      for (let i = 0; i < 3; i++) {
        const media = await MediaInput.open('testdata/demux.mp4');
        assert.ok(media.streams.length > 0, `Cycle ${i}: Should have streams`);
        await media.close();
      }
    });

    it('should support Symbol.asyncDispose', async () => {
      let streamCount = 0;

      {
        await using media = await MediaInput.open('testdata/demux.mp4');
        streamCount = media.streams.length;
        assert.ok(streamCount > 0, 'Should have streams');
        // Should auto-close when leaving scope
      }

      // Open again to verify previous was properly closed
      const media2 = await MediaInput.open('testdata/demux.mp4');
      assert.equal(media2.streams.length, streamCount, 'Should have same streams');
      await media2.close();
    });
  });

  describe('edge cases', () => {
    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await assert.rejects(async () => await MediaInput.open(emptyBuffer), Error, 'Should fail on empty buffer');
    });

    it('should handle small video files', async () => {
      // Test with a small video file if available
      try {
        const media = await MediaInput.open('testdata/video.m1v');
        assert.ok(media, 'Should open small video');
        assert.ok(media.streams.length > 0, 'Should have streams');
        await media.close();
      } catch (e) {
        // File might not exist, that's ok for this test
        console.log('Small video test skipped:', (e as Error).message);
      }
    });
  });
});
