#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Get version type from command line (patch, minor, major)
const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Usage: node prepare-release.js [patch|minor|major]');
  process.exit(1);
}

console.log(`Preparing ${versionType} release...`);

// Read current package.json
const packagePath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Calculate new version
const [major, minor, patch] = currentVersion.split('.').map(Number);
let newVersion;

switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update main package version
packageJson.version = newVersion;

// Update optionalDependencies to match main package version with caret range
const optionalDeps = packageJson.optionalDependencies;
for (const dep in optionalDeps) {
  // Update to new version with caret range
  optionalDeps[dep] = `^${newVersion}`;
}

console.log('Updated optionalDependencies to ^' + newVersion);

// Write updated package.json
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('Updated package.json');

// Update CHANGELOG.md - move Unreleased to new version
const changelogPath = join(rootDir, 'CHANGELOG.md');
if (existsSync(changelogPath)) {
  let changelog = readFileSync(changelogPath, 'utf8');

  // Check if there's content in Unreleased section
  const unreleasedMatch = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=## \[|$)/);
  if (unreleasedMatch && unreleasedMatch[1].trim()) {
    const today = new Date().toISOString().split('T')[0];

    // Replace [Unreleased] with the new version and date
    const versionHeader = `## [${newVersion}] - ${today}`;

    // Keep the Unreleased section but empty it, and add the new version section
    changelog = changelog.replace(/## \[Unreleased\]([\s\S]*?)(?=## \[|$)/, `## [Unreleased]\n\n${versionHeader}$1`);

    writeFileSync(changelogPath, changelog);
    console.log(`\n📝 Updated CHANGELOG.md with version ${newVersion}`);
  }
}

// Stage the changes
execSync('git add package.json', { cwd: rootDir });

// Also stage CHANGELOG.md if it was updated
if (existsSync(changelogPath)) {
  execSync('git add CHANGELOG.md', { cwd: rootDir });
}

// Create commit
execSync(`git commit -m "chore: bump version to ${newVersion}"`, { cwd: rootDir });
console.log(`Created commit for version ${newVersion}`);

// Create tag
execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd: rootDir });
console.log(`Created tag v${newVersion}`);

console.log('\n✅ Release preparation complete!');
console.log('\nNext steps:');
console.log('1. Review the changes: git show');
console.log(`2. Push to origin: git push && git push origin v${newVersion}`);
console.log('3. The GitHub Actions workflow will automatically:');
console.log('   - Build binaries for all platforms');
console.log('   - Create GitHub release with CHANGELOG notes');
console.log('   - Publish platform packages to npm');
console.log('   - Publish main package to npm');
