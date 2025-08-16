#include "hardware_frames_context.h"
#include "hardware_device_context.h"
#include "frame.h"
#include "error.h"

namespace ffmpeg {

Napi::FunctionReference HardwareFramesContext::constructor;

Napi::Object HardwareFramesContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "HardwareFramesContext", {
    // Methods - Low Level API
    InstanceMethod<&HardwareFramesContext::Alloc>("alloc"),
    InstanceMethod<&HardwareFramesContext::Init>("init"),
    InstanceMethod<&HardwareFramesContext::GetBuffer>("getBuffer"),
    InstanceMethod<&HardwareFramesContext::TransferData>("transferData"),
    InstanceMethod<&HardwareFramesContext::TransferGetFormats>("transferGetFormats"),
    InstanceMethod<&HardwareFramesContext::Map>("map"),
    InstanceMethod<&HardwareFramesContext::CreateDerived>("createDerived"),
    InstanceMethod<&HardwareFramesContext::Free>("free"),

    // Properties
    InstanceAccessor("format", &HardwareFramesContext::GetFormat, &HardwareFramesContext::SetFormat),
    InstanceAccessor("swFormat", &HardwareFramesContext::GetSwFormat, &HardwareFramesContext::SetSwFormat),
    InstanceAccessor("width", &HardwareFramesContext::GetWidth, &HardwareFramesContext::SetWidth),
    InstanceAccessor("height", &HardwareFramesContext::GetHeight, &HardwareFramesContext::SetHeight),
    InstanceAccessor("initialPoolSize", &HardwareFramesContext::GetInitialPoolSize, &HardwareFramesContext::SetInitialPoolSize),
    InstanceAccessor("deviceRef", &HardwareFramesContext::GetDeviceRef, nullptr),
    
    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &HardwareFramesContext::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("HardwareFramesContext", func);
  return exports;
}

// === Lifecycle ===

HardwareFramesContext::HardwareFramesContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<HardwareFramesContext>(info), unowned_ref_(nullptr) {
  // Constructor does nothing - user must call alloc()
}

HardwareFramesContext::~HardwareFramesContext() {
  // Manual cleanup if not already done
  if (frames_ref_ && !is_freed_) {
    av_buffer_unref(&frames_ref_);
    frames_ref_ = nullptr;
  }
  // RAII handles cleanup
}

// === Static Methods ===

Napi::Value HardwareFramesContext::Wrap(Napi::Env env, AVBufferRef* frames_ref) {
  if (!frames_ref) {
    return env.Null();
  }
  
  Napi::Object obj = constructor.New({});
  HardwareFramesContext* ctx = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(obj);
  ctx->SetUnowned(frames_ref); // We don't own contexts that are wrapped
  return obj;
}

// === Methods ===

Napi::Value HardwareFramesContext::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected HardwareDeviceContext")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (Get()) {
    Napi::Error::New(env, "Frames context already allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  HardwareDeviceContext* device = Napi::ObjectWrap<HardwareDeviceContext>::Unwrap(info[0].As<Napi::Object>());
  if (!device || !device->Get()) {
    Napi::Error::New(env, "Invalid device context").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVBufferRef* new_ref = av_hwframe_ctx_alloc(device->Get());
  if (!new_ref) {
    Napi::Error::New(env, "Failed to allocate hardware frames context").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (frames_ref_ && !is_freed_) { av_buffer_unref(&frames_ref_); } frames_ref_ = new_ref; is_freed_ = false;
  return env.Undefined();
}

Napi::Value HardwareFramesContext::Init(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref) {
    Napi::Error::New(env, "Frames context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int ret = av_hwframe_ctx_init(ref);
  return Napi::Number::New(env, ret);
}

Napi::Value HardwareFramesContext::GetBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected Frame object")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVBufferRef* ref = Get();
  if (!ref) {
    Napi::Error::New(env, "Frames context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* frame = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  if (!frame || !frame->Get()) {
    Napi::Error::New(env, "Invalid frame").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int flags = 0;
  if (info.Length() > 1 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_hwframe_get_buffer(ref, frame->Get(), flags);
  return Napi::Number::New(env, ret);
}

// TransferData is now implemented in hardware_frames_context_async.cc

Napi::Value HardwareFramesContext::TransferGetFormats(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref) {
    Napi::Error::New(env, "Frames context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected direction (AV_HWFRAME_TRANSFER_DIRECTION_*)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  enum AVHWFrameTransferDirection dir = static_cast<AVHWFrameTransferDirection>(
    info[0].As<Napi::Number>().Int32Value()
  );
  
  enum AVPixelFormat* formats = nullptr;
  int ret = av_hwframe_transfer_get_formats(ref, dir, &formats, 0);
  
  if (ret < 0 || !formats) {
    return Napi::Number::New(env, ret);
  }
  
  // Count formats
  int count = 0;
  while (formats[count] != AV_PIX_FMT_NONE) {
    count++;
  }
  
  // Create array
  Napi::Array arr = Napi::Array::New(env, count);
  for (int i = 0; i < count; i++) {
    arr[i] = Napi::Number::New(env, formats[i]);
  }
  
  av_free(formats);
  return arr;
}

Napi::Value HardwareFramesContext::Map(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "Expected (dst: Frame, src: Frame, flags?: number)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* dst = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  Frame* src = Napi::ObjectWrap<Frame>::Unwrap(info[1].As<Napi::Object>());
  
  if (!dst || !dst->Get() || !src || !src->Get()) {
    Napi::Error::New(env, "Invalid frame(s)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int flags = 0;
  if (info.Length() > 2 && info[2].IsNumber()) {
    flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_hwframe_map(dst->Get(), src->Get(), flags);
  return Napi::Number::New(env, ret);
}

Napi::Value HardwareFramesContext::CreateDerived(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsObject() || !info[2].IsObject()) {
    Napi::TypeError::New(env, "Expected (format: number, derivedDevice: HardwareDeviceContext, sourceFrames: HardwareFramesContext, flags?: number)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  enum AVPixelFormat format = static_cast<AVPixelFormat>(info[0].As<Napi::Number>().Int32Value());
  
  HardwareDeviceContext* derivedDevice = Napi::ObjectWrap<HardwareDeviceContext>::Unwrap(info[1].As<Napi::Object>());
  if (!derivedDevice || !derivedDevice->Get()) {
    Napi::Error::New(env, "Invalid derived device context").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  HardwareFramesContext* src = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(info[2].As<Napi::Object>());
  if (!src || !src->Get()) {
    Napi::Error::New(env, "Invalid source frames context").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int flags = 0;
  if (info.Length() > 3 && info[3].IsNumber()) {
    flags = info[3].As<Napi::Number>().Int32Value();
  }
  
  // Free existing context if any
  if (frames_ref_ && !is_freed_) { av_buffer_unref(&frames_ref_); frames_ref_ = nullptr; is_freed_ = true; }
  unowned_ref_ = nullptr;
  
  AVBufferRef* new_ref = nullptr;
  int ret = av_hwframe_ctx_create_derived(&new_ref, format, derivedDevice->Get(), src->Get(), flags);
  
  if (ret >= 0 && new_ref) {
    if (frames_ref_ && !is_freed_) { av_buffer_unref(&frames_ref_); } frames_ref_ = new_ref; is_freed_ = false;
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value HardwareFramesContext::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (frames_ref_ && !is_freed_) { av_buffer_unref(&frames_ref_); frames_ref_ = nullptr; is_freed_ = true; }
  unowned_ref_ = nullptr;
  
  return env.Undefined();
}

// === Properties ===

Napi::Value HardwareFramesContext::GetFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Undefined();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  return Napi::Number::New(env, ctx->format);
}

void HardwareFramesContext::SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return;
  }
  
  if (!value.IsNumber()) {
    return;
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  ctx->format = static_cast<AVPixelFormat>(value.As<Napi::Number>().Int32Value());
}

Napi::Value HardwareFramesContext::GetSwFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Undefined();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  return Napi::Number::New(env, ctx->sw_format);
}

void HardwareFramesContext::SetSwFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return;
  }
  
  if (!value.IsNumber()) {
    return;
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  ctx->sw_format = static_cast<AVPixelFormat>(value.As<Napi::Number>().Int32Value());
}

Napi::Value HardwareFramesContext::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Undefined();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  return Napi::Number::New(env, ctx->width);
}

void HardwareFramesContext::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return;
  }
  
  if (!value.IsNumber()) {
    return;
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  ctx->width = value.As<Napi::Number>().Int32Value();
}

Napi::Value HardwareFramesContext::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Undefined();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  return Napi::Number::New(env, ctx->height);
}

void HardwareFramesContext::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return;
  }
  
  if (!value.IsNumber()) {
    return;
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  ctx->height = value.As<Napi::Number>().Int32Value();
}

Napi::Value HardwareFramesContext::GetInitialPoolSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Undefined();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  return Napi::Number::New(env, ctx->initial_pool_size);
}

void HardwareFramesContext::SetInitialPoolSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return;
  }
  
  if (!value.IsNumber()) {
    return;
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  ctx->initial_pool_size = value.As<Napi::Number>().Int32Value();
}

Napi::Value HardwareFramesContext::GetDeviceRef(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVBufferRef* ref = Get();
  if (!ref || !ref->data) {
    return env.Null();
  }
  
  AVHWFramesContext* ctx = reinterpret_cast<AVHWFramesContext*>(ref->data);
  if (!ctx->device_ref) {
    return env.Null();
  }
  
  return HardwareDeviceContext::Wrap(env, ctx->device_ref);
}

// === Utility ===

Napi::Value HardwareFramesContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg