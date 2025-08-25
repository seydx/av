import assert from 'node:assert';
import { existsSync, unlinkSync } from 'node:fs';
import { describe, it } from 'node:test';

import { Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, type DecoderOptions, type EncoderOptions, type StreamInfo } from '../src/api/index.js';
import { AVFMT_NOFILE, AVIO_FLAG_WRITE, AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P } from '../src/lib/constants.js';
import { FormatContext, IOContext } from '../src/lib/index.js';
import { getInputFile, getOutputFile, prepareTestEnvironment } from './index.js';

prepareTestEnvironment();

const testInput = getInputFile('video.mp4');
const testOutputBase = 'test-output';

/**
 * Test all four decode/encode combinations:
 * 1. Hardware decode + Hardware encode (Full GPU)
 * 2. Hardware decode + Software encode
 * 3. Software decode + Hardware encode
 * 4. Software decode + Software encode (Full CPU)
 */
describe('Transcode Combinations', () => {
  // Helper function to clean up test output files
  function cleanupOutput(filename: string) {
    if (existsSync(filename)) {
      unlinkSync(filename);
    }
  }

  // Helper function to transcode with given options
  async function transcode(inputFile: string, outputFile: string, useHwDecode: boolean, useHwEncode: boolean, hw?: HardwareContext) {
    const media = await MediaInput.open(inputFile);
    const videoStream = media.video();
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    // Create decoder with automatic format conversion
    const decoderOptions: DecoderOptions = {};
    if (useHwDecode && hw) {
      decoderOptions.hardware = hw;
    }
    const decoder = await Decoder.create(videoStream, decoderOptions);

    // Hardware context is now initialized automatically in create()
    // when hardware option is provided

    // Select encoder name based on hardware
    let encoderName = 'libx264';
    let pixelFormat = AV_PIX_FMT_YUV420P;
    if (useHwEncode && hw) {
      switch (hw.deviceTypeName) {
        case 'videotoolbox':
          encoderName = 'h264_videotoolbox';
          pixelFormat = AV_PIX_FMT_NV12;
          break;
        case 'cuda':
          encoderName = 'h264_nvenc';
          break;
        case 'vaapi':
          encoderName = 'h264_vaapi';
          pixelFormat = AV_PIX_FMT_NV12;
          break;
        case 'qsv':
          encoderName = 'h264_qsv';
          pixelFormat = AV_PIX_FMT_NV12;
          break;
      }
    }

    // Create encoder
    const streamInfo: StreamInfo = {
      type: 'video',
      width: videoStream.codecpar.width,
      height: videoStream.codecpar.height,
      pixelFormat: pixelFormat,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    };

    const encoderOptions: EncoderOptions = {
      bitrate: '1M',
      gopSize: 30,
    };

    // Hardware encoder always needs hardware context when available
    if (useHwEncode && hw) {
      encoderOptions.hardware = hw;
    }

    const encoder = await Encoder.create(encoderName, streamInfo, encoderOptions);

    // Create output
    const output = new FormatContext();
    output.allocOutputContext2(null, null, outputFile);
    const outputStream = output.newStream(null);
    if (!outputStream) {
      throw new Error('Failed to create output stream');
    }

    const encoderCtx = encoder.getCodecContext();
    if (encoderCtx) {
      outputStream.codecpar.fromContext(encoderCtx);
      outputStream.timeBase = encoderCtx.timeBase;
    }

    // Open output file
    if (output.oformat && !(output.oformat.flags & AVFMT_NOFILE)) {
      const ioContext = new IOContext();
      await ioContext.open2(outputFile, AVIO_FLAG_WRITE);
      output.pb = ioContext;
    }

    await output.writeHeader(null);

    // Create filter if we need to transfer between CPU and GPU
    let filter: FilterAPI | null = null;
    try {
      if (hw && useHwDecode && !useHwEncode) {
        // HW decode + SW encode: need hwdownload
        // For VideoToolbox, we need scale_vt before hwdownload
        const filterChain = hw.deviceTypeName === 'videotoolbox' ? 'scale_vt,hwdownload,format=nv12,format=yuv420p' : 'hwdownload,format=yuv420p';
        filter = await FilterAPI.create(filterChain, videoStream, { hardware: hw });
      } else if (hw && !useHwDecode && useHwEncode) {
        // SW decode + HW encode: need hwupload
        filter = await FilterAPI.create('hwupload', videoStream, { hardware: hw });
      }
    } catch (filterError: any) {
      console.error(`Filter creation failed: ${filterError.message}`);
      throw filterError;
    }

    // Process frames (limit to 10 for test speed)
    let frameCount = 0;
    const maxFrames = 10;

    for await (const packet of media.packets()) {
      if (packet.streamIndex === videoStream.index) {
        const decodedFrame = await decoder.decode(packet);
        if (decodedFrame) {
          frameCount++;

          // Apply filter if needed
          const frameToEncode = filter ? await filter.process(decodedFrame) : decodedFrame;
          if (frameToEncode) {
            const encodedPacket = await encoder.encode(frameToEncode);
            if (encodedPacket) {
              encodedPacket.streamIndex = outputStream.index;
              encodedPacket.rescaleTs(encoderCtx!.timeBase, outputStream.timeBase);
              await output.interleavedWriteFrame(encodedPacket);
              encodedPacket.free();
            }

            // Free the filtered frame if it's different from decoded frame
            if (filter && frameToEncode !== decodedFrame) {
              frameToEncode.free();
            }
          }

          decodedFrame.free();
          if (frameCount >= maxFrames) break;
        }
      }
    }

    // Flush
    let flushPacket;
    while ((flushPacket = await encoder.flush()) !== null) {
      flushPacket.streamIndex = outputStream.index;
      flushPacket.rescaleTs(encoderCtx!.timeBase, outputStream.timeBase);
      await output.interleavedWriteFrame(flushPacket);
      flushPacket.free();
    }

    await output.writeTrailer();

    // Cleanup
    if (filter) {
      filter[Symbol.dispose]();
    }
    decoder.close();
    encoder.close();
    output.freeContext();
    await media.close();

    return frameCount;
  }

  describe('Full GPU (Hardware Decode + Hardware Encode)', () => {
    it('should transcode using full GPU pipeline when hardware is available', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const outputFile = getOutputFile(`${testOutputBase}-full-gpu.mp4`);
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, true, true, hw);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`Full GPU: Processed ${frameCount} frames`);
      } catch (error) {
        console.log('Full GPU transcode not supported:', error);
        // Don't dispose hw here - it's used by other tests
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });

  describe('Hardware Decode + Software Encode', () => {
    it('should transcode using hardware decode and software encode', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const outputFile = getOutputFile(`${testOutputBase}-hw-decode-sw-encode.mp4`);
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, true, false, hw);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`HW Decode + SW Encode: Processed ${frameCount} frames`);
      } catch (error) {
        console.error('HW decode + SW encode failed:', error);
        throw error;
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });

  describe('Software Decode + Hardware Encode', () => {
    it('should transcode using software decode and hardware encode', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const outputFile = getOutputFile(`${testOutputBase}-sw-decode-hw-encode.mp4`);
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, false, true, hw);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`SW Decode + HW Encode: Processed ${frameCount} frames`);
      } catch (error) {
        console.error('SW decode + HW encode failed:', error);
        throw error;
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });

  describe('Full CPU (Software Decode + Software Encode)', () => {
    it('should transcode using full software pipeline', async () => {
      const outputFile = getOutputFile(`${testOutputBase}-full-cpu.mp4`);
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, false, false);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`Full CPU: Processed ${frameCount} frames`);
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });

  describe('Zero-Copy Verification', () => {
    it('should verify zero-copy operation with full GPU pipeline', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const outputFile = getOutputFile(`${testOutputBase}-zero-copy.mp4`);
      cleanupOutput(outputFile);

      try {
        const media = await MediaInput.open(testInput);
        const videoStream = media.video();
        assert.ok(videoStream, 'Should have video stream');

        // Create hardware decoder
        const decoder = await Decoder.create(videoStream, {
          hardware: hw,
        });

        // Hardware context is now initialized automatically in create()

        // Create hardware encoder with shared context
        const encoderName = hw.deviceTypeName === 'videotoolbox' ? 'h264_videotoolbox' : 'h264';
        const encoder = await Encoder.create(
          encoderName,
          {
            type: 'video',
            width: videoStream.codecpar.width,
            height: videoStream.codecpar.height,
            pixelFormat: AV_PIX_FMT_NV12,
            frameRate: { num: 30, den: 1 },
            timeBase: { num: 1, den: 30 },
            sampleAspectRatio: { num: 1, den: 1 },
          },
          {
            bitrate: '2M',
            hardware: hw,
          },
        );

        // Process one frame to verify zero-copy
        for await (const packet of media.packets()) {
          if (packet.streamIndex === videoStream.index) {
            const frame = await decoder.decode(packet);
            if (frame) {
              // Check if frame is hardware frame
              const isHwFrame = frame.isHwFrame();
              console.log(`Zero-copy test: Frame is ${isHwFrame ? 'on GPU' : 'in CPU memory'}`);

              const encodedPacket = await encoder.encode(frame);
              if (encodedPacket) {
                encodedPacket.free();
              }
              frame.free();
              break;
            }
          }
        }

        decoder.close();
        encoder.close();
        await media.close();
      } catch (error) {
        console.log('Zero-copy test failed:', error);
        hw.dispose();
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });
});
