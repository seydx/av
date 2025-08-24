#!/bin/bash
set -e

# Build script for @seydx/av with Jellyfin FFmpeg
# This script extends Jellyfin's build process to include Node.js bindings

PLATFORM="${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${2:-$(uname -m)}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Map architecture names
case "$ARCH" in
    x86_64|amd64|x64|mac64|linux64|win64) 
        NODE_ARCH="x64"
        ARCH_BASE="64"
        ;;
    arm64|aarch64|macarm64|linuxarm64|winarm64) 
        NODE_ARCH="arm64"
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

# Set Jellyfin architecture
JELLYFIN_ARCH="${PLATFORM}${ARCH_BASE}"

echo "Building for $PLATFORM-$NODE_ARCH (Jellyfin: $JELLYFIN_ARCH)"

# Step 1: Build Jellyfin FFmpeg libraries only (no binaries)
echo "Building Jellyfin FFmpeg libraries..."
cd "$PROJECT_ROOT/externals/jellyfin-ffmpeg"

# Configure to build only libraries, no programs (no ffmpeg, ffprobe, ffplay)
export FFMPEG_CONFIGURE_OPTIONS="--disable-programs --disable-doc --disable-ffmpeg --disable-ffprobe --disable-ffplay"

case "$PLATFORM" in
    darwin|mac*)
        ./builder/buildmac.sh "$ARCH"
        ;;
    linux)
        ./build-${JELLYFIN_ARCH}
        ;;
    win*)
        ./build-${JELLYFIN_ARCH}-clang
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

# Build for Node v22
echo "Building for Node.js v22..."
if ! npx prebuildify \
    --runtime=node \
    --target=22.0.0 \
    --arch="$NODE_ARCH" \
    --strip \
    --tag-libc \
    -- --gyp-file=binding-jellyfin.gyp; then
    echo "Error: Failed to build for Node.js v22"
    exit 1
fi

# Build for Electron v37
echo "Building for Electron v37..."
if ! npx prebuildify \
    --runtime=electron \
    --target=37.0.0 \
    --arch="$NODE_ARCH" \
    --strip \
    --tag-libc \
    -- --gyp-file=binding-jellyfin.gyp; then
    echo "Error: Failed to build for Electron v37"
    exit 1
fi

echo "✅ Build complete!"
echo ""
echo "📦 Node.js bindings built:"
echo "  Location: prebuilds/"
echo "  Platform: $PLATFORM-$NODE_ARCH"
echo ""
echo "Note: Only FFmpeg libraries were built (no ffmpeg/ffprobe binaries)"