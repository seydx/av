#include "format_context.h"
#include "packet.h"
#include "stream.h"
#include "dictionary.h"
#include "input_format.h"
#include "output_format.h"
#include "option.h"
#include "io_context.h"
#include <vector>

namespace ffmpeg {

Napi::FunctionReference FormatContext::constructor;

Napi::Object FormatContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FormatContext", {
    // Lifecycle
    InstanceMethod<&FormatContext::OpenInput>("openInput"),
    InstanceMethod<&FormatContext::OpenInputAsync>("openInputAsync"),
    InstanceMethod<&FormatContext::CloseInput>("closeInput"),
    
    // Options
    InstanceAccessor<&FormatContext::GetOptions>("options"),
    
    // Stream Discovery
    InstanceMethod<&FormatContext::FindStreamInfo>("findStreamInfo"),
    InstanceMethod<&FormatContext::FindStreamInfoAsync>("findStreamInfoAsync"),
    InstanceMethod<&FormatContext::FindBestStream>("findBestStream"),
    
    // Reading
    InstanceMethod<&FormatContext::ReadFrame>("readFrame"),
    InstanceMethod<&FormatContext::ReadFrameAsync>("readFrameAsync"),
    InstanceMethod<&FormatContext::SeekFrame>("seekFrame"),
    InstanceMethod<&FormatContext::SeekFile>("seekFile"),
    InstanceMethod<&FormatContext::Flush>("flush"),
    
    // Writing
    InstanceMethod<&FormatContext::WriteHeader>("writeHeader"),
    InstanceMethod<&FormatContext::WriteHeaderAsync>("writeHeaderAsync"),
    InstanceMethod<&FormatContext::WriteFrame>("writeFrame"),
    InstanceMethod<&FormatContext::WriteFrameAsync>("writeFrameAsync"),
    InstanceMethod<&FormatContext::WriteInterleavedFrame>("writeInterleavedFrame"),
    InstanceMethod<&FormatContext::WriteInterleavedFrameAsync>("writeInterleavedFrameAsync"),
    InstanceMethod<&FormatContext::WriteTrailer>("writeTrailer"),
    InstanceMethod<&FormatContext::WriteTrailerAsync>("writeTrailerAsync"),
    
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
    
    // I/O Context
    InstanceAccessor<&FormatContext::GetPb, &FormatContext::SetPb>("pb"),
    
    // Utility
    InstanceMethod<&FormatContext::Dump>("dump"),
    
    // Resource management
    InstanceMethod<&FormatContext::Free>("free"),
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
  : Napi::ObjectWrap<FormatContext>(info), context_(nullptr), is_opened_(false) {
  Napi::Env env = info.Env();
  
  // Default constructor allocates a new context
  context_ = avformat_alloc_context();
  if (!context_) {
    Napi::Error::New(env, "Failed to allocate format context").ThrowAsJavaScriptException();
    return;
  }
}

FormatContext::~FormatContext() {
  // Clean up based on how the context was created
  if (context_) {
    if (is_opened_) {
      // If opened with avformat_open_input, use avformat_close_input
      avformat_close_input(&context_);
    } else {
      // If just allocated, use avformat_free_context
      avformat_free_context(context_);
    }
    context_ = nullptr;
  }
}

void FormatContext::SetContext(AVFormatContext* ctx) {
  // Clean up existing context first
  if (context_) {
    if (is_opened_) {
      avformat_close_input(&context_);
    } else {
      avformat_free_context(context_);
    }
  }
  context_ = ctx;
  is_opened_ = false;
}

// Lifecycle
Napi::Value FormatContext::OpenInput(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "URL string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  std::string url = info[0].As<Napi::String>().Utf8Value();
  
  // Handle InputFormat (2nd parameter)
  AVInputFormat* input_format = nullptr;
  if (info.Length() > 1) {
    InputFormat* inputFormatWrapper = ffmpeg::UnwrapNativeObject<InputFormat>(env, info[1], "InputFormat");
    if (inputFormatWrapper) {
      input_format = const_cast<AVInputFormat*>(inputFormatWrapper->GetFormat());
    }
  }
  
  // Handle Dictionary options (3rd parameter)
  AVDictionary* options = nullptr;
  if (info.Length() > 2) {
    Dictionary* dictWrapper = ffmpeg::UnwrapNativeObject<Dictionary>(env, info[2], "Dictionary");
    if (dictWrapper) {
      options = dictWrapper->GetDict();
    }
  }
  
  // avformat_open_input takes a pointer to pointer and may reallocate
  AVFormatContext* ctx = context_;
  int ret = avformat_open_input(&ctx, url.c_str(), input_format, options ? &options : nullptr);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
    
    std::string errorMsg = "Failed to open input '" + url + "': ";
    
    // Provide more specific error messages
    if (ret == AVERROR(ENOENT)) {
      errorMsg += "File not found";
    } else if (ret == AVERROR(EACCES)) {
      errorMsg += "Permission denied";
    } else if (ret == AVERROR_INVALIDDATA) {
      errorMsg += "Invalid data found when processing input";
    } else if (ret == AVERROR_DEMUXER_NOT_FOUND) {
      errorMsg += "Demuxer not found (unknown file format)";
    } else if (ret == AVERROR_PROTOCOL_NOT_FOUND) {
      errorMsg += "Protocol not found";
    } else {
      errorMsg += errbuf;
    }
    
    Napi::Error::New(env, errorMsg).ThrowAsJavaScriptException();
    if (options) av_dict_free(&options);
    return env.Undefined();
  }
  
  // Update our internal pointer and mark as opened
  context_ = ctx;
  is_opened_ = true;
  
  // Clean up any remaining options
  if (options) av_dict_free(&options);
  
  return env.Undefined();
}

Napi::Value FormatContext::CloseInput(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_ && is_opened_) {
    avformat_close_input(&context_);
    is_opened_ = false;
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_ && is_opened_) {
    avformat_close_input(&context_);
    is_opened_ = false;
  } else if (context_) {
    avformat_free_context(context_);
    context_ = nullptr;
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

// Options
Napi::Value FormatContext::GetOptions(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    return env.Null();
  }
  
  // Use the Options helper to create an Options wrapper
  return Options::CreateFromContext(env, context_);
}

// Stream Discovery
Napi::Value FormatContext::FindStreamInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = avformat_find_stream_info(context_, nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to find stream info");
    return env.Undefined();
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
  
  int ret = av_find_best_stream(context_, type, wanted_stream_nb, related_stream, nullptr, 0);
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
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Packet object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Packet* packet = ffmpeg::UnwrapNativeObjectRequired<Packet>(env, info[0], "Packet");
  if (!packet) return env.Null();
  
  int ret = av_read_frame(context_, packet->GetPacket());
  if (ret < 0) {
    if (ret == AVERROR_EOF) {
      return Napi::Number::New(env, ret);
    }
    CheckFFmpegError(env, ret, "Failed to read frame");
    return Napi::Number::New(env, ret);
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
  
  int ret = av_seek_frame(context_, stream_index, timestamp, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to seek frame");
    return Napi::Number::New(env, ret);
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
  
  int ret = avformat_seek_file(context_, stream_index, min_ts, ts, max_ts, flags);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to seek file");
    return Napi::Number::New(env, ret);
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::Flush(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = avformat_flush(context_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to flush");
    return env.Undefined();
  }
  
  return env.Undefined();
}

// Writing
Napi::Value FormatContext::WriteHeader(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVDictionary* options = nullptr;
  if (info.Length() > 0) {
    Dictionary* dictWrapper = UnwrapNativeObject<Dictionary>(env, info[0], "Dictionary");
    if (dictWrapper) {
      options = dictWrapper->GetDict();
    }
  }
  
  int ret = avformat_write_header(context_, options ? &options : nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write header");
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value FormatContext::WriteFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0) {
    Packet* packet = ffmpeg::UnwrapNativeObject<Packet>(env, info[0], "Packet");
    if (packet) {
      pkt = packet->GetPacket();
    }
  }
  
  int ret = av_write_frame(context_, pkt);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write frame");
    return Napi::Number::New(env, ret);
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteInterleavedFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0) {
    Packet* packet = ffmpeg::UnwrapNativeObject<Packet>(env, info[0], "Packet");
    if (packet) {
      pkt = packet->GetPacket();
    }
  }
  
  int ret = av_interleaved_write_frame(context_, pkt);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write interleaved frame");
    return Napi::Number::New(env, ret);
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FormatContext::WriteTrailer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = av_write_trailer(context_);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to write trailer");
    return env.Undefined();
  }
  
  return env.Undefined();
}

// Stream Management
Napi::Value FormatContext::GetStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  Napi::Array streams = Napi::Array::New(env, context_->nb_streams);
  
  for (unsigned int i = 0; i < context_->nb_streams; i++) {
    // Create Stream wrapper object
    Napi::Object streamObj = Stream::constructor.New({});
    Stream* stream = Napi::ObjectWrap<Stream>::Unwrap(streamObj);
    stream->SetStream(context_->streams[i]);
    streams[i] = streamObj;
  }
  
  return streams;
}

Napi::Value FormatContext::GetNbStreams(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_->nb_streams);
}

Napi::Value FormatContext::NewStream(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVStream* stream = avformat_new_stream(context_, nullptr);
  if (!stream) {
    Napi::Error::New(env, "Failed to create new stream").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create Stream wrapper object
  Napi::Object streamObj = Stream::constructor.New({});
  Stream* streamWrapper = Napi::ObjectWrap<Stream>::Unwrap(streamObj);
  streamWrapper->SetStream(stream);
  
  return streamObj;
}

// Properties
Napi::Value FormatContext::GetUrl(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (context_->url) {
    return Napi::String::New(env, context_->url);
  }
  
  return env.Null();
}

Napi::Value FormatContext::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_->duration);
}

Napi::Value FormatContext::GetStartTime(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_->start_time);
}

Napi::Value FormatContext::GetBitRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_->bit_rate);
}

Napi::Value FormatContext::GetMetadata(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_ || !context_->metadata) {
    return env.Null();
  }
  
  Napi::Object metadata = Napi::Object::New(env);
  AVDictionaryEntry* entry = nullptr;
  
  while ((entry = av_dict_get(context_->metadata, "", entry, AV_DICT_IGNORE_SUFFIX))) {
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
  if (context_->metadata) {
    av_dict_free(&context_->metadata);
  }
  context_->metadata = dict;
}

Napi::Value FormatContext::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_->flags);
}

void FormatContext::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_->flags = value.As<Napi::Number>().Int32Value();
}

Napi::Value FormatContext::GetMaxAnalyzeDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_->max_analyze_duration);
}

void FormatContext::SetMaxAnalyzeDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_->max_analyze_duration = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value FormatContext::GetProbesize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_->probesize);
}

void FormatContext::SetProbesize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_->probesize = value.As<Napi::BigInt>().Int64Value(&lossless);
}

// Format Info
Napi::Value FormatContext::GetInputFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const AVInputFormat* fmt = context_->iformat;
  
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
  const AVOutputFormat* fmt = context_->oformat;
  
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

// I/O Context
Napi::Value FormatContext::GetPb(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_ || !context_->pb) {
    return env.Null();
  }
  
  // Return the raw pointer as an external - we'll wrap it properly later
  // For now, just return something so the API works
  return env.Null();
}

void FormatContext::SetPb(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!context_) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    context_->pb = nullptr;
    return;
  }
  
  // Extract AVIOContext from IOContext object
  if (value.IsObject()) {
    Napi::Object obj = value.As<Napi::Object>();
    
    // First check if it's a wrapped IOContext object
    IOContext* ioContext = nullptr;
    napi_status status = napi_unwrap(info.Env(), obj, reinterpret_cast<void**>(&ioContext));
    
    if (status == napi_ok && ioContext) {
      context_->pb = ioContext->Get();
    }
  }
}

// Utility
Napi::Value FormatContext::Dump(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!context_) {
    Napi::Error::New(env, "Format context is null").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int index = 0;
  bool is_output = false;
  
  if (info.Length() >= 1) {
    index = info[0].As<Napi::Number>().Int32Value();
  }
  if (info.Length() >= 2) {
    is_output = info[1].As<Napi::Boolean>().Value();
  }
  
  // For empty contexts without URL, pass an empty string
  const char* url = context_->url ? context_->url : "";
  
  // av_dump_format expects a valid context
  // For output contexts, oformat must be set
  // For input contexts, iformat must be set
  if (is_output && !context_->oformat) {
    // Empty output context - nothing to dump
    return env.Undefined();
  }
  if (!is_output && !context_->iformat) {
    // Empty input context - nothing to dump
    return env.Undefined();
  }
  
  av_dump_format(context_, index, url, is_output ? 1 : 0);
  
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
  
  // Parameters: (outputFormat?, formatName?, filename?)
  AVOutputFormat* output_format = nullptr;
  std::string format_name;
  std::string filename;
  
  // First parameter: OutputFormat object or null
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object outputFormatObj = info[0].As<Napi::Object>();
    OutputFormat* outputFormatWrapper = Napi::ObjectWrap<OutputFormat>::Unwrap(outputFormatObj);
    output_format = const_cast<AVOutputFormat*>(outputFormatWrapper->GetFormat());
  }
  
  // Second parameter: format name
  if (info.Length() > 1 && info[1].IsString()) {
    format_name = info[1].As<Napi::String>().Utf8Value();
  }
  
  // Third parameter: filename
  if (info.Length() > 2 && info[2].IsString()) {
    filename = info[2].As<Napi::String>().Utf8Value();
  }
  
  AVFormatContext* ctx = nullptr;
  int ret = avformat_alloc_output_context2(&ctx, output_format, 
                                           format_name.empty() ? nullptr : format_name.c_str(), 
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