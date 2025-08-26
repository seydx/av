#!/usr/bin/env node

import { getFFmpegLibraryVersions, globalFFmpegVersion, log, spawnRebuild, useGlobalFFmpeg } from './ffmpeg.js';

const buildFromSource = async (msg) => {
  log(msg);
  log('Building from source requires:');
  log('  - FFmpeg 7.1+ with development headers');
  log('  - Python 3.12+');
  log('  - node-gyp and node-addon-api');

  // Check for node-addon-api and node-gyp
  let hasNodeAddonApi = false;
  let hasNodeGyp = false;

  try {
    // @ts-expect-error
    await import('node-addon-api');
    hasNodeAddonApi = true;
  } catch {
    // Not installed
  }

  try {
    // @ts-expect-error
    await import('node-gyp');
    hasNodeGyp = true;
  } catch {
    // Not installed
  }

  if (!hasNodeAddonApi || !hasNodeGyp) {
    log('');
    log('Missing build dependencies. Please install:');
    log('  npm install --save-dev node-addon-api node-gyp');
    log('');
    log('Then run npm install again.');
    process.exit(1);
  }

  log('Found required build dependencies');
  log('Building native bindings...');

  const status = spawnRebuild();
  if (status !== 0) {
    log('Build failed. Please ensure you have:');
    log('  - FFmpeg 7.1+ libraries and headers installed');
    log('  - Python 3.12+ installed');
    log('  - A C++ compiler with C++17 support');
    log('See https://github.com/seydx/av for detailed requirements');
    process.exit(status);
  }
};

(async () => {
  try {
    // Check if we should build from source
    const shouldBuildFromSource = process.env.npm_config_build_from_source;

    // Try to load the prebuilt binary first (unless explicitly building from source)
    if (!shouldBuildFromSource) {
      try {
        // Check if platform-specific package exists (optionalDependencies)
        const platform = process.platform;
        const arch = process.arch;
        const packageName = `@seydx/node-av-${platform}-${arch}`;

        // Try to resolve the package
        await import(`${packageName}/package.json`);
        log(`Using prebuilt binary from ${packageName}`);
        return;
      } catch {
        // No prebuilt binary available, will build from source
      }
    }

    // No prebuilt binary or --build-from-source flag, check for system FFmpeg
    if (useGlobalFFmpeg(log)) {
      const versions = getFFmpegLibraryVersions();
      if (versions && versions.length > 0) {
        log('Detected globally-installed FFmpeg libraries:');
        for (const lib of versions) {
          log(`  ✓ ${lib.name.padEnd(20)} v${lib.version} (${lib.description})`);
        }
        await buildFromSource('Building with system FFmpeg');
      } else {
        await buildFromSource(`Detected globally-installed FFmpeg v${globalFFmpegVersion()}`);
      }
    } else {
      // No system FFmpeg found
      if (shouldBuildFromSource) {
        log('--build-from-source specified but no FFmpeg libraries found');
        log('Please install FFmpeg 7.1+ with development headers');
        process.exit(1);
      } else {
        log('No prebuilt binary available for your platform');
        log('No system FFmpeg libraries found (requires v7.1+)');
        log('');
        log('Please install FFmpeg 7.1+ and build dependencies:');
        log('  - FFmpeg development libraries');
        log('  - Python 3.12+');
        log('  - npm install --save-dev node-addon-api node-gyp');
        log('');
        log('Then run npm install again.');
        process.exit(1);
      }
    }
  } catch (err) {
    const summary = err.message.split(/\n/).slice(0, 1);
    console.log(`node-av: installation error: ${summary}`);
    process.exit(1);
  }
})();
