#include "filter_context.h"
#include "filter.h"
#include "filter_graph.h"
#include "dictionary.h"
#include "frame.h"
#include "hardware_device_context.h"
#include "hardware_frames_context.h"
#include "common.h"

extern "C" {
#include <libavutil/mem.h>
#include <libavutil/opt.h>
#include <libavutil/buffer.h>
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
    InstanceMethod<&FilterContext::BuffersrcAddFrameAsync>("buffersrcAddFrame"),
    InstanceMethod<&FilterContext::BuffersrcParametersSet>("buffersrcParametersSet"),
    InstanceMethod<&FilterContext::BuffersinkGetFrameAsync>("buffersinkGetFrame"),
    // InstanceMethod<&FilterContext::BuffersinkSetFrameSize>("buffersinkSetFrameSize"),
    InstanceMethod<&FilterContext::BuffersinkGetTimeBase>("buffersinkGetTimeBase"),

    // Properties
    InstanceAccessor<&FilterContext::GetName, &FilterContext::SetName>("name"),
    InstanceAccessor<&FilterContext::GetFilter>("filter"),
    InstanceAccessor<&FilterContext::GetGraph>("graph"),
    InstanceAccessor<&FilterContext::GetNbInputs>("nbInputs"),
    InstanceAccessor<&FilterContext::GetNbOutputs>("nbOutputs"),
    InstanceAccessor<&FilterContext::GetReady>("ready"),
    InstanceAccessor<&FilterContext::GetHwDeviceCtx, &FilterContext::SetHwDeviceCtx>("hwDeviceCtx"),
    
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

Napi::Value FilterContext::BuffersrcParametersSet(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse parameters object
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Parameters object expected").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object params = info[0].As<Napi::Object>();
  
  // Allocate parameters structure
  AVBufferSrcParameters* par = av_buffersrc_parameters_alloc();
  if (!par) {
    Napi::Error::New(env, "Failed to allocate buffer source parameters").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Set video parameters
  if (params.Has("width")) {
    par->width = params.Get("width").As<Napi::Number>().Int32Value();
  }
  if (params.Has("height")) {
    par->height = params.Get("height").As<Napi::Number>().Int32Value();
  }
  if (params.Has("format")) {
    par->format = params.Get("format").As<Napi::Number>().Int32Value();
  }
  if (params.Has("timeBase")) {
    Napi::Object tb = params.Get("timeBase").As<Napi::Object>();
    par->time_base.num = tb.Get("num").As<Napi::Number>().Int32Value();
    par->time_base.den = tb.Get("den").As<Napi::Number>().Int32Value();
  }
  if (params.Has("frameRate")) {
    Napi::Object fr = params.Get("frameRate").As<Napi::Object>();
    par->frame_rate.num = fr.Get("num").As<Napi::Number>().Int32Value();
    par->frame_rate.den = fr.Get("den").As<Napi::Number>().Int32Value();
  }
  if (params.Has("sampleAspectRatio")) {
    Napi::Object sar = params.Get("sampleAspectRatio").As<Napi::Object>();
    par->sample_aspect_ratio.num = sar.Get("num").As<Napi::Number>().Int32Value();
    par->sample_aspect_ratio.den = sar.Get("den").As<Napi::Number>().Int32Value();
  }
  
  // Set hardware frames context if provided
  if (params.Has("hwFramesCtx") && !params.Get("hwFramesCtx").IsNull()) {
    HardwareFramesContext* hwFramesCtx = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(params.Get("hwFramesCtx").As<Napi::Object>());
    if (hwFramesCtx && hwFramesCtx->Get()) {
      par->hw_frames_ctx = av_buffer_ref(hwFramesCtx->Get());
    }
  }
  
  // Set audio parameters
  if (params.Has("sampleRate")) {
    par->sample_rate = params.Get("sampleRate").As<Napi::Number>().Int32Value();
  }
  if (params.Has("channelLayout")) {
    uint64_t layout_mask = params.Get("channelLayout").As<Napi::BigInt>().Uint64Value(nullptr);
    av_channel_layout_from_mask(&par->ch_layout, layout_mask);
  }
  
  // Apply parameters to buffer source
  int ret = av_buffersrc_parameters_set(ctx, par);
  
  // Free parameters (av_buffersrc_parameters_set makes internal copies)
  av_free(par);
  
  return Napi::Number::New(env, ret);
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

Napi::Value FilterContext::GetHwDeviceCtx(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx || !ctx->hw_device_ctx) {
    return env.Null();
  }
  
  // Use Wrap to create a HardwareDeviceContext wrapper for the existing AVBufferRef
  return HardwareDeviceContext::Wrap(env, ctx->hw_device_ctx);
}

void FilterContext::SetHwDeviceCtx(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  AVFilterContext* ctx = Get();
  if (!ctx) {
    Napi::Error::New(env, "FilterContext not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    // Clear hw_device_ctx
    if (ctx->hw_device_ctx) {
      av_buffer_unref(&ctx->hw_device_ctx);
    }
  } else if (value.IsObject()) {
    // Expect a HardwareDeviceContext object
    HardwareDeviceContext* hwDeviceCtx = Napi::ObjectWrap<HardwareDeviceContext>::Unwrap(value.As<Napi::Object>());
    if (hwDeviceCtx) {
      AVBufferRef* deviceRef = hwDeviceCtx->Get();
      if (deviceRef) {
        // Unref old if exists
        if (ctx->hw_device_ctx) {
          av_buffer_unref(&ctx->hw_device_ctx);
        }
        // Ref the new one
        ctx->hw_device_ctx = av_buffer_ref(deviceRef);
      }
    }
  } else {
    Napi::TypeError::New(env, "hwDeviceCtx must be a HardwareDeviceContext or null").ThrowAsJavaScriptException();
  }
}

// === Utility ===

Napi::Value FilterContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg