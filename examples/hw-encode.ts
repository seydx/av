#!/usr/bin/env tsx

/**
 * Hardware-accelerated encoding Example
 *
 * Perform HW-accelerated encoding. Read input from an NV12/YUV420P raw file,
 * and write the H.264/H.265 encoded data to an output file.
 *
 * Usage: hw-encode.ts <device type> <codec> <width> <height> <input file> <output file>
 * Example: tsx examples/hw-encode.ts videotoolbox h264 1920 1080 input.yuv output.h264
 */

import fs from 'node:fs';
import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_NONE,
  AV_PIX_FMT_CUDA,
  AV_PIX_FMT_D3D11,
  AV_PIX_FMT_DXVA2_VLD,
  AV_PIX_FMT_NV12,
  AV_PIX_FMT_QSV,
  AV_PIX_FMT_VAAPI,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AV_PIX_FMT_YUV420P,
  Codec,
  CodecContext,
  FFmpegError,
  Frame,
  HardwareDeviceContext,
  HardwareFramesContext,
  Packet,
  Rational,
  type AVHWDeviceType,
  type AVPixelFormat,
} from '../src/lib/index.js';

let hwDeviceCtx: HardwareDeviceContext | null = null;
let width: number;
let height: number;

/**
 * Map device type to hardware pixel format
 */
function getHardwarePixelFormat(deviceType: AVHWDeviceType): AVPixelFormat {
  // Map device types to their pixel formats
  const deviceTypeNames: Record<string, AVPixelFormat> = {
    videotoolbox: AV_PIX_FMT_VIDEOTOOLBOX,
    vaapi: AV_PIX_FMT_VAAPI,
    cuda: AV_PIX_FMT_CUDA,
    d3d11va: AV_PIX_FMT_D3D11,
    dxva2: AV_PIX_FMT_DXVA2_VLD,
    qsv: AV_PIX_FMT_QSV,
  };

  const deviceName = HardwareDeviceContext.getTypeName(deviceType);
  return deviceName && deviceTypeNames[deviceName] ? deviceTypeNames[deviceName] : AV_PIX_FMT_NV12;
}

/**
 * Get encoder name for hardware type and codec
 */
function getEncoderName(deviceType: AVHWDeviceType, codecName: string): string {
  const deviceName = HardwareDeviceContext.getTypeName(deviceType);
  if (!deviceName) {
    return codecName;
  }

  // Map device types to encoder suffixes
  const encoderSuffixes: Record<string, string> = {
    videotoolbox: '_videotoolbox',
    vaapi: '_vaapi',
    cuda: '_nvenc',
    d3d11va: '_nvenc',
    dxva2: '_nvenc',
    qsv: '_qsv',
  };

  const suffix = encoderSuffixes[deviceName] ?? '';
  return codecName + suffix;
}

/**
 * Setup hardware frames context for encoder
 */
function setHwFrameCtx(ctx: CodecContext, hwDeviceCtx: HardwareDeviceContext): number {
  const hwFramesCtx = new HardwareFramesContext();

  // Allocate frames context from device
  hwFramesCtx.alloc(hwDeviceCtx);

  // Configure frames context
  hwFramesCtx.format = ctx.pixelFormat; // Hardware format
  hwFramesCtx.swFormat = AV_PIX_FMT_YUV420P; // Software format
  hwFramesCtx.width = width;
  hwFramesCtx.height = height;
  hwFramesCtx.initialPoolSize = 20;

  // Initialize frames context
  const err = hwFramesCtx.init();
  if (err < 0) {
    console.error('Failed to initialize hardware frames context');
    hwFramesCtx.free();
    return err;
  }

  // Set frames context on codec context
  ctx.hwFramesCtx = hwFramesCtx;

  return 0;
}

/**
 * Encode and write frame
 */
async function encodeWrite(avctx: CodecContext, frame: Frame | null, outputFile: number): Promise<number> {
  const packet = new Packet();
  packet.alloc();

  try {
    const ret = await avctx.sendFrame(frame);
    if (ret < 0 && ret !== AV_ERROR_EAGAIN && ret !== AV_ERROR_EOF) {
      console.error(`Error sending frame: ${new FFmpegError(ret).message}`);
      return ret;
    }

    while (true) {
      const recvRet = await avctx.receivePacket(packet);
      if (recvRet === AV_ERROR_EAGAIN || recvRet === AV_ERROR_EOF) {
        break;
      }
      if (recvRet < 0) {
        console.error(`Error receiving packet: ${new FFmpegError(recvRet).message}`);
        return recvRet;
      }

      // Write packet data to file
      if (packet.data) {
        fs.writeSync(outputFile, packet.data);
      }

      packet.unref();
    }

    return 0;
  } finally {
    packet.free();
  }
}

/**
 * Main function
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length < 6) {
    console.error(`Usage: ${process.argv[1]} <device type> <codec> <width> <height> <input file> <output file>`);
    console.error('Example: tsx examples/hw-encode.ts videotoolbox h264 1920 1080 input.yuv output.h264');
    console.error('Codecs: h264, h265/hevc');
    return -1;
  }

  const [deviceTypeName, codecName, widthStr, heightStr, inputFile, outputFilePath] = args;
  width = parseInt(widthStr);
  height = parseInt(heightStr);
  const size = width * height;

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

  let inputFd: number | null = null;
  let outputFile: number | null = null;
  let avctx: CodecContext | null = null;

  try {
    // Open input file
    inputFd = fs.openSync(inputFile, 'r');

    // Open output file
    outputFile = fs.openSync(outputFilePath, 'w');

    // Create hardware device context
    hwDeviceCtx = new HardwareDeviceContext();
    const err = hwDeviceCtx.create(type, null, null);
    if (err < 0) {
      console.error(`Failed to create hardware device: ${new FFmpegError(err).message}`);
      return err;
    }

    // Find encoder
    const encoderName = getEncoderName(type, codecName);
    const codec = Codec.findEncoderByName(encoderName);
    if (!codec) {
      console.error(`Could not find encoder: ${encoderName}`);
      console.error(`Try one of: ${codecName}_videotoolbox, ${codecName}_vaapi, ${codecName}_nvenc, ${codecName}_qsv`);
      return -1;
    }

    console.log(`Using encoder: ${codec.name} (${codec.longName})`);

    // Allocate codec context
    avctx = new CodecContext();
    avctx.allocContext3(codec);

    // Configure encoder
    avctx.width = width;
    avctx.height = height;
    avctx.timeBase = new Rational(1, 25);
    avctx.framerate = new Rational(25, 1);
    avctx.sampleAspectRatio = new Rational(1, 1);
    avctx.pixelFormat = getHardwarePixelFormat(type);

    // Set bitrate and GOP size for better quality
    avctx.bitRate = 4000000n; // 4 Mbps
    avctx.gopSize = 60; // Keyframe every 60 frames

    // Setup hardware frames context
    const setupRet = setHwFrameCtx(avctx, hwDeviceCtx);
    if (setupRet < 0) {
      console.error('Failed to set hardware frame context');
      return setupRet;
    }

    // Open encoder
    const openRet = await avctx.open2(codec, null);
    if (openRet < 0) {
      console.error(`Cannot open video encoder: ${new FFmpegError(openRet).message}`);
      return openRet;
    }

    console.log('Encoding started...');
    let frameCount = 0;

    // Read and encode frames
    while (true) {
      // Allocate software frame
      const swFrame = new Frame();
      swFrame.alloc();
      swFrame.width = width;
      swFrame.height = height;
      swFrame.format = AV_PIX_FMT_YUV420P;

      const getBufferRet = swFrame.getBuffer(0);
      if (getBufferRet < 0) {
        swFrame.free();
        break;
      }

      // Read YUV data from input file
      const ySize = size;
      const uvSize = size / 4;

      // Read Y plane
      const yBuffer = Buffer.alloc(ySize);
      const yRead = fs.readSync(inputFd, yBuffer, 0, ySize, null);
      if (yRead !== ySize) {
        swFrame.free();
        break; // End of file
      }

      // Read U plane
      const uBuffer = Buffer.alloc(uvSize);
      const uRead = fs.readSync(inputFd, uBuffer, 0, uvSize, null);
      if (uRead !== uvSize) {
        swFrame.free();
        break;
      }

      // Read V plane
      const vBuffer = Buffer.alloc(uvSize);
      const vRead = fs.readSync(inputFd, vBuffer, 0, uvSize, null);
      if (vRead !== uvSize) {
        swFrame.free();
        break;
      }

      // Copy data to frame
      if (swFrame.data?.[0] && swFrame.data[1] && swFrame.data[2]) {
        yBuffer.copy(swFrame.data[0]);
        uBuffer.copy(swFrame.data[1]);
        vBuffer.copy(swFrame.data[2]);
      }

      // Allocate hardware frame
      const hwFrame = new Frame();
      hwFrame.alloc();

      // Get buffer from hardware frames context
      const hwBufferRet = avctx.hwFramesCtx!.getBuffer(hwFrame, 0);
      if (hwBufferRet < 0) {
        console.error(`Error getting hardware buffer: ${new FFmpegError(hwBufferRet).message}`);
        hwFrame.free();
        swFrame.free();
        return hwBufferRet;
      }

      // Transfer data from software to hardware frame
      // For encoding, we upload from software to hardware
      const transferRet = avctx.hwFramesCtx!.transferData(hwFrame, swFrame, 0);
      if (transferRet < 0) {
        console.error(`Error transferring frame data: ${new FFmpegError(transferRet).message}`);
        hwFrame.free();
        swFrame.free();
        return transferRet;
      }

      // Set presentation timestamp
      hwFrame.pts = BigInt(frameCount);

      // Encode frame
      const encodeRet = await encodeWrite(avctx, hwFrame, outputFile);
      if (encodeRet < 0) {
        hwFrame.free();
        swFrame.free();
        return encodeRet;
      }

      hwFrame.free();
      swFrame.free();

      frameCount++;
      if (frameCount % 25 === 0) {
        console.log(`Encoded ${frameCount} frames...`);
      }
    }

    // Flush encoder
    console.log('Flushing encoder...');
    await encodeWrite(avctx, null, outputFile);

    console.log(`Hardware encoding completed! Encoded ${frameCount} frames.`);
    return 0;
  } catch (error) {
    console.error('Error:', error);
    return -1;
  } finally {
    // Cleanup
    if (inputFd !== null) {
      fs.closeSync(inputFd);
    }

    if (outputFile !== null) {
      fs.closeSync(outputFile);
    }

    if (avctx) {
      avctx.freeContext();
    }

    if (hwDeviceCtx) {
      hwDeviceCtx.free();
    }
  }
}

// Run the program
main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
