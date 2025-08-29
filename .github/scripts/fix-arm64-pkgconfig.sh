#!/bin/bash
# Fix pkg-config files for ARM64 - replace absolute paths with MSYS2 paths
echo "=== Fixing pkg-config files for ARM64 ==="
for pc in /clangarm64/ffbuild/lib/pkgconfig/*.pc; do
  if [ -f "$pc" ]; then
    echo "Patching $(basename $pc)..."
    # Show original content
    echo "Original:"
    grep -E "^prefix=|^libdir=|^includedir=" "$pc"
    
    # Replace Windows paths with Unix paths
    # This handles any drive letter and any path variation
    sed -i "s|[A-Z]:[/\\\\].*clangarm64/ffbuild|/clangarm64/ffbuild|g" "$pc"
    
    # Show patched content
    echo "After patching:"
    grep -E "^prefix=|^libdir=|^includedir=" "$pc"
    echo ""
  fi
done

# Test pkg-config after patching
echo "Testing pkg-config after patching:"
PKG_CONFIG_PATH=/clangarm64/ffbuild/lib/pkgconfig pkg-config --cflags x264
PKG_CONFIG_PATH=/clangarm64/ffbuild/lib/pkgconfig pkg-config --libs x264
echo "=== pkg-config files fixed ==="