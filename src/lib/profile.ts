/**
 * Profile utilities for FFmpeg
 * Provides codec profile definitions and utilities
 */

import {
  type AVProfile,
  AV_PROFILE_AAC_ELD,
  AV_PROFILE_AAC_HE,
  AV_PROFILE_AAC_HE_V2,
  AV_PROFILE_AAC_LD,
  AV_PROFILE_AAC_LOW,
  AV_PROFILE_AAC_LTP,
  AV_PROFILE_AAC_MAIN,
  AV_PROFILE_AAC_SSR,
  AV_PROFILE_AAC_USAC,
  AV_PROFILE_AV1_HIGH,
  AV_PROFILE_AV1_MAIN,
  AV_PROFILE_AV1_PROFESSIONAL,
  AV_PROFILE_DNXHD,
  AV_PROFILE_DNXHR_444,
  AV_PROFILE_DNXHR_HQ,
  AV_PROFILE_DNXHR_HQX,
  AV_PROFILE_DNXHR_LB,
  AV_PROFILE_DNXHR_SQ,
  AV_PROFILE_DTS,
  AV_PROFILE_DTS_96_24,
  AV_PROFILE_DTS_ES,
  AV_PROFILE_DTS_EXPRESS,
  AV_PROFILE_DTS_HD_HRA,
  AV_PROFILE_DTS_HD_MA,
  AV_PROFILE_H264_BASELINE,
  AV_PROFILE_H264_CAVLC_444,
  AV_PROFILE_H264_EXTENDED,
  AV_PROFILE_H264_HIGH,
  AV_PROFILE_H264_HIGH_10,
  AV_PROFILE_H264_HIGH_422,
  AV_PROFILE_H264_HIGH_444,
  AV_PROFILE_H264_HIGH_444_PREDICTIVE,
  AV_PROFILE_H264_MAIN,
  AV_PROFILE_H264_MULTIVIEW_HIGH,
  AV_PROFILE_H264_STEREO_HIGH,
  AV_PROFILE_HEVC_MAIN,
  AV_PROFILE_HEVC_MAIN_10,
  AV_PROFILE_HEVC_MAIN_STILL_PICTURE,
  AV_PROFILE_HEVC_REXT,
  AV_PROFILE_JPEG2000_CSTREAM_NO_RESTRICTION,
  AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_0,
  AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_1,
  AV_PROFILE_JPEG2000_DCINEMA_2K,
  AV_PROFILE_JPEG2000_DCINEMA_4K,
  AV_PROFILE_MJPEG_HUFFMAN_BASELINE_DCT,
  AV_PROFILE_MJPEG_HUFFMAN_EXTENDED_SEQUENTIAL_DCT,
  AV_PROFILE_MJPEG_HUFFMAN_LOSSLESS,
  AV_PROFILE_MJPEG_HUFFMAN_PROGRESSIVE_DCT,
  AV_PROFILE_MJPEG_JPEG_LS,
  AV_PROFILE_MPEG2_422,
  AV_PROFILE_MPEG2_AAC_HE,
  AV_PROFILE_MPEG2_AAC_LOW,
  AV_PROFILE_MPEG2_HIGH,
  AV_PROFILE_MPEG2_MAIN,
  AV_PROFILE_MPEG2_SIMPLE,
  AV_PROFILE_MPEG2_SNR_SCALABLE,
  AV_PROFILE_MPEG2_SS,
  AV_PROFILE_MPEG4_ADVANCED_CODING,
  AV_PROFILE_MPEG4_ADVANCED_CORE,
  AV_PROFILE_MPEG4_ADVANCED_REAL_TIME,
  AV_PROFILE_MPEG4_ADVANCED_SCALABLE_TEXTURE,
  AV_PROFILE_MPEG4_ADVANCED_SIMPLE,
  AV_PROFILE_MPEG4_BASIC_ANIMATED_TEXTURE,
  AV_PROFILE_MPEG4_CORE,
  AV_PROFILE_MPEG4_CORE_SCALABLE,
  AV_PROFILE_MPEG4_HYBRID,
  AV_PROFILE_MPEG4_MAIN,
  AV_PROFILE_MPEG4_N_BIT,
  AV_PROFILE_MPEG4_SCALABLE_TEXTURE,
  AV_PROFILE_MPEG4_SIMPLE,
  AV_PROFILE_MPEG4_SIMPLE_FACE_ANIMATION,
  AV_PROFILE_MPEG4_SIMPLE_SCALABLE,
  AV_PROFILE_MPEG4_SIMPLE_STUDIO,
  AV_PROFILE_PRORES_4444,
  AV_PROFILE_PRORES_HQ,
  AV_PROFILE_PRORES_LT,
  AV_PROFILE_PRORES_PROXY,
  AV_PROFILE_PRORES_STANDARD,
  AV_PROFILE_PRORES_XQ,
  AV_PROFILE_RESERVED,
  AV_PROFILE_SBC_MSBC,
  AV_PROFILE_UNKNOWN,
  AV_PROFILE_VC1_ADVANCED,
  AV_PROFILE_VC1_COMPLEX,
  AV_PROFILE_VC1_MAIN,
  AV_PROFILE_VC1_SIMPLE,
  AV_PROFILE_VP9_0,
  AV_PROFILE_VP9_1,
  AV_PROFILE_VP9_2,
  AV_PROFILE_VP9_3,
} from './constants.js';

/**
 * Profile utilities
 */
export class Profile {
  /**
   * Get profile name
   * @param profile Profile value
   * @returns Profile name
   */
  static getName(profile: AVProfile): string {
    switch (profile) {
      case AV_PROFILE_UNKNOWN:
        return 'unknown';
      case AV_PROFILE_RESERVED:
        return 'reserved';

      // H.264/AVC profiles
      case AV_PROFILE_H264_BASELINE:
        return 'H.264 Baseline';
      case AV_PROFILE_H264_MAIN:
        return 'H.264 Main';
      case AV_PROFILE_H264_EXTENDED:
        return 'H.264 Extended';
      case AV_PROFILE_H264_HIGH:
        return 'H.264 High';
      case AV_PROFILE_H264_HIGH_10:
        return 'H.264 High 10';
      case AV_PROFILE_H264_HIGH_422:
        return 'H.264 High 4:2:2';
      case AV_PROFILE_H264_HIGH_444:
        return 'H.264 High 4:4:4';
      case AV_PROFILE_H264_HIGH_444_PREDICTIVE:
        return 'H.264 High 4:4:4 Predictive';
      case AV_PROFILE_H264_CAVLC_444:
        return 'H.264 CAVLC 4:4:4';
      case AV_PROFILE_H264_MULTIVIEW_HIGH:
        return 'H.264 Multiview High';
      case AV_PROFILE_H264_STEREO_HIGH:
        return 'H.264 Stereo High';

      // H.265/HEVC profiles
      case AV_PROFILE_HEVC_MAIN:
        return 'HEVC Main';
      case AV_PROFILE_HEVC_MAIN_10:
        return 'HEVC Main 10';
      case AV_PROFILE_HEVC_MAIN_STILL_PICTURE:
        return 'HEVC Main Still Picture';
      case AV_PROFILE_HEVC_REXT:
        return 'HEVC Range Extensions';

      // AAC profiles
      case AV_PROFILE_AAC_MAIN:
        return 'AAC Main';
      case AV_PROFILE_AAC_LOW:
        return 'AAC-LC';
      case AV_PROFILE_AAC_SSR:
        return 'AAC SSR';
      case AV_PROFILE_AAC_LTP:
        return 'AAC LTP';
      case AV_PROFILE_AAC_HE:
        return 'HE-AAC';
      case AV_PROFILE_AAC_HE_V2:
        return 'HE-AAC v2';
      case AV_PROFILE_AAC_LD:
        return 'AAC-LD';
      case AV_PROFILE_AAC_ELD:
        return 'AAC-ELD';
      case AV_PROFILE_AAC_USAC:
        return 'AAC USAC';
      case AV_PROFILE_MPEG2_AAC_LOW:
        return 'MPEG-2 AAC-LC';
      case AV_PROFILE_MPEG2_AAC_HE:
        return 'MPEG-2 HE-AAC';

      // MPEG-2 profiles
      case AV_PROFILE_MPEG2_422:
        return 'MPEG-2 4:2:2';
      case AV_PROFILE_MPEG2_HIGH:
        return 'MPEG-2 High';
      case AV_PROFILE_MPEG2_SS:
        return 'MPEG-2 Spatially Scalable';
      case AV_PROFILE_MPEG2_SNR_SCALABLE:
        return 'MPEG-2 SNR Scalable';
      case AV_PROFILE_MPEG2_MAIN:
        return 'MPEG-2 Main';
      case AV_PROFILE_MPEG2_SIMPLE:
        return 'MPEG-2 Simple';

      // MPEG-4 profiles
      case AV_PROFILE_MPEG4_SIMPLE:
        return 'MPEG-4 Simple';
      case AV_PROFILE_MPEG4_SIMPLE_SCALABLE:
        return 'MPEG-4 Simple Scalable';
      case AV_PROFILE_MPEG4_CORE:
        return 'MPEG-4 Core';
      case AV_PROFILE_MPEG4_MAIN:
        return 'MPEG-4 Main';
      case AV_PROFILE_MPEG4_N_BIT:
        return 'MPEG-4 N-Bit';
      case AV_PROFILE_MPEG4_SCALABLE_TEXTURE:
        return 'MPEG-4 Scalable Texture';
      case AV_PROFILE_MPEG4_SIMPLE_FACE_ANIMATION:
        return 'MPEG-4 Simple Face Animation';
      case AV_PROFILE_MPEG4_BASIC_ANIMATED_TEXTURE:
        return 'MPEG-4 Basic Animated Texture';
      case AV_PROFILE_MPEG4_HYBRID:
        return 'MPEG-4 Hybrid';
      case AV_PROFILE_MPEG4_ADVANCED_REAL_TIME:
        return 'MPEG-4 Advanced Real Time';
      case AV_PROFILE_MPEG4_CORE_SCALABLE:
        return 'MPEG-4 Core Scalable';
      case AV_PROFILE_MPEG4_ADVANCED_CODING:
        return 'MPEG-4 Advanced Coding';
      case AV_PROFILE_MPEG4_ADVANCED_CORE:
        return 'MPEG-4 Advanced Core';
      case AV_PROFILE_MPEG4_ADVANCED_SCALABLE_TEXTURE:
        return 'MPEG-4 Advanced Scalable Texture';
      case AV_PROFILE_MPEG4_SIMPLE_STUDIO:
        return 'MPEG-4 Simple Studio';
      case AV_PROFILE_MPEG4_ADVANCED_SIMPLE:
        return 'MPEG-4 Advanced Simple';

      // VP9 profiles
      case AV_PROFILE_VP9_0:
        return 'VP9 Profile 0';
      case AV_PROFILE_VP9_1:
        return 'VP9 Profile 1';
      case AV_PROFILE_VP9_2:
        return 'VP9 Profile 2';
      case AV_PROFILE_VP9_3:
        return 'VP9 Profile 3';

      // AV1 profiles
      case AV_PROFILE_AV1_MAIN:
        return 'AV1 Main';
      case AV_PROFILE_AV1_HIGH:
        return 'AV1 High';
      case AV_PROFILE_AV1_PROFESSIONAL:
        return 'AV1 Professional';

      // DNxHD/DNxHR profiles
      case AV_PROFILE_DNXHD:
        return 'DNxHD';
      case AV_PROFILE_DNXHR_LB:
        return 'DNxHR LB';
      case AV_PROFILE_DNXHR_SQ:
        return 'DNxHR SQ';
      case AV_PROFILE_DNXHR_HQ:
        return 'DNxHR HQ';
      case AV_PROFILE_DNXHR_HQX:
        return 'DNxHR HQX';
      case AV_PROFILE_DNXHR_444:
        return 'DNxHR 4:4:4';

      // DTS profiles
      case AV_PROFILE_DTS:
        return 'DTS';
      case AV_PROFILE_DTS_ES:
        return 'DTS-ES';
      case AV_PROFILE_DTS_96_24:
        return 'DTS 96/24';
      case AV_PROFILE_DTS_HD_HRA:
        return 'DTS-HD HRA';
      case AV_PROFILE_DTS_HD_MA:
        return 'DTS-HD MA';
      case AV_PROFILE_DTS_EXPRESS:
        return 'DTS Express';

      // ProRes profiles
      case AV_PROFILE_PRORES_PROXY:
        return 'ProRes Proxy';
      case AV_PROFILE_PRORES_LT:
        return 'ProRes LT';
      case AV_PROFILE_PRORES_STANDARD:
        return 'ProRes Standard';
      case AV_PROFILE_PRORES_HQ:
        return 'ProRes HQ';
      case AV_PROFILE_PRORES_4444:
        return 'ProRes 4444';
      case AV_PROFILE_PRORES_XQ:
        return 'ProRes XQ';

      // JPEG2000 profiles
      case AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_0:
        return 'JPEG 2000 Codestream Restriction 0';
      case AV_PROFILE_JPEG2000_CSTREAM_RESTRICTION_1:
        return 'JPEG 2000 Codestream Restriction 1';
      case AV_PROFILE_JPEG2000_CSTREAM_NO_RESTRICTION:
        return 'JPEG 2000 Codestream No Restriction';
      case AV_PROFILE_JPEG2000_DCINEMA_2K:
        return 'JPEG 2000 Digital Cinema 2K';
      case AV_PROFILE_JPEG2000_DCINEMA_4K:
        return 'JPEG 2000 Digital Cinema 4K';

      // MJPEG profiles
      case AV_PROFILE_MJPEG_HUFFMAN_BASELINE_DCT:
        return 'MJPEG Huffman Baseline DCT';
      case AV_PROFILE_MJPEG_HUFFMAN_EXTENDED_SEQUENTIAL_DCT:
        return 'MJPEG Huffman Extended Sequential DCT';
      case AV_PROFILE_MJPEG_HUFFMAN_PROGRESSIVE_DCT:
        return 'MJPEG Huffman Progressive DCT';
      case AV_PROFILE_MJPEG_HUFFMAN_LOSSLESS:
        return 'MJPEG Huffman Lossless';
      case AV_PROFILE_MJPEG_JPEG_LS:
        return 'MJPEG JPEG-LS';

      // VC-1 profiles
      case AV_PROFILE_VC1_SIMPLE:
        return 'VC-1 Simple';
      case AV_PROFILE_VC1_MAIN:
        return 'VC-1 Main';
      case AV_PROFILE_VC1_COMPLEX:
        return 'VC-1 Complex';
      case AV_PROFILE_VC1_ADVANCED:
        return 'VC-1 Advanced';

      // SBC profiles
      case AV_PROFILE_SBC_MSBC:
        return 'SBC mSBC';

      default:
        return `Profile ${profile}`;
    }
  }

  /**
   * Get short profile name (for command line use)
   * @param profile Profile value
   * @returns Short profile name
   */
  static getShortName(profile: AVProfile): string {
    switch (profile) {
      case AV_PROFILE_UNKNOWN:
        return 'unknown';
      case AV_PROFILE_RESERVED:
        return 'reserved';

      // H.264/AVC profiles
      case AV_PROFILE_H264_BASELINE:
        return 'baseline';
      case AV_PROFILE_H264_MAIN:
        return 'main';
      case AV_PROFILE_H264_EXTENDED:
        return 'extended';
      case AV_PROFILE_H264_HIGH:
        return 'high';
      case AV_PROFILE_H264_HIGH_10:
        return 'high10';
      case AV_PROFILE_H264_HIGH_422:
        return 'high422';
      case AV_PROFILE_H264_HIGH_444:
        return 'high444';
      case AV_PROFILE_H264_HIGH_444_PREDICTIVE:
        return 'high444p';
      case AV_PROFILE_H264_CAVLC_444:
        return 'cavlc444';
      case AV_PROFILE_H264_MULTIVIEW_HIGH:
        return 'multiview_high';
      case AV_PROFILE_H264_STEREO_HIGH:
        return 'stereo_high';

      // H.265/HEVC profiles
      case AV_PROFILE_HEVC_MAIN:
        return 'main';
      case AV_PROFILE_HEVC_MAIN_10:
        return 'main10';
      case AV_PROFILE_HEVC_MAIN_STILL_PICTURE:
        return 'main_still_picture';
      case AV_PROFILE_HEVC_REXT:
        return 'rext';

      // AAC profiles
      case AV_PROFILE_AAC_MAIN:
        return 'aac_main';
      case AV_PROFILE_AAC_LOW:
        return 'aac_low';
      case AV_PROFILE_AAC_SSR:
        return 'aac_ssr';
      case AV_PROFILE_AAC_LTP:
        return 'aac_ltp';
      case AV_PROFILE_AAC_HE:
        return 'aac_he';
      case AV_PROFILE_AAC_HE_V2:
        return 'aac_he_v2';
      case AV_PROFILE_AAC_LD:
        return 'aac_ld';
      case AV_PROFILE_AAC_ELD:
        return 'aac_eld';
      case AV_PROFILE_AAC_USAC:
        return 'aac_usac';

      // MPEG-2 profiles
      case AV_PROFILE_MPEG2_422:
        return 'mpeg2_422';
      case AV_PROFILE_MPEG2_HIGH:
        return 'high';
      case AV_PROFILE_MPEG2_SS:
        return 'ss';
      case AV_PROFILE_MPEG2_SNR_SCALABLE:
        return 'snr_scalable';
      case AV_PROFILE_MPEG2_MAIN:
        return 'main';
      case AV_PROFILE_MPEG2_SIMPLE:
        return 'simple';

      // VP9 profiles
      case AV_PROFILE_VP9_0:
        return 'profile0';
      case AV_PROFILE_VP9_1:
        return 'profile1';
      case AV_PROFILE_VP9_2:
        return 'profile2';
      case AV_PROFILE_VP9_3:
        return 'profile3';

      // AV1 profiles
      case AV_PROFILE_AV1_MAIN:
        return 'main';
      case AV_PROFILE_AV1_HIGH:
        return 'high';
      case AV_PROFILE_AV1_PROFESSIONAL:
        return 'professional';

      // ProRes profiles
      case AV_PROFILE_PRORES_PROXY:
        return 'proxy';
      case AV_PROFILE_PRORES_LT:
        return 'lt';
      case AV_PROFILE_PRORES_STANDARD:
        return 'standard';
      case AV_PROFILE_PRORES_HQ:
        return 'hq';
      case AV_PROFILE_PRORES_4444:
        return '4444';
      case AV_PROFILE_PRORES_XQ:
        return 'xq';

      // DNxHD/DNxHR profiles
      case AV_PROFILE_DNXHD:
        return 'dnxhd';
      case AV_PROFILE_DNXHR_LB:
        return 'dnxhr_lb';
      case AV_PROFILE_DNXHR_SQ:
        return 'dnxhr_sq';
      case AV_PROFILE_DNXHR_HQ:
        return 'dnxhr_hq';
      case AV_PROFILE_DNXHR_HQX:
        return 'dnxhr_hqx';
      case AV_PROFILE_DNXHR_444:
        return 'dnxhr_444';

      // VC-1 profiles
      case AV_PROFILE_VC1_SIMPLE:
        return 'simple';
      case AV_PROFILE_VC1_MAIN:
        return 'main';
      case AV_PROFILE_VC1_COMPLEX:
        return 'complex';
      case AV_PROFILE_VC1_ADVANCED:
        return 'advanced';

      default:
        // For other profiles, try to generate a short name
        if (profile === AV_PROFILE_DTS) return 'dts';
        if (profile === AV_PROFILE_DTS_ES) return 'dts_es';
        if (profile === AV_PROFILE_DTS_96_24) return 'dts_96_24';
        if (profile === AV_PROFILE_DTS_HD_HRA) return 'dts_hd_hra';
        if (profile === AV_PROFILE_DTS_HD_MA) return 'dts_hd_ma';
        if (profile === AV_PROFILE_DTS_EXPRESS) return 'dts_express';
        return profile.toString();
    }
  }

  /**
   * Check if profile is unknown
   * @param profile Profile value
   * @returns True if unknown
   */
  static isUnknown(profile: AVProfile): boolean {
    return profile === AV_PROFILE_UNKNOWN;
  }

  /**
   * Check if profile supports 10-bit color
   * @param profile Profile value
   * @returns True if 10-bit capable
   */
  static supports10Bit(profile: AVProfile): boolean {
    return (
      profile === AV_PROFILE_H264_HIGH_10 ||
      profile === AV_PROFILE_HEVC_MAIN_10 ||
      profile === AV_PROFILE_VP9_2 ||
      profile === AV_PROFILE_VP9_3 ||
      profile === AV_PROFILE_AV1_HIGH ||
      profile === AV_PROFILE_AV1_PROFESSIONAL ||
      profile === AV_PROFILE_DNXHR_HQX ||
      profile === AV_PROFILE_DNXHR_444 ||
      profile === AV_PROFILE_PRORES_4444 ||
      profile === AV_PROFILE_PRORES_XQ
    );
  }

  /**
   * Check if profile supports 4:2:2 chroma
   * @param profile Profile value
   * @returns True if 4:2:2 capable
   */
  static supports422Chroma(profile: AVProfile): boolean {
    return (
      profile === AV_PROFILE_H264_HIGH_422 ||
      profile === AV_PROFILE_H264_HIGH_444 ||
      profile === AV_PROFILE_H264_HIGH_444_PREDICTIVE ||
      profile === AV_PROFILE_MPEG2_422 ||
      profile === AV_PROFILE_DNXHD ||
      profile === AV_PROFILE_DNXHR_SQ ||
      profile === AV_PROFILE_DNXHR_HQ ||
      profile === AV_PROFILE_DNXHR_HQX ||
      profile === AV_PROFILE_PRORES_STANDARD ||
      profile === AV_PROFILE_PRORES_HQ ||
      profile === AV_PROFILE_PRORES_LT ||
      profile === AV_PROFILE_PRORES_PROXY
    );
  }

  /**
   * Check if profile supports 4:4:4 chroma
   * @param profile Profile value
   * @returns True if 4:4:4 capable
   */
  static supports444Chroma(profile: AVProfile): boolean {
    return (
      profile === AV_PROFILE_H264_HIGH_444 ||
      profile === AV_PROFILE_H264_HIGH_444_PREDICTIVE ||
      profile === AV_PROFILE_H264_CAVLC_444 ||
      profile === AV_PROFILE_HEVC_REXT ||
      profile === AV_PROFILE_DNXHR_444 ||
      profile === AV_PROFILE_PRORES_4444 ||
      profile === AV_PROFILE_PRORES_XQ ||
      profile === AV_PROFILE_VP9_1 ||
      profile === AV_PROFILE_VP9_3
    );
  }

  /**
   * Parse profile from string (for command line compatibility)
   * @param str Profile string
   * @param codecType Optional codec type hint
   * @returns Profile value or unknown
   */
  static fromString(str: string, codecType?: string): AVProfile {
    const lower = str.toLowerCase();

    // Check for explicit codec-specific profiles
    if (codecType === 'h264' || lower.includes('h264') || lower.includes('h.264')) {
      if (lower === 'baseline') return AV_PROFILE_H264_BASELINE;
      if (lower === 'main') return AV_PROFILE_H264_MAIN;
      if (lower === 'high') return AV_PROFILE_H264_HIGH;
      if (lower === 'high10') return AV_PROFILE_H264_HIGH_10;
      if (lower === 'high422') return AV_PROFILE_H264_HIGH_422;
      if (lower === 'high444') return AV_PROFILE_H264_HIGH_444;
    }

    if (codecType === 'hevc' || lower.includes('hevc') || lower.includes('h265') || lower.includes('h.265')) {
      if (lower === 'main') return AV_PROFILE_HEVC_MAIN;
      if (lower === 'main10') return AV_PROFILE_HEVC_MAIN_10;
    }

    if (codecType === 'vp9' || lower.includes('vp9')) {
      if (lower === 'profile0' || lower === '0') return AV_PROFILE_VP9_0;
      if (lower === 'profile1' || lower === '1') return AV_PROFILE_VP9_1;
      if (lower === 'profile2' || lower === '2') return AV_PROFILE_VP9_2;
      if (lower === 'profile3' || lower === '3') return AV_PROFILE_VP9_3;
    }

    if (codecType === 'av1' || lower.includes('av1')) {
      if (lower === 'main') return AV_PROFILE_AV1_MAIN;
      if (lower === 'high') return AV_PROFILE_AV1_HIGH;
      if (lower === 'professional') return AV_PROFILE_AV1_PROFESSIONAL;
    }

    if (codecType === 'prores' || lower.includes('prores')) {
      if (lower.includes('proxy')) return AV_PROFILE_PRORES_PROXY;
      if (lower.includes('lt')) return AV_PROFILE_PRORES_LT;
      if (lower.includes('standard')) return AV_PROFILE_PRORES_STANDARD;
      if (lower.includes('hq') && !lower.includes('xq')) return AV_PROFILE_PRORES_HQ;
      if (lower.includes('4444')) return AV_PROFILE_PRORES_4444;
      if (lower.includes('xq')) return AV_PROFILE_PRORES_XQ;
    }

    // Try to parse as number
    const num = parseInt(str, 10);
    if (!isNaN(num)) {
      return num as AVProfile;
    }

    return AV_PROFILE_UNKNOWN;
  }
}
