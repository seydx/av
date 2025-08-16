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

// Get FFmpeg include path from pkg-config
const getFFmpegPath = () => {
  try {
    const flags = execSync('pkg-config --cflags libavcodec', { encoding: 'utf8' });
    const match = flags.match(/-I([^\s]+)/);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.error('FFmpeg not found via pkg-config');
  }

  // Fallback paths
  const paths = ['/opt/homebrew/include', '/usr/local/include', '/usr/include'];

  for (const p of paths) {
    if (fs.existsSync(path.join(p, 'libavcodec/avcodec.h'))) {
      return p;
    }
  }

  throw new Error('FFmpeg headers not found');
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
    execSync(`gcc -I${FFMPEG_PATH} -L/opt/homebrew/lib ${tmpFile} -lavutil -o ${outFile}`, { stdio: 'inherit' });
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