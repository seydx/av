<p align="center">
  <img src="https://github.com/seydx/node-av/blob/main/docs/logo.png?raw=true" width="250px">
</p>

# NodeAV

[![npm version](https://img.shields.io/npm/v/node-av.svg)](https://www.npmjs.com/package/node-av)
[![npm downloads](https://img.shields.io/npm/dm/node-av.svg)](https://www.npmjs.com/package/node-av)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-7.1.2-green.svg)](https://ffmpeg.org)
[![Platform](https://img.shields.io/badge/platform-Windows%20(MSVC%20%7C%20MinGW)%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/seydx/node-av/tree/main/INSTALLATION.md)

Native Node.js bindings for FFmpeg with full TypeScript support. Provides direct access to FFmpeg's C APIs through N-API. Includes both raw FFmpeg bindings for full control and higher-level abstractions. Automatic resource management via Disposable pattern, hardware acceleration support and prebuilt binaries for Windows, Linux, and macOS.

📚 **[Documentation](https://seydx.github.io/node-av)**

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Low-Level API](#low-level-api)
  - [High-Level API](#high-level-api)
  - [Pipeline API](#pipeline-api)
- [Hardware Acceleration](#hardware-acceleration)
  - [Auto-Detection](#auto-detection)
  - [Specific Hardware](#specific-hardware)
- [Imports and Tree Shaking](#imports-and-tree-shaking)
- [Stream Processing](#stream-processing)
  - [From Files](#from-files)
  - [From Network](#from-network)
  - [From Buffers](#from-buffers)
  - [Raw Media Processing](#raw-media-processing)
- [Resource Management](#resource-management)
- [FFmpeg Binary Access](#ffmpeg-binary-access)
- [Performance](#performance)
  - [Sync vs Async Operations](#sync-vs-async-operations)
- [Memory Safety Considerations](#memory-safety-considerations)
- [Examples](#examples)
- [Prebuilt Binaries](#prebuilt-binaries)
- [License](#license)
- [Contributing](#contributing)
- [Support](#support)
- [See Also](#see-also)

## Installation

```bash
npm install node-av
```

## Quick Start

### Low-Level API

Direct access to FFmpeg's C APIs with minimal abstractions. Perfect when you need full control over FFmpeg functionality.

```typescript
import { AVERROR_EOF, AVMEDIA_TYPE_VIDEO } from 'node-av/constants';
import { Codec, CodecContext, FFmpegError, FormatContext, Frame, Packet, Rational } from 'node-av/lib';

// Open input file
await using ifmtCtx = new FormatContext();

let ret = await ifmtCtx.openInput('input.mp4');
FFmpegError.throwIfError(ret, 'Could not open input file');

ret = await ifmtCtx.findStreamInfo();
FFmpegError.throwIfError(ret, 'Could not find stream info');

// Find video stream
const videoStreamIndex = ifmtCtx.findBestStream(AVMEDIA_TYPE_VIDEO);
const videoStream = ifmtCtx.streams?.[videoStreamIndex];

if (!videoStream) {
  throw new Error('No video stream found');
}

// Create codec
const codec = Codec.findDecoder(videoStream.codecpar.codecId);
if (!codec) {
  throw new Error('Codec not found');
}

// Allocate codec context for the decoder
using decoderCtx = new CodecContext();
decoderCtx.allocContext3(codec);

ret = decoderCtx.parametersToContext(videoStream.codecpar);
FFmpegError.throwIfError(ret, 'Could not copy codec parameters to decoder context');

// Inform the decoder about the timebase for packet timestamps and the frame rate
decoderCtx.pktTimebase = videoStream.timeBase;
decoderCtx.framerate = videoStream.rFrameRate || videoStream.avgFrameRate || new Rational(25, 1);

// Open decoder context
ret = await decoderCtx.open2(codec, null);
FFmpegError.throwIfError(ret, 'Could not open codec');

// Process packets
using packet = new Packet();
packet.alloc();

using frame = new Frame();
frame.alloc();

while (true) {
  let ret = await ifmtCtx.readFrame(packet);
  if (ret < 0) {
    break;
  }

  if (packet.streamIndex === videoStreamIndex) {
    // Send packet to decoder
    ret = await decoderCtx.sendPacket(packet);
    if (ret < 0 && ret !== AVERROR_EOF) {
      FFmpegError.throwIfError(ret, 'Error sending packet to decoder');
    }

    // Receive decoded frames
    while (true) {
      const ret = await decoderCtx.receiveFrame(frame);
      if (ret === AVERROR_EOF || ret < 0) {
        break;
      }

      console.log(`Decoded frame ${frame.pts}, size: ${frame.width}x${frame.height}`);

      // Process frame data...
    }
  }

  packet.unref();
}
```

### High-Level API

Higher-level abstractions for common tasks like decoding, encoding, filtering, and transcoding. Easier to use while still providing access to low-level details when needed.

```typescript
import { Decoder, Encoder, MediaInput, MediaOutput } from 'node-av/api';
import { FF_ENCODER_LIBX264 } from 'node-av/constants';

// Open media
await using input = await MediaInput.open('input.mp4');
await using output = await MediaOutput.open('output.mp4');

// Get video stream
const videoStream = input.video()!;

// Create decoder
using decoder = await Decoder.create(videoStream);

// Create encoder
using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
});

// Add stream to output
const outputIndex = output.addStream(encoder);

// Process packets
for await (using packet of input.packets(videoStream.index)) {
  using frame = await decoder.decode(packet);
  if (frame) {
    using encoded = await encoder.encode(frame);
    if (encoded) {
      await output.writePacket(encoded, outputIndex);
    }
  }
}

// Flush decoder
for await (using frame of decoder.flushFrames()) {
  using encoded = await encoder.encode(frame);
  if (encoded) {
    await output.writePacket(encoded, outputIndex);
  }
}

// Flush encoder
for await (using packet of encoder.flushPackets()) {
  await output.writePacket(packet, outputIndex);
}

// Done
```

### Pipeline API

A simple way to chain together multiple processing steps like decoding, filtering, encoding, and muxing.

```typescript
import { pipeline, MediaInput, MediaOutput, Decoder, Encoder } from 'node-av/api';

// Simple transcode pipeline: input → decoder → encoder → output
const input = await MediaInput.open('input.mp4');
const output = await MediaOutput.open('output.mp4');
const decoder = await Decoder.create(input.video());
const encoder = await Encoder.create(FF_ENCODER_LIBX264, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
});

const control = pipeline(input, decoder, encoder, output);
await control.completion;
```

## Hardware Acceleration

The library supports all hardware acceleration methods available in FFmpeg. The specific hardware types available depend on your FFmpeg build and system configuration.

### Auto-Detection

```typescript
import { HardwareContext } from 'node-av/api';
import { FF_ENCODER_LIBX264 } from 'node-av/constants';

// Automatically detect best available hardware
const hw = HardwareContext.auto();
console.log(`Using hardware: ${hw.deviceTypeName}`);

// Use with decoder
const decoder = await Decoder.create(stream, {
  hardware: hw
});

// Use with encoder (use hardware-specific codec)
const encoderCodec = hw?.getEncoderCodec('h264') ?? FF_ENCODER_LIBX264;
const encoder = await Encoder.create(encoderCodec, {
  timeBase: videoStream.timeBase,
  frameRate: videoStream.avgFrameRate,
});
```

### Specific Hardware

```typescript
import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI } from 'node-av/constants';

// Use specific hardware type
const cuda = HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
const vaapi = HardwareContext.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
```

## Imports and Tree Shaking

The library provides multiple entry points for optimal tree shaking:

```typescript
// High-Level API only - Recommended for most use cases
import { MediaInput, MediaOutput, Decoder, Encoder } from 'node-av/api';

// Low-Level API only - Direct FFmpeg bindings
import { FormatContext, CodecContext, Frame, Packet } from 'node-av/lib';

// Constants only - When you just need FFmpeg constants
import { AV_PIX_FMT_YUV420P, AV_CODEC_ID_H264 } from 'node-av/constants';

// Channel layouts only - For audio channel configurations
import { AV_CHANNEL_LAYOUT_STEREO, AV_CHANNEL_LAYOUT_5POINT1 } from 'node-av/layouts';

// Default export - Includes everything
import * as ffmpeg from 'node-av';
```

## Stream Processing

### From Files

```typescript
const media = await MediaInput.open('input.mp4');
```

### From Network

```typescript
const media = await MediaInput.open('rtsp://example.com/stream');
```

### From Buffers

```typescript
import { readFile } from 'fs/promises';

const buffer = await readFile('input.mp4');
const media = await MediaInput.open(buffer);
```

### Raw Media Processing

```typescript
// Raw video input
const rawVideo = await MediaInput.open({
  type: 'video',
  input: 'input.yuv',
  width: 1280,
  height: 720,
  pixelFormat: AV_PIX_FMT_YUV420P,
  frameRate: { num: 30, den: 1 }
});

// Raw audio input
const rawAudio = await MediaInput.open({
  type: 'audio',
  input: 'input.pcm',
  sampleRate: 48000,
  channels: 2,
  sampleFormat: AV_SAMPLE_FMT_S16
}, {
  format: 's16le'
});
```

## Resource Management

The library supports automatic resource cleanup using the Disposable pattern:

```typescript
// Automatic cleanup with 'using'
{
  await using media = await MediaInput.open('input.mp4');
  using decoder = await Decoder.create(media.video());
  // Resources automatically cleaned up at end of scope
}

// Manual cleanup
const media = await MediaInput.open('input.mp4');
try {
  // Process media
} finally {
  await media.close();
}
```

## FFmpeg Binary Access

Need direct access to the FFmpeg binary? The library provides an easy way to get FFmpeg binaries that automatically downloads and manages platform-specific builds.

```typescript
import { ffmpegPath, isFfmpegAvailable } from 'node-av/ffmpeg';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Check if FFmpeg binary is available
if (isFfmpegAvailable()) {
  console.log('FFmpeg binary found at:', ffmpegPath());

  // Use FFmpeg binary directly
  const { stdout } = await execFileAsync(ffmpegPath(), ['-version']);
  console.log(stdout);
} else {
  console.log('FFmpeg binary not available - install may have failed');
}

// Direct usage example
async function convertVideo(input: string, output: string) {
  const args = [
    '-i', input,
    '-c:v', 'libx264',
    '-crf', '23',
    '-c:a', 'aac',
    output
  ];

  await execFileAsync(ffmpegPath(), args);
}
```

The FFmpeg binary is automatically downloaded during installation from GitHub releases and matches the same build used by the native bindings.

## Performance

NodeAV executes all media operations directly through FFmpeg's native C libraries. The Node.js bindings add minimal overhead - mostly just the JavaScript-to-C boundary crossings. During typical operations like transcoding or filtering, most processing time is spent in FFmpeg's optimized C code.

### Sync vs Async Operations

Every async method in NodeAV has a corresponding synchronous variant with the `Sync` suffix:

- **Async methods** (default) - Non-blocking operations using N-API's AsyncWorker. Methods like `decode()`, `encode()`, `read()`, `packets()` return Promises or AsyncGenerators.

- **Sync methods** - Direct FFmpeg calls without AsyncWorker overhead. Same methods with `Sync` suffix: `decodeSync()`, `encodeSync()`, `readSync()`, `packetsSync()`.

The key difference: Async methods don't block the Node.js event loop, allowing other operations to run concurrently. Sync methods block until completion but avoid AsyncWorker overhead, making them faster for sequential processing.

## Memory Safety Considerations

NodeAV provides direct bindings to FFmpeg's C APIs, which work with raw memory pointers. The high-level API adds safety abstractions and automatic resource management, but incorrect usage can still cause crashes. Common issues include mismatched video dimensions, incompatible pixel formats, or improper frame buffer handling. The library validates parameters where possible, but can't guarantee complete memory safety without limiting functionality. When using the low-level API, pay attention to parameter consistency, resource cleanup, and format compatibility. Following the documented patterns helps avoid memory-related issues.

## Examples

| Example | FFmpeg | Low-Level API | High-Level API |
|---------|--------|---------------|----------------|
| `api-encode-decode` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-encode-decode.ts) |
| `api-frame-extract` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-frame-extract.ts) |
| `api-hw-decode-sw-encode` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-decode-sw-encode.ts) |
| `api-hw-raw` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-raw.ts) |
| `api-hw-rtsp-custom-io` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-rtsp-custom-io.ts) |
| `api-hw-rtsp` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-rtsp.ts) |
| `api-hw-transcode` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-transcode.ts) |
| `api-hw-filter-sync` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-hw-filter-sync.ts) |
| `api-muxing` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-muxing.ts) |
| `api-pipeline-hw-rtsp` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-pipeline-hw-rtsp.ts) |
| `api-pipeline-raw-muxing` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-pipeline-raw-muxing.ts) |
| `api-stream-input` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-stream-input.ts) |
| `api-sw-decode-hw-encode` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-sw-decode-hw-encode.ts) |
| `api-sw-transcode` | | | [✓](https://github.com/seydx/node-av/tree/main/examples/api-sw-transcode.ts) |
| `avio-read-callback` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/avio_read_callback.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/avio-read-callback.ts) | |
| `decode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_audio.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/decode-audio.ts) | |
| `decode-filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_audio.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/decode-filter-audio.ts) | |
| `decode-filter-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_video.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/decode-filter-video.ts) | |
| `decode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_video.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/decode-video.ts) | |
| `demux-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/demux_decode.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/demux-decode.ts) | |
| `encode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_audio.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/encode-audio.ts) | |
| `encode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_video.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/encode-video.ts) | |
| `ffprobe-metadata` | | [✓](https://github.com/seydx/node-av/tree/main/examples/ffprobe-metadata.ts) | |
| `filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/filter_audio.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/filter-audio.ts) | |
| `hw-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/hw_decode.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/hw-decode.ts) | |
| `hw-encode` | | [✓](https://github.com/seydx/node-av/tree/main/examples/hw-encode.ts) | |
| `hw-transcode` | | [✓](https://github.com/seydx/node-av/tree/main/examples/hw-transcode.ts) | |
| `qsv-decode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_decode.c) | | |
| `qsv-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_transcode.c) | | |
| `vaapi-encode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_encode.c) | | |
| `vaapi-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_transcode.c) | | |
| `mux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/mux.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/mux.ts) | |
| `remux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/remux.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/remux.ts) | |
| `resample-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/resample_audio.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/resample-audio.ts) | |
| `scale-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/scale_video.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/scale-video.ts) | |
| `show-metadata` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/show_metadata.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/show-metadata.ts) | |
| `transcode-aac` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode_aac.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/transcode-aac.ts) | |
| `transcode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode.c) | [✓](https://github.com/seydx/node-av/tree/main/examples/transcode.ts) | |


## Prebuilt Binaries

Prebuilt binaries are available for multiple platforms:

- **macOS**: x64, ARM64
- **Linux**: x64, ARM64
- **Windows**: x64, ARM64 (automatic MSVC/MinGW selection)

For detailed installation instructions, build requirements, and troubleshooting, see the **[Installation Guide](https://github.com/seydx/node-av/tree/main/INSTALLATION.md)**.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

**Important**: FFmpeg itself is licensed under LGPL/GPL. Please ensure compliance with FFmpeg's license terms when using this library. The FFmpeg libraries themselves retain their original licenses, and this wrapper library does not change those terms. See [FFmpeg License](https://ffmpeg.org/legal.html) for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](https://github.com/seydx/node-av/tree/main/CONTRIBUTING.md) for development setup, code standards, and contribution guidelines before submitting pull requests.

## Support

For issues and questions, please use the GitHub issue tracker.

## See Also

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Doxygen](https://ffmpeg.org/doxygen/trunk/)
- [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg)
- [FFmpeg MSVC](https://github.com/seydx/ffmpeg-msvc-prebuilt)
