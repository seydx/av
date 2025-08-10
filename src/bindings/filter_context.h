#ifndef FFMPEG_FILTER_CONTEXT_H
#define FFMPEG_FILTER_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

// Minimal FilterContext wrapper for direct access
class FilterContext : public Napi::ObjectWrap<FilterContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  FilterContext(const Napi::CallbackInfo& info);
  ~FilterContext() = default;
  
  // Properties
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetFilterName(const Napi::CallbackInfo& info);
  
  // Internal use
  void SetContext(AVFilterContext* ctx) { context_ = ctx; }
  AVFilterContext* GetContext() const { return context_; }

private:
  AVFilterContext* context_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_CONTEXT_H