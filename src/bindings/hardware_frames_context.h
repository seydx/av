#ifndef FFMPEG_HARDWARE_FRAMES_CONTEXT_H
#define FFMPEG_HARDWARE_FRAMES_CONTEXT_H

#include <napi.h>
#include <memory>
#include "common.h"

extern "C" {
#include <libavutil/hwcontext.h>
#include <libavutil/buffer.h>
#include <libavutil/frame.h>
}

namespace ffmpeg {

// Forward declarations
class HardwareDeviceContext;
class Frame;

class HardwareFramesContext : public Napi::ObjectWrap<HardwareFramesContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  HardwareFramesContext(const Napi::CallbackInfo& info);
  ~HardwareFramesContext();
  
  // Native access
  AVBufferRef* Get() { 
    return frames_ref_ ? frames_ref_ : unowned_ref_; 
  }
  void SetOwned(AVBufferRef* ref) { 
    // Free old ref if exists
    if (frames_ref_ && !is_freed_) {
      av_buffer_unref(&frames_ref_);
    }
    frames_ref_ = ref;
    unowned_ref_ = nullptr;
    is_freed_ = false;
  }
  void SetUnowned(AVBufferRef* ref) { 
    if (frames_ref_ && !is_freed_) {
      av_buffer_unref(&frames_ref_);
    }
    frames_ref_ = nullptr;
    unowned_ref_ = ref;
    is_freed_ = true;  // Mark as freed since we don't own it
  }
  
  // Static factory
  static Napi::Value Wrap(Napi::Env env, AVBufferRef* frames_ref);
  
private:
  // Friend classes
  friend class CodecContext;
  friend class Frame;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVBufferRef* frames_ref_ = nullptr;  // Manual RAII
  AVBufferRef* unowned_ref_ = nullptr;
  bool is_freed_ = false;
  
  // === Methods - Low Level API ===

  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value GetBuffer(const Napi::CallbackInfo& info);
  Napi::Value TransferData(const Napi::CallbackInfo& info);
  Napi::Value TransferGetFormats(const Napi::CallbackInfo& info);
  Napi::Value Map(const Napi::CallbackInfo& info);
  Napi::Value CreateDerived(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  Napi::Value GetFormat(const Napi::CallbackInfo& info);
  void SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetSwFormat(const Napi::CallbackInfo& info);
  void SetSwFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetWidth(const Napi::CallbackInfo& info);
  void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetHeight(const Napi::CallbackInfo& info);
  void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetInitialPoolSize(const Napi::CallbackInfo& info);
  void SetInitialPoolSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDeviceRef(const Napi::CallbackInfo& info);
  
  // === Utility ===
  
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_HARDWARE_FRAMES_CONTEXT_H