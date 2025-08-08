#ifndef SOFTWARE_RESAMPLE_CONTEXT_H
#define SOFTWARE_RESAMPLE_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libswresample/swresample.h>
}

namespace ffmpeg {

class SoftwareResampleContext : public Napi::ObjectWrap<SoftwareResampleContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  SoftwareResampleContext(const Napi::CallbackInfo& info);
  ~SoftwareResampleContext();
  
  // Methods
  Napi::Value ConvertFrame(const Napi::CallbackInfo& info);
  Napi::Value GetDelay(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Internal
  SwrContext* GetContext() { return context_; }
  
private:
  SwrContext* context_;
};

} // namespace ffmpeg

#endif // SOFTWARE_RESAMPLE_CONTEXT_H