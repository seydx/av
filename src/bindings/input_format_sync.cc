#include "input_format.h"
#include "io_context.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

Napi::Value InputFormat::ProbeBufferSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "IOContext required").ThrowAsJavaScriptException();
    return env.Null();
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
    return env.Null();
  }

  AVIOContext* avio = ioContext->Get();
  if (!avio) {
    Napi::Error::New(env, "Invalid IO context").ThrowAsJavaScriptException();
    return env.Null();
  }

  // Optional max probe size (default: 1MB)
  int maxProbeSize = 1048576;
  if (info.Length() >= 2 && info[1].IsNumber()) {
    maxProbeSize = info[1].As<Napi::Number>().Int32Value();
  }

  // Direct synchronous call to probe the format
  const AVInputFormat* fmt = nullptr;
  int ret = av_probe_input_buffer2(
    avio,
    &fmt,
    nullptr,  // filename (optional)
    nullptr,  // logctx
    0,        // offset
    maxProbeSize
  );

  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to probe input format: ") + errbuf)
      .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!fmt) {
    return env.Null();
  }

  // Create new InputFormat object
  Napi::Object formatObj = InputFormat::constructor.New({});
  InputFormat* wrapper = Napi::ObjectWrap<InputFormat>::Unwrap(formatObj);
  wrapper->Set(fmt);

  return formatObj;
}

} // namespace ffmpeg