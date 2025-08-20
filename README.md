# @seydx/av - Node.js FFmpeg Bindings

Native Node.js bindings for FFmpeg libraries, providing both low-level and high-level APIs for audio/video processing.

## Features

- **High-Level API** - Simplified interfaces for common media processing tasks
- **Low-Level API** - Direct access to FFmpeg's full capabilities  
- **Hardware Acceleration** - Automatic detection and configuration of all hardware types supported by FFmpeg
- **Async/Await** - Modern asynchronous API with async generators
- **Memory Safety** - Automatic resource management with Disposable pattern
- **Type Safety** - Full TypeScript support with detailed type definitions
- **Stream Support** - Process media from Node.js streams and buffers
- **Pipeline API** - Streamlined media processing with automatic flow control

## Installation

```bash
npm install @seydx/av
```

## Requirements

- Node.js 22.18.0 or later (LTS version)
- FFmpeg 7.1 or later (libavcodec, libavformat, libavfilter, libavutil, libswscale, libswresample)
- Python 3.x (for node-gyp)

## Quick Start

### High-Level API

```typescript
import { MediaInput, MediaOutput, Decoder, Encoder } from '@seydx/av/api';
import { AV_PIX_FMT_YUV420P } from '@seydx/av';

// Open media
const input = await MediaInput.open('input.mp4');
const output = await MediaOutput.open('output.mp4');

// Get video stream
const videoStream = input.video();

// Create decoder/encoder
const decoder = await Decoder.create(videoStream);
const encoder = await Encoder.create('libx264', {
  type: 'video',
  width: 1920,
  height: 1080,
  pixelFormat: AV_PIX_FMT_YUV420P,
  timeBase: { num: 1, den: 30 },
  frameRate: { num: 30, den: 1 },
  sampleAspectRatio: { num: 1, den: 1 }
}, {
  bitrate: '2M',
  gopSize: 60
});

// Add stream to output
const outputIndex = output.addStream(encoder);
await output.writeHeader();

// Process frames
for await (const packet of input.packets()) {
  if (packet.streamIndex === videoStream.index) {
    const frame = await decoder.decode(packet);
    if (frame) {
      const encoded = await encoder.encode(frame);
      if (encoded) {
        await output.writePacket(encoded, outputIndex);
        encoded.free();
      }
      frame.free();
    }
  }
}

// Cleanup
await output.writeTrailer();
await output.close();
await input.close();
```

### Pipeline API

The Pipeline API provides streamlined media processing with automatic flow control. It supports two modes:

#### Simple Pipeline (single stream)

```typescript
import { pipeline, MediaInput, MediaOutput, Decoder, Encoder, FilterAPI } from '@seydx/av/api';

// Full transcode pipeline: input → decoder → encoder → output
const input = await MediaInput.open('input.mp4');
const output = await MediaOutput.open('output.mp4');
const decoder = await Decoder.create(input.video());
const encoder = await Encoder.create('libx264', {
  type: 'video',
  width: 1920,
  height: 1080,
  pixelFormat: AV_PIX_FMT_YUV420P,
  timeBase: { num: 1, den: 30 }
}, {
  bitrate: '2M'
});

const control = pipeline(input, decoder, encoder, output);
await control.completion;

// With filter: input → decoder → filter → encoder → output  
const filter = await FilterAPI.create('scale=1280:720', input.video());
const control2 = pipeline(input, decoder, filter, encoder, output);
await control2.completion;

// Stream copy (no re-encoding): input → output
const control3 = pipeline(input, output);
await control3.completion;
```

#### Named Pipeline (multiple streams)

```typescript
// Process multiple streams with named routing
const control = pipeline(
  { video: videoInput, audio: audioInput },
  {
    video: [videoDecoder, videoFilter, videoEncoder],
    audio: [audioDecoder, audioFilter, audioEncoder]
  },
  { video: videoOutput, audio: audioOutput }
);
await control.completion;

// With single output (muxing)
const control2 = pipeline(
  { video: videoInput, audio: audioInput },
  {
    video: [videoDecoder, videoEncoder],
    audio: 'passthrough'  // Stream copy
  },
  output
);
await control2.completion;
```

#### Partial Pipeline (returns generator)

```typescript
// Pipeline without output returns async generator
const frames = pipeline(input, decoder);
for await (const frame of frames) {
  // Process frames
  frame.free();
}

// With filter
const filteredFrames = pipeline(input, decoder, filter);
for await (const frame of filteredFrames) {
  // Process filtered frames
  frame.free();
}

// Named partial pipeline
const generators = pipeline(
  { video: videoInput, audio: audioInput },
  {
    video: [videoDecoder, videoFilter],
    audio: [audioDecoder]
  }
);
// generators.video and generators.audio are async generators
```

## Hardware Acceleration

The library supports all hardware acceleration methods available in FFmpeg. The specific hardware types available depend on your FFmpeg build and system configuration.

### Auto-Detection

```typescript
import { HardwareContext } from '@seydx/av/api';

// Automatically detect best available hardware
const hw = await HardwareContext.auto();
if (hw) {
  console.log(`Using hardware: ${hw.deviceTypeName}`);
  
  // Use with decoder
  const decoder = await Decoder.create(stream, {
    hardware: hw
  });
  
  // Use with encoder (use hardware-specific codec)
  const encoder = await Encoder.create('h264_videotoolbox', videoStream, {
    hardware: hw
  });
}
```

### Specific Hardware

```typescript
import { AV_HWDEVICE_TYPE_CUDA, AV_HWDEVICE_TYPE_VAAPI } from '@seydx/av';

// Use specific hardware type
const cuda = await HardwareContext.create(AV_HWDEVICE_TYPE_CUDA);
const vaapi = await HardwareContext.create(AV_HWDEVICE_TYPE_VAAPI, '/dev/dri/renderD128');
```

## Imports and Tree Shaking

The library provides multiple entry points for optimal tree shaking:

```typescript
// High-Level API only - Recommended for most use cases
import { MediaInput, MediaOutput, Decoder, Encoder } from '@seydx/av/api';

// Low-Level API only - Direct FFmpeg bindings
import { FormatContext, CodecContext, Frame, Packet } from '@seydx/av/lib';

// Constants only - When you just need FFmpeg constants
import { AV_PIX_FMT_YUV420P, AV_CODEC_ID_H264 } from '@seydx/av/constants';

// Channel layouts only - For audio channel configurations
import { AV_CHANNEL_LAYOUT_STEREO, AV_CHANNEL_LAYOUT_5POINT1 } from '@seydx/av/layouts';

// Default export - Includes everything (larger bundle)
import * as ffmpeg from '@seydx/av';
```

### Recommended Import Strategy

For optimal bundle size, import only what you need:

```typescript
// ✅ Good - Only imports what's needed
import { MediaInput, Decoder } from '@seydx/av/api';
import { AV_PIX_FMT_YUV420P } from '@seydx/av/constants';

// ❌ Avoid - Imports everything
import * as ffmpeg from '@seydx/av';
const { MediaInput, Decoder } = ffmpeg;
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

## Error Handling

```typescript
import { FFmpegError } from '@seydx/av';

try {
  const media = await MediaInput.open('input.mp4');
} catch (error) {
  if (error instanceof FFmpegError) {
    console.error(`FFmpeg error ${error.code}: ${error.message}`);
  }
}
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

## Examples

| Example | FFmpeg | Low-Level API | High-Level API |
|---------|--------|---------------|----------------|
| `api-encode-decode` | | | [✓](examples/api-encode-decode.ts) |
| `api-frame-extract` | | | [✓](examples/api-frame-extract.ts) |
| `api-hw-decode-sw-encode` | | | [✓](examples/api-hw-decode-sw-encode.ts) |
| `api-hw-raw` | | | [✓](examples/api-hw-raw.ts) |
| `api-hw-rtsp` | | | [✓](examples/api-hw-rtsp.ts) |
| `api-hw-transcode` | | | [✓](examples/api-hw-transcode.ts) |
| `api-muxing` | | | [✓](examples/api-muxing.ts) |
| `api-pipeline-hw-rtsp` | | | [✓](examples/api-pipeline-hw-rtsp.ts) |
| `api-pipeline-raw-muxing` | | | [✓](examples/api-pipeline-raw-muxing.ts) |
| `api-stream-input` | | | [✓](examples/api-stream-input.ts) |
| `api-sw-decode-hw-encode` | | | [✓](examples/api-sw-decode-hw-encode.ts) |
| `api-sw-transcode` | | | [✓](examples/api-sw-transcode.ts) |
| `avio-read-callback` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/avio_read_callback.c) | [✓](examples/avio-read-callback.ts) | |
| `decode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_audio.c) | [✓](examples/decode-audio.ts) | |
| `decode-filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_audio.c) | [✓](examples/decode-filter-audio.ts) | |
| `decode-filter-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_filter_video.c) | [✓](examples/decode-filter-video.ts) | |
| `decode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/decode_video.c) | [✓](examples/decode-video.ts) | |
| `demux-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/demux_decode.c) | [✓](examples/demux-decode.ts) | |
| `encode-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_audio.c) | [✓](examples/encode-audio.ts) | |
| `encode-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/encode_video.c) | [✓](examples/encode-video.ts) | |
| `filter-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/filter_audio.c) | [✓](examples/filter-audio.ts) | |
| `hw-decode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/hw_decode.c) | [✓](examples/hw-decode.ts) | |
| `hw-encode` | | [✓](examples/hw-encode.ts) | |
| `hw-transcode` | | [✓](examples/hw-transcode.ts) | |
| `qsv-decode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_decode.c) | | |
| `qsv-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/qsv_transcode.c) | | |
| `vaapi-encode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_encode.c) | | |
| `vaapi-transcode` | [✓](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/vaapi_transcode.c) | | |
| `mux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/mux.c) | [✓](examples/mux.ts) | |
| `remux` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/remux.c) | [✓](examples/remux.ts) | |
| `resample-audio` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/resample_audio.c) | [✓](examples/resample-audio.ts) | |
| `scale-video` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/scale_video.c) | [✓](examples/scale-video.ts) | |
| `show-metadata` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/show_metadata.c) | [✓](examples/show-metadata.ts) | |
| `transcode-aac` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode_aac.c) | [✓](examples/transcode-aac.ts) | |
| `transcode` | [✓](https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples/transcode.c) | [✓](examples/transcode.ts) | |

## API Reference

TODO

## Building from Source

TODO

## Testing

TODO

## License

This project is licensed under the MIT License. See the LICENSE file for details.

**Important**: FFmpeg itself is licensed under LGPL/GPL. Please ensure compliance with FFmpeg's license terms when using this library. The FFmpeg libraries themselves retain their original licenses, and this wrapper library does not change those terms. See [FFmpeg License](https://ffmpeg.org/legal.html) for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTION.md](CONTRIBUTION.md) for development setup, code standards, and contribution guidelines before submitting pull requests.

## Support

For issues and questions, please use the GitHub issue tracker.

## See Also

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg API Documentation](https://ffmpeg.org/doxygen/trunk/)
- [go-astiav](https://github.com/asticode/go-astiav) - Similar Go bindings that inspired this project