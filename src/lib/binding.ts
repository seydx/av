/**
 * Native FFmpeg bindings interface
 * This module provides low-level access to FFmpeg functionality
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AVLogLevel } from '../lib/constants.js';
import type { CodecContext } from './codec-context.js';
import type { CodecParameters } from './codec-parameters.js';
import type { Codec } from './codec.js';
import type { Dictionary } from './dictionary.js';
import type { FilterContext } from './filter-context.js';
import type { FilterGraph } from './filter-graph.js';
import type { Filter } from './filter.js';
import type { FormatContext } from './format-context.js';
import type { Frame } from './frame.js';
import type { InputFormat } from './input-format.js';
import type { OutputFormat } from './output-format.js';
import type { Packet } from './packet.js';
import type { Stream } from './stream.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const modulePath = join(__dirname, '../../build/Release/ffmpeg.node');
const bindings = require(modulePath) as NativeBindings;

export interface NativeBindings {
  // Utility functions
  setLogLevel(level: number): void;
  getVersion(): {
    avcodec: number;
    avformat: number;
    avutil: number;
    swscale: number;
    swresample: number;
  };
  getConfiguration(): {
    avcodec: string;
    avformat: string;
    avutil: string;
    swscale: string;
    swresample: string;
  };
  getLicense(): string;

  // Native class constructors
  Packet: typeof Packet;
  Frame: typeof Frame;
  Codec: typeof Codec;
  CodecContext: typeof CodecContext;
  CodecParameters: typeof CodecParameters;
  Dictionary: typeof Dictionary;
  FormatContext: typeof FormatContext;
  Stream: typeof Stream;
  InputFormat: typeof InputFormat;
  OutputFormat: typeof OutputFormat;
  Filter: typeof Filter;
  FilterContext: typeof FilterContext;
  FilterGraph: typeof FilterGraph;
  SoftwareScaleContext: any;
  SoftwareResampleContext: any;
  HardwareDeviceContext: any;
  HardwareFramesContext: any;
}

/**
 * Set FFmpeg log level
 */
export function setLogLevel(level: AVLogLevel): void {
  bindings.setLogLevel(level);
}

/**
 * Get FFmpeg version information
 */
export function getVersion(): {
  avcodec: number;
  avformat: number;
  avutil: number;
  swscale: number;
  swresample: number;
} {
  return bindings.getVersion();
}

/**
 * Get FFmpeg configuration
 */
export function getConfiguration(): {
  avcodec: string;
  avformat: string;
  avutil: string;
  swscale: string;
  swresample: string;
} {
  return bindings.getConfiguration();
}

/**
 * Get FFmpeg license
 */
export function getLicense(): string {
  return bindings.getLicense();
}

// Re-export native bindings for internal use
export { bindings };
