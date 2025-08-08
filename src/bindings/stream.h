#ifndef FFMPEG_STREAM_H
#define FFMPEG_STREAM_H

#include <napi.h>
#include "common.h"
#include "codec_parameters.h"

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

class Stream : public Napi::ObjectWrap<Stream> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  Stream(const Napi::CallbackInfo& info);
  
  AVStream* Get() { return stream_; }
  void SetStream(AVStream* stream) { stream_ = stream; }

 private:
  AVStream* stream_;  // Not owned, belongs to FormatContext
  
  // Core Properties
  Napi::Value GetIndex(const Napi::CallbackInfo& info);
  Napi::Value GetId(const Napi::CallbackInfo& info);
  void SetId(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDuration(const Napi::CallbackInfo& info);
  Napi::Value GetNbFrames(const Napi::CallbackInfo& info);
  Napi::Value GetStartTime(const Napi::CallbackInfo& info);
  
  // Timing Properties
  Napi::Value GetTimeBase(const Napi::CallbackInfo& info);
  void SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetAvgFrameRate(const Napi::CallbackInfo& info);
  void SetAvgFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetRFrameRate(const Napi::CallbackInfo& info);
  void SetRFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
  void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Configuration
  Napi::Value GetDiscard(const Napi::CallbackInfo& info);
  void SetDiscard(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDisposition(const Napi::CallbackInfo& info);
  void SetDisposition(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetEventFlags(const Napi::CallbackInfo& info);
  Napi::Value GetMetadata(const Napi::CallbackInfo& info);
  void SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Codec Parameters
  Napi::Value GetCodecParameters(const Napi::CallbackInfo& info);
};

}  // namespace ffmpeg

#endif  // FFMPEG_STREAM_H