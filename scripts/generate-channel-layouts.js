#!/usr/bin/env node

/**
 * Generate TypeScript channel layout constants from FFmpeg headers
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get FFmpeg include path from environment variable or fallback
const getFFmpegPath = () => {
  // First check environment variable
  if (process.env.FFMPEG_INCLUDE_PATH) {
    const envPath = process.env.FFMPEG_INCLUDE_PATH;
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }

  // Try Jellyfin FFmpeg if it exists
  const jellyfinPath = path.join(__dirname, '../externals/jellyfin-ffmpeg');
  if (fs.existsSync(jellyfinPath)) {
    return jellyfinPath;
  }

  // Fallback to original FFmpeg
  return path.join(__dirname, '../externals/ffmpeg');
};

const FFMPEG_PATH = getFFmpegPath();
console.log(`Using FFmpeg headers from: ${FFMPEG_PATH}`);

// Compile and run a C program to get the actual values
const getChannelLayoutValues = () => {
  const cCode = `
#include <stdio.h>
#include <libavutil/channel_layout.h>

int main() {
    // Basic channel masks
    printf("export const AV_CH_FRONT_LEFT = 0x%llxn;\\n", (unsigned long long)AV_CH_FRONT_LEFT);
    printf("export const AV_CH_FRONT_RIGHT = 0x%llxn;\\n", (unsigned long long)AV_CH_FRONT_RIGHT);
    printf("export const AV_CH_FRONT_CENTER = 0x%llxn;\\n", (unsigned long long)AV_CH_FRONT_CENTER);
    printf("export const AV_CH_LOW_FREQUENCY = 0x%llxn;\\n", (unsigned long long)AV_CH_LOW_FREQUENCY);
    printf("export const AV_CH_BACK_LEFT = 0x%llxn;\\n", (unsigned long long)AV_CH_BACK_LEFT);
    printf("export const AV_CH_BACK_RIGHT = 0x%llxn;\\n", (unsigned long long)AV_CH_BACK_RIGHT);
    printf("export const AV_CH_BACK_CENTER = 0x%llxn;\\n", (unsigned long long)AV_CH_BACK_CENTER);
    printf("export const AV_CH_SIDE_LEFT = 0x%llxn;\\n", (unsigned long long)AV_CH_SIDE_LEFT);
    printf("export const AV_CH_SIDE_RIGHT = 0x%llxn;\\n", (unsigned long long)AV_CH_SIDE_RIGHT);
    
    printf("\\n// Channel layouts\\n");
    
    // Standard layouts - these are bitmasks
    printf("export const AV_CH_LAYOUT_MONO = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_MONO);
    printf("export const AV_CH_LAYOUT_STEREO = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_STEREO);
    printf("export const AV_CH_LAYOUT_2POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_2POINT1);
    printf("export const AV_CH_LAYOUT_SURROUND = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_SURROUND);
    printf("export const AV_CH_LAYOUT_3POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_3POINT1);
    printf("export const AV_CH_LAYOUT_4POINT0 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_4POINT0);
    printf("export const AV_CH_LAYOUT_4POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_4POINT1);
    printf("export const AV_CH_LAYOUT_QUAD = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_QUAD);
    printf("export const AV_CH_LAYOUT_5POINT0 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_5POINT0);
    printf("export const AV_CH_LAYOUT_5POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_5POINT1);
    printf("export const AV_CH_LAYOUT_5POINT0_BACK = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_5POINT0_BACK);
    printf("export const AV_CH_LAYOUT_5POINT1_BACK = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_5POINT1_BACK);
    printf("export const AV_CH_LAYOUT_6POINT0 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_6POINT0);
    printf("export const AV_CH_LAYOUT_6POINT0_FRONT = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_6POINT0_FRONT);
    printf("export const AV_CH_LAYOUT_6POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_6POINT1);
    printf("export const AV_CH_LAYOUT_7POINT0 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_7POINT0);
    printf("export const AV_CH_LAYOUT_7POINT1 = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_7POINT1);
    printf("export const AV_CH_LAYOUT_OCTAGONAL = 0x%llxn;\\n", (unsigned long long)AV_CH_LAYOUT_OCTAGONAL);
    
    printf("\\n// Modern AVChannelLayout structures as ChannelLayout objects\\n");
    printf("// order: 1 = AV_CHANNEL_ORDER_NATIVE\\n");
    
    // Get channel counts
    AVChannelLayout mono = AV_CHANNEL_LAYOUT_MONO;
    AVChannelLayout stereo = AV_CHANNEL_LAYOUT_STEREO;
    AVChannelLayout surround_2_1 = AV_CHANNEL_LAYOUT_2POINT1;
    AVChannelLayout surround = AV_CHANNEL_LAYOUT_SURROUND;
    AVChannelLayout surround_3_1 = AV_CHANNEL_LAYOUT_3POINT1;
    AVChannelLayout surround_4_0 = AV_CHANNEL_LAYOUT_4POINT0;
    AVChannelLayout surround_4_1 = AV_CHANNEL_LAYOUT_4POINT1;
    AVChannelLayout quad = AV_CHANNEL_LAYOUT_QUAD;
    AVChannelLayout surround_5_0 = AV_CHANNEL_LAYOUT_5POINT0;
    AVChannelLayout surround_5_1 = AV_CHANNEL_LAYOUT_5POINT1;
    AVChannelLayout surround_5_0_back = AV_CHANNEL_LAYOUT_5POINT0_BACK;
    AVChannelLayout surround_5_1_back = AV_CHANNEL_LAYOUT_5POINT1_BACK;
    AVChannelLayout surround_6_0 = AV_CHANNEL_LAYOUT_6POINT0;
    AVChannelLayout surround_6_0_front = AV_CHANNEL_LAYOUT_6POINT0_FRONT;
    AVChannelLayout surround_6_1 = AV_CHANNEL_LAYOUT_6POINT1;
    AVChannelLayout surround_7_0 = AV_CHANNEL_LAYOUT_7POINT0;
    AVChannelLayout surround_7_1 = AV_CHANNEL_LAYOUT_7POINT1;
    AVChannelLayout octagonal = AV_CHANNEL_LAYOUT_OCTAGONAL;
    
    printf("export const AV_CHANNEL_LAYOUT_MONO: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           mono.nb_channels, (unsigned long long)mono.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_STEREO: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           stereo.nb_channels, (unsigned long long)stereo.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_2POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_2_1.nb_channels, (unsigned long long)surround_2_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_SURROUND: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround.nb_channels, (unsigned long long)surround.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_3POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_3_1.nb_channels, (unsigned long long)surround_3_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_4POINT0: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_4_0.nb_channels, (unsigned long long)surround_4_0.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_4POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_4_1.nb_channels, (unsigned long long)surround_4_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_QUAD: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           quad.nb_channels, (unsigned long long)quad.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_5POINT0: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_5_0.nb_channels, (unsigned long long)surround_5_0.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_5POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_5_1.nb_channels, (unsigned long long)surround_5_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_5POINT0_BACK: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_5_0_back.nb_channels, (unsigned long long)surround_5_0_back.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_5POINT1_BACK: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_5_1_back.nb_channels, (unsigned long long)surround_5_1_back.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_6POINT0: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_6_0.nb_channels, (unsigned long long)surround_6_0.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_6POINT0_FRONT: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_6_0_front.nb_channels, (unsigned long long)surround_6_0_front.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_6POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_6_1.nb_channels, (unsigned long long)surround_6_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_7POINT0: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_7_0.nb_channels, (unsigned long long)surround_7_0.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_7POINT1: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           surround_7_1.nb_channels, (unsigned long long)surround_7_1.u.mask);
    printf("export const AV_CHANNEL_LAYOUT_OCTAGONAL: ChannelLayout = { order: 1, nbChannels: %d, mask: 0x%llxn };\\n", 
           octagonal.nb_channels, (unsigned long long)octagonal.u.mask);
    
    return 0;
}
`;

  // Write C code to temp file
  const tmpFile = path.join('/tmp', 'channel_layouts.c');
  const outFile = path.join('/tmp', 'channel_layouts');
  fs.writeFileSync(tmpFile, cCode);

  // Compile and run
  try {
    // Dynamically determine include and lib paths based on what exists
    const possibleIncludePaths = [
      `-I${FFMPEG_PATH}`,
      '/opt/ffbuild/prefix/include', // CI builds
      '/usr/local/include', // Linux/macOS local
      '/opt/homebrew/include', // macOS Homebrew ARM64
      '/usr/local/opt/ffmpeg/include', // macOS Homebrew x64
      'C:\\msys64\\clang64\\include', // Windows CLANG64
      'C:\\msys64\\clangarm64\\include', // Windows CLANGARM64
      '/clang64/ffbuild/include', // Windows CI CLANG64
      '/clangarm64/ffbuild/include', // Windows CI CLANGARM64
    ];

    const possibleLibPaths = [
      '/opt/ffbuild/prefix/lib', // CI builds
      '/usr/local/lib', // Linux/macOS local
      '/opt/homebrew/lib', // macOS Homebrew ARM64
      '/usr/local/opt/ffmpeg/lib', // macOS Homebrew x64
      'C:\\msys64\\clang64\\lib', // Windows CLANG64
      'C:\\msys64\\clangarm64\\lib', // Windows CLANGARM64
      '/clang64/ffbuild/lib', // Windows CI CLANG64
      '/clangarm64/ffbuild/lib', // Windows CI CLANGARM64
    ];

    // Filter to only existing paths
    const includePaths = possibleIncludePaths
      .filter((p) => !p.startsWith('-I') || fs.existsSync(p.substring(2)))
      .map((p) => (p.startsWith('-I') ? p : `-I${p}`))
      .filter((p) => {
        const path = p.substring(2);
        return path === FFMPEG_PATH || fs.existsSync(path);
      })
      .join(' ');

    const libPaths = possibleLibPaths
      .filter((p) => fs.existsSync(p))
      .map((p) => `-L${p}`)
      .join(' ');

    // Try to use pkg-config if available
    let pkgConfigFlags = '';
    try {
      pkgConfigFlags = execSync('pkg-config --cflags --libs libavutil', { encoding: 'utf8' }).trim();
    } catch {
      // pkg-config not available, use manual paths
    }

    const compileCmd = pkgConfigFlags
      ? `gcc ${includePaths} ${tmpFile} ${pkgConfigFlags} -o ${outFile}`
      : `gcc ${includePaths} ${libPaths} ${tmpFile} -lavutil -o ${outFile}`;

    execSync(compileCmd, { stdio: 'inherit' });
    const output = execSync(outFile, { encoding: 'utf8' });

    // Clean up
    fs.unlinkSync(tmpFile);
    fs.unlinkSync(outFile);

    return output;
  } catch (error) {
    console.error('Failed to compile/run C code:', error);
    throw error;
  }
};

// Generate the file
const generateChannelLayoutsFile = () => {
  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'channel-layouts.ts');

  let content = `/**
 * FFmpeg Channel Layout Constants
 * Auto-generated from FFmpeg headers
 * DO NOT EDIT MANUALLY
 */

import type { ChannelLayout } from './types.js';

// Channel masks (for legacy API)
`;

  const values = getChannelLayoutValues();
  content += values;

  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${outputPath}`);
};

// Run
generateChannelLayoutsFile();
