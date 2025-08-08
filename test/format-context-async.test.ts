import assert from 'node:assert';
import { test } from 'node:test';
import { AV_ERROR_EOF, FormatContext, Packet } from '../src/lib/index.js';

test('FormatContext async operations', async (t) => {
  await t.test('should open input file asynchronously', async () => {
    const formatContext = new FormatContext();

    // Open test file asynchronously
    await formatContext.openInputAsync('testdata/video.mp4');

    // Verify it opened successfully
    assert.ok(formatContext.url);
    assert.ok(formatContext.nbStreams > 0);

    // Clean up
    formatContext.closeInput();
  });

  await t.test('should find stream info asynchronously', async () => {
    const formatContext = new FormatContext();

    await formatContext.openInputAsync('testdata/video.mp4');
    await formatContext.findStreamInfoAsync();

    // Check that streams have codec parameters
    assert.ok(formatContext.streams.length > 0);
    const stream = formatContext.streams[0];
    assert.ok(stream.codecParameters);

    formatContext.closeInput();
  });

  await t.test('should read frames asynchronously', async () => {
    const formatContext = new FormatContext();
    const packet = new Packet();

    await formatContext.openInputAsync('testdata/video.mp4');
    await formatContext.findStreamInfoAsync();

    // Read a few frames
    let frameCount = 0;
    const maxFrames = 10;

    while (frameCount < maxFrames) {
      const ret = await formatContext.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        break;
      }

      assert.ok(ret >= 0, `Read frame failed with error: ${ret}`);
      frameCount++;
      packet.unref();
    }

    assert.ok(frameCount > 0, 'Should have read at least one frame');

    formatContext.closeInput();
  });

  await t.test('should handle errors properly in async operations', async () => {
    const formatContext = new FormatContext();

    // Try to open a non-existent file
    await assert.rejects(
      async () => {
        await formatContext.openInputAsync('nonexistent.mp4');
      },
      (err: any) => {
        assert.ok(err.message.includes('No such file') || err.message.includes('Failed'));
        return true;
      },
    );
  });

  await t.test('async and sync methods should produce same results', async () => {
    const formatContextSync = new FormatContext();
    const formatContextAsync = new FormatContext();

    // Open synchronously
    formatContextSync.openInput('testdata/video.mp4');
    formatContextSync.findStreamInfo();

    // Open asynchronously
    await formatContextAsync.openInputAsync('testdata/video.mp4');
    await formatContextAsync.findStreamInfoAsync();

    // Compare results
    assert.strictEqual(formatContextSync.nbStreams, formatContextAsync.nbStreams);
    assert.strictEqual(formatContextSync.duration, formatContextAsync.duration);
    assert.strictEqual(formatContextSync.streams.length, formatContextAsync.streams.length);

    formatContextSync.closeInput();
    formatContextAsync.closeInput();
  });
});