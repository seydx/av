#ifndef FFMPEG_BITSTREAM_FILTER_CONTEXT_H
#define FFMPEG_BITSTREAM_FILTER_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/bsf.h>
#include <libavutil/rational.h>
}

namespace ffmpeg {

class BitStreamFilterContext : public Napi::ObjectWrap<BitStreamFilterContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  BitStreamFilterContext(const Napi::CallbackInfo& info);
  ~BitStreamFilterContext();
  
  // Native access
  AVBSFContext* Get() { return context_; }

private:
  // Friend classes for async operations
  friend class BSFSendPacketWorker;
  friend class BSFReceivePacketWorker;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVBSFContext* context_ = nullptr;
  bool is_initialized_ = false;
  bool is_freed_ = false;
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Flush(const Napi::CallbackInfo& info);
  
  // Operations
  Napi::Value SendPacketAsync(const Napi::CallbackInfo& info);
  Napi::Value ReceivePacketAsync(const Napi::CallbackInfo& info);
  
  // Utility
  Napi::Value IsInitialized(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  // Input/Output parameters
  Napi::Value GetInputCodecParameters(const Napi::CallbackInfo& info);
  Napi::Value GetOutputCodecParameters(const Napi::CallbackInfo& info);
  
  // Timebase
  Napi::Value GetInputTimeBase(const Napi::CallbackInfo& info);
  void SetInputTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetOutputTimeBase(const Napi::CallbackInfo& info);
  
  // Filter reference
  Napi::Value GetFilter(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_BITSTREAM_FILTER_CONTEXT_H