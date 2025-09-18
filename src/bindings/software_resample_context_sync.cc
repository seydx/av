#include "software_resample_context.h"
#include <napi.h>

extern "C" {
#include <libswresample/swresample.h>
}

namespace ffmpeg {

Napi::Value SoftwareResampleContext::ConvertSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::TypeError::New(env, "SoftwareResampleContext is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (out, out_count, in, in_count)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  int out_count = info[1].As<Napi::Number>().Int32Value();
  int in_count = info[3].As<Napi::Number>().Int32Value();

  // Parse output buffers
  uint8_t* out_ptrs[8] = {nullptr};
  if (!info[0].IsNull() && !info[0].IsUndefined() && info[0].IsArray()) {
    Napi::Array outArray = info[0].As<Napi::Array>();
    for (uint32_t i = 0; i < outArray.Length() && i < 8; i++) {
      Napi::Value val = outArray[i];
      if (val.IsBuffer()) {
        Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
        out_ptrs[i] = buf.Data();
      }
    }
  }

  // Parse input buffers
  const uint8_t* in_ptrs[8] = {nullptr};
  if (!info[2].IsNull() && !info[2].IsUndefined() && info[2].IsArray()) {
    Napi::Array inArray = info[2].As<Napi::Array>();
    for (uint32_t i = 0; i < inArray.Length() && i < 8; i++) {
      Napi::Value val = inArray[i];
      if (val.IsBuffer()) {
        Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
        in_ptrs[i] = buf.Data();
      }
    }
  }

  // Direct synchronous call
  int ret = swr_convert(ctx_,
                        info[0].IsNull() ? nullptr : out_ptrs,
                        out_count,
                        info[2].IsNull() ? nullptr : in_ptrs,
                        in_count);

  return Napi::Number::New(env, ret);
}

} // namespace ffmpeg