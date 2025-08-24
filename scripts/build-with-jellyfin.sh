#!/bin/bash
set -e

# Build script for @seydx/av with Jellyfin FFmpeg
# This script extends Jellyfin's build process to include Node.js bindings

PLATFORM="${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${2:-$(uname -m)}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Map our naming to what Jellyfin expects
case "$ARCH" in
    x86_64|amd64|x64|mac64|linux64|win64) 
        NODE_ARCH="x64"
        JELLYFIN_ARCH="x86_64"  # For macOS
        ARCH_BASE="64"
        ;;
    arm64|aarch64|macarm64|linuxarm64|winarm64) 
        NODE_ARCH="arm64"
        JELLYFIN_ARCH="arm64"   # For macOS
        ARCH_BASE="arm64"
        ;;
    *) 
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Windows uses different naming
if [ "$PLATFORM" = "windows" ] || [ "$PLATFORM" = "win32" ] || [ "$PLATFORM" = "win" ]; then
    PLATFORM="win"
fi

echo "Building for $PLATFORM-$NODE_ARCH"

# Step 1: Build Jellyfin FFmpeg libraries only (no binaries)
echo "Building Jellyfin FFmpeg libraries..."
cd "$PROJECT_ROOT/externals/jellyfin-ffmpeg"

# Configure to build only libraries, no programs (no ffmpeg, ffprobe, ffplay)
export FFMPEG_CONFIGURE_OPTIONS="--disable-programs --disable-doc --disable-ffmpeg --disable-ffprobe --disable-ffplay"

case "$PLATFORM" in
    darwin|mac*)
        # macOS uses buildmac.sh with architecture parameter
        ./builder/buildmac.sh "$JELLYFIN_ARCH"
        ;;
    linux)
        # Linux has specific build scripts
        if [ "$NODE_ARCH" = "x64" ]; then
            ./build-linux-amd64
        elif [ "$NODE_ARCH" = "arm64" ]; then
            ./build-linux-arm64
        else
            echo "Unsupported Linux architecture: $NODE_ARCH"
            exit 1
        fi
        ;;
    win*)
        # Windows has different build scripts for x64 and ARM64
        if [ "$NODE_ARCH" = "x64" ]; then
            ./build-windows-win64
        elif [ "$NODE_ARCH" = "arm64" ]; then
            # Windows ARM64 uses MSYS2 build
            cd msys2
            ./buildarm64.sh
            cd ..
        else
            echo "Unsupported Windows architecture: $NODE_ARCH"
            exit 1
        fi
        ;;
esac

# Step 2: Build Node.js bindings
echo "Building Node.js bindings..."
cd "$PROJECT_ROOT"

# Setup environment
export PKG_CONFIG_PATH="/opt/ffbuild/prefix/lib/pkgconfig:${PKG_CONFIG_PATH}"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci --ignore-scripts
fi

# Get the targets from environment or use defaults
NODE_TARGETS="${NODE_TARGETS:-22.0.0}"
ELECTRON_TARGETS="${ELECTRON_TARGETS:-37.0.0}"

# Build for each Node.js target
for target in $NODE_TARGETS; do
    echo "Building for Node.js v${target}..."
    if ! npx prebuildify \
        --runtime=node \
        --target="${target}" \
        --arch="$NODE_ARCH" \
        --strip \
        --tag-libc \
        -- --gyp-file=binding-jellyfin.gyp; then
        echo "Error: Failed to build for Node.js v${target}"
        exit 1
    fi
done

# Build for each Electron target
for target in $ELECTRON_TARGETS; do
    echo "Building for Electron v${target}..."
    if ! npx prebuildify \
        --runtime=electron \
        --target="${target}" \
        --arch="$NODE_ARCH" \
        --strip \
        --tag-libc \
        -- --gyp-file=binding-jellyfin.gyp; then
        echo "Error: Failed to build for Electron v${target}"
        exit 1
    fi
done

echo "✅ Build complete!"
echo ""
echo "📦 Node.js bindings built:"
echo "  Location: prebuilds/"
echo "  Platform: $PLATFORM-$NODE_ARCH"
echo "  Node targets: $NODE_TARGETS"
echo "  Electron targets: $ELECTRON_TARGETS"
echo ""
echo "Note: Only FFmpeg libraries were built (no ffmpeg/ffprobe binaries)"