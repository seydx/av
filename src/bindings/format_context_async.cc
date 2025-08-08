// Implementation of async FormatContext operations using Napi::Promise

#include "format_context.h"
#include "input_format.h"
#include "dictionary.h"
#include "packet.h"
#include "common.h"

namespace ffmpeg {

// Worker class for async OpenInput operation
class OpenInputWorker : public Napi::AsyncWorker {
public:
  OpenInputWorker(Napi::Env env, FormatContext* context, 
                   const std::string& url, 
                   AVInputFormat* format, 
                   AVDictionary* options)
    : AsyncWorker(env),
      context_(context),
      url_(url),
      input_format_(format),
      options_(options),
      result_(0) {}

  ~OpenInputWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  // This code runs on worker thread
  void Execute() override {
    AVFormatContext* ctx = nullptr;
    
    // Open the input
    result_ = avformat_open_input(&ctx, url_.c_str(), input_format_, options_ ? &options_ : nullptr);
    
    if (result_ < 0) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(errbuf);
    } else {
      // Store the context for OnOK
      opened_context_ = ctx;
    }
  }

  // This code runs on main thread after Execute completes
  void OnOK() override {
    Napi::HandleScope scope(Env());
    
    // Update the FormatContext with the opened context
    context_->SetContext(opened_context_);
    
    // Resolve the promise
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  FormatContext* context_;
  std::string url_;
  AVInputFormat* input_format_;
  AVDictionary* options_;
  AVFormatContext* opened_context_ = nullptr;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of OpenInput
Napi::Value FormatContext::OpenInputAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "URL string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  
  // Handle InputFormat (2nd parameter)
  AVInputFormat* input_format = nullptr;
  if (info.Length() > 1) {
    InputFormat* inputFormatWrapper = ffmpeg::UnwrapNativeObject<InputFormat>(env, info[1], "InputFormat");
    if (inputFormatWrapper) {
      input_format = const_cast<AVInputFormat*>(inputFormatWrapper->GetFormat());
    }
  }
  
  // Handle Dictionary options (3rd parameter)
  AVDictionary* options = nullptr;
  if (info.Length() > 2) {
    Dictionary* dictWrapper = ffmpeg::UnwrapNativeObject<Dictionary>(env, info[2], "Dictionary");
    if (dictWrapper) {
      // Create a copy of the dictionary since it might be modified
      av_dict_copy(&options, dictWrapper->GetDict(), 0);
    }
  }
  
  // Create and queue the async worker
  auto* worker = new OpenInputWorker(env, this, url, input_format, options);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async ReadFrame operation
class ReadFrameWorker : public Napi::AsyncWorker {
public:
  ReadFrameWorker(Napi::Env env, AVFormatContext* context, Packet* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = av_read_frame(context_, packet_->GetPacket());
    
    if (result_ < 0 && result_ != AVERROR_EOF) {
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
  AVFormatContext* context_;
  Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of ReadFrame
Napi::Value FormatContext::ReadFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  if (info.Length() < 1) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Packet object required").Value());
    return deferred.Promise();
  }
  
  Packet* packet = ffmpeg::UnwrapNativeObjectRequired<Packet>(env, info[0], "Packet");
  if (!packet) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Invalid packet object").Value());
    return deferred.Promise();
  }
  
  auto* worker = new ReadFrameWorker(env, context_, packet);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async FindStreamInfo operation
class FindStreamInfoWorker : public Napi::AsyncWorker {
public:
  FindStreamInfoWorker(Napi::Env env, AVFormatContext* context)
    : AsyncWorker(env),
      context_(context),
      result_(0) {}

  void Execute() override {
    result_ = avformat_find_stream_info(context_, nullptr);
    
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
  AVFormatContext* context_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of FindStreamInfo
Napi::Value FormatContext::FindStreamInfoAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  auto* worker = new FindStreamInfoWorker(env, context_);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async WriteHeader operation
class WriteHeaderWorker : public Napi::AsyncWorker {
public:
  WriteHeaderWorker(Napi::Env env, AVFormatContext* context, AVDictionary* options)
    : AsyncWorker(env),
      context_(context),
      options_(options),
      result_(0) {}

  ~WriteHeaderWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    result_ = avformat_write_header(context_, options_ ? &options_ : nullptr);
    
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
  AVFormatContext* context_;
  AVDictionary* options_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of WriteHeader
Napi::Value FormatContext::WriteHeaderAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  AVDictionary* options = nullptr;
  if (info.Length() > 0) {
    Dictionary* dictWrapper = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dictWrapper) {
      av_dict_copy(&options, dictWrapper->GetDict(), 0);
    }
  }
  
  auto* worker = new WriteHeaderWorker(env, context_, options);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async WriteFrame operation
class WriteFrameWorker : public Napi::AsyncWorker {
public:
  WriteFrameWorker(Napi::Env env, AVFormatContext* context, AVPacket* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = av_write_frame(context_, packet_);
    
    if (result_ < 0) {
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
  AVFormatContext* context_;
  AVPacket* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of WriteFrame
Napi::Value FormatContext::WriteFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0) {
    Packet* packet = ffmpeg::UnwrapNativeObject<Packet>(env, info[0], "Packet");
    if (packet) {
      pkt = packet->GetPacket();
    }
  }
  
  auto* worker = new WriteFrameWorker(env, context_, pkt);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async WriteInterleavedFrame operation
class WriteInterleavedFrameWorker : public Napi::AsyncWorker {
public:
  WriteInterleavedFrameWorker(Napi::Env env, AVFormatContext* context, AVPacket* packet)
    : AsyncWorker(env),
      context_(context),
      packet_(packet),
      result_(0) {}

  void Execute() override {
    result_ = av_interleaved_write_frame(context_, packet_);
    
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
  AVFormatContext* context_;
  AVPacket* packet_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of WriteInterleavedFrame
Napi::Value FormatContext::WriteInterleavedFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Packet* packet = ffmpeg::UnwrapNativeObject<Packet>(env, info[0], "Packet");
    if (packet) {
      pkt = packet->GetPacket();
    }
  }
  
  auto* worker = new WriteInterleavedFrameWorker(env, context_, pkt);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

// Worker class for async WriteTrailer operation
class WriteTrailerWorker : public Napi::AsyncWorker {
public:
  WriteTrailerWorker(Napi::Env env, AVFormatContext* context)
    : AsyncWorker(env),
      context_(context),
      result_(0) {}

  void Execute() override {
    result_ = av_write_trailer(context_);
    
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
  AVFormatContext* context_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of WriteTrailer
Napi::Value FormatContext::WriteTrailerAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Format context not opened").Value());
    return deferred.Promise();
  }
  
  auto* worker = new WriteTrailerWorker(env, context_);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg