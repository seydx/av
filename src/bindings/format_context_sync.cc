#include "format_context.h"
#include "packet.h"
#include "input_format.h"
#include "dictionary.h"
#include "common.h"
#include <napi.h>

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

Napi::Value FormatContext::ReadFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Packet required").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Packet* packet = UnwrapNativeObject<Packet>(env, info[0], "Packet");
  if (!packet) {
    Napi::TypeError::New(env, "Invalid packet object").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  // Direct synchronous call to av_read_frame
  int result = av_read_frame(ctx_, packet->Get());

  return Napi::Number::New(env, result);
}

Napi::Value FormatContext::WriteFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Packet* packet = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    packet = UnwrapNativeObject<Packet>(env, info[0], "Packet");
  }

  // Direct synchronous call to av_write_frame
  int result = av_write_frame(ctx_, packet ? packet->Get() : nullptr);

  return Napi::Number::New(env, result);
}

Napi::Value FormatContext::InterleavedWriteFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Packet* packet = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    packet = UnwrapNativeObject<Packet>(env, info[0], "Packet");
  }

  // Direct synchronous call to av_interleaved_write_frame
  int result = av_interleaved_write_frame(ctx_, packet ? packet->Get() : nullptr);

  return Napi::Number::New(env, result);
}

Napi::Value FormatContext::OpenInputSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  std::string url;
  AVInputFormat* fmt = nullptr;
  AVDictionary* options = nullptr;

  // Parse URL argument
  if (info.Length() > 0 && info[0].IsString()) {
    url = info[0].As<Napi::String>().Utf8Value();
  }

  // Parse format argument
  if (info.Length() > 1 && !info[1].IsNull() && !info[1].IsUndefined()) {
    InputFormat* inputFormat = UnwrapNativeObject<InputFormat>(env, info[1], "InputFormat");
    if (inputFormat) {
      fmt = const_cast<AVInputFormat*>(inputFormat->Get());
    }
  }

  // Parse options argument
  if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[2], "Dictionary");
    if (dict) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }

  // If we already have a context (e.g., for custom I/O), preserve it
  AVFormatContext* ctx = ctx_;

  // Direct synchronous call
  const char* urlPtr = url.empty() || url == "dummy" ? nullptr : url.c_str();
  int ret = avformat_open_input(&ctx, urlPtr, fmt, options ? &options : nullptr);

  if (ret >= 0) {
    ctx_ = ctx;  // Update the stored context
    is_output_ = false;
  }

  // Clean up options if any remain
  if (options) {
    av_dict_free(&options);
  }

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::FindStreamInfoSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  AVDictionary* options = nullptr;

  // Parse options argument
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dict) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }

  // Direct synchronous call
  int ret = avformat_find_stream_info(ctx_, options ? &options : nullptr);

  // Clean up options if any remain
  if (options) {
    av_dict_free(&options);
  }

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::SeekFrameSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (info.Length() < 3) {
    Napi::TypeError::New(env, "stream_index, timestamp, and flags required").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  int stream_index = info[0].As<Napi::Number>().Int32Value();
  bool lossless;
  int64_t timestamp = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  int flags = info[2].As<Napi::Number>().Int32Value();

  // Direct synchronous call
  int ret = av_seek_frame(ctx_, stream_index, timestamp, flags);

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteHeaderSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (!is_output_) {
    Napi::Error::New(env, "Not an output context").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  AVDictionary* options = nullptr;

  // Parse options argument
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Dictionary* dict = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dict) {
      av_dict_copy(&options, dict->Get(), 0);
    }
  }

  // Direct synchronous call
  int ret = avformat_write_header(ctx_, options ? &options : nullptr);

  // Clean up options if any remain
  if (options) {
    av_dict_free(&options);
  }

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteTrailerSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (!is_output_) {
    Napi::Error::New(env, "Not an output context").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Direct synchronous call
  int ret = av_write_trailer(ctx_);

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::CloseInputSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    return env.Undefined();
  }

  if (is_output_) {
    Napi::Error::New(env, "Cannot close output context as input").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  // Direct synchronous call
  avformat_close_input(&ctx_);
  ctx_ = nullptr;

  return env.Undefined();
}

Napi::Value FormatContext::OpenOutputSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "FormatContext not initialized").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (!is_output_) {
    Napi::Error::New(env, "Not an output context").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (!ctx_->oformat) {
    Napi::Error::New(env, "Output format not set").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  if (!ctx_->url) {
    Napi::Error::New(env, "URL not set").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }

  // Check if format needs a file
  if (ctx_->oformat->flags & AVFMT_NOFILE) {
    return Napi::Number::New(env, 0);
  }

  // Direct synchronous call
  int ret = avio_open(&ctx_->pb, ctx_->url, AVIO_FLAG_WRITE);

  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::CloseOutputSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    return env.Undefined();
  }

  if (!is_output_) {
    Napi::Error::New(env, "Not an output context").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!ctx_->pb) {
    return env.Undefined();
  }

  // Check for custom I/O
  if (ctx_->flags & AVFMT_FLAG_CUSTOM_IO) {
    return env.Undefined();
  }

  // Check if format needs a file
  if (ctx_->oformat && (ctx_->oformat->flags & AVFMT_NOFILE)) {
    return env.Undefined();
  }

  // Direct synchronous call
  avio_closep(&ctx_->pb);

  return env.Undefined();
}

Napi::Value FormatContext::FlushSync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!ctx_) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (ctx_->pb) {
    avio_flush(ctx_->pb);
  }

  return env.Undefined();
}

} // namespace ffmpeg