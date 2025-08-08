#ifndef FFMPEG_FILTER_CONTEXT_H
#define FFMPEG_FILTER_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

class FilterContext : public Napi::ObjectWrap<FilterContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  FilterContext(const Napi::CallbackInfo& info);
  ~FilterContext() = default;
  
  // Methods
  Napi::Value Link(const Napi::CallbackInfo& info);
  Napi::Value Unlink(const Napi::CallbackInfo& info);
  
  // Buffer operations
  Napi::Value BufferSrcAddFrame(const Napi::CallbackInfo& info);
  Napi::Value BufferSrcAddFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value BufferSinkGetFrame(const Napi::CallbackInfo& info);
  Napi::Value BufferSinkGetFrameAsync(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetFilter(const Napi::CallbackInfo& info);
  Napi::Value GetNbInputs(const Napi::CallbackInfo& info);
  Napi::Value GetNbOutputs(const Napi::CallbackInfo& info);
  
  // Options
  Napi::Value GetOptions(const Napi::CallbackInfo& info);
  
  // Internal use
  void SetContext(AVFilterContext* ctx) { context_ = ctx; }
  AVFilterContext* GetContext() const { return context_; }
  
  static Napi::FunctionReference constructor;

private:
  AVFilterContext* context_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_CONTEXT_H