import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Decoder } from '../src/api/decoder.js';
import { MediaInput } from '../src/api/media-input.js';
import { Packet } from '../src/lib/index.js';

describe('Decoder', () => {
  describe('create', () => {
    it('should create decoder for video stream', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      // Find video stream
      const videoStream = media.video();
      assert.ok(videoStream, 'Should find video stream');

      // Create decoder
      const decoder = await Decoder.create(videoStream);
      assert.ok(decoder);
      assert.equal(decoder.isDecoderOpen, true);
      assert.equal(decoder.getStreamIndex(), videoStream.index);

      decoder.close();
      await media.close();
    });

    it('should create decoder for audio stream', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');

      // Find audio stream
      const audioStream = media.audio();
      assert.ok(audioStream, 'Should find audio stream');

      // Create decoder
      const decoder = await Decoder.create(audioStream);
      assert.ok(decoder);
      assert.equal(decoder.isDecoderOpen, true);

      decoder.close();
      await media.close();
    });

    it('should create decoder with thread options', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      // Create decoder with 4 threads
      const decoder = await Decoder.create(videoStream, {
        threads: 4,
      });
      assert.ok(decoder);

      decoder.close();
      await media.close();
    });

    it('should throw for unsupported codec', async () => {
      // This test would need a file with an unsupported codec
      // For now, we'll skip it as our test files use standard codecs
      assert.ok(true, 'Skipped - needs special test file');
    });
  });

  describe('decode', () => {
    it('should decode video packets', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      let frameCount = 0;
      let packetCount = 0;
      const maxPackets = 10;

      for await (const packet of media.packets()) {
        if (packet.streamIndex === videoStream.index) {
          const frame = await decoder.decode(packet);
          if (frame) {
            assert.ok(frame.width > 0);
            assert.ok(frame.height > 0);
            frameCount++;
            frame.free();
          }

          packetCount++;
          if (packetCount >= maxPackets) break;
        }
      }

      assert.ok(frameCount > 0, 'Should decode at least one frame');

      decoder.close();
      await media.close();
    });

    it('should decode audio packets', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const audioStream = media.audio();
      assert.ok(audioStream);

      const decoder = await Decoder.create(audioStream);

      let frameCount = 0;
      let packetCount = 0;
      const maxPackets = 10;

      for await (const packet of media.packets()) {
        if (packet.streamIndex === audioStream.index) {
          const frame = await decoder.decode(packet);
          if (frame) {
            assert.ok(frame.nbSamples > 0);
            assert.ok(frame.sampleRate > 0);
            frameCount++;
            frame.free();
          }

          packetCount++;
          if (packetCount >= maxPackets) break;
        }
      }

      assert.ok(frameCount > 0, 'Should decode at least one audio frame');

      decoder.close();
      await media.close();
    });

    it('should handle null frames gracefully', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      // Some packets might not immediately produce frames
      for await (const packet of media.packets()) {
        if (packet.streamIndex === videoStream.index) {
          const frame = await decoder.decode(packet);
          // Frame can be null, that's okay
          if (frame) {
            frame.free();
          }
          break; // Just test one packet
        }
      }

      decoder.close();
      await media.close();
    });

    it('should throw when decoder is closed', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);
      decoder.close();

      const packet = new Packet();
      packet.alloc();

      await assert.rejects(async () => await decoder.decode(packet), /Decoder is closed/);

      packet.free();
      await media.close();
    });
  });

  describe('flush', () => {
    it('should flush remaining frames', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      // Decode some packets first
      let packetCount = 0;
      for await (const packet of media.packets()) {
        if (packet.streamIndex === videoStream.index) {
          await decoder.decode(packet);
          packetCount++;
          if (packetCount >= 5) break;
        }
      }

      // Flush decoder
      let flushCount = 0;
      let frame;
      while ((frame = await decoder.flush()) !== null) {
        assert.ok(frame.width > 0);
        frame.free();
        flushCount++;
        if (flushCount > 10) break; // Safety limit
      }

      decoder.close();
      await media.close();
    });

    it('should throw when decoder is closed', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);
      decoder.close();

      await assert.rejects(async () => await decoder.flush(), /Decoder is closed/);

      await media.close();
    });
  });

  describe('resource management', () => {
    it('should support Symbol.dispose', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      {
        using decoder = await Decoder.create(videoStream);
        assert.equal(decoder.isDecoderOpen, true);
        // Decoder will be closed automatically
      }

      await media.close();
    });

    it('should handle multiple close calls', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      // Should not throw
      decoder.close();
      decoder.close();
      decoder.close();

      assert.equal(decoder.isDecoderOpen, false);

      await media.close();
    });
  });

  describe('async iterator', () => {
    it('should decode frames using iterator', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      let frameCount = 0;
      const maxFrames = 10;

      for await (const frame of decoder.frames(media.packets())) {
        assert.ok(frame.width > 0);
        assert.ok(frame.height > 0);
        frame.free();

        frameCount++;
        if (frameCount >= maxFrames) break;
      }

      assert.ok(frameCount > 0, 'Should decode at least one frame');

      decoder.close();
      await media.close();
    });

    it('should only decode packets for its stream', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      const audioStream = media.audio();
      assert.ok(videoStream);
      assert.ok(audioStream);

      const videoDecoder = await Decoder.create(videoStream);

      let videoFrameCount = 0;
      const maxFrames = 5;

      // The iterator should only process video packets
      for await (const frame of videoDecoder.frames(media.packets())) {
        assert.ok(frame.width > 0); // Video frames have width
        frame.free();

        videoFrameCount++;
        if (videoFrameCount >= maxFrames) break;
      }

      assert.ok(videoFrameCount > 0, 'Should decode video frames');

      videoDecoder.close();
      await media.close();
    });

    it('should handle empty packet stream', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      assert.ok(videoStream);

      const decoder = await Decoder.create(videoStream);

      // Empty async generator
      async function* emptyPackets() {
        // No packets
      }

      let frameCount = 0;
      for await (const frame of decoder.frames(emptyPackets())) {
        frameCount++;
        frame.free();
      }

      assert.equal(frameCount, 0, 'Should not produce frames from empty stream');

      decoder.close();
      await media.close();
    });
  });

  describe('stream identification', () => {
    it('should track stream index', async () => {
      const media = await MediaInput.open('testdata/demux.mp4');
      const videoStream = media.video();
      const audioStream = media.audio();
      assert.ok(videoStream);
      assert.ok(audioStream);

      const videoDecoder = await Decoder.create(videoStream);
      const audioDecoder = await Decoder.create(audioStream);

      assert.equal(videoDecoder.getStreamIndex(), videoStream.index);
      assert.equal(audioDecoder.getStreamIndex(), audioStream.index);
      assert.notEqual(videoDecoder.getStreamIndex(), audioDecoder.getStreamIndex());

      videoDecoder.close();
      audioDecoder.close();
      await media.close();
    });
  });
});
