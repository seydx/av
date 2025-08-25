import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const avPath = (): string => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const binaryPath = resolve(__dirname, '../../binary');
  const avExtractedFilePath = resolve(binaryPath, 'av.node');
  return avExtractedFilePath;
};

export const isAvAvailable = (): boolean => {
  return existsSync(avPath());
};
