import { bindings } from './binding.js';
import { FFmpegError } from './error.js';

import type { AVCodecID, AVMediaType, AVPixelFormat, AVSampleFormat } from '../constants/constants.js';
import type { FormatContext } from './format-context.js';
import type { ChannelLayout, IRational } from './types.js';

/**
 * Get bytes per audio sample.
 *
 * Returns the number of bytes required to store a single audio sample
 * in the specified format.
 *
 * Direct mapping to av_get_bytes_per_sample().
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Number of bytes per sample, or 0 if unknown format
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * const bytesS16 = avGetBytesPerSample(AV_SAMPLE_FMT_S16);  // Returns 2
 * const bytesFloat = avGetBytesPerSample(AV_SAMPLE_FMT_FLTP); // Returns 4
 * ```
 *
 * @see [av_get_bytes_per_sample](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#ga0c3c218e1dd570ad4917c69a35a6c77d) - FFmpeg Doxygen
 */
export function avGetBytesPerSample(sampleFmt: AVSampleFormat): number {
  return bindings.avGetBytesPerSample(sampleFmt);
}

/**
 * Get sample format name.
 *
 * Returns the name of the audio sample format as a string.
 *
 * Direct mapping to av_get_sample_fmt_name().
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Format name, or null if unknown
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * const name1 = avGetSampleFmtName(AV_SAMPLE_FMT_S16);  // Returns "s16"
 * const name2 = avGetSampleFmtName(AV_SAMPLE_FMT_FLTP); // Returns "fltp"
 * ```
 *
 * @see [av_get_sample_fmt_name](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#ga31b9d149b2de9821a65f4f5612970838) - FFmpeg Doxygen
 */
export function avGetSampleFmtName(sampleFmt: AVSampleFormat): string | null {
  return bindings.avGetSampleFmtName(sampleFmt);
}

/**
 * Get packed sample format.
 *
 * Returns the packed (interleaved) version of a planar sample format,
 * or the format itself if already packed.
 *
 * Direct mapping to av_get_packed_sample_fmt().
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Packed version of the format
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_FLT } from 'node-av/constants';
 *
 * const packed = avGetPackedSampleFmt(AV_SAMPLE_FMT_FLTP); // Returns AV_SAMPLE_FMT_FLT
 * const same = avGetPackedSampleFmt(AV_SAMPLE_FMT_FLT);    // Returns AV_SAMPLE_FMT_FLT
 * ```
 *
 * @see [av_get_packed_sample_fmt](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#ga7817ec0eff4dc6fc0962f31e6d138bca) - FFmpeg Doxygen
 * @see {@link avGetPlanarSampleFmt} For getting planar version
 */
export function avGetPackedSampleFmt(sampleFmt: AVSampleFormat): AVSampleFormat {
  return bindings.avGetPackedSampleFmt(sampleFmt);
}

/**
 * Get planar sample format.
 *
 * Returns the planar (non-interleaved) version of a packed sample format,
 * or the format itself if already planar.
 *
 * Direct mapping to av_get_planar_sample_fmt().
 *
 * @param sampleFmt - Audio sample format
 *
 * @returns Planar version of the format
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_FLT, AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * const planar = avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLT);   // Returns AV_SAMPLE_FMT_FLTP
 * const same = avGetPlanarSampleFmt(AV_SAMPLE_FMT_FLTP);    // Returns AV_SAMPLE_FMT_FLTP
 * ```
 *
 * @see [av_get_planar_sample_fmt](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#ga82caf838259d95cc6c4fd87633bb0e19) - FFmpeg Doxygen
 * @see {@link avGetPackedSampleFmt} For getting packed version
 */
export function avGetPlanarSampleFmt(sampleFmt: AVSampleFormat): AVSampleFormat {
  return bindings.avGetPlanarSampleFmt(sampleFmt);
}

/**
 * Check if sample format is planar.
 *
 * Returns whether the audio sample format stores channels in separate planes
 * (planar) rather than interleaved.
 *
 * Direct mapping to av_sample_fmt_is_planar().
 *
 * @param sampleFmt - Audio sample format to check
 *
 * @returns True if planar, false if packed/interleaved
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_S16, AV_SAMPLE_FMT_S16P } from 'node-av/constants';
 *
 * const isPacked = avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16);  // Returns false
 * const isPlanar = avSampleFmtIsPlanar(AV_SAMPLE_FMT_S16P); // Returns true
 * ```
 *
 * @see [av_sample_fmt_is_planar](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#ga06ba8a64dc4382c422789a5d0b6bf592) - FFmpeg Doxygen
 */
export function avSampleFmtIsPlanar(sampleFmt: AVSampleFormat): boolean {
  return bindings.avSampleFmtIsPlanar(sampleFmt);
}

/**
 * Get codec name from codec ID.
 *
 * Returns the canonical codec name corresponding to the codec ID.
 *
 * Direct mapping to avcodec_get_name().
 *
 * @param codecId - Codec ID from AVCodecID enum
 *
 * @returns Codec name string or null
 *
 * @example
 * ```typescript
 * import { AV_CODEC_ID_H264, AV_CODEC_ID_HEVC } from 'node-av/constants';
 * import { avGetCodecName } from 'node-av/lib';
 *
 * const h264Name = avGetCodecName(AV_CODEC_ID_H264);  // Returns "h264"
 * const hevcName = avGetCodecName(AV_CODEC_ID_HEVC);  // Returns "hevc"
 * const unknownName = avGetCodecName(99999);          // Returns null
 * ```
 *
 * @see [avcodec_get_name](https://ffmpeg.org/doxygen/7.1/group__lavc__core.html#ga2016a52e94f867ebe5113bdf448e182d) - FFmpeg Doxygen
 */
export function avGetCodecName(codecId: AVCodecID): string | null {
  return bindings.avGetCodecName(codecId);
}

/**
 * Get pixel format name.
 *
 * Returns the name of the pixel format as a string.
 *
 * Direct mapping to av_get_pix_fmt_name().
 *
 * @param pixFmt - Pixel format
 *
 * @returns Format name, or null if unknown
 *
 * @example
 * ```typescript
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_RGB24 } from 'node-av/constants';
 *
 * const name1 = avGetPixFmtName(AV_PIX_FMT_YUV420P); // Returns "yuv420p"
 * const name2 = avGetPixFmtName(AV_PIX_FMT_RGB24);   // Returns "rgb24"
 * ```
 *
 * @see [av_get_pix_fmt_name](https://ffmpeg.org/doxygen/7.1/pixdesc_8c.html#ab92e2a8a9b58c982560c49df9f01e47e) - FFmpeg Doxygen
 */
export function avGetPixFmtName(pixFmt: AVPixelFormat): string | null {
  return bindings.avGetPixFmtName(pixFmt);
}

/**
 * Get pixel format from name.
 *
 * Returns the pixel format enum value from its string name.
 *
 * Direct mapping to av_get_pix_fmt().
 *
 * @param name - Pixel format name
 *
 * @returns Pixel format enum, or AV_PIX_FMT_NONE if unknown
 *
 * @example
 * ```typescript
 * const fmt1 = avGetPixFmtFromName("yuv420p"); // Returns AV_PIX_FMT_YUV420P
 * const fmt2 = avGetPixFmtFromName("rgb24");   // Returns AV_PIX_FMT_RGB24
 * const none = avGetPixFmtFromName("invalid"); // Returns AV_PIX_FMT_NONE
 * ```
 *
 * @see [av_get_pix_fmt](https://ffmpeg.org/doxygen/7.1/pixdesc_8h.html#a925ef18d69c24c3be8c53d5a7dc0660e) - FFmpeg Doxygen
 */
export function avGetPixFmtFromName(name: string): AVPixelFormat {
  return bindings.avGetPixFmtFromName(name);
}

/**
 * Check if pixel format is hardware accelerated.
 *
 * Returns whether the pixel format represents hardware-accelerated frames
 * (GPU memory) rather than software frames (system memory).
 *
 * Direct mapping to av_pix_fmt_desc_get() with hwaccel check.
 *
 * @param pixFmt - Pixel format to check
 *
 * @returns True if hardware format, false if software format
 *
 * @example
 * ```typescript
 * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_CUDA } from 'node-av/constants';
 *
 * const isSoftware = avIsHardwarePixelFormat(AV_PIX_FMT_YUV420P); // Returns false
 * const isHardware = avIsHardwarePixelFormat(AV_PIX_FMT_CUDA);    // Returns true
 * ```
 *
 * @see [av_pix_fmt_desc_get](https://ffmpeg.org/doxygen/7.1/pixdesc_8c.html#afe0c3e8aef5173de28bbdaea4298f5f0) - FFmpeg Doxygen
 */
export function avIsHardwarePixelFormat(pixFmt: AVPixelFormat): boolean {
  return bindings.avIsHardwarePixelFormat(pixFmt);
}

/**
 * Get media type string.
 *
 * Returns a human-readable string for the media type.
 *
 * Direct mapping to av_get_media_type_string().
 *
 * @param mediaType - Media type enum
 *
 * @returns Media type name, or null if unknown
 *
 * @example
 * ```typescript
 * import { AVMEDIA_TYPE_VIDEO, AVMEDIA_TYPE_AUDIO } from 'node-av/constants';
 *
 * const video = avGetMediaTypeString(AVMEDIA_TYPE_VIDEO); // Returns "video"
 * const audio = avGetMediaTypeString(AVMEDIA_TYPE_AUDIO); // Returns "audio"
 * ```
 *
 * @see [av_get_media_type_string](https://ffmpeg.org/doxygen/7.1/group__lavu__misc.html#gaf21645cfa855b2caf9699d7dc7b2d08e) - FFmpeg Doxygen
 */
export function avGetMediaTypeString(mediaType: AVMediaType): string | null {
  return bindings.avGetMediaTypeString(mediaType);
}

/**
 * Allocate image buffer.
 *
 * Allocates a buffer large enough to hold an image with the specified dimensions
 * and pixel format. Returns buffer and layout information.
 *
 * Direct mapping to av_image_alloc().
 *
 * @param width - Image width in pixels
 *
 * @param height - Image height in pixels
 *
 * @param pixFmt - Pixel format
 *
 * @param align - Buffer alignment (typically 1 or 32)
 *
 * @returns Object with buffer, size, and line sizes
 *
 * @throws {FFmpegError} If allocation fails
 *
 * @example
 * ```typescript
 * import { AV_PIX_FMT_YUV420P } from 'node-av/constants';
 *
 * const { buffer, size, linesizes } = avImageAlloc(
 *   1920, 1080, AV_PIX_FMT_YUV420P, 32
 * );
 * console.log(`Allocated ${size} bytes`);
 * console.log(`Line sizes: ${linesizes}`);
 * ```
 *
 * @see [av_image_alloc](https://ffmpeg.org/doxygen/7.1/group__lavu__picture.html#ga841e0a89a642e24141af1918a2c10448) - FFmpeg Doxygen
 * @see {@link avImageGetBufferSize} To calculate size without allocating
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
 * Copy image data.
 *
 * Copies image data from source to destination buffers.
 *
 * Direct mapping to av_image_copy2().
 *
 * @param dstData - Destination data planes
 *
 * @param dstLinesizes - Destination bytes per line
 *
 * @param srcData - Source data planes
 *
 * @param srcLinesizes - Source bytes per line
 *
 * @param pixFmt - Pixel format
 *
 * @param width - Image width
 *
 * @param height - Image height
 *
 * @example
 * ```typescript
 * avImageCopy2(
 *   dstPlanes, dstStrides,
 *   srcPlanes, srcStrides,
 *   AV_PIX_FMT_YUV420P, 1920, 1080
 * );
 * ```
 *
 * @see [av_image_copy2](https://ffmpeg.org/doxygen/7.1/group__lavu__picture.html#ga911cb7d723163b88bdbbdacbeeaacf2d) - FFmpeg Doxygen
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
 * Get image buffer size.
 *
 * Calculates the required buffer size for an image without allocating.
 *
 * Direct mapping to av_image_get_buffer_size().
 *
 * @param pixFmt - Pixel format
 *
 * @param width - Image width
 *
 * @param height - Image height
 *
 * @param align - Buffer alignment
 *
 * @returns Required buffer size in bytes
 *
 * @example
 * ```typescript
 * import { AV_PIX_FMT_RGB24 } from 'node-av/constants';
 *
 * const size = avImageGetBufferSize(AV_PIX_FMT_RGB24, 1920, 1080, 1);
 * console.log(`Need ${size} bytes for Full HD RGB24`);
 * ```
 *
 * @see [av_image_get_buffer_size](https://ffmpeg.org/doxygen/7.1/group__lavu__picture.html#ga24a67963c3ae0054a2a4bab35930e694) - FFmpeg Doxygen
 * @see {@link avImageAlloc} To allocate the buffer
 */
export function avImageGetBufferSize(pixFmt: AVPixelFormat, width: number, height: number, align: number): number {
  return bindings.avImageGetBufferSize(pixFmt, width, height, align);
}

/**
 * Copy image to buffer.
 *
 * Copies image data from separate planes to a single contiguous buffer.
 *
 * Direct mapping to av_image_copy_to_buffer().
 *
 * @param dst - Destination buffer
 *
 * @param dstSize - Destination buffer size
 *
 * @param srcData - Source data planes
 *
 * @param srcLinesize - Source bytes per line
 *
 * @param pixFmt - Pixel format
 *
 * @param width - Image width
 *
 * @param height - Image height
 *
 * @param align - Buffer alignment
 *
 * @returns Bytes written, or negative AVERROR
 *
 * @example
 * ```typescript
 * const buffer = Buffer.alloc(bufferSize);
 * const written = avImageCopyToBuffer(
 *   buffer, bufferSize,
 *   srcPlanes, srcStrides,
 *   AV_PIX_FMT_YUV420P, 1920, 1080, 1
 * );
 * ```
 *
 * @see [av_image_copy_to_buffer](https://ffmpeg.org/doxygen/7.1/group__lavu__picture.html#ga6f8576f1ef0c2d9a9f7c5ac7f9a28c52) - FFmpeg Doxygen
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
 * Convert timestamp to string.
 *
 * Converts a timestamp to a string representation.
 *
 * Direct mapping to av_ts2str().
 *
 * @param ts - Timestamp value
 *
 * @returns String representation
 *
 * @example
 * ```typescript
 * const str1 = avTs2Str(1234567n);  // Returns "1234567"
 * const str2 = avTs2Str(null);      // Returns "NOPTS"
 * ```
 *
 * @see [av_ts2str](https://ffmpeg.org/doxygen/7.1/timestamp_8h.html#a86d797e907fa454ed5fd34bfb0bcd747) - FFmpeg Doxygen
 */
export function avTs2Str(ts: bigint | number | null): string {
  return bindings.avTs2Str(ts);
}

/**
 * Convert timestamp to time string.
 *
 * Converts a timestamp to a time string using the specified time base.
 *
 * Direct mapping to av_ts2timestr().
 *
 * @param ts - Timestamp value
 *
 * @param timeBase - Time base for conversion
 *
 * @returns Time string representation
 *
 * @example
 * ```typescript
 * const timeStr = avTs2TimeStr(90000n, { num: 1, den: 90000 }); // Returns "1.000000"
 * const nopts = avTs2TimeStr(null, { num: 1, den: 1000 });      // Returns "NOPTS"
 * ```
 *
 * @see [av_ts2timestr](https://ffmpeg.org/doxygen/7.1/timestamp_8h.html#ad344b91ede6b86fc0a530611293f42da) - FFmpeg Doxygen
 */
export function avTs2TimeStr(ts: bigint | number | null, timeBase: IRational | null): string {
  if (!timeBase) {
    return avTs2Str(ts);
  }
  return bindings.avTs2TimeStr(ts, timeBase);
}

/**
 * Allocate image arrays.
 *
 * Allocates image data as separate plane arrays.
 *
 * @param width - Image width
 *
 * @param height - Image height
 *
 * @param pixFmt - Pixel format
 *
 * @param align - Buffer alignment
 *
 * @returns Object with data planes, line sizes, and total size
 *
 * @example
 * ```typescript
 * const { data, linesizes, size } = avImageAllocArrays(
 *   1920, 1080, AV_PIX_FMT_YUV420P, 32
 * );
 * console.log(`Allocated ${data.length} planes, total ${size} bytes`);
 * ```
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
 * Compare timestamps.
 *
 * Compares two timestamps with different time bases.
 *
 * Direct mapping to av_compare_ts().
 *
 * @param tsA - First timestamp
 *
 * @param tbA - First time base
 *
 * @param tsB - Second timestamp
 *
 * @param tbB - Second time base
 *
 * @returns -1 if A < B, 0 if A == B, 1 if A > B
 *
 * @example
 * ```typescript
 * const cmp = avCompareTs(
 *   1000n, { num: 1, den: 1000 },  // 1 second
 *   900n, { num: 1, den: 900 }      // 1 second
 * );
 * // Returns 0 (equal)
 * ```
 *
 * @see [av_compare_ts](https://ffmpeg.org/doxygen/7.1/group__lavu__math.html#ga151744358fff630942b926e67e67c415) - FFmpeg Doxygen
 */
export function avCompareTs(tsA: bigint | number | null, tbA: IRational, tsB: bigint | number | null, tbB: IRational): number {
  return bindings.avCompareTs(tsA, tbA, tsB, tbB);
}

/**
 * Rescale timestamp.
 *
 * Rescales a timestamp from one time base to another.
 *
 * Direct mapping to av_rescale_q().
 *
 * @param a - Timestamp to rescale
 *
 * @param bq - Source time base
 *
 * @param cq - Destination time base
 *
 * @returns Rescaled timestamp
 *
 * @example
 * ```typescript
 * // Convert 1 second from 1000Hz to 90kHz
 * const rescaled = avRescaleQ(
 *   1000n,
 *   { num: 1, den: 1000 },   // 1000 Hz
 *   { num: 1, den: 90000 }   // 90 kHz
 * );
 * // Returns 90000n
 * ```
 *
 * @see [av_rescale_q](https://ffmpeg.org/doxygen/7.1/group__lavu__math.html#gaf02994a8bbeaa91d4757df179cbe567f) - FFmpeg Doxygen
 */
export function avRescaleQ(a: bigint | number | null, bq: IRational, cq: IRational): bigint {
  return bindings.avRescaleQ(a, bq, cq);
}

/**
 * Sleep for microseconds.
 *
 * Suspends execution for the specified number of microseconds.
 *
 * Direct mapping to av_usleep().
 *
 * @param usec - Microseconds to sleep
 *
 * @example
 * ```typescript
 * avUsleep(1000000); // Sleep for 1 second
 * avUsleep(16667);   // Sleep for ~16.67ms (60fps frame time)
 * ```
 *
 * @see [av_usleep](https://ffmpeg.org/doxygen/7.1/time_8c.html#a4eee9c65835652a808973f4bc1641a51) - FFmpeg Doxygen
 */
export function avUsleep(usec: number): void {
  bindings.avUsleep(usec);
}

/**
 * Rescale with rounding.
 *
 * Rescales a value with specified rounding behavior.
 *
 * Direct mapping to av_rescale_rnd().
 *
 * @param a - Value to rescale
 *
 * @param b - Multiplier
 *
 * @param c - Divisor
 *
 * @param rnd - Rounding mode (AV_ROUND_*)
 *
 * @returns Rescaled value
 *
 * @example
 * ```typescript
 * import { AV_ROUND_NEAR_INF } from 'node-av/constants';
 *
 * const rescaled = avRescaleRnd(1000n, 90000n, 1000n, AV_ROUND_NEAR_INF);
 * // Returns 90000n
 * ```
 *
 * @see [av_rescale_rnd](https://ffmpeg.org/doxygen/7.1/group__lavu__math.html#ga82d40664213508918093822461cc597e) - FFmpeg Doxygen
 */
export function avRescaleRnd(a: bigint | number, b: bigint | number, c: bigint | number, rnd: number): bigint {
  return bindings.avRescaleRnd(a, b, c, rnd);
}

/**
 * Allocate audio samples buffer.
 *
 * Allocates buffers for audio samples with the specified format.
 *
 * Direct mapping to av_samples_alloc().
 *
 * @param nbChannels - Number of audio channels
 *
 * @param nbSamples - Number of samples per channel
 *
 * @param sampleFmt - Sample format
 *
 * @param align - Buffer alignment
 *
 * @returns Object with data buffers, line size, and total size
 *
 * @throws {FFmpegError} If allocation fails
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_FLTP } from 'node-av/constants';
 *
 * const { data, linesize, size } = avSamplesAlloc(
 *   2, 1024, AV_SAMPLE_FMT_FLTP, 0
 * );
 * console.log(`Allocated ${data.length} buffers, ${size} bytes total`);
 * ```
 *
 * @see [av_samples_alloc](https://ffmpeg.org/doxygen/7.1/group__lavu__sampmanip.html#ga4db4c77f928d32c7d8854732f50b8c04) - FFmpeg Doxygen
 * @see {@link avSamplesGetBufferSize} To calculate size without allocating
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
 * Get audio samples buffer size.
 *
 * Calculates the required buffer size for audio samples.
 *
 * Direct mapping to av_samples_get_buffer_size().
 *
 * @param nbChannels - Number of channels
 *
 * @param nbSamples - Number of samples per channel
 *
 * @param sampleFmt - Sample format
 *
 * @param align - Buffer alignment
 *
 * @returns Object with size and line size
 *
 * @throws {FFmpegError} If parameters are invalid
 *
 * @example
 * ```typescript
 * import { AV_SAMPLE_FMT_S16 } from 'node-av/constants';
 *
 * const { size, linesize } = avSamplesGetBufferSize(
 *   2, 1024, AV_SAMPLE_FMT_S16, 0
 * );
 * console.log(`Need ${size} bytes, ${linesize} per channel`);
 * ```
 *
 * @see [av_samples_get_buffer_size](https://ffmpeg.org/doxygen/7.1/group__lavu__sampfmts.html#gaa7368bc4e3a366b688e81938ed55eb06) - FFmpeg Doxygen
 * @see {@link avSamplesAlloc} To allocate the buffer
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
 * Describe channel layout.
 *
 * Returns a human-readable description of a channel layout.
 *
 * Direct mapping to av_channel_layout_describe().
 *
 * @param channelLayout - Channel layout to describe
 *
 * @returns Layout description string, or null
 *
 * @example
 * ```typescript
 * const stereo = { nbChannels: 2, order: 1, u: { mask: 3n } };
 * const desc = avChannelLayoutDescribe(stereo); // Returns "stereo"
 * ```
 *
 * @see [av_channel_layout_describe](https://ffmpeg.org/doxygen/7.1/group__lavu__audio__channels.html#gacc7d7d1a280248aafb8f9196c9d4e24f) - FFmpeg Doxygen
 */
export function avChannelLayoutDescribe(channelLayout: Partial<ChannelLayout>): string | null {
  return bindings.avChannelLayoutDescribe(channelLayout);
}

/**
 * Create SDP from format contexts.
 *
 * Creates an SDP (Session Description Protocol) string from format contexts.
 * Used for RTP/RTSP streaming.
 *
 * Direct mapping to av_sdp_create().
 *
 * @param contexts - Array of format contexts
 *
 * @returns SDP string, or null on error
 *
 * @example
 * ```typescript
 * const sdp = avSdpCreate([outputContext]);
 * if (sdp) {
 *   console.log('SDP:\n' + sdp);
 * }
 * ```
 *
 * @see [av_sdp_create](https://ffmpeg.org/doxygen/7.1/group__lavf__misc.html#gaa2a7353a6bb0c8726797abd56b176af0) - FFmpeg Doxygen
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
