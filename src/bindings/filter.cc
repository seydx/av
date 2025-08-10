#include "filter.h"

namespace ffmpeg {

Napi::FunctionReference Filter::constructor;

Napi::Object Filter::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Filter", {
    // Static methods
    StaticMethod<&Filter::FindByName>("findByName"),
    
    // Properties
    InstanceAccessor<&Filter::GetName>("name"),
    InstanceAccessor<&Filter::GetDescription>("description"),
    InstanceAccessor<&Filter::GetFlags>("flags"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Filter", func);
  return exports;
}

Filter::Filter(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<Filter>(info), filter_(nullptr) {
}

Napi::Value Filter::FindByName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Filter name required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  const AVFilter* filter = avfilter_get_by_name(name.c_str());
  
  if (!filter) {
    return env.Null();
  }
  
  Napi::Object filterObj = constructor.New({});
  Filter* wrapper = Napi::ObjectWrap<Filter>::Unwrap(filterObj);
  wrapper->SetFilter(filter);
  
  return filterObj;
}

Napi::Value Filter::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!filter_) {
    return env.Null();
  }
  return Napi::String::New(env, filter_->name);
}

Napi::Value Filter::GetDescription(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!filter_ || !filter_->description) {
    return env.Null();
  }
  return Napi::String::New(env, filter_->description);
}

Napi::Value Filter::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!filter_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, filter_->flags);
}

} // namespace ffmpeg