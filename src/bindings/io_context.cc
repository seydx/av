#include "io_context.h"
#include "dictionary.h"
#include <string>

namespace ffmpeg {

Napi::FunctionReference IOContext::constructor;

Napi::Object IOContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "IOContext", {
    // Methods
    InstanceMethod<&IOContext::Open>("open"),
    InstanceMethod<&IOContext::OpenAsync>("openAsync"),
    InstanceMethod<&IOContext::Close>("close"),
    InstanceMethod<&IOContext::Flush>("flush"),
    
    // Properties
    InstanceAccessor<&IOContext::GetSize>("size"),
    InstanceAccessor<&IOContext::GetPos>("pos"),
    InstanceAccessor<&IOContext::GetEof>("eof"),
    InstanceAccessor<&IOContext::GetSeekable>("seekable"),
    
    // Symbol.dispose
    InstanceMethod<&IOContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Static methods
    StaticMethod<&IOContext::StaticOpen>("open"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("IOContext", func);
  return exports;
}

IOContext::IOContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<IOContext>(info), context_(nullptr) {
  // Constructor doesn't open anything - use open() method
}

IOContext::~IOContext() {
  if (context_) {
    avio_closep(&context_);
  }
}

Napi::Value IOContext::Open(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least 2 arguments (url, flags)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "First argument must be a string (url)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!info[1].IsNumber()) {
    Napi::TypeError::New(env, "Second argument must be a number (flags)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  int flags = info[1].As<Napi::Number>().Int32Value();
  
  AVDictionary* options = nullptr;
  if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined()) {
    if (info[2].IsObject()) {
      Napi::Object optObj = info[2].As<Napi::Object>();
      Napi::Array keys = optObj.GetPropertyNames();
      
      for (uint32_t i = 0; i < keys.Length(); i++) {
        Napi::Value key = keys[i];
        Napi::Value value = optObj.Get(key);
        if (key.IsString() && value.IsString()) {
          av_dict_set(&options, key.As<Napi::String>().Utf8Value().c_str(),
                      value.As<Napi::String>().Utf8Value().c_str(), 0);
        }
      }
    }
  }
  
  int ret = avio_open2(&context_, url.c_str(), flags, nullptr, &options);
  
  if (options) {
    av_dict_free(&options);
  }
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to open IO context: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

// Worker for async open operation
class OpenIOWorker : public Napi::AsyncWorker {
public:
  OpenIOWorker(Napi::Env env, IOContext* ioContext, const std::string& url, int flags, AVDictionary* options)
    : AsyncWorker(env),
      io_context_(ioContext),
      url_(url),
      flags_(flags),
      options_(options),
      context_(nullptr),
      result_(0) {}
  
  ~OpenIOWorker() {
    if (options_) {
      av_dict_free(&options_);
    }
  }

  void Execute() override {
    result_ = avio_open2(&context_, url_.c_str(), flags_, nullptr, &options_);
    
    if (result_ < 0) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(std::string("Failed to open IO context: ") + errbuf);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    // Set the context directly on the IOContext instance
    io_context_->context_ = context_;
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  IOContext* io_context_;
  std::string url_;
  int flags_;
  AVDictionary* options_;
  AVIOContext* context_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

Napi::Value IOContext::OpenAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Expected at least 2 arguments (url, flags)").Value());
    return deferred.Promise();
  }
  
  if (!info[0].IsString()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "First argument must be a string (url)").Value());
    return deferred.Promise();
  }
  
  if (!info[1].IsNumber()) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::TypeError::New(env, "Second argument must be a number (flags)").Value());
    return deferred.Promise();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  int flags = info[1].As<Napi::Number>().Int32Value();
  
  AVDictionary* options = nullptr;
  if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined()) {
    if (info[2].IsObject()) {
      Napi::Object optObj = info[2].As<Napi::Object>();
      Napi::Array keys = optObj.GetPropertyNames();
      
      for (uint32_t i = 0; i < keys.Length(); i++) {
        Napi::Value key = keys[i];
        Napi::Value value = optObj.Get(key);
        if (key.IsString() && value.IsString()) {
          av_dict_set(&options, key.As<Napi::String>().Utf8Value().c_str(),
                      value.As<Napi::String>().Utf8Value().c_str(), 0);
        }
      }
    }
  }
  
  auto* worker = new OpenIOWorker(env, this, url, flags, options);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

Napi::Value IOContext::Close(const Napi::CallbackInfo& info) {
  if (context_) {
    avio_closep(&context_);
    context_ = nullptr;
  }
  return info.Env().Undefined();
}

Napi::Value IOContext::Flush(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "IO context not opened").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  avio_flush(context_);
  return env.Undefined();
}

Napi::Value IOContext::GetSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return env.Null();
  }
  
  int64_t size = avio_size(context_);
  if (size < 0) {
    return env.Null();
  }
  
  return Napi::BigInt::New(env, size);
}

Napi::Value IOContext::GetPos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return env.Null();
  }
  
  int64_t pos = avio_tell(context_);
  return Napi::BigInt::New(env, pos);
}

Napi::Value IOContext::GetEof(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::Boolean::New(env, true);
  }
  
  return Napi::Boolean::New(env, avio_feof(context_) != 0);
}

Napi::Value IOContext::GetSeekable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::Boolean::New(env, false);
  }
  
  return Napi::Boolean::New(env, context_->seekable != 0);
}

Napi::Value IOContext::Dispose(const Napi::CallbackInfo& info) {
  if (context_) {
    avio_closep(&context_);
    context_ = nullptr;
  }
  return info.Env().Undefined();
}

// Static method to open and return IOContext instance
Napi::Value IOContext::StaticOpen(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Create new IOContext instance
  Napi::Object instance = constructor.New({});
  
  // Call open on the instance
  IOContext* io = Napi::ObjectWrap<IOContext>::Unwrap(instance);
  io->Open(info);
  
  return instance;
}

}  // namespace ffmpeg