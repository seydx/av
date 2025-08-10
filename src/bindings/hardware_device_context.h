#ifndef HARDWARE_DEVICE_CONTEXT_H
#define HARDWARE_DEVICE_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/hwcontext.h>
}

namespace ffmpeg {

class HardwareDeviceContext : public Napi::ObjectWrap<HardwareDeviceContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  HardwareDeviceContext(const Napi::CallbackInfo& info);
  ~HardwareDeviceContext();
  
  // Static methods
  static Napi::Value FindTypeByName(const Napi::CallbackInfo& info);
  static Napi::Value GetTypeName(const Napi::CallbackInfo& info);
  static Napi::Value GetSupportedTypes(const Napi::CallbackInfo& info);
  
  // Methods
  Napi::Value GetHardwareFramesConstraints(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetType(const Napi::CallbackInfo& info);
  
  // Internal
  AVBufferRef* GetContext() { return context_; }
  void SetContext(AVBufferRef* ctx) { context_ = ctx; }
  
private:
  AVBufferRef* context_;
  AVHWDeviceType type_;
};

} // namespace ffmpeg

#endif // HARDWARE_DEVICE_CONTEXT_H