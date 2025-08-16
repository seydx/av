#ifndef FFMPEG_PACKET_H
#define FFMPEG_PACKET_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

class Packet : public Napi::ObjectWrap<Packet> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Packet(const Napi::CallbackInfo& info);
  ~Packet();
  
  // Native access
  AVPacket* Get() { return packet_; }

private:
  // Friend classes
  friend class Stream;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVPacket* packet_ = nullptr;  // Manual RAII
  bool is_freed_ = false;
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Ref(const Napi::CallbackInfo& info);
  Napi::Value Unref(const Napi::CallbackInfo& info);
  Napi::Value Clone(const Napi::CallbackInfo& info);
  Napi::Value RescaleTs(const Napi::CallbackInfo& info);
  Napi::Value MakeRefcounted(const Napi::CallbackInfo& info);
  Napi::Value MakeWritable(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  Napi::Value GetStreamIndex(const Napi::CallbackInfo& info);
  void SetStreamIndex(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetPts(const Napi::CallbackInfo& info);
  void SetPts(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDts(const Napi::CallbackInfo& info);
  void SetDts(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDuration(const Napi::CallbackInfo& info);
  void SetDuration(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetPos(const Napi::CallbackInfo& info);
  void SetPos(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSize(const Napi::CallbackInfo& info);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  void SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetData(const Napi::CallbackInfo& info);
  void SetData(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetIsKeyframe(const Napi::CallbackInfo& info);
  void SetIsKeyframe(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // === Utility ===
  
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_PACKET_H