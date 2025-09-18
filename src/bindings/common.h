#ifndef FFMPEG_COMMON_H
#define FFMPEG_COMMON_H

#include <napi.h>
#include <memory>

// Fix for glibc > 2.31 compatibility
// These _finite functions were removed but FFmpeg might still reference them
#ifdef __linux__
#include <math.h>
extern "C" {
  __attribute__((weak)) float __log2f_finite(float x) {
    return log2f(x);
  }
  __attribute__((weak)) double __log2_finite(double x) {
    return log2(x);
  }
  __attribute__((weak)) float __logf_finite(float x) {
    return logf(x);
  }
  __attribute__((weak)) double __log_finite(double x) {
    return log(x);
  }
  __attribute__((weak)) float __expf_finite(float x) {
    return expf(x);
  }
  __attribute__((weak)) double __exp_finite(double x) {
    return exp(x);
  }
  __attribute__((weak)) float __exp2f_finite(float x) {
    return exp2f(x);
  }
  __attribute__((weak)) double __exp2_finite(double x) {
    return exp2(x);
  }
  __attribute__((weak)) float __powf_finite(float x, float y) {
    return powf(x, y);
  }
  __attribute__((weak)) double __pow_finite(double x, double y) {
    return pow(x, y);
  }
}
#endif

#ifdef __linux__
extern "C" {
  // vaMapBuffer2 is only available in VA-API >= 1.21
  // Provide weak symbol to avoid crashes with older versions
  __attribute__((weak)) int vaMapBuffer2(void* dpy, unsigned int buf_id, void** pbuf, unsigned int flags);
}
#endif

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavfilter/avfilter.h>
#include <libavutil/avutil.h>
#include <libavutil/buffer.h>
#include <libavutil/dict.h>
#include <libavutil/error.h>
#include <libavutil/rational.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>
}

namespace ffmpeg {

inline AVRational JSToRational(const Napi::Object& obj) {
  AVRational r;
  r.num = obj.Get("num").As<Napi::Number>().Int32Value();
  r.den = obj.Get("den").As<Napi::Number>().Int32Value();
  return r;
}

inline Napi::Object RationalToJS(const Napi::Env& env, const AVRational& r) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("num", Napi::Number::New(env, r.num));
  obj.Set("den", Napi::Number::New(env, r.den));
  return obj;
}

template<typename T>
T* UnwrapNativeObject(const Napi::Env& env, const Napi::Value& value, const char* typeName) {
  if (!value.IsObject()) {
    return nullptr;
  }
  
  Napi::Object obj = value.As<Napi::Object>();
  
  // Try to unwrap directly - if it fails, it's not the right type
  try {
    return Napi::ObjectWrap<T>::Unwrap(obj);
  } catch (...) {
    return nullptr;
  }
}

} // namespace ffmpeg

#endif // FFMPEG_COMMON_H