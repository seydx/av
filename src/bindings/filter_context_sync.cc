#include "filter_context.h"
#include "frame.h"
#include <napi.h>

extern "C" {
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

Napi::Value FilterContext::BuffersrcAddFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  Frame* frame = nullptr;
  if (!info[0].IsNull() && !info[0].IsUndefined()) {
    frame = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  }

  // Direct synchronous call
  int ret = av_buffersrc_add_frame(ctx, frame ? frame->Get() : nullptr);

  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::BuffersinkGetFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Frame expected").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  Frame* frame = UnwrapNativeObject<Frame>(env, info[0], "Frame");

  // Direct synchronous call
  int ret = av_buffersink_get_frame(ctx, frame->Get());

  return Napi::Number::New(env, ret);
}

} // namespace ffmpeg