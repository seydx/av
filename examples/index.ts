import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function prepareTestEnvironment() {
  const tmpDir = join(__dirname, '.tmp');
  mkdirSync(tmpDir, { recursive: true });
}

export function getInputFile(name: string) {
  const tmpDir = join(__dirname, '../testdata');
  return join(tmpDir, name);
}

export function getOutputFile(name: string) {
  const tmpDir = join(__dirname, '.tmp');
  return join(tmpDir, name);
}

export function getTmpDir() {
  return join(__dirname, '.tmp');
}

export function isCI(): boolean {
  // Check common CI environment variables
  return !!(
    process.env.CI ??
    process.env.GITHUB_ACTIONS ??
    process.env.JENKINS ??
    process.env.TRAVIS ??
    process.env.CIRCLECI ??
    process.env.GITLAB_CI ??
    process.env.BUILDKITE ??
    process.env.DRONE ??
    process.env.CONTINUOUS_INTEGRATION
  );
}
