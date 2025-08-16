#ifndef FFMPEG_STREAM_H
#define FFMPEG_STREAM_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

// Forward declarations
class CodecParameters;
class Dictionary;
class Packet;

class Stream : public Napi::ObjectWrap<Stream> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Stream(const Napi::CallbackInfo& info);
  ~Stream();
  
  // Native access
  AVStream* Get() { return stream_; }
  const AVStream* Get() const { return stream_; }
  void Set(AVStream* stream) { stream_ = stream; }

private:
  // Friend classes
  friend class FormatContext;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVStream* stream_ = nullptr; // NOT owned - managed by AVFormatContext
  
  // === Properties ===
  
  Napi::Value GetIndex(const Napi::CallbackInfo& info);
  Napi::Value GetId(const Napi::CallbackInfo& info);
  void SetId(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetCodecpar(const Napi::CallbackInfo& info);
  void SetCodecpar(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetTimeBase(const Napi::CallbackInfo& info);
  void SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetStartTime(const Napi::CallbackInfo& info);
  void SetStartTime(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDuration(const Napi::CallbackInfo& info);
  void SetDuration(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetNbFrames(const Napi::CallbackInfo& info);
  void SetNbFrames(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDisposition(const Napi::CallbackInfo& info);
  void SetDisposition(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDiscard(const Napi::CallbackInfo& info);
  void SetDiscard(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
  void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetAvgFrameRate(const Napi::CallbackInfo& info);
  void SetAvgFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetRFrameRate(const Napi::CallbackInfo& info);
  void SetRFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetMetadata(const Napi::CallbackInfo& info);
  void SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetAttachedPic(const Napi::CallbackInfo& info);
  Napi::Value GetEventFlags(const Napi::CallbackInfo& info);
  void SetEventFlags(const Napi::CallbackInfo& info, const Napi::Value& value);
};

} // namespace ffmpeg

#endif // FFMPEG_STREAM_H