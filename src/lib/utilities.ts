/**
 * FFmpeg utility functions collection.
 *
 * Provides direct mappings to various FFmpeg utility functions from libavutil.
 * These functions handle common operations like timestamp conversion, image buffer
 * allocation, sample format queries, and more.
 *
 * @example
 * ```typescript
 * import { avImageAlloc, avTs2TimeStr, avRescaleQ, FFmpegError } from '@seydx/av';
 * import { AV_PIX_FMT_YUV420P, IRational } from '@seydx/av';
 *
 * // Allocate image buffer
 * const image = avImageAlloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
 * console.log(`Allocated ${image.size} bytes`);
 *
 * // Convert timestamp to readable time
 * const timebase: IRational = { num: 1, den: 90000 };
 * const pts = 450000n;
 * console.log(avTs2TimeStr(pts, timebase)); // "5.000000"
 * ```
 */

import { bindings } from './binding.js';
import { FFmpegError } from './error.js';

import type { AVMediaType, AVPixelFormat, AVSampleFormat } from './constants.js';
import type { FormatContext } from './format-context.js';
import type { ChannelLayout, IRational } from './types.js';

/**
 * Get bytes per sample for a sample format.
 *
 * Returns the number of bytes required to store one sample in the given format.
 *
 * Direct mapping to av_get_bytes_per_sample()
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Number of bytes per sample, or 0 for invalid format
 *
 * @example
 * ```typescript
 * import { avGetBytesPerSample, AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLT } from '@seydx/av';
 *
 * console.log(avGetBytesPerSample(AV_SAMPLE_FMT_S16)); // 2
 * console.log(avGetBytesPerSample(AV_SAMPLE_FMT_FLT)); // 4
 * ```
 */
export function avGetBytesPerSample(sampleFmt: AVSampleFormat): number {
  return bindings.avGetBytesPerSample(sampleFmt);
}

/**
 * Get the name of a sample format.
 *
 * Returns a string describing the sample format.
 *
 * Direct mapping to av_get_sample_fmt_name()
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Format name string, or null for invalid format
 *
 * @example
 * ```typescript
 * import { avGetSampleFmtName, AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from '@seydx/av';
 *
 * console.log(avGetSampleFmtName(AV_SAMPLE_FMT_S16)); // "s16"
 * console.log(avGetSampleFmtName(AV_SAMPLE_FMT_FLTP)); // "fltp"
 * ```
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
  return bindings.avGetPixFmtFromName(name);
}

/**
 * Check if a pixel format is hardware-accelerated
 * Direct mapping using av_pix_fmt_desc_get() and AV_PIX_FMT_FLAG_HWACCEL
 */
export function avIsHardwarePixelFormat(pixFmt: AVPixelFormat): boolean {
  return bindings.avIsHardwarePixelFormat(pixFmt);
}

/**
 * Get media type string
 * Direct mapping to av_get_media_type_string()
 */
export function avGetMediaTypeString(mediaType: AVMediaType): string | null {
  return bindings.avGetMediaTypeString(mediaType);
}

/**
 * Allocate an image with size, pixel format and alignment.
 *
 * Allocates a buffer large enough to hold an image with the given parameters.
 * The allocated buffer is properly aligned for optimal performance.
 *
 * Direct mapping to av_image_alloc()
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param pixFmt - Pixel format
 * @param align - Buffer alignment (1 for no alignment, 32 for SIMD)
 *
 * @returns Object containing:
 *   - buffer: Allocated image buffer
 *   - size: Total size in bytes
 *   - linesizes: Array of line sizes for each plane
 *
 * @throws {Error} If allocation fails
 *
 * @example
 * ```typescript
 * import { avImageAlloc, AV_PIX_FMT_YUV420P, FFmpegError } from '@seydx/av';
 *
 * try {
 *   const result = avImageAlloc(1920, 1080, AV_PIX_FMT_YUV420P, 32);
 *   console.log(`Allocated ${result.size} bytes`);
 *   console.log(`Y linesize: ${result.linesizes[0]}`);
 *   // Use result.buffer for image data
 * } catch (error) {
 *   console.error('Failed to allocate image buffer');
 * }
 * ```
 *
 * @see {@link avImageGetBufferSize} To calculate required size without allocating
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
    throw new FFmpegError(result);
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
 * Copy image data to a single buffer.
 *
 * Copies image data from separate planes into a single continuous buffer.
 * Useful for serialization or when a single buffer is required.
 *
 * Direct mapping to av_image_copy_to_buffer()
 *
 * @param dst - Destination buffer
 * @param dstSize - Size of destination buffer in bytes
 * @param srcData - Array of source data planes
 * @param srcLinesize - Array of source linesizes
 * @param pixFmt - Pixel format
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param align - Buffer alignment
 *
 * @returns Number of bytes written to dst, or negative AVERROR on error:
 *   - >0: Number of bytes written
 *   - AVERROR(EINVAL): Invalid parameters
 *   - AVERROR(ENOMEM): Destination buffer too small
 *
 * @example
 * ```typescript
 * import { avImageCopyToBuffer, avImageGetBufferSize, FFmpegError } from '@seydx/av';
 * import { AV_PIX_FMT_RGB24 } from '@seydx/av';
 *
 * const width = 640, height = 480;
 * const pixFmt = AV_PIX_FMT_RGB24;
 *
 * // Calculate required buffer size
 * const dstSize = avImageGetBufferSize(pixFmt, width, height, 1);
 * const dst = Buffer.alloc(dstSize);
 *
 * const ret = avImageCopyToBuffer(
 *   dst, dstSize,
 *   srcData, srcLinesize,
 *   pixFmt, width, height, 1
 * );
 *
 * FFmpegError.throwIfError(ret, 'avImageCopyToBuffer');
 * console.log(`Copied ${ret} bytes to buffer`);
 * ```
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
export function avTs2TimeStr(ts: bigint | number | null, timeBase: IRational | null): string {
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
export function avCompareTs(tsA: bigint | number | null, tbA: IRational, tsB: bigint | number | null, tbB: IRational): number {
  return bindings.avCompareTs(tsA, tbA, tsB, tbB);
}

/**
 * Rescale a timestamp from one timebase to another
 * Direct mapping to av_rescale_q()
 */
export function avRescaleQ(a: bigint | number | null, bq: IRational, cq: IRational): bigint {
  return bindings.avRescaleQ(a, bq, cq);
}

/**
 * Sleep for a specified number of microseconds.
 *
 * Provides a cross-platform microsecond sleep function.
 * Useful for timing operations or frame pacing.
 *
 * Direct mapping to av_usleep()
 *
 * @param usec - Number of microseconds to sleep
 *
 * @example
 * ```typescript
 * import { avUsleep } from '@seydx/av';
 *
 * // Sleep for 100ms (100,000 microseconds)
 * avUsleep(100000);
 *
 * // Sleep for 1 second
 * avUsleep(1000000);
 *
 * // Frame pacing for 30fps (33.33ms per frame)
 * const frameTime = 1000000 / 30;
 * avUsleep(frameTime);
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
    throw new FFmpegError(result);
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
    throw new FFmpegError(result);
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

/**
 * Create an SDP (Session Description Protocol) string for RTP/RTSP streaming.
 *
 * Generates an SDP description from one or more FormatContext objects.
 * Useful for RTP/RTSP streaming scenarios where you need to describe
 * the media streams to clients.
 *
 * Direct mapping to av_sdp_create()
 *
 * @param contexts - Array of FormatContext objects to describe
 * @returns SDP string on success, or null on failure
 *
 * @throws {FFmpegError} On invalid parameters or SDP creation failure
 *
 * @example
 * ```typescript
 * import { avSdpCreate, FormatContext, FFmpegError } from '@seydx/av';
 *
 * // Create format contexts for RTP output
 * const contexts: FormatContext[] = [];
 *
 * const ctx = new FormatContext();
 * // ... configure context for RTP output ...
 * contexts.push(ctx);
 *
 * // Generate SDP
 * const sdp = avSdpCreate(contexts);
 * if (sdp) {
 *   console.log('SDP:', result);
 * }
 *
 * // Use the SDP string for RTSP server or save to .sdp file
 * ```
 */
export function avSdpCreate(contexts: FormatContext[]): string | null {
  if (!Array.isArray(contexts) || contexts.length === 0) {
    return null;
  }

  // Pass the native objects to the binding
  const nativeContexts = contexts
    .map((ctx) => {
      if (ctx && typeof ctx.getNative === 'function') {
        const nativeCtx = ctx.getNative();
        if (nativeCtx) {
          return nativeCtx;
        }
      }
    })
    .filter((ctx) => ctx !== undefined);

  // If no valid contexts after filtering, return null
  if (nativeContexts.length === 0) {
    return null;
  }

  return bindings.avSdpCreate(nativeContexts);
}
