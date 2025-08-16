#ifndef FFMPEG_FILTER_CONTEXT_H
#define FFMPEG_FILTER_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

// Forward declarations
class Filter;
class FilterGraph;

class FilterContext : public Napi::ObjectWrap<FilterContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  FilterContext(const Napi::CallbackInfo& info);
  ~FilterContext();
  
  // Native access
  AVFilterContext* Get() { 
    return ctx_ ? ctx_ : unowned_ctx_; 
  }
  void SetOwned(AVFilterContext* ctx) { 
    // Free old context if exists
    if (ctx_ && !is_freed_) {
      avfilter_free(ctx_);
    }
    ctx_ = ctx;
    unowned_ctx_ = nullptr;
    is_freed_ = false;
  }
  void SetUnowned(AVFilterContext* ctx) { 
    // For contexts owned by FilterGraph
    if (ctx_ && !is_freed_) {
      avfilter_free(ctx_);
    }
    ctx_ = nullptr;
    unowned_ctx_ = ctx;
    is_freed_ = true;  // Mark as freed since we don't own it
  }

private:
  // Friend classes
  friend class Filter;
  friend class FilterGraph;
  friend class FilterInOut;
  friend class FCBuffersrcAddFrameWorker;
  friend class FCBuffersinkGetFrameWorker;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVFilterContext* ctx_ = nullptr;  // For owned contexts - Manual RAII
  AVFilterContext* unowned_ctx_ = nullptr; // For graph-owned contexts
  bool is_freed_ = false;
  
  // === Methods ===
  
  // Operations
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value InitStr(const Napi::CallbackInfo& info);
  Napi::Value Link(const Napi::CallbackInfo& info);
  Napi::Value Unlink(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value SetOpt(const Napi::CallbackInfo& info);
  Napi::Value OptSetBin(const Napi::CallbackInfo& info);
  
  // Buffer source/sink operations
  Napi::Value BuffersrcAddFrame(const Napi::CallbackInfo& info);
  Napi::Value BuffersinkGetFrame(const Napi::CallbackInfo& info);
  Napi::Value BuffersinkSetFrameSize(const Napi::CallbackInfo& info);
  Napi::Value BuffersinkGetTimeBase(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  // name
  Napi::Value GetName(const Napi::CallbackInfo& info);
  void SetName(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // filter
  Napi::Value GetFilter(const Napi::CallbackInfo& info);
  
  // graph
  Napi::Value GetGraph(const Napi::CallbackInfo& info);
  
  // nbInputs
  Napi::Value GetNbInputs(const Napi::CallbackInfo& info);
  
  // nbOutputs
  Napi::Value GetNbOutputs(const Napi::CallbackInfo& info);
  
  // ready
  Napi::Value GetReady(const Napi::CallbackInfo& info);
  
  // Utility
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_FILTER_CONTEXT_H