#include "error.h"

namespace ffmpeg {

Napi::FunctionReference FFmpegError::constructor;

// === Init ===

Napi::Object FFmpegError::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FFmpegError", {
    // Static methods
    StaticMethod<&FFmpegError::Strerror>("strerror"),
    StaticMethod<&FFmpegError::MakeError>("makeError"),
    StaticMethod<&FFmpegError::IsError>("isError"),
    
    // Properties
    InstanceAccessor<&FFmpegError::GetErrorCode>("code"),
    InstanceAccessor<&FFmpegError::GetMessage>("message"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FFmpegError", func);
  
  return exports;
}

// === Lifecycle ===

FFmpegError::FFmpegError(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<FFmpegError>(info) {
  if (info.Length() > 0 && info[0].IsNumber()) {
    code_ = info[0].As<Napi::Number>().Int32Value();
  }
}

// === Static Methods ===

Napi::Value FFmpegError::Strerror(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Error code (number) required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int errnum = info[0].As<Napi::Number>().Int32Value();
  
  char errbuf[AV_ERROR_MAX_STRING_SIZE];
  av_strerror(errnum, errbuf, AV_ERROR_MAX_STRING_SIZE);
  
  return Napi::String::New(env, errbuf);
}

Napi::Value FFmpegError::MakeError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "POSIX error code (number) required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int posixError = info[0].As<Napi::Number>().Int32Value();
  return Napi::Number::New(env, AVERROR(posixError));
}

Napi::Value FFmpegError::IsError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    return Napi::Boolean::New(env, false);
  }
  
  int code = info[0].As<Napi::Number>().Int32Value();
  return Napi::Boolean::New(env, code < 0);
}

// === Properties ===

Napi::Value FFmpegError::GetErrorCode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, code_);
}

Napi::Value FFmpegError::GetMessage(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  char errbuf[AV_ERROR_MAX_STRING_SIZE];
  av_strerror(code_, errbuf, AV_ERROR_MAX_STRING_SIZE);
  
  return Napi::String::New(env, errbuf);
}

} // namespace ffmpeg