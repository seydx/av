#include "input_format.h"
#include "io_context.h"

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

class InputFormatProbeBufferWorker : public Napi::AsyncWorker {
public:
  InputFormatProbeBufferWorker(
    Napi::Function& callback,
    IOContext* ioContext,
    int maxProbeSize
  ) : AsyncWorker(callback),
      io_context_(ioContext),
      max_probe_size_(maxProbeSize),
      result_format_(nullptr) {}

  ~InputFormatProbeBufferWorker() = default;

  void Execute() override {
    AVIOContext* avio = io_context_->Get();
    if (!avio) {
      SetError("Invalid IO context");
      return;
    }

    // av_probe_input_buffer2 will probe the format from the IO context
    const AVInputFormat* fmt = nullptr;
    int ret = av_probe_input_buffer2(
      avio,
      &fmt,
      nullptr,  // filename (optional)
      nullptr,  // logctx
      0,        // offset
      max_probe_size_
    );

    if (ret < 0) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(ret, errbuf, sizeof(errbuf));
      SetError(std::string("Failed to probe input format: ") + errbuf);
      return;
    }

    result_format_ = fmt;
  }

  void OnOK() override {
    Napi::Env env = Env();
    
    if (!result_format_) {
      Callback().Call({env.Null()});
      return;
    }

    // Create new InputFormat object
    Napi::Object formatObj = InputFormat::constructor.New({});
    InputFormat* wrapper = Napi::ObjectWrap<InputFormat>::Unwrap(formatObj);
    wrapper->Set(result_format_);

    Callback().Call({formatObj});
  }

  void OnError(const Napi::Error& e) override {
    Callback().Call({e.Value()});
  }

private:
  IOContext* io_context_;
  int max_probe_size_;
  const AVInputFormat* result_format_;
};

// Update the ProbeBufferAsync implementation
Napi::Value InputFormat::ProbeBufferAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "IOContext required").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  // Check for IOContext using instanceof
  IOContext* ioContext = nullptr;
  Napi::Object obj = info[0].As<Napi::Object>();
  if (!IOContext::constructor.IsEmpty()) {
    Napi::Function ctor = IOContext::constructor.Value();
    if (obj.InstanceOf(ctor)) {
      ioContext = Napi::ObjectWrap<IOContext>::Unwrap(obj);
    }
  }
  
  if (!ioContext) {
    Napi::TypeError::New(env, "Invalid IOContext").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  // Optional max probe size (default: 1MB)
  int maxProbeSize = 1048576;
  if (info.Length() >= 2 && info[1].IsNumber()) {
    maxProbeSize = info[1].As<Napi::Number>().Int32Value();
  }

  // Create promise
  auto deferred = Napi::Promise::Deferred::New(env);
  
  // Create the callback function separately
  Napi::Function callback = Napi::Function::New(env, [deferred](const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() > 0 && info[0].IsObject()) {
      // Success - resolve with the format
      deferred.Resolve(info[0]);
    } else if (info.Length() > 0) {
      // Error - reject
      deferred.Reject(info[0]);
    } else {
      // No format found
      deferred.Resolve(env.Null());
    }
  });
  
  auto* worker = new InputFormatProbeBufferWorker(
    callback,
    ioContext,
    maxProbeSize
  );

  worker->Queue();
  return deferred.Promise();
}

} // namespace ffmpeg