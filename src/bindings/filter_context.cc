#include "filter_context.h"
#include "filter.h"
#include "filter_graph.h"
#include "dictionary.h"
#include "frame.h"
#include "common.h"

extern "C" {
#include <libavutil/mem.h>
#include <libavutil/opt.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

Napi::FunctionReference FilterContext::constructor;

// === Init ===

Napi::Object FilterContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterContext", {
    // Operations
    InstanceMethod<&FilterContext::Init>("init"),
    InstanceMethod<&FilterContext::InitStr>("initStr"),
    InstanceMethod<&FilterContext::Link>("link"),
    InstanceMethod<&FilterContext::Unlink>("unlink"),
    InstanceMethod<&FilterContext::Free>("free"),
    InstanceMethod<&FilterContext::SetOpt>("setOpt"),
    InstanceMethod<&FilterContext::OptSetBin>("optSetBin"),
    InstanceMethod<&FilterContext::BuffersrcAddFrame>("buffersrcAddFrame"),
    InstanceMethod<&FilterContext::BuffersrcParametersSet>("buffersrcParametersSet"),
    InstanceMethod<&FilterContext::BuffersinkGetFrame>("buffersinkGetFrame"),
    // InstanceMethod<&FilterContext::BuffersinkSetFrameSize>("buffersinkSetFrameSize"),
    InstanceMethod<&FilterContext::BuffersinkGetTimeBase>("buffersinkGetTimeBase"),

    // Properties
    InstanceAccessor<&FilterContext::GetName, &FilterContext::SetName>("name"),
    InstanceAccessor<&FilterContext::GetFilter>("filter"),
    InstanceAccessor<&FilterContext::GetGraph>("graph"),
    InstanceAccessor<&FilterContext::GetNbInputs>("nbInputs"),
    InstanceAccessor<&FilterContext::GetNbOutputs>("nbOutputs"),
    InstanceAccessor<&FilterContext::GetReady>("ready"),
    
    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &FilterContext::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterContext", func);
  return exports;
}

// === Lifecycle ===

FilterContext::FilterContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<FilterContext>(info), unowned_ctx_(nullptr) {
  // Context is created by FilterGraph::createFilter
}

FilterContext::~FilterContext() {
  // Manual cleanup if not already done
  if (ctx_ && !is_freed_) {
    avfilter_free(ctx_);
    ctx_ = nullptr;
  }
  // Unowned contexts are managed by FilterGraph
}

// === Methods ===

Napi::Value FilterContext::Init(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  AVDictionary* options = nullptr;
  
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dict && dict->Get()) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }
  
  int ret = avfilter_init_dict(ctx, &options);
  
  if (options) {
    av_dict_free(&options);
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::InitStr(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  const char* args = nullptr;
  std::string args_str;
  
  if (info.Length() > 0 && info[0].IsString()) {
    args_str = info[0].As<Napi::String>().Utf8Value();
    args = args_str.c_str();
  }
  
  int ret = avfilter_init_str(ctx, args);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::Link(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "Expected 3 arguments (srcPad, dst, dstPad)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int srcPad = info[0].As<Napi::Number>().Int32Value();
  
  FilterContext* dst = UnwrapNativeObject<FilterContext>(env, info[1], "FilterContext");
  if (!dst || !dst->Get()) {
    Napi::TypeError::New(env, "Invalid destination FilterContext").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int dstPad = info[2].As<Napi::Number>().Int32Value();
  
  int ret = avfilter_link(ctx, srcPad, dst->Get(), dstPad);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::Unlink(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected 1 argument (pad)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int pad = info[0].As<Napi::Number>().Int32Value();
  
  // Fix sign comparison warning by casting to unsigned
  if (pad >= 0 && static_cast<unsigned int>(pad) < ctx->nb_inputs) {
    // avfilter_link_free is deprecated, just set to nullptr instead
    // The link will be freed when the filter context is freed
    if (ctx->inputs[pad]) {
      ctx->inputs[pad] = nullptr;
    }
  }
  
  return env.Undefined();
}

Napi::Value FilterContext::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Free owned context
  if (ctx_ && !is_freed_) { avfilter_free(ctx_); ctx_ = nullptr; is_freed_ = true; }
  unowned_ctx_ = nullptr;
  
  return env.Undefined();
}

Napi::Value FilterContext::SetOpt(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  
  if (!ctx) {
    Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least 2 arguments (key, value)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (!info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Key and value must be strings").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  std::string key = info[0].As<Napi::String>().Utf8Value();
  std::string value = info[1].As<Napi::String>().Utf8Value();
  
  // Optional search_flags parameter (default to AV_OPT_SEARCH_CHILDREN)
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  // Set the option using av_opt_set
  int ret = av_opt_set(ctx, key.c_str(), value.c_str(), search_flags);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::OptSetBin(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  
  if (!ctx) {
    Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected at least 2 arguments (key, values)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Key must be a string").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  std::string key = info[0].As<Napi::String>().Utf8Value();
  
  // Handle array of integers
  if (info[1].IsArray()) {
    Napi::Array arr = info[1].As<Napi::Array>();
    uint32_t len = arr.Length();
    
    if (len == 0) {
      Napi::TypeError::New(env, "Values array cannot be empty").ThrowAsJavaScriptException();
      return Napi::Number::New(env, AVERROR(EINVAL));
    }
    
    // Allocate buffer for values
    int* values = new int[len];
    
    for (uint32_t i = 0; i < len; i++) {
      Napi::Value val = arr[i];
      if (!val.IsNumber()) {
        delete[] values;
        Napi::TypeError::New(env, "All array elements must be numbers").ThrowAsJavaScriptException();
        return Napi::Number::New(env, AVERROR(EINVAL));
      }
      values[i] = val.As<Napi::Number>().Int32Value();
    }
    
    // Optional search_flags parameter (default to AV_OPT_SEARCH_CHILDREN)
    int search_flags = AV_OPT_SEARCH_CHILDREN;
    if (info.Length() > 2 && info[2].IsNumber()) {
      search_flags = info[2].As<Napi::Number>().Int32Value();
    }
    
    // Set the option using av_opt_set_bin
    int ret = av_opt_set_bin(ctx, key.c_str(), (uint8_t*)values, len * sizeof(int), search_flags);
    
    delete[] values;
    return Napi::Number::New(env, ret);
  } else if (info[1].IsNumber()) {
    // Single integer value
    int value = info[1].As<Napi::Number>().Int32Value();
    
    // Optional search_flags parameter (default to AV_OPT_SEARCH_CHILDREN)
    int search_flags = AV_OPT_SEARCH_CHILDREN;
    if (info.Length() > 2 && info[2].IsNumber()) {
      search_flags = info[2].As<Napi::Number>().Int32Value();
    }
    
    // Set the option using av_opt_set_bin
    int ret = av_opt_set_bin(ctx, key.c_str(), (uint8_t*)&value, sizeof(int), search_flags);
    
    return Napi::Number::New(env, ret);
  } else {
    Napi::TypeError::New(env, "Values must be an array of numbers or a single number").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
}

// Napi::Value FilterContext::BuffersinkSetFrameSize(const Napi::CallbackInfo& info) {
//   Napi::Env env = info.Env();
//   AVFilterContext* ctx = Get();
  
//   if (!ctx) {
//     Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }
  
//   if (info.Length() < 1 || !info[0].IsNumber()) {
//     Napi::TypeError::New(env, "Expected frame size as number").ThrowAsJavaScriptException();
//     return env.Undefined();
//   }
  
//   unsigned int frame_size = info[0].As<Napi::Number>().Uint32Value();
  
//   // Set the frame size for buffersink
//   av_buffersink_set_frame_size(ctx, frame_size);
  
//   return env.Undefined();
// }

Napi::Value FilterContext::BuffersinkGetTimeBase(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  
  if (!ctx) {
    Napi::TypeError::New(env, "FilterContext is not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Get the timebase from buffersink
  AVRational tb = av_buffersink_get_time_base(ctx);
  
  // Return as object with num and den properties
  Napi::Object result = Napi::Object::New(env);
  result.Set("num", Napi::Number::New(env, tb.num));
  result.Set("den", Napi::Number::New(env, tb.den));
  
  return result;
}

// === Properties ===

Napi::Value FilterContext::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx || !ctx->name) {
    return env.Null();
  }
  return Napi::String::New(env, ctx->name);
}

void FilterContext::SetName(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVFilterContext* ctx = Get();
  if (!ctx) {
    return;
  }
  
  if (value.IsString()) {
    std::string name = value.As<Napi::String>().Utf8Value();
    av_freep(&ctx->name);
    ctx->name = av_strdup(name.c_str());
  }
}

Napi::Value FilterContext::GetFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx || !ctx->filter) {
    return env.Null();
  }
  
  Napi::Object filterObj = Filter::constructor.New({});
  Filter* filter = Napi::ObjectWrap<Filter>::Unwrap(filterObj);
  filter->Set(ctx->filter);
  
  return filterObj;
}

Napi::Value FilterContext::GetGraph(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx || !ctx->graph) {
    return env.Null();
  }
  
  // Wrap the existing AVFilterGraph in a FilterGraph object
  // Note: We don't own this graph, it's managed by the filter context
  Napi::Object graphObj = FilterGraph::constructor.New({});
  FilterGraph* graph = Napi::ObjectWrap<FilterGraph>::Unwrap(graphObj);
  graph->SetUnowned(ctx->graph); // We don't own it
  return graphObj;
}

Napi::Value FilterContext::GetNbInputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, ctx->nb_inputs);
}

Napi::Value FilterContext::GetNbOutputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, ctx->nb_outputs);
}

Napi::Value FilterContext::GetReady(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, ctx->ready);
}

// === Utility ===

Napi::Value FilterContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg