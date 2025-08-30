/**
 * FFprobe-like Metadata Example
 *
 * Demonstrates comprehensive metadata extraction from media files using NodeAV.
 * Shows that NodeAV can access all the same metadata that ffprobe provides,
 * including format information, stream details, and codec parameters.
 *
 * This example outputs information in a format similar to:
 * - ffprobe -show_format -show_streams
 * - Includes the new toJSON() method for complete codec parameter access
 *
 * Features demonstrated:
 * - Format metadata extraction (title, artist, etc.)
 * - Stream information (video/audio codecs, bitrates, frame rates)
 * - Format details (container type, duration, file size)
 * - Complete codec parameters via toJSON()
 *
 * Usage: tsx examples/ffprobe-metadata.ts <input file>
 * Example: tsx examples/ffprobe-metadata.ts testdata/video.mp4
 */

import { AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO, Codec, FormatContext, avGetPixFmtName, avGetSampleFmtName } from '../src/lib/index.js';

import type { AVPixelFormat, AVSampleFormat } from '../src/lib/index.js';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: tsx examples/ffprobe-metadata.ts <input file>');
  console.error('Example: tsx examples/ffprobe-metadata.ts testdata/video.mp4');
  process.exit(1);
}

const inputFile = args[0];

/**
 * Format time in HH:MM:SS.ss format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(2);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.padStart(5, '0')}`;
};

/**
 * Extract FourCC (Four Character Code) from codec tag
 * @param codecTag - 32-bit codec tag value
 * @returns FourCC as 4-character string
 */
const extractFourCC = (codecTag: number): string => {
  return String.fromCharCode((codecTag >> 24) & 0xff, (codecTag >> 16) & 0xff, (codecTag >> 8) & 0xff, codecTag & 0xff);
};

// Create a FormatContext to read the media file
const formatContext = new FormatContext();

// Open the input file (similar to: ffprobe <file>)
await formatContext.openInput(inputFile, null, null);

// Read stream information (similar to: ffprobe -show_streams)
await formatContext.findStreamInfo(null);

// Display basic format information
console.log(`Input #0, ${formatContext.iformat?.longName ?? formatContext.iformat?.name ?? 'unknown'}, from '${inputFile}':`);

// Display format-level metadata
if (formatContext.metadata) {
  console.log('  Metadata:');
  const metadata = formatContext.metadata.getAll();
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`    ${key.padEnd(16)}: ${value}`);
  }
}

// Display duration, start time, and bitrate
const duration = formatContext.duration ? Number(formatContext.duration) / 1000000 : 0;
const bitrate = formatContext.bitRate ? Number(formatContext.bitRate) : 0;
const startTime = formatContext.startTime ? Number(formatContext.startTime) / 1000000 : 0;
console.log(`  Duration: ${formatTime(duration)}, start: ${startTime.toFixed(6)}, bitrate: ${Math.round(bitrate / 1000)} kb/s`);

// Process each stream in the file
for (const stream of formatContext.streams ?? []) {
  const codecParams = stream.codecpar;
  const codec = Codec.findDecoder(codecParams.codecId);

  if (codecParams.codecType === AVMEDIA_TYPE_VIDEO) {
    // Video stream processing
    const pixFmtName = avGetPixFmtName(codecParams.format as AVPixelFormat);
    const dar =
      codecParams.width && codecParams.height && codecParams.sampleAspectRatio
        ? `${codecParams.width * codecParams.sampleAspectRatio.num}:${codecParams.height * codecParams.sampleAspectRatio.den}`
        : `${codecParams.width}:${codecParams.height}`;

    // Extract FourCC code
    const fourcc = extractFourCC(codecParams.codecTag);

    // Calculate frame rates
    const fps = stream.avgFrameRate ? stream.avgFrameRate.num / stream.avgFrameRate.den : 0;
    const tbr = stream.rFrameRate ? stream.rFrameRate.num / stream.rFrameRate.den : 0;

    // Output video stream information (similar to ffprobe output format)
    // prettier-ignore
    console.log(
      `  Stream #0:${stream.index}[0x${stream.id.toString(16)}](${stream.metadata?.get('language') ?? 'und'}): ` +
      `Video: ${codec?.name ?? 'unknown'} (${codec?.longName ?? ''}) ` +
      `(${fourcc} / 0x${codecParams.codecTag.toString(16).toUpperCase().padStart(8, '0')}), ` +
      `${pixFmtName ?? 'unknown'}, ${codecParams.width}x${codecParams.height} ` +
      `[SAR ${codecParams.sampleAspectRatio?.num ?? 1}:${codecParams.sampleAspectRatio?.den ?? 1} DAR ${dar}], ` +
      `${Math.round(Number(codecParams.bitRate) / 1000)} kb/s, ${fps.toFixed(2)} fps, ${tbr.toFixed(2)} tbr, ` +
      `${stream.timeBase.den} tbn${stream.disposition & 0x0001 ? ' (default)' : ''}`,
    );
  } else if (codecParams.codecType === AVMEDIA_TYPE_AUDIO) {
    // Audio stream processing
    const sampleFmtName = avGetSampleFmtName(codecParams.format as AVSampleFormat);

    // Extract FourCC code
    const fourcc = extractFourCC(codecParams.codecTag);

    // Determine channel layout description
    const channelLayout = codecParams.channels === 2 ? 'stereo' : codecParams.channels === 1 ? 'mono' : `${codecParams.channels} channels`;

    // Output audio stream information (similar to ffprobe output format)
    // prettier-ignore
    console.log(
      `  Stream #0:${stream.index}[0x${stream.id.toString(16)}](${stream.metadata?.get('language') ?? 'und'}): ` +
      `Audio: ${codec?.name ?? 'unknown'} (${codec?.longName ?? ''}) ` +
      `(${fourcc} / 0x${codecParams.codecTag.toString(16).toUpperCase().padStart(8, '0')}), ` +
      `${codecParams.sampleRate} Hz, ${channelLayout}, ${sampleFmtName ?? 'unknown'}, ` +
      `${Math.round(Number(codecParams.bitRate) / 1000)} kb/s${stream.disposition & 0x0001 ? ' (default)' : ''}`,
    );
  }

  // Display stream-level metadata
  if (stream.metadata) {
    console.log('      Metadata:');
    const streamMeta = stream.metadata.getAll();
    for (const [key, value] of Object.entries(streamMeta)) {
      console.log(`        ${key.padEnd(16)}: ${value}`);
    }
  }
}

// Output FORMAT section (similar to: ffprobe -show_format)
console.log('\n[FORMAT]');
console.log(`filename=${inputFile}`);
console.log(`nb_streams=${formatContext.nbStreams}`);
console.log(`nb_programs=${formatContext.nbPrograms}`);
console.log(`format_name=${formatContext.iformat?.name ?? 'unknown'}`);
console.log(`format_long_name=${formatContext.iformat?.longName ?? 'unknown'}`);
console.log(`start_time=${startTime.toFixed(6)}`);
console.log(`duration=${duration.toFixed(6)}`);
console.log(`size=${formatContext.pbBytes ?? 0}`);
console.log(`bit_rate=${bitrate}`);
console.log(`probe_score=${formatContext.probeScore}`);

// Output format metadata as TAGs
if (formatContext.metadata) {
  const metadata = formatContext.metadata.getAll();
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`TAG:${key}=${value}`);
  }
}
console.log('[/FORMAT]\n');

// This shows that NodeAV can access ALL codec parameters, not just the commonly used ones
const audioStream = formatContext.streams?.find((s) => s.codecpar.codecType === AVMEDIA_TYPE_AUDIO);
const videoStream = formatContext.streams?.find((s) => s.codecpar.codecType === AVMEDIA_TYPE_VIDEO);

if (videoStream) {
  console.log('// Video stream codec parameters (via toJSON()):');
  console.log(videoStream.codecpar.toJSON());
}

if (audioStream) {
  console.log('\n// Audio stream codec parameters (via toJSON()):');
  console.log(audioStream.codecpar.toJSON());
}
