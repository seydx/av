#ifndef FFMPEG_FILTER_GRAPH_H
#define FFMPEG_FILTER_GRAPH_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

// Forward declarations
class FilterContext;
class Frame;
class HardwareDeviceContext;

class FilterGraph : public Napi::ObjectWrap<FilterGraph> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  FilterGraph(const Napi::CallbackInfo& info);
  ~FilterGraph();
  
  // Main API methods
  Napi::Value BuildPipeline(const Napi::CallbackInfo& info);
  Napi::Value ProcessFrame(const Napi::CallbackInfo& info);
  Napi::Value ProcessFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value GetFilteredFrame(const Napi::CallbackInfo& info);
  Napi::Value GetFilteredFrameAsync(const Napi::CallbackInfo& info);
  
  // Direct context access for advanced users
  Napi::Value GetInputContext(const Napi::CallbackInfo& info);
  Napi::Value GetOutputContext(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetNbThreads(const Napi::CallbackInfo& info);
  void SetNbThreads(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetThreadType(const Napi::CallbackInfo& info);
  void SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Internal
  AVFilterGraph* GetGraph() { return graph_; }
  AVFilterContext* GetBufferSrcContext() { return buffersrc_ctx_; }
  AVFilterContext* GetBufferSinkContext() { return buffersink_ctx_; }
  
  // Helper methods for building pipeline (public for async worker)
  int CreateBufferSource(const Napi::Object& input);
  int CreateBufferSink(const Napi::Object& output);
  int ParseFilterString(const std::string& filters);
  int ApplyHardwareContext(AVBufferRef* hw_device_ctx);
private:
  AVFilterGraph* graph_;
  AVFilterContext* buffersrc_ctx_;
  AVFilterContext* buffersink_ctx_;
};

// Async worker for ProcessFrame
class ProcessFrameWorker : public Napi::AsyncWorker {
public:
  ProcessFrameWorker(
    Napi::Function& callback,
    FilterGraph* graph,
    Frame* inputFrame,
    Frame* outputFrame
  );
  
  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& error) override;

private:
  FilterGraph* graph_;
  Frame* inputFrame_;
  Frame* outputFrame_;
  int result_;
};

// Async worker for GetFilteredFrame
class GetFilteredFrameWorker : public Napi::AsyncWorker {
public:
  GetFilteredFrameWorker(
    Napi::Function& callback,
    FilterGraph* graph,
    Frame* outputFrame
  );
  
  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& error) override;

private:
  FilterGraph* graph_;
  Frame* outputFrame_;
  int result_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_GRAPH_H