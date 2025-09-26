import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPlatform } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ffmpegBinaryPath = resolve(__dirname, '../../binary');
const ffmpegFile = 'ffmpeg' + (getPlatform() === 'win32' ? '.exe' : '');
const ffmpegExtractedFilePath = resolve(ffmpegBinaryPath, ffmpegFile);

export const ffmpegPath = (): string => ffmpegExtractedFilePath;

export const isFfmpegAvailable = (): boolean => {
  return existsSync(ffmpegExtractedFilePath);
};
