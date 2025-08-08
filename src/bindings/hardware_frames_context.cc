#include "hardware_frames_context.h"
#include "hardware_device_context.h"

namespace ffmpeg {

Napi::FunctionReference HardwareFramesContext::constructor;

Napi::Object HardwareFramesContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "HardwareFramesContext", {
    // Static factory method
    StaticMethod<&HardwareFramesContext::Alloc>("alloc"),
    
    // Methods
    InstanceMethod<&HardwareFramesContext::Initialize>("initialize"),
    InstanceMethod<&HardwareFramesContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Properties
    InstanceAccessor<&HardwareFramesContext::GetWidth, &HardwareFramesContext::SetWidth>("width"),
    InstanceAccessor<&HardwareFramesContext::GetHeight, &HardwareFramesContext::SetHeight>("height"),
    InstanceAccessor<&HardwareFramesContext::GetHardwarePixelFormat, &HardwareFramesContext::SetHardwarePixelFormat>("hardwarePixelFormat"),
    InstanceAccessor<&HardwareFramesContext::GetSoftwarePixelFormat, &HardwareFramesContext::SetSoftwarePixelFormat>("softwarePixelFormat"),
    InstanceAccessor<&HardwareFramesContext::GetInitialPoolSize, &HardwareFramesContext::SetInitialPoolSize>("initialPoolSize"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("HardwareFramesContext", func);
  return exports;
}

HardwareFramesContext::HardwareFramesContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<HardwareFramesContext>(info), context_(nullptr) {
  // Constructor is private, use Alloc() static method
}

HardwareFramesContext::~HardwareFramesContext() {
  if (context_) {
    av_buffer_unref(&context_);
    context_ = nullptr;
  }
}

// Get data pointer
AVHWFramesContext* HardwareFramesContext::GetData() {
  if (!context_) {
    return nullptr;
  }
  return reinterpret_cast<AVHWFramesContext*>(context_->data);
}

// Static factory method
Napi::Value HardwareFramesContext::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Hardware device context required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object hdcObj = info[0].As<Napi::Object>();
  HardwareDeviceContext* hdc = Napi::ObjectWrap<HardwareDeviceContext>::Unwrap(hdcObj);
  
  AVBufferRef* framesContext = av_hwframe_ctx_alloc(hdc->GetContext());
  if (!framesContext) {
    Napi::Error::New(env, "Failed to allocate hardware frames context").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create wrapper object
  Napi::Object obj = constructor.New({});
  HardwareFramesContext* hfc = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(obj);
  hfc->context_ = framesContext;
  
  return obj;
}

// Initialize
Napi::Value HardwareFramesContext::Initialize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Hardware frames context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int ret = av_hwframe_ctx_init(context_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to initialize hardware frames context");
  }
  
  return env.Undefined();
}

// Dispose
Napi::Value HardwareFramesContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_) {
    av_buffer_unref(&context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

// Properties
Napi::Value HardwareFramesContext::GetWidth(const Napi::CallbackInfo& info) {
  AVHWFramesContext* data = GetData();
  return Napi::Number::New(info.Env(), data ? data->width : 0);
}

void HardwareFramesContext::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVHWFramesContext* data = GetData();
  if (data) {
    data->width = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value HardwareFramesContext::GetHeight(const Napi::CallbackInfo& info) {
  AVHWFramesContext* data = GetData();
  return Napi::Number::New(info.Env(), data ? data->height : 0);
}

void HardwareFramesContext::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVHWFramesContext* data = GetData();
  if (data) {
    data->height = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value HardwareFramesContext::GetHardwarePixelFormat(const Napi::CallbackInfo& info) {
  AVHWFramesContext* data = GetData();
  return Napi::Number::New(info.Env(), data ? data->format : AV_PIX_FMT_NONE);
}

void HardwareFramesContext::SetHardwarePixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVHWFramesContext* data = GetData();
  if (data) {
    data->format = static_cast<AVPixelFormat>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value HardwareFramesContext::GetSoftwarePixelFormat(const Napi::CallbackInfo& info) {
  AVHWFramesContext* data = GetData();
  return Napi::Number::New(info.Env(), data ? data->sw_format : AV_PIX_FMT_NONE);
}

void HardwareFramesContext::SetSoftwarePixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVHWFramesContext* data = GetData();
  if (data) {
    data->sw_format = static_cast<AVPixelFormat>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value HardwareFramesContext::GetInitialPoolSize(const Napi::CallbackInfo& info) {
  AVHWFramesContext* data = GetData();
  return Napi::Number::New(info.Env(), data ? data->initial_pool_size : 0);
}

void HardwareFramesContext::SetInitialPoolSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  AVHWFramesContext* data = GetData();
  if (data) {
    data->initial_pool_size = value.As<Napi::Number>().Int32Value();
  }
}

} // namespace ffmpeg