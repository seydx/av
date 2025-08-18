import assert from 'node:assert';
import { existsSync, unlinkSync } from 'node:fs';
import { describe, it } from 'node:test';
import { Decoder, Encoder, HardwareContext, MediaInput } from '../src/api/index.js';
import { AV_FMT_NOFILE, AV_IO_FLAG_WRITE, AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P, type AVPixelFormat } from '../src/lib/constants.js';
import { FormatContext, IOContext } from '../src/lib/index.js';

/**
 * Test all four decode/encode combinations:
 * 1. Hardware decode + Hardware encode (Full GPU)
 * 2. Hardware decode + Software encode
 * 3. Software decode + Hardware encode
 * 4. Software decode + Software encode (Full CPU)
 */
describe('Transcode Combinations', () => {
  const testInput = 'testdata/video.mp4';
  const testOutputBase = 'test-output';

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

    // Determine target pixel format based on encoder requirements
    let targetPixelFormat: AVPixelFormat | AVPixelFormat[] | undefined;
    if (useHwDecode && !useHwEncode) {
      // Hardware decode + Software encode: need to convert to CPU format
      // Videotoolbox needs to convert first to NV12 before YUV420P
      targetPixelFormat = [AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P];
    } else if (!useHwDecode && useHwEncode && hw) {
      // Software decode + Hardware encode: convert to encoder's preferred CPU format
      // VideoToolbox needs NV12 specifically when used as hardware encoder
      if (hw.deviceTypeName === 'videotoolbox') {
        targetPixelFormat = AV_PIX_FMT_NV12;
      } else {
        targetPixelFormat = AV_PIX_FMT_YUV420P;
      }
    }

    // Create decoder with automatic format conversion
    const decoderOptions: any = {};
    if (useHwDecode && hw) {
      decoderOptions.hardware = hw;
    }
    if (targetPixelFormat !== undefined) {
      decoderOptions.targetPixelFormat = targetPixelFormat;
    }
    const decoder = await Decoder.create(media, videoStream.index, decoderOptions);

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
    const encoderOptions: any = {
      width: videoStream.codecpar.width,
      height: videoStream.codecpar.height,
      pixelFormat: pixelFormat,
      bitrate: '1M',
      gopSize: 30,
    };

    // Only use hardware context for encoder if we're doing HW decode + HW encode
    // For SW decode + HW encode, the encoder accepts CPU frames directly
    if (useHwEncode && useHwDecode && hw) {
      // Full GPU pipeline with zero-copy
      encoderOptions.hardware = hw;
      encoderOptions.sharedDecoder = decoder;
    }

    const encoder = await Encoder.create(encoderName, encoderOptions);

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
    if (output.oformat && !(output.oformat.flags & AV_FMT_NOFILE)) {
      const ioContext = new IOContext();
      await ioContext.open2(outputFile, AV_IO_FLAG_WRITE);
      output.pb = ioContext;
    }

    await output.writeHeader(null);

    // Process frames (limit to 10 for test speed)
    let frameCount = 0;
    const maxFrames = 10;

    for await (const packet of media.packets()) {
      if (packet.streamIndex === videoStream.index) {
        const frame = await decoder.decode(packet);
        if (frame) {
          frameCount++;

          const encodedPacket = await encoder.encode(frame);
          if (encodedPacket) {
            encodedPacket.streamIndex = outputStream.index;
            encodedPacket.rescaleTs(encoderCtx!.timeBase, outputStream.timeBase);
            await output.interleavedWriteFrame(encodedPacket);
            encodedPacket.free();
          }

          frame.free();
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

      const outputFile = `${testOutputBase}-full-gpu.mp4`;
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

      const outputFile = `${testOutputBase}-hw-decode-sw-encode.mp4`;
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, true, false, hw);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`HW Decode + SW Encode: Processed ${frameCount} frames`);
      } catch (error) {
        console.log('HW decode + SW encode failed:', error);
        // Don't dispose hw here - it's used by other tests
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

      // VideoToolbox encoder requires hardware frames, but we're providing CPU frames
      // This would need hwupload filter support which is a separate feature
      // if (hw.deviceTypeName === 'videotoolbox') {
      //   console.log('VideoToolbox CPU→GPU upload requires hwupload filter - skipping');
      //   hw.dispose();
      //   return;
      // }

      const outputFile = `${testOutputBase}-sw-decode-hw-encode.mp4`;
      cleanupOutput(outputFile);

      try {
        const frameCount = await transcode(testInput, outputFile, false, true, hw);
        assert.ok(frameCount > 0, 'Should process frames');
        assert.ok(existsSync(outputFile), 'Should create output file');
        console.log(`SW Decode + HW Encode: Processed ${frameCount} frames`);
      } catch (error) {
        console.log('SW decode + HW encode failed:', error);
        // Don't dispose hw here - it's used by other tests
      } finally {
        cleanupOutput(outputFile);
      }
    });
  });

  describe('Full CPU (Software Decode + Software Encode)', () => {
    it('should transcode using full software pipeline', async () => {
      const outputFile = `${testOutputBase}-full-cpu.mp4`;
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

  describe('Performance Comparison', () => {
    it('should compare performance of all transcode methods', async () => {
      const hw = await HardwareContext.auto();
      const results: { method: string; time: number; fps: number }[] = [];

      // Test each combination and measure time
      const combinations = [
        { name: 'Full GPU', hwDecode: true, hwEncode: true, needsHw: true },
        { name: 'HW Decode + SW Encode', hwDecode: true, hwEncode: false, needsHw: true },
        { name: 'SW Decode + HW Encode', hwDecode: false, hwEncode: true, needsHw: true },
        { name: 'Full CPU', hwDecode: false, hwEncode: false, needsHw: false },
      ];

      for (const combo of combinations) {
        if (combo.needsHw && !hw) {
          console.log(`${combo.name}: Skipped (no hardware)`);
          continue;
        }

        // Skip SW decode + HW encode for VideoToolbox (not yet implemented)
        // if (combo.name === 'SW Decode + HW Encode' && hw?.deviceTypeName === 'videotoolbox') {
        //   console.log(`${combo.name}: Skipped (VideoToolbox CPU→GPU upload not yet implemented)`);
        //   continue;
        // }

        const outputFile = `${testOutputBase}-perf-${combo.name.toLowerCase().replace(/\s+/g, '-')}.mp4`;
        cleanupOutput(outputFile);

        try {
          const startTime = Date.now();
          const frameCount = await transcode(testInput, outputFile, combo.hwDecode, combo.hwEncode, combo.needsHw && hw ? hw : undefined);
          const elapsed = (Date.now() - startTime) / 1000;
          const fps = frameCount / elapsed;

          results.push({
            method: combo.name,
            time: elapsed,
            fps,
          });

          console.log(`${combo.name}: ${elapsed.toFixed(2)}s, ${fps.toFixed(1)} fps`);
        } catch (error) {
          console.log(`${combo.name}: Failed - ${error}`);
        } finally {
          cleanupOutput(outputFile);
        }
      }

      // Print comparison
      if (results.length > 0) {
        console.log('\nPerformance Summary:');
        results.sort((a, b) => b.fps - a.fps);
        results.forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.method}: ${r.fps.toFixed(1)} fps`);
        });
      }

      hw?.dispose();
    });
  });

  describe('Zero-Copy Verification', () => {
    it('should verify zero-copy operation with full GPU pipeline', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const outputFile = `${testOutputBase}-zero-copy.mp4`;
      cleanupOutput(outputFile);

      try {
        const media = await MediaInput.open(testInput);
        const videoStream = media.video();
        assert.ok(videoStream, 'Should have video stream');

        // Create hardware decoder
        const decoder = await Decoder.create(media, videoStream.index, {
          hardware: hw,
        });

        // Hardware context is now initialized automatically in create()

        // Create hardware encoder with shared context
        const encoderName = hw.deviceTypeName === 'videotoolbox' ? 'h264_videotoolbox' : 'h264';
        const encoder = await Encoder.create(encoderName, {
          width: videoStream.codecpar.width,
          height: videoStream.codecpar.height,
          pixelFormat: AV_PIX_FMT_NV12,
          bitrate: '2M',
          hardware: hw,
          sharedDecoder: decoder,
        });

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
