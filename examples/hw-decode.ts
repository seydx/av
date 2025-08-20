#!/usr/bin/env tsx

/**
 * Hardware-accelerated decoding Example
 *
 * Perform HW-accelerated decoding with output frames from HW video surfaces.
 * On macOS, this will use VideoToolbox for hardware acceleration.
 *
 * Usage: hw-decode.ts <device type> <input file> <output file>
 * Example: tsx examples/hw-decode.ts videotoolbox testdata/video.mp4 examples/.tmp/hw_decoded.yuv
 */

import fs from 'node:fs';

import {
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_NONE,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_NONE,
  Codec,
  CodecContext,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  Packet,
  avImageCopyToBuffer,
  avImageGetBufferSize,
} from '../src/lib/index.js';

import type { AVHWDeviceType, AVPixelFormat } from '../src/lib/index.js';

let hwDeviceCtx: HardwareDeviceContext | null = null;
let hwPixFmt: AVPixelFormat = AV_PIX_FMT_NONE;
let outputFile: number | null = null;

/**
 * Initialize hardware decoder
 */
function hwDecoderInit(ctx: CodecContext, type: AVHWDeviceType): number {
  hwDeviceCtx = new HardwareDeviceContext();

  const err = hwDeviceCtx.create(type, null, null);
  if (err < 0) {
    console.error('Failed to create specified HW device.');
    return err;
  }

  ctx.hwDeviceCtx = hwDeviceCtx;
  return err;
}

/**
 * Decode and write frame data
 */
async function decodeWrite(avctx: CodecContext, packet: Packet | null): Promise<number> {
  let ret = await avctx.sendPacket(packet);
  if (ret < 0) {
    console.error('Error during decoding');
    return ret;
  }

  while (true) {
    const frame = new Frame();
    frame.alloc();
    const swFrame = new Frame();
    swFrame.alloc();

    let tmpFrame: Frame | null = null;
    let buffer: Buffer | null = null;

    try {
      ret = await avctx.receiveFrame(frame);
      if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
        return 0;
      } else if (ret < 0) {
        console.error('Error while decoding');
        return ret;
      }

      if (frame.format === hwPixFmt) {
        // Retrieve data from GPU to CPU
        ret = await frame.hwframeTransferData(swFrame, 0);
        if (ret < 0) {
          console.error('Error transferring the data to system memory');
          return ret;
        }
        tmpFrame = swFrame;
      } else {
        tmpFrame = frame;
      }

      const size = avImageGetBufferSize(tmpFrame.format as AVPixelFormat, tmpFrame.width, tmpFrame.height, 1);

      buffer = Buffer.alloc(size);

      ret = avImageCopyToBuffer(buffer, size, tmpFrame.data, tmpFrame.linesize, tmpFrame.format as AVPixelFormat, tmpFrame.width, tmpFrame.height, 1);

      if (ret < 0) {
        console.error('Cannot copy image to buffer');
        return ret;
      }

      // Write to output file
      fs.writeSync(outputFile!, buffer);
    } finally {
      frame.free();
      swFrame.free();
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error(`Usage: ${process.argv[1]} <device type> <input file> <output file>`);
    console.error('Example: tsx examples/hw-decode.ts videotoolbox input.mp4 output.yuv');
    return -1;
  }

  const [deviceTypeName, inputFile, outputFilePath] = args;

  // Find hardware device type
  const type = HardwareDeviceContext.findTypeByName(deviceTypeName);
  if (type === AV_HWDEVICE_TYPE_NONE) {
    console.error(`Device type ${deviceTypeName} is not supported.`);
    console.error('Available device types:');

    const types = HardwareDeviceContext.iterateTypes();
    for (const t of types) {
      const name = HardwareDeviceContext.getTypeName(t);
      process.stderr.write(` ${name}`);
    }
    console.error('');
    return -1;
  }

  const packet = new Packet();
  packet.alloc();

  let inputCtx: FormatContext | null = null;
  let decoderCtx: CodecContext | null = null;

  try {
    // Open the input file
    inputCtx = new FormatContext();
    let ret = await inputCtx.openInput(inputFile, null, null);
    if (ret !== 0) {
      console.error(`Cannot open input file '${inputFile}'`);
      return -1;
    }

    ret = await inputCtx.findStreamInfo(null);
    if (ret < 0) {
      console.error('Cannot find input stream information.');
      return -1;
    }

    // Find the video stream
    const videoStreamIndex = inputCtx.findBestStream(AV_MEDIA_TYPE_VIDEO, -1, -1);
    if (videoStreamIndex < 0) {
      console.error('Cannot find a video stream in the input file');
      return -1;
    }

    const videoStream = inputCtx.streams![videoStreamIndex];

    // Find the decoder for the stream
    const decoder = Codec.findDecoder(videoStream.codecpar.codecId);
    if (!decoder) {
      console.error('Cannot find decoder');
      return -1;
    }

    // Find hardware configuration
    let configFound = false;
    for (let i = 0; ; i++) {
      const config = decoder.getHwConfig(i);
      if (!config) {
        console.error(`Decoder ${decoder.name} does not support device type ${HardwareDeviceContext.getTypeName(type)}.`);
        return -1;
      }

      if (config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX && config.deviceType === type) {
        hwPixFmt = config.pixFmt;
        configFound = true;
        break;
      }
    }

    if (!configFound) {
      console.error('No suitable hardware configuration found');
      return -1;
    }

    // Allocate decoder context
    decoderCtx = new CodecContext();
    decoderCtx.allocContext3(decoder);

    ret = decoderCtx.parametersToContext(videoStream.codecpar);
    if (ret < 0) {
      console.error('Failed to copy codec parameters');
      return -1;
    }

    // Set hardware pixel format with software fallback
    decoderCtx.setHardwarePixelFormat(hwPixFmt, AV_PIX_FMT_NONE);

    // Initialize hardware decoder
    ret = hwDecoderInit(decoderCtx, type);
    if (ret < 0) {
      return -1;
    }

    // Open decoder
    ret = await decoderCtx.open2(decoder, null);
    if (ret < 0) {
      console.error(`Failed to open codec for stream #${videoStreamIndex}`);
      return -1;
    }

    // Open output file
    outputFile = fs.openSync(outputFilePath, 'w');

    // Decode and dump raw data
    while (true) {
      ret = await inputCtx.readFrame(packet);
      if (ret < 0) {
        break;
      }

      if (videoStreamIndex === packet.streamIndex) {
        ret = await decodeWrite(decoderCtx, packet);
        if (ret < 0) {
          break;
        }
      }

      packet.unref();
    }

    // Flush the decoder
    await decodeWrite(decoderCtx, null);

    console.log('Hardware decoding completed successfully!');
    return 0;
  } catch (error) {
    console.error('Error:', error);
    return -1;
  } finally {
    // Cleanup
    if (outputFile !== null) {
      fs.closeSync(outputFile);
    }

    packet.free();

    if (decoderCtx) {
      decoderCtx.freeContext();
    }

    if (inputCtx) {
      await inputCtx.closeInput();
    }

    // Hardware device context is automatically freed
  }
}

// Run the program
main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
