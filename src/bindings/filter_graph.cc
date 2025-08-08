#include "filter_graph.h"
#include "filter.h"
#include "filter_context.h"
#include "dictionary.h"
#include "common.h"
#include <vector>
#include <sstream>

namespace ffmpeg {

Napi::FunctionReference FilterGraph::constructor;

Napi::Object FilterGraph::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterGraph", {
    // Lifecycle
    InstanceMethod<&FilterGraph::Config>("config"),
    InstanceMethod<&FilterGraph::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Filter creation
    InstanceMethod<&FilterGraph::CreateFilter>("createFilter"),
    InstanceMethod<&FilterGraph::Parse>("parse"),
    InstanceMethod<&FilterGraph::ParsePtr>("parsePtr"),
    
    // Properties
    InstanceAccessor<&FilterGraph::GetNbFilters>("nbFilters"),
    InstanceAccessor<&FilterGraph::GetFilters>("filters"),
    InstanceAccessor<&FilterGraph::GetThreadType, &FilterGraph::SetThreadType>("threadType"),
    InstanceAccessor<&FilterGraph::GetNbThreads, &FilterGraph::SetNbThreads>("nbThreads"),
    
    // Utility
    InstanceMethod<&FilterGraph::Dump>("dump"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterGraph", func);
  return exports;
}

FilterGraph::FilterGraph(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<FilterGraph>(info) {
  Napi::Env env = info.Env();
  
  graph_ = avfilter_graph_alloc();
  if (!graph_) {
    Napi::Error::New(env, "Failed to allocate filter graph").ThrowAsJavaScriptException();
    return;
  }
}

FilterGraph::~FilterGraph() {
  if (graph_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
  }
}

// Lifecycle
Napi::Value FilterGraph::Config(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = avfilter_graph_config(graph_, nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to configure filter graph");
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (graph_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
  }
  
  return env.Undefined();
}

// Filter creation
Napi::Value FilterGraph::CreateFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Filter and name required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Filter* filter = ffmpeg::UnwrapNativeObjectRequired<Filter>(env, info[0], "Filter");
  if (!filter) return env.Null();
  std::string name = info[1].As<Napi::String>().Utf8Value();
  
  std::string args;
  if (info.Length() > 2 && info[2].IsString()) {
    args = info[2].As<Napi::String>().Utf8Value();
  }
  
  AVFilterContext* filter_ctx = nullptr;
  // Note: avfilter_graph_create_filter creates AND initializes the filter
  // Do NOT call init() on the returned FilterContext!
  int ret = avfilter_graph_create_filter(&filter_ctx, filter->GetFilter(), name.c_str(),
                                         args.empty() ? nullptr : args.c_str(),
                                         nullptr, graph_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create filter");
    return env.Null();
  }
  
  // Check if FilterContext constructor is initialized
  if (FilterContext::constructor.IsEmpty()) {
    Napi::Error::New(env, "FilterContext class not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  ctx->SetContext(filter_ctx);
  
  return ctxObj;
}

Napi::Value FilterGraph::Parse(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Filter string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  
  AVFilterInOut* inputs = nullptr;
  AVFilterInOut* outputs = nullptr;
  
  // Handle input filter context if provided
  if (info.Length() > 1 && !info[1].IsNull() && !info[1].IsUndefined() && info[1].IsObject()) {
    FilterContext* inputCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, info[1], "FilterContext");
    if (!inputCtx) {
      return env.Undefined();
    }
    
    // Create AVFilterInOut for input
    inputs = avfilter_inout_alloc();
    if (!inputs) {
      Napi::Error::New(env, "Failed to allocate input structure").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    inputs->filter_ctx = inputCtx->GetContext();
    inputs->pad_idx = 0;
    inputs->next = nullptr;
    inputs->name = av_strdup("in");
  }
  
  // Handle output filter context if provided
  if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined() && info[2].IsObject()) {
    FilterContext* outputCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, info[2], "FilterContext");
    if (!outputCtx) {
      avfilter_inout_free(&inputs);
      return env.Undefined();
    }
    
    // Create AVFilterInOut for output
    outputs = avfilter_inout_alloc();
    if (!outputs) {
      avfilter_inout_free(&inputs);
      Napi::Error::New(env, "Failed to allocate output structure").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    outputs->filter_ctx = outputCtx->GetContext();
    outputs->pad_idx = 0;
    outputs->next = nullptr;
    outputs->name = av_strdup("out");
  }
  
  // Parse the filter graph with proper input/output connections
  int ret = avfilter_graph_parse_ptr(graph_, filters.c_str(), &inputs, &outputs, nullptr);
  
  // Clean up
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to parse filter graph");
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::ParsePtr(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Filter string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  
  AVFilterInOut* inputs = nullptr;
  AVFilterInOut* outputs = nullptr;
  
  // Parse with inputs/outputs for complex graphs
  if (info.Length() > 1 && info[1].IsObject()) {
    // Handle input filter context
    FilterContext* inputCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, info[1], "FilterContext");
    if (!inputCtx) {
      return env.Undefined();
    }
    
    inputs = avfilter_inout_alloc();
    inputs->filter_ctx = inputCtx->GetContext();
    inputs->pad_idx = 0;
    inputs->next = nullptr;
    inputs->name = av_strdup("in");
  }
  
  if (info.Length() > 2 && info[2].IsObject()) {
    // Handle output filter context
    FilterContext* outputCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, info[2], "FilterContext");
    if (!outputCtx) {
      avfilter_inout_free(&inputs);
      return env.Undefined();
    }
    
    outputs = avfilter_inout_alloc();
    outputs->filter_ctx = outputCtx->GetContext();
    outputs->pad_idx = 0;
    outputs->next = nullptr;
    outputs->name = av_strdup("out");
  }
  
  int ret = avfilter_graph_parse_ptr(graph_, filters.c_str(), &inputs, &outputs, nullptr);
  
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to parse filter graph");
  }
  
  return env.Undefined();
}

// Properties
Napi::Value FilterGraph::GetNbFilters(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, graph_ ? graph_->nb_filters : 0);
}

Napi::Value FilterGraph::GetFilters(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    return Napi::Array::New(env, 0);
  }
  
  Napi::Array filters = Napi::Array::New(env, graph_->nb_filters);
  
  for (unsigned int i = 0; i < graph_->nb_filters; i++) {
    // Check if FilterContext constructor is initialized
    if (FilterContext::constructor.IsEmpty()) {
      continue;  // Skip if not initialized
    }
    
    Napi::Object ctxObj = FilterContext::constructor.New({});
    FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
    ctx->SetContext(graph_->filters[i]);
    filters[i] = ctxObj;
  }
  
  return filters;
}

Napi::Value FilterGraph::GetThreadType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, graph_ ? graph_->thread_type : 0);
}

void FilterGraph::SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (graph_) {
    graph_->thread_type = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FilterGraph::GetNbThreads(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, graph_ ? graph_->nb_threads : 0);
}

void FilterGraph::SetNbThreads(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (graph_) {
    graph_->nb_threads = value.As<Napi::Number>().Int32Value();
  }
}

// Utility
Napi::Value FilterGraph::Dump(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    return Napi::String::New(env, "");
  }
  
  char* dump = avfilter_graph_dump(graph_, nullptr);
  if (!dump) {
    return Napi::String::New(env, "");
  }
  
  std::string result(dump);
  av_free(dump);
  
  return Napi::String::New(env, result);
}

} // namespace ffmpeg