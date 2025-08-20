#include "filter_context.h"
#include "frame.h"
#include "hardware_frames_context.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
#include <libavutil/channel_layout.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for FilterContext Operations
// ============================================================================

/**
 * Worker for av_buffersrc_add_frame - Adds frame to buffer source
 */
class FCBuffersrcAddFrameWorker : public Napi::AsyncWorker {
public:
  FCBuffersrcAddFrameWorker(Napi::Env env, FilterContext* ctx, Frame* frame)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      frame_(frame), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = av_buffersrc_add_frame(ctx_->Get(), frame_ ? frame_->Get() : nullptr);
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), ret_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  FilterContext* ctx_;
  Frame* frame_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_buffersink_get_frame - Gets frame from buffer sink
 */
class FCBuffersinkGetFrameWorker : public Napi::AsyncWorker {
public:
  FCBuffersinkGetFrameWorker(Napi::Env env, FilterContext* ctx, Frame* frame)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      frame_(frame), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = av_buffersink_get_frame(ctx_->Get(), frame_->Get());
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), ret_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  FilterContext* ctx_;
  Frame* frame_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// FilterContext Async Method Implementations
// ============================================================================

Napi::Value FilterContext::BuffersrcAddFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Frame* frame = nullptr;
  if (!info[0].IsNull() && !info[0].IsUndefined()) {
    frame = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  }
  
  auto* worker = new FCBuffersrcAddFrameWorker(env, this, frame);
  worker->Queue();
  return worker->GetPromise();
}

Napi::Value FilterContext::BuffersinkGetFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Frame expected").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Frame* frame = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  
  auto* worker = new FCBuffersinkGetFrameWorker(env, this, frame);
  worker->Queue();
  return worker->GetPromise();
}

Napi::Value FilterContext::BuffersrcParametersSet(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse parameters object
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Parameters object expected").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object params = info[0].As<Napi::Object>();
  
  // Allocate parameters structure
  AVBufferSrcParameters* par = av_buffersrc_parameters_alloc();
  if (!par) {
    Napi::Error::New(env, "Failed to allocate buffer source parameters").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Set video parameters
  if (params.Has("width")) {
    par->width = params.Get("width").As<Napi::Number>().Int32Value();
  }
  if (params.Has("height")) {
    par->height = params.Get("height").As<Napi::Number>().Int32Value();
  }
  if (params.Has("format")) {
    par->format = params.Get("format").As<Napi::Number>().Int32Value();
  }
  if (params.Has("timeBase")) {
    Napi::Object tb = params.Get("timeBase").As<Napi::Object>();
    par->time_base.num = tb.Get("num").As<Napi::Number>().Int32Value();
    par->time_base.den = tb.Get("den").As<Napi::Number>().Int32Value();
  }
  if (params.Has("frameRate")) {
    Napi::Object fr = params.Get("frameRate").As<Napi::Object>();
    par->frame_rate.num = fr.Get("num").As<Napi::Number>().Int32Value();
    par->frame_rate.den = fr.Get("den").As<Napi::Number>().Int32Value();
  }
  if (params.Has("sampleAspectRatio")) {
    Napi::Object sar = params.Get("sampleAspectRatio").As<Napi::Object>();
    par->sample_aspect_ratio.num = sar.Get("num").As<Napi::Number>().Int32Value();
    par->sample_aspect_ratio.den = sar.Get("den").As<Napi::Number>().Int32Value();
  }
  
  // Set hardware frames context if provided
  if (params.Has("hwFramesCtx") && !params.Get("hwFramesCtx").IsNull()) {
    HardwareFramesContext* hwFramesCtx = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(params.Get("hwFramesCtx").As<Napi::Object>());
    if (hwFramesCtx && hwFramesCtx->Get()) {
      par->hw_frames_ctx = av_buffer_ref(hwFramesCtx->Get());
    }
  }
  
  // Set audio parameters
  if (params.Has("sampleRate")) {
    par->sample_rate = params.Get("sampleRate").As<Napi::Number>().Int32Value();
  }
  if (params.Has("channelLayout")) {
    uint64_t layout_mask = params.Get("channelLayout").As<Napi::BigInt>().Uint64Value(nullptr);
    av_channel_layout_from_mask(&par->ch_layout, layout_mask);
  }
  
  // Apply parameters to buffer source
  int ret = av_buffersrc_parameters_set(ctx, par);
  
  // Free parameters (av_buffersrc_parameters_set makes internal copies)
  av_free(par);
  
  return Napi::Number::New(env, ret);
}

} // namespace ffmpeg