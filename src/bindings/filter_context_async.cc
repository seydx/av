#include "filter_context.h"
#include "frame.h"
#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
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
    frame = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
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
  
  Frame* frame = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  
  auto* worker = new FCBuffersinkGetFrameWorker(env, this, frame);
  worker->Queue();
  return worker->GetPromise();
}

} // namespace ffmpeg