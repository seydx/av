#ifndef FFMPEG_SOFTWARE_RESAMPLE_CONTEXT_H
#define FFMPEG_SOFTWARE_RESAMPLE_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libswresample/swresample.h>
#include <libavutil/channel_layout.h>
#include <libavutil/samplefmt.h>
}

namespace ffmpeg {

class SoftwareResampleContext : public Napi::ObjectWrap<SoftwareResampleContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  SoftwareResampleContext(const Napi::CallbackInfo& info);
  ~SoftwareResampleContext();

  SwrContext* Get() { return ctx_; }

private:
  friend class AVOptionWrapper;
  friend class SwrConvertWorker;

  static Napi::FunctionReference constructor;

  SwrContext* ctx_ = nullptr;
  bool is_freed_ = false;

  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value AllocSetOpts2(const Napi::CallbackInfo& info);
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
  Napi::Value ConvertAsync(const Napi::CallbackInfo& info);
  Napi::Value ConvertSync(const Napi::CallbackInfo& info);
  Napi::Value ConvertFrame(const Napi::CallbackInfo& info);
  Napi::Value ConfigFrame(const Napi::CallbackInfo& info);
  Napi::Value IsInitialized(const Napi::CallbackInfo& info);
  Napi::Value GetDelay(const Napi::CallbackInfo& info);
  Napi::Value GetOutSamples(const Napi::CallbackInfo& info);
  Napi::Value NextPts(const Napi::CallbackInfo& info);
  Napi::Value SetCompensation(const Napi::CallbackInfo& info);
  Napi::Value SetChannelMapping(const Napi::CallbackInfo& info);
  Napi::Value SetMatrix(const Napi::CallbackInfo& info);
  Napi::Value DropOutput(const Napi::CallbackInfo& info);
  Napi::Value InjectSilence(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_SOFTWARE_RESAMPLE_CONTEXT_H