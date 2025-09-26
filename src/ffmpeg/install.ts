#!/usr/bin/env node

import axios from 'axios';
import { chmodSync, createWriteStream, mkdirSync, rmSync } from 'node:fs';
import { rename } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { Open } from 'unzipper';

import { ffmpegPath } from './index.js';
import { getArchitecture, getPlatform } from './utils.js';

import type { AxiosProgressEvent } from 'axios';
import type { ARCH } from './utils.js';

type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

type FFMPEG_BINARIES = PartialRecord<NodeJS.Platform, PartialRecord<ARCH, string>>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __require = createRequire(import.meta.url);

const releasesUrl = 'https://api.github.com/repos/seydx/node-av/releases';
const ffmpegVersion = 'v7.1.2';
const pJson = __require('../../package.json');

const binaries: FFMPEG_BINARIES = {
  darwin: {
    x64: `ffmpeg-${ffmpegVersion}-macos-x64-jellyfin.zip`,
    arm64: `ffmpeg-${ffmpegVersion}-macos-arm64-jellyfin.zip`,
  },
  linux: {
    x64: `ffmpeg-${ffmpegVersion}-linux-x64-jellyfin.zip`,
    arm64: `ffmpeg-${ffmpegVersion}-linux-arm64-jellyfin.zip`,
  },
  win32: {
    x64: `ffmpeg-${ffmpegVersion}-win-x64.zip`,
    arm64: `ffmpeg-${ffmpegVersion}-win-arm64.zip`,
  },
};

const arch = getArchitecture();
const sysPlatform = getPlatform();
const filename = binaries[sysPlatform]?.[arch];

console.log(`Detected platform: ${sysPlatform} / ${arch}`);

const ffmpegBinaryPath = resolve(__dirname, '../../binary');

const ffmpegFilePath = resolve(ffmpegBinaryPath, filename!);
const ffmpegExtractedFilePath = ffmpegPath();

const isZipUrl = (url: string): boolean => {
  const pathArray = new URL(url).pathname.split('/');
  const fileName = pathArray[pathArray.length - 1];

  return fileName !== undefined && extname(fileName) === '.zip';
};

const downloadFile = async (url: string): Promise<void> => {
  console.log(`Downloading FFmpeg ${ffmpegVersion} to ${ffmpegFilePath}...`);

  const { data } = await axios.get(url, {
    onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
      if (process.env.CI || !progressEvent.total) {
        return;
      }

      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100) + '%';
      process.stdout.write('\r' + percent);

      if (progressEvent.loaded === progressEvent.total) {
        process.stdout.write('\r');
      }
    },
    timeout: 30 * 1000, // 30s
    maxRedirects: 3,
    responseType: 'stream',
  });

  mkdirSync(ffmpegBinaryPath, { recursive: true });

  const streams = [data, createWriteStream(ffmpegFilePath)];

  await pipeline(streams);

  if (isZipUrl(url)) {
    console.log(`Extracting ${ffmpegFilePath} to ${ffmpegExtractedFilePath}...`);

    const directory = await Open.file(ffmpegFilePath);

    await new Promise<void>((resolve, reject) => {
      directory.files[0].stream().pipe(createWriteStream(ffmpegExtractedFilePath)).on('error', reject).on('finish', resolve);
    });

    console.log(`Removing ${ffmpegFilePath}...`);

    rmSync(ffmpegFilePath);
  } else {
    console.log(`Renaming ${ffmpegFilePath} to ${ffmpegExtractedFilePath}...`);
    await rename(ffmpegFilePath, ffmpegExtractedFilePath);
  }
};

const getReleaseAssets = async (version: string): Promise<{ assets: string[]; files: string[] }> => {
  const url = `${releasesUrl}/tags/v${version}`;
  console.log(`Fetching release info from ${url}...`);
  const response = await axios.get(url);

  const assets = response.data.assets.map((asset: any) => asset.browser_download_url);
  const files = assets.map((asset: string) => asset.split(`${version}/`)[1]);

  return {
    assets,
    files,
  };
};

const downloadFFmpeg = async (): Promise<void> => {
  const release = await getReleaseAssets(pJson.version);

  if (!filename || !release.assets.find((r) => r.endsWith(filename))) {
    throw new Error(`No ffmpeg binary found for architecture (${sysPlatform} / ${arch})`);
  }

  const downloadUrl = release.assets.find((r) => r.endsWith(filename))!;

  await downloadFile(downloadUrl);

  if (sysPlatform === 'linux' || sysPlatform === 'darwin') {
    console.log(`Making ${ffmpegExtractedFilePath} executable...`);
    chmodSync(ffmpegExtractedFilePath, 0o755);
  }

  console.log('Done!');
};

downloadFFmpeg().catch((error) => {
  console.error('Error downloading FFmpeg:', error);
  process.exit(1);
});
