/**
 * Hardware Decoding with Filtering Example
 *
 * This example demonstrates hardware-accelerated video decoding
 * combined with filtering operations on the GPU.
 *
 * Use cases:
 * - Fast video processing with GPU acceleration
 * - Real-time video filtering
 * - Efficient transcoding pipelines
 * - Video analysis with minimal CPU usage
 *
 * The pipeline:
 * 1. Setup hardware device context (CUDA, VAAPI, etc.)
 * 2. Create hardware decoder
 * 3. Decode frames on GPU
 * 4. Apply filters while keeping frames on GPU
 * 5. Optional: Transfer back to CPU for output
 */

import type { AVPixelFormat, CodecParameters, FilterPipelineConfig, Stream } from '../../src/lib/index.js';
import {
  AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_VIDEOTOOLBOX,
  Codec,
  CodecContext,
  FilterGraph,
  FormatContext,
  Frame,
  HardwareDeviceContext,
  Packet,
  Rational,
} from '../../src/lib/index.js';

import { config, ffmpegLog } from '../index.js';

// Global state for the filtering pipeline
let filterGraph: FilterGraph | null = null;

/**
 * Check if a codec supports hardware acceleration
 */
function checkHardwareSupport(codec: Codec, deviceType: number): AVPixelFormat | null {
  const configs = codec.getHardwareConfigs();

  for (const config of configs) {
    if (config.deviceType === deviceType && config.methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) {
      return config.pixelFormat;
    }
  }

  return null;
}

/**
 * Initialize the filter graph for hardware frames
 */
function initFilter(decodedFrame: Frame, hardwarePixelFormat: number, filterString: string, decoderContext: CodecContext): void {
  console.log('\nInitializing filter graph...');
  console.log(`  Frame format: ${decodedFrame.format}`);
  console.log(`  Frame width: ${decodedFrame.width}`);
  console.log(`  Frame height: ${decodedFrame.height}`);
  console.log(`  Hardware pixel format: ${hardwarePixelFormat}`);
  console.log(`  Has hw_frames_ctx: ${decodedFrame.hwFramesContext !== null}`);

  // Allocate filter graph
  filterGraph = new FilterGraph();

  // Build the filter pipeline with the new API
  // For hardware frames, we need to pass the frame itself which contains the hardware frames context
  const config: FilterPipelineConfig = {
    input: {
      width: decodedFrame.width,
      height: decodedFrame.height,
      pixelFormat: decodedFrame.format as AVPixelFormat, // Cast to pixel format since this is a video frame
      timeBase: new Rational(1, 1),
      sampleAspectRatio: decodedFrame.sampleAspectRatio || { num: 1, den: 1 },
      hwFramesContext: decodedFrame.hwFramesContext ?? undefined, // Pass the hardware frames context directly
    },
    filters: filterString || 'null', // Use null filter for pass-through
    hardware:
      decodedFrame.hwFramesContext && decoderContext.hwDeviceContext
        ? {
            deviceContext: decoderContext.hwDeviceContext,
          }
        : undefined,
  };

  // Build the pipeline
  filterGraph.buildPipeline(config);

  console.log(`Filter graph initialized with: ${filterString || 'null'}`);
}

/**
 * Filter a hardware frame through the filter graph
 */
async function filterFrame(decodedFrame: Frame, filteredFrame: Frame): Promise<boolean> {
  if (!filterGraph) {
    throw new Error('Filter graph not initialized');
  }

  // Process frame through the filter graph
  const ret = await filterGraph.processFrame(decodedFrame, filteredFrame);

  if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
    return false; // No frame available
  }
  if (ret < 0) {
    throw new Error(`Failed to process frame: ${ret}`);
  }

  return true;
}

/**
 * Process a frame (either filtered or unfiltered)
 */
async function processHardwareFrame(frame: Frame, frameCount: number): Promise<void> {
  // For this example, we just transfer to CPU and log info
  // using cpuFrame = new Frame();

  // Transfer hardware frame to CPU
  // frame.transferDataTo(cpuFrame);

  console.log(`  Frame #${frameCount}:`);
  console.log(`    Resolution: ${frame.width}x${frame.height}`);
  console.log(`    Format: ${frame.format}`);
  console.log(`    PTS: ${frame.pts}`);
  console.log(`    Key frame: ${frame.keyFrame}`);

  // In a real application, you would encode or save the frame here
}

/**
 * Main hardware decoding and filtering function
 */
async function hardwareDecodingFiltering(inputFile: string, filterString: string | null) {
  console.log('=== Hardware Decoding with Filtering ===\n');
  console.log(`Input: ${inputFile}`);
  console.log('Hardware type: VideoToolbox');
  console.log(`Filter: ${filterString ?? 'none'}`);

  // Create hardware device context
  const hardwareDeviceContext = new HardwareDeviceContext(AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
  console.log('\nHardware device context created');

  // Allocate frames
  using decodedHardwareFrame = new Frame();
  using filteredHardwareFrame = new Frame();
  using packet = new Packet();

  // Open input
  using formatContext = new FormatContext();
  await formatContext.openInputAsync(inputFile);
  await formatContext.findStreamInfoAsync();

  // Find video stream
  let videoStream: Stream | null = null;
  let codecParams: CodecParameters | null = null;

  for (const stream of formatContext.streams) {
    const params = stream.codecParameters;
    if (params && params.codecType === AV_MEDIA_TYPE_VIDEO) {
      videoStream = stream;
      codecParams = params;
      break;
    }
  }

  if (!videoStream || !codecParams) {
    throw new Error('No video stream found');
  }

  console.log('\nVideo stream found:');
  console.log(`  Codec: ${codecParams.codecId}`);
  console.log(`  Resolution: ${codecParams.width}x${codecParams.height}`);
  console.log(`  Pixel format: ${codecParams.pixelFormat}`);

  // Find decoder for the codec
  const decoder = Codec.findDecoder(codecParams.codecId);
  if (!decoder) {
    throw new Error('Decoder not found');
  }

  // Check if decoder supports hardware acceleration
  const hwPixelFormat = checkHardwareSupport(decoder, AV_HWDEVICE_TYPE_VIDEOTOOLBOX);
  if (!hwPixelFormat) {
    console.warn('\nWarning: Hardware decoding not supported for this codec');
    console.log('Falling back to software decoding');
  } else {
    console.log(`\nHardware pixel format: ${hwPixelFormat}`);
  }

  // Create decoder context
  using decoderContext = new CodecContext(decoder);
  codecParams.toCodecContext(decoderContext);

  // Configure hardware acceleration if supported
  if (hwPixelFormat) {
    decoderContext.hwDeviceContext = hardwareDeviceContext;
    decoderContext.setHardwarePixelFormat(hwPixelFormat);
    console.log('Hardware acceleration enabled for decoder');
  }

  // Open decoder
  await decoderContext.openAsync();
  console.log('\nDecoder opened successfully');
  console.log(`Decoder: ${decoder.name}`);

  // Decoding loop
  let frameCount = 0;
  let totalFrames = 0;
  const maxFrames = 100; // Process first 100 frames for demo

  console.log('\nProcessing frames...');

  while (totalFrames < maxFrames) {
    // Read packet
    const readRet = await formatContext.readFrameAsync(packet);
    if (readRet === AV_ERROR_EOF) {
      break;
    }
    if (readRet < 0) {
      throw new Error(`Error reading frame: ${readRet}`);
    }

    // Skip non-video packets
    if (packet.streamIndex !== videoStream.index) {
      packet.unref();
      continue;
    }

    // Send packet to decoder
    const sendRet = await decoderContext.sendPacketAsync(packet);
    packet.unref();

    if (sendRet < 0 && sendRet !== AV_ERROR_EAGAIN) {
      throw new Error(`Error sending packet: ${sendRet}`);
    }

    // Receive frames
    while (true) {
      const recvRet = await decoderContext.receiveFrameAsync(decodedHardwareFrame);
      if (recvRet === AV_ERROR_EAGAIN || recvRet === AV_ERROR_EOF) {
        break;
      }
      if (recvRet < 0) {
        throw new Error(`Error receiving frame: ${recvRet}`);
      }

      frameCount++;
      totalFrames++;

      // Verify we got a hardware frame
      if (hwPixelFormat && decodedHardwareFrame.format !== hwPixelFormat) {
        console.log(`Warning: Expected format ${hwPixelFormat}, got ${decodedHardwareFrame.format}`);
      }

      // Apply filter if requested
      if (filterString) {
        // Initialize filter on first frame
        if (!filterGraph) {
          initFilter(decodedHardwareFrame, hwPixelFormat ?? AV_PIX_FMT_VIDEOTOOLBOX, filterString, decoderContext);
        }

        // Filter the frame
        const filtered = await filterFrame(decodedHardwareFrame, filteredHardwareFrame);
        if (filtered) {
          await processHardwareFrame(filteredHardwareFrame, frameCount);
          filteredHardwareFrame.unref();
        }
      } else {
        // Process unfiltered frame
        await processHardwareFrame(decodedHardwareFrame, frameCount);
      }

      decodedHardwareFrame.unref();

      // Log progress
      if (frameCount % 10 === 0) {
        console.log(`  Processed ${frameCount} frames...`);
      }

      if (totalFrames >= maxFrames) {
        break;
      }
    }
  }

  // Flush the filter graph if we were filtering
  if (filterString && filterGraph) {
    console.log('\nFlushing filter graph...');

    // Send null frame to flush
    const flushRet = await filterGraph.processFrame(null, filteredHardwareFrame);
    if (flushRet >= 0) {
      // Get any remaining frames
      while (true) {
        const getRet = await filterGraph.getFilteredFrame(filteredHardwareFrame);
        if (getRet === AV_ERROR_EAGAIN || getRet === AV_ERROR_EOF) {
          break;
        }
        if (getRet >= 0) {
          frameCount++;
          await processHardwareFrame(filteredHardwareFrame, frameCount);
          filteredHardwareFrame.unref();
        }
      }
    }
  }

  console.log(`\nTotal frames processed: ${frameCount}`);

  // Cleanup filter graph
  if (filterGraph) {
    filterGraph.free();
  }
}

async function main() {
  ffmpegLog('hardware-decoding-filtering', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  const inputFile = 'rtsp://admin:password@192.168.178.142/Streaming/channels/101';
  // Filter string for VideoToolbox - test with simple pass-through filter
  const filterString = 'scale_vt=640:360'; // Simple pass-through filter

  try {
    console.log('Hardware Decoding with Filtering Example\n');
    console.log('This example demonstrates GPU-accelerated video processing.\n');

    await hardwareDecodingFiltering(inputFile, filterString);

    console.log('\n=== Success ===');
    console.log('Hardware decoding and filtering completed successfully!');
    console.log('\nNote: This example requires compatible hardware and drivers.');
    console.log('If it fails, try different hardware types or use software decoding.');
  } catch (error) {
    console.error('\nError:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check if your GPU supports the specified hardware type');
    console.error('2. Ensure proper drivers are installed');
    console.error('3. Try different HW_TYPE values (cuda, vaapi, videotoolbox)');
    console.error('4. Try without HW_FILTER for decoding-only test');
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
