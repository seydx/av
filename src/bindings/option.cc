#include "option.h"
#include <string>
#include <vector>

extern "C" {
#include <libavutil/pixdesc.h>
#include <libavutil/channel_layout.h>
}

// Option class implementation

Napi::FunctionReference Option::constructor;

Napi::Object Option::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Option", {
    InstanceAccessor<&Option::GetName>("name"),
    InstanceAccessor<&Option::GetHelp>("help"),
    InstanceAccessor<&Option::GetType>("type"),
    InstanceAccessor<&Option::GetDefaultValue>("defaultValue"),
    InstanceAccessor<&Option::GetMin>("min"),
    InstanceAccessor<&Option::GetMax>("max"),
    InstanceAccessor<&Option::GetFlags>("flags"),
    InstanceAccessor<&Option::GetUnit>("unit"),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Option", func);
  return exports;
}

Option::Option(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Option>(info) {
  Napi::Env env = info.Env();
  
  if (info.Length() > 0 && info[0].IsExternal()) {
    auto external = info[0].As<Napi::External<AVOption>>();
    option_ = external.Data();
  }
}

Napi::Value Option::GetName(const Napi::CallbackInfo& info) {
  if (!option_ || !option_->name) {
    return info.Env().Null();
  }
  return Napi::String::New(info.Env(), option_->name);
}

Napi::Value Option::GetHelp(const Napi::CallbackInfo& info) {
  if (!option_ || !option_->help) {
    return info.Env().Null();
  }
  return Napi::String::New(info.Env(), option_->help);
}

Napi::Value Option::GetType(const Napi::CallbackInfo& info) {
  if (!option_) {
    return info.Env().Null();
  }
  return Napi::Number::New(info.Env(), option_->type);
}

Napi::Value Option::GetDefaultValue(const Napi::CallbackInfo& info) {
  if (!option_) {
    return info.Env().Null();
  }
  
  // Return default value based on type
  switch (option_->type) {
    case AV_OPT_TYPE_INT:
    case AV_OPT_TYPE_INT64:
    case AV_OPT_TYPE_UINT64:
      return Napi::Number::New(info.Env(), option_->default_val.i64);
    
    case AV_OPT_TYPE_DOUBLE:
    case AV_OPT_TYPE_FLOAT:
      return Napi::Number::New(info.Env(), option_->default_val.dbl);
    
    case AV_OPT_TYPE_STRING:
      if (option_->default_val.str) {
        return Napi::String::New(info.Env(), option_->default_val.str);
      }
      break;
    
    case AV_OPT_TYPE_RATIONAL:
      {
        auto obj = Napi::Object::New(info.Env());
        obj.Set("num", option_->default_val.q.num);
        obj.Set("den", option_->default_val.q.den);
        return obj;
      }
  }
  
  return info.Env().Null();
}

Napi::Value Option::GetMin(const Napi::CallbackInfo& info) {
  if (!option_) {
    return info.Env().Null();
  }
  return Napi::Number::New(info.Env(), option_->min);
}

Napi::Value Option::GetMax(const Napi::CallbackInfo& info) {
  if (!option_) {
    return info.Env().Null();
  }
  return Napi::Number::New(info.Env(), option_->max);
}

Napi::Value Option::GetFlags(const Napi::CallbackInfo& info) {
  if (!option_) {
    return info.Env().Null();
  }
  return Napi::Number::New(info.Env(), option_->flags);
}

Napi::Value Option::GetUnit(const Napi::CallbackInfo& info) {
  if (!option_ || !option_->unit) {
    return info.Env().Null();
  }
  return Napi::String::New(info.Env(), option_->unit);
}

// Options class implementation

Napi::FunctionReference Options::constructor;

Napi::Object Options::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Options", {
    InstanceMethod<&Options::Set>("set"),
    InstanceMethod<&Options::Get>("get"),
    InstanceMethod<&Options::SetInt>("setInt"),
    InstanceMethod<&Options::GetInt>("getInt"),
    InstanceMethod<&Options::SetDouble>("setDouble"),
    InstanceMethod<&Options::GetDouble>("getDouble"),
    InstanceMethod<&Options::SetPixelFormat>("setPixelFormat"),
    InstanceMethod<&Options::GetPixelFormat>("getPixelFormat"),
    InstanceMethod<&Options::SetSampleFormat>("setSampleFormat"),
    InstanceMethod<&Options::GetSampleFormat>("getSampleFormat"),
    InstanceMethod<&Options::SetChannelLayout>("setChannelLayout"),
    InstanceMethod<&Options::GetChannelLayout>("getChannelLayout"),
    InstanceMethod<&Options::List>("list"),
    InstanceMethod<&Options::SetDefaults>("setDefaults"),
    InstanceMethod<&Options::Serialize>("serialize"),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Options", func);
  return exports;
}

Napi::Object Options::CreateFromContext(Napi::Env env, void* context) {
  if (!context) {
    return env.Null().As<Napi::Object>();
  }
  
  auto external = Napi::External<void>::New(env, context);
  return constructor.New({external});
}

Options::Options(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Options>(info) {
  Napi::Env env = info.Env();
  
  if (info.Length() > 0 && info[0].IsExternal()) {
    auto external = info[0].As<Napi::External<void>>();
    context_ = external.Data();
  }
}

Napi::Value Options::Set(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string, value: string)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  std::string value = info[1].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_opt_set(context_, name.c_str(), value.c_str(), search_flags);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::Get(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  uint8_t* value = nullptr;
  int ret = av_opt_get(context_, name.c_str(), search_flags, &value);
  if (ret < 0) {
    return env.Null();
  }
  
  if (!value) {
    return env.Null();
  }
  
  Napi::String result = Napi::String::New(env, reinterpret_cast<char*>(value));
  av_free(value);
  return result;
}

Napi::Value Options::SetInt(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (name: string, value: number)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  int64_t value = info[1].As<Napi::Number>().Int64Value();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_opt_set_int(context_, name.c_str(), value, search_flags);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set int option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::GetInt(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  int64_t value = 0;
  int ret = av_opt_get_int(context_, name.c_str(), search_flags, &value);
  if (ret < 0) {
    return env.Null();
  }
  
  return Napi::Number::New(env, value);
}

Napi::Value Options::SetDouble(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (name: string, value: number)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  double value = info[1].As<Napi::Number>().DoubleValue();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_opt_set_double(context_, name.c_str(), value, search_flags);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set double option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::GetDouble(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  double value = 0;
  int ret = av_opt_get_double(context_, name.c_str(), search_flags, &value);
  if (ret < 0) {
    return env.Null();
  }
  
  return Napi::Number::New(env, value);
}

Napi::Value Options::SetPixelFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (name: string, format: AVPixelFormat)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  int64_t format = info[1].As<Napi::Number>().Int64Value();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_opt_set_pixel_fmt(context_, name.c_str(), static_cast<AVPixelFormat>(format), search_flags);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set pixel format option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::GetPixelFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  AVPixelFormat format = AV_PIX_FMT_NONE;
  int ret = av_opt_get_pixel_fmt(context_, name.c_str(), search_flags, &format);
  if (ret < 0) {
    return env.Null();
  }
  
  return Napi::Number::New(env, format);
}

Napi::Value Options::SetSampleFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected (name: string, format: AVSampleFormat)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  int64_t format = info[1].As<Napi::Number>().Int64Value();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_opt_set_sample_fmt(context_, name.c_str(), static_cast<AVSampleFormat>(format), search_flags);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set sample format option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::GetSampleFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  AVSampleFormat format = AV_SAMPLE_FMT_NONE;
  int ret = av_opt_get_sample_fmt(context_, name.c_str(), search_flags, &format);
  if (ret < 0) {
    return env.Null();
  }
  
  return Napi::Number::New(env, format);
}

Napi::Value Options::SetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string, layout: string)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string name = info[0].As<Napi::String>();
  std::string layout_str = info[1].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 2 && info[2].IsNumber()) {
    search_flags = info[2].As<Napi::Number>().Int32Value();
  }
  
  AVChannelLayout layout = {};
  int ret = av_channel_layout_from_string(&layout, layout_str.c_str());
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Invalid channel layout: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  ret = av_opt_set_chlayout(context_, name.c_str(), &layout, search_flags);
  av_channel_layout_uninit(&layout);
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to set channel layout option: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value Options::GetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected (name: string)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string name = info[0].As<Napi::String>();
  
  int search_flags = AV_OPT_SEARCH_CHILDREN;
  if (info.Length() > 1 && info[1].IsNumber()) {
    search_flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  AVChannelLayout layout = {};
  int ret = av_opt_get_chlayout(context_, name.c_str(), search_flags, &layout);
  if (ret < 0) {
    return env.Null();
  }
  
  char buf[256];
  av_channel_layout_describe(&layout, buf, sizeof(buf));
  av_channel_layout_uninit(&layout);
  
  return Napi::String::New(env, buf);
}

Napi::Value Options::List(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Array result = Napi::Array::New(env);
  
  const AVOption* opt = nullptr;
  int index = 0;
  
  while ((opt = av_opt_next(context_, opt)) != nullptr) {
    auto optionExternal = Napi::External<AVOption>::New(env, const_cast<AVOption*>(opt));
    auto optionObj = env.GetInstanceData<Napi::FunctionReference>()->New({optionExternal});
    result.Set(index++, optionObj);
  }
  
  return result;
}

Napi::Value Options::SetDefaults(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  av_opt_set_defaults(context_);
  return env.Undefined();
}

Napi::Value Options::Serialize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Options context is null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  char* buffer = nullptr;
  int ret = av_opt_serialize(context_, 0, AV_OPT_SERIALIZE_SKIP_DEFAULTS, &buffer, '=', '&');
  if (ret < 0) {
    return env.Null();
  }
  
  if (!buffer) {
    return Napi::String::New(env, "");
  }
  
  Napi::String result = Napi::String::New(env, buffer);
  av_free(buffer);
  return result;
}