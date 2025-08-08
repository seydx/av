#ifndef FFMPEG_FILTER_H
#define FFMPEG_FILTER_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

class Filter : public Napi::ObjectWrap<Filter> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Filter(const Napi::CallbackInfo& info);
  ~Filter() = default;
  
  // Static methods
  static Napi::Value FindByName(const Napi::CallbackInfo& info);
  static Napi::Value GetAll(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetDescription(const Napi::CallbackInfo& info);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  Napi::Value GetNbInputs(const Napi::CallbackInfo& info);
  Napi::Value GetNbOutputs(const Napi::CallbackInfo& info);
  
  // Internal use
  void SetFilter(const AVFilter* filter) { filter_ = filter; }
  const AVFilter* GetFilter() const { return filter_; }
  
  static Napi::FunctionReference constructor;

private:
  const AVFilter* filter_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_H