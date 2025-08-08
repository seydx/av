import assert from 'node:assert';
import { test } from 'node:test';
import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_YUV420P,
  Codec,
  CodecContext,
  Filter,
  FilterGraph,
  FormatContext,
  Frame,
  Packet,
} from '../src/lib/index.js';

test('FilterGraph async operations', async (t) => {
  await t.test('should configure filter graph asynchronously', async () => {
    const graph = new FilterGraph();

    // Create a simple filter chain
    const bufferFilter = Filter.findByName('buffer');
    const scaleFilter = Filter.findByName('scale');
    const bufferSinkFilter = Filter.findByName('buffersink');

    assert.ok(bufferFilter, 'Should find buffer filter');
    assert.ok(scaleFilter, 'Should find scale filter');
    assert.ok(bufferSinkFilter, 'Should find buffersink filter');

    // Create filter contexts
    const bufferSrc = graph.createFilter(bufferFilter, 'src', 'video_size=320x240:pix_fmt=0:time_base=1/25:pixel_aspect=1/1');

    const scale = graph.createFilter(scaleFilter, 'scale', '160:120');
    const bufferSink = graph.createFilter(bufferSinkFilter, 'sink');

    // Link filters
    bufferSrc.link(scale, 0, 0);
    scale.link(bufferSink, 0, 0);

    // Configure graph asynchronously
    await graph.configAsync();

    // Verify graph is configured
    assert.strictEqual(graph.nbFilters, 3);
  });

  await t.test('should process frames through filter asynchronously', async () => {
    const graph = new FilterGraph();

    // Create filter chain for YUV420P processing
    const bufferFilter = Filter.findByName('buffer');
    const formatFilter = Filter.findByName('format');
    const bufferSinkFilter = Filter.findByName('buffersink');

    assert.ok(bufferFilter, 'Should find buffer filter');
    assert.ok(formatFilter, 'Should find format filter');
    assert.ok(bufferSinkFilter, 'Should find buffersink filter');

    // Create filter contexts
    const bufferSrc = graph.createFilter(bufferFilter, 'src', 'video_size=320x240:pix_fmt=0:time_base=1/25:pixel_aspect=1/1');

    const format = graph.createFilter(formatFilter, 'format', 'pix_fmts=yuv420p');
    const bufferSink = graph.createFilter(bufferSinkFilter, 'sink');

    // Link filters
    bufferSrc.link(format, 0, 0);
    format.link(bufferSink, 0, 0);

    // Configure graph
    await graph.configAsync();

    // Create a test frame
    const inputFrame = new Frame();
    inputFrame.width = 320;
    inputFrame.height = 240;
    inputFrame.format = AV_PIX_FMT_YUV420P;
    inputFrame.pts = 0n;
    inputFrame.allocBuffer();

    // Send frame asynchronously
    const sendRet = await bufferSrc.bufferSrcAddFrameAsync(inputFrame);
    assert.ok(sendRet >= 0, 'Should send frame successfully');

    // Receive filtered frame asynchronously
    const outputFrame = new Frame();
    const recvRet = await bufferSink.bufferSinkGetFrameAsync(outputFrame);
    assert.ok(recvRet >= 0, 'Should receive frame successfully');

    // Verify output frame
    assert.strictEqual(outputFrame.width, 320);
    assert.strictEqual(outputFrame.height, 240);
    assert.strictEqual(outputFrame.format, AV_PIX_FMT_YUV420P);

    inputFrame.unref();
    outputFrame.unref();
  });

  await t.test('should process video through filter pipeline asynchronously', async () => {
    // Open a video file
    const formatContext = new FormatContext();
    await formatContext.openInputAsync('testdata/video.mp4');
    await formatContext.findStreamInfoAsync();

    // Find video stream
    const videoStreamIndex = formatContext.findBestStream(AV_MEDIA_TYPE_VIDEO);
    assert.ok(videoStreamIndex >= 0, 'Should find video stream');

    const stream = formatContext.streams[videoStreamIndex];
    const codecParams = stream.codecParameters;
    assert.ok(codecParams, 'Should have codec parameters');

    // Create decoder
    const codec = Codec.findDecoder(codecParams.codecId);
    assert.ok(codec, 'Should find decoder');

    const codecContext = new CodecContext(codec);
    codecParams.toCodecContext(codecContext);
    await codecContext.openAsync();

    // Create filter graph for scaling
    const graph = new FilterGraph();

    // Get video parameters
    const width = codecContext.width;
    const height = codecContext.height;
    const pixFmt = codecContext.pixelFormat;
    const timeBase = stream.timeBase; // Use stream timebase instead of codec

    // Create filter chain
    const bufferFilter = Filter.findByName('buffer');
    const scaleFilter = Filter.findByName('scale');
    const bufferSinkFilter = Filter.findByName('buffersink');

    const bufferSrc = graph.createFilter(
      bufferFilter!,
      'src',
      `video_size=${width}x${height}:pix_fmt=${pixFmt}:time_base=${timeBase.num}/${timeBase.den}:pixel_aspect=1/1`,
    );

    const scale = graph.createFilter(scaleFilter!, 'scale', '160:120');
    const bufferSink = graph.createFilter(bufferSinkFilter!, 'sink');

    // Link and configure
    bufferSrc.link(scale, 0, 0);
    scale.link(bufferSink, 0, 0);
    await graph.configAsync();

    // Process some frames
    const packet = new Packet();
    const frame = new Frame();
    const filteredFrame = new Frame();
    let processedFrames = 0;
    const maxFrames = 3;

    while (processedFrames < maxFrames) {
      const readRet = await formatContext.readFrameAsync(packet);
      if (readRet === AV_ERROR_EOF) break;

      if (packet.streamIndex !== videoStreamIndex) {
        packet.unref();
        continue;
      }

      // Decode
      await codecContext.sendPacketAsync(packet);
      packet.unref();

      while (true) {
        const recvRet = await codecContext.receiveFrameAsync(frame);
        if (recvRet === AV_ERROR_EAGAIN || recvRet === AV_ERROR_EOF) break;

        // Filter frame
        await bufferSrc.bufferSrcAddFrameAsync(frame);
        frame.unref();

        // Get filtered frame
        const filterRet = await bufferSink.bufferSinkGetFrameAsync(filteredFrame);
        if (filterRet >= 0) {
          processedFrames++;
          assert.strictEqual(filteredFrame.width, 160);
          assert.strictEqual(filteredFrame.height, 120);
          filteredFrame.unref();
        }

        if (processedFrames >= maxFrames) break;
      }
    }

    assert.ok(processedFrames > 0, 'Should process at least one frame');

    codecContext.close();
    formatContext.closeInput();
  });

  await t.test('async and sync methods should produce same results', async () => {
    const graphSync = new FilterGraph();
    const graphAsync = new FilterGraph();

    // Create identical filter chains
    const bufferFilter = Filter.findByName('buffer');
    const scaleFilter = Filter.findByName('scale');
    const bufferSinkFilter = Filter.findByName('buffersink');

    const args = 'video_size=320x240:pix_fmt=0:time_base=1/25:pixel_aspect=1/1';

    // Sync graph
    const srcSync = graphSync.createFilter(bufferFilter!, 'src', args);
    const scaleSync = graphSync.createFilter(scaleFilter!, 'scale', '160:120');
    const sinkSync = graphSync.createFilter(bufferSinkFilter!, 'sink');
    srcSync.link(scaleSync, 0, 0);
    scaleSync.link(sinkSync, 0, 0);
    graphSync.config();

    // Async graph
    const srcAsync = graphAsync.createFilter(bufferFilter!, 'src', args);
    const scaleAsync = graphAsync.createFilter(scaleFilter!, 'scale', '160:120');
    const sinkAsync = graphAsync.createFilter(bufferSinkFilter!, 'sink');
    srcAsync.link(scaleAsync, 0, 0);
    scaleAsync.link(sinkAsync, 0, 0);
    await graphAsync.configAsync();

    // Compare results
    assert.strictEqual(graphSync.nbFilters, graphAsync.nbFilters);
  });
});
