#include "software_resample_context.h"
#include "frame.h"
#include "common.h"
#include <cstring>

namespace ffmpeg {

Napi::FunctionReference SoftwareResampleContext::constructor;

// === Init ===

Napi::Object SoftwareResampleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareResampleContext", {
    // Lifecycle
    InstanceMethod<&SoftwareResampleContext::Alloc>("alloc"),
    InstanceMethod<&SoftwareResampleContext::AllocSetOpts2>("allocSetOpts2"),
    InstanceMethod<&SoftwareResampleContext::Init>("init"),
    InstanceMethod<&SoftwareResampleContext::Free>("free"),
    InstanceMethod<&SoftwareResampleContext::Close>("close"),

    // Operations
    InstanceMethod<&SoftwareResampleContext::Convert>("convert"),
    InstanceMethod<&SoftwareResampleContext::ConvertFrame>("convertFrame"),
    InstanceMethod<&SoftwareResampleContext::ConfigFrame>("configFrame"),

    // Query
    InstanceMethod<&SoftwareResampleContext::IsInitialized>("isInitialized"),
    InstanceMethod<&SoftwareResampleContext::GetDelay>("getDelay"),
    InstanceMethod<&SoftwareResampleContext::GetOutSamples>("getOutSamples"),
    InstanceMethod<&SoftwareResampleContext::NextPts>("nextPts"),

    // Configuration
    InstanceMethod<&SoftwareResampleContext::SetCompensation>("setCompensation"),
    InstanceMethod<&SoftwareResampleContext::SetChannelMapping>("setChannelMapping"),
    InstanceMethod<&SoftwareResampleContext::SetMatrix>("setMatrix"),
    InstanceMethod<&SoftwareResampleContext::DropOutput>("dropOutput"),
    InstanceMethod<&SoftwareResampleContext::InjectSilence>("injectSilence"),

    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &SoftwareResampleContext::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("SoftwareResampleContext", func);
  return exports;
}

// === Lifecycle ===

SoftwareResampleContext::SoftwareResampleContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<SoftwareResampleContext>(info) {
  // Constructor does nothing - user must explicitly call alloc() or allocSetOpts2()
}

SoftwareResampleContext::~SoftwareResampleContext() {
  // Manual cleanup if not already done
  if (ctx_ && !is_freed_) {
    swr_free(&ctx_);
    ctx_ = nullptr;
  }
  // RAII handles cleanup
}

// === Methods ===

Napi::Value SoftwareResampleContext::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Free existing context if any
  if (ctx_ && !is_freed_) { swr_free(&ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  SwrContext* new_ctx = swr_alloc();
  if (!new_ctx) {
    Napi::Error::New(env, "Failed to allocate SwrContext").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (ctx_ && !is_freed_) { swr_free(&ctx_); } ctx_ = new_ctx; is_freed_ = false;
  
  return env.Undefined();
}

Napi::Value SoftwareResampleContext::AllocSetOpts2(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 6) {
    Napi::TypeError::New(env, "Expected 6 arguments (outChLayout, outSampleFmt, outSampleRate, inChLayout, inSampleFmt, inSampleRate)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Parse output parameters
  if (!info[0].IsObject()) {
    Napi::TypeError::New(env, "outChLayout must be an object").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  Napi::Object outChLayoutObj = info[0].As<Napi::Object>();
  AVChannelLayout outChLayout;
  memset(&outChLayout, 0, sizeof(AVChannelLayout));
  
  // Parse channel layout from object
  if (outChLayoutObj.Has("order")) {
    outChLayout.order = static_cast<AVChannelOrder>(outChLayoutObj.Get("order").As<Napi::Number>().Int32Value());
  }
  if (outChLayoutObj.Has("nbChannels")) {
    outChLayout.nb_channels = outChLayoutObj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  if (outChLayoutObj.Has("mask")) {
    bool lossless;
    outChLayout.u.mask = outChLayoutObj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
  
  int outSampleFmt = info[1].As<Napi::Number>().Int32Value();
  int outSampleRate = info[2].As<Napi::Number>().Int32Value();
  
  // Parse input parameters
  if (!info[3].IsObject()) {
    Napi::TypeError::New(env, "inChLayout must be an object").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  Napi::Object inChLayoutObj = info[3].As<Napi::Object>();
  AVChannelLayout inChLayout;
  memset(&inChLayout, 0, sizeof(AVChannelLayout));
  
  // Parse channel layout from object
  if (inChLayoutObj.Has("order")) {
    inChLayout.order = static_cast<AVChannelOrder>(inChLayoutObj.Get("order").As<Napi::Number>().Int32Value());
  }
  if (inChLayoutObj.Has("nbChannels")) {
    inChLayout.nb_channels = inChLayoutObj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  if (inChLayoutObj.Has("mask")) {
    bool lossless;
    inChLayout.u.mask = inChLayoutObj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
  
  int inSampleFmt = info[4].As<Napi::Number>().Int32Value();
  int inSampleRate = info[5].As<Napi::Number>().Int32Value();
  
  // Free existing context if any
  if (ctx_ && !is_freed_) { swr_free(&ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  // Allocate and set options
  SwrContext* new_ctx = nullptr;
  int ret = swr_alloc_set_opts2(&new_ctx,
    &outChLayout, static_cast<AVSampleFormat>(outSampleFmt), outSampleRate,
    &inChLayout, static_cast<AVSampleFormat>(inSampleFmt), inSampleRate,
    0, nullptr);
  
  if (ret >= 0 && new_ctx) {
    if (ctx_ && !is_freed_) { swr_free(&ctx_); } ctx_ = new_ctx; is_freed_ = false;
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::Init(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = swr_init(ctx);
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (ctx_ && !is_freed_) { swr_free(&ctx_); ctx_ = nullptr; is_freed_ = true; };
  
  return env.Undefined();
}

Napi::Value SoftwareResampleContext::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (ctx) {
    swr_close(ctx);
  }
  
  return env.Undefined();
}

// === Operations ===

Napi::Value SoftwareResampleContext::ConvertFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (out, in)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* out = nullptr;
  Frame* in = nullptr;
  
  if (!info[0].IsNull()) {
    out = UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (!out || !out->Get()) {
      Napi::TypeError::New(env, "Invalid output frame").ThrowAsJavaScriptException();
      return Napi::Number::New(env, AVERROR(EINVAL));
    }
  }
  
  if (!info[1].IsNull()) {
    in = UnwrapNativeObject<Frame>(env, info[1], "Frame");
    if (!in || !in->Get()) {
      Napi::TypeError::New(env, "Invalid input frame").ThrowAsJavaScriptException();
      return Napi::Number::New(env, AVERROR(EINVAL));
    }
  }
  
  int ret = swr_convert_frame(ctx, 
    out ? out->Get() : nullptr,
    in ? in->Get() : nullptr);
  
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::ConfigFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (out, in)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* out = nullptr;
  Frame* in = nullptr;
  
  if (!info[0].IsNull()) {
    out = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  }
  
  if (!info[1].IsNull()) {
    in = UnwrapNativeObject<Frame>(env, info[1], "Frame");
  }
  
  int ret = swr_config_frame(ctx,
    out ? out->Get() : nullptr,
    in ? in->Get() : nullptr);
  
  return Napi::Number::New(env, ret);
}

// === Query ===

Napi::Value SoftwareResampleContext::IsInitialized(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    return Napi::Boolean::New(env, false);
  }
  
  int ret = swr_is_initialized(ctx);
  return Napi::Boolean::New(env, ret != 0);
}

Napi::Value SoftwareResampleContext::GetDelay(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    return Napi::BigInt::New(env, int64_t(0));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (base)").ThrowAsJavaScriptException();
    return Napi::BigInt::New(env, int64_t(0));
  }
  
  bool lossless;
  int64_t base = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t delay = swr_get_delay(ctx, base);
  
  return Napi::BigInt::New(env, delay);
}

Napi::Value SoftwareResampleContext::GetOutSamples(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (inSamples)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, 0);
  }
  
  int inSamples = info[0].As<Napi::Number>().Int32Value();
  int outSamples = swr_get_out_samples(ctx, inSamples);
  
  return Napi::Number::New(env, outSamples);
}

Napi::Value SoftwareResampleContext::NextPts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    return Napi::BigInt::New(env, int64_t(0));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (pts)").ThrowAsJavaScriptException();
    return Napi::BigInt::New(env, int64_t(0));
  }
  
  bool lossless;
  int64_t pts = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t nextPts = swr_next_pts(ctx, pts);
  
  return Napi::BigInt::New(env, nextPts);
}

// === Configuration ===

Napi::Value SoftwareResampleContext::SetCompensation(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (sampleDelta, compensationDistance)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int sampleDelta = info[0].As<Napi::Number>().Int32Value();
  int compensationDistance = info[1].As<Napi::Number>().Int32Value();
  
  int ret = swr_set_compensation(ctx, sampleDelta, compensationDistance);
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::SetChannelMapping(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1 || !info[0].IsArray()) {
    Napi::TypeError::New(env, "Expected 1 argument (channelMap array)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Napi::Array channelMapArray = info[0].As<Napi::Array>();
  std::vector<int> channelMap;
  
  for (uint32_t i = 0; i < channelMapArray.Length(); i++) {
    Napi::Value val = channelMapArray[i];
    channelMap.push_back(val.As<Napi::Number>().Int32Value());
  }
  
  int ret = swr_set_channel_mapping(ctx, channelMap.data());
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::SetMatrix(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (matrix, stride)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (!info[0].IsArray()) {
    Napi::TypeError::New(env, "matrix must be an array").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Napi::Array matrixArray = info[0].As<Napi::Array>();
  std::vector<double> matrix;
  
  for (uint32_t i = 0; i < matrixArray.Length(); i++) {
    Napi::Value val = matrixArray[i];
    matrix.push_back(val.As<Napi::Number>().DoubleValue());
  }
  
  int stride = info[1].As<Napi::Number>().Int32Value();
  
  int ret = swr_set_matrix(ctx, matrix.data(), stride);
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::DropOutput(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (count)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int count = info[0].As<Napi::Number>().Int32Value();
  int ret = swr_drop_output(ctx, count);
  
  return Napi::Number::New(env, ret);
}

Napi::Value SoftwareResampleContext::InjectSilence(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  SwrContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (count)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int count = info[0].As<Napi::Number>().Int32Value();
  int ret = swr_inject_silence(ctx, count);
  
  return Napi::Number::New(env, ret);
}

// === Utility ===

Napi::Value SoftwareResampleContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg