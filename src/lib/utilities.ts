/**
 * FFmpeg utility functions - Low Level API
 *
 * Direct mappings to various FFmpeg utility functions from libavutil.
 */

import { bindings } from './binding.js';

import type { AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Rational } from './rational.js';
import type { ChannelLayout } from './types.js';

/**
 * Get bytes per sample for a sample format
 * Direct mapping to av_get_bytes_per_sample()
 */
export function avGetBytesPerSample(sampleFmt: AVSampleFormat): number {
  return bindings.avGetBytesPerSample(sampleFmt);
}

/**
 * Get sample format name
 * Direct mapping to av_get_sample_fmt_name()
 */
export function avGetSampleFmtName(sampleFmt: AVSampleFormat): string | null {
  return bindings.avGetSampleFmtName(sampleFmt);
}

/**
 * Get packed sample format
 * Direct mapping to av_get_packed_sample_fmt()
 */
export function avGetPackedSampleFmt(sampleFmt: AVSampleFormat): AVSampleFormat {
  return bindings.avGetPackedSampleFmt(sampleFmt);
}

/**
 * Get planar sample format
 * Direct mapping to av_get_planar_sample_fmt()
 */
export function avGetPlanarSampleFmt(sampleFmt: AVSampleFormat): AVSampleFormat {
  return bindings.avGetPlanarSampleFmt(sampleFmt);
}

/**
 * Check if sample format is planar
 * Direct mapping to av_sample_fmt_is_planar()
 */
export function avSampleFmtIsPlanar(sampleFmt: AVSampleFormat): boolean {
  return bindings.avSampleFmtIsPlanar(sampleFmt);
}

/**
 * Get pixel format name
 * Direct mapping to av_get_pix_fmt_name()
 */
export function avGetPixFmtName(pixFmt: AVPixelFormat): string | null {
  return bindings.avGetPixFmtName(pixFmt);
}

/**
 * Get pixel format from name
 * Direct mapping to av_get_pix_fmt()
 */
export function avGetPixFmtFromName(name: string): AVPixelFormat {
  return bindings.avGetPixFmtFromName(name) as AVPixelFormat;
}

/**
 * Get media type string
 * Direct mapping to av_get_media_type_string()
 */
export function avGetMediaTypeString(mediaType: AVMediaType): string | null {
  return bindings.avGetMediaTypeString(mediaType);
}

/**
 * Allocate an image with size, pixel format and alignment
 * Direct mapping to av_image_alloc()
 *
 * Returns an object with the allocated buffer, size and linesizes, or throws on error
 *
 * @example
 * ```typescript
 * const result = avImageAlloc(1920, 1080, AV_PIX_FMT_YUV420P, 1);
 * // result.buffer contains the allocated image data
 * // result.size is the total size in bytes
 * // result.linesizes is an array of line sizes for each plane
 * ```
 */
export function avImageAlloc(
  width: number,
  height: number,
  pixFmt: AVPixelFormat,
  align: number,
): {
  buffer: Buffer;
  size: number;
  linesizes: number[];
} {
  const result = bindings.avImageAlloc(width, height, pixFmt, align);
  if (typeof result === 'number') {
    // Error code returned instead of object
    throw new Error(`Failed to allocate image: error code ${result}`);
  }
  return result;
}

/**
 * Copy image data from src to dst
 * Direct mapping to av_image_copy2()
 *
 * @param dstData - Destination data buffers (one per plane)
 * @param dstLinesizes - Destination line sizes
 * @param srcData - Source data buffers (one per plane)
 * @param srcLinesizes - Source line sizes
 * @param pixFmt - Pixel format
 * @param width - Image width
 * @param height - Image height
 */
export function avImageCopy2(
  dstData: Buffer[],
  dstLinesizes: number[],
  srcData: Buffer[],
  srcLinesizes: number[],
  pixFmt: AVPixelFormat,
  width: number,
  height: number,
): void {
  bindings.avImageCopy2(dstData, dstLinesizes, srcData, srcLinesizes, pixFmt, width, height);
}

/**
 * Get the required buffer size for an image
 * Direct mapping to av_image_get_buffer_size()
 *
 * @returns The required buffer size in bytes, or negative on error
 */
export function avImageGetBufferSize(pixFmt: AVPixelFormat, width: number, height: number, align: number): number {
  return bindings.avImageGetBufferSize(pixFmt, width, height, align);
}

/**
 * Copy image data to buffer
 * Direct mapping to av_image_copy_to_buffer()
 *
 * @param dst - Destination buffer
 * @param dstSize - Size of destination buffer
 * @param srcData - Array of source data planes
 * @param srcLinesize - Array of source linesizes
 * @param pixFmt - Pixel format
 * @param width - Image width
 * @param height - Image height
 * @param align - Buffer alignment
 * @returns Number of bytes written to dst, or negative error code
 */
export function avImageCopyToBuffer(
  dst: Buffer,
  dstSize: number,
  srcData: Buffer[] | null,
  srcLinesize: number[] | null,
  pixFmt: AVPixelFormat,
  width: number,
  height: number,
  align: number,
): number {
  return bindings.avImageCopyToBuffer(dst, dstSize, srcData, srcLinesize, pixFmt, width, height, align);
}

/**
 * Convert timestamp to string
 * Direct mapping to av_ts2str()
 */
export function avTs2Str(ts: bigint | number | null): string {
  return bindings.avTs2Str(ts);
}

/**
 * Convert timestamp to time string
 * Direct mapping to av_ts2timestr()
 */
export function avTs2TimeStr(ts: bigint | number | null, timeBase: Rational | null): string {
  if (!timeBase) {
    return avTs2Str(ts);
  }
  return bindings.avTs2TimeStr(ts, timeBase);
}

/**
 * Helper to separate image allocation result into separate arrays
 * This is useful when you need separate data and linesize arrays
 */
export function avImageAllocArrays(
  width: number,
  height: number,
  pixFmt: AVPixelFormat,
  align: number,
): {
  data: Buffer[];
  linesizes: number[];
  size: number;
} {
  const result = avImageAlloc(width, height, pixFmt, align);

  // Split the buffer into planes based on pixel format
  const data: Buffer[] = [];
  const linesizes = result.linesizes;

  // For now, we'll treat it as a single buffer
  // In a real implementation, we'd need to know the plane layout for each pixel format
  data[0] = result.buffer;

  return {
    data,
    linesizes,
    size: result.size,
  };
}

/**
 * Compare two timestamps
 * Direct mapping to av_compare_ts()
 *
 * @returns -1 if tsA < tsB, 0 if tsA == tsB, 1 if tsA > tsB
 */
export function avCompareTs(tsA: bigint | number | null, tbA: Rational, tsB: bigint | number | null, tbB: Rational): number {
  return bindings.avCompareTs(tsA, tbA, tsB, tbB);
}

/**
 * Rescale a timestamp from one timebase to another
 * Direct mapping to av_rescale_q()
 */
export function avRescaleQ(a: bigint | number | null, bq: Rational, cq: Rational): bigint {
  return bindings.avRescaleQ(a, bq, cq);
}

/**
 * Sleep for a specified number of microseconds.
 *
 * Direct mapping to av_usleep()
 *
 * @param usec - Number of microseconds to sleep
 *
 * @example
 * ```typescript
 * // Sleep for 100ms
 * avUsleep(100000);
 * ```
 */
export function avUsleep(usec: number): void {
  bindings.avUsleep(usec);
}

/**
 * Rescale a timestamp with rounding
 * Direct mapping to av_rescale_rnd()
 *
 * @param a - Value to rescale
 * @param b - Numerator of scale factor
 * @param c - Denominator of scale factor
 * @param rnd - Rounding mode (AVRounding enum)
 * @returns Rescaled value
 */
export function avRescaleRnd(a: bigint | number, b: bigint | number, c: bigint | number, rnd: number): bigint {
  return bindings.avRescaleRnd(a, b, c, rnd);
}

/**
 * Allocate audio sample buffers
 * Direct mapping to av_samples_alloc()
 *
 * @param nbChannels - Number of channels
 * @param nbSamples - Number of samples per channel
 * @param sampleFmt - Sample format
 * @param align - Buffer alignment (0 for default)
 * @returns Object with allocated data buffers, linesize and total size, or error code
 */
export function avSamplesAlloc(
  nbChannels: number,
  nbSamples: number,
  sampleFmt: AVSampleFormat,
  align: number,
): {
  data: Buffer[];
  linesize: number;
  size: number;
} {
  const result = bindings.avSamplesAlloc(nbChannels, nbSamples, sampleFmt, align);
  if (typeof result === 'number') {
    throw new Error(`Failed to allocate samples: error code ${result}`);
  }
  return result;
}

/**
 * Get the required buffer size for audio samples
 * Direct mapping to av_samples_get_buffer_size()
 *
 * @param nbChannels - Number of channels
 * @param nbSamples - Number of samples per channel
 * @param sampleFmt - Sample format
 * @param align - Buffer alignment (0 for default)
 * @returns Object with size and linesize, or error code
 */
export function avSamplesGetBufferSize(
  nbChannels: number,
  nbSamples: number,
  sampleFmt: AVSampleFormat,
  align: number,
): {
  size: number;
  linesize: number;
} {
  const result = bindings.avSamplesGetBufferSize(nbChannels, nbSamples, sampleFmt, align);
  if (typeof result === 'number') {
    throw new Error(`Failed to get buffer size: error code ${result}`);
  }
  return result;
}

/**
 * Get a string description of a channel layout.
 * Direct mapping to av_channel_layout_describe()
 *
 * @param channelLayout - The channel layout object with order, nbChannels, and mask
 * @returns String description of the channel layout, or null if invalid
 */
export function avChannelLayoutDescribe(channelLayout: Partial<ChannelLayout>): string | null {
  return bindings.avChannelLayoutDescribe(channelLayout);
}
