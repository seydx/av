import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLogLevelName, setLogCallback, setLogLevel } from '../src/lib/index.js';

import type { AVLogLevel } from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function ffmpegLog(name: string, l: AVLogLevel) {
  setLogLevel(l);

  setLogCallback((level, message) => {
    const levelName = getLogLevelName(level);
    console.log(`[${name}] [${levelName}] ${message}`);
  });
}

export function resetFFmpegLog() {
  setLogCallback(null);
}

const config = {
  // Parse verbose flag from command line
  verbose: process.argv.includes('-v') || process.argv.includes('--verbose'),

  // File paths
  inputFile: resolve(__dirname, '../testdata/video.mp4'),
  outputFile: (name: string, ext = 'mp4') => resolve(__dirname, `./.tmp/output_${name}.${ext}`),

  // Video filters
  filter1: 'scale=640:360',
  filter2: 'transpose=cclock',
  filter3: 'hflip',
  filter4: 'vflip',
  filter5: 'crop=100:100:0:0',

  // Transcoding presets
  transcoding: {
    // Output codec settings
    videoCodec: 'libx264', // H.264 encoder
    audioCodec: 'aac', // AAC encoder

    // Video settings
    videoBitrate: 1000000n, // 1 Mbps
    videoPreset: 'medium', // x264 preset (ultrafast, fast, medium, slow, veryslow)
    videoCrf: 23, // Constant Rate Factor (0-51, lower = better quality)

    // Audio settings
    audioBitrate: 128000n, // 128 kbps
    audioSampleRate: 44100, // 44.1 kHz
    audioChannels: 2, // Stereo

    // Scaling
    outputWidth: 1280,
    outputHeight: 720,
  },

  // Hardware acceleration
  hardware: {
    device: 'videotoolbox', // or 'cuda', 'vaapi', etc.
    encoder: 'h264_videotoolbox',
    decoder: 'h264',
  },
};

export { config };
