import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPlatform } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ffmpegBinaryPath = resolve(__dirname, '../../binary');
const ffmpegFile = 'ffmpeg' + (getPlatform() === 'win32' ? '.exe' : '');
const ffmpegExtractedFilePath = resolve(ffmpegBinaryPath, ffmpegFile);

/**
 * Get the absolute path to the FFmpeg binary.
 *
 * Returns the path to the FFmpeg executable that was automatically downloaded
 * during package installation. The binary is platform-specific and matches
 * the FFmpeg version used by the native bindings.
 *
 * @returns {string} Absolute path to the FFmpeg binary
 *
 * @example
 * ```typescript
 * import { ffmpegPath } from 'node-av/ffmpeg';
 *
 * const path = ffmpegPath();
 * console.log('FFmpeg binary at:', path);
 * // On Windows: C:\path\to\node_modules\node-av\binary\ffmpeg.exe
 * // On Unix: /path/to/node_modules/node-av/binary/ffmpeg
 * ```
 *
 * @example Convert video using FFmpeg binary
 * ```typescript
 * import { ffmpegPath } from 'node-av/ffmpeg';
 * import { execFile } from 'node:child_process';
 * import { promisify } from 'node:util';
 *
 * const execFileAsync = promisify(execFile);
 *
 * async function convertVideo(input: string, output: string) {
 *   const args = [
 *     '-i', input,
 *     '-c:v', 'libx264',
 *     '-crf', '23',
 *     '-c:a', 'aac',
 *     output
 *   ];
 *
 *   await execFileAsync(ffmpegPath(), args);
 * }
 * ```
 */
export function ffmpegPath(): string {
  return ffmpegExtractedFilePath;
}

/**
 * Check if the FFmpeg binary is available and executable.
 *
 * Verifies that the FFmpeg binary exists at the expected location.
 * This is useful for checking if the installation was successful
 * before attempting to use the binary.
 *
 * @returns {boolean} `true` if FFmpeg binary exists, `false` otherwise
 *
 * @example
 * ```typescript
 * import { isFfmpegAvailable, ffmpegPath } from 'node-av/ffmpeg';
 *
 * if (isFfmpegAvailable()) {
 *   console.log('FFmpeg is ready to use');
 *   // Safe to use ffmpegPath() and execute FFmpeg commands
 * } else {
 *   console.log('FFmpeg binary not found');
 *   console.log('Expected location:', ffmpegPath());
 *   console.log('Try running: npm install node-av');
 * }
 * ```
 *
 * @example Conditional FFmpeg usage
 * ```typescript
 * import { isFfmpegAvailable, ffmpegPath } from 'node-av/ffmpeg';
 * import { execFile } from 'node:child_process';
 *
 * async function getFFmpegVersion(): Promise<string | null> {
 *   if (!isFfmpegAvailable()) {
 *     return null;
 *   }
 *
 *   try {
 *     const { stdout } = await execFile(ffmpegPath(), ['-version']);
 *     return stdout;
 *   } catch (error) {
 *     console.error('Failed to execute FFmpeg:', error);
 *     return null;
 *   }
 * }
 * ```
 */
export function isFfmpegAvailable(): boolean {
  return existsSync(ffmpegExtractedFilePath);
}
