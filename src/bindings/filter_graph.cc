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
    InstanceMethod<&FilterGraph::ConfigAsync>("configAsync"),
    
    // Resource management
    InstanceMethod<&FilterGraph::Free>("free"),
    InstanceMethod<&FilterGraph::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Filter creation
    InstanceMethod<&FilterGraph::CreateFilter>("createFilter"),
    InstanceMethod<&FilterGraph::CreateBuffersrcFilter>("createBuffersrcFilter"),
    InstanceMethod<&FilterGraph::CreateBuffersinkFilter>("createBuffersinkFilter"),
    InstanceMethod<&FilterGraph::Parse>("parse"),
    InstanceMethod<&FilterGraph::ParsePtr>("parsePtr"),
    InstanceMethod<&FilterGraph::ParseWithInOut>("parseWithInOut"),
    
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
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (graph_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
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

Napi::Value FilterGraph::CreateBuffersrcFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    Napi::Error::New(env, "Filter graph is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "Name and parameters required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  Napi::Object params = info[1].As<Napi::Object>();
  
  // Determine media type based on parameters
  bool isAudio = params.Has("sampleRate");
  
  // Find the appropriate buffer source filter
  const AVFilter* buffersrc = avfilter_get_by_name(isAudio ? "abuffer" : "buffer");
  if (!buffersrc) {
    Napi::Error::New(env, "Failed to find buffersrc filter").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Build args string based on media type
  std::string args;
  if (isAudio) {
    // Audio buffer source parameters
    if (params.Has("sampleRate") && params.Has("sampleFormat") && params.Has("channelLayout")) {
      int sampleRate = params.Get("sampleRate").As<Napi::Number>().Int32Value();
      int sampleFormat = params.Get("sampleFormat").As<Napi::Number>().Int32Value();
      
      // Get channel layout
      std::string channelLayoutStr = "stereo"; // Default
      if (params.Has("channelLayoutString")) {
        channelLayoutStr = params.Get("channelLayoutString").As<Napi::String>().Utf8Value();
      }
      
      char buffer[512];
      snprintf(buffer, sizeof(buffer), 
               "sample_rate=%d:sample_fmt=%s:channel_layout=%s",
               sampleRate,
               av_get_sample_fmt_name((AVSampleFormat)sampleFormat),
               channelLayoutStr.c_str());
      args = buffer;
    }
  } else {
    // Video buffer source parameters
    if (params.Has("width") && params.Has("height") && params.Has("pixelFormat")) {
      int width = params.Get("width").As<Napi::Number>().Int32Value();
      int height = params.Get("height").As<Napi::Number>().Int32Value();
      int pixelFormat = params.Get("pixelFormat").As<Napi::Number>().Int32Value();
      
      // Get time base
      AVRational timeBase = {1, 25}; // Default
      if (params.Has("timeBase") && params.Get("timeBase").IsObject()) {
        Napi::Object tb = params.Get("timeBase").As<Napi::Object>();
        if (tb.Has("num") && tb.Has("den")) {
          timeBase.num = tb.Get("num").As<Napi::Number>().Int32Value();
          timeBase.den = tb.Get("den").As<Napi::Number>().Int32Value();
        }
      }
      
      // Get sample aspect ratio
      AVRational sampleAspectRatio = {1, 1}; // Default
      if (params.Has("sampleAspectRatio") && params.Get("sampleAspectRatio").IsObject()) {
        Napi::Object sar = params.Get("sampleAspectRatio").As<Napi::Object>();
        if (sar.Has("num") && sar.Has("den")) {
          sampleAspectRatio.num = sar.Get("num").As<Napi::Number>().Int32Value();
          sampleAspectRatio.den = sar.Get("den").As<Napi::Number>().Int32Value();
        }
      }
      
      char buffer[512];
      snprintf(buffer, sizeof(buffer), 
               "video_size=%dx%d:pix_fmt=%s:time_base=%d/%d:pixel_aspect=%d/%d",
               width, height,
               av_get_pix_fmt_name((AVPixelFormat)pixelFormat),
               timeBase.num, timeBase.den,
               sampleAspectRatio.num, sampleAspectRatio.den);
      args = buffer;
    }
  }
  
  // Create the filter context
  AVFilterContext* filter_ctx = nullptr;
  int ret = avfilter_graph_create_filter(&filter_ctx, buffersrc, name.c_str(),
                                         args.c_str(), nullptr, graph_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create buffersrc filter");
    return env.Null();
  }
  
  // Create and return FilterContext wrapper
  if (FilterContext::constructor.IsEmpty()) {
    Napi::Error::New(env, "FilterContext class not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  ctx->SetContext(filter_ctx);
  
  return ctxObj;
}

Napi::Value FilterGraph::CreateBuffersinkFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    Napi::Error::New(env, "Filter graph is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Name required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  
  // Determine media type - can be specified or auto-detected
  bool isAudio = false;
  if (info.Length() > 1 && info[1].IsBoolean()) {
    isAudio = info[1].As<Napi::Boolean>().Value();
  }
  
  // Find the appropriate buffer sink filter
  const AVFilter* buffersink = avfilter_get_by_name(isAudio ? "abuffersink" : "buffersink");
  if (!buffersink) {
    Napi::Error::New(env, "Failed to find buffersink filter").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create the filter context (buffersink typically doesn't need args)
  AVFilterContext* filter_ctx = nullptr;
  int ret = avfilter_graph_create_filter(&filter_ctx, buffersink, name.c_str(),
                                         nullptr, nullptr, graph_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create buffersink filter");
    return env.Null();
  }
  
  // Create and return FilterContext wrapper
  if (FilterContext::constructor.IsEmpty()) {
    Napi::Error::New(env, "FilterContext class not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  ctx->SetContext(filter_ctx);
  
  return ctxObj;
}

Napi::Value FilterGraph::ParseWithInOut(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsString() || !info[1].IsObject() || !info[2].IsObject()) {
    Napi::TypeError::New(env, "Filter string, inputs and outputs required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  Napi::Object inputsObj = info[1].As<Napi::Object>();
  Napi::Object outputsObj = info[2].As<Napi::Object>();
  
  // Create AVFilterInOut structures
  AVFilterInOut* inputs = avfilter_inout_alloc();
  AVFilterInOut* outputs = avfilter_inout_alloc();
  
  if (!inputs || !outputs) {
    if (inputs) avfilter_inout_free(&inputs);
    if (outputs) avfilter_inout_free(&outputs);
    Napi::Error::New(env, "Failed to allocate filter inout structures").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Configure outputs (source)
  if (inputsObj.Has("name") && inputsObj.Has("filterContext")) {
    outputs->name = av_strdup(inputsObj.Get("name").As<Napi::String>().Utf8Value().c_str());
    FilterContext* srcCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, inputsObj.Get("filterContext"), "FilterContext");
    if (srcCtx) {
      outputs->filter_ctx = srcCtx->GetContext();
    }
    outputs->pad_idx = 0;
    if (inputsObj.Has("padIdx")) {
      outputs->pad_idx = inputsObj.Get("padIdx").As<Napi::Number>().Int32Value();
    }
    outputs->next = nullptr;
  }
  
  // Configure inputs (sink)
  if (outputsObj.Has("name") && outputsObj.Has("filterContext")) {
    inputs->name = av_strdup(outputsObj.Get("name").As<Napi::String>().Utf8Value().c_str());
    FilterContext* sinkCtx = ffmpeg::UnwrapNativeObject<FilterContext>(env, outputsObj.Get("filterContext"), "FilterContext");
    if (sinkCtx) {
      inputs->filter_ctx = sinkCtx->GetContext();
    }
    inputs->pad_idx = 0;
    if (outputsObj.Has("padIdx")) {
      inputs->pad_idx = outputsObj.Get("padIdx").As<Napi::Number>().Int32Value();
    }
    inputs->next = nullptr;
  }
  
  // Parse the filter graph
  int ret = avfilter_graph_parse_ptr(graph_, filters.c_str(), &inputs, &outputs, nullptr);
  
  // Clean up
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to parse filter graph");
    return env.Undefined();
  }
  
  return env.Undefined();
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
    return env.Undefined();
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
    return env.Undefined();
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