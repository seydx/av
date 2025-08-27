#!/usr/bin/env node

/**
 * Shared utilities for build scripts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache the root path to avoid repeated lookups and logging
let cachedRootPath = null;

/**
 * Get FFmpeg development path
 * @param {'root'|'include'|'lib'|'bin'} target - The target directory to get
 * @returns {string} The path to the requested FFmpeg directory
 */
export const getFFmpegPath = (target = 'root') => {
  // Use cached path if available
  if (cachedRootPath) {
    switch (target) {
      case 'include':
        return path.join(cachedRootPath, 'include');
      case 'lib':
        return path.join(cachedRootPath, 'lib');
      case 'bin':
        return path.join(cachedRootPath, 'bin');
      case 'root':
      default:
        return cachedRootPath;
    }
  }

  let rootPath = null;

  // First check environment variable
  if (process.env.FFMPEG_DEV_PATH) {
    const envPath = process.env.FFMPEG_DEV_PATH;
    if (fs.existsSync(envPath)) {
      rootPath = envPath;
    }
  }

  if (!rootPath) {
    // Try pkg-config for installed FFmpeg
    try {
      const pkgConfigPath = execSync('pkg-config --variable=prefix libavutil', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
      }).trim();
      if (pkgConfigPath && fs.existsSync(pkgConfigPath)) {
        // Verify it has the expected structure
        if (fs.existsSync(path.join(pkgConfigPath, 'include/libavcodec/avcodec.h'))) {
          console.log('Using FFmpeg from pkg-config');
          rootPath = pkgConfigPath;
        }
      }
    } catch {
      // pkg-config not available or libavutil not found
    }
  }

  if (!rootPath) {
    // Check common installation paths
    const commonPaths = [
      '/opt/ffbuild/prefix', // CI builds
      '/usr/local', // Linux/macOS local
      '/opt/homebrew', // macOS Homebrew ARM64
      '/usr/local/opt/ffmpeg', // macOS Homebrew x64
      '/usr', // System-wide Linux
      'C:\\msys64\\clang64', // Windows CLANG64
      'C:\\msys64\\clangarm64', // Windows CLANGARM64
      '/clang64/ffbuild', // Windows CI CLANG64
      '/clangarm64/ffbuild', // Windows CI CLANGARM64
    ];

    for (const testPath of commonPaths) {
      if (fs.existsSync(path.join(testPath, 'include/libavcodec/avcodec.h'))) {
        console.log(`Using FFmpeg from: ${testPath}`);
        rootPath = testPath;
        break;
      }
    }
  }

  // Fallback to source directories if no installed FFmpeg found
  if (!rootPath) {
    // Try Jellyfin FFmpeg source
    const jellyfinPath = path.join(__dirname, '../externals/jellyfin-ffmpeg');
    if (fs.existsSync(jellyfinPath)) {
      console.log('Using Jellyfin FFmpeg source');
      // For source directories, the structure is different
      cachedRootPath = jellyfinPath;
      if (target === 'include') {
        return jellyfinPath; // Source has headers directly in root
      }
      return jellyfinPath;
    }

    // Fallback to original FFmpeg source
    const ffmpegPath = path.join(__dirname, '../externals/ffmpeg');
    console.log('Using original FFmpeg source');
    cachedRootPath = ffmpegPath;
    if (target === 'include') {
      return ffmpegPath; // Source has headers directly in root
    }
    return ffmpegPath;
  }

  // Cache the root path for subsequent calls
  cachedRootPath = rootPath;

  // Return the requested target directory
  switch (target) {
    case 'include':
      return path.join(rootPath, 'include');
    case 'lib':
      return path.join(rootPath, 'lib');
    case 'bin':
      return path.join(rootPath, 'bin');
    case 'root':
    default:
      return rootPath;
  }
};

/**
 * Get library paths for linking
 * @returns {{includePaths: string[], libPaths: string[]}}
 */
export const getFFmpegLinkPaths = () => {
  const includePath = getFFmpegPath('include');
  const libPath = getFFmpegPath('lib');

  // Build lists of possible paths
  const possibleIncludePaths = [
    `-I${includePath}`,
    '/opt/ffbuild/prefix/include', // CI builds
    '/usr/local/include', // Linux/macOS local
    '/opt/homebrew/include', // macOS Homebrew ARM64
    '/usr/local/opt/ffmpeg/include', // macOS Homebrew x64
    'C:\\msys64\\clang64\\include', // Windows CLANG64
    'C:\\msys64\\clangarm64\\include', // Windows CLANGARM64
  ];

  const possibleLibPaths = [
    libPath,
    '/opt/ffbuild/prefix/lib', // CI builds
    '/usr/local/lib', // Linux/macOS local
    '/opt/homebrew/lib', // macOS Homebrew ARM64
    '/usr/local/opt/ffmpeg/lib', // macOS Homebrew x64
    'C:\\msys64\\clang64\\lib', // Windows CLANG64
    'C:\\msys64\\clangarm64\\lib', // Windows CLANGARM64
  ];

  // Filter to only existing paths
  const includePaths = possibleIncludePaths
    .filter((p) => {
      if (p.startsWith('-I')) {
        const path = p.substring(2);
        return fs.existsSync(path);
      }
      return fs.existsSync(p);
    })
    .map((p) => (p.startsWith('-I') ? p : `-I${p}`))
    .join(' ');

  const libPaths = possibleLibPaths
    .filter((p) => fs.existsSync(p))
    .map((p) => `-L${p}`)
    .join(' ');

  return { includePaths, libPaths };
};
