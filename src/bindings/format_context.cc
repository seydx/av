#include "format_context.h"
#include "packet.h"
#include "stream.h"
#include "codec.h"
#include "dictionary.h"
#include "input_format.h"
#include "output_format.h"
#include "io_context.h"
#include <napi.h>
#include <memory>

namespace ffmpeg {

Napi::FunctionReference FormatContext::constructor;

// === Init ===

Napi::Object FormatContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FormatContext", {
    // Lifecycle
    InstanceMethod<&FormatContext::AllocContext>("allocContext"),
    InstanceMethod<&FormatContext::AllocOutputContext2>("allocOutputContext2"),
    InstanceMethod<&FormatContext::FreeContext>("freeContext"),
    InstanceMethod<&FormatContext::CloseInput>("closeInput"),
    InstanceMethod<&FormatContext::OpenOutput>("openOutput"),
    InstanceMethod<&FormatContext::CloseOutput>("closeOutput"),

    // Input Operations
    InstanceMethod<&FormatContext::OpenInputAsync>("openInput"),
    InstanceMethod<&FormatContext::FindStreamInfoAsync>("findStreamInfo"),
    InstanceMethod<&FormatContext::ReadFrameAsync>("readFrame"),
    InstanceMethod<&FormatContext::SeekFrameAsync>("seekFrame"),
    InstanceMethod<&FormatContext::SeekFileAsync>("seekFile"),

    // Output Operations
    InstanceMethod<&FormatContext::WriteHeaderAsync>("writeHeader"),
    InstanceMethod<&FormatContext::WriteFrameAsync>("writeFrame"),
    InstanceMethod<&FormatContext::InterleavedWriteFrameAsync>("interleavedWriteFrame"),
    InstanceMethod<&FormatContext::WriteTrailerAsync>("writeTrailer"),
    InstanceMethod<&FormatContext::Flush>("flush"),
    InstanceMethod<&FormatContext::NewStream>("newStream"),
    InstanceMethod<&FormatContext::DumpFormat>("dumpFormat"),
    InstanceMethod<&FormatContext::FindBestStream>("findBestStream"),

    // Properties
    InstanceAccessor("streams", &FormatContext::GetStreams, nullptr),
    InstanceAccessor("nbStreams", &FormatContext::GetNbStreams, nullptr),
    InstanceAccessor("url", &FormatContext::GetUrl, &FormatContext::SetUrl),
    InstanceAccessor("startTime", &FormatContext::GetStartTime, nullptr),
    InstanceAccessor("duration", &FormatContext::GetDuration, nullptr),
    InstanceAccessor("bitRate", &FormatContext::GetBitRate, nullptr),
    InstanceAccessor("flags", &FormatContext::GetFlags, &FormatContext::SetFlags),
    InstanceAccessor("probesize", &FormatContext::GetProbesize, &FormatContext::SetProbesize),
    InstanceAccessor("maxAnalyzeDuration", &FormatContext::GetMaxAnalyzeDuration, &FormatContext::SetMaxAnalyzeDuration),
    InstanceAccessor("metadata", &FormatContext::GetMetadata, &FormatContext::SetMetadata),
    InstanceAccessor("iformat", &FormatContext::GetIformat, nullptr),
    InstanceAccessor("oformat", &FormatContext::GetOformat, &FormatContext::SetOformat),
    InstanceAccessor("pb", &FormatContext::GetPb, &FormatContext::SetPb),
    InstanceAccessor("strictStdCompliance", &FormatContext::GetStrictStdCompliance, &FormatContext::SetStrictStdCompliance),
    InstanceAccessor("maxStreams", &FormatContext::GetMaxStreams, &FormatContext::SetMaxStreams),
    
    // Utility
    InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &FormatContext::Dispose),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FormatContext", func);
  return exports;
}

// === Lifecycle ===

FormatContext::FormatContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<FormatContext>(info), is_freed_(false) {
  // Constructor does nothing - user must explicitly call allocContext or allocOutputContext2
}

FormatContext::~FormatContext() {
  // Clean up if user forgot to call freeContext()
  if (!is_freed_ && ctx_) {
    if (is_output_) {
      // For output contexts
      // Close pb if it exists and the format requires file I/O
      // OR if it's a custom IO context (no oformat check needed for custom IO)
      if (ctx_->pb) {
        if (!ctx_->oformat || !(ctx_->oformat->flags & AVFMT_NOFILE)) {
          avio_closep(&ctx_->pb);
        }
      }
      avformat_free_context(ctx_);
    } else {
      // For input contexts
      avformat_close_input(&ctx_);
    }
    ctx_ = nullptr;
  }
}

// === Methods ===

Napi::Value FormatContext::AllocContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* new_ctx = avformat_alloc_context();
  if (!new_ctx) {
    Napi::Error::New(env, "Failed to allocate format context").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  ctx_ = new_ctx;
  is_output_ = false;
  
  return env.Undefined();
}

Napi::Value FormatContext::AllocOutputContext2(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "Expected 3 arguments (oformat, formatName, filename)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVOutputFormat* oformat = nullptr;
  const char* format_name = nullptr;
  const char* filename = nullptr;
  
  // oformat can be null
  if (!info[0].IsNull() && !info[0].IsUndefined()) {
    OutputFormat* outputFormat = UnwrapNativeObject<OutputFormat>(env, info[0], "OutputFormat");
    if (outputFormat) {
      oformat = outputFormat->Get();
    }
  }
  
  std::string format_name_str;
  if (!info[1].IsNull() && !info[1].IsUndefined()) {
    format_name_str = info[1].As<Napi::String>().Utf8Value();
    format_name = format_name_str.c_str();
  }
  
  std::string filename_str;
  if (!info[2].IsNull() && !info[2].IsUndefined()) {
    filename_str = info[2].As<Napi::String>().Utf8Value();
    filename = filename_str.c_str();
  }
  
  AVFormatContext* new_ctx = nullptr;
  int ret = avformat_alloc_output_context2(&new_ctx, oformat, format_name, filename);
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("Failed to allocate output context: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  ctx_ = new_ctx;
  is_output_ = true;
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::FreeContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (is_freed_) {
    // Already freed
    return env.Undefined();
  }
  
  AVFormatContext* ctx = ctx_;
  ctx_ = nullptr;
  
  if (!ctx) {
    // Already freed
    return env.Undefined();
  }
  
  if (is_output_) {
    // For output contexts allocated with avformat_alloc_output_context2
    // Close pb if it exists and the format requires file I/O
    // OR if it's a custom IO context (no oformat check needed for custom IO)
    if (ctx->pb) {
      if (!ctx->oformat || !(ctx->oformat->flags & AVFMT_NOFILE)) {
        avio_closep(&ctx->pb);
      }
    }
    avformat_free_context(ctx);
  } else {
    // For input contexts, use avformat_close_input which also frees the context
    avformat_close_input(&ctx);
  }
  
  is_output_ = false;
  is_freed_ = true;
  
  return env.Undefined();
}

// These methods are now implemented in format_context_async.cc

Napi::Value FormatContext::Flush(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (ctx->pb) {
    avio_flush(ctx->pb);
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::NewStream(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVCodec* codec = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Codec* codecWrapper = UnwrapNativeObject<Codec>(env, info[0], "Codec");
    if (codecWrapper) {
      codec = const_cast<AVCodec*>(codecWrapper->Get());
    }
  }
  
  AVStream* stream = avformat_new_stream(ctx, codec);
  if (!stream) {
    Napi::Error::New(env, "Failed to create new stream").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Wrap AVStream and return it
  Napi::Object streamObj = Stream::constructor.New({});
  Stream* streamWrapper = Napi::ObjectWrap<Stream>::Unwrap(streamObj);
  streamWrapper->Set(stream);
  
  return streamObj;
}

Napi::Value FormatContext::DumpFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Parameters: index, url, is_output
  int index = 0;
  std::string url = "";
  int is_output = 0;
  
  if (info.Length() > 0 && info[0].IsNumber()) {
    index = info[0].As<Napi::Number>().Int32Value();
  }
  
  if (info.Length() > 1 && info[1].IsString()) {
    url = info[1].As<Napi::String>().Utf8Value();
  }
  
  if (info.Length() > 2 && info[2].IsBoolean()) {
    is_output = info[2].As<Napi::Boolean>().Value() ? 1 : 0;
  }
  
  // Call av_dump_format - prints to stderr
  av_dump_format(ctx, index, url.c_str(), is_output);
  
  return env.Undefined();
}

Napi::Value FormatContext::FindBestStream(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Parameters: type, wanted_stream_nb, related_stream, decoder_ret, flags
  int type = AVMEDIA_TYPE_UNKNOWN;
  int wanted_stream_nb = -1;
  int related_stream = -1;
  const AVCodec* decoder = nullptr;
  const AVCodec** decoder_ret = nullptr;
  int flags = 0;
  
  if (info.Length() > 0 && info[0].IsNumber()) {
    type = info[0].As<Napi::Number>().Int32Value();
  }
  
  if (info.Length() > 1 && info[1].IsNumber()) {
    wanted_stream_nb = info[1].As<Napi::Number>().Int32Value();
  }
  
  if (info.Length() > 2 && info[2].IsNumber()) {
    related_stream = info[2].As<Napi::Number>().Int32Value();
  }
  
  // Check if caller wants decoder returned (4th parameter)
  bool wantDecoder = false;
  if (info.Length() > 3 && info[3].IsBoolean()) {
    wantDecoder = info[3].As<Napi::Boolean>().Value();
    if (wantDecoder) {
      decoder_ret = &decoder;
    }
  }
  
  if (info.Length() > 4 && info[4].IsNumber()) {
    flags = info[4].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_find_best_stream(ctx, static_cast<AVMediaType>(type), 
                                wanted_stream_nb, related_stream, 
                                decoder_ret, flags);
  
  // If decoder was requested and found, return object with stream index and decoder
  if (wantDecoder && decoder && ret >= 0) {
    Napi::Object result = Napi::Object::New(env);
    result.Set("streamIndex", Napi::Number::New(env, ret));
    
    // Create Codec wrapper for the decoder
    Napi::Object codecObj = Codec::NewInstance(env, const_cast<AVCodec*>(decoder));
    result.Set("decoder", codecObj);
    
    return result;
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::GetStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::Array::New(env, 0);
  }
  
  Napi::Array streams = Napi::Array::New(env, ctx->nb_streams);
  
  for (unsigned int i = 0; i < ctx->nb_streams; i++) {
    // Wrap AVStream and add to array
    Napi::Object streamObj = Stream::constructor.New({});
    Stream* streamWrapper = Napi::ObjectWrap<Stream>::Unwrap(streamObj);
    streamWrapper->Set(ctx->streams[i]);
    streams[i] = streamObj;
  }
  
  return streams;
}

Napi::Value FormatContext::GetNbStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->nb_streams);
}

// === Properties ===

Napi::Value FormatContext::GetUrl(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx || !ctx->url) {
    return env.Null();
  }
  
  return Napi::String::New(env, ctx->url);
}

void FormatContext::SetUrl(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsString()) {
    std::string url = value.As<Napi::String>().Utf8Value();
    av_freep(&ctx->url);
    ctx->url = av_strdup(url.c_str());
  }
}

Napi::Value FormatContext::GetStartTime(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(-1));
  }
  
  return Napi::BigInt::New(env, ctx->start_time);
}

Napi::Value FormatContext::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(-1));
  }
  
  return Napi::BigInt::New(env, ctx->duration);
}

Napi::Value FormatContext::GetBitRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  return Napi::BigInt::New(env, ctx->bit_rate);
}

Napi::Value FormatContext::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->flags);
}

void FormatContext::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsNumber()) {
    ctx->flags = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FormatContext::GetProbesize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  return Napi::BigInt::New(env, ctx->probesize);
}

void FormatContext::SetProbesize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsBigInt()) {
    bool lossless;
    ctx->probesize = value.As<Napi::BigInt>().Int64Value(&lossless);
  } else if (value.IsNumber()) {
    ctx->probesize = value.As<Napi::Number>().Int64Value();
  }
}

Napi::Value FormatContext::GetMaxAnalyzeDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  
  return Napi::BigInt::New(env, ctx->max_analyze_duration);
}

void FormatContext::SetMaxAnalyzeDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsBigInt()) {
    bool lossless;
    ctx->max_analyze_duration = value.As<Napi::BigInt>().Int64Value(&lossless);
  } else if (value.IsNumber()) {
    ctx->max_analyze_duration = value.As<Napi::Number>().Int64Value();
  }
}

Napi::Value FormatContext::GetMetadata(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx || !ctx->metadata) {
    return env.Null();
  }
  
  // Create a Dictionary wrapper for the metadata
  Napi::Object dictObj = Dictionary::constructor.New({});
  Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(dictObj);
  
  // Copy the dictionary content (we transfer ownership of the copy)
  AVDictionary* copy = nullptr;
  av_dict_copy(&copy, ctx->metadata, 0);
  dict->SetOwned(copy);
  
  return dictObj;
}

void FormatContext::SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    // Clear metadata
    if (ctx->metadata) {
      av_dict_free(&ctx->metadata);
      ctx->metadata = nullptr;
    }
    return;
  }
  
  Dictionary* dict = UnwrapNativeObject<Dictionary>(env, value, "Dictionary");
  if (dict && dict->Get()) {
    // Free existing metadata
    if (ctx->metadata) {
      av_dict_free(&ctx->metadata);
    }
    // Copy the dictionary content
    av_dict_copy(&ctx->metadata, dict->Get(), 0);
  }
}

Napi::Value FormatContext::GetIformat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx || !ctx->iformat) {
    return env.Null();
  }
  
  // Create an InputFormat wrapper
  Napi::Object formatObj = InputFormat::constructor.New({});
  InputFormat* format = Napi::ObjectWrap<InputFormat>::Unwrap(formatObj);
  format->Set(const_cast<AVInputFormat*>(ctx->iformat));
  
  return formatObj;
}

Napi::Value FormatContext::GetOformat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx || !ctx->oformat) {
    return env.Null();
  }
  
  // Create an OutputFormat wrapper
  Napi::Object formatObj = OutputFormat::constructor.New({});
  OutputFormat* format = Napi::ObjectWrap<OutputFormat>::Unwrap(formatObj);
  format->Set(const_cast<AVOutputFormat*>(ctx->oformat));
  
  return formatObj;
}

void FormatContext::SetOformat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    ctx->oformat = nullptr;
    return;
  }
  
  OutputFormat* format = UnwrapNativeObject<OutputFormat>(env, value, "OutputFormat");
  if (format) {
    ctx->oformat = format->Get();
  }
}

Napi::Value FormatContext::GetPb(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx || !ctx->pb) {
    return env.Null();
  }
  
  // Create an IOContext wrapper
  Napi::Object ioObj = IOContext::constructor.New({});
  IOContext* io = Napi::ObjectWrap<IOContext>::Unwrap(ioObj);
  // Note: We're not transferring ownership, just wrapping the pointer
  io->SetUnowned(ctx->pb);
  
  return ioObj;
}

void FormatContext::SetPb(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    ctx->pb = nullptr;
    return;
  }
  
  IOContext* io = UnwrapNativeObject<IOContext>(env, value, "IOContext");
  if (io) {
    // Transfer ownership from IOContext to FormatContext
    ctx->pb = io->ReleaseOwnership();
  }
}

Napi::Value FormatContext::GetStrictStdCompliance(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->strict_std_compliance);
}

void FormatContext::SetStrictStdCompliance(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsNumber()) {
    ctx->strict_std_compliance = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FormatContext::GetMaxStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    return Napi::Number::New(env, 0);
  }
  
  return Napi::Number::New(env, ctx->max_streams);
}

void FormatContext::SetMaxStreams(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = ctx_;
  if (!ctx) {
    Napi::Error::New(env, "Format context not allocated").ThrowAsJavaScriptException();
    return;
  }
  
  if (value.IsNumber()) {
    ctx->max_streams = value.As<Napi::Number>().Uint32Value();
  }
}

Napi::Value FormatContext::Dispose(const Napi::CallbackInfo& info) {
  return FreeContext(info);
}

} // namespace ffmpeg