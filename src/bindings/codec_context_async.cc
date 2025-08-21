#include "codec_context.h"
#include "packet.h"
#include "frame.h"
#include "codec.h"
#include "dictionary.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for CodecContext Operations
// ============================================================================

/**
 * Worker for avcodec_open2 - Opens codec context
 */
class CCOpen2Worker : public Napi::AsyncWorker {
public:
  CCOpen2Worker(Napi::Env env, CodecContext* ctx, 
              const AVCodec* codec, AVDictionary* options)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      codec_(codec), 
      options_(options), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  ~CCOpen2Worker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    ret_ = avcodec_open2(ctx_->context_, codec_, options_ ? &options_ : nullptr);
    if (ret_ >= 0) {
      ctx_->is_open_ = true;
    }
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
  CodecContext* ctx_;
  const AVCodec* codec_;
  AVDictionary* options_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avcodec_send_packet - Sends packet to decoder
 */
class CCSendPacketWorker : public Napi::AsyncWorker {
public:
  CCSendPacketWorker(Napi::Env env, CodecContext* ctx, Packet* packet)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      packet_(packet), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = avcodec_send_packet(ctx_->context_, packet_ ? packet_->Get() : nullptr);
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
  CodecContext* ctx_;
  Packet* packet_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avcodec_receive_frame - Receives frame from decoder
 */
class CCReceiveFrameWorker : public Napi::AsyncWorker {
public:
  CCReceiveFrameWorker(Napi::Env env, CodecContext* ctx, Frame* frame)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      frame_(frame), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = avcodec_receive_frame(ctx_->context_, frame_->Get());
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
  CodecContext* ctx_;
  Frame* frame_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avcodec_send_frame - Sends frame to encoder
 */
class CCSendFrameWorker : public Napi::AsyncWorker {
public:
  CCSendFrameWorker(Napi::Env env, CodecContext* ctx, Frame* frame)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      frame_(frame), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    // Basic null checks
    if (!ctx_ || !ctx_->context_) {
      ret_ = AVERROR(EINVAL);
      return;
    }
    
    // Additional validation for audio frames to prevent crashes
    if (frame_ && frame_->Get() && ctx_->context_->codec_type == AVMEDIA_TYPE_AUDIO) {
      AVFrame* f = frame_->Get();
      AVCodecContext* avctx = ctx_->context_;
      
      // Check channel count mismatch
      if (f->ch_layout.nb_channels != avctx->ch_layout.nb_channels) {
        // This would cause a crash in FFmpeg when it tries to access non-existent channel data
        ret_ = AVERROR(EINVAL);
        return;
      }
      
      // Check sample format mismatch (less critical but still important)
      if (f->format != avctx->sample_fmt) {
        ret_ = AVERROR(EINVAL);
        return;
      }
    }
    
    // Simply pass to FFmpeg and let it handle validation
    ret_ = avcodec_send_frame(ctx_->context_, frame_ ? frame_->Get() : nullptr);
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
  CodecContext* ctx_;
  Frame* frame_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avcodec_receive_packet - Receives packet from encoder
 */
class CCReceivePacketWorker : public Napi::AsyncWorker {
public:
  CCReceivePacketWorker(Napi::Env env, CodecContext* ctx, Packet* packet)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      packet_(packet), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = avcodec_receive_packet(ctx_->context_, packet_->Get());
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
  CodecContext* ctx_;
  Packet* packet_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// Async Method Implementations
// ============================================================================

Napi::Value CodecContext::Open2Async(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  const AVCodec* codec = nullptr;
  AVDictionary* options = nullptr;
  
  // Parse arguments (codec, options) - both optional
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object codecObj = info[0].As<Napi::Object>();
    Codec* codecWrapper = UnwrapNativeObject<Codec>(env, codecObj, "Codec");
    codec = codecWrapper->Get();
  }
  
  if (info.Length() > 1 && !info[1].IsNull() && !info[1].IsUndefined()) {
    Napi::Object dictObj = info[1].As<Napi::Object>();
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, dictObj, "Dictionary");
    if (dict) {
      options = dict->Get();
    }
  }
  
  auto* worker = new CCOpen2Worker(env, this, codec, options);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value CodecContext::SendPacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Packet* packet = nullptr;
  
  // Parse packet argument - can be null for flush
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object pktObj = info[0].As<Napi::Object>();
    packet = UnwrapNativeObject<Packet>(env, pktObj, "Packet");
  }
  
  auto* worker = new CCSendPacketWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value CodecContext::ReceiveFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (frame)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Object frameObj = info[0].As<Napi::Object>();
  Frame* frame = UnwrapNativeObject<Frame>(env, frameObj, "Frame");
  if (!frame) {
    Napi::TypeError::New(env, "Invalid frame object")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  auto* worker = new CCReceiveFrameWorker(env, this, frame);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value CodecContext::SendFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Frame* frame = nullptr;
  
  // Parse frame argument - can be null for flush
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object frameObj = info[0].As<Napi::Object>();
    frame = UnwrapNativeObject<Frame>(env, frameObj, "Frame");
  }
  
  auto* worker = new CCSendFrameWorker(env, this, frame);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value CodecContext::ReceivePacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (packet)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Object pktObj = info[0].As<Napi::Object>();
  Packet* packet = UnwrapNativeObject<Packet>(env, pktObj, "Packet");
  if (!packet) {
    Napi::TypeError::New(env, "Invalid packet object")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  auto* worker = new CCReceivePacketWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg