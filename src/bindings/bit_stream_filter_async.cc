// Implementation of async BitStreamFilterContext operations using Napi::Promise

#include "bit_stream_filter.h"
#include "packet.h"
#include "common.h"

namespace ffmpeg {

// Worker class for async SendPacket operation
class BSFSendPacketWorker : public Napi::AsyncWorker {
public:
  BSFSendPacketWorker(Napi::Env env, AVBSFContext* context, AVPacket* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = av_bsf_send_packet(context_, packet_);
    
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
  AVBSFContext* context_;
  AVPacket* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Worker class for async ReceivePacket operation
class BSFReceivePacketWorker : public Napi::AsyncWorker {
public:
  BSFReceivePacketWorker(Napi::Env env, AVBSFContext* context, ffmpeg::Packet* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = av_bsf_receive_packet(context_, packet_->GetPacket());
    
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
  AVBSFContext* context_;
  ffmpeg::Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

} // namespace ffmpeg

// Async version of SendPacket
Napi::Value BitStreamFilterContext::SendPacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!ctx_ || !initialized_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Context not initialized").Value());
    return deferred.Promise();
  }
  
  AVPacket* packet = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    if (!info[0].IsObject()) {
      auto deferred = Napi::Promise::Deferred::New(env);
      deferred.Reject(Napi::TypeError::New(env, "Packet expected").Value());
      return deferred.Promise();
    }
    ffmpeg::Packet* packetWrapper = ffmpeg::UnwrapNativeObject<ffmpeg::Packet>(env, info[0], "Packet");
    if (packetWrapper) {
      packet = packetWrapper->GetPacket();
    }
  }
  
  auto* worker = new ffmpeg::BSFSendPacketWorker(env, ctx_, packet);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Async version of ReceivePacket
Napi::Value BitStreamFilterContext::ReceivePacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!ctx_ || !initialized_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Context not initialized").Value());
    return deferred.Promise();
  }
  
  if (info.Length() < 1) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Packet object required").Value());
    return deferred.Promise();
  }
  
  if (!info[0].IsObject()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Packet expected").Value());
    return deferred.Promise();
  }
  
  ffmpeg::Packet* packetWrapper = ffmpeg::UnwrapNativeObjectRequired<ffmpeg::Packet>(env, info[0], "Packet");
  if (!packetWrapper) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Invalid packet object").Value());
    return deferred.Promise();
  }
  
  auto* worker = new ffmpeg::BSFReceivePacketWorker(env, ctx_, packetWrapper);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}