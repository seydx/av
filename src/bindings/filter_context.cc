#include "filter_context.h"
#include "filter.h"
#include "frame.h"
#include "dictionary.h"
#include "option.h"
#include "common.h"
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>

namespace ffmpeg {

Napi::FunctionReference FilterContext::constructor;

Napi::Object FilterContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterContext", {
    // Methods
    InstanceMethod<&FilterContext::Link>("link"),
    InstanceMethod<&FilterContext::Unlink>("unlink"),
    InstanceMethod<&FilterContext::BufferSrcAddFrame>("bufferSrcAddFrame"),
    InstanceMethod<&FilterContext::BufferSrcAddFrameAsync>("bufferSrcAddFrameAsync"),
    InstanceMethod<&FilterContext::BufferSinkGetFrame>("bufferSinkGetFrame"),
    InstanceMethod<&FilterContext::BufferSinkGetFrameAsync>("bufferSinkGetFrameAsync"),
    
    // Properties
    InstanceAccessor<&FilterContext::GetName>("name"),
    InstanceAccessor<&FilterContext::GetFilter>("filter"),
    InstanceAccessor<&FilterContext::GetNbInputs>("nbInputs"),
    InstanceAccessor<&FilterContext::GetNbOutputs>("nbOutputs"),
    
    // Options
    InstanceAccessor<&FilterContext::GetOptions>("options"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterContext", func);
  return exports;
}

FilterContext::FilterContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<FilterContext>(info), context_(nullptr) {
  // FilterContext objects are created by FilterGraph
}

// Methods
Napi::Value FilterContext::Link(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Destination context, srcPad, and dstPad required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  FilterContext* dst = ffmpeg::UnwrapNativeObjectRequired<FilterContext>(env, info[0], "FilterContext");
  if (!dst) return env.Undefined();
  
  int srcPad = info[1].As<Napi::Number>().Int32Value();
  int dstPad = info[2].As<Napi::Number>().Int32Value();
  
  int ret = avfilter_link(context_, srcPad, dst->GetContext(), dstPad);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to link filters");
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value FilterContext::Unlink(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Pad index required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int pad = info[0].As<Napi::Number>().Int32Value();
  
  avfilter_free(context_);
  context_ = nullptr;
  
  return env.Undefined();
}

Napi::Value FilterContext::BufferSrcAddFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFrame* frame = nullptr;
  if (info.Length() > 0) {
    Frame* f = ffmpeg::UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (f) {
      frame = f->GetFrame();
    }
  }
  
  int flags = 0;
  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_buffersrc_add_frame_flags(context_, frame, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to add frame to buffer source");
    return Napi::Number::New(env, ret);
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::BufferSinkGetFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Frame object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Frame* frame = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!frame) return env.Null();
  
  int ret = av_buffersink_get_frame(context_, frame->GetFrame());
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to get frame from buffer sink");
    return Napi::Number::New(env, ret);
  }
  
  return Napi::Number::New(env, ret);
}

// Options
Napi::Value FilterContext::GetOptions(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return env.Null();
  }
  
  // Use the Options helper to create an Options wrapper
  return Options::CreateFromContext(env, context_);
}

// Properties
Napi::Value FilterContext::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_ || !context_->name) {
    return env.Null();
  }
  
  return Napi::String::New(env, context_->name);
}

Napi::Value FilterContext::GetFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_ || !context_->filter) {
    return env.Null();
  }
  
  // Check if Filter constructor is initialized
  if (Filter::constructor.IsEmpty()) {
    Napi::Error::New(env, "Filter class not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object filterObj = Filter::constructor.New({});
  Filter* filter = Napi::ObjectWrap<Filter>::Unwrap(filterObj);
  filter->SetFilter(context_->filter);
  
  return filterObj;
}

Napi::Value FilterContext::GetNbInputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, context_->nb_inputs);
}

Napi::Value FilterContext::GetNbOutputs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, context_->nb_outputs);
}

} // namespace ffmpeg