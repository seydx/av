#!/usr/bin/env node

/**
 * Generate TypeScript constants from FFmpeg headers
 * This extracts all AV_* constants and creates TypeScript constants with branded types
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get FFmpeg include path from pkg-config
const getFFmpegPath = () => {
  try {
    const flags = execSync('pkg-config --cflags libavcodec', { encoding: 'utf8' });
    const match = flags.match(/-I([^\s]+)/);
    if (match) {
      return match[1];
    }
  } catch (e) {
    console.error('FFmpeg not found via pkg-config');
  }

  // Fallback paths
  const paths = ['/opt/homebrew/Cellar/ffmpeg/7.1.1_1/include', '/usr/local/include', '/usr/include'];

  for (const p of paths) {
    if (fs.existsSync(path.join(p, 'libavcodec/avcodec.h'))) {
      return p;
    }
  }

  throw new Error('FFmpeg headers not found');
};

const FFMPEG_PATH = getFFmpegPath();
console.log(`Using FFmpeg headers from: ${FFMPEG_PATH}`);

// Parse all AV_ constants from a header file
const parseConstants = (headerPath) => {
  if (!fs.existsSync(headerPath)) {
    return [];
  }

  const content = fs.readFileSync(headerPath, 'utf8');
  const constants = [];

  // Parse #define constants (including AVERROR and AVFMT)
  const definePattern = /#define\s+((?:AV|AVERROR|AVFMT)_[A-Z0-9_]+)\s+(.+?)(?:\s*\/\/.*)?$/gm;
  let match;
  while ((match = definePattern.exec(content)) !== null) {
    let name = match[1];
    let value = match[2].trim();

    // Skip macros with parameters
    if (name.includes('(') || value.includes('#')) {
      continue;
    }

    // Clean up the value
    value = value.replace(/\/\*.*?\*\//g, '').trim();
    value = value.replace(/\/\/.*$/, '').trim();

    // Skip if value contains complex expressions we can't handle
    if (value.includes('?') || value.includes(':') || value.includes('sizeof')) {
      continue;
    }

    // Rename AVERROR_ to AV_ERROR_ and AVFMT_ to AV_FMT_ for consistency
    if (name.startsWith('AVERROR_')) {
      name = name.replace('AVERROR_', 'AV_ERROR_');
    }
    if (name.startsWith('AVFMT_')) {
      name = name.replace('AVFMT_', 'AV_FMT_');
    }

    constants.push({ name, value, type: 'define' });
  }

  return constants;
};

// Parse enum values from a header file
const parseEnums = (headerPath) => {
  if (!fs.existsSync(headerPath)) {
    return {};
  }

  const content = fs.readFileSync(headerPath, 'utf8');
  const enums = {};

  // Find all enum blocks
  const enumPattern = /enum\s+(\w+)\s*{([^}]+)}/gs;
  let match;

  while ((match = enumPattern.exec(content)) !== null) {
    const enumName = match[1];
    const enumContent = match[2];

    if (!enumName.startsWith('AV')) {
      continue;
    }

    const values = [];
    const lines = enumContent.split(/[,\n]/);
    let currentValue = enumName === 'AVMediaType' ? -1 : 0;

    for (const line of lines) {
      // Skip comments and empty lines
      const cleanLine = line
        .replace(/\/\*.*?\*\//g, '')
        .replace(/\/\/.*$/, '')
        .trim();
      if (!cleanLine) continue;

      // Match enum values
      const valueMatch = cleanLine.match(/^\s*(AV_[A-Z0-9_]+|AVMEDIA_[A-Z0-9_]+)\s*(?:=\s*(.+?))?$/);
      if (valueMatch) {
        let name = valueMatch[1];

        // Convert names for consistency
        if (name.startsWith('AVMEDIA_')) {
          name = name.replace('AVMEDIA_', 'AV_MEDIA_');
        }
        if (name.startsWith('AVERROR_')) {
          name = name.replace('AVERROR_', 'AV_ERROR_');
        }

        if (valueMatch[2]) {
          // Has explicit value
          const explicitValue = valueMatch[2].trim();

          // Try to evaluate simple expressions
          if (/^-?\d+$/.test(explicitValue)) {
            currentValue = parseInt(explicitValue);
          } else if (/^0x[0-9a-fA-F]+$/.test(explicitValue)) {
            currentValue = parseInt(explicitValue, 16);
          } else if (/^\d+\s*<<\s*\d+$/.test(explicitValue)) {
            const [base, shift] = explicitValue.split('<<').map((s) => parseInt(s.trim()));
            currentValue = base << shift;
          } else if (/^\d+U?\s*<<\s*\d+$/.test(explicitValue)) {
            const [base, shift] = explicitValue
              .replace('U', '')
              .split('<<')
              .map((s) => parseInt(s.trim()));
            currentValue = base << shift;
          } else {
            // Can't evaluate, skip this enum
            continue;
          }
        } else {
          // Auto-increment
          currentValue++;
        }

        values.push({ name, value: currentValue });
      }
    }

    if (values.length > 0) {
      enums[enumName] = values;
    }
  }

  return enums;
};

// Scan all FFmpeg headers
const scanAllHeaders = () => {
  const libraries = ['libavcodec', 'libavformat', 'libavutil', 'libavfilter', 'libswscale', 'libswresample'];
  const allConstants = new Map();
  const allEnums = new Map();

  for (const lib of libraries) {
    const libPath = path.join(FFMPEG_PATH, lib);
    if (!fs.existsSync(libPath)) {
      continue;
    }

    const headers = fs.readdirSync(libPath).filter((f) => f.endsWith('.h'));

    for (const header of headers) {
      const headerPath = path.join(libPath, header);

      // Parse constants
      const constants = parseConstants(headerPath);
      for (const constant of constants) {
        if (!allConstants.has(constant.name)) {
          allConstants.set(constant.name, { ...constant, source: `${lib}/${header}` });
        }
      }

      // Parse enums
      const enums = parseEnums(headerPath);
      for (const [enumName, values] of Object.entries(enums)) {
        if (!allEnums.has(enumName)) {
          allEnums.set(enumName, { values, source: `${lib}/${header}` });
        }
      }
    }
  }

  return { constants: allConstants, enums: allEnums };
};

// Group constants by prefix for better organization
const groupConstantsByPrefix = (constants) => {
  const groups = new Map();

  for (const [name, info] of constants) {
    // Skip certain patterns
    if (name.includes('_NE') || name === 'AV_NB' || name.includes('(')) {
      continue;
    }

    // Extract prefix (e.g., AV_LOG_, AV_CODEC_FLAG_, etc.)
    const parts = name.split('_');
    let prefix = '';

    if (parts.length >= 3) {
      // Try to find a meaningful prefix
      if (name.startsWith('AV_CODEC_FLAG2_')) {
        prefix = 'AV_CODEC_FLAG2';
      } else if (name.startsWith('AV_CODEC_FLAG_')) {
        prefix = 'AV_CODEC_FLAG';
      } else if (name.startsWith('AV_CODEC_CAP_')) {
        prefix = 'AV_CODEC_CAP';
      } else if (name.startsWith('AV_PKT_FLAG_')) {
        prefix = 'AV_PKT_FLAG';
      } else if (name.startsWith('AV_FRAME_FLAG_')) {
        prefix = 'AV_FRAME_FLAG';
      } else if (name.startsWith('AV_DISPOSITION_')) {
        prefix = 'AV_DISPOSITION';
      } else if (name.startsWith('AV_LOG_')) {
        prefix = 'AV_LOG';
      } else if (name.startsWith('AV_ERROR_')) {
        prefix = 'AV_ERROR';
      } else if (name.startsWith('AV_SEEK_FLAG_')) {
        prefix = 'AV_SEEK_FLAG';
      } else if (name.startsWith('AV_FMT_FLAG_')) {
        prefix = 'AV_FMT_FLAG';
      } else if (name.startsWith('AV_CODEC_PROP_')) {
        prefix = 'AV_CODEC_PROP';
      } else if (name.startsWith('AV_PARSER_PTS_')) {
        prefix = 'AV_PARSER_PTS';
      } else if (name.startsWith('AV_CH_')) {
        prefix = 'AV_CH';
      } else if (name.startsWith('AV_CPU_FLAG_')) {
        prefix = 'AV_CPU_FLAG';
      } else if (name.startsWith('AV_DICT_')) {
        prefix = 'AV_DICT';
      } else if (name.startsWith('AV_PIX_FMT_')) {
        prefix = 'AV_PIX_FMT';
      } else if (name.startsWith('AV_PROFILE_')) {
        prefix = 'AV_PROFILE';
      } else if (name.startsWith('AV_OPT_FLAG_')) {
        prefix = 'AV_OPT_FLAG';
      } else if (name.startsWith('AV_OPT_SERIALIZE_')) {
        prefix = 'AV_OPT_SERIALIZE';
      } else if (name.startsWith('AV_HWACCEL_FLAG_')) {
        prefix = 'AV_HWACCEL_FLAG';
      } else if (name.startsWith('AV_CODEC_EXPORT_')) {
        prefix = 'AV_CODEC_EXPORT';
      } else if (name.startsWith('AV_CHANNEL_LAYOUT_')) {
        prefix = 'AV_CHANNEL_LAYOUT';
      } else if (name.startsWith('AV_ESCAPE_FLAG_')) {
        prefix = 'AV_ESCAPE_FLAG';
      } else if (name.startsWith('AV_BPRINT_SIZE_')) {
        prefix = 'AV_BPRINT_SIZE';
      } else if (name.startsWith('AV_TIME_BASE')) {
        prefix = 'AV_TIME_BASE';
      } else if (name.startsWith('AV_CODEC_ID_')) {
        // These are usually enums, but sometimes defined as constants
        prefix = 'AV_CODEC_ID';
      } else if (name.startsWith('AV_SAMPLE_FMT_')) {
        prefix = 'AV_SAMPLE_FMT';
      } else if (name.startsWith('AV_COLORSPACE_')) {
        prefix = 'AV_COLORSPACE';
      } else if (name.startsWith('AV_FIELD_')) {
        prefix = 'AV_FIELD';
      } else if (name.startsWith('AV_EF_')) {
        prefix = 'AV_EF';  // Error resilience flags
      } else if (name.startsWith('AV_BUFFERSINK_FLAG_')) {
        prefix = 'AV_BUFFERSINK_FLAG';
      } else if (name.startsWith('AV_PTS_WRAP_')) {
        prefix = 'AV_PTS_WRAP';
      } else if (name.startsWith('AV_GET_BUFFER_FLAG_')) {
        prefix = 'AV_GET_BUFFER_FLAG';
      } else if (name.startsWith('AV_GET_ENCODE_BUFFER_FLAG_')) {
        prefix = 'AV_GET_ENCODE_BUFFER_FLAG';
      } else if (name.startsWith('AV_SUBTITLE_FLAG_')) {
        prefix = 'AV_SUBTITLE_FLAG';
      } else if (name.startsWith('AV_UTF')) {
        prefix = 'AV_UTF';
      } else if (name.startsWith('AV_HAVE_')) {
        prefix = 'AV_HAVE';
      } else if (name.startsWith('AV_INPUT_BUFFER_')) {
        prefix = 'AV_INPUT_BUFFER';
      } else if (name.startsWith('AV_FMT_')) {
        prefix = 'AV_FMT';
      }
    }

    if (!prefix) {
      prefix = 'OTHER';
    }

    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix).push({ name, ...info });
  }

  // Log groups for debugging (optional - set DEBUG=1 to see)
  if (process.env.DEBUG) {
    console.log('Constant Groups:');
    for (const [prefix, items] of groups) {
      console.log(`  ${prefix}: ${items.length} constants`);
    }
  }

  return groups;
};

// Generate TypeScript output with branded types
const generateTypeScript = () => {
  const { constants, enums } = scanAllHeaders();
  
  // Log enums for debugging (optional - set DEBUG=1 to see)
  if (process.env.DEBUG) {
    console.log('\nEnum Types:');
    for (const [enumName, enumData] of enums) {
      console.log(`  ${enumName}: ${enumData.values.length} values`);
    }
  }

  let output = `/**
 * Auto-generated FFmpeg constants
 * Generated from FFmpeg headers
 * DO NOT EDIT MANUALLY
 */

// Brand symbol for type safety
const __ffmpeg_brand = Symbol('__ffmpeg_brand');

`;

  // Manually add AVMediaType since it's critical and might not parse correctly
  output += `// Media types\n`;
  output += `export type AVMediaType = number & { readonly [__ffmpeg_brand]: 'AVMediaType' };\n\n`;
  output += `export const AV_MEDIA_TYPE_UNKNOWN = -1 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_VIDEO = 0 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_AUDIO = 1 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_DATA = 2 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_SUBTITLE = 3 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_ATTACHMENT = 4 as AVMediaType;\n`;
  output += `export const AV_MEDIA_TYPE_NB = 5 as AVMediaType;\n\n`;

  // Generate branded types for each enum
  const processedEnums = new Set();
  const processedTypes = new Set(['AVMediaType']); // Track all generated types to avoid duplicates

  for (const [enumName, enumData] of enums) {
    if (processedEnums.has(enumName) || enumName === 'AVMediaType') continue;
    processedEnums.add(enumName);

    // Skip if we already have this type
    if (processedTypes.has(enumName)) continue;
    processedTypes.add(enumName);

    // Create branded type
    output += `// ${enumData.source}\n`;
    output += `export type ${enumName} = number & { readonly [__ffmpeg_brand]: '${enumName}' };\n\n`;

    // Export constants
    for (const { name, value } of enumData.values) {
      // Skip duplicates and platform-specific variations
      // if (name.includes('_NE') || name === 'NB') {
      //   continue;
      // }
      output += `export const ${name} = ${value} as ${enumName};\n`;
    }
    output += '\n';
  }

  // Group and generate constants
  const groups = groupConstantsByPrefix(constants);

  // Generate branded types for constant groups
  const brandedTypes = new Map([
    // Core codec flags
    ['AV_CODEC_FLAG', 'AVCodecFlag'],
    ['AV_CODEC_FLAG2', 'AVCodecFlag2'],
    ['AV_CODEC_CAP', 'AVCodecCap'],
    ['AV_CODEC_PROP', 'AVCodecProp'],
    ['AV_CODEC_EXPORT', 'AVCodecExport'],
    ['AV_CODEC_ID', 'AVCodecIDConstants'],
    
    // Packet/Frame flags
    ['AV_PKT_FLAG', 'AVPacketFlag'],
    ['AV_FRAME_FLAG', 'AVFrameFlag'],
    
    // Stream/Format
    ['AV_DISPOSITION', 'AVDisposition'],
    ['AV_SEEK_FLAG', 'AVSeekFlag'],
    ['AV_FMT_FLAG', 'AVFormatFlag'],
    ['AV_PARSER_PTS', 'AVParserPts'],
    
    // Audio/Video
    ['AV_CH', 'AVChannel'],
    ['AV_CHANNEL_LAYOUT', 'AVChannelLayout'],
    ['AV_SAMPLE_FMT', 'AVSampleFormatConstants'],
    ['AV_PIX_FMT', 'AVPixelFormatConstants'],
    ['AV_FIELD', 'AVFieldOrder'],
    ['AV_COLORSPACE', 'AVColorSpace'],
    
    // Profiles
    ['AV_PROFILE', 'AVProfile'],
    
    // Options
    ['AV_OPT_FLAG', 'AVOptionFlag'],
    ['AV_OPT_SERIALIZE', 'AVOptionSerialize'],
    
    // Hardware acceleration
    ['AV_HWACCEL_FLAG', 'AVHWAccelFlag'],
    
    // Utility
    ['AV_LOG', 'AVLogLevel'],
    ['AV_CPU_FLAG', 'AVCpuFlag'],
    ['AV_DICT', 'AVDictionaryFlag'],
    ['AV_ESCAPE_FLAG', 'AVEscapeFlag'],
    ['AV_BPRINT_SIZE', 'AVBPrintSize'],
    ['AV_TIME_BASE', 'AVTimeBase'],
    
    // Error resilience
    ['AV_EF', 'AVErrorFlags'],
    
    // Buffer flags
    ['AV_BUFFERSINK_FLAG', 'AVBufferSinkFlag'],
    ['AV_GET_BUFFER_FLAG', 'AVGetBufferFlag'],
    ['AV_GET_ENCODE_BUFFER_FLAG', 'AVGetEncodeBufferFlag'],
    ['AV_INPUT_BUFFER', 'AVInputBuffer'],
    
    // Subtitle
    ['AV_SUBTITLE_FLAG', 'AVSubtitleFlag'],
    
    // PTS wrapping
    ['AV_PTS_WRAP', 'AVPTSWrap'],
    
    // Platform features
    ['AV_HAVE', 'AVHave'],
    ['AV_UTF', 'AVUTF'],
    
    // Format flags (note: already handled by AV_FMT_FLAG above)
    ['AV_FMT', 'AVFormatFlags'],
  ]);

  // Generate constants by group
  for (const [prefix, typeName] of brandedTypes) {
    const groupConstants = groups.get(prefix);
    if (!groupConstants || groupConstants.length === 0) continue;

    // Skip if we already have this type
    if (processedTypes.has(typeName)) continue;
    processedTypes.add(typeName);

    // Get source files for documentation
    const sources = [...new Set(groupConstants.map(c => c.source))];
    const sourceComment = sources.length > 0 ? ` (from ${sources.slice(0, 3).join(', ')}${sources.length > 3 ? '...' : ''})` : '';

    output += `// ${prefix} constants${sourceComment}\n`;
    output += `export type ${typeName} = number & { readonly [__ffmpeg_brand]: '${typeName}' };\n\n`;

    for (const constant of groupConstants) {
      // Try to evaluate the value
      let value = constant.value;
      let evaluatedValue = null;

      if (/^-?\d+$/.test(value)) {
        evaluatedValue = value;
      } else if (/^0x[0-9a-fA-F]+$/.test(value)) {
        evaluatedValue = parseInt(value, 16);
      } else if (/^\(?\s*1U?\s*<<\s*\d+\s*\)?$/.test(value)) {
        const matches = value.match(/<<\s*(\d+)/);
        if (matches) {
          const shift = parseInt(matches[1]);
          const result = 1 << shift;
          // Handle negative values for bit 31
          if (result < 0) {
            evaluatedValue = String(result >>> 0); // Convert to unsigned 32-bit
          } else {
            evaluatedValue = `0x${result.toString(16)}`;
          }
        }
      } else if (/^\(?\s*\d+U?\s*<<\s*\d+\s*\)?$/.test(value)) {
        const matches = value.match(/(\d+)U?\s*<<\s*(\d+)/);
        if (matches) {
          const base = parseInt(matches[1]);
          const shift = parseInt(matches[2]);
          const result = base << shift;
          // Handle negative values for bit 31
          if (result < 0) {
            evaluatedValue = String(result >>> 0); // Convert to unsigned 32-bit
          } else {
            evaluatedValue = `0x${result.toString(16)}`;
          }
        }
      }

      if (evaluatedValue !== null) {
        output += `export const ${constant.name} = ${evaluatedValue} as ${typeName};\n`;
      }
    }
    output += '\n';
  }

  // OTHER constants will be handled later at the end

  // Generate remaining ungrouped constants if any
  const ungroupedConstants = groups.get('OTHER');
  if (ungroupedConstants && ungroupedConstants.length > 0) {
    output += `// Other constants (ungrouped) - ${ungroupedConstants.length} constants\n`;
    output += `// These are miscellaneous constants that don't fit into a specific category\n`;
    for (const constant of ungroupedConstants) {
      // Try to evaluate the value
      let value = constant.value;
      let evaluatedValue = null;

      if (/^-?\d+$/.test(value)) {
        evaluatedValue = value;
      } else if (/^0x[0-9a-fA-F]+$/.test(value)) {
        evaluatedValue = parseInt(value, 16);
      } else if (/^\(?\s*1U?\s*<<\s*\d+\s*\)?$/.test(value)) {
        const matches = value.match(/<<\s*(\d+)/);
        if (matches) {
          const shift = parseInt(matches[1]);
          const result = 1 << shift;
          if (result < 0) {
            evaluatedValue = String(result >>> 0);
          } else {
            evaluatedValue = `0x${result.toString(16)}`;
          }
        }
      }

      if (evaluatedValue !== null) {
        output += `export const ${constant.name} = ${evaluatedValue};\n`;
      }
    }
    output += '\n';
  }

  // Extract and process AVERROR constants from error.h
  if (!processedTypes.has('AVError')) {
    const errorConstants = [];
    const errorFile = path.join(FFMPEG_PATH, 'libavutil', 'error.h');

    if (fs.existsSync(errorFile)) {
      const errorContent = fs.readFileSync(errorFile, 'utf8');

      // Parse FFERRTAG macro calls
      const fferrtagPattern = /#define\s+(AVERROR_\w+)\s+FFERRTAG\s*\(([^)]+)\)/gm;
      let match;
      while ((match = fferrtagPattern.exec(errorContent)) !== null) {
        const name = match[1].replace('AVERROR_', 'AV_ERROR_');
        const args = match[2].split(',').map((a) => a.trim().replace(/'/g, ''));

        // MKTAG(a,b,c,d) = (a) | ((b) << 8) | ((c) << 16) | ((d) << 24)
        // FFERRTAG = -(int)MKTAG
        let a, b, c, d;
        if (args[0].startsWith('0x')) {
          a = parseInt(args[0], 16);
        } else if (args[0].match(/^\d+$/)) {
          a = parseInt(args[0]);
        } else {
          a = args[0].charCodeAt(0);
        }

        // Handle character literals and special chars
        b = args[1] === ' ' ? 32 : args[1].charCodeAt(0);
        c = args[2] === ' ' ? 32 : args[2].charCodeAt(0);
        d = args[3] === ' ' ? 32 : args[3] === '!' ? 33 : args[3].charCodeAt(0);

        const mktag = (a | (b << 8) | (c << 16) | (d << 24)) >>> 0;
        const fferrtag = -(mktag | 0); // Convert to signed 32-bit then negate
        errorConstants.push({ name, value: fferrtag });
      }

      // Parse direct hex error values
      const hexPattern = /#define\s+(AVERROR_\w+)\s+\((-0x[0-9a-fA-F]+)\)/gm;
      while ((match = hexPattern.exec(errorContent)) !== null) {
        const name = match[1].replace('AVERROR_', 'AV_ERROR_');
        const value = parseInt(match[2]);
        errorConstants.push({ name, value });
      }
    }

    // Add common POSIX errors
    const posixErrors = [
      { name: 'AV_ERROR_EAGAIN', value: -11 },
      { name: 'AV_ERROR_ENOMEM', value: -12 },
      { name: 'AV_ERROR_EINVAL', value: -22 },
      { name: 'AV_ERROR_EPIPE', value: -32 },
      { name: 'AV_ERROR_ENOSYS', value: -38 },
      { name: 'AV_ERROR_EIO', value: -5 },
      { name: 'AV_ERROR_EPERM', value: -1 },
      { name: 'AV_ERROR_ETIMEDOUT', value: -110 },
    ];

    // Check which errors we already have
    const existingErrorNames = new Set(errorConstants.map((e) => e.name));
    for (const posixError of posixErrors) {
      if (!existingErrorNames.has(posixError.name)) {
        errorConstants.push(posixError);
      }
    }

    // Generate error constants
    output += `// Error codes\n`;
    output += `export type AVError = number & { readonly [__ffmpeg_brand]: 'AVError' };\n\n`;
    for (const error of errorConstants) {
      output += `export const ${error.name} = ${error.value} as AVError;\n`;
    }
    output += '\n';
    processedTypes.add('AVError');
  }

  // Export convenience function for creating branded values
  output += `// Helper function to cast numbers to branded types\n`;
  output += `export function cast<T>(value: number): T {\n`;
  output += `  return value as T;\n`;
  output += `}\n`;

  return output;
};

// Main
const main = () => {
  console.log('Scanning all FFmpeg headers...');
  const output = generateTypeScript();
  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'constants.ts');

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, output);
  console.log(`Generated constants at: ${outputPath}`);

  // Show summary
  const lines = output.split('\n').length;
  const constants = (output.match(/export const/g) || []).length;
  const types = (output.match(/export type/g) || []).length;
  
  console.log('\n=== Generation Summary ===');
  console.log(`Generated: ${lines} lines, ${constants} constants, ${types} branded types`);
  console.log(`Note: Enums like AVPixelFormat are processed separately from #define constants`);
};

main();
