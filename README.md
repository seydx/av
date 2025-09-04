# NodeAV

Native Node.js bindings for FFmpeg with full TypeScript support. Provides direct access to FFmpeg's C APIs through N-API. Includes both raw FFmpeg bindings for full control and higher-level abstractions. Automatic resource management via Disposable pattern, hardware acceleration support and prebuilt binaries for Windows, Linux, and macOS.

## Installation

```bash
npm install node-av
```

## Quick Start

### High-Level API

```typescript
import { Decoder, Encoder, MediaInput, MediaOutput } from 'node-av/api';
import { FF_ENCODER_LIBX264 } from 'node-av/constants';

// Open media
await using input = await MediaInput.open('input.mp4');
await using output = await MediaOutput.open('output.mp4');

// Get video stream
const videoStream = input.video();

// Create decoder/encoder
using decoder = await Decoder.create(videoStream!);
using encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo(), {
  bitrate: '2M',
  gopSize: 60,
});

// Add stream to output
const outputIndex = output.addStream(encoder);
await output.writeHeader();

// Process packets
for await (const packet of input.packets()) {
  if (packet.streamIndex === videoStream!.index) {
    using frame = await decoder.decode(packet);
    if (frame) {
      using encoded = await encoder.encode(frame);
      if (encoded) {
        await output.writePacket(encoded, outputIndex);
      }
    }
  }
}

// Flush decoder/encoder
for await (const frame of decoder.flushFrames()) {
  using encoded = await encoder.encode(frame);
  if (encoded) {
    await output.writePacket(encoded, outputIndex);
  }
}

for await (const packet of encoder.flushPackets()) {
  await output.writePacket(packet, outputIndex);
}

// End
await output.writeTrailer();
```

### Pipeline API

```typescript
import { pipeline, MediaInput, MediaOutput, Decoder, Encoder } from 'node-av/api';

// Simple transcode pipeline: input → decoder → encoder → output
const input = await MediaInput.open('input.mp4');
const output = await MediaOutput.open('output.mp4');
const decoder = await Decoder.create(input.video());
const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo(), {
  bitrate: '2M',
  gopSize: 60
});

const control = pipeline(input, decoder, encoder, output);
await control.completion;

// The pipeline automatically handles:
// - Flow control between components
// - Resource management and cleanup
// - Error propagation
// - Backpressure handling
```

## More Examples

The `examples/` directory contains comprehensive examples for all API levels:

**High-Level API** (`api-*.ts`)
- Hardware acceleration, muxing, streaming, custom I/O, and more

**Low-Level API** (direct FFmpeg bindings)
- Ported FFmpeg C examples showing fine-grained control

**Pipeline API** (`api-pipeline-*.ts`)
- Complex workflows with automatic flow control

See the [Examples Table](#examples) for a complete list.

## Hardware Acceleration

The library supports all hardware acceleration methods available in FFmpeg. The specific hardware types available depend on your FFmpeg build and system configuration.

### Auto-Detection

```typescript
import { HardwareContext } from 'node-av/api';
import { FF_ENCODER_H264_VIDEOTOOLBOX } from 'node-av/constants';

// Automatically detect best available hardware
const hw = await HardwareContext.auto();
if (hw) {
  console.log(`Using hardware: ${hw.deviceTypeName}`);
  
  // Use with decoder
  const decoder = await Decoder.create(stream, {
    hardware: hw
  });
  
  // Use with encoder (use hardware-specific codec)
  const encoder = await Encoder.create(FF_ENCODER_H264_VIDEOTOOLBOX, decoder.getOutputStreamInfo(), {
    hardware: hw
  });
}
```

### Specific Hardware

```typescript
import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI } from 'node-av/constants';

// Use specific hardware type
const cuda = await HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
const vaapi = await HardwareContext.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
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

## Performance

NodeAV executes all media operations directly through FFmpeg's native C libraries. The Node.js bindings add minimal overhead - mostly just the JavaScript-to-C boundary crossings. During typical operations like transcoding or filtering, most processing time is spent in FFmpeg's optimized C code. You get full access to hardware acceleration, SIMD optimizations, and multi-threading capabilities.

Heavy and I/O operations are executed asynchronously using N-API's AsyncWorker, preventing FFmpeg calls from blocking the Node.js event loop.

## Memory Safety Considerations

NodeAV provides direct bindings to FFmpeg's C APIs, which work with raw memory pointers. The high-level API adds safety abstractions and automatic resource management, but incorrect usage can still cause crashes. Common issues include mismatched video dimensions, incompatible pixel formats, or improper frame buffer handling. The library validates parameters where possible, but can't guarantee complete memory safety without limiting functionality. When using the low-level API, pay attention to parameter consistency, resource cleanup, and format compatibility. Following the documented patterns helps avoid memory-related issues.

## Examples

| Example | FFmpeg | Low-Level API | High-Level API |
|---------|--------|---------------|----------------|
| `api-encode-decode` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-encode-decode.ts |
| `api-frame-extract` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-frame-extract.ts |
| `api-hw-decode-sw-encode` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-hw-decode-sw-encode.ts |
| `api-hw-raw` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-hw-raw.ts |
| `api-hw-rtsp-custom-io` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-hw-rtsp-custom-io.ts |
| `api-hw-rtsp` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-hw-rtsp.ts |
| `api-hw-transcode` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-hw-transcode.ts |
| `api-muxing` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-muxing.ts |
| `api-pipeline-hw-rtsp` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-pipeline-hw-rtsp.ts |
| `api-pipeline-raw-muxing` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-pipeline-raw-muxing.ts |
| `api-stream-input` | | | [✓](https://github.com/seydx/av/tree/main/examples/api-stream-input.ts |
| `api-sw-decode-hw-encode` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-sw-decode-hw-encode.ts |
| `api-sw-transcode` | | | [✓]https://github.com/seydx/av/tree/main/examples/api-sw-transcode.ts |
| `avio-read-callback` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/avio_read_callback.c) | [✓]https://github.com/seydx/av/tree/main/examples/avio-read-callback.ts | |
| `decode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_audio.c) | [✓]https://github.com/seydx/av/tree/main/examples/decode-audio.ts | |
| `decode-filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_audio.c) | [✓]https://github.com/seydx/av/tree/main/examples/decode-filter-audio.ts | |
| `decode-filter-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_video.c) | [✓]https://github.com/seydx/av/tree/main/examples/decode-filter-video.ts | |
| `decode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_video.c) | [✓]https://github.com/seydx/av/tree/main/examples/decode-video.ts | |
| `demux-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/demux_decode.c) | [✓]https://github.com/seydx/av/tree/main/examples/demux-decode.ts | |
| `encode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_audio.c) | [✓]https://github.com/seydx/av/tree/main/examples/encode-audio.ts | |
| `encode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_video.c) | [✓]https://github.com/seydx/av/tree/main/examples/encode-video.ts | |
| `ffprobe-metadata` | | [✓]https://github.com/seydx/av/tree/main/examples/ffprobe-metadata.ts | |
| `filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/filter_audio.c) | [✓]https://github.com/seydx/av/tree/main/examples/filter-audio.ts | |
| `hw-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/hw_decode.c) | [✓]https://github.com/seydx/av/tree/main/examples/hw-decode.ts | |
| `hw-encode` | | [✓]https://github.com/seydx/av/tree/main/examples/hw-encode.ts | |
| `hw-transcode` | | [✓]https://github.com/seydx/av/tree/main/examples/hw-transcode.ts | |
| `qsv-decode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_decode.c) | | |
| `qsv-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_transcode.c) | | |
| `vaapi-encode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_encode.c) | | |
| `vaapi-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_transcode.c) | | |
| `mux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/mux.c) | [✓]https://github.com/seydx/av/tree/main/examples/mux.ts | |
| `remux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/remux.c) | [✓]https://github.com/seydx/av/tree/main/examples/remux.ts | |
| `resample-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/resample_audio.c) | [✓]https://github.com/seydx/av/tree/main/examples/resample-audio.ts | |
| `scale-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/scale_video.c) | [✓]https://github.com/seydx/av/tree/main/examples/scale-video.ts | |
| `show-metadata` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/show_metadata.c) | [✓]https://github.com/seydx/av/tree/main/examples/show-metadata.ts | |
| `transcode-aac` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode_aac.c) | [✓]https://github.com/seydx/av/tree/main/examples/transcode-aac.ts | |
| `transcode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode.c) | [✓]https://github.com/seydx/av/tree/main/examples/transcode.ts | |


## Prebuilt Binaries

Prebuilt binaries are available for macOS, Linux, and Windows (x64/arm64). The package will automatically build from source if needed.

For detailed installation instructions, build requirements, and troubleshooting, see the **[Installation Guide](https://github.com/seydx/av/tree/main/INSTALLATION.md)**.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

**Important**: FFmpeg itself is licensed under LGPL/GPL. Please ensure compliance with FFmpeg's license terms when using this library. The FFmpeg libraries themselves retain their original licenses, and this wrapper library does not change those terms. See [FFmpeg License](https://ffmpeg.org/legal.html) for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTION.md](https://github.com/seydx/av/tree/main/CONTRIBUTION.md) for development setup, code standards, and contribution guidelines before submitting pull requests.

## Support

For issues and questions, please use the GitHub issue tracker.

## See Also

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Doxygen](https://ffmpeg.org/doxygen/trunk/)
- [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg)
