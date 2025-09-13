#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const template = `<!--
This file is used to add custom release notes that will be included in GitHub releases.
Edit the sections below before running npm run release:* commands.
Leave sections empty if not applicable for the current release.
This file will be automatically cleared after each release.
-->

## 🚨 Breaking Changes
<!-- List any breaking changes here -->

## ✨ New Features
<!-- List major new features here -->

## 🐛 Bug Fixes
<!-- List important bug fixes here -->

## 📝 Notes
<!-- Any additional notes for this release -->`;

const releaseNotesPath = resolve(process.cwd(), 'RELEASE_NOTES.md');
writeFileSync(releaseNotesPath, template);
console.log('✅ RELEASE_NOTES.md has been reset to template');
