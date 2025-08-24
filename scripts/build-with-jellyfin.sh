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

# Step 1: Build Jellyfin FFmpeg libraries
echo "Building Jellyfin FFmpeg libraries..."
cd "$PROJECT_ROOT/externals/jellyfin-ffmpeg"

case "$PLATFORM" in
    darwin|mac*)
        # macOS needs helper scripts in PATH
        if [ ! -f /opt/ffbuild/bin/git-mini-clone ]; then
            echo "Setting up helper scripts for macOS build..."
            sudo mkdir -p /opt/ffbuild/bin
            sudo cp builder/images/base/git-mini-clone.sh /opt/ffbuild/bin/git-mini-clone
            sudo chmod +x /opt/ffbuild/bin/git-mini-clone
            sudo cp builder/images/base/retry-tool.sh /opt/ffbuild/bin/retry-tool
            sudo chmod +x /opt/ffbuild/bin/retry-tool
            sudo cp builder/images/base/check-wget.sh /opt/ffbuild/bin/check-wget
            sudo chmod +x /opt/ffbuild/bin/check-wget
        fi
        export PATH="/opt/ffbuild/bin:$PATH"
        export PKG_CONFIG_PATH="/opt/ffbuild/prefix/lib/pkgconfig:${PKG_CONFIG_PATH}"
        
        # macOS uses buildmac.sh with architecture parameter (must be run from builder directory)
        cd builder
        ./buildmac.sh "$JELLYFIN_ARCH"
        cd ..
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
        # Windows builds require MSYS2 environment
        if [ -z "$MSYSTEM" ]; then
            echo "Error: Windows builds require MSYS2 environment"
            echo "This script should be run on Windows with MSYS2 or in GitHub Actions with msys2/setup-msys2"
            exit 1
        fi
        
        echo "Detected MSYS2 environment: $MSYSTEM"
        
        # Use the appropriate build script based on architecture
        if [ "$MSYSTEM" = "CLANG64" ] || [ "$NODE_ARCH" = "x64" ]; then
            cd msys2
            ./build.sh
            cd ..
        elif [ "$MSYSTEM" = "CLANGARM64" ] || [ "$NODE_ARCH" = "arm64" ]; then
            cd msys2
            ./buildarm64.sh
            cd ..
        else
            echo "Unsupported MSYS2 environment: $MSYSTEM"
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