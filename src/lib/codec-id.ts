/**
 * Codec ID utilities for FFmpeg
 * Provides codec identification helpers
 */

import {
  type AVCodecID,
  type AVMediaType,
  AV_CODEC_ID_AAC,
  AV_CODEC_ID_AC3,
  AV_CODEC_ID_AV1,
  AV_CODEC_ID_DTS,
  AV_CODEC_ID_EAC3,
  AV_CODEC_ID_FLAC,
  AV_CODEC_ID_H264,
  AV_CODEC_ID_HEVC,
  AV_CODEC_ID_MJPEG,
  AV_CODEC_ID_MP2,
  AV_CODEC_ID_MP3,
  AV_CODEC_ID_MPEG1VIDEO,
  AV_CODEC_ID_MPEG2VIDEO,
  AV_CODEC_ID_MPEG4,
  AV_CODEC_ID_NONE,
  AV_CODEC_ID_OPUS,
  AV_CODEC_ID_PCM_S16BE,
  AV_CODEC_ID_PCM_S16LE,
  AV_CODEC_ID_PCM_S24BE,
  AV_CODEC_ID_PCM_S24LE,
  AV_CODEC_ID_PCM_S32BE,
  AV_CODEC_ID_PCM_S32LE,
  AV_CODEC_ID_PRORES,
  AV_CODEC_ID_RAWVIDEO,
  AV_CODEC_ID_VORBIS,
  AV_CODEC_ID_VP8,
  AV_CODEC_ID_VP9,
  AV_CODEC_ID_WEBP,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
} from './constants.js';

/**
 * Codec ID utilities
 */
export class CodecID {
  /**
   * Check if codec ID is none/invalid
   * @param id Codec ID
   * @returns True if none
   */
  static isNone(id: AVCodecID): boolean {
    return id === AV_CODEC_ID_NONE;
  }

  /**
   * Check if codec ID is for video
   * @param id Codec ID
   * @returns True if video codec
   */
  static isVideo(id: AVCodecID): boolean {
    // Video codecs typically have IDs in certain ranges
    // Common video codecs
    return (
      id === AV_CODEC_ID_MPEG1VIDEO ||
      id === AV_CODEC_ID_MPEG2VIDEO ||
      id === AV_CODEC_ID_MPEG4 ||
      id === AV_CODEC_ID_H264 ||
      id === AV_CODEC_ID_HEVC ||
      id === AV_CODEC_ID_VP8 ||
      id === AV_CODEC_ID_VP9 ||
      id === AV_CODEC_ID_AV1 ||
      id === AV_CODEC_ID_MJPEG ||
      id === AV_CODEC_ID_PRORES ||
      id === AV_CODEC_ID_RAWVIDEO ||
      id === AV_CODEC_ID_WEBP ||
      // Video codec range (approximate)
      (id >= 1 && id < 0x10000)
    );
  }

  /**
   * Check if codec ID is for audio
   * @param id Codec ID
   * @returns True if audio codec
   */
  static isAudio(id: AVCodecID): boolean {
    // Common audio codecs
    return (
      id === AV_CODEC_ID_MP2 ||
      id === AV_CODEC_ID_MP3 ||
      id === AV_CODEC_ID_AAC ||
      id === AV_CODEC_ID_AC3 ||
      id === AV_CODEC_ID_EAC3 ||
      id === AV_CODEC_ID_DTS ||
      id === AV_CODEC_ID_VORBIS ||
      id === AV_CODEC_ID_OPUS ||
      id === AV_CODEC_ID_FLAC ||
      id === AV_CODEC_ID_PCM_S16LE ||
      id === AV_CODEC_ID_PCM_S16BE ||
      id === AV_CODEC_ID_PCM_S24LE ||
      id === AV_CODEC_ID_PCM_S24BE ||
      id === AV_CODEC_ID_PCM_S32LE ||
      id === AV_CODEC_ID_PCM_S32BE ||
      // Audio codec range (approximate)
      (id >= 0x10000 && id < 0x20000)
    );
  }

  /**
   * Check if codec ID is PCM/uncompressed
   * @param id Codec ID
   * @returns True if PCM codec
   */
  static isPCM(id: AVCodecID): boolean {
    // PCM codecs are in the range 0x10000-0x10800
    return id >= 0x10000 && id < 0x10800;
  }

  /**
   * Check if codec ID is lossless
   * @param id Codec ID
   * @returns True if lossless codec
   */
  static isLossless(id: AVCodecID): boolean {
    return (
      this.isPCM(id) ||
      id === AV_CODEC_ID_FLAC ||
      id === AV_CODEC_ID_PRORES ||
      // Add more lossless codecs as needed
      false
    );
  }

  /**
   * Check if codec supports intra-only encoding (no inter-frame compression)
   * @param id Codec ID
   * @returns True if intra-only codec
   */
  static isIntraOnly(id: AVCodecID): boolean {
    return id === AV_CODEC_ID_MJPEG || id === AV_CODEC_ID_PRORES || id === AV_CODEC_ID_RAWVIDEO || this.isPCM(id);
  }

  /**
   * Get media type for codec ID
   * @param id Codec ID
   * @returns Media type or undefined
   */
  static getMediaType(id: AVCodecID): AVMediaType | undefined {
    if (this.isVideo(id)) {
      return AV_MEDIA_TYPE_VIDEO;
    }
    if (this.isAudio(id)) {
      return AV_MEDIA_TYPE_AUDIO;
    }
    return undefined;
  }

  /**
   * Get a short name for common codec IDs
   * @param id Codec ID
   * @returns Short codec name
   */
  static getShortName(id: AVCodecID): string {
    switch (id) {
      case AV_CODEC_ID_NONE:
        return 'none';
      case AV_CODEC_ID_MPEG1VIDEO:
        return 'mpeg1video';
      case AV_CODEC_ID_MPEG2VIDEO:
        return 'mpeg2video';
      case AV_CODEC_ID_MPEG4:
        return 'mpeg4';
      case AV_CODEC_ID_H264:
        return 'h264';
      case AV_CODEC_ID_HEVC:
        return 'hevc';
      case AV_CODEC_ID_VP8:
        return 'vp8';
      case AV_CODEC_ID_VP9:
        return 'vp9';
      case AV_CODEC_ID_AV1:
        return 'av1';
      case AV_CODEC_ID_MJPEG:
        return 'mjpeg';
      case AV_CODEC_ID_PRORES:
        return 'prores';
      case AV_CODEC_ID_RAWVIDEO:
        return 'rawvideo';
      case AV_CODEC_ID_MP2:
        return 'mp2';
      case AV_CODEC_ID_MP3:
        return 'mp3';
      case AV_CODEC_ID_AAC:
        return 'aac';
      case AV_CODEC_ID_AC3:
        return 'ac3';
      case AV_CODEC_ID_EAC3:
        return 'eac3';
      case AV_CODEC_ID_DTS:
        return 'dts';
      case AV_CODEC_ID_VORBIS:
        return 'vorbis';
      case AV_CODEC_ID_OPUS:
        return 'opus';
      case AV_CODEC_ID_FLAC:
        return 'flac';
      case AV_CODEC_ID_PCM_S16LE:
        return 'pcm_s16le';
      case AV_CODEC_ID_PCM_S16BE:
        return 'pcm_s16be';
      case AV_CODEC_ID_PCM_S24LE:
        return 'pcm_s24le';
      case AV_CODEC_ID_PCM_S24BE:
        return 'pcm_s24be';
      case AV_CODEC_ID_PCM_S32LE:
        return 'pcm_s32le';
      case AV_CODEC_ID_PCM_S32BE:
        return 'pcm_s32be';
      default:
        return `codec_${id}`;
    }
  }
}
