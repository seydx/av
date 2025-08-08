#include "stream.h"

namespace ffmpeg {

Napi::FunctionReference Stream::constructor;

Napi::Object Stream::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Stream", {
    // Core Properties
    InstanceAccessor<&Stream::GetIndex>("index"),
    InstanceAccessor<&Stream::GetId, &Stream::SetId>("id"),
    InstanceAccessor<&Stream::GetDuration>("duration"),
    InstanceAccessor<&Stream::GetNbFrames>("nbFrames"),
    InstanceAccessor<&Stream::GetStartTime>("startTime"),
    
    // Timing Properties
    InstanceAccessor<&Stream::GetTimeBase, &Stream::SetTimeBase>("timeBase"),
    InstanceAccessor<&Stream::GetAvgFrameRate, &Stream::SetAvgFrameRate>("avgFrameRate"),
    InstanceAccessor<&Stream::GetRFrameRate, &Stream::SetRFrameRate>("rFrameRate"),
    InstanceAccessor<&Stream::GetSampleAspectRatio, &Stream::SetSampleAspectRatio>("sampleAspectRatio"),
    
    // Configuration
    InstanceAccessor<&Stream::GetDiscard, &Stream::SetDiscard>("discard"),
    InstanceAccessor<&Stream::GetDisposition, &Stream::SetDisposition>("disposition"),
    InstanceAccessor<&Stream::GetEventFlags>("eventFlags"),
    InstanceAccessor<&Stream::GetMetadata, &Stream::SetMetadata>("metadata"),
    
    // Codec Parameters
    InstanceAccessor<&Stream::GetCodecParameters>("codecParameters"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Stream", func);
  return exports;
}

Stream::Stream(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<Stream>(info), stream_(nullptr) {
  // Stream is typically not created directly but obtained from FormatContext
}

// Core Properties
Napi::Value Stream::GetIndex(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::Number::New(env, stream_->index);
}

Napi::Value Stream::GetId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::Number::New(env, stream_->id);
}

void Stream::SetId(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->id = value.As<Napi::Number>().Int32Value();
}

Napi::Value Stream::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::BigInt::New(env, stream_->duration);
}

Napi::Value Stream::GetNbFrames(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::BigInt::New(env, stream_->nb_frames);
}

Napi::Value Stream::GetStartTime(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::BigInt::New(env, stream_->start_time);
}

// Timing Properties
Napi::Value Stream::GetTimeBase(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return RationalToJS(env, stream_->time_base);
}

void Stream::SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->time_base = JSToRational(value.As<Napi::Object>());
}

Napi::Value Stream::GetAvgFrameRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return RationalToJS(env, stream_->avg_frame_rate);
}

void Stream::SetAvgFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->avg_frame_rate = JSToRational(value.As<Napi::Object>());
}

Napi::Value Stream::GetRFrameRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return RationalToJS(env, stream_->r_frame_rate);
}

void Stream::SetRFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->r_frame_rate = JSToRational(value.As<Napi::Object>());
}

Napi::Value Stream::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return RationalToJS(env, stream_->sample_aspect_ratio);
}

void Stream::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->sample_aspect_ratio = JSToRational(value.As<Napi::Object>());
}

// Configuration
Napi::Value Stream::GetDiscard(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::Number::New(env, stream_->discard);
}

void Stream::SetDiscard(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->discard = static_cast<AVDiscard>(value.As<Napi::Number>().Int32Value());
}

Napi::Value Stream::GetDisposition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::Number::New(env, stream_->disposition);
}

void Stream::SetDisposition(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  stream_->disposition = value.As<Napi::Number>().Int32Value();
}

Napi::Value Stream::GetEventFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_) return env.Null();
  return Napi::Number::New(env, stream_->event_flags);
}

Napi::Value Stream::GetMetadata(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!stream_ || !stream_->metadata) {
    return env.Null();
  }
  
  Napi::Object metadata = Napi::Object::New(env);
  AVDictionaryEntry* entry = nullptr;
  
  while ((entry = av_dict_get(stream_->metadata, "", entry, AV_DICT_IGNORE_SUFFIX))) {
    if (entry->key && entry->value) {
      metadata.Set(entry->key, Napi::String::New(env, entry->value));
    }
  }
  
  return metadata;
}

void Stream::SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!stream_) return;
  
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
  if (stream_->metadata) {
    av_dict_free(&stream_->metadata);
  }
  stream_->metadata = dict;
}

// Codec Parameters
Napi::Value Stream::GetCodecParameters(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!stream_ || !stream_->codecpar) {
    return env.Null();
  }
  
  // Return a proper CodecParameters wrapper object
  return CodecParameters::FromNative(env, stream_->codecpar);
}

}  // namespace ffmpeg