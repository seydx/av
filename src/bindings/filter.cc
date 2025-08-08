#include "filter.h"

namespace ffmpeg {

Napi::FunctionReference Filter::constructor;

Napi::Object Filter::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Filter", {
    // Static methods
    StaticMethod<&Filter::FindByName>("findByName"),
    StaticMethod<&Filter::GetAll>("getAll"),
    
    // Properties
    InstanceAccessor<&Filter::GetName>("name"),
    InstanceAccessor<&Filter::GetDescription>("description"),
    InstanceAccessor<&Filter::GetFlags>("flags"),
    InstanceAccessor<&Filter::GetNbInputs>("nbInputs"),
    InstanceAccessor<&Filter::GetNbOutputs>("nbOutputs"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Filter", func);
  return exports;
}

Filter::Filter(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<Filter>(info), filter_(nullptr) {
  // Filter objects are created internally, not by users
}

// Static methods
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

Napi::Value Filter::GetAll(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Array filters = Napi::Array::New(env);
  
  void* opaque = nullptr;
  const AVFilter* filter = nullptr;
  uint32_t index = 0;
  
  while ((filter = av_filter_iterate(&opaque))) {
    Napi::Object filterObj = constructor.New({});
    Filter* wrapper = Napi::ObjectWrap<Filter>::Unwrap(filterObj);
    wrapper->SetFilter(filter);
    filters[index++] = filterObj;
  }
  
  return filters;
}

// Properties
Napi::Value Filter::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!filter_ || !filter_->name) {
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

Napi::Value Filter::GetNbInputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!filter_) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, filter_->nb_inputs);
}

Napi::Value Filter::GetNbOutputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!filter_) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, filter_->nb_outputs);
}

} // namespace ffmpeg