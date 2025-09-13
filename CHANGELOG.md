# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

#### Breaking Changes

##### Encoder Hardware Context Removal
The `hardware` option has been removed from `Encoder.create()`. Hardware context is now automatically detected from input frames.

```typescript
// Before (v1.x)
const hw = HardwareContext.auto();
const encoderCodec = hw.getEncoderCodec('h264'); // e.g., returns FF_ENCODER_H264_VIDEOTOOLBOX
const encoder = await Encoder.create(encoderCodec.name, streamInfo, {
  hardware: hw,
  bitrate: 5000000
});

// After (v2.0)
const hw = HardwareContext.auto();
const encoderCodec = hw.getEncoderCodec('h264');
const encoder = await Encoder.create(encoderCodec, {
  bitrate: 5000000
});
// Hardware context automatically detected from input frames

// Or using typed constants directly:
import { FF_ENCODER_H264_VIDEOTOOLBOX } from '@seydx/av/constants';
const encoder = await Encoder.create(FF_ENCODER_H264_VIDEOTOOLBOX, { bitrate: 5000000 });
```

##### FilterPreset Hardware Support
`HardwareFilterPresets` class has been removed. Use `FilterPreset` with `chain()` for hardware acceleration.

```typescript
// Before (v1.x)
const hw = HardwareContext.auto();
const hwFilter = new HardwareFilterPresets(hw);
const filter = hwFilter.scale(1920, 1080);

// After (v2.0)
const hw = HardwareContext.auto();
const filterChain = FilterPreset.chain(hw).scale(1920, 1080).build(); // Pass hardware context to chain
```

##### MediaOutput Automatic Management
No longer need to manually manage headers and trailers.

```typescript
// Before (v1.x)
const output = await MediaOutput.create('output.mp4');
await output.writeHeader();
// ... write packets ...
await output.writeTrailer();
await output.close();

// After (v2.0)
await using output = await MediaOutput.create('output.mp4');
// ... write packets ...
// Header/trailer handled automatically, close on dispose
```

### Added

- More Filter presets
- Better error messages throughout the API

### Fixed

- Video duration calculation issues (was showing 10000+ seconds instead of actual duration)
- Memory management in filter buffer handling
- Dictionary.fromObject to properly handle number values
- Codec context initialization and cleanup

### Removed

- `HardwareFilterPresets` class (replaced by enhanced `FilterPreset`)
- Manual `writeHeader()` and `writeTrailer()` requirements in MediaOutput
- Unused stream information types from type exports

## [1.0.0] - 2025-08-30

- Initial Release