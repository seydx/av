// Implementation of async CodecContext operations using Napi::Promise

#include "codec_context.h"
#include "codec.h"
#include "packet.h"
#include "frame.h"
#include "dictionary.h"
#include "common.h"

namespace ffmpeg {

// Worker class for async SendPacket operation
class SendPacketWorker : public Napi::AsyncWorker {
public:
  SendPacketWorker(Napi::Env env, AVCodecContext* context, AVPacket* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = avcodec_send_packet(context_, packet_);
    
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
  AVCodecContext* context_;
  AVPacket* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of SendPacket
Napi::Value CodecContext::SendPacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_.Get()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Codec context not initialized").Value());
    return deferred.Promise();
  }
  
  AVPacket* packet = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Packet* pkt = UnwrapNativeObject<Packet>(env, info[0], "Packet");
    if (pkt) {
      packet = pkt->GetPacket();
    }
  }
  
  auto* worker = new SendPacketWorker(env, context_.Get(), packet);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async ReceiveFrame operation
class ReceiveFrameWorker : public Napi::AsyncWorker {
public:
  ReceiveFrameWorker(Napi::Env env, AVCodecContext* context, Frame* frame)
    : AsyncWorker(env),
      context_(context),
      frame_(frame),
      result_(0) {}

  void Execute() override {
    result_ = avcodec_receive_frame(context_, frame_->GetFrame());
    
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
  AVCodecContext* context_;
  Frame* frame_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of ReceiveFrame
Napi::Value CodecContext::ReceiveFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_.Get()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Codec context not initialized").Value());
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
  
  auto* worker = new ReceiveFrameWorker(env, context_.Get(), frame);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async SendFrame operation
class SendFrameWorker : public Napi::AsyncWorker {
public:
  SendFrameWorker(Napi::Env env, AVCodecContext* context, AVFrame* frame)
    : AsyncWorker(env),
      context_(context),
      frame_(frame),
      result_(0) {}

  void Execute() override {
    result_ = avcodec_send_frame(context_, frame_);
    
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
  AVCodecContext* context_;
  AVFrame* frame_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of SendFrame
Napi::Value CodecContext::SendFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_.Get()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Codec context not initialized").Value());
    return deferred.Promise();
  }
  
  AVFrame* frame = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Frame* frm = UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (frm) {
      frame = frm->GetFrame();
    }
  }
  
  auto* worker = new SendFrameWorker(env, context_.Get(), frame);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async ReceivePacket operation
class ReceivePacketWorker : public Napi::AsyncWorker {
public:
  ReceivePacketWorker(Napi::Env env, AVCodecContext* context, Packet* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = avcodec_receive_packet(context_, packet_->GetPacket());
    
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
  AVCodecContext* context_;
  Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of ReceivePacket
Napi::Value CodecContext::ReceivePacketAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_.Get()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Codec context not initialized").Value());
    return deferred.Promise();
  }
  
  if (info.Length() < 1) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Packet object required").Value());
    return deferred.Promise();
  }
  
  Packet* packet = UnwrapNativeObjectRequired<Packet>(env, info[0], "Packet");
  if (!packet) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Invalid packet object").Value());
    return deferred.Promise();
  }
  
  auto* worker = new ReceivePacketWorker(env, context_.Get(), packet);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async Open operation
class OpenWorker : public Napi::AsyncWorker {
public:
  OpenWorker(Napi::Env env, AVCodecContext* context, const AVCodec* codec, AVDictionary* options)
    : AsyncWorker(env),
      context_(context),
      codec_(codec),
      options_(options),
      result_(0) {}

  ~OpenWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    result_ = avcodec_open2(context_, codec_, options_ ? &options_ : nullptr);
    
    if (result_ < 0) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(errbuf);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  AVCodecContext* context_;
  const AVCodec* codec_;
  AVDictionary* options_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of Open
Napi::Value CodecContext::OpenAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_.Get()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Codec context not initialized").Value());
    return deferred.Promise();
  }
  
  if (!context_.Get()->codec) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "No codec set").Value());
    return deferred.Promise();
  }
  
  AVDictionary* options = nullptr;
  if (info.Length() > 0 && info[0].IsObject()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dict) {
      av_dict_copy(&options, dict->GetDict(), 0);
    }
  }
  
  auto* worker = new OpenWorker(env, context_.Get(), context_.Get()->codec, options);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg