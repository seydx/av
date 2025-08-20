#include "frame.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavutil/frame.h>
#include <libavutil/hwcontext.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for Frame Operations
// ============================================================================

/**
 * Worker for av_hwframe_transfer_data - Transfer data between hardware and software frames
 */
class HwframeTransferDataWorker : public Napi::AsyncWorker {
public:
  HwframeTransferDataWorker(Napi::Env env, Frame* src, Frame* dst, int flags)
    : Napi::AsyncWorker(env), 
      src_(src),
      dst_(dst),
      flags_(flags),
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = av_hwframe_transfer_data(dst_->Get(), src_->Get(), flags_);
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
  Frame* src_;
  Frame* dst_;
  int flags_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// Frame Async Method Implementations
// ============================================================================

Napi::Value Frame::HwframeTransferData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    Napi::Error::New(env, "Frame not allocated").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected destination frame").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (!info[0].IsObject()) {
    Napi::TypeError::New(env, "Destination must be a Frame object").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Frame* dst = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  if (!dst || !dst->frame_) {
    Napi::Error::New(env, "Invalid destination frame").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int flags = 0;
  if (info.Length() >= 2 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  auto* worker = new HwframeTransferDataWorker(env, this, dst, flags);
  worker->Queue();
  return worker->GetPromise();
}

} // namespace ffmpeg