#include "io_context.h"
#include <napi.h>
#include <libavformat/avio.h>

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for I/O Operations
// ============================================================================

/**
 * Worker for avio_open2 - Opens a resource for reading/writing
 */
class IOOpen2Worker : public Napi::AsyncWorker {
public:
  IOOpen2Worker(Napi::Env env, IOContext* ctx, 
              const std::string& url, int flags)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      url_(url), 
      flags_(flags), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* avio_ctx = nullptr;
    ret_ = avio_open2(&avio_ctx, url_.c_str(), flags_, nullptr, nullptr);
    if (ret_ >= 0) {
      ctx_->SetOwned(avio_ctx);
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
  IOContext* ctx_;
  std::string url_;
  int flags_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_closep - Closes a resource
 */
class IOClosepWorker : public Napi::AsyncWorker {
public:
  IOClosepWorker(Napi::Env env, IOContext* ctx)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (ctx) {
      ret_ = avio_closep(&ctx);
      // avio_closep freed the context and set the pointer to NULL
      // Update our internal state
      ctx_->ctx_ = nullptr;
      ctx_->is_freed_ = true;
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
  IOContext* ctx_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_read - Reads data from IOContext
 */
class IOReadWorker : public Napi::AsyncWorker {
public:
  IOReadWorker(Napi::Env env, IOContext* ctx, int size)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      size_(size), 
      bytes_read_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {
    buffer_.resize(size);
  }

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    bytes_read_ = avio_read(ctx, buffer_.data(), size_);
  }

  void OnOK() override {
    if (bytes_read_ < 0) {
      // Error case - return error code
      deferred_.Resolve(Napi::Number::New(Env(), bytes_read_));
    } else {
      // Success case - return buffer
      Napi::Buffer<uint8_t> result = Napi::Buffer<uint8_t>::Copy(
        Env(), buffer_.data(), bytes_read_);
      deferred_.Resolve(result);
    }
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  int size_;
  int bytes_read_;
  std::vector<uint8_t> buffer_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_write - Writes data to IOContext
 */
class IOWriteWorker : public Napi::AsyncWorker {
public:
  IOWriteWorker(Napi::Env env, IOContext* ctx, 
              const uint8_t* data, size_t length)
    : Napi::AsyncWorker(env), 
      ctx_(ctx),
      deferred_(Napi::Promise::Deferred::New(env)) {
    // Copy the data since the buffer might be freed before Execute runs
    buffer_.assign(data, data + length);
  }

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    avio_write(ctx, buffer_.data(), buffer_.size());
  }

  void OnOK() override {
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  std::vector<uint8_t> buffer_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_seek - Seeks to a position
 */
class IOSeekWorker : public Napi::AsyncWorker {
public:
  IOSeekWorker(Napi::Env env, IOContext* ctx, 
             int64_t offset, int whence)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      offset_(offset), 
      whence_(whence), 
      new_pos_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    new_pos_ = avio_seek(ctx, offset_, whence_);
  }

  void OnOK() override {
    deferred_.Resolve(Napi::BigInt::New(Env(), new_pos_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  int64_t offset_;
  int whence_;
  int64_t new_pos_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_size - Gets file size
 */
class IOSizeWorker : public Napi::AsyncWorker {
public:
  IOSizeWorker(Napi::Env env, IOContext* ctx)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      size_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    size_ = avio_size(ctx);
  }

  void OnOK() override {
    deferred_.Resolve(Napi::BigInt::New(Env(), size_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  int64_t size_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_flush - Flushes buffered data
 */
class IOFlushWorker : public Napi::AsyncWorker {
public:
  IOFlushWorker(Napi::Env env, IOContext* ctx)
    : Napi::AsyncWorker(env), 
      ctx_(ctx),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    avio_flush(ctx);
  }

  void OnOK() override {
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avio_skip - Skips bytes forward
 */
class IOSkipWorker : public Napi::AsyncWorker {
public:
  IOSkipWorker(Napi::Env env, IOContext* ctx, int64_t offset)
    : Napi::AsyncWorker(env), 
      ctx_(ctx), 
      offset_(offset), 
      new_pos_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    AVIOContext* ctx = ctx_->Get();
    if (!ctx) {
      SetError("IOContext not initialized");
      return;
    }
    
    new_pos_ = avio_skip(ctx, offset_);
  }

  void OnOK() override {
    deferred_.Resolve(Napi::BigInt::New(Env(), new_pos_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  IOContext* ctx_;
  int64_t offset_;
  int64_t new_pos_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// Async Method Implementations
// ============================================================================

Napi::Value IOContext::Open2Async(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (url, flags)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (ctx_) {
    Napi::Error::New(env, "IOContext already initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  int flags = info[1].As<Napi::Number>().Int32Value();
  
  auto* worker = new IOOpen2Worker(env, this, url, flags);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::ClosepAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  auto* worker = new IOClosepWorker(env, this);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::ReadAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (size)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int size = info[0].As<Napi::Number>().Int32Value();
  
  auto* worker = new IOReadWorker(env, this, size);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::WriteAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (buffer)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
  
  auto* worker = new IOWriteWorker(env, this, buffer.Data(), buffer.Length());
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::SeekAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (offset, whence)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  bool lossless;
  int64_t offset = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  int whence = info[1].As<Napi::Number>().Int32Value();
  
  auto* worker = new IOSeekWorker(env, this, offset, whence);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::SizeAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  auto* worker = new IOSizeWorker(env, this);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::FlushAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  auto* worker = new IOFlushWorker(env, this);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::SkipAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (offset)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  bool lossless;
  int64_t offset = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  
  auto* worker = new IOSkipWorker(env, this, offset);
  auto promise = worker->GetPromise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg