#include "filter_graph.h"
#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

Napi::Value FilterGraph::ConfigSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!graph_) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Direct synchronous call
  int ret = avfilter_graph_config(graph_, nullptr);

  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::RequestOldestSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!graph_) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Direct synchronous call
  int ret = avfilter_graph_request_oldest(graph_);

  return Napi::Number::New(env, ret);
}

} // namespace ffmpeg