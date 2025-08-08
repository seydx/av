#ifndef FFMPEG_CODEC_CONTEXT_H
#define FFMPEG_CODEC_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

class CodecContext : public Napi::ObjectWrap<CodecContext> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  CodecContext(const Napi::CallbackInfo& info);
  
  AVCodecContext* Get() { return context_.Get(); }
  void SetContext(AVCodecContext* ctx);

 private:
  static Napi::FunctionReference constructor;
  CodecContextResource context_;
  
  // Lifecycle
  Napi::Value Open(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Options
  Napi::Value GetOptions(const Napi::CallbackInfo& info);
  
  // Encoding/Decoding
  Napi::Value SendPacket(const Napi::CallbackInfo& info);
  Napi::Value ReceiveFrame(const Napi::CallbackInfo& info);
  Napi::Value SendFrame(const Napi::CallbackInfo& info);
  Napi::Value ReceivePacket(const Napi::CallbackInfo& info);
  
  // Properties - General
  Napi::Value GetCodecID(const Napi::CallbackInfo& info);
  void SetCodecID(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetMediaType(const Napi::CallbackInfo& info);
  void SetMediaType(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetBitRate(const Napi::CallbackInfo& info);
  void SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetTimeBase(const Napi::CallbackInfo& info);
  void SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetLevel(const Napi::CallbackInfo& info);
  void SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetProfile(const Napi::CallbackInfo& info);
  void SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetThreadCount(const Napi::CallbackInfo& info);
  void SetThreadCount(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetThreadType(const Napi::CallbackInfo& info);
  void SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  void SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetFlags2(const Napi::CallbackInfo& info);
  void SetFlags2(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetExtraData(const Napi::CallbackInfo& info);
  void SetExtraData(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Properties - Video
  Napi::Value GetWidth(const Napi::CallbackInfo& info);
  void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetHeight(const Napi::CallbackInfo& info);
  void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetPixelFormat(const Napi::CallbackInfo& info);
  void SetPixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetFramerate(const Napi::CallbackInfo& info);
  void SetFramerate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
  void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetGopSize(const Napi::CallbackInfo& info);
  void SetGopSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetMaxBFrames(const Napi::CallbackInfo& info);
  void SetMaxBFrames(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetColorSpace(const Napi::CallbackInfo& info);
  void SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetColorRange(const Napi::CallbackInfo& info);
  void SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Properties - Audio
  Napi::Value GetSampleRate(const Napi::CallbackInfo& info);
  void SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSampleFormat(const Napi::CallbackInfo& info);
  void SetSampleFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetChannelLayout(const Napi::CallbackInfo& info);
  void SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetChannels(const Napi::CallbackInfo& info);
  Napi::Value GetFrameSize(const Napi::CallbackInfo& info);
  void SetFrameSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Properties - Rate Control
  Napi::Value GetRateControlMaxRate(const Napi::CallbackInfo& info);
  void SetRateControlMaxRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetRateControlMinRate(const Napi::CallbackInfo& info);
  void SetRateControlMinRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetRateControlBufferSize(const Napi::CallbackInfo& info);
  void SetRateControlBufferSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Utility
  Napi::Value IsEncoder(const Napi::CallbackInfo& info);
  Napi::Value IsDecoder(const Napi::CallbackInfo& info);
  Napi::Value FlushBuffers(const Napi::CallbackInfo& info);
};

}  // namespace ffmpeg

#endif  // FFMPEG_CODEC_CONTEXT_H