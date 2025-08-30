// Adapted from https://github.com/lovell/sharp/blob/main/lib/libvips.js

import detectLibc from 'detect-libc';
import { spawnSync } from 'node:child_process';

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true,
};

export const log = (item) => {
  if (item instanceof Error) {
    console.error(`node-av: Installation error: ${item.message}`);
  } else {
    console.log(`node-av: ${item}`);
  }
};

export const runtimeLibc = () => (detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : '');

export const runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;

export const buildPlatformArch = () => {
  const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
  const libc = typeof npm_config_libc === 'string' ? npm_config_libc : runtimeLibc();
  return `${npm_config_platform ?? process.platform}${libc}-${npm_config_arch ?? process.arch}`;
};

export const spawnRebuild = () =>
  spawnSync('node-gyp rebuild', {
    ...spawnSyncOptions,
    stdio: 'inherit',
  }).status;

export const pkgConfigPath = () => {
  if (process.platform === 'win32') {
    return '';
  }

  const paths = [];

  // Try homebrew path on macOS
  if (process.platform === 'darwin') {
    const brewPath = spawnSync('brew --prefix 2>/dev/null', spawnSyncOptions).stdout;
    if (brewPath) {
      paths.push(`${brewPath.trim()}/lib/pkgconfig`);
    }
  }

  // Add standard paths
  paths.push(process.env.PKG_CONFIG_PATH, '/usr/local/lib/pkgconfig', '/usr/lib/pkgconfig', '/usr/local/libdata/pkgconfig', '/usr/libdata/pkgconfig');

  return paths.filter(Boolean).join(':');
};

export const useGlobalFFmpeg = () => {
  if (process.platform === 'win32') {
    return false;
  }

  let ffmpegVersion =
    spawnSync('pkg-config --modversion libavcodec', {
      ...spawnSyncOptions,
      env: {
        ...process.env,
        PKG_CONFIG_PATH: pkgConfigPath(),
      },
    }).stdout || '';

  ffmpegVersion = ffmpegVersion.trim();

  if (!ffmpegVersion) {
    return false;
  }

  return true;
};
