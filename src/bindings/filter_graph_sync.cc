#include "filter_graph.h"
#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

Napi::Value FilterGraph::ConfigSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Direct synchronous call
  int ret = avfilter_graph_config(graph, nullptr);

  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::RequestOldestSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Direct synchronous call
  int ret = avfilter_graph_request_oldest(graph);

  return Napi::Number::New(env, ret);
}

} // namespace ffmpeg