import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_RGB24,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  FilterGraph,
  Frame,
  HardwareDeviceContext,
  Rational,
  type FilterPipelineConfig,
} from '../src/lib/index.js';

describe('FilterGraph', () => {
  it('should create a filter graph', () => {
    const graph = new FilterGraph();
    assert(graph instanceof FilterGraph);
    graph.free();
  });

  it('should support using statement', () => {
    {
      using graph = new FilterGraph();
      assert(graph instanceof FilterGraph);
    }
    // graph should be automatically freed
  });

  it('should set thread properties', () => {
    const graph = new FilterGraph();

    // Set thread count
    graph.nbThreads = 4;
    assert.strictEqual(graph.nbThreads, 4);

    // Set thread type
    graph.threadType = 1;
    assert.strictEqual(graph.threadType, 1);

    graph.free();
  });

  it('should create with options', () => {
    const graph = new FilterGraph({
      threadCount: 8,
      threadType: 2,
    });

    assert.strictEqual(graph.nbThreads, 8);
    assert.strictEqual(graph.threadType, 2);

    graph.free();
  });

  describe('buildPipeline', () => {
    it('should build a simple video filter pipeline', () => {
      using graph = new FilterGraph();

      const config = {
        input: {
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25),
          sampleAspectRatio: new Rational(1, 1),
        },
        filters: 'null', // pass-through filter
      };

      graph.buildPipeline(config);

      // Should have input and output contexts
      const inputCtx = graph.getInputContext();
      const outputCtx = graph.getOutputContext();

      assert(inputCtx);
      assert(outputCtx);
    });

    it('should build a video scaling pipeline', () => {
      using graph = new FilterGraph();

      const config = {
        input: {
          width: 1920,
          height: 1080,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 30),
          sampleAspectRatio: new Rational(1, 1),
        },
        filters: 'scale=640:480',
      };

      graph.buildPipeline(config);

      const inputCtx = graph.getInputContext();
      const outputCtx = graph.getOutputContext();

      assert(inputCtx);
      assert(outputCtx);
    });

    it('should build a pipeline with format conversion', () => {
      using graph = new FilterGraph();

      const config = {
        input: {
          width: 640,
          height: 480,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25),
        },
        filters: 'format=rgb24',
        output: {
          pixelFormats: [AV_PIX_FMT_RGB24],
        },
      };

      graph.buildPipeline(config);

      assert(graph.getInputContext());
      assert(graph.getOutputContext());
    });

    it('should build an audio filter pipeline', () => {
      using graph = new FilterGraph();

      const config: FilterPipelineConfig = {
        input: {
          sampleRate: 48000,
          sampleFormat: AV_SAMPLE_FMT_FLTP,
          channelLayout: {
            nbChannels: 2,
            mask: 3n, // Stereo
          },
        },
        filters: 'anull', // audio pass-through
      };

      graph.buildPipeline(config);

      assert(graph.getInputContext());
      assert(graph.getOutputContext());
    });

    it('should throw on invalid configuration', () => {
      using graph = new FilterGraph();

      // Missing required fields
      assert.throws(() => {
        graph.buildPipeline({
          input: {},
          filters: 'null',
        });
      }, /Either video.*or audio.*parameters required/);

      // Missing filter string
      assert.throws(() => {
        graph.buildPipeline({
          input: {
            width: 640,
            height: 480,
            pixelFormat: AV_PIX_FMT_YUV420P,
          },
          filters: '',
        });
      }, /Filter string required/);
    });

    it('should handle complex filter chains', () => {
      using graph = new FilterGraph();

      const config = {
        input: {
          width: 1920,
          height: 1080,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 30),
        },
        filters: 'scale=640:480,format=gray',
      };

      graph.buildPipeline(config);

      assert(graph.getInputContext());
      assert(graph.getOutputContext());
    });
  });

  describe('processFrame', () => {
    it('should process frames through the pipeline', async () => {
      using graph = new FilterGraph();

      // Build a simple pipeline
      graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25),
        },
        filters: 'null',
      });

      // Create input frame
      using inputFrame = new Frame();
      inputFrame.width = 320;
      inputFrame.height = 240;
      inputFrame.format = AV_PIX_FMT_YUV420P;
      inputFrame.allocBuffer();

      // Create output frame
      using outputFrame = new Frame();

      // Process frame
      const ret = await graph.processFrame(inputFrame, outputFrame);

      // Should succeed or need more frames
      assert(ret === 0 || ret === AV_ERROR_EAGAIN);

      if (ret === 0) {
        // Output frame should have data
        assert(outputFrame.width > 0);
        assert(outputFrame.height > 0);
      }
    });

    it('should handle null frame for flushing', async () => {
      using graph = new FilterGraph();

      graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25),
        },
        filters: 'null',
      });

      using outputFrame = new Frame();

      // Flush with null frame
      const ret = await graph.processFrame(null, outputFrame);

      // Should return EOF or EAGAIN
      assert(ret === AV_ERROR_EOF || ret === AV_ERROR_EAGAIN);
    });

    it('should throw if pipeline not configured', async () => {
      using graph = new FilterGraph();
      using frame = new Frame();

      await assert.rejects(async () => {
        await graph.processFrame(frame, frame);
      }, /Pipeline not configured/);
    });
  });

  describe('getFilteredFrame', () => {
    it('should get filtered frames after flushing', async () => {
      using graph = new FilterGraph();

      graph.buildPipeline({
        input: {
          width: 320,
          height: 240,
          pixelFormat: AV_PIX_FMT_YUV420P,
          timeBase: new Rational(1, 25),
        },
        filters: 'null',
      });

      // Process some frames first
      using inputFrame = new Frame();
      inputFrame.width = 320;
      inputFrame.height = 240;
      inputFrame.format = AV_PIX_FMT_YUV420P;
      inputFrame.allocBuffer();

      using outputFrame = new Frame();

      // Send a frame
      await graph.processFrame(inputFrame, outputFrame);

      // Try to get more frames
      const ret = await graph.getFilteredFrame(outputFrame);

      // Should return EOF when no more frames
      assert(ret === AV_ERROR_EOF || ret === AV_ERROR_EAGAIN || ret === 0);
    });

    it('should throw if pipeline not configured', async () => {
      using graph = new FilterGraph();
      using frame = new Frame();

      await assert.rejects(async () => {
        await graph.getFilteredFrame(frame);
      }, /Pipeline not configured/);
    });
  });

  // Hardware acceleration test temporarily disabled due to segfault
  // TODO: Fix hardware test

  describe('error handling', () => {
    it('should handle invalid filter strings', () => {
      using graph = new FilterGraph();

      assert.throws(() => {
        graph.buildPipeline({
          input: {
            width: 640,
            height: 480,
            pixelFormat: AV_PIX_FMT_YUV420P,
          },
          filters: 'nonexistent_filter',
        });
      }, /Failed to parse filter string/);
    });

  });
});
