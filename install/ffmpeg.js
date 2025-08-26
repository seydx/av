// https://github.com/lovell/sharp/blob/main/lib/libvips.js

import detectLibc from 'detect-libc';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import semverCoerce from 'semver/functions/coerce.js';
import semverGreaterThanOrEqualTo from 'semver/functions/gte.js';
import semverSatisfies from 'semver/functions/satisfies.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
const { engines } = packageJson;

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true,
};

// Minimum FFmpeg version required
export const minimumFFmpegVersion = '7.1.0';

// Minimum Python version required for node-gyp
export const minimumPythonVersion = '3.12.0';

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

export const isUnsupportedNodeRuntime = () => {
  if (process.release?.name === 'node' && process.versions) {
    if (!semverSatisfies(process.versions.node, engines.node)) {
      return { found: process.versions.node, expected: engines.node };
    }
  }
};

export const spawnRebuild = () =>
  spawnSync('node-gyp rebuild', {
    ...spawnSyncOptions,
    stdio: 'inherit',
  }).status;

export const globalFFmpegVersion = () => {
  if (process.platform !== 'win32') {
    const ffmpegVersion =
      spawnSync('pkg-config --modversion libavcodec', {
        ...spawnSyncOptions,
        env: {
          ...process.env,
          PKG_CONFIG_PATH: pkgConfigPath(),
        },
      }).stdout || '';
    return ffmpegVersion.trim();
  } else {
    return '';
  }
};

export const getFFmpegLibraryVersions = () => {
  if (process.platform === 'win32') {
    return null;
  }

  const libraries = [
    { name: 'libavcodec', description: 'codec library' },
    { name: 'libavformat', description: 'format library' },
    { name: 'libavutil', description: 'utility library' },
    { name: 'libswscale', description: 'video scaling library' },
    { name: 'libswresample', description: 'audio resampling library' },
    { name: 'libavfilter', description: 'filter library' },
    { name: 'libavdevice', description: 'device library' },
    { name: 'libpostproc', description: 'post-processing library' },
  ];

  const versions = [];

  for (const lib of libraries) {
    const version = spawnSync(`pkg-config --modversion ${lib.name}`, {
      ...spawnSyncOptions,
      env: {
        ...process.env,
        PKG_CONFIG_PATH: pkgConfigPath(),
      },
    }).stdout;

    if (version && version.trim()) {
      versions.push({
        name: lib.name,
        description: lib.description,
        version: version.trim(),
      });
    }
  }

  return versions.length > 0 ? versions : null;
};

export const pkgConfigPath = () => {
  if (process.platform !== 'win32') {
    const brewPkgConfigPath = spawnSync('which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2', spawnSyncOptions).stdout || '';
    return [
      brewPkgConfigPath.trim(),
      process.env.PKG_CONFIG_PATH,
      '/usr/local/lib/pkgconfig',
      '/usr/lib/pkgconfig',
      '/usr/local/libdata/pkgconfig',
      '/usr/libdata/pkgconfig',
    ]
      .filter(Boolean)
      .join(':');
  } else {
    return '';
  }
};

export const useGlobalFFmpeg = (logger) => {
  const globalVersion = globalFFmpegVersion();
  if (!globalVersion) {
    return false;
  }

  // Check if all required libraries are present
  const requiredLibs = ['libavcodec', 'libavformat', 'libavutil', 'libswscale', 'libswresample'];
  for (const lib of requiredLibs) {
    const version =
      spawnSync(`pkg-config --modversion ${lib}`, {
        ...spawnSyncOptions,
        env: {
          ...process.env,
          PKG_CONFIG_PATH: pkgConfigPath(),
        },
      }).stdout || '';
    if (!version?.trim()) {
      if (logger) {
        logger(`Missing required FFmpeg library: ${lib}`);
      }
      return false;
    }
  }

  const coercedVersion = semverCoerce(globalVersion);
  if (!coercedVersion) {
    return false;
  }

  return semverGreaterThanOrEqualTo(coercedVersion.version, minimumFFmpegVersion);
};
