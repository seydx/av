#ifndef HARDWARE_FRAMES_CONTEXT_H
#define HARDWARE_FRAMES_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/hwcontext.h>
}

namespace ffmpeg {

class HardwareFramesContext : public Napi::ObjectWrap<HardwareFramesContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  HardwareFramesContext(const Napi::CallbackInfo& info);
  ~HardwareFramesContext();
  
  // Methods
  Napi::Value Initialize(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetWidth(const Napi::CallbackInfo& info);
  void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetHeight(const Napi::CallbackInfo& info);
  void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetHardwarePixelFormat(const Napi::CallbackInfo& info);
  void SetHardwarePixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSoftwarePixelFormat(const Napi::CallbackInfo& info);
  void SetSoftwarePixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetInitialPoolSize(const Napi::CallbackInfo& info);
  void SetInitialPoolSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Internal
  AVBufferRef* GetContext() { return context_; }
  void SetContext(AVBufferRef* ctx) { context_ = ctx; }
  
private:
  AVBufferRef* context_;
  AVHWFramesContext* GetData();
};

} // namespace ffmpeg

#endif // HARDWARE_FRAMES_CONTEXT_H