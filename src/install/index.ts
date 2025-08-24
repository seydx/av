import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatform } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const binaryPath = resolve(__dirname, '../binary');
const avFile = 'av' + (getPlatform() === 'win32' ? '.exe' : '');
const avExtractedFilePath = resolve(binaryPath, avFile);

export const avPath = (): string => avExtractedFilePath;

export const isAvAvailable = (): boolean => {
  return existsSync(avExtractedFilePath);
};
