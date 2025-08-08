#include "software_scale_context.h"
#include "frame.h"

namespace ffmpeg {

Napi::FunctionReference SoftwareScaleContext::constructor;

Napi::Object SoftwareScaleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareScaleContext", {
    // Static factory method
    StaticMethod<&SoftwareScaleContext::Create>("create"),
    
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
  // Constructor is private, use Create() static method
}

SoftwareScaleContext::~SoftwareScaleContext() {
  if (context_) {
    sws_freeContext(context_);
    context_ = nullptr;
  }
}

// Static factory method
Napi::Value SoftwareScaleContext::Create(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 7) {
    Napi::TypeError::New(env, 
      "Expected 7 arguments: srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags")
      .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int srcW = info[0].As<Napi::Number>().Int32Value();
  int srcH = info[1].As<Napi::Number>().Int32Value();
  AVPixelFormat srcFormat = static_cast<AVPixelFormat>(info[2].As<Napi::Number>().Int32Value());
  int dstW = info[3].As<Napi::Number>().Int32Value();
  int dstH = info[4].As<Napi::Number>().Int32Value();
  AVPixelFormat dstFormat = static_cast<AVPixelFormat>(info[5].As<Napi::Number>().Int32Value());
  int flags = info[6].As<Napi::Number>().Int32Value();
  
  // Create context
  SwsContext* context = sws_getContext(
    srcW, srcH, srcFormat,
    dstW, dstH, dstFormat,
    flags,
    nullptr, nullptr, nullptr
  );
  
  if (!context) {
    Napi::Error::New(env, "Failed to create software scale context").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create wrapper object
  Napi::Object obj = constructor.New({});
  SoftwareScaleContext* ssc = Napi::ObjectWrap<SoftwareScaleContext>::Unwrap(obj);
  
  // Set properties
  ssc->context_ = context;
  ssc->srcW_ = srcW;
  ssc->srcH_ = srcH;
  ssc->srcFormat_ = srcFormat;
  ssc->dstW_ = dstW;
  ssc->dstH_ = dstH;
  ssc->dstFormat_ = dstFormat;
  ssc->flags_ = flags;
  
  return obj;
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
  
  Napi::Object srcObj = info[0].As<Napi::Object>();
  Frame* src = Napi::ObjectWrap<Frame>::Unwrap(srcObj);
  
  Napi::Object dstObj = info[1].As<Napi::Object>();
  Frame* dst = Napi::ObjectWrap<Frame>::Unwrap(dstObj);
  
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