#ifndef FFMPEG_OPTION_H
#define FFMPEG_OPTION_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/opt.h>
}

/**
 * Node.js binding for FFmpeg AVOption functionality
 */
class Option : public Napi::ObjectWrap<Option> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  Option(const Napi::CallbackInfo& info);
  ~Option() = default;

  // Properties
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetHelp(const Napi::CallbackInfo& info);
  Napi::Value GetType(const Napi::CallbackInfo& info);
  Napi::Value GetDefaultValue(const Napi::CallbackInfo& info);
  Napi::Value GetMin(const Napi::CallbackInfo& info);
  Napi::Value GetMax(const Napi::CallbackInfo& info);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  Napi::Value GetUnit(const Napi::CallbackInfo& info);

  // Internal
  void SetOption(const AVOption* opt) { option_ = opt; }
  const AVOption* GetOption() const { return option_; }

private:
  const AVOption* option_ = nullptr;
};

/**
 * Options container for AVOptions manipulation
 */
class Options : public Napi::ObjectWrap<Options> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::FunctionReference constructor;
  static Napi::Object CreateFromContext(Napi::Env env, void* context);
  Options(const Napi::CallbackInfo& info);
  ~Options() = default;

  // Methods
  Napi::Value Set(const Napi::CallbackInfo& info);
  Napi::Value Get(const Napi::CallbackInfo& info);
  Napi::Value SetInt(const Napi::CallbackInfo& info);
  Napi::Value GetInt(const Napi::CallbackInfo& info);
  Napi::Value SetDouble(const Napi::CallbackInfo& info);
  Napi::Value GetDouble(const Napi::CallbackInfo& info);
  Napi::Value SetPixelFormat(const Napi::CallbackInfo& info);
  Napi::Value GetPixelFormat(const Napi::CallbackInfo& info);
  Napi::Value SetSampleFormat(const Napi::CallbackInfo& info);
  Napi::Value GetSampleFormat(const Napi::CallbackInfo& info);
  Napi::Value SetChannelLayout(const Napi::CallbackInfo& info);
  Napi::Value GetChannelLayout(const Napi::CallbackInfo& info);
  Napi::Value List(const Napi::CallbackInfo& info);
  Napi::Value SetDefaults(const Napi::CallbackInfo& info);
  Napi::Value Serialize(const Napi::CallbackInfo& info);

  // Internal
  void SetContext(void* ctx) { context_ = ctx; }
  void* GetContext() const { return context_; }

private:
  void* context_ = nullptr;
};

#endif // FFMPEG_OPTION_H