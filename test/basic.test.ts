import assert from 'node:assert';
import { describe, it } from 'node:test';

import * as ffmpeg from '../src/lib/binding.js';
import { AV_LOG_ERROR, AV_LOG_INFO, AV_LOG_WARNING } from '../src/lib/constants.js';

describe('Basic FFmpeg bindings', () => {
  it('should get FFmpeg version', () => {
    const version = ffmpeg.getVersion();
    assert(version);
    assert(version.avcodec > 0);
    assert(version.avformat > 0);
    assert(version.avutil > 0);
    assert(version.swscale > 0);
    assert(version.swresample > 0);
  });

  it('should get FFmpeg configuration', () => {
    const config = ffmpeg.getConfiguration();
    assert(config);
    assert(config.avcodec.includes('--'));
    assert(config.avformat.includes('--'));
    assert(config.avutil.includes('--'));
  });

  it('should get FFmpeg license', () => {
    const license = ffmpeg.getLicense();
    assert(license);
    assert(license.length > 0);
  });

  it('should set log level', () => {
    assert.doesNotThrow(() => ffmpeg.setLogLevel(AV_LOG_ERROR));
    assert.doesNotThrow(() => ffmpeg.setLogLevel(AV_LOG_WARNING));
    assert.doesNotThrow(() => ffmpeg.setLogLevel(AV_LOG_INFO));
  });
});
