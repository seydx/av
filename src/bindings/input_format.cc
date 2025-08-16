#include "input_format.h"

namespace ffmpeg {

Napi::FunctionReference InputFormat::constructor;

// === Init ===

Napi::Object InputFormat::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "InputFormat", {
    // Static methods
    StaticMethod<&InputFormat::FindInputFormat>("findInputFormat"),
    
    // Properties
    InstanceAccessor<&InputFormat::GetName>("name"),
    InstanceAccessor<&InputFormat::GetLongName>("longName"),
    InstanceAccessor<&InputFormat::GetExtensions>("extensions"),
    InstanceAccessor<&InputFormat::GetMimeType>("mimeType"),
    InstanceAccessor<&InputFormat::GetFlags>("flags"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("InputFormat", func);
  return exports;
}

// === Lifecycle ===

InputFormat::InputFormat(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<InputFormat>(info), format_(nullptr) {
  // Constructor does nothing - format is set via static factory methods
}

// === Static Methods ===

Napi::Value InputFormat::FindInputFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Format short name (string) required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string shortName = info[0].As<Napi::String>().Utf8Value();
  const AVInputFormat* fmt = av_find_input_format(shortName.c_str());
  
  if (!fmt) {
    return env.Null();
  }
  
  // Create new InputFormat object
  Napi::Object formatObj = constructor.New({});
  InputFormat* wrapper = Napi::ObjectWrap<InputFormat>::Unwrap(formatObj);
  wrapper->Set(fmt);
  
  return formatObj;
}

// === Properties ===

Napi::Value InputFormat::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!format_ || !format_->name) {
    return env.Null();
  }
  return Napi::String::New(env, format_->name);
}

Napi::Value InputFormat::GetLongName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!format_ || !format_->long_name) {
    return env.Null();
  }
  return Napi::String::New(env, format_->long_name);
}

Napi::Value InputFormat::GetExtensions(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!format_ || !format_->extensions) {
    return env.Null();
  }
  return Napi::String::New(env, format_->extensions);
}

Napi::Value InputFormat::GetMimeType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!format_ || !format_->mime_type) {
    return env.Null();
  }
  return Napi::String::New(env, format_->mime_type);
}

Napi::Value InputFormat::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!format_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, format_->flags);
}

} // namespace ffmpeg