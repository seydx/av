# FFmpeg Node.js Binding Examples

This directory contains examples demonstrating how to use the FFmpeg Node.js bindings.

## Prerequisites

1. Build the main library first:
```bash
cd ..
npm install
npm run build
```

2. Install example dependencies:
```bash
npm install
```

## Running Examples

### Demuxing and Decoding
Demonstrates how to open a media file, find decoders, and decode packets into frames.

```bash
npm run demuxing-decoding -- -i path/to/video.mp4
# With verbose FFmpeg logging:
npm run demuxing-decoding -- -i path/to/video.mp4 -v
```

### Bit Stream Filtering (Coming Soon)
Shows how to apply bitstream filters to modify codec data.

```bash
npm run bit-stream-filtering -- -i input.mp4 -o output.mp4
```

### Remuxing (Coming Soon)
Changes container format without re-encoding.

```bash
npm run remuxing -- -i input.mp4 -o output.mkv
```

### Transcoding (Coming Soon)
Complete transcode pipeline: demux → decode → encode → mux.

```bash
npm run transcoding -- -i input.mp4 -o output.mp4 -c:v libx264 -c:a aac
```

### Video Filtering (Coming Soon)
Demonstrates FFmpeg filter graphs.

```bash
npm run filtering -- -i input.mp4 -o output.mp4 -f "scale=640:480"
```

### Video Scaling (Coming Soon)
Shows video resolution and format conversion.

```bash
npm run scaling-video -- -i input.mp4 -o output.mp4 -w 1280 -h 720
```

### Audio Resampling (Coming Soon)
Demonstrates audio format conversion.

```bash
npm run resampling-audio -- -i input.mp3 -o output.wav -r 48000
```

## Test Files

You can use the test files from the main test directory:
- `../testdata/video.mp4` - Sample video file
- `../testdata/audio-s16le.pcm` - Raw audio data
- `../testdata/image-rgba.png` - Sample image

## Features Demonstrated

Each example showcases Node.js-specific features:
- **TypeScript** - Full type safety
- **async/await** - Asynchronous I/O operations
- **using statement** - Automatic resource cleanup
- **Error handling** - Proper FFmpeg error handling
- **Logging** - Configurable FFmpeg logging

## Notes

- All examples follow Node.js idioms while maintaining FFmpeg functionality
- Memory is automatically managed using `using` statements
- Examples are fully typed with TypeScript
- Each example includes detailed comments explaining the process