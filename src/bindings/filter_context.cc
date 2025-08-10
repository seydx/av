#include "filter_context.h"

namespace ffmpeg {

Napi::FunctionReference FilterContext::constructor;

Napi::Object FilterContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterContext", {
    // Properties
    InstanceAccessor<&FilterContext::GetName>("name"),
    InstanceAccessor<&FilterContext::GetFilterName>("filterName"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterContext", func);
  return exports;
}

FilterContext::FilterContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<FilterContext>(info), context_(nullptr) {
}

Napi::Value FilterContext::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!context_) {
    return env.Null();
  }
  return Napi::String::New(env, avfilter_pad_get_name(context_->input_pads, 0));
}

Napi::Value FilterContext::GetFilterName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!context_ || !context_->filter) {
    return env.Null();
  }
  return Napi::String::New(env, context_->filter->name);
}

} // namespace ffmpeg