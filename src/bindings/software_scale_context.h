#ifndef FFMPEG_SOFTWARE_SCALE_CONTEXT_H
#define FFMPEG_SOFTWARE_SCALE_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libswscale/swscale.h>
#include <libavutil/imgutils.h>
}

namespace ffmpeg {

class SoftwareScaleContext : public Napi::ObjectWrap<SoftwareScaleContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  SoftwareScaleContext(const Napi::CallbackInfo& info);
  ~SoftwareScaleContext();
  
  // Native access
  SwsContext* Get() { return ctx_; }

private:
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  SwsContext* ctx_ = nullptr;  // Manual RAII
  bool is_freed_ = false;
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value AllocContext(const Napi::CallbackInfo& info);
  Napi::Value GetContext(const Napi::CallbackInfo& info);
  Napi::Value InitContext(const Napi::CallbackInfo& info);
  Napi::Value FreeContext(const Napi::CallbackInfo& info);
  
  // Operations
  Napi::Value Scale(const Napi::CallbackInfo& info);
  Napi::Value ScaleFrame(const Napi::CallbackInfo& info);
  
  // === Utility ===
  
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_SOFTWARE_SCALE_CONTEXT_H