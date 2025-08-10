#ifndef FFMPEG_FILTER_GRAPH_H
#define FFMPEG_FILTER_GRAPH_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

class FilterGraph : public Napi::ObjectWrap<FilterGraph> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  FilterGraph(const Napi::CallbackInfo& info);
  ~FilterGraph();
  
  // Lifecycle
  Napi::Value Config(const Napi::CallbackInfo& info);
  Napi::Value ConfigAsync(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Filter creation
  Napi::Value CreateFilter(const Napi::CallbackInfo& info);
  Napi::Value CreateBuffersrcFilter(const Napi::CallbackInfo& info);
  Napi::Value CreateBuffersinkFilter(const Napi::CallbackInfo& info);
  Napi::Value Parse(const Napi::CallbackInfo& info);
  Napi::Value ParsePtr(const Napi::CallbackInfo& info);
  Napi::Value ParseWithInOut(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetNbFilters(const Napi::CallbackInfo& info);
  Napi::Value GetFilters(const Napi::CallbackInfo& info);
  Napi::Value GetThreadType(const Napi::CallbackInfo& info);
  void SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetNbThreads(const Napi::CallbackInfo& info);
  void SetNbThreads(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Utility
  Napi::Value Dump(const Napi::CallbackInfo& info);
  
  // Internal use
  AVFilterGraph* GetGraph() const { return graph_; }
  
  static Napi::FunctionReference constructor;

private:
  AVFilterGraph* graph_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_GRAPH_H