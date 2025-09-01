import {
  AV_HWDEVICE_TYPE_VIDEOTOOLBOX,
  Codec,
  FF_DECODER_AAC,
  FF_DECODER_H264,
  FF_DECODER_H264_CUVID,
  FF_DECODER_H264_MEDIACODEC,
  FF_DECODER_H264_MMAL,
  FF_DECODER_H264_QSV,
  FF_DECODER_H264_RKMPP,
  FF_DECODER_H264_V4L2M2M,
  FF_ENCODER_AAC,
  FF_ENCODER_H264_AMF,
  FF_ENCODER_H264_MEDIACODEC,
  FF_ENCODER_H264_MF,
  FF_ENCODER_H264_NVENC,
  FF_ENCODER_H264_OMX,
  FF_ENCODER_H264_QSV,
  FF_ENCODER_H264_RKMPP,
  FF_ENCODER_H264_V4L2M2M,
  FF_ENCODER_H264_VAAPI,
  FF_ENCODER_H264_VIDEOTOOLBOX,
  FF_ENCODER_H264_VULKAN,
  FF_ENCODER_LIBX264,
} from '../src/index.js';

import type { FFDecoderCodec, FFEncoderCodec } from '../src/index.js';

const decoderCodecs: FFDecoderCodec[] = [
  FF_DECODER_AAC,
  FF_DECODER_H264,
  FF_DECODER_H264_CUVID,
  FF_DECODER_H264_MEDIACODEC,
  FF_DECODER_H264_MMAL,
  FF_DECODER_H264_QSV,
  FF_DECODER_H264_RKMPP,
  FF_DECODER_H264_V4L2M2M,
];
const encoderCodecs: FFEncoderCodec[] = [
  FF_ENCODER_LIBX264,
  FF_ENCODER_AAC,
  FF_ENCODER_H264_AMF,
  FF_ENCODER_H264_MEDIACODEC,
  FF_ENCODER_H264_MF,
  FF_ENCODER_H264_NVENC,
  FF_ENCODER_H264_OMX,
  FF_ENCODER_H264_QSV,
  FF_ENCODER_H264_RKMPP,
  FF_ENCODER_H264_V4L2M2M,
  FF_ENCODER_H264_VAAPI,
  FF_ENCODER_H264_VIDEOTOOLBOX,
  FF_ENCODER_H264_VULKAN,
];

for (const dec of decoderCodecs) {
  const decoder = Codec.findDecoderByName(dec);
  if (!decoder) {
    console.warn(`Decoder '${dec}' not found`);
    continue;
  }

  console.log('Decoder:', {
    name: decoder.name,
    longName: decoder.longName,
    hasHardwareAcceleration: decoder.hasHardwareAcceleration(),
    supportedDeviceTypes: decoder.getSupportedDeviceTypes(),
    isHardwareAcceleratedDecoder: decoder.isHardwareAcceleratedDecoder(),
    isHardwareAcceleratedEncoder: decoder.isHardwareAcceleratedEncoder(),
    supportsDevice: decoder.supportsDevice(AV_HWDEVICE_TYPE_VIDEOTOOLBOX),
  });
}

for (const enc of encoderCodecs) {
  const encoder = Codec.findEncoderByName(enc);
  if (!encoder) {
    console.warn(`Encoder '${enc}' not found`);
    continue;
  }

  console.log('Encoder:', {
    name: encoder.name,
    longName: encoder.longName,
    hasHardwareAcceleration: encoder.hasHardwareAcceleration(),
    supportedDeviceTypes: encoder.getSupportedDeviceTypes(),
    isHardwareAcceleratedDecoder: encoder.isHardwareAcceleratedDecoder(),
    isHardwareAcceleratedEncoder: encoder.isHardwareAcceleratedEncoder(),
    supportsDevice: encoder.supportsDevice(AV_HWDEVICE_TYPE_VIDEOTOOLBOX),
  });
}
