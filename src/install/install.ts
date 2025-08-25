#!/usr/bin/env node

import * as nodeAbi from 'node-abi';
import { createWriteStream, promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { platform, arch as processArch, versions } from 'node:process';
import { fileURLToPath } from 'node:url';
import { Open } from 'unzipper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..', '..');

// Binary will be placed in binary/node-av.node
const binaryDir = resolve(ROOT_DIR, 'binary');
const binaryPath = resolve(binaryDir, 'node-av.node');

const downloadBinary = async (url: string): Promise<void> => {
  console.log(`Downloading prebuilt binary from ${url}...`);

  const response = await fetch(url, {
    redirect: 'follow',
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error('Not Found') as any;
      error.response = { status: 404 };
      throw error;
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Get total size for progress reporting
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : null;

  // Create directory if it doesn't exist
  await fs.mkdir(binaryDir, { recursive: true });

  // Download to temp file
  const tempFile = resolve(binaryDir, 'download.zip');

  // Convert web stream to Node.js stream and track progress
  const body = response.body;
  if (!body) {
    throw new Error('No response body');
  }

  let downloaded = 0;
  const reader = body.getReader();
  const fileStream = createWriteStream(tempFile);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        downloaded += value.length;
        fileStream.write(value);

        // Show progress if not in CI and we have total size
        if (!process.env.CI && total) {
          const percent = Math.round((downloaded / total) * 100) + '%';
          process.stdout.write('\r' + percent);
        }
      }
    }

    fileStream.end();
    await new Promise<void>((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    if (!process.env.CI && total) {
      process.stdout.write('\r');
    }
  } catch (error) {
    await fs.unlink(tempFile).catch(() => {});
    throw error;
  }

  console.log('Extracting binary...');

  // Extract the .node file
  const directory = await Open.file(tempFile);

  // Find the .node file in the archive (should be named node-av.node)
  const nodeFile = directory.files.find((f) => f.path.endsWith('node-av.node'));
  if (!nodeFile) {
    throw new Error('No .node file found in archive');
  }

  await new Promise<void>((resolve, reject) => {
    nodeFile.stream().pipe(createWriteStream(binaryPath)).on('error', reject).on('finish', resolve);
  });

  // Clean up temp file
  await fs.unlink(tempFile);
};

async function install(): Promise<void> {
  // Get package version
  const packageJsonPath = resolve(ROOT_DIR, 'package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  const version = packageJson.version;

  // Detect runtime and ABI
  let runtime: string;
  let abi: string;

  if (versions.electron) {
    runtime = 'electron';
    abi = nodeAbi.getAbi(versions.electron, 'electron');
  } else {
    runtime = 'node';
    abi = nodeAbi.getAbi(versions.node, 'node');
  }

  // Get architecture
  const arch = processArch === 'x64' ? 'x64' : processArch === 'arm64' ? 'arm64' : null;
  if (!arch) {
    throw new Error(`Unsupported architecture: ${processArch}`);
  }

  // Get platform name
  let platformName: string;
  switch (platform) {
    case 'darwin':
      platformName = 'darwin';
      break;
    case 'linux':
      platformName = 'linux';
      break;
    case 'win32':
      platformName = 'win32';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  console.log(`Platform: ${platformName}-${arch}`);
  console.log(`Runtime: ${runtime} (ABI ${abi})`);

  // Construct artifact name and URL
  // Format: node-av-{platform}-{arch}-{version}-{runtime}-{abi}.zip
  // Example: node-av-darwin-arm64-0.1.0-electron-134.zip
  const artifactName = `node-av-${platformName}-${arch}-${version}-${runtime}-${abi}.zip`;
  const downloadUrl = `https://github.com/seydx/av/releases/download/v${version}/${artifactName}`;

  try {
    await downloadBinary(downloadUrl);
    console.log('✅ Binary installed successfully');
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`\n❌ Prebuilt binary not found: ${artifactName}`);
      console.error(`Download URL: ${downloadUrl}`);
      console.error('\nPlease check if a release exists for your configuration.');
      process.exit(1);
    } else {
      console.error('Failed to download binary:', error.message);
      process.exit(1);
    }
  }
}

install().catch((err) => {
  console.error('Installation failed:', err);
  process.exit(1);
});
