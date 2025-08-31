#!/usr/bin/env node

/**
 * Generate TypeScript channel layout constants from FFmpeg headers
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getFFmpegLinkPaths, getFFmpegPath } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FFMPEG_PATH = getFFmpegPath('include');
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

  // Write C code to temp file (use OS temp directory for cross-platform compatibility)
  const tmpDir = tmpdir();
  const tmpFile = join(tmpDir, 'channel_layouts.c');
  // Add .exe extension on Windows
  const outFile = join(tmpDir, process.platform === 'win32' ? 'channel_layouts.exe' : 'channel_layouts');
  writeFileSync(tmpFile, cCode);

  // Compile and run
  try {
    // Get include and lib paths using the utility function
    const { includePaths, libPaths } = getFFmpegLinkPaths();

    // For CI builds with static libraries, use direct static linking
    let compileCmd;
    if (existsSync('/opt/ffbuild/prefix/lib/libavutil.a')) {
      // CI build with static libraries (Linux/macOS)
      compileCmd = `gcc ${includePaths} ${tmpFile} -L/opt/ffbuild/prefix/lib /opt/ffbuild/prefix/lib/libavutil.a -lm -pthread -o ${outFile}`;
    } else if (existsSync('/clang64/ffbuild/lib/libavutil.a')) {
      // Windows CLANG64 CI build with static libraries
      compileCmd = `gcc ${includePaths} ${tmpFile} -L/clang64/ffbuild/lib /clang64/ffbuild/lib/libavutil.a -lm -pthread -o ${outFile}`;
    } else if (existsSync('/clangarm64/ffbuild/lib/libavutil.a')) {
      // Windows CLANGARM64 CI build with static libraries
      compileCmd = `gcc ${includePaths} ${tmpFile} -L/clangarm64/ffbuild/lib /clangarm64/ffbuild/lib/libavutil.a -lm -pthread -o ${outFile}`;
    } else {
      // Try to use pkg-config if available
      let pkgConfigFlags = '';
      try {
        pkgConfigFlags = execSync('pkg-config --cflags --libs libavutil', { encoding: 'utf8' }).trim();
      } catch {
        // pkg-config not available, use manual paths
      }

      compileCmd = pkgConfigFlags
        ? `gcc ${includePaths} ${tmpFile} ${pkgConfigFlags} -o ${outFile}`
        : `gcc ${includePaths} ${libPaths} ${tmpFile} -lavutil -o ${outFile}`;
    }

    execSync(compileCmd, { stdio: 'inherit' });
    const output = execSync(outFile, { encoding: 'utf8' });

    // Clean up - ignore errors if files don't exist
    try {
      unlinkSync(tmpFile);
    } catch {
      // Ignore error if file doesn't exist
    }
    try {
      unlinkSync(outFile);
    } catch {
      // Ignore error if file doesn't exist
    }

    return output;
  } catch (error) {
    console.error('Failed to compile/run C code:', error);
    throw error;
  }
};

// Generate the file
const generateChannelLayoutsFile = () => {
  const outputPath = join(__dirname, '..', 'src', 'constants', 'channel-layouts.ts');

  let content = `/**
 * FFmpeg Channel Layout Constants
 * Auto-generated from FFmpeg headers
 * DO NOT EDIT MANUALLY
 */

import type { ChannelLayout } from '../lib/types.js';

// Channel masks (for legacy API)
`;

  const values = getChannelLayoutValues();
  content += values;

  writeFileSync(outputPath, content);
  console.log(`Generated ${outputPath}`);
};

// Run
generateChannelLayoutsFile();
