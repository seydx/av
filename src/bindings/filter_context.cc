#include "filter_context.h"
#include "filter.h"
#include "frame.h"
#include "dictionary.h"
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>

namespace ffmpeg {

Napi::FunctionReference FilterContext::constructor;

Napi::Object FilterContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterContext", {
    // Methods
    InstanceMethod<&FilterContext::Init>("init"),
    InstanceMethod<&FilterContext::Link>("link"),
    InstanceMethod<&FilterContext::Unlink>("unlink"),
    InstanceMethod<&FilterContext::BufferSrcAddFrame>("bufferSrcAddFrame"),
    InstanceMethod<&FilterContext::BufferSinkGetFrame>("bufferSinkGetFrame"),
    
    // Properties
    InstanceAccessor<&FilterContext::GetName>("name"),
    InstanceAccessor<&FilterContext::GetFilter>("filter"),
    InstanceAccessor<&FilterContext::GetNbInputs>("nbInputs"),
    InstanceAccessor<&FilterContext::GetNbOutputs>("nbOutputs"),
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
Napi::Value FilterContext::Init(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Filter context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVDictionary* options = nullptr;
  std::string args;
  
  // Optional args string
  if (info.Length() > 0 && info[0].IsString()) {
    args = info[0].As<Napi::String>().Utf8Value();
  }
  
  // Optional options dictionary
  if (info.Length() > 1 && info[1].IsObject()) {
    Napi::Object dictObj = info[1].As<Napi::Object>();
    Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(dictObj);
    options = dict->GetDict();
  }
  
  int ret = avfilter_init_str(context_, args.empty() ? nullptr : args.c_str());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to initialize filter");
  }
  
  return env.Undefined();
}

Napi::Value FilterContext::Link(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Destination context, srcPad, and dstPad required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Object dstObj = info[0].As<Napi::Object>();
  FilterContext* dst = Napi::ObjectWrap<FilterContext>::Unwrap(dstObj);
  
  int srcPad = info[1].As<Napi::Number>().Int32Value();
  int dstPad = info[2].As<Napi::Number>().Int32Value();
  
  int ret = avfilter_link(context_, srcPad, dst->GetContext(), dstPad);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to link filters");
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
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object frameObj = info[0].As<Napi::Object>();
    Frame* f = Napi::ObjectWrap<Frame>::Unwrap(frameObj);
    frame = f->GetFrame();
  }
  
  int flags = 0;
  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_buffersrc_add_frame_flags(context_, frame, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to add frame to buffer source");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::BufferSinkGetFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Frame object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object frameObj = info[0].As<Napi::Object>();
  Frame* frame = Napi::ObjectWrap<Frame>::Unwrap(frameObj);
  
  int ret = av_buffersink_get_frame(context_, frame->GetFrame());
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to get frame from buffer sink");
  }
  
  return Napi::Number::New(env, ret);
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