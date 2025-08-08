// Implementation of async FilterContext operations using Napi::Promise

#include "filter_context.h"
#include "frame.h"
#include "common.h"

extern "C" {
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

// Worker class for async BufferSrcAddFrame operation
class BufferSrcAddFrameWorker : public Napi::AsyncWorker {
public:
  BufferSrcAddFrameWorker(Napi::Env env, AVFilterContext* context, AVFrame* frame, int flags)
    : AsyncWorker(env),
      context_(context),
      frame_(frame),
      flags_(flags),
      result_(0) {}

  void Execute() override {
    result_ = av_buffersrc_add_frame_flags(context_, frame_, flags_);
    
    if (result_ < 0 && result_ != AVERROR(EAGAIN) && result_ != AVERROR_EOF) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(errbuf);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  AVFilterContext* context_;
  AVFrame* frame_;
  int flags_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of BufferSrcAddFrame
Napi::Value FilterContext::BufferSrcAddFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Filter context not initialized").Value());
    return deferred.Promise();
  }
  
  AVFrame* frame = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Frame* frm = UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (frm) {
      frame = frm->GetFrame();
    }
  }
  
  int flags = 0;
  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  auto* worker = new BufferSrcAddFrameWorker(env, context_, frame, flags);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async BufferSinkGetFrame operation
class BufferSinkGetFrameWorker : public Napi::AsyncWorker {
public:
  BufferSinkGetFrameWorker(Napi::Env env, AVFilterContext* context, Frame* frame)
    : AsyncWorker(env),
      context_(context),
      frame_(frame),
      result_(0) {}

  void Execute() override {
    result_ = av_buffersink_get_frame(context_, frame_->GetFrame());
    
    if (result_ < 0 && result_ != AVERROR(EAGAIN) && result_ != AVERROR_EOF) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(errbuf);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  AVFilterContext* context_;
  Frame* frame_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of BufferSinkGetFrame
Napi::Value FilterContext::BufferSinkGetFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Filter context not initialized").Value());
    return deferred.Promise();
  }
  
  if (info.Length() < 1) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Frame object required").Value());
    return deferred.Promise();
  }
  
  Frame* frame = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!frame) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Invalid frame object").Value());
    return deferred.Promise();
  }
  
  auto* worker = new BufferSinkGetFrameWorker(env, context_, frame);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg