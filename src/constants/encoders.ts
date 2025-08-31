/**
 * Auto-generated FFmpeg encoder constants
 * Generated from FFmpeg source code (allcodecs.c)
 * DO NOT EDIT MANUALLY
 */

// Brand symbol for type safety
const __encoder_brand = Symbol('__encoder_brand');

// Encoder name types
export type EncoderName = string & { readonly [__encoder_brand]: 'EncoderName' };
export type VideoEncoderName = EncoderName & { readonly __type: 'video' };
export type AudioEncoderName = EncoderName & { readonly __type: 'audio' };
export type SubtitleEncoderName = EncoderName & { readonly __type: 'subtitle' };

// ============================================================================
// VIDEO ENCODERS (124 software, 42 hardware)
// ============================================================================

// Software video encoders
export const ENCODER_A64MULTI = 'a64multi' as VideoEncoderName;
export const ENCODER_A64MULTI5 = 'a64multi5' as VideoEncoderName;
export const ENCODER_ALIAS_PIX = 'alias-pix' as VideoEncoderName;
export const ENCODER_AMV = 'amv' as VideoEncoderName;
export const ENCODER_ANULL = 'anull' as VideoEncoderName;
export const ENCODER_APNG = 'apng' as VideoEncoderName;
export const ENCODER_ASV1 = 'asv1' as VideoEncoderName;
export const ENCODER_ASV2 = 'asv2' as VideoEncoderName;
export const ENCODER_AVRP = 'avrp' as VideoEncoderName;
export const ENCODER_AVUI = 'avui' as VideoEncoderName;
export const ENCODER_BITPACKED = 'bitpacked' as VideoEncoderName;
export const ENCODER_BMP = 'bmp' as VideoEncoderName;
export const ENCODER_CFHD = 'cfhd' as VideoEncoderName;
export const ENCODER_CINEPAK = 'cinepak' as VideoEncoderName;
export const ENCODER_CLJR = 'cljr' as VideoEncoderName;
export const ENCODER_DNXHD = 'dnxhd' as VideoEncoderName;
export const ENCODER_DPX = 'dpx' as VideoEncoderName;
export const ENCODER_DVVIDEO = 'dvvideo' as VideoEncoderName;
export const ENCODER_DXV = 'dxv' as VideoEncoderName;
export const ENCODER_EXR = 'exr' as VideoEncoderName;
export const ENCODER_FFV1 = 'ffv1' as VideoEncoderName;
export const ENCODER_FFVHUFF = 'ffvhuff' as VideoEncoderName;
export const ENCODER_FITS = 'fits' as VideoEncoderName;
export const ENCODER_FLASHSV = 'flashsv' as VideoEncoderName;
export const ENCODER_FLASHSV2 = 'flashsv2' as VideoEncoderName;
export const ENCODER_FLV = 'flv' as VideoEncoderName;
export const ENCODER_GIF = 'gif' as VideoEncoderName;
export const ENCODER_H261 = 'h261' as VideoEncoderName;
export const ENCODER_H263 = 'h263' as VideoEncoderName;
export const ENCODER_H263P = 'h263p' as VideoEncoderName;
export const ENCODER_H264_VULKAN = 'h264-vulkan' as VideoEncoderName;
export const ENCODER_HAP = 'hap' as VideoEncoderName;
export const ENCODER_HDR = 'hdr' as VideoEncoderName;
export const ENCODER_HEVC_VULKAN = 'hevc-vulkan' as VideoEncoderName;
export const ENCODER_HUFFYUV = 'huffyuv' as VideoEncoderName;
export const ENCODER_JPEG2000 = 'jpeg2000' as VideoEncoderName;
export const ENCODER_JPEGLS = 'jpegls' as VideoEncoderName;
export const ENCODER_LIBCODEC2 = 'libcodec2' as VideoEncoderName;
export const ENCODER_LIBGSM = 'libgsm' as VideoEncoderName;
export const ENCODER_LIBGSM_MS = 'libgsm-ms' as VideoEncoderName;
export const ENCODER_LIBILBC = 'libilbc' as VideoEncoderName;
export const ENCODER_LIBJXL = 'libjxl' as VideoEncoderName;
export const ENCODER_LIBKVAZAAR = 'libkvazaar' as VideoEncoderName;
export const ENCODER_LIBLC3 = 'liblc3' as VideoEncoderName;
export const ENCODER_LIBOPENCORE_AMRNB = 'libopencore-amrnb' as VideoEncoderName;
export const ENCODER_LIBOPENH264 = 'libopenh264' as VideoEncoderName;
export const ENCODER_LIBOPENJPEG = 'libopenjpeg' as VideoEncoderName;
export const ENCODER_LIBRAV1E = 'librav1e' as VideoEncoderName;
export const ENCODER_LIBSHINE = 'libshine' as VideoEncoderName;
export const ENCODER_LIBSVTAV1 = 'libsvtav1' as VideoEncoderName;
export const ENCODER_LIBTHEORA = 'libtheora' as VideoEncoderName;
export const ENCODER_LIBTWOLAME = 'libtwolame' as VideoEncoderName;
export const ENCODER_LIBVO_AMRWBENC = 'libvo-amrwbenc' as VideoEncoderName;
export const ENCODER_LIBVPX_VP8 = 'libvpx-vp8' as VideoEncoderName;
export const ENCODER_LIBVVENC = 'libvvenc' as VideoEncoderName;
export const ENCODER_LIBWEBP = 'libwebp' as VideoEncoderName;
export const ENCODER_LIBWEBP_ANIM = 'libwebp-anim' as VideoEncoderName;
export const ENCODER_LIBX262 = 'libx262' as VideoEncoderName;
export const ENCODER_LIBX264 = 'libx264' as VideoEncoderName;
export const ENCODER_LIBX264RGB = 'libx264rgb' as VideoEncoderName;
export const ENCODER_LIBXAVS = 'libxavs' as VideoEncoderName;
export const ENCODER_LIBXAVS2 = 'libxavs2' as VideoEncoderName;
export const ENCODER_LIBXEVE = 'libxeve' as VideoEncoderName;
export const ENCODER_LIBXVID = 'libxvid' as VideoEncoderName;
export const ENCODER_LJPEG = 'ljpeg' as VideoEncoderName;
export const ENCODER_MAGICYUV = 'magicyuv' as VideoEncoderName;
export const ENCODER_MJPEG = 'mjpeg' as VideoEncoderName;
export const ENCODER_MOVTEXT = 'movtext' as VideoEncoderName;
export const ENCODER_MPEG1VIDEO = 'mpeg1video' as VideoEncoderName;
export const ENCODER_MPEG2VIDEO = 'mpeg2video' as VideoEncoderName;
export const ENCODER_MPEG4 = 'mpeg4' as VideoEncoderName;
export const ENCODER_MSMPEG4V2 = 'msmpeg4v2' as VideoEncoderName;
export const ENCODER_MSMPEG4V3 = 'msmpeg4v3' as VideoEncoderName;
export const ENCODER_MSRLE = 'msrle' as VideoEncoderName;
export const ENCODER_MSVIDEO1 = 'msvideo1' as VideoEncoderName;
export const ENCODER_PAM = 'pam' as VideoEncoderName;
export const ENCODER_PBM = 'pbm' as VideoEncoderName;
export const ENCODER_PCX = 'pcx' as VideoEncoderName;
export const ENCODER_PFM = 'pfm' as VideoEncoderName;
export const ENCODER_PGM = 'pgm' as VideoEncoderName;
export const ENCODER_PGMYUV = 'pgmyuv' as VideoEncoderName;
export const ENCODER_PHM = 'phm' as VideoEncoderName;
export const ENCODER_PNG = 'png' as VideoEncoderName;
export const ENCODER_PPM = 'ppm' as VideoEncoderName;
export const ENCODER_PRORES = 'prores' as VideoEncoderName;
export const ENCODER_PRORES_AW = 'prores-aw' as VideoEncoderName;
export const ENCODER_PRORES_KS = 'prores-ks' as VideoEncoderName;
export const ENCODER_QOI = 'qoi' as VideoEncoderName;
export const ENCODER_QTRLE = 'qtrle' as VideoEncoderName;
export const ENCODER_R10K = 'r10k' as VideoEncoderName;
export const ENCODER_R210 = 'r210' as VideoEncoderName;
export const ENCODER_RA_144 = 'ra-144' as VideoEncoderName;
export const ENCODER_RAWVIDEO = 'rawvideo' as VideoEncoderName;
export const ENCODER_ROQ = 'roq' as VideoEncoderName;
export const ENCODER_RPZA = 'rpza' as VideoEncoderName;
export const ENCODER_RV10 = 'rv10' as VideoEncoderName;
export const ENCODER_RV20 = 'rv20' as VideoEncoderName;
export const ENCODER_SGI = 'sgi' as VideoEncoderName;
export const ENCODER_SMC = 'smc' as VideoEncoderName;
export const ENCODER_SNOW = 'snow' as VideoEncoderName;
export const ENCODER_SPEEDHQ = 'speedhq' as VideoEncoderName;
export const ENCODER_SUNRAST = 'sunrast' as VideoEncoderName;
export const ENCODER_SVQ1 = 'svq1' as VideoEncoderName;
export const ENCODER_TARGA = 'targa' as VideoEncoderName;
export const ENCODER_TIFF = 'tiff' as VideoEncoderName;
export const ENCODER_UTVIDEO = 'utvideo' as VideoEncoderName;
export const ENCODER_V210 = 'v210' as VideoEncoderName;
export const ENCODER_V308 = 'v308' as VideoEncoderName;
export const ENCODER_V408 = 'v408' as VideoEncoderName;
export const ENCODER_V410 = 'v410' as VideoEncoderName;
export const ENCODER_VBN = 'vbn' as VideoEncoderName;
export const ENCODER_VC2 = 'vc2' as VideoEncoderName;
export const ENCODER_VNULL = 'vnull' as VideoEncoderName;
export const ENCODER_WBMP = 'wbmp' as VideoEncoderName;
export const ENCODER_WMV1 = 'wmv1' as VideoEncoderName;
export const ENCODER_WMV2 = 'wmv2' as VideoEncoderName;
export const ENCODER_WRAPPED_AVFRAME = 'wrapped-avframe' as VideoEncoderName;
export const ENCODER_XBM = 'xbm' as VideoEncoderName;
export const ENCODER_XFACE = 'xface' as VideoEncoderName;
export const ENCODER_XWD = 'xwd' as VideoEncoderName;
export const ENCODER_Y41P = 'y41p' as VideoEncoderName;
export const ENCODER_YUV4 = 'yuv4' as VideoEncoderName;
export const ENCODER_ZLIB = 'zlib' as VideoEncoderName;
export const ENCODER_ZMBV = 'zmbv' as VideoEncoderName;

// Hardware video encoders

// AMD AMF
export const ENCODER_AV1_AMF = 'av1-amf' as VideoEncoderName;
export const ENCODER_H264_AMF = 'h264-amf' as VideoEncoderName;
export const ENCODER_HEVC_AMF = 'hevc-amf' as VideoEncoderName;

// Android MediaCodec
export const ENCODER_AV1_MEDIACODEC = 'av1-mediacodec' as VideoEncoderName;
export const ENCODER_H264_MEDIACODEC = 'h264-mediacodec' as VideoEncoderName;
export const ENCODER_HEVC_MEDIACODEC = 'hevc-mediacodec' as VideoEncoderName;
export const ENCODER_MPEG4_MEDIACODEC = 'mpeg4-mediacodec' as VideoEncoderName;
export const ENCODER_VP8_MEDIACODEC = 'vp8-mediacodec' as VideoEncoderName;
export const ENCODER_VP9_MEDIACODEC = 'vp9-mediacodec' as VideoEncoderName;

// NVIDIA NVENC
export const ENCODER_AV1_NVENC = 'av1-nvenc' as VideoEncoderName;
export const ENCODER_H264_NVENC = 'h264-nvenc' as VideoEncoderName;
export const ENCODER_HEVC_NVENC = 'hevc-nvenc' as VideoEncoderName;

// Intel Quick Sync
export const ENCODER_AV1_QSV = 'av1-qsv' as VideoEncoderName;
export const ENCODER_H264_QSV = 'h264-qsv' as VideoEncoderName;
export const ENCODER_HEVC_QSV = 'hevc-qsv' as VideoEncoderName;
export const ENCODER_MJPEG_QSV = 'mjpeg-qsv' as VideoEncoderName;
export const ENCODER_MPEG2_QSV = 'mpeg2-qsv' as VideoEncoderName;
export const ENCODER_VP9_QSV = 'vp9-qsv' as VideoEncoderName;

// VA-API
export const ENCODER_AV1_VAAPI = 'av1-vaapi' as VideoEncoderName;
export const ENCODER_H264_VAAPI = 'h264-vaapi' as VideoEncoderName;
export const ENCODER_HEVC_VAAPI = 'hevc-vaapi' as VideoEncoderName;
export const ENCODER_MJPEG_VAAPI = 'mjpeg-vaapi' as VideoEncoderName;
export const ENCODER_MPEG2_VAAPI = 'mpeg2-vaapi' as VideoEncoderName;
export const ENCODER_VP8_VAAPI = 'vp8-vaapi' as VideoEncoderName;
export const ENCODER_VP9_VAAPI = 'vp9-vaapi' as VideoEncoderName;

// V4L2 M2M
export const ENCODER_H263_V4L2M2M = 'h263-v4l2m2m' as VideoEncoderName;
export const ENCODER_H264_V4L2M2M = 'h264-v4l2m2m' as VideoEncoderName;
export const ENCODER_HEVC_V4L2M2M = 'hevc-v4l2m2m' as VideoEncoderName;
export const ENCODER_MPEG4_V4L2M2M = 'mpeg4-v4l2m2m' as VideoEncoderName;
export const ENCODER_VP8_V4L2M2M = 'vp8-v4l2m2m' as VideoEncoderName;

// Media Foundation
export const ENCODER_H264_MF = 'h264-mf' as VideoEncoderName;
export const ENCODER_HEVC_MF = 'hevc-mf' as VideoEncoderName;

// OpenMAX
export const ENCODER_H264_OMX = 'h264-omx' as VideoEncoderName;
export const ENCODER_MPEG4_OMX = 'mpeg4-omx' as VideoEncoderName;

// Rockchip MPP
export const ENCODER_H264_RKMPP = 'h264-rkmpp' as VideoEncoderName;
export const ENCODER_HEVC_RKMPP = 'hevc-rkmpp' as VideoEncoderName;
export const ENCODER_MJPEG_RKMPP = 'mjpeg-rkmpp' as VideoEncoderName;

// VideoToolbox (macOS)
export const ENCODER_H264_VIDEOTOOLBOX = 'h264-videotoolbox' as VideoEncoderName;
export const ENCODER_HEVC_VIDEOTOOLBOX = 'hevc-videotoolbox' as VideoEncoderName;
export const ENCODER_MJPEG_VIDEOTOOLBOX = 'mjpeg-videotoolbox' as VideoEncoderName;
export const ENCODER_PRORES_VIDEOTOOLBOX = 'prores-videotoolbox' as VideoEncoderName;

// Direct3D 12
export const ENCODER_HEVC_D3D12VA = 'hevc-d3d12va' as VideoEncoderName;

// ============================================================================
// AUDIO ENCODERS (79 software, 8 hardware)
// ============================================================================

// Software audio encoders
export const ENCODER_AAC = 'aac' as AudioEncoderName;
export const ENCODER_AC3 = 'ac3' as AudioEncoderName;
export const ENCODER_AC3_FIXED = 'ac3-fixed' as AudioEncoderName;
export const ENCODER_ADPCM_ADX = 'adpcm-adx' as AudioEncoderName;
export const ENCODER_ADPCM_ARGO = 'adpcm-argo' as AudioEncoderName;
export const ENCODER_ADPCM_G722 = 'adpcm-g722' as AudioEncoderName;
export const ENCODER_ADPCM_G726 = 'adpcm-g726' as AudioEncoderName;
export const ENCODER_ADPCM_G726LE = 'adpcm-g726le' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_ALP = 'adpcm-ima-alp' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_AMV = 'adpcm-ima-amv' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_APM = 'adpcm-ima-apm' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_QT = 'adpcm-ima-qt' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_SSI = 'adpcm-ima-ssi' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_WAV = 'adpcm-ima-wav' as AudioEncoderName;
export const ENCODER_ADPCM_IMA_WS = 'adpcm-ima-ws' as AudioEncoderName;
export const ENCODER_ADPCM_MS = 'adpcm-ms' as AudioEncoderName;
export const ENCODER_ADPCM_SWF = 'adpcm-swf' as AudioEncoderName;
export const ENCODER_ADPCM_YAMAHA = 'adpcm-yamaha' as AudioEncoderName;
export const ENCODER_ALAC = 'alac' as AudioEncoderName;
export const ENCODER_APTX = 'aptx' as AudioEncoderName;
export const ENCODER_APTX_HD = 'aptx-hd' as AudioEncoderName;
export const ENCODER_COMFORTNOISE = 'comfortnoise' as AudioEncoderName;
export const ENCODER_DCA = 'dca' as AudioEncoderName;
export const ENCODER_DFPWM = 'dfpwm' as AudioEncoderName;
export const ENCODER_EAC3 = 'eac3' as AudioEncoderName;
export const ENCODER_FLAC = 'flac' as AudioEncoderName;
export const ENCODER_G723_1 = 'g723-1' as AudioEncoderName;
export const ENCODER_LIBFDK_AAC = 'libfdk-aac' as AudioEncoderName;
export const ENCODER_LIBMP3LAME = 'libmp3lame' as AudioEncoderName;
export const ENCODER_LIBOPUS = 'libopus' as AudioEncoderName;
export const ENCODER_LIBSPEEX = 'libspeex' as AudioEncoderName;
export const ENCODER_LIBVORBIS = 'libvorbis' as AudioEncoderName;
export const ENCODER_MLP = 'mlp' as AudioEncoderName;
export const ENCODER_MP2 = 'mp2' as AudioEncoderName;
export const ENCODER_MP2FIXED = 'mp2fixed' as AudioEncoderName;
export const ENCODER_NELLYMOSER = 'nellymoser' as AudioEncoderName;
export const ENCODER_OPUS = 'opus' as AudioEncoderName;
export const ENCODER_PCM_ALAW = 'pcm-alaw' as AudioEncoderName;
export const ENCODER_PCM_BLURAY = 'pcm-bluray' as AudioEncoderName;
export const ENCODER_PCM_DVD = 'pcm-dvd' as AudioEncoderName;
export const ENCODER_PCM_F32BE = 'pcm-f32be' as AudioEncoderName;
export const ENCODER_PCM_F32LE = 'pcm-f32le' as AudioEncoderName;
export const ENCODER_PCM_F64BE = 'pcm-f64be' as AudioEncoderName;
export const ENCODER_PCM_F64LE = 'pcm-f64le' as AudioEncoderName;
export const ENCODER_PCM_MULAW = 'pcm-mulaw' as AudioEncoderName;
export const ENCODER_PCM_S16BE = 'pcm-s16be' as AudioEncoderName;
export const ENCODER_PCM_S16BE_PLANAR = 'pcm-s16be-planar' as AudioEncoderName;
export const ENCODER_PCM_S16LE = 'pcm-s16le' as AudioEncoderName;
export const ENCODER_PCM_S16LE_PLANAR = 'pcm-s16le-planar' as AudioEncoderName;
export const ENCODER_PCM_S24BE = 'pcm-s24be' as AudioEncoderName;
export const ENCODER_PCM_S24DAUD = 'pcm-s24daud' as AudioEncoderName;
export const ENCODER_PCM_S24LE = 'pcm-s24le' as AudioEncoderName;
export const ENCODER_PCM_S24LE_PLANAR = 'pcm-s24le-planar' as AudioEncoderName;
export const ENCODER_PCM_S32BE = 'pcm-s32be' as AudioEncoderName;
export const ENCODER_PCM_S32LE = 'pcm-s32le' as AudioEncoderName;
export const ENCODER_PCM_S32LE_PLANAR = 'pcm-s32le-planar' as AudioEncoderName;
export const ENCODER_PCM_S64BE = 'pcm-s64be' as AudioEncoderName;
export const ENCODER_PCM_S64LE = 'pcm-s64le' as AudioEncoderName;
export const ENCODER_PCM_S8 = 'pcm-s8' as AudioEncoderName;
export const ENCODER_PCM_S8_PLANAR = 'pcm-s8-planar' as AudioEncoderName;
export const ENCODER_PCM_U16BE = 'pcm-u16be' as AudioEncoderName;
export const ENCODER_PCM_U16LE = 'pcm-u16le' as AudioEncoderName;
export const ENCODER_PCM_U24BE = 'pcm-u24be' as AudioEncoderName;
export const ENCODER_PCM_U24LE = 'pcm-u24le' as AudioEncoderName;
export const ENCODER_PCM_U32BE = 'pcm-u32be' as AudioEncoderName;
export const ENCODER_PCM_U32LE = 'pcm-u32le' as AudioEncoderName;
export const ENCODER_PCM_U8 = 'pcm-u8' as AudioEncoderName;
export const ENCODER_PCM_VIDC = 'pcm-vidc' as AudioEncoderName;
export const ENCODER_ROQ_DPCM = 'roq-dpcm' as AudioEncoderName;
export const ENCODER_S302M = 's302m' as AudioEncoderName;
export const ENCODER_SBC = 'sbc' as AudioEncoderName;
export const ENCODER_SONIC = 'sonic' as AudioEncoderName;
export const ENCODER_SONIC_LS = 'sonic-ls' as AudioEncoderName;
export const ENCODER_TRUEHD = 'truehd' as AudioEncoderName;
export const ENCODER_TTA = 'tta' as AudioEncoderName;
export const ENCODER_VORBIS = 'vorbis' as AudioEncoderName;
export const ENCODER_WAVPACK = 'wavpack' as AudioEncoderName;
export const ENCODER_WMAV1 = 'wmav1' as AudioEncoderName;
export const ENCODER_WMAV2 = 'wmav2' as AudioEncoderName;

// Hardware audio encoders
export const ENCODER_AAC_AT = 'aac-at' as AudioEncoderName;
export const ENCODER_AAC_MF = 'aac-mf' as AudioEncoderName;
export const ENCODER_AC3_MF = 'ac3-mf' as AudioEncoderName;
export const ENCODER_ALAC_AT = 'alac-at' as AudioEncoderName;
export const ENCODER_ILBC_AT = 'ilbc-at' as AudioEncoderName;
export const ENCODER_MP3_MF = 'mp3-mf' as AudioEncoderName;
export const ENCODER_PCM_ALAW_AT = 'pcm-alaw-at' as AudioEncoderName;
export const ENCODER_PCM_MULAW_AT = 'pcm-mulaw-at' as AudioEncoderName;

// ============================================================================
// SUBTITLE ENCODERS (10 encoders)
// ============================================================================

export const ENCODER_ASS = 'ass' as SubtitleEncoderName;
export const ENCODER_DVBSUB = 'dvbsub' as SubtitleEncoderName;
export const ENCODER_DVDSUB = 'dvdsub' as SubtitleEncoderName;
export const ENCODER_SRT = 'srt' as SubtitleEncoderName;
export const ENCODER_SSA = 'ssa' as SubtitleEncoderName;
export const ENCODER_SUBRIP = 'subrip' as SubtitleEncoderName;
export const ENCODER_TEXT = 'text' as SubtitleEncoderName;
export const ENCODER_TTML = 'ttml' as SubtitleEncoderName;
export const ENCODER_WEBVTT = 'webvtt' as SubtitleEncoderName;
export const ENCODER_XSUB = 'xsub' as SubtitleEncoderName;
