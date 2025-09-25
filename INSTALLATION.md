# Installation Guide

This guide covers all installation methods for node-av, including using prebuilt binaries and building from source.

> **Important:** node-av is optimized and built using [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg), which includes additional patches and optimizations. While standard FFmpeg 7.1+ is supported for building from source, we officially recommend and test with Jellyfin FFmpeg for best compatibility and performance.

## Table of Contents

- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
  - [Using Prebuilt Binaries](#using-prebuilt-binaries)
  - [Building from Source](#building-from-source)
- [Platform-Specific Instructions](#platform-specific-instructions)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows](#windows)
- [Troubleshooting](#troubleshooting)
- [Verification](#verification)

## Quick Start

For most users, installation is as simple as:

```bash
npm install node-av
```

This will:
1. Try to use a prebuilt binary for your platform (if available)
2. Fall back to building from source if system FFmpeg 7.1+ is detected
3. Provide clear instructions if additional setup is needed

## System Requirements

### Minimum Requirements

- **Node.js**: 22.18.0 or later (LTS recommended)
- **Operating System**: macOS, Linux, or Windows (64-bit)
- **Architecture**: x64 or arm64

### For Prebuilt Binaries

No additional requirements! Prebuilt binaries include statically linked FFmpeg 7.1.2 libraries with all optimizations and patches.

### For Building from Source

- **FFmpeg**: 7.1 or later with development headers
  - **Recommended**: [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg) (includes patches and optimizations)
  - **Supported**: Standard FFmpeg 7.1+ (may have reduced functionality)
- **Python**: 3.x or later (for node-gyp)
- **C++ Compiler**: With C++17 support
  - macOS: Xcode Command Line Tools
  - Linux: GCC 7+ or Clang 5+
  - Windows: MSYS2 with Clang
- **pkg-config**: For locating FFmpeg libraries
- **node-gyp**: Node.js native addon build tool
- **node-addon-api**: N-API C++ wrapper

## Installation Methods

### Using Prebuilt Binaries

Prebuilt binaries are available for the following platforms:

| Platform | Architecture | Variants | Node.js | Electron |
|----------|-------------|----------|---------|----------|
| macOS    | x64, arm64  | Standard | ✅      | ✅       |
| Linux    | x64, arm64  | Standard | ✅      | ✅       |
| Windows  | x64, arm64  | MSVC + MinGW | ✅      | ✅       |

All binaries are built with N-API level 9, ensuring compatibility with:
- Node.js 22.18.0 and later
- Electron 22.0.0 and later

The prebuilt binaries are compiled with FFmpeg 7.1.2, which includes:
- Hardware acceleration optimizations
- Additional codec support
- Performance patches
- Static linking for zero runtime dependencies

To use prebuilt binaries:

```bash
# Standard installation (uses prebuilt if available)
npm install node-av
```

### Building from Source

The package will automatically build from source when:

1. **No prebuilt binary exists** for your platform/architecture
2. **You explicitly request it** with `--build-from-source`
3. **System FFmpeg is detected** (version 7.1+)

#### Prerequisites for Building

Before building from source, ensure you have:

1. **FFmpeg 7.1+ libraries and headers**
   - **Recommended**: Build with Jellyfin FFmpeg for full feature compatibility
   - **Alternative**: Standard FFmpeg 7.1+ (some hardware acceleration features may be limited)
2. **Python 3.x** (for node-gyp)
3. **C++ compiler** with C++17 support
4. **Build dependencies**:
   ```bash
   npm install --save-dev node-addon-api node-gyp
   ```

#### Build Commands

```bash
# Force build from source
npm install node-av --build-from-source

# Build from source with verbose output
npm install node-av --build-from-source --verbose

# Rebuild existing installation
npm rebuild node-av
```

#### Environment Variables

- `PKG_CONFIG_PATH`: Additional paths for pkg-config to find FFmpeg libraries
  ```bash
  export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
  npm install node-av
  ```

- `FFMPEG_DEV_PATH`: Path to Jellyfin FFmpeg development files (for development builds)
  ```bash
  export FFMPEG_DEV_PATH=externals/jellyfin-ffmpeg
  npm run generate:constants
  ```

## Platform-Specific Instructions

### macOS

#### Using Prebuilt Binaries

```bash
# Just install - prebuilt binaries will be used automatically
npm install node-av
```

#### Building from Source

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install FFmpeg 7.1+ and pkg-config
brew install ffmpeg pkg-config
# Note: For full compatibility, consider building Jellyfin FFmpeg from source

# 3. Install Python 3.x (if not already installed)
brew install python

# 4. Install build dependencies
npm install --save-dev node-addon-api node-gyp

# 5. Install node-av (will build from source)
npm install node-av
```

#### Verifying FFmpeg Installation

```bash
# Check FFmpeg version
ffmpeg -version

# Check if pkg-config can find FFmpeg
pkg-config --modversion libavcodec
pkg-config --modversion libavformat
```

### Linux

#### Using Prebuilt Binaries

```bash
# Just install - prebuilt binaries will be used automatically
npm install node-av
```

Prebuilt binaries are compiled with Jellyfin FFmpeg and include all necessary optimizations.

#### Building from Source

##### Ubuntu/Debian

```bash
# 1. Update package list
sudo apt-get update

# 2. Install Python 3.x
sudo apt-get install python3 python3-dev

# 3. Install FFmpeg development libraries
sudo apt-get install \
  libavcodec-dev \
  libavformat-dev \
  libavutil-dev \
  libswscale-dev \
  libswresample-dev \
  libavfilter-dev \
  libavdevice-dev \
  libpostproc-dev \
  pkg-config \
  build-essential

# 4. Install build dependencies
npm install --save-dev node-addon-api node-gyp

# 5. Install node-av
npm install node-av
```


#### Building with Jellyfin FFmpeg (Recommended)

For full compatibility with prebuilt binaries, you can build with Jellyfin FFmpeg. Note that building Jellyfin FFmpeg from source is complex and requires following their specific build workflows:

1. **Review the Jellyfin FFmpeg build process**:
   - Visit [Jellyfin FFmpeg GitHub Actions](https://github.com/jellyfin/jellyfin-ffmpeg/actions)
   - Check their [build workflows](https://github.com/jellyfin/jellyfin-ffmpeg/tree/jellyfin/.github/workflows) for your platform
   - Follow their platform-specific build instructions carefully

2. **Alternative: Use Jellyfin FFmpeg packages** (if available for your distribution):
   - Check [Jellyfin repositories](https://jellyfin.org/downloads/) for pre-built FFmpeg packages
   - These packages include all patches and optimizations

3. **After installing Jellyfin FFmpeg**, build node-av:
   ```bash
   # Set PKG_CONFIG_PATH to find Jellyfin FFmpeg libraries
   export PKG_CONFIG_PATH=/path/to/jellyfin-ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH
   
   # Build node-av from source
   npm install node-av --build-from-source
   ```

#### Verifying FFmpeg Installation

```bash
# Check FFmpeg version (should be 7.1+)
ffmpeg -version

# Check library versions
pkg-config --modversion libavcodec
pkg-config --modversion libavformat
pkg-config --modversion libavutil

# For Jellyfin FFmpeg, you should see version 61.x.x or later
```

### Windows

#### Using Prebuilt Binaries (Recommended)

```bash
# Just install - prebuilt binaries will be used automatically
npm install node-av
```

node-av automatically selects the appropriate Windows prebuilt binary for your system:

- **MSVC builds**: For standard Windows systems
- **MinGW builds**: For MSYS2/MinGW environments

Both variants include statically linked FFmpeg 7.1.2 libraries. The package automatically detects your system environment and chooses the correct variant.

#### Building from Source

Building from source on Windows is complex and requires MSYS2:

##### Prerequisites

1. **Install Python 3.x**
   - Download from [python.org](https://www.python.org/downloads/)
   - Ensure "Add Python to PATH" is checked during installation

2. **Install MSYS2**
   - Download from [msys2.org](https://www.msys2.org/)
   - Follow the installation instructions

3. **Install build tools in MSYS2**

   Open MSYS2 CLANG64 terminal and run:
   ```bash
   # Update package database
   pacman -Syu

   # Install required packages
   pacman -S \
     mingw-w64-clang-x86_64-toolchain \
     mingw-w64-clang-x86_64-ffmpeg \
     mingw-w64-clang-x86_64-pkg-config
   
   # Note: MSYS2 FFmpeg may not include all patches from Jellyfin FFmpeg
   ```

4. **Set up environment**
   
   Add MSYS2 to PATH (adjust path as needed):
   ```cmd
   set PATH=C:\msys64\clang64\bin;%PATH%
   ```

5. **Install build dependencies**
   ```bash
   npm install --save-dev node-addon-api node-gyp
   ```

6. **Install node-av**
   ```bash
   npm install node-av --build-from-source
   ```

## Troubleshooting

### Common Issues

#### "No prebuilt binary available for your platform"

This means your platform/architecture combination doesn't have a prebuilt binary. You'll need to build from source:

1. Install FFmpeg 7.1+ with development headers (preferably Jellyfin FFmpeg)
2. Install Python 3.x
3. Install build dependencies: `npm install --save-dev node-addon-api node-gyp`
4. Run `npm install node-av` again

#### "Cannot find FFmpeg libraries"

The build system cannot locate FFmpeg libraries. Solutions:

```bash
# Check if FFmpeg is installed
ffmpeg -version

# Check if pkg-config can find FFmpeg
pkg-config --modversion libavcodec

# If pkg-config can't find FFmpeg, set PKG_CONFIG_PATH
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH

# Try installing again
npm install node-av
```

#### "Missing node-addon-api or node-gyp"

These are required for building from source:

```bash
npm install --save-dev node-addon-api node-gyp
```

#### "Build failed with C++ errors"

Ensure you have a compatible C++ compiler:

- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build-essential: `sudo apt-get install build-essential`
- **Windows**: Use MSYS2 with Clang (see Windows instructions above)

#### "Module version mismatch"

This occurs when the binary was built for a different Node.js version:

```bash
# Rebuild for current Node.js version
npm rebuild node-av

# Or reinstall
npm uninstall node-av
npm install node-av
```

## Advanced Configuration

### Custom FFmpeg Location

If FFmpeg is installed in a non-standard location:

```bash
# Set custom pkg-config path
export PKG_CONFIG_PATH=/custom/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH

# Set custom include/lib paths (if pkg-config unavailable)
export CFLAGS="-I/custom/ffmpeg/include"
export CXXFLAGS="-I/custom/ffmpeg/include"
export LDFLAGS="-L/custom/ffmpeg/lib"

npm install node-av --build-from-source
```

### Cross-Compilation

For cross-compilation (e.g., building for ARM on x64):

```bash
# Set target architecture
npm install node-av --target_arch=arm64 --target_platform=linux
```

## Verification

After installation, verify that node-av is working correctly:

```javascript
import { getVersions } from 'node-av';

const versions = getVersions();
console.log('FFmpeg versions:', versions);

// Should show libavcodec, libavformat, etc. versions
// For Jellyfin FFmpeg builds: version 61.x.x or later
// For standard FFmpeg 7.1: version 61.3.100 or later
```

## Additional Resources

- [Jellyfin FFmpeg](https://github.com/jellyfin/jellyfin-ffmpeg) - Recommended FFmpeg build
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Node-gyp Documentation](https://github.com/nodejs/node-gyp)
- [N-API Documentation](https://nodejs.org/api/n-api.html)
- [node-av GitHub Repository](https://github.com/seydx/av)