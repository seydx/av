#ifndef SOFTWARE_SCALE_CONTEXT_H
#define SOFTWARE_SCALE_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libswscale/swscale.h>
}

namespace ffmpeg {

class SoftwareScaleContext : public Napi::ObjectWrap<SoftwareScaleContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  SoftwareScaleContext(const Napi::CallbackInfo& info);
  ~SoftwareScaleContext();
  
  // Methods
  Napi::Value ScaleFrame(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetSourceWidth(const Napi::CallbackInfo& info);
  Napi::Value GetSourceHeight(const Napi::CallbackInfo& info);
  Napi::Value GetSourcePixelFormat(const Napi::CallbackInfo& info);
  Napi::Value GetDestinationWidth(const Napi::CallbackInfo& info);
  Napi::Value GetDestinationHeight(const Napi::CallbackInfo& info);
  Napi::Value GetDestinationPixelFormat(const Napi::CallbackInfo& info);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  
  // Internal
  SwsContext* GetContext() { return context_; }
  
private:
  SwsContext* context_;
  
  // Store parameters since they're not accessible from SwsContext
  int srcW_;
  int srcH_;
  AVPixelFormat srcFormat_;
  int dstW_;
  int dstH_;
  AVPixelFormat dstFormat_;
  int flags_;
};

} // namespace ffmpeg

#endif // SOFTWARE_SCALE_CONTEXT_H