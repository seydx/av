#!/usr/bin/env node

/**
 * Generate TypeScript constants for all available FFmpeg decoders
 * This extracts decoder names directly from FFmpeg source code (allcodecs.c)
 * to get ALL compiled decoders, including hardware decoders
 *
 * Optionally applies Jellyfin patches before extraction to get all decoder definitions
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getFFmpegPath } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FFMPEG_PATH = getFFmpegPath('');
const ALLCODECS_PATH = join(FFMPEG_PATH, 'libavcodec', 'allcodecs.c');
const PATCHES_DIR = join(FFMPEG_PATH, 'debian', 'patches');

console.log(`Using FFmpeg source from: ${FFMPEG_PATH}`);

/**
 * Extract decoder definitions from patch files
 */
const extractDecodersFromPatches = () => {
  const patchedDecoders = [];

  // Check if patches directory exists
  if (!existsSync(PATCHES_DIR)) {
    return patchedDecoders;
  }

  const patchFiles = readdirSync(PATCHES_DIR).filter((f) => f.endsWith('.patch'));

  console.log(`Scanning ${patchFiles.length} patch files for decoder definitions...`);

  for (const patchFile of patchFiles) {
    const content = readFileSync(join(PATCHES_DIR, patchFile), 'utf8');

    // Look for added decoder declarations in patches
    // Format: +extern const FFCodec ff_<name>_decoder;
    const decoderPattern = /\+extern const FFCodec ff_(\w+)_decoder;/g;
    let match;
    let patchDecoders = [];

    while ((match = decoderPattern.exec(content)) !== null) {
      const name = match[1].replace(/_/g, '-');
      patchDecoders.push(name);
      patchedDecoders.push(name);
    }

    if (patchDecoders.length > 0) {
      console.log(`  ${patchFile}: found ${patchDecoders.length} decoder(s): ${patchDecoders.join(', ')}`);
    }
  }

  return [...new Set(patchedDecoders)]; // Deduplicate
};

console.log(`Reading decoder definitions from: ${ALLCODECS_PATH}`);

/**
 * Extract all decoder names from allcodecs.c
 */
const extractDecoders = (includePatches = false) => {
  if (!existsSync(ALLCODECS_PATH)) {
    throw new Error(`Could not find allcodecs.c at ${ALLCODECS_PATH}`);
  }

  const content = readFileSync(ALLCODECS_PATH, 'utf8');

  // Extract all decoder declarations
  // Format: extern const FFCodec ff_<name>_decoder;
  const decoderPattern = /extern const FFCodec ff_(\w+)_decoder;/g;
  const decoders = [];
  let match;

  while ((match = decoderPattern.exec(content)) !== null) {
    // Convert underscore to dash (FFmpeg naming convention)
    const name = match[1].replace(/_/g, '-');
    decoders.push(name);
  }

  // Add decoders from patches if requested
  if (includePatches) {
    const patchDecoders = extractDecodersFromPatches();
    if (patchDecoders.length > 0) {
      console.log(`\nAdding ${patchDecoders.length} decoder(s) from patches`);
      decoders.push(...patchDecoders);
    }
  }

  return [...new Set(decoders)].sort(); // Deduplicate and sort
};

/**
 * Categorize decoder by type and hardware
 */
const categorizeDecoder = (name) => {
  // Determine media type
  let mediaType = 'video'; // Default to video

  // Audio decoder patterns
  if (
    name.match(
      // eslint-disable-next-line @stylistic/max-len
      /^(aac|ac3|ac4|eac3|mp1|mp2|mp3|opus|flac|vorbis|alac|tta|wavpack|mlp|truehd|dca|dts|pcm|adpcm|g72|aptx|sbc|libmp3|libopus|libvorbis|libfdk|libspeex|nellymoser|wmav|wma|real|sonic|dfpwm|comfortnoise|s302m|roq-dpcm|ilbc|gsm|amr|atrac|cook|dolby|imc|mace|metasound|musepack|on2avc|paf-audio|qcelp|qdm|ra-|ralf|sipr|tak|truespeech|twinvq|vmdaudio|wavarc|westwood-snd1|xma|at$|at-|mf$|-mf-)/,
    )
  ) {
    mediaType = 'audio';
  } else if (
    name.match(/^(ass|ssa|srt|subrip|webvtt|dvbsub|dvdsub|mov-text|text|ttml|xsub|cc-dec|hdmv-pgs|jacosub|microdvd|mpl2|pjs|realtext|sami|stl|subviewer|vplayer)/)
  ) {
    // Subtitle decoder patterns
    mediaType = 'subtitle';
  }

  // Determine if hardware accelerated
  let isHardware = false;
  let hardwareType = null;

  if (name.includes('-cuvid')) {
    isHardware = true;
    hardwareType = 'NVIDIA CUVID';
  } else if (name.includes('-nvdec')) {
    isHardware = true;
    hardwareType = 'NVIDIA NVDEC';
  } else if (name.includes('-qsv')) {
    isHardware = true;
    hardwareType = 'Intel Quick Sync';
  } else if (name.includes('-vaapi')) {
    isHardware = true;
    hardwareType = 'VA-API';
  } else if (name.includes('-vdpau')) {
    isHardware = true;
    hardwareType = 'VDPAU';
  } else if (name.includes('-videotoolbox')) {
    isHardware = true;
    hardwareType = 'VideoToolbox (macOS)';
  } else if (name.includes('-mediacodec')) {
    isHardware = true;
    hardwareType = 'Android MediaCodec';
  } else if (name.includes('-v4l2m2m')) {
    isHardware = true;
    hardwareType = 'V4L2 M2M';
  } else if (name.includes('-d3d12va')) {
    isHardware = true;
    hardwareType = 'Direct3D 12';
  } else if (name.includes('-d3d11va')) {
    isHardware = true;
    hardwareType = 'Direct3D 11';
  } else if (name.includes('-dxva2')) {
    isHardware = true;
    hardwareType = 'DXVA2';
  } else if (name.includes('-vulkan')) {
    isHardware = true;
    hardwareType = 'Vulkan';
  } else if (name.includes('-rkmpp')) {
    isHardware = true;
    hardwareType = 'Rockchip MPP';
  } else if (name.includes('-mmal')) {
    isHardware = true;
    hardwareType = 'Raspberry Pi MMAL';
  } else if (name.endsWith('-at')) {
    isHardware = true;
    hardwareType = 'AudioToolbox (macOS)';
  }

  return { mediaType, isHardware, hardwareType };
};

/**
 * Convert decoder name to constant name
 */
const toConstantName = (name) => {
  return 'DECODER_' + name.toUpperCase().replace(/-/g, '_');
};

/**
 * Generate TypeScript output
 */
const generateTypeScript = (includePatches = false) => {
  const decoders = extractDecoders(includePatches);

  console.log(`\nFound ${decoders.length} decoders in FFmpeg source`);

  // Categorize decoders
  const videoDecoders = [];
  const audioDecoders = [];
  const subtitleDecoders = [];

  for (const decoder of decoders) {
    const { mediaType } = categorizeDecoder(decoder);

    if (mediaType === 'audio') {
      audioDecoders.push(decoder);
    } else if (mediaType === 'subtitle') {
      subtitleDecoders.push(decoder);
    } else {
      videoDecoders.push(decoder);
    }
  }

  // Further categorize by hardware
  const videoHw = videoDecoders.filter((d) => categorizeDecoder(d).isHardware);
  const videoSw = videoDecoders.filter((d) => !categorizeDecoder(d).isHardware);
  const audioHw = audioDecoders.filter((d) => categorizeDecoder(d).isHardware);
  const audioSw = audioDecoders.filter((d) => !categorizeDecoder(d).isHardware);

  console.log(`Video decoders: ${videoDecoders.length} (${videoSw.length} software, ${videoHw.length} hardware)`);
  console.log(`Audio decoders: ${audioDecoders.length} (${audioSw.length} software, ${audioHw.length} hardware)`);
  console.log(`Subtitle decoders: ${subtitleDecoders.length}`);

  let output = `/**
 * Auto-generated FFmpeg decoder constants
 * Generated from FFmpeg source code (allcodecs.c)
 * DO NOT EDIT MANUALLY
 */

// Brand symbol for type safety
const __decoder_brand = Symbol('__decoder_brand');

// Decoder name types
export type DecoderName = string & { readonly [__decoder_brand]: 'DecoderName' };
export type VideoDecoderName = DecoderName & { readonly __type: 'video' };
export type AudioDecoderName = DecoderName & { readonly __type: 'audio' };
export type SubtitleDecoderName = DecoderName & { readonly __type: 'subtitle' };

`;

  // Generate video decoders
  output += '// ============================================================================\n';
  output += `// VIDEO DECODERS (${videoSw.length} software, ${videoHw.length} hardware)\n`;
  output += '// ============================================================================\n\n';

  if (videoSw.length > 0) {
    output += '// Software video decoders\n';
    for (const decoder of videoSw.sort()) {
      const constName = toConstantName(decoder);
      output += `export const ${constName} = '${decoder}' as VideoDecoderName;\n`;
    }
    output += '\n';
  }

  if (videoHw.length > 0) {
    output += '// Hardware video decoders\n';

    // Group by hardware type
    const hwGroups = {};
    for (const decoder of videoHw) {
      const { hardwareType } = categorizeDecoder(decoder);
      if (!hwGroups[hardwareType]) {
        hwGroups[hardwareType] = [];
      }
      hwGroups[hardwareType].push(decoder);
    }

    for (const [hwType, decoders] of Object.entries(hwGroups)) {
      output += `\n// ${hwType}\n`;
      for (const decoder of decoders.sort()) {
        const constName = toConstantName(decoder);
        output += `export const ${constName} = '${decoder}' as VideoDecoderName;\n`;
      }
    }
    output += '\n';
  }

  // Generate audio decoders
  output += '// ============================================================================\n';
  output += `// AUDIO DECODERS (${audioSw.length} software, ${audioHw.length} hardware)\n`;
  output += '// ============================================================================\n\n';

  if (audioSw.length > 0) {
    output += '// Software audio decoders\n';
    for (const decoder of audioSw.sort()) {
      const constName = toConstantName(decoder);
      output += `export const ${constName} = '${decoder}' as AudioDecoderName;\n`;
    }
    output += '\n';
  }

  if (audioHw.length > 0) {
    output += '// Hardware audio decoders\n';
    for (const decoder of audioHw.sort()) {
      const constName = toConstantName(decoder);
      output += `export const ${constName} = '${decoder}' as AudioDecoderName;\n`;
    }
    output += '\n';
  }

  // Generate subtitle decoders
  if (subtitleDecoders.length > 0) {
    output += '// ============================================================================\n';
    output += `// SUBTITLE DECODERS (${subtitleDecoders.length} decoders)\n`;
    output += '// ============================================================================\n\n';

    for (const decoder of subtitleDecoders.sort()) {
      const constName = toConstantName(decoder);
      output += `export const ${constName} = '${decoder}' as SubtitleDecoderName;\n`;
    }
    output += '\n';
  }

  return output;
};

// Main
const main = () => {
  console.log('Extracting all FFmpeg decoders from source...');

  try {
    // Check if --with-patches flag is provided
    const withPatches = process.argv.includes('--with-patches');

    const output = generateTypeScript(withPatches);
    const outputPath = join(__dirname, '..', 'src', 'constants', 'decoders.ts');

    // Create directory if it doesn't exist
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, output);
    console.log(`\nGenerated decoder constants at: ${outputPath}`);

    // Show summary
    const lines = output.split('\n').length;
    const constants = (output.match(/export const DECODER_/g) || []).length;

    console.log(`Generated: ${lines} lines, ${constants} decoder constants`);

    if (withPatches) {
      console.log('(Including decoders from patch files)');
    }
  } catch (error) {
    console.error('Error generating decoder constants:', error);
    process.exit(1);
  }
};

main();
