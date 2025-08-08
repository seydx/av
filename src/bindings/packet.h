#pragma once

#include <napi.h>
#include "common.h"

namespace ffmpeg {

class Packet : public Napi::ObjectWrap<Packet> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  
  Packet(const Napi::CallbackInfo& info);
  ~Packet();
  
  // Properties
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
  
  // Methods
  Napi::Value Ref(const Napi::CallbackInfo& info);
  Napi::Value Unref(const Napi::CallbackInfo& info);
  Napi::Value RescaleTs(const Napi::CallbackInfo& info);
  Napi::Value Clone(const Napi::CallbackInfo& info);
  
  // Symbol.dispose support
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Internal
  AVPacket* GetPacket() { return packet_.Get(); }
  void SetPacket(AVPacket* pkt);
  
 private:
  PacketResource packet_;
  
  static Napi::FunctionReference constructor;
};

}  // namespace ffmpeg