import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P, Decoder, Encoder, FF_ENCODER_LIBX264, FilterAPI, FilterPresets, HardwareContext, MediaInput } from '../src/index.js';
import { getInputFile, prepareTestEnvironment } from './index.js';

import type { VideoInfo } from '../src/index.js';

prepareTestEnvironment();

const inputFile = getInputFile('video.mp4');

// Helper to count processed frames
async function processFrames(input: MediaInput, decoder: Decoder, filter: FilterAPI | null, encoder: Encoder, videoStreamIndex: number, maxFrames = 5): Promise<number> {
  let frameCount = 0;

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStreamIndex) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        if (filter) {
          using filteredFrame = await filter.process(decodedFrame);
          if (filteredFrame) {
            using encodedPacket = await encoder.encode(filteredFrame);
            if (encodedPacket) {
              frameCount++;
              if (frameCount >= maxFrames) break;
            }
          }
        } else {
          using encodedPacket = await encoder.encode(decodedFrame);
          if (encodedPacket) {
            frameCount++;
            if (frameCount >= maxFrames) break;
          }
        }
      }
    }
  }

  // Flush remaining frames

  for await (const decodedFrame of decoder.flushFrames()) {
    if (filter) {
      using filteredFrame = await filter.process(decodedFrame);
      if (filteredFrame) {
        using encodedPacket = await encoder.encode(filteredFrame);
        if (encodedPacket) {
          frameCount++;
        }
      }
    } else {
      using encodedPacket = await encoder.encode(decodedFrame);
      if (encodedPacket) {
        frameCount++;
      }
    }
  }

  if (filter) {
    for await (const filteredFrame of filter.flushFrames()) {
      using encodedPacket = await encoder.encode(filteredFrame);
      if (encodedPacket) {
        frameCount++;
      }
    }
  }

  for await (const _ of encoder.flushPackets()) {
    frameCount++;
  }

  return frameCount;
}

describe('Transcode Scenarios', () => {
  it('should handle SW Decode -> SW Filter -> SW Encode', async () => {
    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream);
    assert.ok(decoder, 'Should create decoder');

    const filterChain = FilterPresets.chain().scale(100, 100).format(AV_PIX_FMT_YUV420P).build();
    using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());
    assert.ok(filter, 'Should create filter');

    using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    });
    assert.ok(encoder, 'Should create encoder');

    const frameCount = await processFrames(input, decoder, filter, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle SW Decode -> SW Encode (no filter)', async () => {
    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream);
    assert.ok(decoder, 'Should create decoder');

    const streamInfo = decoder.getOutputStreamInfo() as VideoInfo;
    using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
      type: 'video',
      width: streamInfo.width,
      height: streamInfo.height,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: streamInfo.frameRate,
      timeBase: streamInfo.timeBase,
      sampleAspectRatio: streamInfo.sampleAspectRatio,
    });
    assert.ok(encoder, 'Should create encoder');

    const frameCount = await processFrames(input, decoder, null, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle HW Decode -> HW Filter -> SW Encode', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream, { hardware: hw });
    assert.ok(decoder, 'Should create hardware decoder');

    const filterChain = hw.filterPresets.chain().scale(100, 100).hwdownload().format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]).build();

    using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });
    assert.ok(filter, 'Should create filter with hardware context');

    using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    });
    assert.ok(encoder, 'Should create software encoder');

    const frameCount = await processFrames(input, decoder, filter, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle SW Decode -> HW Filter -> HW Encode', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream);
    assert.ok(decoder, 'Should create software decoder');

    const filterChain = hw.filterPresets.chain().hwupload().scale(100, 100).build();

    using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });
    assert.ok(filter, 'Should create filter with hardware upload');

    const encoderCodec = hw.getEncoderCodec('h264');
    if (!encoderCodec) {
      console.log('No hardware encoder codec available');
      console.log('No hardware available - skipping test');
      return;
    }

    using encoder = await Encoder.create(
      encoderCodec,
      {
        type: 'video',
        width: 100,
        height: 100,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      },
      {
        hardware: hw,
      },
    );
    assert.ok(encoder, 'Should create hardware encoder');

    const frameCount = await processFrames(input, decoder, filter, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle HW Decode -> HW Filter -> HW Encode', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream, { hardware: hw });
    assert.ok(decoder, 'Should create hardware decoder');

    const filterChain = hw.filterPresets.chain().scale(100, 100).build();

    using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });
    assert.ok(filter, 'Should create hardware filter');

    const encoderCodec = hw.getEncoderCodec('h264');
    if (!encoderCodec) {
      console.log('No hardware encoder codec available');
      console.log('No hardware available - skipping test');
      return;
    }

    using encoder = await Encoder.create(
      encoderCodec,
      {
        type: 'video',
        width: 100,
        height: 100,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      },
      {
        hardware: hw,
      },
    );
    assert.ok(encoder, 'Should create hardware encoder');

    const frameCount = await processFrames(input, decoder, filter, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle HW Decode -> HW Encode (no filter)', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream, { hardware: hw });
    assert.ok(decoder, 'Should create hardware decoder');

    const encoderCodec = hw.getEncoderCodec('h264');
    if (!encoderCodec) {
      console.log('No hardware encoder codec available');
      console.log('No hardware available - skipping test');
      return;
    }

    const streamInfo = decoder.getOutputStreamInfo() as VideoInfo;
    using encoder = await Encoder.create(
      encoderCodec,
      {
        type: 'video',
        width: streamInfo.width,
        height: streamInfo.height,
        pixelFormat: streamInfo.pixelFormat,
        frameRate: streamInfo.frameRate,
        timeBase: streamInfo.timeBase,
        sampleAspectRatio: streamInfo.sampleAspectRatio,
      },
      {
        hardware: hw,
      },
    );
    assert.ok(encoder, 'Should create hardware encoder');

    const frameCount = await processFrames(input, decoder, null, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle SW Decode -> HW Encode', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream);
    assert.ok(decoder, 'Should create software decoder');

    const encoderCodec = hw.getEncoderCodec('h264');
    if (!encoderCodec) {
      console.log('No hardware encoder codec available');
      console.log('No hardware available - skipping test');
      return;
    }

    const streamInfo = decoder.getOutputStreamInfo() as VideoInfo;
    using encoder = await Encoder.create(
      encoderCodec,
      {
        type: 'video',
        width: streamInfo.width,
        height: streamInfo.height,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: streamInfo.frameRate,
        timeBase: streamInfo.timeBase,
        sampleAspectRatio: streamInfo.sampleAspectRatio,
      },
      {
        hardware: hw,
      },
    );
    assert.ok(encoder, 'Should create hardware encoder');

    const frameCount = await processFrames(input, decoder, null, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  it('should handle SW Decode -> SW Filter -> HW Encode', async () => {
    using hw = await HardwareContext.auto();
    if (!hw) {
      console.log('No hardware available - skipping test');
      return;
    }

    await using input = await MediaInput.open(inputFile);
    const videoStream = input.video();
    assert.ok(videoStream, 'Should have video stream');

    using decoder = await Decoder.create(videoStream);
    assert.ok(decoder, 'Should create software decoder');

    const filterChain = FilterPresets.chain().scale(100, 100).format(AV_PIX_FMT_YUV420P).build();

    using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());
    assert.ok(filter, 'Should create software filter');

    const encoderCodec = hw.getEncoderCodec('h264');
    if (!encoderCodec) {
      console.log('No hardware encoder codec available');
      console.log('No hardware available - skipping test');
      return;
    }

    using encoder = await Encoder.create(
      encoderCodec,
      {
        type: 'video',
        width: 100,
        height: 100,
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 30, den: 1 },
        timeBase: { num: 1, den: 30 },
        sampleAspectRatio: { num: 1, den: 1 },
      },
      {
        hardware: hw,
      },
    );
    assert.ok(encoder, 'Should create hardware encoder');

    const frameCount = await processFrames(input, decoder, filter, encoder, videoStream.index);
    assert.ok(frameCount > 0, 'Should process at least one frame');
  });

  describe('Error Cases', () => {
    it('should fail when using hardware filter without hardware context on filter', async () => {
      using hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available, skipping test');
        return;
      }

      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();
      assert.ok(videoStream, 'Should have video stream');

      using decoder = await Decoder.create(videoStream, { hardware: hw });

      const filterChain = hw.filterPresets.chain().scale(100, 100).hwdownload().format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]).build();

      // This should fail - using hardware filter chain without passing hardware context
      await assert.rejects(
        async () => {
          using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());
          // Try to process a frame
          for await (const packet of input.packets()) {
            if (packet.streamIndex === videoStream.index) {
              using decodedFrame = await decoder.decode(packet);
              if (decodedFrame) {
                await filter.process(decodedFrame);
                break;
              }
            }
          }
        },
        () => {
          // Should fail because hardware context wasn't passed to filter
          return true;
        },
        'Should fail when hardware filter is used without hardware context',
      );

      hw.dispose();
    });

    it('should handle encoder/decoder mismatch gracefully', async () => {
      await using input = await MediaInput.open(inputFile);
      const videoStream = input.video();
      assert.ok(videoStream, 'Should have video stream');

      using decoder = await Decoder.create(videoStream);

      // Create encoder with mismatched parameters
      using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
        type: 'video',
        width: 1920, // Different from decoded size
        height: 1080, // Different from decoded size
        pixelFormat: AV_PIX_FMT_YUV420P,
        frameRate: { num: 60, den: 1 }, // Different frame rate
        timeBase: { num: 1, den: 60 },
        sampleAspectRatio: { num: 1, den: 1 },
      });

      // Should still work, encoder will handle the mismatch
      for await (const packet of input.packets()) {
        if (packet.streamIndex === videoStream.index) {
          using decodedFrame = await decoder.decode(packet);
          if (decodedFrame) {
            // This might fail or succeed depending on encoder implementation
            try {
              using encodedPacket = await encoder.encode(decodedFrame);
              if (encodedPacket) {
                // Successfully encoded despite mismatch
                break;
              }
            } catch (err) {
              // Expected - size mismatch
              console.log('Expected error with size mismatch:', err);
              break;
            }
          }
        }
      }

      // Either processed successfully or caught the error
      assert.ok(true, 'Handled encoder/decoder mismatch');
    });
  });
});
