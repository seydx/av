/**
 * Hardware-accelerated transcoding Example
 *
 * Perform HW-accelerated transcoding (zero-copy).
 * The decoded frames stay in GPU memory and are passed directly to the encoder.
 *
 * Usage: hw-transcode.ts <device type> <input file> <encoder codec> <output file>
 * Example: tsx examples/hw-transcode.ts videotoolbox testdata/demux.mp4 h264 examples/.tmp/hw_transcoded.mp4
 */

import {
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
  AV_PIX_FMT_NONE,
  AV_PIX_FMT_QSV,
  AV_PIX_FMT_VAAPI,
  AV_PIX_FMT_VIDEOTOOLBOX,
  AVERROR_EAGAIN,
  AVERROR_EOF,
  AVMEDIA_TYPE_VIDEO,
  Codec,
  CodecContext,
  FFmpegError,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  Packet,
  Rational,
} from '../src/index.js';

import type { AVCodecID, AVHWDeviceType, AVPixelFormat, FFEncoderCodec, Stream } from '../src/index.js';

let hwDeviceCtx: HardwareDeviceContext | null = null;
let inputCtx: FormatContext | null = null;
let outputCtx: FormatContext | null = null;
let decoderCtx: CodecContext | null = null;
let encoderCtx: CodecContext | null = null;
let videoStreamIndex = -1;
let outputStream: Stream | null = null;
let initialized = false;

/**
 * Map device type to hardware pixel format
 */
function getHardwarePixelFormat(deviceType: AVHWDeviceType): AVPixelFormat {
  const deviceName = HardwareDeviceContext.getTypeName(deviceType);
  if (!deviceName) {
    return AV_PIX_FMT_NONE;
  }

  const deviceTypeFormats: Record<string, AVPixelFormat> = {
    videotoolbox: AV_PIX_FMT_VIDEOTOOLBOX,
    vaapi: AV_PIX_FMT_VAAPI,
    cuda: AV_PIX_FMT_CUDA,
    d3d11va: AV_PIX_FMT_D3D11,
    dxva2: AV_PIX_FMT_DXVA2_VLD,
    qsv: AV_PIX_FMT_QSV,
  };

  return deviceTypeFormats[deviceName] ?? AV_PIX_FMT_NONE;
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
 * Open input file and setup decoder
 */
async function openInputFile(filename: string, deviceType: AVHWDeviceType): Promise<number> {
  // Open input file
  inputCtx = new FormatContext();
  const openRet = await inputCtx.openInput(filename, null, null);
  if (openRet < 0) {
    console.error(`Cannot open input file '${filename}': ${new FFmpegError(openRet).message}`);
    return openRet;
  }

  // Find stream info
  const findRet = await inputCtx.findStreamInfo(null);
  if (findRet < 0) {
    console.error(`Cannot find stream info: ${new FFmpegError(findRet).message}`);
    return findRet;
  }

  // Find video stream with decoder
  const streamResult = inputCtx.findBestStream(AVMEDIA_TYPE_VIDEO, -1, -1, true, 0);
  if (streamResult.streamIndex < 0) {
    console.error(`Cannot find video stream: ${new FFmpegError(streamResult.streamIndex).message}`);
    return streamResult.streamIndex;
  }
  videoStreamIndex = streamResult.streamIndex;
  const suggestedDecoder = streamResult.decoder;

  const videoStream = inputCtx.streams![videoStreamIndex];
  if (!videoStream) {
    console.error('Video stream not found');
    return -1;
  }

  const decoder = suggestedDecoder;
  if (!decoder) {
    console.error('Cannot find any suitable decoder');
    return -1;
  }
  console.log(`Using suggested decoder: ${decoder.name} (${decoder.longName})`);

  // Allocate decoder context
  decoderCtx = new CodecContext();
  decoderCtx.allocContext3(decoder);

  // Copy codec parameters
  const paramRet = decoderCtx.parametersToContext(videoStream.codecpar);
  if (paramRet < 0) {
    console.error(`Failed to copy codec parameters: ${new FFmpegError(paramRet).message}`);
    return paramRet;
  }

  // Set hardware device context
  decoderCtx.hwDeviceCtx = hwDeviceCtx;

  // Set hardware pixel format
  const hwPixFmt = getHardwarePixelFormat(deviceType);
  decoderCtx.setHardwarePixelFormat(hwPixFmt, AV_PIX_FMT_NONE);

  // Open decoder
  const openDecoderRet = await decoderCtx.open2(decoder, null);
  if (openDecoderRet < 0) {
    console.error(`Failed to open decoder: ${new FFmpegError(openDecoderRet).message}`);
    return openDecoderRet;
  }

  return 0;
}

/**
 * Initialize encoder after receiving first frame
 */
async function initializeEncoder(encoderCodec: Codec, deviceType: AVHWDeviceType): Promise<number> {
  if (!decoderCtx?.hwFramesCtx) {
    console.error('Decoder hardware frames context not available');
    return -1;
  }

  // Reference the decoder's hardware frames context
  // This is the KEY for zero-copy: encoder uses same hw_frames_ctx as decoder
  encoderCtx!.hwFramesCtx = decoderCtx.hwFramesCtx;

  // Set encoder parameters
  encoderCtx!.timeBase = new Rational(1, 25); // 25 fps
  encoderCtx!.framerate = new Rational(25, 1);
  encoderCtx!.pixelFormat = getHardwarePixelFormat(deviceType);
  encoderCtx!.width = decoderCtx.width;
  encoderCtx!.height = decoderCtx.height;
  encoderCtx!.sampleAspectRatio = decoderCtx.sampleAspectRatio ?? new Rational(1, 1);

  // Set bitrate for better quality
  encoderCtx!.bitRate = 4000000n; // 4 Mbps
  encoderCtx!.gopSize = 60;

  // Open encoder
  const openRet = await encoderCtx!.open2(encoderCodec, null);
  if (openRet < 0) {
    console.error(`Failed to open encoder: ${new FFmpegError(openRet).message}`);
    return openRet;
  }

  // Create output stream
  outputStream = outputCtx!.newStream(encoderCodec);
  if (!outputStream) {
    console.error('Failed to create output stream');
    return -1;
  }

  outputStream.timeBase = encoderCtx!.timeBase;

  // Copy encoder parameters to stream
  const paramRet = encoderCtx!.parametersFromContext(outputStream.codecpar);
  if (paramRet < 0) {
    console.error(`Failed to copy encoder parameters: ${new FFmpegError(paramRet).message}`);
    return paramRet;
  }

  // Write output header
  const writeRet = await outputCtx!.writeHeader(null);
  if (writeRet < 0) {
    console.error(`Failed to write output header: ${new FFmpegError(writeRet).message}`);
    return writeRet;
  }

  initialized = true;
  return 0;
}

/**
 * Encode and write frame
 */
async function encodeWrite(packet: Packet, frame: Frame | null): Promise<number> {
  packet.unref();

  // Send frame to encoder
  const sendRet = await encoderCtx!.sendFrame(frame);
  if (sendRet < 0 && sendRet !== AVERROR_EAGAIN && sendRet !== AVERROR_EOF) {
    console.error(`Error sending frame to encoder: ${new FFmpegError(sendRet).message}`);
    return sendRet;
  }

  // Receive packets from encoder
  while (true) {
    const recvRet = await encoderCtx!.receivePacket(packet);
    if (recvRet === AVERROR_EAGAIN || recvRet === AVERROR_EOF) {
      break;
    }
    if (recvRet < 0) {
      console.error(`Error receiving packet from encoder: ${new FFmpegError(recvRet).message}`);
      return recvRet;
    }

    // Set packet stream index
    packet.streamIndex = 0;

    // Rescale timestamps
    packet.rescaleTs(inputCtx!.streams![videoStreamIndex].timeBase, outputCtx!.streams![0].timeBase);

    // Write packet
    const writeRet = await outputCtx!.interleavedWriteFrame(packet);
    if (writeRet < 0) {
      console.error(`Error writing packet: ${new FFmpegError(writeRet).message}`);
      return writeRet;
    }
  }

  return 0;
}

/**
 * Decode and encode packets
 */
async function decodeEncode(packet: Packet | null, encoderCodec: Codec, deviceType: AVHWDeviceType): Promise<number> {
  // Send packet to decoder
  const sendRet = await decoderCtx!.sendPacket(packet);
  if (sendRet < 0 && sendRet !== AVERROR_EAGAIN && sendRet !== AVERROR_EOF) {
    console.error(`Error sending packet to decoder: ${new FFmpegError(sendRet).message}`);
    return sendRet;
  }

  // Receive frames from decoder
  while (true) {
    const frame = new Frame();
    frame.alloc();

    const recvRet = await decoderCtx!.receiveFrame(frame);
    if (recvRet === AVERROR_EAGAIN || recvRet === AVERROR_EOF) {
      frame.free();
      return 0;
    }
    if (recvRet < 0) {
      console.error(`Error receiving frame from decoder: ${new FFmpegError(recvRet).message}`);
      frame.free();
      return recvRet;
    }

    // Initialize encoder on first frame
    if (!initialized) {
      // Verify we got a hardware frame from decoder
      if (!frame.isHwFrame()) {
        console.warn('WARNING: Decoder produced software frame, not hardware frame!');
      } else {
        console.log('✓ Decoder produced hardware frame (GPU memory)');
      }

      const initRet = await initializeEncoder(encoderCodec, deviceType);
      if (initRet < 0) {
        frame.free();
        return initRet;
      }
    }

    // Encode the frame (stays in GPU memory - zero copy!)
    const encPkt = new Packet();
    encPkt.alloc();
    const encodeRet = await encodeWrite(encPkt, frame);
    encPkt.free();

    if (encodeRet < 0) {
      console.error('Error during encoding');
      frame.free();
      return encodeRet;
    }

    frame.free();
  }
}

/**
 * Main function
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error(`Usage: ${process.argv[1]} <device type> <input file> <encoder codec> <output file>`);
    console.error('Example: tsx examples/hw-transcode.ts videotoolbox input.mp4 h264 output.mp4');
    console.error('Encoder codecs: h264, h265/hevc, vp9 (if supported)');
    return -1;
  }

  const [deviceTypeName, inputFile, codecName, outputFile] = args;

  // Find hardware device type
  const deviceType = HardwareDeviceContext.findTypeByName(deviceTypeName);
  if (deviceType === AV_HWDEVICE_TYPE_NONE) {
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

  try {
    // Create hardware device context
    hwDeviceCtx = new HardwareDeviceContext();
    const createRet = hwDeviceCtx.create(deviceType, null, null);
    if (createRet < 0) {
      console.error(`Failed to create hardware device: ${new FFmpegError(createRet).message}`);
      return createRet;
    }

    console.log(`Using hardware device: ${deviceTypeName}`);

    // Open input file and setup decoder
    const openRet = await openInputFile(inputFile, deviceType);
    if (openRet < 0) {
      return openRet;
    }

    // Find encoder
    const encoderCodec = await getEncoderCodec(hwDeviceCtx, deviceType, codecName);
    if (!encoderCodec) {
      console.error(`Cannot find encoder: ${codecName}`);
      return -1;
    }

    console.log(`Using encoder: ${encoderCodec.name} (${encoderCodec.longName})`);

    // Allocate encoder context
    encoderCtx = new CodecContext();
    encoderCtx.allocContext3(encoderCodec);

    // Create output context
    outputCtx = new FormatContext();
    outputCtx.allocOutputContext2(null, null, outputFile);
    if (!outputCtx) {
      console.error('Failed to create output context');
      return -1;
    }

    // Open output file
    const openOutputRet = await outputCtx.openOutput();
    if (openOutputRet < 0) {
      console.error(`Failed to open output file: ${new FFmpegError(openOutputRet).message}`);
      return openOutputRet;
    }

    console.log('Starting hardware transcoding...');
    let packetCount = 0;

    // Process input packets
    const packet = new Packet();
    packet.alloc();

    while (true) {
      const readRet = await inputCtx!.readFrame(packet);
      if (readRet < 0) {
        if (readRet === AVERROR_EOF) {
          // Flush decoder
          await decodeEncode(null, encoderCodec, deviceType);

          // Flush encoder
          if (initialized) {
            const encPkt = new Packet();
            encPkt.alloc();
            await encodeWrite(encPkt, null);
            encPkt.free();
          }
          break;
        }
        console.error(`Error reading packet: ${new FFmpegError(readRet).message}`);
        packet.free();
        return readRet;
      }

      // Process only video packets
      if (packet.streamIndex === videoStreamIndex) {
        const ret = await decodeEncode(packet, encoderCodec, deviceType);
        if (ret < 0) {
          packet.free();
          return ret;
        }

        packetCount++;
        if (packetCount % 100 === 0) {
          console.log(`Processed ${packetCount} packets...`);
        }
      }

      packet.unref();
    }

    packet.free();

    // Write trailer
    if (initialized) {
      const trailerRet = await outputCtx.writeTrailer();
      if (trailerRet < 0) {
        console.error(`Failed to write trailer: ${new FFmpegError(trailerRet).message}`);
        return trailerRet;
      }
    }

    console.log(`Hardware transcoding completed! Processed ${packetCount} video packets.`);
    return 0;
  } catch (error) {
    console.error('Error:', error);
    return -1;
  } finally {
    // Cleanup
    if (decoderCtx) {
      decoderCtx.freeContext();
    }

    if (encoderCtx) {
      encoderCtx.freeContext();
    }

    if (inputCtx) {
      await inputCtx.closeInput();
    }

    if (outputCtx) {
      await outputCtx.closeOutput();
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
