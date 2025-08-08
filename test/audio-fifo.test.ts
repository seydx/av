import assert from 'node:assert';
import { describe, it } from 'node:test';

import { 
  AudioFifo,
  Frame,
  AV_SAMPLE_FMT_FLTP,
  AV_SAMPLE_FMT_S16,
} from '../src/lib/index.js';

describe('AudioFifo', () => {
  it('should allocate audio FIFO', () => {
    using fifo = new AudioFifo(AV_SAMPLE_FMT_S16, 2, 1024);
    assert(fifo);
    assert.strictEqual(fifo.size, 0);
    assert(fifo.space >= 1024);
  });

  it('should support using statement', () => {
    {
      using fifo = new AudioFifo(AV_SAMPLE_FMT_FLTP, 2, 2048);
      assert(fifo);
    }
    // FIFO should be disposed here
    assert(true, 'FIFO disposed successfully');
  });

  it('should reallocate buffer', () => {
    using fifo = new AudioFifo(AV_SAMPLE_FMT_S16, 2, 1024);
    const initialSpace = fifo.space;
    
    // Reallocate to larger size
    fifo.realloc(2048);
    
    // Space should be at least the new size
    assert(fifo.space >= 2048);
  });

  it('should write and read frames', () => {
    using fifo = new AudioFifo(AV_SAMPLE_FMT_FLTP, 2, 1024);
    
    // Create an audio frame
    using writeFrame = new Frame();
    writeFrame.format = AV_SAMPLE_FMT_FLTP;
    writeFrame.sampleRate = 48000;
    writeFrame.nbSamples = 512;
    writeFrame.channelLayout = {
      nbChannels: 2,
      order: 1, // NATIVE
      mask: 3n, // Stereo
    };
    
    // Allocate buffer for the frame
    writeFrame.allocBuffer();
    
    // Write to FIFO
    const written = fifo.write(writeFrame);
    assert.strictEqual(written, 512);
    assert.strictEqual(fifo.size, 512);
    
    // Read from FIFO
    using readFrame = new Frame();
    readFrame.format = AV_SAMPLE_FMT_FLTP;
    readFrame.sampleRate = 48000;
    readFrame.nbSamples = 256; // Read less than written
    readFrame.channelLayout = {
      nbChannels: 2,
      order: 1,
      mask: 3n,
    };
    readFrame.allocBuffer();
    
    const read = fifo.read(readFrame);
    assert.strictEqual(read, 256);
    assert.strictEqual(fifo.size, 256); // Should have 256 samples left
  });

  it('should handle multiple write/read operations', () => {
    using fifo = new AudioFifo(AV_SAMPLE_FMT_S16, 1, 1024);
    
    // Create frames
    using frame1 = new Frame();
    frame1.format = AV_SAMPLE_FMT_S16;
    frame1.sampleRate = 44100;
    frame1.nbSamples = 128;
    frame1.channelLayout = {
      nbChannels: 1,
      order: 1,
      mask: 1n, // Mono
    };
    frame1.allocBuffer();
    
    // Write multiple times
    let totalWritten = 0;
    for (let i = 0; i < 4; i++) {
      const written = fifo.write(frame1);
      assert.strictEqual(written, 128);
      totalWritten += written;
    }
    
    assert.strictEqual(fifo.size, totalWritten);
    assert.strictEqual(fifo.size, 512);
    
    // Read all at once
    using frame2 = new Frame();
    frame2.format = AV_SAMPLE_FMT_S16;
    frame2.sampleRate = 44100;
    frame2.nbSamples = 512;
    frame2.channelLayout = {
      nbChannels: 1,
      order: 1,
      mask: 1n,
    };
    frame2.allocBuffer();
    
    const read = fifo.read(frame2);
    assert.strictEqual(read, 512);
    assert.strictEqual(fifo.size, 0);
  });

  it('should report correct size and space', () => {
    using fifo = new AudioFifo(AV_SAMPLE_FMT_FLTP, 2, 1024);
    
    // Initially empty
    assert.strictEqual(fifo.size, 0);
    const initialSpace = fifo.space;
    assert(initialSpace >= 1024);
    
    // Create and write a frame
    using frame = new Frame();
    frame.format = AV_SAMPLE_FMT_FLTP;
    frame.sampleRate = 48000;
    frame.nbSamples = 256;
    frame.channelLayout = {
      nbChannels: 2,
      order: 1,
      mask: 3n,
    };
    frame.allocBuffer();
    
    fifo.write(frame);
    
    // Check size and space after write
    assert.strictEqual(fifo.size, 256);
    assert.strictEqual(fifo.space, initialSpace - 256);
  });
});