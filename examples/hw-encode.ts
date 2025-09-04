/**
 * Hardware-accelerated encoding Example
 *
 * Perform HW-accelerated encoding. Read input from an NV12/YUV420P raw file,
 * and write the H.264/H.265 encoded data to an output file.
 *
 * Usage: hw-encode.ts <device type> <codec> <width> <height> <input file> <output file>
 * Example: tsx examples/hw-encode.ts videotoolbox h264 1920 1080 testdata/input.yuv examples/.tmp/hw_encode.h264
 */

import { closeSync, openSync, readSync, writeSync } from 'node:fs';

import {
  AVERROR_EAGAIN,
  AVERROR_EOF,
  AV_HWDEVICE_TYPE_CUDA,
  AV_HWDEVICE_TYPE_D3D11VA,
  AV_HWDEVICE_TYPE_D3D12VA,
  AV_HWDEVICE_TYPE_DRM,
  AV_HWDEVICE_TYPE_DXVA2,
  AV_HWDEVICE_TYPE_NONE,
  AV_HWDEVICE_TYPE_OPENCL,
  AV_HWDEVICE_TYPE_VDPAU,
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
} from '../src/index.js';

import type { AVCodecID, AVHWDeviceType, AVPixelFormat, FFEncoderCodec } from '../src/index.js';

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
async function getEncoderCodec(deviceCtx: HardwareDeviceContext, deviceType: AVHWDeviceType, codecName: string): Promise<Codec | null> {
  // Build the encoder name
  let encoderSuffix = '';

  const deviceTypeName = HardwareDeviceContext.getTypeName(deviceType) ?? '';

  // We might only have hardware decode capabilities (d3d11va, d3d12va etc)
  // So we need to check for other hardware encoders
  const getAlternativeEncoder = (): string | null => {
    const nvencCodecName = `${codecName}_nvenc` as FFEncoderCodec;
    const qsvCodecName = `${codecName}_qsv` as FFEncoderCodec;
    const amfCodecName = `${codecName}_amf` as FFEncoderCodec;
    const codecNames = [nvencCodecName, qsvCodecName, amfCodecName];

    let suffix = '';
    for (const name of codecNames) {
      const encoderCodec = Codec.findEncoderByName(name);
      if (!encoderCodec) {
        continue;
      }

      suffix = name.split('_')[1]; // Get suffix after underscore
    }

    if (!suffix) {
      return null;
    }

    return suffix;
  };

  switch (deviceType) {
    case AV_HWDEVICE_TYPE_CUDA:
      // CUDA uses NVENC for encoding
      encoderSuffix = 'nvenc';
      break;

    case AV_HWDEVICE_TYPE_D3D11VA:
    case AV_HWDEVICE_TYPE_DXVA2:
      encoderSuffix = getAlternativeEncoder() ?? '';
      break;

    case AV_HWDEVICE_TYPE_D3D12VA:
      // D3D12VA currently only supports HEVC encoding
      if (codecName === 'hevc') {
        encoderSuffix = 'd3d12va';
      } else {
        encoderSuffix = getAlternativeEncoder() ?? '';
      }
      break;

    case AV_HWDEVICE_TYPE_OPENCL:
    case AV_HWDEVICE_TYPE_VDPAU:
    case AV_HWDEVICE_TYPE_DRM:
      encoderSuffix = getAlternativeEncoder() ?? '';
      break;

    default:
      // Use the device type name as suffix
      encoderSuffix = deviceTypeName;
  }

  if (!encoderSuffix) {
    return null;
  }

  // Construct the encoder name
  const encoderName = `${codecName}_${encoderSuffix}` as FFEncoderCodec;
  const encoderCodec = Codec.findEncoderByName(encoderName);

  if (!encoderCodec || !(await testHardwareEncoder(deviceCtx, encoderName))) {
    return null;
  }

  return encoderCodec;
}

/**
 * Test if hardware encoder is supported
 */
async function testHardwareEncoder(deviceCtx: HardwareDeviceContext, encoderCodec: FFEncoderCodec | AVCodecID | Codec): Promise<boolean> {
  let codec: Codec | null = null;

  if (encoderCodec instanceof Codec) {
    codec = encoderCodec;
  } else if (typeof encoderCodec === 'string') {
    codec = Codec.findEncoderByName(encoderCodec);
  } else {
    codec = Codec.findEncoder(encoderCodec);
  }

  if (!codec?.pixelFormats || !codec.isHardwareAcceleratedEncoder()) {
    return false;
  }

  const codecContext = new CodecContext();
  codecContext.allocContext3(codec);
  codecContext.hwDeviceCtx = deviceCtx;
  codecContext.timeBase = new Rational(1, 30);
  codecContext.pixelFormat = codec.pixelFormats[0];
  codecContext.width = 100;
  codecContext.height = 100;
  const ret = await codecContext.open2(codec);
  codecContext.freeContext();
  return ret >= 0;
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
    if (ret < 0 && ret !== AVERROR_EAGAIN && ret !== AVERROR_EOF) {
      console.error(`Error sending frame: ${new FFmpegError(ret).message}`);
      return ret;
    }

    while (true) {
      const recvRet = await avctx.receivePacket(packet);
      if (recvRet === AVERROR_EAGAIN || recvRet === AVERROR_EOF) {
        break;
      }
      if (recvRet < 0) {
        console.error(`Error receiving packet: ${new FFmpegError(recvRet).message}`);
        return recvRet;
      }

      // Write packet data to file
      if (packet.data) {
        writeSync(outputFile, packet.data);
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
    inputFd = openSync(inputFile, 'r');

    // Open output file
    outputFile = openSync(outputFilePath, 'w');

    // Create hardware device context
    hwDeviceCtx = new HardwareDeviceContext();
    const err = hwDeviceCtx.create(type, null, null);
    if (err < 0) {
      console.error(`Failed to create hardware device: ${new FFmpegError(err).message}`);
      return err;
    }

    // Find encoder
    const codec = await getEncoderCodec(hwDeviceCtx, type, codecName);
    if (!codec) {
      console.error(`Could not find encoder: ${codecName}`);
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
      const yRead = readSync(inputFd, yBuffer, 0, ySize, null);
      if (yRead !== ySize) {
        swFrame.free();
        break; // End of file
      }

      // Read U plane
      const uBuffer = Buffer.alloc(uvSize);
      const uRead = readSync(inputFd, uBuffer, 0, uvSize, null);
      if (uRead !== uvSize) {
        swFrame.free();
        break;
      }

      // Read V plane
      const vBuffer = Buffer.alloc(uvSize);
      const vRead = readSync(inputFd, vBuffer, 0, uvSize, null);
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
      const transferRet = await avctx.hwFramesCtx!.transferData(hwFrame, swFrame, 0);
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
      closeSync(inputFd);
    }

    if (outputFile !== null) {
      closeSync(outputFile);
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
