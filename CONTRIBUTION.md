# Contributing to node-av

Thank you for your interest in contributing to node-av! This guide will help you understand our development practices and code standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Architecture Overview](#architecture-overview)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

For contributing to node-av, you'll need a development environment with:
- Node.js 18.17.0+ (LTS recommended)
- FFmpeg 7.1+ with development headers
- Python 3.12+ (for node-gyp)
- C++ compiler with C++17 support

For detailed setup instructions by platform, see the **[Installation Guide](INSTALLATION.md#platform-specific-instructions)**.

### Before Contributing

1. Check the [issue tracker](https://github.com/seydx/av/issues) for existing issues or feature requests
2. Fork the repository and create a new branch from `main`
3. Follow the code style and structure guidelines below
4. Write tests for new functionality
5. Ensure all tests pass before submitting a PR

## Development Setup

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/av.git
cd av

# Install build dependencies
npm install --save-dev node-addon-api node-gyp

# Install all dependencies and build
npm install
```

For platform-specific setup instructions, including FFmpeg installation, see the **[Installation Guide](INSTALLATION.md#building-from-source)**.

### Build Commands

```bash
# Build native bindings only
npm run build:native

# Build TypeScript only
npm run build:tsc

# Build everything (native + TypeScript)
npm run build

# Build everything including tests and examples
npm run build:all

# Clean build artifacts
npm run clean

# Generate FFmpeg constants (auto-generated, do not edit manually)
npm run generate:constants

# Generate channel layouts (auto-generated, do not edit manually)
npm run generate:layouts
```


### Testing

```bash
# Run all tests
npm run test:all

# Run specific test file
tsx --test test/decoder.test.ts
```

## Code Style Guide

### TypeScript Configuration

We use strict TypeScript settings. All code must pass type checking with:

```bash
npm run build:tsc
```

### File Organization

The project follows a clear separation between low-level and high-level APIs:

```
src/
├── lib/                    # Low-level FFmpeg bindings
│   ├── index.ts           # Main exports
│   ├── constants.ts       # AUTO-GENERATED - DO NOT EDIT
│   ├── channel-layouts.ts # AUTO-GENERATED - DO NOT EDIT
│   └── *.ts              # Individual binding classes
├── api/                   # High-level API
│   ├── index.ts          # Main exports
│   └── *.ts              # High-level wrapper classes
└── bindings/             # Native C++ bindings
    └── *.cc              # C++ implementation files

scripts/
├── generate-constants.js      # Generates src/lib/constants.ts
└── generate-channel-layouts.js # Generates src/lib/channel-layouts.ts
```

### Auto-Generated Files

⚠️ **IMPORTANT**: Never manually edit these files:
- `src/lib/constants.ts`
- `src/lib/channel-layouts.ts`

These files are automatically generated from FFmpeg headers. To make changes:

1. **For constants**: Modify `scripts/generate-constants.js`
2. **For channel layouts**: Modify `scripts/generate-channel-layouts.js`
3. **Regenerate the files**:
   ```bash
   npm run generate:constants
   npm run generate:layouts
   ```

The generation scripts extract values directly from FFmpeg headers to ensure accuracy and compatibility with the installed FFmpeg version.

### Class Structure

Classes should follow this consistent ordering:

```typescript
class ClassName {
  // 1. Private Properties
  private property: Type;
  private _internalProperty: Type;
  
  // 2. Constructor (usually private for factory pattern)
  private constructor(param: Type) {
    // Minimal initialization only
  }
  
  // 3. Static Factory Methods
  static async create(param: Type): Promise<ClassName> {
    // Complex initialization here
  }
  
  // 4. Getter/Setter Properties
  get property(): Type { return this._property; }
  set property(value: Type) { this._property = value; }
  
  // 5. Public Methods
  async publicMethod(): Promise<void> { }
  
  // 6. Private Methods
  private internalMethod(): void { }
  
  // 7. Private Static Methods
  private static helperMethod(): void { }
  
  // 8. Internal Methods (for other API classes)
  /** @internal */
  internalApiMethod(): void { }
  
  // 9. Disposal Methods
  dispose(): void { }
  [Symbol.dispose](): void { this.dispose(); }
  async [Symbol.asyncDispose](): Promise<void> { await this.close(); }
}
```

### Documentation Standards

#### Module Documentation

Every module should have a top-level description:

```typescript
/**
 * MediaInput - Unified Input Handler for FFmpeg
 *
 * Provides a high-level interface for opening and reading media from various sources.
 * Supports files, URLs, Buffers, and Node.js streams with automatic format detection.
 *
 * Central entry point for all media input operations.
 * Manages FormatContext lifecycle and provides stream information.
 *
 * @module api/media-input
 */
```

#### Class Documentation

```typescript
/**
 * High-level media input handler.
 *
 * Opens and provides access to media streams from various sources.
 * Automatically detects format and finds stream information.
 *
 * @example
 * ```typescript
 * const media = await MediaInput.open('video.mp4');
 * console.log(`Duration: ${media.duration} seconds`);
 * ```
 */
export class MediaInput { }
```

#### Method Documentation

```typescript
/**
 * Open a media input from various sources.
 * 
 * Creates a FormatContext and opens the input for reading.
 * Automatically detects format and finds stream information.
 * 
 * Uses av_format_open_input() and av_find_stream_info() internally.
 * 
 * @param input - File path, URL, Buffer, or Readable stream
 * @param options - Optional configuration
 * 
 * @returns Promise resolving to MediaInput instance
 * 
 * @throws {FFmpegError} If input cannot be opened
 * 
 * @example
 * ```typescript
 * const media = await MediaInput.open('video.mp4');
 * ```
 */
static async open(input: string | Buffer, options?: MediaInputOptions): Promise<MediaInput> { }
```

#### Internal Methods

Mark internal methods that shouldn't be part of the public API:

```typescript
/**
 * Get the underlying FormatContext.
 * 
 * @returns FFmpeg FormatContext
 * @internal
 */
getFormatContext(): FormatContext { }
```

### Import Guidelines

```typescript
// 1. External imports first
import { Readable } from 'stream';

// 2. Low-level imports from lib
import { FormatContext, CodecContext } from '../lib/index.js';
import { AV_PIX_FMT_YUV420P, AV_CODEC_ID_H264 } from '../lib/constants.js';

// 3. High-level imports from api
import { HardwareContext } from './hardware.js';

// 4. Type imports last (use 'type' keyword)
import type { AVPixelFormat, AVCodecID } from '../lib/constants.js';
import type { StreamInfo, EncoderOptions } from './types.js';
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `MediaInput`, `HardwareContext`)
- **Methods/Functions**: camelCase (e.g., `open()`, `createDecoder()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `AV_PIX_FMT_YUV420P`)
- **Private properties**: Leading underscore for internal state (e.g., `_isOpen`)
- **Interfaces**: PascalCase with descriptive names (e.g., `StreamInfo`, `EncoderOptions`)

### Error Handling

Always use descriptive error messages and include context:

```typescript
if (!stream) {
  throw new Error(`Stream ${streamIndex} not found in media with ${this.streams.length} streams`);
}

// Use FFmpegError for FFmpeg-specific errors
FFmpegError.throwIfError(ret, 'Failed to open codec context');
```

### Async/Await Patterns

Prefer async/await over callbacks and promises:

```typescript
// Good
async function processMedia(input: string): Promise<void> {
  const media = await MediaInput.open(input);
  try {
    // Process media
  } finally {
    await media.close();
  }
}

// Better - with automatic cleanup
async function processMedia(input: string): Promise<void> {
  await using media = await MediaInput.open(input);
  // Process media - automatically closed
}
```

## Architecture Overview

### Low-Level API (src/lib)

Direct 1:1 bindings to FFmpeg C API:
- Manual memory management required
- Direct access to all FFmpeg features
- Minimal abstraction layer

### High-Level API (src/api)

User-friendly wrappers with:
- Automatic resource management
- Simplified interfaces
- Type-safe options
- Hardware acceleration support

### Native Bindings (src/bindings)

C++ bridge between Node.js and FFmpeg:
- Uses N-API for stability
- Handles async operations
- Memory management utilities

## Testing Guidelines

### Test Structure

```typescript
describe('MediaInput', () => {
  describe('open()', () => {
    it('should open a video file', async () => {
      const media = await MediaInput.open('testdata/video.mp4');
      expect(media.duration).toBeGreaterThan(0);
      await media.close();
    });
    
    it('should throw on invalid input', async () => {
      await expect(MediaInput.open('nonexistent.mp4'))
        .rejects.toThrow('Failed to open input');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test:all
```

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the code style guide
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
   
   Follow conventional commit format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `test:` Test additions/changes
   - `chore:` Build/tooling changes

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a pull request on GitHub with:
   - Clear description of changes
   - Link to related issues
   - Test results/screenshots if applicable

5. **Code Review**
   - Address review feedback
   - Ensure CI passes
   - Maintain clean commit history

## Questions?

If you have questions about contributing, please:
- Check existing issues and discussions
- Open a new issue for clarification
- Join our community discussions

Thank you for contributing to node-av!