#include "software_scale_context.h"
#include "frame.h"
#include "common.h"

namespace ffmpeg {

Napi::FunctionReference SoftwareScaleContext::constructor;

Napi::Object SoftwareScaleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareScaleContext", {
    // Methods
    InstanceMethod<&SoftwareScaleContext::ScaleFrame>("scaleFrame"),
    InstanceMethod<&SoftwareScaleContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Properties
    InstanceAccessor<&SoftwareScaleContext::GetSourceWidth>("sourceWidth"),
    InstanceAccessor<&SoftwareScaleContext::GetSourceHeight>("sourceHeight"),
    InstanceAccessor<&SoftwareScaleContext::GetSourcePixelFormat>("sourcePixelFormat"),
    InstanceAccessor<&SoftwareScaleContext::GetDestinationWidth>("destinationWidth"),
    InstanceAccessor<&SoftwareScaleContext::GetDestinationHeight>("destinationHeight"),
    InstanceAccessor<&SoftwareScaleContext::GetDestinationPixelFormat>("destinationPixelFormat"),
    InstanceAccessor<&SoftwareScaleContext::GetFlags>("flags"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("SoftwareScaleContext", func);
  return exports;
}

SoftwareScaleContext::SoftwareScaleContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<SoftwareScaleContext>(info), context_(nullptr) {
  Napi::Env env = info.Env();
  
  // Constructor now handles initialization directly
  if (info.Length() < 7) {
    Napi::TypeError::New(env, 
      "Expected 7 arguments: srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags")
      .ThrowAsJavaScriptException();
    return;
  }
  
  srcW_ = info[0].As<Napi::Number>().Int32Value();
  srcH_ = info[1].As<Napi::Number>().Int32Value();
  srcFormat_ = static_cast<AVPixelFormat>(info[2].As<Napi::Number>().Int32Value());
  dstW_ = info[3].As<Napi::Number>().Int32Value();
  dstH_ = info[4].As<Napi::Number>().Int32Value();
  dstFormat_ = static_cast<AVPixelFormat>(info[5].As<Napi::Number>().Int32Value());
  flags_ = info[6].As<Napi::Number>().Int32Value();
  
  // Create context
  context_ = sws_getContext(
    srcW_, srcH_, srcFormat_,
    dstW_, dstH_, dstFormat_,
    flags_,
    nullptr, nullptr, nullptr
  );
  
  if (!context_) {
    Napi::Error::New(env, "Failed to create software scale context").ThrowAsJavaScriptException();
    return;
  }
}

SoftwareScaleContext::~SoftwareScaleContext() {
  if (context_) {
    sws_freeContext(context_);
    context_ = nullptr;
  }
}

// Scale frame
Napi::Value SoftwareScaleContext::ScaleFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Scale context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "Source and destination frames required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* src = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!src) return env.Undefined();
  
  Frame* dst = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[1], "Frame");
  if (!dst) return env.Undefined();
  
  int ret = sws_scale_frame(context_, dst->GetFrame(), src->GetFrame());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to scale frame");
  }
  
  return env.Undefined();
}

// Dispose
Napi::Value SoftwareScaleContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_) {
    sws_freeContext(context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

// Properties
Napi::Value SoftwareScaleContext::GetSourceWidth(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), srcW_);
}

Napi::Value SoftwareScaleContext::GetSourceHeight(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), srcH_);
}

Napi::Value SoftwareScaleContext::GetSourcePixelFormat(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), srcFormat_);
}

Napi::Value SoftwareScaleContext::GetDestinationWidth(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), dstW_);
}

Napi::Value SoftwareScaleContext::GetDestinationHeight(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), dstH_);
}

Napi::Value SoftwareScaleContext::GetDestinationPixelFormat(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), dstFormat_);
}

Napi::Value SoftwareScaleContext::GetFlags(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), flags_);
}

} // namespace ffmpeg