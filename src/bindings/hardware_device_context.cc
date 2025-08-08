#include "hardware_device_context.h"
#include "dictionary.h"

namespace ffmpeg {

Napi::FunctionReference HardwareDeviceContext::constructor;

Napi::Object HardwareDeviceContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "HardwareDeviceContext", {
    // Static methods
    StaticMethod<&HardwareDeviceContext::FindTypeByName>("findTypeByName"),
    StaticMethod<&HardwareDeviceContext::GetTypeName>("getTypeName"),
    StaticMethod<&HardwareDeviceContext::GetSupportedTypes>("getSupportedTypes"),
    
    // Instance methods
    InstanceMethod<&HardwareDeviceContext::GetHardwareFramesConstraints>("getHardwareFramesConstraints"),
    InstanceMethod<&HardwareDeviceContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Properties
    InstanceAccessor<&HardwareDeviceContext::GetType>("type"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("HardwareDeviceContext", func);
  return exports;
}

HardwareDeviceContext::HardwareDeviceContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<HardwareDeviceContext>(info), context_(nullptr), type_(AV_HWDEVICE_TYPE_NONE) {
  Napi::Env env = info.Env();
  
  // Constructor now handles initialization directly
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Hardware device type required").ThrowAsJavaScriptException();
    return;
  }
  
  AVHWDeviceType type = static_cast<AVHWDeviceType>(info[0].As<Napi::Number>().Int32Value());
  
  // Optional device name
  const char* device = nullptr;
  std::string deviceStr;
  if (info.Length() > 1 && info[1].IsString()) {
    deviceStr = info[1].As<Napi::String>().Utf8Value();
    device = deviceStr.c_str();
  }
  
  // Optional options dictionary
  AVDictionary* options = nullptr;
  if (info.Length() > 2 && info[2].IsObject()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[2], "Dictionary");
    if (dict) {
      options = dict->GetDict();
    }
  }
  
  // Optional flags
  int flags = 0;
  if (info.Length() > 3 && info[3].IsNumber()) {
    flags = info[3].As<Napi::Number>().Int32Value();
  }
  
  // Create hardware device context
  AVBufferRef* hwContext = nullptr;
  int ret = av_hwdevice_ctx_create(&hwContext, type, device, options, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create hardware device context");
    return;
  }
  
  context_ = hwContext;
  type_ = type;
}

HardwareDeviceContext::~HardwareDeviceContext() {
  if (context_) {
    av_buffer_unref(&context_);
    context_ = nullptr;
  }
}

// Find hardware device type by name
Napi::Value HardwareDeviceContext::FindTypeByName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Type name required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AV_HWDEVICE_TYPE_NONE);
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  AVHWDeviceType type = av_hwdevice_find_type_by_name(name.c_str());
  
  return Napi::Number::New(env, type);
}

// Get name of hardware device type
Napi::Value HardwareDeviceContext::GetTypeName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Hardware device type required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  AVHWDeviceType type = static_cast<AVHWDeviceType>(info[0].As<Napi::Number>().Int32Value());
  const char* name = av_hwdevice_get_type_name(type);
  
  if (!name) {
    return env.Null();
  }
  
  return Napi::String::New(env, name);
}

// Get all supported hardware device types
Napi::Value HardwareDeviceContext::GetSupportedTypes(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Array types = Napi::Array::New(env);
  
  AVHWDeviceType type = AV_HWDEVICE_TYPE_NONE;
  uint32_t index = 0;
  
  while ((type = av_hwdevice_iterate_types(type)) != AV_HWDEVICE_TYPE_NONE) {
    Napi::Object typeObj = Napi::Object::New(env);
    typeObj.Set("type", Napi::Number::New(env, type));
    typeObj.Set("name", Napi::String::New(env, av_hwdevice_get_type_name(type)));
    types[index++] = typeObj;
  }
  
  return types;
}

// Get hardware frames constraints
Napi::Value HardwareDeviceContext::GetHardwareFramesConstraints(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return env.Null();
  }
  
  AVHWFramesConstraints* constraints = av_hwdevice_get_hwframe_constraints(context_, nullptr);
  if (!constraints) {
    return env.Null();
  }
  
  // Create constraints object
  Napi::Object obj = Napi::Object::New(env);
  
  // Add valid hardware formats
  if (constraints->valid_hw_formats) {
    Napi::Array formats = Napi::Array::New(env);
    uint32_t index = 0;
    for (int i = 0; constraints->valid_hw_formats[i] != AV_PIX_FMT_NONE; i++) {
      formats[index++] = Napi::Number::New(env, constraints->valid_hw_formats[i]);
    }
    obj.Set("validHwFormats", formats);
  }
  
  // Add valid software formats
  if (constraints->valid_sw_formats) {
    Napi::Array formats = Napi::Array::New(env);
    uint32_t index = 0;
    for (int i = 0; constraints->valid_sw_formats[i] != AV_PIX_FMT_NONE; i++) {
      formats[index++] = Napi::Number::New(env, constraints->valid_sw_formats[i]);
    }
    obj.Set("validSwFormats", formats);
  }
  
  // Add min/max dimensions
  obj.Set("minWidth", Napi::Number::New(env, constraints->min_width));
  obj.Set("minHeight", Napi::Number::New(env, constraints->min_height));
  obj.Set("maxWidth", Napi::Number::New(env, constraints->max_width));
  obj.Set("maxHeight", Napi::Number::New(env, constraints->max_height));
  
  av_hwframe_constraints_free(&constraints);
  
  return obj;
}

// Dispose
Napi::Value HardwareDeviceContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_) {
    av_buffer_unref(&context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

// Get type
Napi::Value HardwareDeviceContext::GetType(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), type_);
}

} // namespace ffmpeg