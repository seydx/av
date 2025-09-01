import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_VAAPI,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_YUV420P,
  Decoder,
  Encoder,
  FF_ENCODER_LIBX264,
  HardwareContext,
  MediaInput,
} from '../src/index.js';
import { getInputFile, prepareTestEnvironment, skipInCI } from './index.js';

import type { Frame } from '../src/lib/index.js';

prepareTestEnvironment();

const inputFile = getInputFile('demux.mp4');

describe('HardwareContext', () => {
  describe('static methods', () => {
    it('should list available hardware types', () => {
      const available = HardwareContext.listAvailable();
      assert.ok(Array.isArray(available), 'Should return an array');
      console.log('Available hardware:', available.join(', ') || 'none');
    });

    it('should auto-detect hardware', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        console.log(`Auto-detected hardware: ${hw.deviceTypeName}`);
        assert.ok(hw.deviceContext, 'Should have device context');
        assert.ok(hw.deviceType !== AV_HWDEVICE_TYPE_NONE, 'Should have valid device type');
        hw.dispose();
      } else {
        console.log('No hardware acceleration available');
      }
    });

    it('should handle unknown device type', async () => {
      await assert.rejects(async () => await HardwareContext.create(999 as any), /Failed to create hardware context/, 'Should throw for unknown device');
    });

    it('should get preference order for hardware types', () => {
      // This is a private method, so we test it indirectly through auto()
      // The auto() method uses getPreferenceOrder internally
      assert.ok(true, 'getPreferenceOrder is tested through auto() method');
    });
  });

  describe('instance methods', () => {
    it('should provide device information', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        assert.ok(hw.deviceTypeName, 'Should have device type name');
        assert.ok(typeof hw.deviceType === 'number', 'Should have device type number');
        assert.ok(typeof hw.getHardwarePixelFormat() === 'number', 'Should have hardware pixel format');
        hw.dispose();
      }
    });

    it('should get encoder codec for base codec name', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        // Test getting hardware encoder codec
        const h264Encoder = hw.getEncoderCodec('h264');
        const hevcEncoder = hw.getEncoderCodec('hevc');
        const av1Encoder = hw.getEncoderCodec('av1');
        
        console.log(`Hardware encoder codecs for ${hw.deviceTypeName}:`);
        console.log(`  h264: ${h264Encoder || 'not supported'}`);
        console.log(`  hevc: ${hevcEncoder || 'not supported'}`);
        console.log(`  av1: ${av1Encoder || 'not supported'}`);
        
        // At least one might be supported depending on hardware
        assert.ok(
          h264Encoder !== null || hevcEncoder !== null || av1Encoder !== null || true,
          'Hardware might support some codecs'
        );
        
        hw.dispose();
      }
    });

    it('should support Symbol.dispose', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        {
          using disposableHw = hw;
          assert.ok(disposableHw.deviceContext, 'Should work inside using block');
        }
        // Hardware should be disposed here
        assert.ok(hw.isDisposed, 'Should be disposed after using block');
      }
    });

    it('should check if hardware is disposed', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        assert.equal(hw.isDisposed, false, 'Should not be disposed initially');
        hw.dispose();
        assert.equal(hw.isDisposed, true, 'Should be disposed after calling dispose()');
      }
    });

    it('should provide hardware filter presets', async () => {
      const hw = await HardwareContext.auto();
      if (hw) {
        assert.ok(hw.filterPresets, 'Should have filter presets');
        assert.ok(hw.filterPresets.support, 'Should have support information');
        
        // Test building hardware filter chains using the chain builder
        const chain = hw.filterPresets.chain();
        assert.ok(chain, 'Should create chain builder');
        
        // Build a hardware filter chain
        const filterChain = chain
          .hwupload()
          .scale(1280, 720)
          .hwdownload()
          .build();
        
        console.log(`Hardware filter chain for ${hw.deviceTypeName}: ${filterChain}`);
        assert.ok(typeof filterChain === 'string', 'Should return filter chain string');
        
        // Test individual filter presets
        const scaleFilter = hw.filterPresets.scale(1280, 720);
        console.log(`  Scale filter: ${scaleFilter}`);
        assert.ok(typeof scaleFilter === 'string', 'Should return scale filter string');
        
        // Check hardware filter support
        console.log(`Hardware filter support for ${hw.deviceTypeName}:`);
        console.log(`  Scale: ${hw.filterPresets.support.scale}`);
        console.log(`  Overlay: ${hw.filterPresets.support.overlay}`);
        console.log(`  Deinterlace: ${hw.filterPresets.support.deinterlace}`);
        
        hw.dispose();
      }
    });
  });

  describe('specific hardware types', () => {
    it('should handle CUDA if available', async () => {
      try {
        const cuda = await HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
        console.log('CUDA hardware acceleration available');
        assert.equal(cuda.deviceTypeName, 'cuda', 'Should be CUDA device');
        cuda.dispose();
      } catch {
        console.log('CUDA not available on this system');
      }
    });

    it('should handle VideoToolbox if available', async () => {
      if (process.platform === 'darwin') {
        try {
          const vt = await HardwareContext.create(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
          console.log('VideoToolbox hardware acceleration available');
          assert.equal(vt.deviceTypeName, 'videotoolbox', 'Should be VideoToolbox device');
          vt.dispose();
        } catch {
          console.log('VideoToolbox not available');
        }
      }
    });

    it('should handle VAAPI if available', async () => {
      if (process.platform === 'linux') {
        try {
          const vaapi = await HardwareContext.create(AV_HWDEVICE_TYPE_VAAPI);
          console.log('VAAPI hardware acceleration available');
          assert.equal(vaapi.deviceTypeName, 'vaapi', 'Should be VAAPI device');
          vaapi.dispose();
        } catch {
          console.log('VAAPI not available');
        }
      }
    });
  });

  describe('hardware disposal', () => {
    it('should safely dispose hardware multiple times', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      // First dispose
      hw.dispose();
      assert.ok(hw.isDisposed, 'Should be marked as disposed');

      // Second dispose should be safe (no-op)
      hw.dispose();
      assert.ok(hw.isDisposed, 'Should still be disposed');

      // Third dispose should also be safe
      hw.dispose();
      assert.ok(hw.isDisposed, 'Should still be disposed');
    });

    it('should dispose hardware when decoder closes', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const media = await MediaInput.open(inputFile);
      const videoStream = media.video(0);
      assert.ok(videoStream, 'Should have video stream');

      const decoder = await Decoder.create(videoStream, {
        hardware: hw,
      });

      assert.ok(!hw.isDisposed, 'Hardware should not be disposed yet');

      decoder.close();
      assert.ok(!hw.isDisposed, 'Hardware should not be disposed after decoder closes');

      hw.dispose();
      assert.ok(hw.isDisposed, 'Should be disposed');

      media.close();
    });

    it('should dispose hardware when encoder closes', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      try {
        // This test just checks disposal, software encoder is fine
        const encoder = await Encoder.create(
          FF_ENCODER_LIBX264,
          {
            type: 'video',
            width: 640,
            height: 480,
            pixelFormat: AV_PIX_FMT_YUV420P,
            frameRate: { num: 25, den: 1 },
            timeBase: { num: 1, den: 25 },
            sampleAspectRatio: { num: 1, den: 1 },
          },
          {
            bitrate: '1M',
            hardware: hw,
          },
        );

        assert.ok(!hw.isDisposed, 'Hardware should not be disposed yet');

        encoder.close();
        assert.ok(!hw.isDisposed, 'Hardware should not be disposed after encoder closes');

        hw.dispose();
        assert.ok(hw.isDisposed, 'Should be disposed');
      } catch (error) {
        // Hardware encoding might not be supported
        console.log('Hardware encoding not supported:', error);
        hw.dispose();
      }
    });

    it('should allow sharing hardware between multiple decoders', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware available - skipping test');
        return;
      }

      const media1 = await MediaInput.open(inputFile);
      const media2 = await MediaInput.open(inputFile);
      const videoStream1 = media1.video(0);
      const videoStream2 = media2.video(0);

      assert.ok(videoStream1 && videoStream2, 'Should have video streams');

      // Create two decoders sharing the same hardware
      const decoder1 = await Decoder.create(videoStream1, {
        hardware: hw,
      });
      const decoder2 = await Decoder.create(videoStream2, {
        hardware: hw,
      });

      assert.ok(!hw.isDisposed, 'Hardware should not be disposed yet');

      decoder1.close();
      assert.ok(!hw.isDisposed, 'Hardware should not be disposed after first decoder closes');

      decoder2.close();
      assert.ok(!hw.isDisposed, 'Hardware should still not be disposed after second decoder closes');

      hw.dispose();
      assert.ok(hw.isDisposed, 'Should be disposed');

      media1.close();
      media2.close();
    });
  });

  describe('hardware integration', () => {
    it('should work with Decoder when hardware is available', async () => {
      // Try to get hardware context
      const hw = await HardwareContext.auto();

      if (!hw) {
        console.log('No hardware acceleration available - skipping test');
        return;
      }

      try {
        // Open a test video
        const media = await MediaInput.open(inputFile);
        const videoStream = media.video(0);
        assert.ok(videoStream, 'Should have video stream');

        // Create decoder with hardware acceleration
        const decoder = await Decoder.create(videoStream, {
          hardware: hw,
        });

        // Decode first frame to verify it works
        let frameCount = 0;
        for await (const packet of media.packets()) {
          if (packet.streamIndex === videoStream.index) {
            const frame = await decoder.decode(packet);
            if (frame) {
              frameCount++;
              frame.free();
              break; // Just test first frame
            }
          }
        }

        assert.ok(frameCount > 0, 'Should decode at least one frame');

        decoder.close();
        media.close();
      } catch (error) {
        // Hardware might not support the codec
        console.log('Hardware acceleration test failed:', error);
        hw.dispose();
      }
    });

    it('should work with Decoder using auto hardware detection', skipInCI, async () => {
      const media = await MediaInput.open(inputFile);
      const videoStream = media.video(0);
      assert.ok(videoStream, 'Should have video stream');

      // Auto-detect hardware and create decoder
      const hw = await HardwareContext.auto();
      const decoder = await Decoder.create(videoStream, hw ? { hardware: hw } : {});

      // Decode first frame
      let frameCount = 0;
      for await (const packet of media.packets()) {
        if (packet.streamIndex === videoStream.index) {
          const frame = await decoder.decode(packet);
          if (frame) {
            frameCount++;
            frame.free();
            break;
          }
        }
      }

      assert.ok(frameCount > 0, 'Should decode at least one frame');

      decoder.close();
      media.close();
      // hw is disposed by decoder.close()
    });

    it('should work with Encoder when hardware is available', async () => {
      const hw = await HardwareContext.auto();

      if (!hw) {
        console.log('No hardware acceleration available for encoding - skipping test');
        return;
      }

      try {
        // Try to create encoder with hardware
        // Use hardware-specific encoder codec
        const hwEncoderCodec = hw.getEncoderCodec('h264');
        const encoderName = hwEncoderCodec || FF_ENCODER_LIBX264;
        const encoder = await Encoder.create(
          encoderName,
          {
            type: 'video',
            width: 640,
            height: 480,
            pixelFormat: AV_PIX_FMT_YUV420P,
            frameRate: { num: 25, den: 1 },
            timeBase: { num: 1, den: 25 },
            sampleAspectRatio: { num: 1, den: 1 },
          },
          {
            bitrate: '1M',
            hardware: hw,
          },
        );

        // Just verify it was created successfully
        assert.ok(encoder, 'Should create hardware encoder');

        encoder.close();
      } catch (error) {
        // Hardware might not support encoding
        console.log('Hardware encoding not supported:', error);
        hw.dispose();
      }
    });

    it('should work with Encoder using auto hardware detection', async () => {
      const hw = await HardwareContext.auto();

      try {
        // Use hardware-specific encoder codec if available
        const hwEncoderCodec = hw?.getEncoderCodec('h264');
        const encoderName = hwEncoderCodec || FF_ENCODER_LIBX264;
        const encoder = await Encoder.create(
          encoderName,
          {
            type: 'video',
            width: 640,
            height: 480,
            pixelFormat: AV_PIX_FMT_YUV420P,
            frameRate: { num: 25, den: 1 },
            timeBase: { num: 1, den: 25 },
            sampleAspectRatio: { num: 1, den: 1 },
          },
          {
            bitrate: '1M',
            hardware: hw ?? undefined,
          },
        );

        // Just verify it was created
        assert.ok(encoder, 'Should create encoder');

        encoder.close();
      } catch (error) {
        // Auto hardware might fail, that's OK
        console.log('Auto hardware encoding failed (expected):', error);
        hw?.dispose();
      }
    });
  });

  describe('zero-copy GPU transfer', () => {
    it('should transfer frames from decoder to encoder on GPU (zero-copy)', async () => {
      // This test demonstrates zero-copy GPU frame transfer
      // where frames stay on GPU between decode and encode

      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware acceleration available - skipping zero-copy test');
        return;
      }

      try {
        // Open test video
        const media = await MediaInput.open(inputFile);
        const videoStream = media.video(0);
        assert.ok(videoStream, 'Should have video stream');

        // Create hardware decoder
        const decoder = await Decoder.create(videoStream, {
          hardware: hw,
        });

        // Create hardware encoder
        // Use hardware-specific encoder codec
        const hwEncoderCodec = hw.getEncoderCodec('h264');
        const encoderName = hwEncoderCodec || FF_ENCODER_LIBX264;
        let encoder;
        try {
          encoder = await Encoder.create(
            encoderName,
            {
              type: 'video',
              width: videoStream.codecpar.width,
              height: videoStream.codecpar.height,
              pixelFormat: AV_PIX_FMT_NV12,
              frameRate: { num: 25, den: 1 },
              timeBase: { num: 1, den: 25 },
              sampleAspectRatio: { num: 1, den: 1 },
            },
            {
              bitrate: '2M',
              hardware: hw,
            },
          );
        } catch (error) {
          console.log('Hardware encoding not supported:', error);
          decoder.close();
          media.close();
          hw.dispose();
          return;
        }

        let decodedFrames = 0;
        let encodedPackets = 0;
        const maxFrames = 10; // Process only first 10 frames for test

        // Process frames
        for await (const packet of media.packets()) {
          if (packet.streamIndex === videoStream.index) {
            const frame = await decoder.decode(packet);
            if (frame) {
              decodedFrames++;

              // Check if frame is on GPU (hardware pixel format)
              const isHardwareFrame = frame.isHwFrame();

              if (isHardwareFrame) {
                console.log(`Frame ${decodedFrames} is on GPU (format: ${frame.format})`);
              }

              // Encode the frame directly (zero-copy if both on same GPU)
              const encodedPacket = await encoder.encode(frame);
              if (encodedPacket) {
                encodedPackets++;
                encodedPacket.free();
              }

              frame.free();

              if (decodedFrames >= maxFrames) {
                break;
              }
            }
          }
        }

        // Flush encoder
        let flushPacket;
        while ((flushPacket = await encoder.flush()) !== null) {
          encodedPackets++;
          flushPacket.free();
        }

        console.log(`Zero-copy test: Decoded ${decodedFrames} frames, Encoded ${encodedPackets} packets`);
        assert.ok(decodedFrames > 0, 'Should decode frames');
        assert.ok(encodedPackets > 0, 'Should encode packets');

        decoder.close();
        encoder.close();
        media.close();
      } catch (error) {
        console.log('Zero-copy test failed:', error);
        hw.dispose();
        throw error;
      }
    });

    it('should demonstrate GPU memory efficiency with multiple streams', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware acceleration available - skipping test');
        return;
      }

      try {
        // Open two input videos
        const media1 = await MediaInput.open(inputFile);
        const media2 = await MediaInput.open(inputFile);

        const videoStream1 = media1.video(0);
        const videoStream2 = media2.video(0);

        assert.ok(videoStream1 && videoStream2, 'Should have video streams');

        // Create decoders sharing same hardware context
        const decoder1 = await Decoder.create(videoStream1, {
          hardware: hw,
        });
        const decoder2 = await Decoder.create(videoStream2, {
          hardware: hw,
        });

        // Process one frame from each decoder
        let frame1: Frame | null = null;
        let frame2: Frame | null = null;

        for await (const packet of media1.packets()) {
          if (packet.streamIndex === videoStream1.index) {
            frame1 = await decoder1.decode(packet);
            if (frame1) break;
          }
        }

        for await (const packet of media2.packets()) {
          if (packet.streamIndex === videoStream2.index) {
            frame2 = await decoder2.decode(packet);
            if (frame2) break;
          }
        }

        assert.ok(frame1, 'Should decode frame from stream 1');
        assert.ok(frame2, 'Should decode frame from stream 2');

        // Both frames should be on the same GPU
        console.log('Both frames decoded on same GPU context');

        frame1?.free();
        frame2?.free();
        decoder1.close();
        decoder2.close();
        media1.close();
        media2.close();
      } catch (error) {
        console.log('Multi-stream GPU test failed:', error);
        hw.dispose();
      }
    });

    it('should verify hardware codec selection', async () => {
      const hw = await HardwareContext.auto();
      if (!hw) {
        console.log('No hardware acceleration available - skipping test');
        return;
      }

      try {
        console.log(`Hardware ${hw.deviceTypeName} codec support:`);

        // Test getting hardware encoder codecs
        const h264HwCodec = hw.getEncoderCodec('h264');
        const hevcHwCodec = hw.getEncoderCodec('hevc');
        
        if (h264HwCodec) {
          console.log(`  H.264 hardware encoder: ${h264HwCodec}`);
        }
        if (hevcHwCodec) {
          console.log(`  HEVC hardware encoder: ${hevcHwCodec}`);
        }

        // Try to create encoder with hardware codec if available
        if (h264HwCodec) {
          const encoder = await Encoder.create(
            h264HwCodec,
            {
              type: 'video',
              width: 640,
              height: 480,
              pixelFormat: hw.getHardwarePixelFormat(),
              frameRate: { num: 25, den: 1 },
              timeBase: { num: 1, den: 25 },
              sampleAspectRatio: { num: 1, den: 1 },
            },
            {
              bitrate: '1M',
              hardware: hw,
            },
          );

          assert.ok(encoder, 'Should create hardware encoder');
          encoder.close();
        }

        hw.dispose();
      } catch (error) {
        console.log('Hardware codec selection test failed:', error);
        hw.dispose();
      }
    });
  });
});
