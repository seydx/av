#include "io_context.h"
#include <libavutil/error.h>
#include <libavutil/mem.h>
#include <future>
#include <cstring>

namespace ffmpeg {

Napi::FunctionReference IOContext::constructor;

// === Init ===

Napi::Object IOContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "IOContext", {
    // Lifecycle
    InstanceMethod<&IOContext::AllocContext>("allocContext"),
    InstanceMethod<&IOContext::AllocContextWithCallbacks>("allocContextWithCallbacks"),
    InstanceMethod<&IOContext::FreeContext>("freeContext"),
    
    // Operations
    InstanceMethod<&IOContext::Open2Async>("open2"),
    InstanceMethod<&IOContext::ClosepAsync>("closep"),
    InstanceMethod<&IOContext::ReadAsync>("read"),
    InstanceMethod<&IOContext::WriteAsync>("write"),
    InstanceMethod<&IOContext::SeekAsync>("seek"),
    InstanceMethod<&IOContext::SizeAsync>("size"),
    InstanceMethod<&IOContext::FlushAsync>("flush"),
    InstanceMethod<&IOContext::SkipAsync>("skip"),
    InstanceMethod<&IOContext::Tell>("tell"),
    
    // Properties
    InstanceAccessor("eof", &IOContext::GetEof, nullptr),
    InstanceAccessor("error", &IOContext::GetError, nullptr),
    InstanceAccessor("seekable", &IOContext::GetSeekable, nullptr),
    InstanceAccessor("maxPacketSize", &IOContext::GetMaxPacketSize, &IOContext::SetMaxPacketSize),
    InstanceAccessor("direct", &IOContext::GetDirect, &IOContext::SetDirect),
    InstanceAccessor("pos", &IOContext::GetPos, nullptr),
    InstanceAccessor("bufferSize", &IOContext::GetBufferSize, nullptr),
    InstanceAccessor("writeFlag", &IOContext::GetWriteFlag, nullptr),
    
    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "asyncDispose"), &IOContext::AsyncDispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("IOContext", func);
  return exports;
}

// === Lifecycle ===

IOContext::IOContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<IOContext>(info), 
    ctx_(nullptr),
    unowned_ctx_(nullptr),
    is_freed_(false) {
  // Constructor does nothing - user must call allocContext() or open2()
}

IOContext::~IOContext() {
  // Clean up callbacks if still active (not already cleaned in FreeContext)
  if (callback_data_ && callback_data_->active) {
    callback_data_->active = false;
    if (callback_data_->has_read_callback) {
      callback_data_->read_callback.Release();
      callback_data_->has_read_callback = false;
    }
    if (callback_data_->has_write_callback) {
      callback_data_->write_callback.Release();
      callback_data_->has_write_callback = false;
    }
    if (callback_data_->has_seek_callback) {
      callback_data_->seek_callback.Release();
      callback_data_->has_seek_callback = false;
    }
    callback_data_.reset();
  }
  
  // Free buffer if allocated
  if (buffer_) {
    av_free(buffer_);
    buffer_ = nullptr;
  }
  
  // Manual cleanup if not already done
  if (ctx_ && !is_freed_) {
    avio_context_free(&ctx_);
    ctx_ = nullptr;
  }
  // Unowned contexts are not freed
}

// === Static Callback Functions ===

int IOContext::ReadPacket(void* opaque, uint8_t* buf, int buf_size) {
  CallbackData* data = static_cast<CallbackData*>(opaque);
  if (!data || !data->active || !data->has_read_callback) {
    return AVERROR_EOF;
  }
  
  int bytes_read = 0;
  std::promise<int> promise;
  std::future<int> future = promise.get_future();
  
  auto callback = [&promise, &bytes_read, buf, buf_size](Napi::Env env, Napi::Function jsCallback) {
    try {
      Napi::Value result = jsCallback.Call({Napi::Number::New(env, buf_size)});
      
      if (result.IsNull() || result.IsUndefined()) {
        bytes_read = AVERROR_EOF;
      } else if (result.IsBuffer()) {
        Napi::Buffer<uint8_t> buffer = result.As<Napi::Buffer<uint8_t>>();
        bytes_read = std::min(static_cast<int>(buffer.Length()), buf_size);
        memcpy(buf, buffer.Data(), bytes_read);
      } else if (result.IsNumber()) {
        // Error code
        bytes_read = result.As<Napi::Number>().Int32Value();
      } else {
        bytes_read = AVERROR(EINVAL);
      }
    } catch (...) {
      bytes_read = AVERROR(EIO);
    }
    promise.set_value(bytes_read);
  };
  
  napi_status status = data->read_callback.BlockingCall(callback);
  if (status != napi_ok) {
    return AVERROR(EIO);
  }
  
  return future.get();
}

int IOContext::WritePacket(void* opaque, const uint8_t* buf, int buf_size) {
  CallbackData* data = static_cast<CallbackData*>(opaque);
  if (!data || !data->active || !data->has_write_callback) {
    return AVERROR(ENOSYS);
  }
  
  int bytes_written = 0;
  std::promise<int> promise;
  std::future<int> future = promise.get_future();
  
  auto callback = [&promise, &bytes_written, buf, buf_size](Napi::Env env, Napi::Function jsCallback) {
    try {
      Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::Copy(env, const_cast<uint8_t*>(buf), buf_size);
      Napi::Value result = jsCallback.Call({buffer});
      
      if (result.IsNumber()) {
        bytes_written = result.As<Napi::Number>().Int32Value();
      } else {
        bytes_written = buf_size;  // Assume all bytes written
      }
    } catch (...) {
      bytes_written = AVERROR(EIO);
    }
    promise.set_value(bytes_written);
  };
  
  napi_status status = data->write_callback.BlockingCall(callback);
  if (status != napi_ok) {
    return AVERROR(EIO);
  }
  
  return future.get();
}

int64_t IOContext::Seek(void* opaque, int64_t offset, int whence) {
  CallbackData* data = static_cast<CallbackData*>(opaque);
  if (!data || !data->active || !data->has_seek_callback) {
    return AVERROR(ENOSYS);
  }
  
  // Special case: AVSEEK_SIZE
  if (whence & AVSEEK_SIZE) {
    whence = AVSEEK_SIZE;
  }
  
  int64_t new_position = -1;
  std::promise<int64_t> promise;
  std::future<int64_t> future = promise.get_future();
  
  auto callback = [&promise, &new_position, offset, whence](Napi::Env env, Napi::Function jsCallback) {
    try {
      Napi::Value result = jsCallback.Call({
        Napi::BigInt::New(env, offset),
        Napi::Number::New(env, whence)
      });
      
      if (result.IsBigInt()) {
        bool lossless;
        new_position = result.As<Napi::BigInt>().Int64Value(&lossless);
      } else if (result.IsNumber()) {
        new_position = static_cast<int64_t>(result.As<Napi::Number>().Int64Value());
      } else {
        new_position = AVERROR(EINVAL);
      }
    } catch (...) {
      new_position = AVERROR(EIO);
    }
    promise.set_value(new_position);
  };
  
  napi_status status = data->seek_callback.BlockingCall(callback);
  if (status != napi_ok) {
    return AVERROR(EIO);
  }
  
  return future.get();
}

// === Static Methods ===

Napi::Value IOContext::Wrap(Napi::Env env, AVIOContext* ctx) {
  if (!ctx) {
    return env.Null();
  }
  
  Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
  Napi::Object obj = constructor->New({});
  IOContext* ioContext = Napi::ObjectWrap<IOContext>::Unwrap(obj);
  ioContext->SetUnowned(ctx); // We don't own contexts that are wrapped
  return obj;
}

// === Methods ===

Napi::Value IOContext::AllocContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (bufferSize, writeFlag)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (Get()) {
    Napi::Error::New(env, "IOContext already allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int buffer_size = info[0].As<Napi::Number>().Int32Value();
  int write_flag = info[1].As<Napi::Number>().Int32Value();
  
  // Allocate buffer
  unsigned char* buffer = static_cast<unsigned char*>(av_malloc(buffer_size));
  if (!buffer) {
    Napi::Error::New(env, "Failed to allocate buffer").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Create AVIOContext without callbacks
  AVIOContext* new_ctx = avio_alloc_context(
    buffer, 
    buffer_size,
    write_flag,
    nullptr, // opaque pointer - no callbacks
    nullptr, // read_packet - no custom read
    nullptr, // write_packet - no custom write  
    nullptr  // seek - no custom seek
  );
  
  if (!new_ctx) {
    av_free(buffer);
    Napi::Error::New(env, "Failed to allocate AVIOContext").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Free old context if exists
  if (ctx_ && !is_freed_) {
    avio_context_free(&ctx_);
  }
  
  ctx_ = new_ctx;
  is_freed_ = false;
  return env.Undefined();
}

Napi::Value IOContext::AllocContextWithCallbacks(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Parameters: bufferSize, writeFlag, readCallback, writeCallback, seekCallback
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least bufferSize and writeFlag").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "bufferSize and writeFlag must be numbers").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int buffer_size = info[0].As<Napi::Number>().Int32Value();
  int write_flag = info[1].As<Napi::Number>().Int32Value();
  
  // Allocate buffer
  if (buffer_) {
    av_free(buffer_);
  }
  buffer_ = (uint8_t*)av_malloc(buffer_size);
  if (!buffer_) {
    Napi::Error::New(env, "Failed to allocate buffer").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Initialize callback data
  callback_data_ = std::make_unique<CallbackData>();
  callback_data_->io_context = this;
  callback_data_->active = true;
  
  // Setup callbacks
  int (*read_cb)(void*, uint8_t*, int) = nullptr;
  int (*write_cb)(void*, const uint8_t*, int) = nullptr;
  int64_t (*seek_cb)(void*, int64_t, int) = nullptr;
  
  // Read callback
  if (info.Length() > 2 && info[2].IsFunction()) {
    callback_data_->read_callback = Napi::ThreadSafeFunction::New(
      env,
      info[2].As<Napi::Function>(),
      "IOReadCallback",
      0,  // Unlimited queue
      1   // One thread
    );
    callback_data_->has_read_callback = true;
    read_cb = ReadPacket;
  }
  
  // Write callback
  if (info.Length() > 3 && info[3].IsFunction()) {
    callback_data_->write_callback = Napi::ThreadSafeFunction::New(
      env,
      info[3].As<Napi::Function>(),
      "IOWriteCallback",
      0,  // Unlimited queue
      1   // One thread
    );
    callback_data_->has_write_callback = true;
    write_cb = WritePacket;
  }
  
  // Seek callback
  if (info.Length() > 4 && info[4].IsFunction()) {
    callback_data_->seek_callback = Napi::ThreadSafeFunction::New(
      env,
      info[4].As<Napi::Function>(),
      "IOSeekCallback",
      0,  // Unlimited queue
      1   // One thread
    );
    callback_data_->has_seek_callback = true;
    seek_cb = Seek;
  }
  
  // Create AVIOContext with callbacks
  AVIOContext* new_ctx = avio_alloc_context(
    buffer_, 
    buffer_size,
    write_flag,
    callback_data_.get(),  // Pass callback data as opaque
    read_cb,
    write_cb,
    seek_cb
  );
  
  if (!new_ctx) {
    av_free(buffer_);
    buffer_ = nullptr;
    callback_data_.reset();
    Napi::Error::New(env, "Failed to allocate AVIOContext with callbacks").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Free old context if exists
  if (ctx_ && !is_freed_) {
    avio_context_free(&ctx_);
  }
  
  ctx_ = new_ctx;
  is_freed_ = false;
  return env.Undefined();
}

Napi::Value IOContext::FreeContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Clean up callbacks first if they exist
  if (callback_data_ && callback_data_->active) {
    callback_data_->active = false;
    if (callback_data_->has_read_callback) {
      callback_data_->read_callback.Release();
      callback_data_->has_read_callback = false;
    }
    if (callback_data_->has_write_callback) {
      callback_data_->write_callback.Release();
      callback_data_->has_write_callback = false;
    }
    if (callback_data_->has_seek_callback) {
      callback_data_->seek_callback.Release();
      callback_data_->has_seek_callback = false;
    }
    callback_data_.reset();
  }
  
  if (ctx_ && !is_freed_) {
    avio_context_free(&ctx_);
    ctx_ = nullptr;
    is_freed_ = true;
  }
  unowned_ctx_ = nullptr;
  
  return env.Undefined();
}

Napi::Value IOContext::Tell(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "IOContext not initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int64_t pos = avio_tell(ctx);
  return Napi::BigInt::New(env, pos);
}

// === Properties ===

Napi::Value IOContext::GetEof(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Boolean::New(env, false);
  }
  
  return Napi::Boolean::New(env, avio_feof(ctx) != 0);
}

Napi::Value IOContext::GetError(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->error);
}

Napi::Value IOContext::GetSeekable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->seekable);
}

Napi::Value IOContext::GetMaxPacketSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->max_packet_size);
}

void IOContext::SetMaxPacketSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVIOContext* ctx = Get();
  if (!ctx) {
    return;
  }
  
  ctx->max_packet_size = value.As<Napi::Number>().Int32Value();
}

Napi::Value IOContext::GetDirect(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->direct);
}

void IOContext::SetDirect(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVIOContext* ctx = Get();
  if (!ctx) {
    return;
  }
  
  ctx->direct = value.As<Napi::Number>().Int32Value();
}

Napi::Value IOContext::GetPos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  return Napi::BigInt::New(env, static_cast<int64_t>(ctx->pos));
}

Napi::Value IOContext::GetBufferSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->buffer_size);
}

Napi::Value IOContext::GetWriteFlag(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVIOContext* ctx = Get();
  if (!ctx) {
    return Napi::Boolean::New(env, false);
  }
  
  return Napi::Boolean::New(env, ctx->write_flag != 0);
}

// === Utility ===

Napi::Value IOContext::AsyncDispose(const Napi::CallbackInfo& info) {
  // Use the async closep method for proper async disposal
  return ClosepAsync(info);
}

} // namespace ffmpeg