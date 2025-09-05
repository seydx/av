#pragma once

#include <napi.h>

extern "C" {
#include <libavutil/avutil.h>
#include <libavutil/pixdesc.h>
#include <libavutil/samplefmt.h>
#include <libavutil/imgutils.h>
#include <libavutil/timestamp.h>
#include <libavutil/mathematics.h>
#include <libavutil/time.h>
#include <libavutil/channel_layout.h>
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

class Utilities : public Napi::ObjectWrap<Utilities> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  // Sample format utilities
  static Napi::Value GetBytesPerSample(const Napi::CallbackInfo& info);
  static Napi::Value GetSampleFmtName(const Napi::CallbackInfo& info);
  static Napi::Value GetPackedSampleFmt(const Napi::CallbackInfo& info);
  static Napi::Value GetPlanarSampleFmt(const Napi::CallbackInfo& info);
  static Napi::Value SampleFmtIsPlanar(const Napi::CallbackInfo& info);
  
  // Pixel format utilities
  static Napi::Value GetPixFmtName(const Napi::CallbackInfo& info);
  static Napi::Value GetPixFmtFromName(const Napi::CallbackInfo& info);
  static Napi::Value IsHardwarePixelFormat(const Napi::CallbackInfo& info);
  
  // Media type utilities
  static Napi::Value GetMediaTypeString(const Napi::CallbackInfo& info);
  
  // Codec utilities
  static Napi::Value GetCodecName(const Napi::CallbackInfo& info);
  
  // Image utilities
  static Napi::Value ImageAlloc(const Napi::CallbackInfo& info);
  static Napi::Value ImageCopy2(const Napi::CallbackInfo& info);
  static Napi::Value ImageGetBufferSize(const Napi::CallbackInfo& info);
  static Napi::Value ImageCopyToBuffer(const Napi::CallbackInfo& info);
  
  // Timestamp utilities
  static Napi::Value Ts2Str(const Napi::CallbackInfo& info);
  static Napi::Value Ts2TimeStr(const Napi::CallbackInfo& info);
  static Napi::Value CompareTs(const Napi::CallbackInfo& info);
  static Napi::Value RescaleQ(const Napi::CallbackInfo& info);
  static Napi::Value RescaleRnd(const Napi::CallbackInfo& info);
  static Napi::Value Usleep(const Napi::CallbackInfo& info);
  
  // Audio sample utilities
  static Napi::Value SamplesAlloc(const Napi::CallbackInfo& info);
  static Napi::Value SamplesGetBufferSize(const Napi::CallbackInfo& info);
  
  // Channel layout utilities
  static Napi::Value ChannelLayoutDescribe(const Napi::CallbackInfo& info);
  
  // SDP utilities
  static Napi::Value SdpCreate(const Napi::CallbackInfo& info);

private:
  explicit Utilities(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg