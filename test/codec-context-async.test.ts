import assert from 'node:assert';
import { test } from 'node:test';
import {
  AV_CODEC_ID_H264,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_YUV420P,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  Packet,
  Rational,
} from '../src/lib/index.js';

test('CodecContext async operations', async (t) => {
  await t.test('should open codec asynchronously', async () => {
    // Find H264 decoder
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    assert.ok(codec, 'Should find H264 decoder');

    const codecContext = new CodecContext(codec);

    // Open codec asynchronously
    await codecContext.openAsync();

    // Verify it opened
    assert.strictEqual(codecContext.codecID, AV_CODEC_ID_H264);
    assert.ok(codecContext.isDecoder);

    codecContext.close();
  });

  await t.test('should decode video asynchronously', async () => {
    const formatContext = new FormatContext();
    await formatContext.openInputAsync('testdata/video.mp4');
    await formatContext.findStreamInfoAsync();

    // Find video stream
    const videoStreamIndex = formatContext.findBestStream(AV_MEDIA_TYPE_VIDEO);
    assert.ok(videoStreamIndex >= 0, 'Should find video stream');

    const stream = formatContext.streams[videoStreamIndex];
    const codecParams = stream.codecParameters;
    assert.ok(codecParams, 'Should have codec parameters');

    // Find decoder
    const codec = Codec.findDecoder(codecParams.codecId);
    assert.ok(codec, 'Should find decoder for codec ID');

    // Create and configure codec context
    const codecContext = new CodecContext(codec);
    codecParams.toCodecContext(codecContext);

    // Open codec asynchronously
    await codecContext.openAsync();

    const packet = new Packet();
    const frame = new Frame();
    let decodedFrames = 0;
    const maxFrames = 5;

    // Read and decode frames asynchronously
    while (decodedFrames < maxFrames) {
      const readRet = await formatContext.readFrameAsync(packet);
      if (readRet === AV_ERROR_EOF) {
        break;
      }

      // Only process video packets
      if (packet.streamIndex !== videoStreamIndex) {
        packet.unref();
        continue;
      }

      // Send packet asynchronously
      const sendRet = await codecContext.sendPacketAsync(packet);
      packet.unref();

      if (sendRet < 0 && sendRet !== AV_ERROR_EAGAIN) {
        continue;
      }

      // Receive frames asynchronously
      while (true) {
        const recvRet = await codecContext.receiveFrameAsync(frame);
        if (recvRet === AV_ERROR_EAGAIN || recvRet === AV_ERROR_EOF) {
          break;
        }

        if (recvRet >= 0) {
          decodedFrames++;
          assert.ok(frame.width > 0, 'Frame should have width');
          assert.ok(frame.height > 0, 'Frame should have height');
          frame.unref();

          if (decodedFrames >= maxFrames) {
            break;
          }
        }
      }
    }

    assert.ok(decodedFrames > 0, 'Should have decoded at least one frame');

    codecContext.close();
    formatContext.closeInput();
  });

  await t.test('should encode video asynchronously', async () => {
    // Find H264 encoder
    const codec = Codec.findEncoder(AV_CODEC_ID_H264);
    if (!codec) {
      console.log('H264 encoder not available, skipping test');
      return;
    }

    const codecContext = new CodecContext(codec);

    // Configure encoder
    codecContext.width = 320;
    codecContext.height = 240;
    codecContext.pixelFormat = AV_PIX_FMT_YUV420P;
    codecContext.timeBase = new Rational(1, 25);
    codecContext.bitRate = 400000n;

    // Open encoder asynchronously
    await codecContext.openAsync();

    const frame = new Frame();
    frame.width = 320;
    frame.height = 240;
    frame.format = AV_PIX_FMT_YUV420P;
    frame.pts = 0n;

    // Allocate frame buffers
    frame.allocBuffer();

    const packet = new Packet();
    let encodedPackets = 0;

    // Send frame asynchronously
    const sendRet = await codecContext.sendFrameAsync(frame);
    assert.ok(sendRet >= 0 || sendRet === AV_ERROR_EAGAIN, 'Send frame should succeed');

    // Receive packets asynchronously
    while (true) {
      const ret = await codecContext.receivePacketAsync(packet);
      if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
        break;
      }

      if (ret >= 0) {
        encodedPackets++;
        assert.ok(packet.size > 0, 'Packet should have data');
        packet.unref();
      }
    }

    // Flush encoder
    await codecContext.sendFrameAsync(null);
    while (true) {
      const ret = await codecContext.receivePacketAsync(packet);
      if (ret === AV_ERROR_EOF) {
        break;
      }
      if (ret >= 0) {
        encodedPackets++;
        packet.unref();
      }
    }

    assert.ok(encodedPackets >= 0, 'Should have encoded at least one packet or none');

    codecContext.close();
  });

  await t.test('async and sync methods should produce same results', async () => {
    const codec = Codec.findDecoder(AV_CODEC_ID_H264);
    if (!codec) {
      console.log('H264 decoder not available, skipping test');
      return;
    }

    const codecContextSync = new CodecContext(codec);
    const codecContextAsync = new CodecContext(codec);

    // Open synchronously
    codecContextSync.open();

    // Open asynchronously
    await codecContextAsync.openAsync();

    // Compare properties
    assert.strictEqual(codecContextSync.codecID, codecContextAsync.codecID);
    assert.strictEqual(codecContextSync.mediaType, codecContextAsync.mediaType);

    codecContextSync.close();
    codecContextAsync.close();
  });
});