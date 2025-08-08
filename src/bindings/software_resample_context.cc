#include "software_resample_context.h"
#include "frame.h"
#include "common.h"

namespace ffmpeg {

Napi::FunctionReference SoftwareResampleContext::constructor;

Napi::Object SoftwareResampleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareResampleContext", {
    // Methods
    InstanceMethod<&SoftwareResampleContext::ConvertFrame>("convertFrame"),
    InstanceMethod<&SoftwareResampleContext::GetDelay>("getDelay"),
    InstanceMethod<&SoftwareResampleContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("SoftwareResampleContext", func);
  return exports;
}

SoftwareResampleContext::SoftwareResampleContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<SoftwareResampleContext>(info) {
  Napi::Env env = info.Env();
  
  // Allocate resample context
  context_ = swr_alloc();
  if (!context_) {
    Napi::Error::New(env, "Failed to allocate resample context").ThrowAsJavaScriptException();
    return;
  }
}

SoftwareResampleContext::~SoftwareResampleContext() {
  if (context_) {
    swr_free(&context_);
    context_ = nullptr;
  }
}

// Convert frame
Napi::Value SoftwareResampleContext::ConvertFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Resample context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Source and destination frames required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVFrame* src = nullptr;
  AVFrame* dst = nullptr;
  
  // Source frame (can be null for flushing)
  if (info.Length() > 0) {
    Frame* srcFrame = ffmpeg::UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (srcFrame) {
      src = srcFrame->GetFrame();
    }
  }
  
  // Destination frame (required)
  Frame* dstFrame = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[1], "Frame");
  if (!dstFrame) return env.Undefined();
  dst = dstFrame->GetFrame();
  
  int ret = swr_convert_frame(context_, dst, src);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to convert frame");
  }
  
  return env.Undefined();
}

// Get delay
Napi::Value SoftwareResampleContext::GetDelay(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  if (info.Length() < 1 || !info[0].IsBigInt()) {
    Napi::TypeError::New(env, "Base sample rate required as BigInt").ThrowAsJavaScriptException();
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  bool lossless;
  int64_t base = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  
  int64_t delay = swr_get_delay(context_, base);
  return Napi::BigInt::New(env, delay);
}

// Dispose
Napi::Value SoftwareResampleContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_) {
    swr_free(&context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

} // namespace ffmpeg