// Adapted from https://github.com/lovell/sharp/blob/main/lib/libvips.js

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
