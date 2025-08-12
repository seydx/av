#pragma once

#include <napi.h>
#include <memory>
#include <string>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
#include <libavutil/error.h>
#include <libavutil/imgutils.h>
#include <libavutil/opt.h>
#include <libavutil/pixdesc.h>
#include <libavutil/rational.h>
#include <libavutil/samplefmt.h>
#include <libavutil/timestamp.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>
}

namespace ffmpeg {

// Convert FFmpeg error code to Node.js error with code property
inline void CheckFFmpegError(const Napi::Env& env, int ret, const std::string& message = "") {
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
    std::string errorMsg = message.empty() ? errbuf : message + ": " + errbuf;
    
    // Create error with code property
    Napi::Error error = Napi::Error::New(env, errorMsg);
    error.Set("code", Napi::Number::New(env, ret));
    error.Set("ffmpegCode", Napi::Number::New(env, ret));
    error.ThrowAsJavaScriptException();
  }
}

// Non-throwing version for codec operations that may have recoverable errors
inline void LogFFmpegError(int ret, const std::string& message = "") {
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
    std::string errorMsg = message.empty() ? errbuf : message + ": " + errbuf;
    av_log(nullptr, AV_LOG_WARNING, "%s\n", errorMsg.c_str());
  }
}

// RAII wrapper for FFmpeg resources - non-virtual base
template <typename T, typename Deleter>
class FFmpegResource {
 public:
  FFmpegResource() : resource_(nullptr) {}
  explicit FFmpegResource(T* resource) : resource_(resource) {}
  
  FFmpegResource(FFmpegResource&& other) noexcept : resource_(other.resource_) {
    other.resource_ = nullptr;
  }
  
  FFmpegResource& operator=(FFmpegResource&& other) noexcept {
    if (this != &other) {
      Reset();
      resource_ = other.resource_;
      other.resource_ = nullptr;
    }
    return *this;
  }
  
  FFmpegResource(const FFmpegResource&) = delete;
  FFmpegResource& operator=(const FFmpegResource&) = delete;
  
  ~FFmpegResource() {
    Reset();
  }
  
  T* Get() const { return resource_; }
  T** GetAddress() { return &resource_; }
  T* Release() {
    T* temp = resource_;
    resource_ = nullptr;
    return temp;
  }
  
  void Reset(T* resource = nullptr) {
    if (resource_ && resource_ != resource) {
      Deleter::Free(&resource_);
    }
    resource_ = resource;
  }
  
  explicit operator bool() const { return resource_ != nullptr; }
  
 private:
  T* resource_;
};

// Specialized deleters for FFmpeg resources
struct PacketDeleter {
  static void Free(AVPacket** p) {
    if (p && *p) {
      av_packet_free(p);
    }
  }
};

struct FrameDeleter {
  static void Free(AVFrame** f) {
    if (f && *f) {
      av_frame_free(f);
    }
  }
};

struct CodecContextDeleter {
  static void Free(AVCodecContext** c) {
    if (c && *c) {
      avcodec_free_context(c);
    }
  }
};

struct FormatContextDeleter {
  static void Free(AVFormatContext** f) {
    if (f && *f) {
      avformat_free_context(*f);
      *f = nullptr;
    }
  }
};

// Type aliases for resource wrappers
using PacketResource = FFmpegResource<AVPacket, PacketDeleter>;
using FrameResource = FFmpegResource<AVFrame, FrameDeleter>;
using CodecContextResource = FFmpegResource<AVCodecContext, CodecContextDeleter>;
using FormatContextResource = FFmpegResource<AVFormatContext, FormatContextDeleter>;

// Base class for all wrapped FFmpeg objects
template <typename T>
class FFmpegWrapper : public Napi::ObjectWrap<T> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports, const std::string& className) {
    Napi::HandleScope scope(env);
    
    auto func = T::DefineClass(env, className.c_str(), T::GetClassMethods());
    
    exports.Set(className, func);
    return exports;
  }
  
 protected:
  FFmpegWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<T>(info) {}
};

// Convert AVRational to JS object
inline Napi::Object RationalToJS(const Napi::Env& env, const AVRational& rational) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("num", Napi::Number::New(env, rational.num));
  obj.Set("den", Napi::Number::New(env, rational.den));
  return obj;
}

// Convert JS object to AVRational
inline AVRational JSToRational(const Napi::Object& obj) {
  AVRational rational;
  rational.num = obj.Get("num").As<Napi::Number>().Int32Value();
  rational.den = obj.Get("den").As<Napi::Number>().Int32Value();
  return rational;
}

// Convert timestamp to microseconds
inline int64_t TimestampToMicroseconds(int64_t pts, const AVRational& timeBase) {
  if (pts == AV_NOPTS_VALUE) {
    return AV_NOPTS_VALUE;
  }
  return av_rescale_q(pts, timeBase, {1, AV_TIME_BASE});
}

// Convert microseconds to timestamp
inline int64_t MicrosecondsToTimestamp(int64_t us, const AVRational& timeBase) {
  if (us == AV_NOPTS_VALUE) {
    return AV_NOPTS_VALUE;
  }
  return av_rescale_q(us, {1, AV_TIME_BASE}, timeBase);
}

// Standardized unwrapping helpers for consistent pattern
template <typename T>
inline T* UnwrapNativeObject(const Napi::Env& env, const Napi::Value& value, const std::string& expectedType) {
  if (value.IsNull() || value.IsUndefined()) {
    return nullptr;
  }
  
  if (!value.IsObject()) {
    Napi::TypeError::New(env, expectedType + " object expected").ThrowAsJavaScriptException();
    return nullptr;
  }
  
  try {
    Napi::Object obj = value.As<Napi::Object>();
    T* wrapper = Napi::ObjectWrap<T>::Unwrap(obj);
    if (!wrapper) {
      Napi::TypeError::New(env, "Invalid " + expectedType + " object").ThrowAsJavaScriptException();
      return nullptr;
    }
    return wrapper;
  } catch (...) {
    Napi::TypeError::New(env, "Failed to unwrap " + expectedType + " object").ThrowAsJavaScriptException();
    return nullptr;
  }
}

// Overload for required parameters (throws on null/undefined)
template <typename T>
inline T* UnwrapNativeObjectRequired(const Napi::Env& env, const Napi::Value& value, const std::string& expectedType) {
  if (value.IsNull() || value.IsUndefined() || !value.IsObject()) {
    Napi::TypeError::New(env, expectedType + " object required").ThrowAsJavaScriptException();
    return nullptr;
  }
  
  try {
    Napi::Object obj = value.As<Napi::Object>();
    T* wrapper = Napi::ObjectWrap<T>::Unwrap(obj);
    if (!wrapper) {
      Napi::TypeError::New(env, "Invalid " + expectedType + " object").ThrowAsJavaScriptException();
      return nullptr;
    }
    return wrapper;
  } catch (...) {
    Napi::TypeError::New(env, "Failed to unwrap " + expectedType + " object").ThrowAsJavaScriptException();
    return nullptr;
  }
}

}  // namespace ffmpeg