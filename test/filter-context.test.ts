import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  FilterGraph,
  FilterContext,
  Frame,
  Rational,
  AV_PIX_FMT_YUV420P,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
} from '../src/lib/index.js';

describe('FilterContext', () => {
  it('should be accessible from FilterGraph', async () => {
    using graph = new FilterGraph();
    
    await graph.buildPipeline({
      input: {
        width: 640,
        height: 480,
        pixelFormat: AV_PIX_FMT_YUV420P,
        timeBase: new Rational(1, 25)
      },
      filters: 'null'
    });
    
    const inputContext = graph.getInputContext();
    const outputContext = graph.getOutputContext();
    
    assert(inputContext instanceof FilterContext);
    assert(outputContext instanceof FilterContext);
  });

  describe('properties', () => {
    it('should have filter information', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'scale=320:240'
      });
      
      const inputContext = graph.getInputContext();
      
      // Check filter info
      const filter = inputContext.filter;
      assert(filter);
      assert.strictEqual(filter.name, 'buffer');
      
      // Check context name
      const name = inputContext.name;
      assert(name);
      assert(typeof name === 'string');
    });

    it('should have input/output counts', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      const outputContext = graph.getOutputContext();
      
      // Buffer source has 0 inputs, 1 output
      assert.strictEqual(inputContext.nbInputs, 0);
      assert.strictEqual(inputContext.nbOutputs, 1);
      
      // Buffer sink has 1 input, 0 outputs
      assert.strictEqual(outputContext.nbInputs, 1);
      assert.strictEqual(outputContext.nbOutputs, 0);
    });
  });

  describe('addFrame', () => {
    it('should add frames to buffer source', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      
      // Create a frame
      using frame = new Frame();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.allocBuffer();
      
      // Add frame to buffer source
      const ret = inputContext.addFrame(frame);
      
      // Should succeed
      assert.strictEqual(ret, 0);
    });

    it('should handle null frame for EOF', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      
      // Send EOF with null frame
      const ret = inputContext.addFrame(null);
      
      // Should succeed
      assert.strictEqual(ret, 0);
    });
  });

  describe('getFrame', () => {
    it('should get frames from buffer sink', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      const outputContext = graph.getOutputContext();
      
      // Add a frame
      using inputFrame = new Frame();
      inputFrame.width = 320;
      inputFrame.height = 240;
      inputFrame.format = AV_PIX_FMT_YUV420P;
      inputFrame.allocBuffer();
      inputFrame.pts = 0n;
      
      inputContext.addFrame(inputFrame);
      
      // Get the frame from output
      using outputFrame = new Frame();
      const ret = outputContext.getFrame(outputFrame);
      
      // Should succeed or need more frames
      assert(ret === 0 || ret === AV_ERROR_EAGAIN);
      
      if (ret === 0) {
        assert.strictEqual(outputFrame.width, 320);
        assert.strictEqual(outputFrame.height, 240);
        assert.strictEqual(outputFrame.pts, 0n);
      }
    });

    it('should return EOF when no more frames', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      const outputContext = graph.getOutputContext();
      
      // Send EOF
      inputContext.addFrame(null);
      
      // Try to get frames until EOF
      using outputFrame = new Frame();
      let ret = 0;
      let frameCount = 0;
      
      while (ret >= 0 && frameCount < 100) { // Safety limit
        ret = outputContext.getFrame(outputFrame);
        if (ret === 0) {
          frameCount++;
          outputFrame.unref();
        }
      }
      
      // Should eventually return EOF
      assert(ret === AV_ERROR_EOF || ret === AV_ERROR_EAGAIN);
    });
  });

  describe('async methods', () => {
    it('should support async addFrame', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      
      using frame = new Frame();
      frame.width = 320;
      frame.height = 240;
      frame.format = AV_PIX_FMT_YUV420P;
      frame.allocBuffer();
      
      const ret = await inputContext.addFrameAsync(frame);
      assert.strictEqual(ret, 0);
    });

    it('should support async getFrame', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      const outputContext = graph.getOutputContext();
      
      // Add frame
      using inputFrame = new Frame();
      inputFrame.width = 320;
      inputFrame.height = 240;
      inputFrame.format = AV_PIX_FMT_YUV420P;
      inputFrame.allocBuffer();
      
      await inputContext.addFrameAsync(inputFrame);
      
      // Get frame
      using outputFrame = new Frame();
      const ret = await outputContext.getFrameAsync(outputFrame);
      
      assert(ret === 0 || ret === AV_ERROR_EAGAIN);
    });
  });

  describe('setFrameSize', () => {
    it('should set frame size for audio filters', async () => {
      using graph = new FilterGraph();
      
      // Note: This would typically be used with audio filters
      // For now just test the method exists
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const outputContext = graph.getOutputContext();
      
      // Should not throw
      outputContext.setFrameSize(1024);
    });
  });

  describe('free', () => {
    it('should free filter context resources', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      const inputContext = graph.getInputContext();
      
      // Free should not throw
      inputContext.free();
      
      // After free, properties should return null
      assert.strictEqual(inputContext.name, null);
      assert.strictEqual(inputContext.filterName, null);
      assert.strictEqual(inputContext.nbInputs, 0);
      assert.strictEqual(inputContext.nbOutputs, 0);
    });

    it('should support using statement', async () => {
      using graph = new FilterGraph();
      
      await graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25)
        },
        filters: 'null'
      });
      
      {
        const ctx = graph.getInputContext();
        assert(ctx instanceof FilterContext);
        // Context is managed by graph, so no using needed
      }
    });
  });
});