#include "format_context.h"
#include "packet.h"
#include "stream.h"
#include <vector>

namespace ffmpeg {

Napi::FunctionReference FormatContext::constructor;

Napi::Object FormatContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FormatContext", {
    // Lifecycle
    InstanceMethod<&FormatContext::OpenInput>("openInput"),
    InstanceMethod<&FormatContext::CloseInput>("closeInput"),
    
    // Stream Discovery
    InstanceMethod<&FormatContext::FindStreamInfo>("findStreamInfo"),
    InstanceMethod<&FormatContext::FindBestStream>("findBestStream"),
    
    // Reading
    InstanceMethod<&FormatContext::ReadFrame>("readFrame"),
    InstanceMethod<&FormatContext::SeekFrame>("seekFrame"),
    InstanceMethod<&FormatContext::SeekFile>("seekFile"),
    InstanceMethod<&FormatContext::Flush>("flush"),
    
    // Writing
    InstanceMethod<&FormatContext::WriteHeader>("writeHeader"),
    InstanceMethod<&FormatContext::WriteFrame>("writeFrame"),
    InstanceMethod<&FormatContext::WriteInterleavedFrame>("writeInterleavedFrame"),
    InstanceMethod<&FormatContext::WriteTrailer>("writeTrailer"),
    
    // Stream Management
    InstanceAccessor<&FormatContext::GetStreams>("streams"),
    InstanceAccessor<&FormatContext::GetNbStreams>("nbStreams"),
    InstanceMethod<&FormatContext::NewStream>("newStream"),
    
    // Properties
    InstanceAccessor<&FormatContext::GetUrl>("url"),
    InstanceAccessor<&FormatContext::GetDuration>("duration"),
    InstanceAccessor<&FormatContext::GetStartTime>("startTime"),
    InstanceAccessor<&FormatContext::GetBitRate>("bitRate"),
    InstanceAccessor<&FormatContext::GetMetadata, &FormatContext::SetMetadata>("metadata"),
    InstanceAccessor<&FormatContext::GetFlags, &FormatContext::SetFlags>("flags"),
    InstanceAccessor<&FormatContext::GetMaxAnalyzeDuration, &FormatContext::SetMaxAnalyzeDuration>("maxAnalyzeDuration"),
    InstanceAccessor<&FormatContext::GetProbesize, &FormatContext::SetProbesize>("probesize"),
    
    // Format Info
    InstanceAccessor<&FormatContext::GetInputFormat>("inputFormat"),
    InstanceAccessor<&FormatContext::GetOutputFormat>("outputFormat"),
    
    // Utility
    InstanceMethod<&FormatContext::Dump>("dump"),
    
    // Symbol.dispose
    InstanceMethod<&FormatContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    
    // Static methods
    StaticMethod<&FormatContext::AllocFormatContext>("allocFormatContext"),
    StaticMethod<&FormatContext::AllocOutputFormatContext>("allocOutputFormatContext"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FormatContext", func);
  return exports;
}

FormatContext::FormatContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<FormatContext>(info) {
  Napi::Env env = info.Env();
  
  // Default constructor allocates a new context
  AVFormatContext* ctx = avformat_alloc_context();
  if (!ctx) {
    Napi::Error::New(env, "Failed to allocate format context").ThrowAsJavaScriptException();
    return;
  }
  context_.Reset(ctx);
}

void FormatContext::SetContext(AVFormatContext* ctx) {
  context_.Reset(ctx);
}

// Lifecycle
Napi::Value FormatContext::OpenInput(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "URL string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  
  // TODO: Support input format and options
  AVFormatContext* ctx = context_.Get();
  int ret = avformat_open_input(&ctx, url.c_str(), nullptr, nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to open input");
    return env.Undefined();
  }
  
  // Update our internal pointer as avformat_open_input may reallocate
  context_.Reset(ctx);
  
  return env.Undefined();
}

Napi::Value FormatContext::CloseInput(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = context_.Get();
  if (ctx) {
    avformat_close_input(&ctx);
    context_.Reset(nullptr);
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = context_.Get();
  if (ctx) {
    avformat_close_input(&ctx);
    context_.Reset(nullptr);
  }
  
  return env.Undefined();
}

// Stream Discovery
Napi::Value FormatContext::FindStreamInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = avformat_find_stream_info(context_.Get(), nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to find stream info");
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::FindBestStream(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Media type required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  AVMediaType type = static_cast<AVMediaType>(info[0].As<Napi::Number>().Int32Value());
  
  int wanted_stream_nb = -1;
  int related_stream = -1;
  
  if (info.Length() >= 2 && info[1].IsNumber()) {
    wanted_stream_nb = info[1].As<Napi::Number>().Int32Value();
  }
  if (info.Length() >= 3 && info[2].IsNumber()) {
    related_stream = info[2].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_find_best_stream(context_.Get(), type, wanted_stream_nb, related_stream, nullptr, 0);
  if (ret < 0) {
    if (ret == AVERROR_STREAM_NOT_FOUND) {
      return Napi::Number::New(env, -1);
    }
    CheckFFmpegError(env, ret, "Failed to find best stream");
    return env.Null();
  }
  
  return Napi::Number::New(env, ret);
}

// Reading
Napi::Value FormatContext::ReadFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Packet object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object packetObj = info[0].As<Napi::Object>();
  Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(packetObj);
  
  int ret = av_read_frame(context_.Get(), packet->GetPacket());
  if (ret < 0) {
    if (ret == AVERROR_EOF) {
      return Napi::Number::New(env, ret);
    }
    CheckFFmpegError(env, ret, "Failed to read frame");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::SeekFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "Stream index, timestamp, and flags required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int stream_index = info[0].As<Napi::Number>().Int32Value();
  bool lossless;
  int64_t timestamp = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  int flags = info[2].As<Napi::Number>().Int32Value();
  
  int ret = av_seek_frame(context_.Get(), stream_index, timestamp, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to seek frame");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::SeekFile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Stream index, min_ts, ts, max_ts required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int stream_index = info[0].As<Napi::Number>().Int32Value();
  bool lossless;
  int64_t min_ts = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t ts = info[2].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t max_ts = info[3].As<Napi::BigInt>().Int64Value(&lossless);
  int flags = info.Length() >= 5 ? info[4].As<Napi::Number>().Int32Value() : 0;
  
  int ret = avformat_seek_file(context_.Get(), stream_index, min_ts, ts, max_ts, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to seek file");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::Flush(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = avformat_flush(context_.Get());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to flush");
  }
  
  return env.Undefined();
}

// Writing
Napi::Value FormatContext::WriteHeader(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // TODO: Support options dictionary
  int ret = avformat_write_header(context_.Get(), nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write header");
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::WriteFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object packetObj = info[0].As<Napi::Object>();
    Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(packetObj);
    pkt = packet->GetPacket();
  }
  
  int ret = av_write_frame(context_.Get(), pkt);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write frame");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteInterleavedFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object packetObj = info[0].As<Napi::Object>();
    Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(packetObj);
    pkt = packet->GetPacket();
  }
  
  int ret = av_interleaved_write_frame(context_.Get(), pkt);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write interleaved frame");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteTrailer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = av_write_trailer(context_.Get());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write trailer");
  }
  
  return env.Undefined();
}

// Stream Management
Napi::Value FormatContext::GetStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFormatContext* ctx = context_.Get();
  
  Napi::Array streams = Napi::Array::New(env, ctx->nb_streams);
  
  for (unsigned int i = 0; i < ctx->nb_streams; i++) {
    // Create Stream wrapper object
    Napi::Object streamObj = Stream::constructor.New({});
    Stream* stream = Napi::ObjectWrap<Stream>::Unwrap(streamObj);
    stream->SetStream(ctx->streams[i]);
    streams[i] = streamObj;
  }
  
  return streams;
}

Napi::Value FormatContext::GetNbStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->nb_streams);
}

Napi::Value FormatContext::NewStream(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVStream* stream = avformat_new_stream(context_.Get(), nullptr);
  if (!stream) {
    Napi::Error::New(env, "Failed to create new stream").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // TODO: Return Stream wrapper object
  // For now, return stream index
  return Napi::Number::New(env, stream->index);
}

// Properties
Napi::Value FormatContext::GetUrl(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFormatContext* ctx = context_.Get();
  
  if (ctx->url) {
    return Napi::String::New(env, ctx->url);
  }
  
  return env.Null();
}

Napi::Value FormatContext::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->duration);
}

Napi::Value FormatContext::GetStartTime(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->start_time);
}

Napi::Value FormatContext::GetBitRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->bit_rate);
}

Napi::Value FormatContext::GetMetadata(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFormatContext* ctx = context_.Get();
  if (!ctx || !ctx->metadata) {
    return env.Null();
  }
  
  Napi::Object metadata = Napi::Object::New(env);
  AVDictionaryEntry* entry = nullptr;
  
  while ((entry = av_dict_get(ctx->metadata, "", entry, AV_DICT_IGNORE_SUFFIX))) {
    if (entry->key && entry->value) {
      metadata.Set(entry->key, Napi::String::New(env, entry->value));
    }
  }
  
  return metadata;
}

void FormatContext::SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  if (!value.IsObject()) {
    return;
  }
  
  Napi::Object metadata = value.As<Napi::Object>();
  AVDictionary* dict = nullptr;
  
  Napi::Array keys = metadata.GetPropertyNames();
  for (uint32_t i = 0; i < keys.Length(); i++) {
    Napi::Value key = keys[i];
    Napi::Value val = metadata.Get(key);
    
    if (key.IsString() && val.IsString()) {
      av_dict_set(&dict, key.As<Napi::String>().Utf8Value().c_str(),
                  val.As<Napi::String>().Utf8Value().c_str(), 0);
    }
  }
  
  // Free old metadata and set new
  if (context_.Get()->metadata) {
    av_dict_free(&context_.Get()->metadata);
  }
  context_.Get()->metadata = dict;
}

Napi::Value FormatContext::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->flags);
}

void FormatContext::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->flags = value.As<Napi::Number>().Int32Value();
}

Napi::Value FormatContext::GetMaxAnalyzeDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->max_analyze_duration);
}

void FormatContext::SetMaxAnalyzeDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_.Get()->max_analyze_duration = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value FormatContext::GetProbesize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->probesize);
}

void FormatContext::SetProbesize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_.Get()->probesize = value.As<Napi::BigInt>().Int64Value(&lossless);
}

// Format Info
Napi::Value FormatContext::GetInputFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const AVInputFormat* fmt = context_.Get()->iformat;
  
  if (!fmt) {
    return env.Null();
  }
  
  Napi::Object format = Napi::Object::New(env);
  if (fmt->name) format.Set("name", Napi::String::New(env, fmt->name));
  if (fmt->long_name) format.Set("longName", Napi::String::New(env, fmt->long_name));
  if (fmt->mime_type) format.Set("mimeType", Napi::String::New(env, fmt->mime_type));
  format.Set("flags", Napi::Number::New(env, fmt->flags));
  
  return format;
}

Napi::Value FormatContext::GetOutputFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const AVOutputFormat* fmt = context_.Get()->oformat;
  
  if (!fmt) {
    return env.Null();
  }
  
  Napi::Object format = Napi::Object::New(env);
  if (fmt->name) format.Set("name", Napi::String::New(env, fmt->name));
  if (fmt->long_name) format.Set("longName", Napi::String::New(env, fmt->long_name));
  if (fmt->mime_type) format.Set("mimeType", Napi::String::New(env, fmt->mime_type));
  format.Set("flags", Napi::Number::New(env, fmt->flags));
  
  return format;
}

// Utility
Napi::Value FormatContext::Dump(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int index = 0;
  bool is_output = false;
  
  if (info.Length() >= 1) {
    index = info[0].As<Napi::Number>().Int32Value();
  }
  if (info.Length() >= 2) {
    is_output = info[1].As<Napi::Boolean>().Value();
  }
  
  const char* url = context_.Get()->url ? context_.Get()->url : "";
  av_dump_format(context_.Get(), index, url, is_output ? 1 : 0);
  
  return env.Undefined();
}

// Static factory methods
Napi::Value FormatContext::AllocFormatContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Napi::Object instance = constructor.New({});
  return instance;
}

Napi::Value FormatContext::AllocOutputFormatContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Format name required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string format_name = info[0].As<Napi::String>().Utf8Value();
  std::string filename;
  
  if (info.Length() >= 2 && info[1].IsString()) {
    filename = info[1].As<Napi::String>().Utf8Value();
  }
  
  AVFormatContext* ctx = nullptr;
  int ret = avformat_alloc_output_context2(&ctx, nullptr, 
                                           format_name.c_str(), 
                                           filename.empty() ? nullptr : filename.c_str());
  if (ret < 0 || !ctx) {
    CheckFFmpegError(env, ret, "Failed to allocate output format context");
    return env.Null();
  }
  
  Napi::Object instance = constructor.New({});
  FormatContext* formatCtx = Napi::ObjectWrap<FormatContext>::Unwrap(instance);
  formatCtx->SetContext(ctx);
  
  return instance;
}

}  // namespace ffmpeg