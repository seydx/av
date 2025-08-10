#include "filter_context.h"
#include "filter.h"
#include "frame.h"
#include "common.h"

namespace ffmpeg {

Napi::FunctionReference FilterContext::constructor;

Napi::Object FilterContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterContext", {
    // Properties
    InstanceAccessor<&FilterContext::GetName>("name"),
    InstanceAccessor<&FilterContext::GetFilterName>("filterName"),
    InstanceAccessor<&FilterContext::GetFilter>("filter"),
    InstanceAccessor<&FilterContext::GetNbInputs>("nbInputs"),
    InstanceAccessor<&FilterContext::GetNbOutputs>("nbOutputs"),
    
    // Methods
    InstanceMethod<&FilterContext::AddFrame>("addFrame"),
    InstanceMethod<&FilterContext::AddFrameAsync>("addFrameAsync"),
    InstanceMethod<&FilterContext::GetFrame>("getFrame"),
    InstanceMethod<&FilterContext::GetFrameAsync>("getFrameAsync"),
    InstanceMethod<&FilterContext::SetFrameSize>("setFrameSize"),
    
    // Resource management
    InstanceMethod<&FilterContext::Free>("free"),
    InstanceMethod<&FilterContext::Dispose>(Napi::Symbol::For(env, "nodejs.dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterContext", func);
  return exports;
}

FilterContext::FilterContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<FilterContext>(info), context_(nullptr) {
}

Napi::Value FilterContext::GetName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!context_) {
    return env.Null();
  }
  
  // Get the context instance name
  if (context_->name) {
    return Napi::String::New(env, context_->name);
  }
  
  return env.Null();
}

Napi::Value FilterContext::GetFilterName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!context_ || !context_->filter) {
    return env.Null();
  }
  return Napi::String::New(env, context_->filter->name);
}

Napi::Value FilterContext::GetFilter(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!context_ || !context_->filter) {
    return env.Null();
  }
  
  // Create a Filter wrapper for the AVFilter
  Napi::Object filterObj = Filter::constructor.New({});
  Filter* filter = Napi::ObjectWrap<Filter>::Unwrap(filterObj);
  filter->SetFilter(const_cast<AVFilter*>(context_->filter));
  
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

Napi::Value FilterContext::AddFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "FilterContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  // Check if this is a buffer source context
  if (!context_->filter || strcmp(context_->filter->name, "buffer") != 0 &&
                            strcmp(context_->filter->name, "abuffer") != 0) {
    Napi::Error::New(env, "AddFrame can only be called on buffer source contexts").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  AVFrame* frame = nullptr;
  
  // Handle null frame for EOF signaling
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Frame* frameWrapper = UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (frameWrapper) {
      frame = frameWrapper->GetFrame();
    }
  }
  
  // Add frame to buffer source (nullptr for EOF)
  int ret = av_buffersrc_add_frame(context_, frame);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::AddFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Create promise
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  
  if (!context_) {
    deferred.Reject(Napi::Error::New(env, "FilterContext not initialized").Value());
    return deferred.Promise();
  }
  
  // Check if this is a buffer source context
  if (!context_->filter || (strcmp(context_->filter->name, "buffer") != 0 &&
                            strcmp(context_->filter->name, "abuffer") != 0)) {
    deferred.Reject(Napi::Error::New(env, "AddFrame can only be called on buffer source contexts").Value());
    return deferred.Promise();
  }
  
  AVFrame* frame = nullptr;
  
  // Handle null frame for EOF signaling
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Frame* frameWrapper = UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (frameWrapper) {
      frame = frameWrapper->GetFrame();
    }
  }
  
  // Create and queue async worker
  AddFrameWorker* worker = new AddFrameWorker(deferred, context_, frame);
  worker->Queue();
  
  return deferred.Promise();
}

Napi::Value FilterContext::GetFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "FilterContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  // Check if this is a buffer sink context
  if (!context_->filter || (strcmp(context_->filter->name, "buffersink") != 0 &&
                            strcmp(context_->filter->name, "abuffersink") != 0)) {
    Napi::Error::New(env, "GetFrame can only be called on buffer sink contexts").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Frame parameter required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  Frame* frameWrapper = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!frameWrapper) {
    return Napi::Number::New(env, -1);
  }
  
  AVFrame* frame = frameWrapper->GetFrame();
  
  // Get frame from buffer sink
  int ret = av_buffersink_get_frame(context_, frame);
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterContext::GetFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Create promise
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  
  if (!context_) {
    deferred.Reject(Napi::Error::New(env, "FilterContext not initialized").Value());
    return deferred.Promise();
  }
  
  // Check if this is a buffer sink context
  if (!context_->filter || (strcmp(context_->filter->name, "buffersink") != 0 &&
                            strcmp(context_->filter->name, "abuffersink") != 0)) {
    deferred.Reject(Napi::Error::New(env, "GetFrame can only be called on buffer sink contexts").Value());
    return deferred.Promise();
  }
  
  if (info.Length() < 1) {
    deferred.Reject(Napi::TypeError::New(env, "Frame parameter required").Value());
    return deferred.Promise();
  }
  
  Frame* frameWrapper = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!frameWrapper) {
    deferred.Reject(Napi::Error::New(env, "Invalid frame").Value());
    return deferred.Promise();
  }
  
  AVFrame* frame = frameWrapper->GetFrame();
  
  // Create and queue async worker
  GetFrameWorker* worker = new GetFrameWorker(deferred, context_, frame);
  worker->Queue();
  
  return deferred.Promise();
}

Napi::Value FilterContext::SetFrameSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "FilterContext not initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // This is primarily for audio buffer sinks
  if (!context_->filter || strcmp(context_->filter->name, "abuffersink") != 0) {
    // Not an error, just ignore for non-audio sinks
    return env.Undefined();
  }
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Frame size must be a number").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int frame_size = info[0].As<Napi::Number>().Int32Value();
  
  // Set the frame size for audio buffer sink
  av_buffersink_set_frame_size(context_, frame_size);
  
  return env.Undefined();
}

Napi::Value FilterContext::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // FilterContext doesn't own the AVFilterContext, it's owned by the graph
  // So we just clear our reference
  context_ = nullptr;
  return env.Undefined();
}

Napi::Value FilterContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

// ============================================================================
// Async Workers
// ============================================================================

AddFrameWorker::AddFrameWorker(
  Napi::Promise::Deferred deferred,
  AVFilterContext* context,
  AVFrame* frame
) : Napi::AsyncWorker(deferred.Env()),
    deferred_(deferred),
    context_(context),
    frame_(frame),
    result_(0) {
}

void AddFrameWorker::Execute() {
  result_ = av_buffersrc_add_frame(context_, frame_);
}

void AddFrameWorker::OnOK() {
  Napi::HandleScope scope(Env());
  deferred_.Resolve(Napi::Number::New(Env(), result_));
}

void AddFrameWorker::OnError(const Napi::Error& error) {
  Napi::HandleScope scope(Env());
  deferred_.Reject(error.Value());
}

GetFrameWorker::GetFrameWorker(
  Napi::Promise::Deferred deferred,
  AVFilterContext* context,
  AVFrame* frame
) : Napi::AsyncWorker(deferred.Env()),
    deferred_(deferred),
    context_(context),
    frame_(frame),
    result_(0) {
}

void GetFrameWorker::Execute() {
  result_ = av_buffersink_get_frame(context_, frame_);
}

void GetFrameWorker::OnOK() {
  Napi::HandleScope scope(Env());
  deferred_.Resolve(Napi::Number::New(Env(), result_));
}

void GetFrameWorker::OnError(const Napi::Error& error) {
  Napi::HandleScope scope(Env());
  deferred_.Reject(error.Value());
}

} // namespace ffmpeg