#include "format_context.h"
#include "packet.h"
#include "input_format.h"
#include "output_format.h"
#include "dictionary.h"
#include <napi.h>

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for FormatContext Operations
// ============================================================================

/**
 * Worker for avformat_open_input - Opens an input file
 */
class FCOpenInputWorker : public Napi::AsyncWorker {
public:
  FCOpenInputWorker(Napi::Env env, FormatContext* parent, const std::string& url, 
                  AVInputFormat* fmt, AVDictionary* options)
    : AsyncWorker(env),
      parent_(parent),
      url_(url),
      fmt_(fmt),
      options_(options),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  ~FCOpenInputWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    // If we already have a context (e.g., for custom I/O), use it
    AVFormatContext* ctx = parent_->ctx_;
    
    // For custom I/O, pass NULL as URL
    const char* url = nullptr;
    if (!url_.empty() && url_ != "dummy") {
      url = url_.c_str();
    }
    
    result_ = avformat_open_input(&ctx, url, fmt_, options_ ? &options_ : nullptr);
    
    if (result_ >= 0) {
      parent_->ctx_ = ctx;
      parent_->is_output_ = false;
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  std::string url_;
  AVInputFormat* fmt_;
  AVDictionary* options_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avformat_find_stream_info - Reads packet headers
 */
class FCFindStreamInfoWorker : public Napi::AsyncWorker {
public:
  FCFindStreamInfoWorker(Napi::Env env, FormatContext* parent, AVDictionary* options)
    : AsyncWorker(env),
      parent_(parent),
      options_(options),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  ~FCFindStreamInfoWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    if (parent_->ctx_) {
      result_ = avformat_find_stream_info(parent_->ctx_, options_ ? &options_ : nullptr);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  AVDictionary* options_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_read_frame - Reads a packet from the stream
 */
class FCReadFrameWorker : public Napi::AsyncWorker {
public:
  FCReadFrameWorker(Napi::Env env, FormatContext* parent, Packet* packet)
    : AsyncWorker(env),
      parent_(parent),
      packet_(packet),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_ && packet_) {
      result_ = av_read_frame(parent_->ctx_, packet_->Get());
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_seek_frame - Seeks to a timestamp
 */
class FCSeekFrameWorker : public Napi::AsyncWorker {
public:
  FCSeekFrameWorker(Napi::Env env, FormatContext* parent, int stream_index, 
                  int64_t timestamp, int flags)
    : AsyncWorker(env),
      parent_(parent),
      stream_index_(stream_index),
      timestamp_(timestamp),
      flags_(flags),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_) {
      result_ = av_seek_frame(parent_->ctx_, stream_index_, timestamp_, flags_);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  int stream_index_;
  int64_t timestamp_;
  int flags_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avformat_seek_file - Seeks to a timestamp range
 */
class FCSeekFileWorker : public Napi::AsyncWorker {
public:
  FCSeekFileWorker(Napi::Env env, FormatContext* parent, int stream_index, 
                 int64_t min_ts, int64_t ts, int64_t max_ts, int flags)
    : AsyncWorker(env),
      parent_(parent),
      stream_index_(stream_index),
      min_ts_(min_ts),
      ts_(ts),
      max_ts_(max_ts),
      flags_(flags),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_) {
      result_ = avformat_seek_file(parent_->ctx_, stream_index_, 
                                   min_ts_, ts_, max_ts_, flags_);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  int stream_index_;
  int64_t min_ts_;
  int64_t ts_;
  int64_t max_ts_;
  int flags_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avformat_write_header - Writes file header
 */
class FCWriteHeaderWorker : public Napi::AsyncWorker {
public:
  FCWriteHeaderWorker(Napi::Env env, FormatContext* parent, AVDictionary* options)
    : AsyncWorker(env),
      parent_(parent),
      options_(options),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  ~FCWriteHeaderWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    if (parent_->ctx_) {
      result_ = avformat_write_header(parent_->ctx_, options_ ? &options_ : nullptr);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  AVDictionary* options_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_write_frame - Writes a packet
 */
class FCWriteFrameWorker : public Napi::AsyncWorker {
public:
  FCWriteFrameWorker(Napi::Env env, FormatContext* parent, Packet* packet)
    : AsyncWorker(env),
      parent_(parent),
      packet_(packet),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_) {
      result_ = av_write_frame(parent_->ctx_, packet_ ? packet_->Get() : nullptr);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_interleaved_write_frame - Writes a packet with interleaving
 */
class FCInterleavedWriteFrameWorker : public Napi::AsyncWorker {
public:
  FCInterleavedWriteFrameWorker(Napi::Env env, FormatContext* parent, Packet* packet)
    : AsyncWorker(env),
      parent_(parent),
      packet_(packet),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_) {
      result_ = av_interleaved_write_frame(parent_->ctx_, packet_ ? packet_->Get() : nullptr);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  Packet* packet_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for av_write_trailer - Writes file trailer
 */
class FCWriteTrailerWorker : public Napi::AsyncWorker {
public:
  FCWriteTrailerWorker(Napi::Env env, FormatContext* parent)
    : AsyncWorker(env),
      parent_(parent),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    if (parent_->ctx_) {
      result_ = av_write_trailer(parent_->ctx_);
    } else {
      result_ = AVERROR(EINVAL);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
  FormatContext* parent_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// Async Method Implementations
// ============================================================================

Napi::Value FormatContext::OpenInputAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "URL required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  AVInputFormat* fmt = nullptr;
  AVDictionary* options = nullptr;
  
  if (info.Length() > 1 && !info[1].IsNull() && !info[1].IsUndefined()) {
    InputFormat* inputFormat = Napi::ObjectWrap<InputFormat>::Unwrap(info[1].As<Napi::Object>());
    if (inputFormat) {
      fmt = const_cast<AVInputFormat*>(inputFormat->Get());
    }
  }
  
  if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined()) {
    Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(info[2].As<Napi::Object>());
    if (dict && dict->Get()) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }
  
  auto* worker = new FCOpenInputWorker(env, this, url, fmt, options);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::FindStreamInfoAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVDictionary* options = nullptr;
  
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(info[0].As<Napi::Object>());
    if (dict && dict->Get()) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }
  
  auto* worker = new FCFindStreamInfoWorker(env, this, options);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::ReadFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Packet required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(info[0].As<Napi::Object>());
  if (!packet) {
    Napi::TypeError::New(env, "Invalid packet object").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  auto* worker = new FCReadFrameWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::SeekFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "stream_index, timestamp, and flags required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int stream_index = info[0].As<Napi::Number>().Int32Value();
  bool lossless;
  int64_t timestamp = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  int flags = info[2].As<Napi::Number>().Int32Value();
  
  auto* worker = new FCSeekFrameWorker(env, this, stream_index, timestamp, flags);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::SeekFileAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 5) {
    Napi::TypeError::New(env, "stream_index, min_ts, ts, max_ts, and flags required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int stream_index = info[0].As<Napi::Number>().Int32Value();
  bool lossless;
  int64_t min_ts = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t ts = info[2].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t max_ts = info[3].As<Napi::BigInt>().Int64Value(&lossless);
  int flags = info[4].As<Napi::Number>().Int32Value();
  
  auto* worker = new FCSeekFileWorker(env, this, stream_index, min_ts, ts, max_ts, flags);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::WriteHeaderAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVDictionary* options = nullptr;
  
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(info[0].As<Napi::Object>());
    if (dict && dict->Get()) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }
  
  auto* worker = new FCWriteHeaderWorker(env, this, options);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::WriteFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Packet* packet = nullptr;
  
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    packet = Napi::ObjectWrap<Packet>::Unwrap(info[0].As<Napi::Object>());
  }
  
  auto* worker = new FCWriteFrameWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::InterleavedWriteFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Packet* packet = nullptr;
  
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    packet = Napi::ObjectWrap<Packet>::Unwrap(info[0].As<Napi::Object>());
  }
  
  auto* worker = new FCInterleavedWriteFrameWorker(env, this, packet);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value FormatContext::WriteTrailerAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  auto* worker = new FCWriteTrailerWorker(env, this);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg