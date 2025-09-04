# Contributing to node-av

Thank you for your interest in contributing to node-av! This guide will help you understand our development practices and code standards.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style Guide](#code-style-guide)
- [Documentation Standards](#documentation-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

For contributing to node-av, you'll need a development environment with:
- Node.js 22.18.0+ (LTS recommended)
- FFmpeg 7.1+ with development headers
- Python 3.x (for node-gyp)
- C++ compiler with C++17 support
- pkg-config (for finding FFmpeg libraries)

For detailed setup instructions by platform, see the **[Installation Guide](INSTALLATION.md)**.

### Before Contributing

1. Check the [issue tracker](https://github.com/seydx/av/issues) for existing issues or feature requests
2. Fork the repository and create a new branch from `main`
3. Follow the code style and documentation standards below
4. Write tests for new functionality
5. Ensure all tests pass before submitting a PR

## Development Setup

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/av.git
cd av

# Install all dependencies
npm install

# Build the project
npm run build
```

### Build Commands

```bash
# Full build (generates constants, builds TypeScript and native bindings)
npm run build

# Build only native bindings
npm run build:native

# Build only TypeScript
npm run build:tsc

# Build tests
npm run build:tests

# Build examples
npm run build:examples

# Clean build artifacts and rebuild
npm run clean

# Generate FFmpeg constants (auto-generated from headers)
npm run generate:constants

# Generate encoder/decoder lists
npm run generate:encoders
npm run generate:decoders

# Generate channel layouts
npm run generate:layouts

# Generate all auto-generated files
npm run generate
```

### Code Quality Commands

```bash
# Format code with Prettier
npm run format

# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix
```

### Testing

```bash
# Run all tests (includes build)
npm run test:all

# Run tests only (assumes already built)
npm run test

# Run specific test file
tsx --test test/decoder.test.ts

# Run specific test suite
tsx --test test/transcode-combinations.test.ts
```

## Project Structure

The project follows a three-layer architecture:

```
src/
├── api/                    # High-level API (user-friendly)
│   ├── index.ts           # Main API exports
│   ├── decoder.ts         # High-level decoder
│   ├── encoder.ts         # High-level encoder
│   ├── filter.ts          # High-level filter
│   ├── media-input.ts     # Media input handler
│   ├── media-output.ts    # Media output handler
│   ├── hardware.ts        # Hardware acceleration
│   ├── pipeline.ts        # Pipeline orchestration
│   └── types.ts           # API type definitions
│
├── lib/                    # Low-level FFmpeg bindings
│   ├── index.ts           # Main library exports
│   ├── codec-context.ts   # AVCodecContext wrapper
│   ├── format-context.ts  # AVFormatContext wrapper
│   ├── frame.ts           # AVFrame wrapper
│   ├── packet.ts          # AVPacket wrapper
│   └── ...                # Other FFmpeg wrappers
│
├── constants/             # Auto-generated FFmpeg constants
│   ├── constants.ts       # AUTO-GENERATED - DO NOT EDIT
│   ├── encoders.ts        # AUTO-GENERATED - DO NOT EDIT
│   ├── decoders.ts        # AUTO-GENERATED - DO NOT EDIT
│   └── channel-layouts.ts # AUTO-GENERATED - DO NOT EDIT
│
└── bindings/              # Native C++ bindings
    ├── binding.cc         # Main binding entry point
    ├── codec_context.cc   # Codec context implementation
    ├── format_context.cc  # Format context implementation
    └── ...                # Other native implementations

test/                      # Test files
├── decoder.test.ts        # Decoder tests
├── encoder.test.ts        # Encoder tests
├── transcode.test.ts      # Transcoding tests
└── ...                    # Other test files

examples/                  # Example usage
├── api-*.ts              # High-level API examples
├── transcode.ts          # Low-level transcoding example
└── ...                   # Other examples

scripts/                   # Build and generation scripts
├── generate-constants.js  # Generates FFmpeg constants
├── generate-encoders.js   # Generates encoder lists
├── generate-decoders.js   # Generates decoder lists
└── ...                   # Other scripts
```

### Auto-Generated Files

⚠️ **NEVER manually edit these files:**
- `src/constants/constants.ts`
- `src/constants/encoders.ts`
- `src/constants/decoders.ts`
- `src/constants/channel-layouts.ts`

These are generated from FFmpeg headers. To modify them:
1. Edit the corresponding script in `scripts/`
2. Run `npm run generate`

## Code Style Guide

### TypeScript Configuration

We use strict TypeScript with ESLint. All code must pass:

```bash
npm run lint
npm run build:tsc
```

### Class Structure

Classes must follow this strict ordering:

```typescript
class ClassName {
  // 1. Public properties
  public readonly property: Type;
  
  // 2. Private properties
  private _property: Type;
  private native: NativeType;
  
  // 3. Constructor
  private constructor(native: NativeType) {
    this.native = native;
  }
  
  // 4. Public static methods
  static async create(): Promise<ClassName> {
    // Factory method for async initialization
  }
  
  // 5. Getters/Setters
  get property(): Type {
    return this._property;
  }
  
  // 6. Public methods
  async process(): Promise<void> {
    // Implementation
  }
  
  // 7. Private methods
  private helper(): void {
    // Implementation
  }
  
  // 8. Private static methods
  private static validate(): boolean {
    // Implementation
  }
  
  // 9. Internal methods (for API interop)
  /**
   * @internal
   */
  getNative(): NativeType {
    return this.native;
  }
  
  // 10. Disposal methods (always last)
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
```

### Async Functions

- Always use `await` with async operations
- Convert async functions without await to synchronous
- Use proper error handling with try/catch

```typescript
// Good
async function process(): Promise<void> {
  const result = await operation();
  // Process result
}

// Bad - should be synchronous
async function getValue(): Promise<number> {
  return 42; // No await, should be: getValue(): number
}
```

### Error Handling

Use our error constants and descriptive messages:

```typescript
// Good - use AVERROR constants
if (ret < 0) {
  throw new FFmpegError(AVERROR_EINVAL, 'Invalid input parameters');
}

// Bad - don't use AVERROR() macro style
if (ret < 0) {
  throw new FFmpegError(AVERROR(EINVAL), 'Invalid input');
}

// In examples, always show proper error handling
try {
  const result = await decoder.decode(packet);
  FFmpegError.throwIfError(result);
} catch (error) {
  console.error('Decoding failed:', error);
}
```

### Resource Management

Always use the Disposable pattern:

```typescript
// Good - automatic cleanup
{
  using frame = new Frame();
  // Frame is automatically disposed
}

// For Symbol.dispose implementation
[Symbol.dispose](): void {
  // Direct binding disposal
  this.native[Symbol.dispose]();
  // NOT: this.free() or this.dispose()
}
```

## Documentation Standards

### JSDoc Requirements

#### Constructor Documentation

Constructors should have minimal or no JSDoc, except for internal/private ones:

```typescript
// Good - internal constructor with minimal doc
/**
 * @param native - The native codec context instance
 * @internal
 */
private constructor(native: NativeCodecContext) {
  this.native = native;
}

// Bad - public constructor with excessive JSDoc
/**
 * Creates a new instance of the decoder.
 * @param options - Decoder options
 * @returns A new decoder instance
 */
constructor(options: DecoderOptions) { }
```

#### Method Documentation

All public methods must have complete JSDoc:

```typescript
/**
 * Decodes a packet into a frame.
 * 
 * Sends a packet to the decoder and receives a decoded frame.
 * Uses avcodec_send_packet() and avcodec_receive_frame() internally.
 * 
 * @param packet - The packet to decode
 * @returns The decoded frame or null if more data is needed
 * 
 * @example
 * ```typescript
 * const frame = await decoder.decode(packet);
 * if (frame) {
 *   console.log(`Decoded frame: ${frame.width}x${frame.height}`);
 * }
 * ```
 * 
 * @see {@link https://ffmpeg.org/doxygen/7.1/group__lavc__decoding.html#ga58bc4bf1e0ac59e27362597e467efff3 | avcodec_send_packet}
 * @see {@link https://ffmpeg.org/doxygen/7.1/group__lavc__decoding.html#ga11e6542c4e66d3028668788a1a74217c | avcodec_receive_frame}
 */
async decode(packet: Packet): Promise<Frame | null> {
  // Implementation
}
```

#### Getter Documentation

Getters should not have `@returns` tags:

```typescript
// Good
/**
 * The codec name.
 */
get name(): string {
  return this.native.name;
}

// Bad
/**
 * Gets the codec name.
 * @returns The codec name
 */
get name(): string {
  return this.native.name;
}
```

#### Internal Methods

Always mark internal API methods:

```typescript
/**
 * Get the native handle.
 * @internal
 */
getNative(): NativeType {
  return this.native;
}
```

#### Void Functions

Functions returning void should not have return statements or @returns tags:

```typescript
// Good
/**
 * Closes the decoder and releases resources.
 */
close(): void {
  this.native.close();
}

// Bad
/**
 * Closes the decoder.
 * @returns Nothing
 */
close(): void {
  return this.native.close();
}
```

### Examples in Documentation

All examples must be complete and working:

```typescript
/**
 * @example
 * ```typescript
 * // Import required modules
 * import { MediaInput, Decoder } from 'node-av';
 * 
 * // Open media and create decoder
 * const input = await MediaInput.open('video.mp4');
 * const stream = input.video();
 * const decoder = await Decoder.create(stream);
 * 
 * // Decode packets
 * for await (const packet of input.packets()) {
 *   const frame = await decoder.decode(packet);
 *   if (frame) {
 *     // Process frame
 *     frame.free();
 *   }
 *   packet.free();
 * }
 * 
 * // Cleanup
 * decoder.close();
 * await input.close();
 * ```
 */
```

### FFmpeg Function References

Include links to FFmpeg documentation where applicable:

```typescript
/**
 * Seeks to a specific timestamp.
 * 
 * @see {@link https://ffmpeg.org/doxygen/7.1/group__lavf__decoding.html#gaa23f7619d8d4ea0857065d9979c75ac8 | av_seek_frame}
 */
```

## Testing Guidelines

### Test Structure

Use Node.js built-in test runner:

```typescript
import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'node:assert';

describe('Decoder', () => {
  describe('create()', () => {
    it('should create decoder from stream', async () => {
      const input = await MediaInput.open('testdata/video.mp4');
      const stream = input.video();
      const decoder = await Decoder.create(stream);
      
      assert.ok(decoder);
      assert.equal(decoder.name, 'h264');
      
      decoder.close();
      await input.close();
    });
  });
});
```

### Test Data

Test files are located in `testdata/`:
- Use small, efficient test files
- Include various codecs and formats
- Document any special test file requirements

## Pull Request Process

### 1. Prepare Your Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run lint:fix
npm run format
npm run test:all
```

### 2. Verify Code Quality

Before committing, ensure:
- ✅ All tests pass (`npm run test:all`)
- ✅ ESLint passes (`npm run lint`)
- ✅ TypeScript builds (`npm run build:tsc`)
- ✅ Examples build (`npm run build:examples`)

### 3. Commit Your Changes

Follow conventional commits:

```bash
git add .
git commit -m "feat: add hardware acceleration support"
```

Commit types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test changes
- `chore:` Build/tooling changes

### 4. Final Checklist

Before submitting your PR:
- [ ] Code follows the style guide
- [ ] Documentation is complete with examples
- [ ] Tests are added for new functionality
- [ ] All tests pass
- [ ] ESLint passes with `npm run lint`
- [ ] Code is formatted with `npm run format`

### 5. Submit Pull Request

- Provide clear description of changes
- Link related issues
- Include test results if applicable
- Be responsive to review feedback

## Questions?

If you have questions about contributing:
- Check existing [issues](https://github.com/seydx/av/issues)
- Open a new issue for clarification
- Review the [examples](examples/) directory

Thank you for contributing to node-av!