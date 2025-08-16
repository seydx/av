#ifndef FFMPEG_FILTER_H
#define FFMPEG_FILTER_H

#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

class Filter : public Napi::ObjectWrap<Filter> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Filter(const Napi::CallbackInfo& info);
  ~Filter() = default;
  
  // Native access
  const AVFilter* Get() const { return filter_; }
  void Set(const AVFilter* filter) { filter_ = filter; }

private:
  // Friend classes  
  friend class FilterContext;
  friend class FilterGraph;
  friend class FilterInOut;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  const AVFilter* filter_ = nullptr; // NOT owned - filters are static definitions
  
  // === Static Methods ===
  static Napi::Value GetByName(const Napi::CallbackInfo& info);
  static Napi::Value GetList(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  // name
  Napi::Value GetName(const Napi::CallbackInfo& info);
  
  // description
  Napi::Value GetDescription(const Napi::CallbackInfo& info);
  
  // inputs
  Napi::Value GetInputs(const Napi::CallbackInfo& info);
  
  // outputs
  Napi::Value GetOutputs(const Napi::CallbackInfo& info);
  
  // flags
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_H