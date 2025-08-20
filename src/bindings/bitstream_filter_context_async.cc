#include "bitstream_filter_context.h"
#include "packet.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavcodec/bsf.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for BitStreamFilterContext Operations
// ============================================================================

/**
 * Worker for av_bsf_send_packet - Sends packet to bitstream filter
 */
class BSFSendPacketWorker : public Napi::AsyncWorker {
public:
  BSFSendPacketWorker(Napi::Env env, BitStreamFilterContext* context, AVPacket* packet)
    : Napi::AsyncWorker(env), 
      context_(context), 
      packet_(packet), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = av_bsf_send_packet(context_->Get(), packet_);
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
  BitStreamFilterContext* context_;
  AVPacket* packet_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_bsf_receive_packet - Receives packet from bitstream filter
 */
class BSFReceivePacketWorker : public Napi::AsyncWorker {
public:
  BSFReceivePacketWorker(Napi::Env env, BitStreamFilterContext* context, AVPacket* packet)
    : Napi::AsyncWorker(env), 
      context_(context), 
      packet_(packet), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = av_bsf_receive_packet(context_->Get(), packet_);
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
  BitStreamFilterContext* context_;
  AVPacket* packet_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// Method Implementations (called from main thread)
// ============================================================================

Napi::Value BitStreamFilterContext::SendPacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "BitStreamFilterContext not allocated")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!is_initialized_) {
    Napi::Error::New(env, "BitStreamFilterContext not initialized")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVPacket* packet = nullptr;
  
  // Check if packet is provided (null packet means EOF)
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    if (!info[0].IsObject()) {
      Napi::TypeError::New(env, "Packet object expected")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    Packet* pkt = UnwrapNativeObject<Packet>(env, info[0].As<Napi::Object>(), "Packet");
    if (!pkt) {
      Napi::Error::New(env, "Invalid Packet object")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    packet = pkt->Get();
  }
  
  auto* worker = new BSFSendPacketWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value BitStreamFilterContext::ReceivePacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "BitStreamFilterContext not allocated")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!is_initialized_) {
    Napi::Error::New(env, "BitStreamFilterContext not initialized")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Packet object required")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Packet* packet = UnwrapNativeObject<Packet>(env, info[0].As<Napi::Object>(), "Packet");
  if (!packet) {
    Napi::Error::New(env, "Invalid Packet object")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!packet->Get()) {
    Napi::Error::New(env, "Packet not allocated")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  auto* worker = new BSFReceivePacketWorker(env, this, packet->Get());
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg