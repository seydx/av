#include "hardware_frames_context.h"
#include "frame.h"
#include <napi.h>

extern "C" {
#include <libavutil/hwcontext.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for HardwareFramesContext Operations
// ============================================================================

/**
 * Worker for av_hwframe_transfer_data - Transfer data between frames
 */
class HWFCTransferDataWorker : public Napi::AsyncWorker {
public:
  HWFCTransferDataWorker(Napi::Env env, Frame* dst, Frame* src, int flags)
    : Napi::AsyncWorker(env), 
      dst_(dst),
      src_(src),
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
  Frame* dst_;
  Frame* src_;
  int flags_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// HardwareFramesContext Async Method Implementations
// ============================================================================

Napi::Value HardwareFramesContext::TransferData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (dst, src)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Frame* dst = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  Frame* src = Napi::ObjectWrap<Frame>::Unwrap(info[1].As<Napi::Object>());
  
  if (!dst || !dst->Get() || !src || !src->Get()) {
    Napi::Error::New(env, "Invalid frame(s)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int flags = 0;
  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  auto* worker = new HWFCTransferDataWorker(env, dst, src, flags);
  worker->Queue();
  return worker->GetPromise();
}

} // namespace ffmpeg