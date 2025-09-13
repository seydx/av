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

// Check if RELEASE_NOTES.md exists and has content
const releaseNotesPath = join(rootDir, 'RELEASE_NOTES.md');
let hasCustomNotes = false;

if (existsSync(releaseNotesPath)) {
  const releaseNotes = readFileSync(releaseNotesPath, 'utf8');
  // Check if any section has been filled out (not just comments)
  const sections = ['Breaking Changes', 'New Features', 'Bug Fixes', 'Notes'];
  for (const section of sections) {
    const regex = new RegExp(`## [🚨✨🐛📝]+ ${section}\\s*\\n(?!<!--)(.+?)(?=\\n##|$)`, 's');
    const match = releaseNotes.match(regex);
    if (match && match[1].trim()) {
      hasCustomNotes = true;
      break;
    }
  }

  if (hasCustomNotes) {
    console.log('\n📝 Found custom release notes in RELEASE_NOTES.md');
    console.log('These will be included in the GitHub release.');
  } else {
    console.log('\n💡 Tip: Edit RELEASE_NOTES.md before releasing to add custom release notes.');
  }
}

// Stage the changes
execSync('git add package.json', { cwd: rootDir });

// Also stage RELEASE_NOTES.md if it has custom content
if (hasCustomNotes) {
  execSync('git add RELEASE_NOTES.md', { cwd: rootDir });
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
console.log('   - Create GitHub release' + (hasCustomNotes ? ' (with your custom notes)' : ''));
console.log('   - Publish platform packages to npm');
console.log('   - Publish main package to npm');

// Reset RELEASE_NOTES.md after tagging (but before pushing)
if (hasCustomNotes) {
  console.log('\n🔄 Resetting RELEASE_NOTES.md for next release...');
  execSync('node scripts/reset-release-notes.js', { cwd: rootDir });
  execSync('git add RELEASE_NOTES.md', { cwd: rootDir });
  execSync('git commit -m "chore: reset RELEASE_NOTES.md after release"', { cwd: rootDir });
}
