#ifndef FFMPEG_HARDWARE_DEVICE_CONTEXT_H
#define FFMPEG_HARDWARE_DEVICE_CONTEXT_H

#include <napi.h>
#include <memory>
#include "common.h"

extern "C" {
#include <libavutil/hwcontext.h>
#include <libavutil/buffer.h>
}

namespace ffmpeg {

class HardwareDeviceContext : public Napi::ObjectWrap<HardwareDeviceContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  HardwareDeviceContext(const Napi::CallbackInfo& info);
  ~HardwareDeviceContext();
  
  // Native access
  AVBufferRef* Get() { 
    return device_ref_ ? device_ref_ : unowned_ref_; 
  }
  void SetOwned(AVBufferRef* ref) { 
    // Free old ref if exists
    if (device_ref_ && !is_freed_) {
      av_buffer_unref(&device_ref_);
    }
    device_ref_ = ref;
    unowned_ref_ = nullptr;
    is_freed_ = false;
  }
  void SetUnowned(AVBufferRef* ref) { 
    if (device_ref_ && !is_freed_) {
      av_buffer_unref(&device_ref_);
    }
    device_ref_ = nullptr;
    unowned_ref_ = ref;
    is_freed_ = true;  // Mark as freed since we don't own it
  }
  
  // Static factory
  static Napi::Value Wrap(Napi::Env env, AVBufferRef* device_ref);
  
private:
  // Friend classes
  friend class HardwareFramesContext;
  friend class CodecContext;
  friend class FilterContext;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVBufferRef* device_ref_ = nullptr;  // Manual RAII
  AVBufferRef* unowned_ref_ = nullptr;
  bool is_freed_ = false;
  
  // === Static Methods - Low Level API ===
  

  static Napi::Value GetTypeName(const Napi::CallbackInfo& info);
  static Napi::Value IterateTypes(const Napi::CallbackInfo& info);
  static Napi::Value FindTypeByName(const Napi::CallbackInfo& info);
  
  // === Methods - Low Level API ===
  
  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value Create(const Napi::CallbackInfo& info);
  Napi::Value CreateDerived(const Napi::CallbackInfo& info);
  Napi::Value HwconfigAlloc(const Napi::CallbackInfo& info);
  Napi::Value GetHwframeConstraints(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  Napi::Value GetType(const Napi::CallbackInfo& info);
  Napi::Value GetHwctx(const Napi::CallbackInfo& info);
  
  // === Utility ===
  
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_HARDWARE_DEVICE_CONTEXT_H