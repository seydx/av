#include "software_scale_context.h"
#include "frame.h"
#include "common.h"


namespace ffmpeg {

Napi::FunctionReference SoftwareScaleContext::constructor;

// === Init ===

Napi::Object SoftwareScaleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareScaleContext", {
    // Lifecycle
    InstanceMethod<&SoftwareScaleContext::AllocContext>("allocContext"),
    InstanceMethod<&SoftwareScaleContext::GetContext>("getContext"),
    InstanceMethod<&SoftwareScaleContext::InitContext>("initContext"),
    InstanceMethod<&SoftwareScaleContext::FreeContext>("freeContext"),

    // Operations
    InstanceMethod<&SoftwareScaleContext::Scale>("scale"),
    InstanceMethod<&SoftwareScaleContext::ScaleFrame>("scaleFrame"),

    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &SoftwareScaleContext::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("SoftwareScaleContext", func);
  return exports;
}

// === Lifecycle ===

SoftwareScaleContext::SoftwareScaleContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<SoftwareScaleContext>(info) {
  // Constructor does nothing - user must explicitly call allocContext() or getContext()
}

SoftwareScaleContext::~SoftwareScaleContext() {
  // Manual cleanup if not already done
  if (ctx_ && !is_freed_) {
    sws_freeContext(ctx_);
    ctx_ = nullptr;
  }
  // RAII handles cleanup
}

// === Methods ===

Napi::Value SoftwareScaleContext::AllocContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Free existing context if any
  if (ctx_ && !is_freed_) { sws_freeContext(ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  SwsContext* new_ctx = sws_alloc_context();
  if (!new_ctx) {
    Napi::Error::New(env, "Failed to allocate SwsContext").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (ctx_ && !is_freed_) { sws_freeContext(ctx_); } ctx_ = new_ctx; is_freed_ = false;
  
  return env.Undefined();
}

Napi::Value SoftwareScaleContext::GetContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 7) {
    Napi::TypeError::New(env, "Expected 7 arguments (srcW, srcH, srcFormat, dstW, dstH, dstFormat, flags)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int srcW = info[0].As<Napi::Number>().Int32Value();
  int srcH = info[1].As<Napi::Number>().Int32Value();
  int srcFormat = info[2].As<Napi::Number>().Int32Value();
  int dstW = info[3].As<Napi::Number>().Int32Value();
  int dstH = info[4].As<Napi::Number>().Int32Value();
  int dstFormat = info[5].As<Napi::Number>().Int32Value();
  int flags = info[6].As<Napi::Number>().Int32Value();
  
  // Free existing context if any
  if (ctx_ && !is_freed_) { sws_freeContext(ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  // Create new context
  SwsContext* new_ctx = sws_getContext(
    srcW, srcH, static_cast<AVPixelFormat>(srcFormat),
    dstW, dstH, static_cast<AVPixelFormat>(dstFormat),
    flags, nullptr, nullptr, nullptr
  );
  
  if (!new_ctx) {
    Napi::Error::New(env, "Failed to create SwsContext").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (ctx_ && !is_freed_) { sws_freeContext(ctx_); } ctx_ = new_ctx; is_freed_ = false;
  
  return env.Undefined();
}

Napi::Value SoftwareScaleContext::InitContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwsContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = sws_init_context(ctx, nullptr, nullptr);
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareScaleContext::FreeContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (ctx_ && !is_freed_) { sws_freeContext(ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  return env.Undefined();
}

Napi::Value SoftwareScaleContext::Scale(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwsContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 6) {
    Napi::TypeError::New(env, "Expected 6 arguments (srcSlice, srcStride, srcSliceY, srcSliceH, dst, dstStride)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Parse source data
  if (!info[0].IsArray() || !info[1].IsArray()) {
    Napi::TypeError::New(env, "srcSlice and srcStride must be arrays").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Napi::Array srcSlice = info[0].As<Napi::Array>();
  Napi::Array srcStride = info[1].As<Napi::Array>();
  int srcSliceY = info[2].As<Napi::Number>().Int32Value();
  int srcSliceH = info[3].As<Napi::Number>().Int32Value();
  
  // Parse destination data
  if (!info[4].IsArray() || !info[5].IsArray()) {
    Napi::TypeError::New(env, "dst and dstStride must be arrays").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Napi::Array dst = info[4].As<Napi::Array>();
  Napi::Array dstStride = info[5].As<Napi::Array>();
  
  // Prepare source pointers and strides
  const uint8_t* srcSlicePtr[4] = {nullptr, nullptr, nullptr, nullptr};
  int srcStrideVal[4] = {0, 0, 0, 0};
  
  for (uint32_t i = 0; i < srcSlice.Length() && i < 4; i++) {
    Napi::Value val = srcSlice[i];
    if (val.IsBuffer()) {
      Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
      srcSlicePtr[i] = buf.Data();
    }
    
    if (i < srcStride.Length()) {
      Napi::Value strideVal = srcStride[i];
      srcStrideVal[i] = strideVal.As<Napi::Number>().Int32Value();
    }
  }
  
  // Prepare destination pointers and strides
  uint8_t* dstPtr[4] = {nullptr, nullptr, nullptr, nullptr};
  int dstStrideVal[4] = {0, 0, 0, 0};
  
  for (uint32_t i = 0; i < dst.Length() && i < 4; i++) {
    Napi::Value val = dst[i];
    if (val.IsBuffer()) {
      Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
      dstPtr[i] = buf.Data();
    }
    
    if (i < dstStride.Length()) {
      Napi::Value strideVal = dstStride[i];
      dstStrideVal[i] = strideVal.As<Napi::Number>().Int32Value();
    }
  }
  
  // Perform scaling
  int ret = sws_scale(ctx, srcSlicePtr, srcStrideVal, srcSliceY, srcSliceH, dstPtr, dstStrideVal);
  
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareScaleContext::ScaleFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwsContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (dst, src)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* dst = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  Frame* src = UnwrapNativeObject<Frame>(env, info[1], "Frame");
  
  if (!dst || !dst->Get() || !src || !src->Get()) {
    Napi::TypeError::New(env, "Invalid frame objects").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = sws_scale_frame(ctx, dst->Get(), src->Get());
  return Napi::Number::New(env, ret);
}

// === Utility ===

Napi::Value SoftwareScaleContext::Dispose(const Napi::CallbackInfo& info) {
  return FreeContext(info);
}

} // namespace ffmpeg