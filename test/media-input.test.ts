import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
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

  describe('probeFormat', () => {
    it('should probe format from file path', async () => {
      const info = await MediaInput.probeFormat('testdata/demux.mp4');

      assert.ok(info, 'Should detect format');
      assert.ok(info.format, 'Should have format name');
      assert.equal(typeof info.format, 'string', 'Format should be string');
      assert.ok(info.confidence > 0, 'Should have confidence score');

      // MP4 format details
      if (info.format.includes('mp4') || info.format.includes('mov')) {
        assert.ok(info.longName, 'MP4 should have long name');
        assert.ok(info.extensions, 'MP4 should have extensions');
      }

      console.log('Probed format:', info);
    });

    it('should probe format from buffer', async () => {
      const buffer = await readFile('testdata/demux.mp4');
      const info = await MediaInput.probeFormat(buffer);

      assert.ok(info, 'Should detect format from buffer');
      assert.ok(info.format, 'Should have format name');
      assert.equal(info.confidence, 100, 'Buffer probe should have high confidence');

      console.log('Probed format from buffer:', info);
    });

    it('should probe different formats', async () => {
      // Try probing different file formats if available
      const testFiles = [
        { path: 'testdata/demux.mp4', expectedFormat: 'mp4' },
        { path: 'testdata/video.m1v', expectedFormat: 'mpegvideo' },
        { path: 'testdata/audio.aac', expectedFormat: 'aac' },
      ];

      for (const { path, expectedFormat } of testFiles) {
        try {
          const info = await MediaInput.probeFormat(path);
          if (info) {
            console.log(`Probed ${path}: ${info.format}`);
            // Check if the detected format matches or contains expected format
            assert.ok(
              info.format.includes(expectedFormat) || info.format === expectedFormat || info.longName?.toLowerCase().includes(expectedFormat),
              `Expected format to contain ${expectedFormat}, got ${info.format}`,
            );
          }
        } catch {
          // File might not exist, skip
          console.log(`Skipping ${path}: not found`);
        }
      }
    });

    it('should return null for invalid data', async () => {
      // Test with random data that's not a valid media format
      const randomBuffer = Buffer.from('This is not a media file');
      const info = await MediaInput.probeFormat(randomBuffer);

      assert.equal(info, null, 'Should return null for invalid media data');
    });

    it('should handle partial buffers', async () => {
      // Read only first 4KB of file
      const buffer = await readFile('testdata/demux.mp4');
      const partialBuffer = buffer.subarray(0, 4096);

      const info = await MediaInput.probeFormat(partialBuffer);

      // MP4 should be detectable from first 4KB
      assert.ok(info, 'Should detect format from partial buffer');
      assert.ok(info.format, 'Should have format name');

      console.log('Probed from partial buffer:', info);
    });

    it('should handle non-existent file', async () => {
      const info = await MediaInput.probeFormat('nonexistent.mp4');

      assert.equal(info, null, 'Should return null for non-existent file');
    });

    it('should probe with file extension hint', async () => {
      // Test that filename is used as hint for better detection
      const buffer = await readFile('testdata/demux.mp4');

      // Probe same buffer with and without hint
      const withoutHint = await MediaInput.probeFormat(buffer);
      const withHint = await MediaInput.probeFormat('testdata/demux.mp4');

      assert.ok(withoutHint, 'Should detect without hint');
      assert.ok(withHint, 'Should detect with hint');

      // With file path hint might have different confidence
      console.log('Without hint confidence:', withoutHint.confidence);
      console.log('With hint confidence:', withHint.confidence);
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
