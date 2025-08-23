#include "software_resample_context.h"
#include <napi.h>

extern "C" {
#include <libswresample/swresample.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for SoftwareResampleContext Operations
// ============================================================================

/**
 * Worker for swr_convert - Converts audio samples
 */
class SwrConvertWorker : public Napi::AsyncWorker {
public:
  SwrConvertWorker(Napi::Env env, SoftwareResampleContext* ctx,
                   Napi::Array outArray, int out_count,
                   Napi::Array inArray, int in_count)
    : Napi::AsyncWorker(env), 
      ctx_(ctx),
      out_count_(out_count),
      in_count_(in_count),
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {
    
    // Store persistent references to buffers
    if (!outArray.IsNull() && !outArray.IsUndefined()) {
      out_refs_ = Napi::Persistent(outArray);
      ParseBuffers(outArray, out_buffers_, out_ptrs_);
    }
    
    if (!inArray.IsNull() && !inArray.IsUndefined()) {
      in_refs_ = Napi::Persistent(inArray);
      ParseBuffers(inArray, const_cast<uint8_t**>(in_buffers_), const_cast<uint8_t**>(in_ptrs_));
    }
  }
  
  ~SwrConvertWorker() {
    if (!out_refs_.IsEmpty()) out_refs_.Unref();
    if (!in_refs_.IsEmpty()) in_refs_.Unref();
  }

  void Execute() override {
    ret_ = swr_convert(ctx_->Get(), 
                       out_refs_.IsEmpty() ? nullptr : out_ptrs_, 
                       out_count_, 
                       in_refs_.IsEmpty() ? nullptr : const_cast<const uint8_t**>(in_ptrs_), 
                       in_count_);
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
  void ParseBuffers(Napi::Array arr, uint8_t* buffers[8], uint8_t* ptrs[8]) {
    for (uint32_t i = 0; i < arr.Length() && i < 8; i++) {
      Napi::Value val = arr[i];
      if (val.IsBuffer()) {
        Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
        ptrs[i] = buf.Data();
      } else {
        ptrs[i] = nullptr;
      }
    }
    // Fill remaining with nullptr
    for (uint32_t i = arr.Length(); i < 8; i++) {
      ptrs[i] = nullptr;
    }
  }

  SoftwareResampleContext* ctx_;
  Napi::Reference<Napi::Array> out_refs_;
  Napi::Reference<Napi::Array> in_refs_;
  uint8_t* out_buffers_[8] = {nullptr};
  uint8_t* out_ptrs_[8] = {nullptr};
  uint8_t* in_buffers_[8] = {nullptr};
  uint8_t* in_ptrs_[8] = {nullptr};
  int out_count_;
  int in_count_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// SoftwareResampleContext Async Method Implementations
// ============================================================================

Napi::Value SoftwareResampleContext::ConvertAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!ctx_) {
    Napi::TypeError::New(env, "SoftwareResampleContext is not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (out, out_count, in, in_count)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int out_count = info[1].As<Napi::Number>().Int32Value();
  int in_count = info[3].As<Napi::Number>().Int32Value();
  
  Napi::Array outArray = info[0].IsNull() ? Napi::Array::New(env) : 
                         info[0].IsArray() ? info[0].As<Napi::Array>() : Napi::Array::New(env);
  Napi::Array inArray = info[2].IsNull() ? Napi::Array::New(env) :
                        info[2].IsArray() ? info[2].As<Napi::Array>() : Napi::Array::New(env);
  
  auto* worker = new SwrConvertWorker(env, this, outArray, out_count, inArray, in_count);
  worker->Queue();
  return worker->GetPromise();
}

} // namespace ffmpeg