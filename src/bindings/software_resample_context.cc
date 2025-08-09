#include "software_resample_context.h"
#include "frame.h"
#include "common.h"

namespace ffmpeg {

Napi::FunctionReference SoftwareResampleContext::constructor;

Napi::Object SoftwareResampleContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "SoftwareResampleContext", {
    // Methods
    InstanceMethod<&SoftwareResampleContext::ConvertFrame>("convertFrame"),
    InstanceMethod<&SoftwareResampleContext::GetDelay>("getDelay"),
    InstanceMethod<&SoftwareResampleContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("SoftwareResampleContext", func);
  return exports;
}

SoftwareResampleContext::SoftwareResampleContext(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<SoftwareResampleContext>(info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 6) {
    Napi::TypeError::New(env, "Expected 6 arguments: srcChannelLayout, srcSampleRate, srcSampleFormat, dstChannelLayout, dstSampleRate, dstSampleFormat").ThrowAsJavaScriptException();
    return;
  }
  
  // Parse source channel layout
  if (!info[0].IsObject()) {
    Napi::TypeError::New(env, "Source channel layout must be an object").ThrowAsJavaScriptException();
    return;
  }
  Napi::Object srcLayout = info[0].As<Napi::Object>();
  AVChannelLayout src_ch_layout = {};
  if (srcLayout.Has("nbChannels") && srcLayout.Has("order") && srcLayout.Has("mask")) {
    src_ch_layout.nb_channels = srcLayout.Get("nbChannels").As<Napi::Number>().Int32Value();
    src_ch_layout.order = static_cast<AVChannelOrder>(srcLayout.Get("order").As<Napi::Number>().Int32Value());
    bool lossless;
    src_ch_layout.u.mask = srcLayout.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
  
  // Parse source sample rate
  int src_sample_rate = info[1].As<Napi::Number>().Int32Value();
  
  // Parse source sample format
  AVSampleFormat src_sample_fmt = static_cast<AVSampleFormat>(info[2].As<Napi::Number>().Int32Value());
  
  // Parse destination channel layout
  if (!info[3].IsObject()) {
    Napi::TypeError::New(env, "Destination channel layout must be an object").ThrowAsJavaScriptException();
    return;
  }
  Napi::Object dstLayout = info[3].As<Napi::Object>();
  AVChannelLayout dst_ch_layout = {};
  if (dstLayout.Has("nbChannels") && dstLayout.Has("order") && dstLayout.Has("mask")) {
    dst_ch_layout.nb_channels = dstLayout.Get("nbChannels").As<Napi::Number>().Int32Value();
    dst_ch_layout.order = static_cast<AVChannelOrder>(dstLayout.Get("order").As<Napi::Number>().Int32Value());
    bool lossless;
    dst_ch_layout.u.mask = dstLayout.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
  
  // Parse destination sample rate
  int dst_sample_rate = info[4].As<Napi::Number>().Int32Value();
  
  // Parse destination sample format
  AVSampleFormat dst_sample_fmt = static_cast<AVSampleFormat>(info[5].As<Napi::Number>().Int32Value());
  
  // Allocate resample context
  context_ = swr_alloc();
  if (!context_) {
    Napi::Error::New(env, "Failed to allocate resample context").ThrowAsJavaScriptException();
    return;
  }
  
  // Set options
  av_opt_set_chlayout(context_, "in_chlayout", &src_ch_layout, 0);
  av_opt_set_int(context_, "in_sample_rate", src_sample_rate, 0);
  av_opt_set_sample_fmt(context_, "in_sample_fmt", src_sample_fmt, 0);
  
  av_opt_set_chlayout(context_, "out_chlayout", &dst_ch_layout, 0);
  av_opt_set_int(context_, "out_sample_rate", dst_sample_rate, 0);
  av_opt_set_sample_fmt(context_, "out_sample_fmt", dst_sample_fmt, 0);
  
  // Initialize the resampling context
  int ret = swr_init(context_);
  if (ret < 0) {
    swr_free(&context_);
    context_ = nullptr;
    CheckFFmpegError(env, ret, "Failed to initialize resample context");
    return;
  }
}

SoftwareResampleContext::~SoftwareResampleContext() {
  if (context_) {
    swr_free(&context_);
    context_ = nullptr;
  }
}

// Convert frame
Napi::Value SoftwareResampleContext::ConvertFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Resample context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Source and destination frames required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVFrame* src = nullptr;
  AVFrame* dst = nullptr;
  
  // Source frame (can be null for flushing)
  if (info.Length() > 0) {
    Frame* srcFrame = ffmpeg::UnwrapNativeObject<Frame>(env, info[0], "Frame");
    if (srcFrame) {
      src = srcFrame->GetFrame();
    }
  }
  
  // Destination frame (required)
  Frame* dstFrame = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[1], "Frame");
  if (!dstFrame) return env.Undefined();
  dst = dstFrame->GetFrame();
  
  int ret = swr_convert_frame(context_, dst, src);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to convert frame");
  }
  
  return env.Undefined();
}

// Get delay
Napi::Value SoftwareResampleContext::GetDelay(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  if (info.Length() < 1 || !info[0].IsBigInt()) {
    Napi::TypeError::New(env, "Base sample rate required as BigInt").ThrowAsJavaScriptException();
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  bool lossless;
  int64_t base = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  
  int64_t delay = swr_get_delay(context_, base);
  return Napi::BigInt::New(env, delay);
}

// Dispose
Napi::Value SoftwareResampleContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_) {
    swr_free(&context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

} // namespace ffmpeg