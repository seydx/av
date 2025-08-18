#include "filter_graph.h"
#include "filter.h"
#include "filter_context.h"
#include "filter_inout.h"
#include "common.h"

extern "C" {
#include <libavutil/mem.h>
}

namespace ffmpeg {

Napi::FunctionReference FilterGraph::constructor;

// === Init ===

Napi::Object FilterGraph::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterGraph", {
    // Lifecycle
    InstanceMethod<&FilterGraph::Alloc>("alloc"),
    InstanceMethod<&FilterGraph::Free>("free"),
    
    // Filter management
    InstanceMethod<&FilterGraph::CreateFilter>("createFilter"),
    InstanceMethod<&FilterGraph::AllocFilter>("allocFilter"),
    InstanceMethod<&FilterGraph::GetFilter>("getFilter"),
    
    // Configuration
    InstanceMethod<&FilterGraph::Config>("config"),
    InstanceMethod<&FilterGraph::Parse>("parse"),
    InstanceMethod<&FilterGraph::Parse2>("parse2"),
    InstanceMethod<&FilterGraph::ParsePtr>("parsePtr"),
    InstanceMethod<&FilterGraph::Validate>("validate"),
    
    // Execution
    InstanceMethod<&FilterGraph::RequestOldest>("requestOldest"),
    InstanceMethod<&FilterGraph::Dump>("dump"),
    
    // Properties
    InstanceAccessor<&FilterGraph::GetNbFilters>("nbFilters"),
    InstanceAccessor<&FilterGraph::GetFilters>("filters"),
    InstanceAccessor<&FilterGraph::GetThreadType, &FilterGraph::SetThreadType>("threadType"),
    InstanceAccessor<&FilterGraph::GetNbThreads, &FilterGraph::SetNbThreads>("nbThreads"),
    InstanceAccessor<&FilterGraph::GetScaleSwsOpts, &FilterGraph::SetScaleSwsOpts>("scaleSwsOpts"),
    
    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &FilterGraph::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterGraph", func);
  return exports;
}

// === Lifecycle ===

FilterGraph::FilterGraph(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<FilterGraph>(info), unowned_graph_(nullptr) {
  // Constructor does nothing - user must explicitly call alloc()
}

FilterGraph::~FilterGraph() {
  // Manual cleanup if not already done
  if (graph_ && !is_freed_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
  }
  // Unowned graphs are not freed
}

// === Methods ===

Napi::Value FilterGraph::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Free old graph if exists
  if (graph_ && !is_freed_) {
    avfilter_graph_free(&graph_);
  }
  
  graph_ = avfilter_graph_alloc();
  unowned_graph_ = nullptr;
  is_freed_ = false;
  
  if (!graph_) {
    Napi::Error::New(env, "Failed to allocate filter graph").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (graph_ && !is_freed_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
    is_freed_ = true;
  }
  unowned_graph_ = nullptr;
  
  return env.Undefined();
}

Napi::Value FilterGraph::CreateFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least 2 arguments (filter, name)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Filter* filter = UnwrapNativeObject<Filter>(env, info[0], "Filter");
  if (!filter || !filter->Get()) {
    Napi::TypeError::New(env, "Invalid filter").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[1].As<Napi::String>().Utf8Value();
  
  const char* args = nullptr;
  std::string args_str;
  if (info.Length() > 2 && info[2].IsString()) {
    args_str = info[2].As<Napi::String>().Utf8Value();
    args = args_str.c_str();
  }
  
  AVFilterContext* ctx = nullptr;
  int ret = avfilter_graph_create_filter(&ctx, filter->Get(), name.c_str(), args, nullptr, graph);
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to create filter: ") + errbuf).ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Wrap the created context
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* wrapper = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  wrapper->SetUnowned(ctx);  // Graph owns the filter context
  
  return ctxObj;
}

Napi::Value FilterGraph::AllocFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least 2 arguments (filter, name)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Filter* filter = UnwrapNativeObject<Filter>(env, info[0], "Filter");
  if (!filter || !filter->Get()) {
    Napi::TypeError::New(env, "Invalid filter").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[1].As<Napi::String>().Utf8Value();
  
  // Allocate the filter context without initializing it
  AVFilterContext* ctx = avfilter_graph_alloc_filter(graph, filter->Get(), name.c_str());
  
  if (!ctx) {
    Napi::Error::New(env, "Failed to allocate filter context").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Wrap the created context
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* wrapper = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  wrapper->SetUnowned(ctx);  // Graph owns the filter context
  
  return ctxObj;
}

Napi::Value FilterGraph::GetFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected string argument (name)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  AVFilterContext* ctx = avfilter_graph_get_filter(graph, name.c_str());
  
  if (!ctx) {
    return env.Null();
  }
  
  // Wrap the context
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* wrapper = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  wrapper->SetUnowned(ctx);  // Graph owns the filter context
  
  return ctxObj;
}

Napi::Value FilterGraph::Parse(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "Expected 3 arguments (filters, inputs, outputs)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  
  // Extract inputs and outputs FilterInOut objects
  AVFilterInOut* inputs = nullptr;
  AVFilterInOut* outputs = nullptr;
  
  if (!info[1].IsNull() && !info[1].IsUndefined()) {
    FilterInOut* inObj = Napi::ObjectWrap<FilterInOut>::Unwrap(info[1].As<Napi::Object>());
    if (inObj) {
      inputs = inObj->Get();
    }
  }
  
  if (!info[2].IsNull() && !info[2].IsUndefined()) {
    FilterInOut* outObj = Napi::ObjectWrap<FilterInOut>::Unwrap(info[2].As<Napi::Object>());
    if (outObj) {
      outputs = outObj->Get();
    }
  }
  
  int ret = avfilter_graph_parse(graph, filters.c_str(), inputs, outputs, nullptr);
  
  // avfilter_graph_parse consumes the FilterInOut structures
  // Mark them as consumed so JavaScript won't try to free them again
  if (!info[1].IsNull() && !info[1].IsUndefined()) {
    FilterInOut* inObj = Napi::ObjectWrap<FilterInOut>::Unwrap(info[1].As<Napi::Object>());
    if (inObj) {
      inObj->MarkAsConsumed();
    }
  }
  
  if (!info[2].IsNull() && !info[2].IsUndefined()) {
    FilterInOut* outObj = Napi::ObjectWrap<FilterInOut>::Unwrap(info[2].As<Napi::Object>());
    if (outObj) {
      outObj->MarkAsConsumed();
    }
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::Parse2(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected string argument (filters)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  
  AVFilterInOut* inputs = nullptr;
  AVFilterInOut* outputs = nullptr;
  
  int ret = avfilter_graph_parse2(graph, filters.c_str(), &inputs, &outputs);
  
  // Clean up
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::ParsePtr(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected at least string argument (filters)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  std::string filters = info[0].As<Napi::String>().Utf8Value();
  const char* filter_ptr = filters.c_str();
  
  AVFilterInOut* inputs = nullptr;
  AVFilterInOut* outputs = nullptr;
  
  // If FilterInOut objects are provided, create copies since avfilter_graph_parse_ptr 
  // will take ownership and free them
  if (info.Length() >= 3) {
    // Get the inputs FilterInOut
    if (!info[1].IsNull() && !info[1].IsUndefined()) {
      FilterInOut* inObj = UnwrapNativeObject<FilterInOut>(env, info[1], "FilterInOut");
      if (inObj && inObj->Get()) {
        // Create a copy since avfilter_graph_parse_ptr will consume it
        AVFilterInOut* orig = inObj->Get();
        inputs = avfilter_inout_alloc();
        if (inputs) {
          inputs->name = orig->name ? av_strdup(orig->name) : nullptr;
          inputs->filter_ctx = orig->filter_ctx;
          inputs->pad_idx = orig->pad_idx;
          inputs->next = nullptr; // Don't copy the chain for now
        }
        // Mark the original as consumed since we've taken its data
        inObj->MarkAsConsumed();
      }
    }
    
    // Get the outputs FilterInOut
    if (!info[2].IsNull() && !info[2].IsUndefined()) {
      FilterInOut* outObj = UnwrapNativeObject<FilterInOut>(env, info[2], "FilterInOut");
      if (outObj && outObj->Get()) {
        // Create a copy since avfilter_graph_parse_ptr will consume it
        AVFilterInOut* orig = outObj->Get();
        outputs = avfilter_inout_alloc();
        if (outputs) {
          outputs->name = orig->name ? av_strdup(orig->name) : nullptr;
          outputs->filter_ctx = orig->filter_ctx;
          outputs->pad_idx = orig->pad_idx;
          outputs->next = nullptr; // Don't copy the chain for now
        }
        // Mark the original as consumed since we've taken its data
        outObj->MarkAsConsumed();
      }
    }
  }
  
  // Call avfilter_graph_parse_ptr with pointers to the pointers
  // This function will modify/free the inputs and outputs pointers
  int ret = avfilter_graph_parse_ptr(graph, filter_ptr, &inputs, &outputs, nullptr);
  
  // Clean up any remaining structures (in case of error or unconnected pads)
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::Validate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    Napi::Error::New(env, "FilterGraph not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Check if all filters have been properly configured
  // This is a basic validation - avfilter_graph_validate was added in newer versions
  // We implement the core validation logic here
  for (unsigned i = 0; i < graph->nb_filters; i++) {
    AVFilterContext* filter = graph->filters[i];
    
    // Check that all required inputs are connected
    for (unsigned j = 0; j < filter->nb_inputs; j++) {
      if (!filter->inputs[j]) {
        // Input pad not connected
        return Napi::Number::New(env, AVERROR(EINVAL));
      }
    }
    
    // Check that all required outputs are connected
    for (unsigned j = 0; j < filter->nb_outputs; j++) {
      if (!filter->outputs[j]) {
        // Output pad not connected  
        return Napi::Number::New(env, AVERROR(EINVAL));
      }
    }
  }
  
  return Napi::Number::New(env, 0);
}

// === Properties ===

Napi::Value FilterGraph::GetNbFilters(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterGraph* graph = Get();
  if (!graph) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, graph->nb_filters);
}

Napi::Value FilterGraph::GetFilters(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph || graph->nb_filters == 0) {
    return Napi::Array::New(env, 0);
  }
  
  Napi::Array filters = Napi::Array::New(env, graph->nb_filters);
  
  for (unsigned int i = 0; i < graph->nb_filters; i++) {
    if (graph->filters[i]) {
      Napi::Object ctxObj = FilterContext::constructor.New({});
      FilterContext* wrapper = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
      wrapper->SetUnowned(graph->filters[i]);
      filters.Set(i, ctxObj);
    } else {
      filters.Set(i, env.Null());
    }
  }
  
  return filters;
}

Napi::Value FilterGraph::GetThreadType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterGraph* graph = Get();
  if (!graph) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, graph->thread_type);
}

void FilterGraph::SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVFilterGraph* graph = Get();
  if (graph && value.IsNumber()) {
    graph->thread_type = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FilterGraph::GetNbThreads(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterGraph* graph = Get();
  if (!graph) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, graph->nb_threads);
}

void FilterGraph::SetNbThreads(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVFilterGraph* graph = Get();
  if (graph && value.IsNumber()) {
    graph->nb_threads = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FilterGraph::GetScaleSwsOpts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterGraph* graph = Get();
  if (!graph || !graph->scale_sws_opts) {
    return env.Null();
  }
  return Napi::String::New(env, graph->scale_sws_opts);
}

void FilterGraph::SetScaleSwsOpts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVFilterGraph* graph = Get();
  if (!graph) {
    return;
  }
  
  if (value.IsString()) {
    std::string opts = value.As<Napi::String>().Utf8Value();
    av_freep(&graph->scale_sws_opts);
    graph->scale_sws_opts = av_strdup(opts.c_str());
  } else if (value.IsNull()) {
    av_freep(&graph->scale_sws_opts);
    graph->scale_sws_opts = nullptr;
  }
}

// === Utility ===

Napi::Value FilterGraph::Dump(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterGraph* graph = Get();
  if (!graph) {
    return env.Null();
  }
  
  char* dump = avfilter_graph_dump(graph, nullptr);
  if (!dump) {
    return env.Null();
  }
  
  std::string result(dump);
  av_free(dump);
  
  return Napi::String::New(env, result);
}

Napi::Value FilterGraph::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg