import { AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO, Codec, FormatContext, avGetPixFmtName, avGetSampleFmtName } from '../src/lib/index.js';

import type { AVPixelFormat, AVSampleFormat } from '../src/lib/index.js';

// Helper to format time
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(2);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.padStart(5, '0')}`;
};

// Helper for BigInt serialization
// const bigIntReplacer = (_key: string, value: any) => (typeof value === 'bigint' ? value.toString() : value);

// Create a simple ffprobe-like output with NodeAV
const formatContext = new FormatContext();
await formatContext.openInput('testdata/video.mp4', null, null);
await formatContext.findStreamInfo(null);

console.log(`Input #0, ${formatContext.iformat?.longName ?? formatContext.iformat?.name ?? 'unknown'}, from 'testdata/video.mp4':`);

// Format metadata
if (formatContext.metadata) {
  console.log('  Metadata:');
  const metadata = formatContext.metadata.getAll();
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`    ${key.padEnd(16)}: ${value}`);
  }
}

// Format info
const duration = formatContext.duration ? Number(formatContext.duration) / 1000000 : 0;
const bitrate = formatContext.bitRate ? Number(formatContext.bitRate) : 0;
const startTime = formatContext.startTime ? Number(formatContext.startTime) / 1000000 : 0;
console.log(`  Duration: ${formatTime(duration)}, start: ${startTime.toFixed(6)}, bitrate: ${Math.round(bitrate / 1000)} kb/s`);

// Streams
for (const stream of formatContext.streams ?? []) {
  const codecParams = stream.codecpar;
  const codec = Codec.findDecoder(codecParams.codecId);

  if (codecParams.codecType === AVMEDIA_TYPE_VIDEO) {
    // Video
    const pixFmtName = avGetPixFmtName(codecParams.format as AVPixelFormat);
    const dar =
      codecParams.width && codecParams.height && codecParams.sampleAspectRatio
        ? `${codecParams.width * codecParams.sampleAspectRatio.num}:${codecParams.height * codecParams.sampleAspectRatio.den}`
        : `${codecParams.width}:${codecParams.height}`;

    const fourcc = String.fromCharCode(
      (codecParams.codecTag >> 24) & 0xff,
      (codecParams.codecTag >> 16) & 0xff,
      (codecParams.codecTag >> 8) & 0xff,
      codecParams.codecTag & 0xff,
    );
    const fps = stream.avgFrameRate ? stream.avgFrameRate.num / stream.avgFrameRate.den : 0;
    const tbr = stream.rFrameRate ? stream.rFrameRate.num / stream.rFrameRate.den : 0;

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
    // Audio
    const sampleFmtName = avGetSampleFmtName(codecParams.format as AVSampleFormat);
    const fourcc = String.fromCharCode(
      (codecParams.codecTag >> 24) & 0xff,
      (codecParams.codecTag >> 16) & 0xff,
      (codecParams.codecTag >> 8) & 0xff,
      codecParams.codecTag & 0xff,
    );
    const channelLayout = codecParams.channels === 2 ? 'stereo' : codecParams.channels === 1 ? 'mono' : `${codecParams.channels} channels`;

    // prettier-ignore
    console.log(
      `  Stream #0:${stream.index}[0x${stream.id.toString(16)}](${stream.metadata?.get('language') ?? 'und'}): ` +
      `Audio: ${codec?.name ?? 'unknown'} (${codec?.longName ?? ''}) ` +
      `(${fourcc} / 0x${codecParams.codecTag.toString(16).toUpperCase().padStart(8, '0')}), ` +
      `${codecParams.sampleRate} Hz, ${channelLayout}, ${sampleFmtName ?? 'unknown'}, ` +
      `${Math.round(Number(codecParams.bitRate) / 1000)} kb/s${stream.disposition & 0x0001 ? ' (default)' : ''}`,
    );
  }

  // Stream metadata
  if (stream.metadata) {
    console.log('      Metadata:');
    const streamMeta = stream.metadata.getAll();
    for (const [key, value] of Object.entries(streamMeta)) {
      console.log(`        ${key.padEnd(16)}: ${value}`);
    }
  }
}

// Now show FORMAT section like ffprobe -show_format
console.log('\n[FORMAT]');
console.log(`filename=${'testdata/video.mp4'}`);
console.log(`nb_streams=${formatContext.nbStreams}`);
console.log(`nb_programs=${formatContext.nbPrograms}`);
console.log('nb_stream_groups=0'); // Not implemented yet
console.log(`format_name=${formatContext.iformat?.name ?? 'unknown'}`);
console.log(`format_long_name=${formatContext.iformat?.longName ?? 'unknown'}`);
console.log(`start_time=${startTime.toFixed(6)}`);
console.log(`duration=${duration.toFixed(6)}`);
console.log(`size=${formatContext.pbBytes ?? 0}`);
console.log(`bit_rate=${bitrate}`);
console.log(`probe_score=${formatContext.probeScore}`);

// Format metadata as TAGs
if (formatContext.metadata) {
  const metadata = formatContext.metadata.getAll();
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`TAG:${key}=${value}`);
  }
}
console.log('[/FORMAT]\n');

const audioStream = formatContext.streams?.find((s) => s.codecpar.codecType === AVMEDIA_TYPE_AUDIO);
const videoStream = formatContext.streams?.find((s) => s.codecpar.codecType === AVMEDIA_TYPE_VIDEO);

if (videoStream) {
  console.log('// Video stream codec parameters:');
  console.log(videoStream.codecpar.toJSON());
}

if (audioStream) {
  console.log('\n// Audio stream codec parameters:');
  console.log(audioStream.codecpar.toJSON());
}
