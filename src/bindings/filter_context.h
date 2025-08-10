#ifndef FFMPEG_FILTER_CONTEXT_H
#define FFMPEG_FILTER_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

// Forward declarations
class Frame;
class Filter;

// FilterContext wrapper for filter instance access
class FilterContext : public Napi::ObjectWrap<FilterContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  
  FilterContext(const Napi::CallbackInfo& info);
  ~FilterContext() = default;
  
  // Properties
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetFilterName(const Napi::CallbackInfo& info);
  Napi::Value GetFilter(const Napi::CallbackInfo& info);
  Napi::Value GetNbInputs(const Napi::CallbackInfo& info);
  Napi::Value GetNbOutputs(const Napi::CallbackInfo& info);
  
  // Methods
  Napi::Value AddFrame(const Napi::CallbackInfo& info);
  Napi::Value AddFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value GetFrame(const Napi::CallbackInfo& info);
  Napi::Value GetFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value SetFrameSize(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Internal use
  void SetContext(AVFilterContext* ctx) { context_ = ctx; }
  AVFilterContext* GetContext() const { return context_; }

private:
  AVFilterContext* context_;
};

// Async workers for filter operations
class AddFrameWorker : public Napi::AsyncWorker {
public:
  AddFrameWorker(
    Napi::Promise::Deferred deferred,
    AVFilterContext* context,
    AVFrame* frame
  );
  
  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& error) override;

private:
  Napi::Promise::Deferred deferred_;
  AVFilterContext* context_;
  AVFrame* frame_;
  int result_;
};

class GetFrameWorker : public Napi::AsyncWorker {
public:
  GetFrameWorker(
    Napi::Promise::Deferred deferred,
    AVFilterContext* context,
    AVFrame* frame
  );
  
  void Execute() override;
  void OnOK() override;
  void OnError(const Napi::Error& error) override;

private:
  Napi::Promise::Deferred deferred_;
  AVFilterContext* context_;
  AVFrame* frame_;
  int result_;
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_CONTEXT_H