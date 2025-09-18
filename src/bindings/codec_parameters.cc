#include "codec_parameters.h"
#include "codec_context.h"

namespace ffmpeg {

Napi::FunctionReference CodecParameters::constructor;

Napi::Object CodecParameters::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "CodecParameters", {
    InstanceMethod<&CodecParameters::Alloc>("alloc"),
    InstanceMethod<&CodecParameters::Free>("free"),
    InstanceMethod<&CodecParameters::Copy>("copy"),
    InstanceMethod<&CodecParameters::FromContext>("fromContext"),
    InstanceMethod<&CodecParameters::ToContext>("toContext"),
    InstanceMethod<&CodecParameters::ToJSON>("toJSON"),
    InstanceMethod<&CodecParameters::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),

    InstanceAccessor<&CodecParameters::GetCodecType, &CodecParameters::SetCodecType>("codecType"),
    InstanceAccessor<&CodecParameters::GetCodecId, &CodecParameters::SetCodecId>("codecId"),
    InstanceAccessor<&CodecParameters::GetCodecTag, &CodecParameters::SetCodecTag>("codecTag"),
    InstanceAccessor<&CodecParameters::GetExtradata, &CodecParameters::SetExtradata>("extradata"),
    InstanceAccessor<&CodecParameters::GetExtradataSize>("extradataSize"),
    InstanceAccessor<&CodecParameters::GetFormat, &CodecParameters::SetFormat>("format"),
    InstanceAccessor<&CodecParameters::GetBitRate, &CodecParameters::SetBitRate>("bitRate"),
    InstanceAccessor<&CodecParameters::GetProfile, &CodecParameters::SetProfile>("profile"),
    InstanceAccessor<&CodecParameters::GetLevel, &CodecParameters::SetLevel>("level"),
    InstanceAccessor<&CodecParameters::GetWidth, &CodecParameters::SetWidth>("width"),
    InstanceAccessor<&CodecParameters::GetHeight, &CodecParameters::SetHeight>("height"),
    InstanceAccessor<&CodecParameters::GetSampleAspectRatio, &CodecParameters::SetSampleAspectRatio>("sampleAspectRatio"),
    InstanceAccessor<&CodecParameters::GetFrameRate, &CodecParameters::SetFrameRate>("frameRate"),
    InstanceAccessor<&CodecParameters::GetColorRange, &CodecParameters::SetColorRange>("colorRange"),
    InstanceAccessor<&CodecParameters::GetColorPrimaries, &CodecParameters::SetColorPrimaries>("colorPrimaries"),
    InstanceAccessor<&CodecParameters::GetColorTrc, &CodecParameters::SetColorTrc>("colorTrc"),
    InstanceAccessor<&CodecParameters::GetColorSpace, &CodecParameters::SetColorSpace>("colorSpace"),
    InstanceAccessor<&CodecParameters::GetChromaLocation, &CodecParameters::SetChromaLocation>("chromaLocation"),
    InstanceAccessor<&CodecParameters::GetChannelLayout, &CodecParameters::SetChannelLayout>("channelLayout"),
    InstanceAccessor<&CodecParameters::GetChannels, &CodecParameters::SetChannels>("channels"),
    InstanceAccessor<&CodecParameters::GetSampleRate, &CodecParameters::SetSampleRate>("sampleRate"),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("CodecParameters", func);
  return exports;
}

CodecParameters::CodecParameters(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<CodecParameters>(info) {
  // Constructor does nothing - user must explicitly call alloc()
}

CodecParameters::~CodecParameters() {
  // Manual cleanup if not already done AND we own the params
  if (!is_freed_ && params_ && is_owned_) {
    avcodec_parameters_free(&params_);
    params_ = nullptr;
  }
}

Napi::Value CodecParameters::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVCodecParameters* params = avcodec_parameters_alloc();
  if (!params) {
    Napi::Error::New(env, "Failed to allocate codec parameters (ENOMEM)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Free old params if exists AND we owned them
  if (params_ && !is_freed_ && is_owned_) {
    avcodec_parameters_free(&params_);
  }
  
  params_ = params;
  is_owned_ = true;  // When we alloc, we own it
  is_freed_ = false;
  return env.Undefined();
}

Napi::Value CodecParameters::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (params_ && !is_freed_ && is_owned_) {
    avcodec_parameters_free(&params_);
    params_ = nullptr;
    is_freed_ = true;
  }
  
  return env.Undefined();
}

Napi::Value CodecParameters::Copy(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!params_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Destination CodecParameters required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  CodecParameters* dst = UnwrapNativeObject<CodecParameters>(env, info[0], "CodecParameters");
  if (!dst || !dst->Get()) {
    Napi::TypeError::New(env, "Invalid destination CodecParameters").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = avcodec_parameters_copy(dst->Get(), params_);
  return Napi::Number::New(env, ret);
}

Napi::Value CodecParameters::FromContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!params_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "CodecContext required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  CodecContext* ctx = UnwrapNativeObject<CodecContext>(env, info[0], "CodecContext");
  if (!ctx || !ctx->Get()) {
    Napi::TypeError::New(env, "Invalid CodecContext").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = avcodec_parameters_from_context(params_, ctx->Get());
  return Napi::Number::New(env, ret);
}

Napi::Value CodecParameters::ToContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!params_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "CodecContext required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  CodecContext* ctx = UnwrapNativeObject<CodecContext>(env, info[0], "CodecContext");
  if (!ctx || !ctx->Get()) {
    Napi::TypeError::New(env, "Invalid CodecContext").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = avcodec_parameters_to_context(ctx->Get(), params_);
  return Napi::Number::New(env, ret);
}

Napi::Value CodecParameters::ToJSON(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object json = Napi::Object::New(env);
  
  if (!params_) {
    return json;  // Return empty object if not allocated
  }
  
  // Basic parameters
  json.Set("codecType", Napi::Number::New(env, params_->codec_type));
  json.Set("codecId", Napi::Number::New(env, params_->codec_id));
  json.Set("codecTag", Napi::Number::New(env, params_->codec_tag));
  
  // Extradata
  if (params_->extradata && params_->extradata_size > 0) {
    Napi::Buffer<uint8_t> extradata = Napi::Buffer<uint8_t>::Copy(env, params_->extradata, params_->extradata_size);
    json.Set("extradata", extradata);
    json.Set("extradataSize", Napi::Number::New(env, params_->extradata_size));
  } else {
    json.Set("extradata", env.Null());
    json.Set("extradataSize", Napi::Number::New(env, 0));
  }
  
  // Format (pixel format for video, sample format for audio)
  json.Set("format", Napi::Number::New(env, params_->format));
  
  // Bitrate and sample info
  json.Set("bitRate", Napi::BigInt::New(env, params_->bit_rate));
  json.Set("bitsPerCodedSample", Napi::Number::New(env, params_->bits_per_coded_sample));
  json.Set("bitsPerRawSample", Napi::Number::New(env, params_->bits_per_raw_sample));
  
  // Profile and level
  json.Set("profile", Napi::Number::New(env, params_->profile));
  json.Set("level", Napi::Number::New(env, params_->level));
  
  // Video parameters
  if (params_->codec_type == AVMEDIA_TYPE_VIDEO) {
    json.Set("width", Napi::Number::New(env, params_->width));
    json.Set("height", Napi::Number::New(env, params_->height));
    
    // Sample aspect ratio
    Napi::Object sar = Napi::Object::New(env);
    sar.Set("num", Napi::Number::New(env, params_->sample_aspect_ratio.num));
    sar.Set("den", Napi::Number::New(env, params_->sample_aspect_ratio.den));
    json.Set("sampleAspectRatio", sar);
    
    // Framerate
    if (params_->framerate.num != 0 || params_->framerate.den != 0) {
      Napi::Object framerate = Napi::Object::New(env);
      framerate.Set("num", Napi::Number::New(env, params_->framerate.num));
      framerate.Set("den", Napi::Number::New(env, params_->framerate.den));
      json.Set("framerate", framerate);
    } else {
      json.Set("framerate", env.Null());
    }
    
    // Color properties
    json.Set("fieldOrder", Napi::Number::New(env, params_->field_order));
    json.Set("colorRange", Napi::Number::New(env, params_->color_range));
    json.Set("colorPrimaries", Napi::Number::New(env, params_->color_primaries));
    json.Set("colorTrc", Napi::Number::New(env, params_->color_trc));
    json.Set("colorSpace", Napi::Number::New(env, params_->color_space));
    json.Set("chromaLocation", Napi::Number::New(env, params_->chroma_location));
    json.Set("videoDelay", Napi::Number::New(env, params_->video_delay));
  }
  
  // Audio parameters
  if (params_->codec_type == AVMEDIA_TYPE_AUDIO) {
#if LIBAVUTIL_VERSION_INT >= AV_VERSION_INT(57, 24, 100)
    json.Set("chLayout", Napi::BigInt::New(env, params_->ch_layout.u.mask));
    json.Set("channels", Napi::Number::New(env, params_->ch_layout.nb_channels));
#else
    json.Set("channelLayout", Napi::BigInt::New(env, params_->channel_layout));
    json.Set("channels", Napi::Number::New(env, params_->channels));
#endif
    json.Set("sampleRate", Napi::Number::New(env, params_->sample_rate));
    json.Set("blockAlign", Napi::Number::New(env, params_->block_align));
    json.Set("frameSize", Napi::Number::New(env, params_->frame_size));
    json.Set("initialPadding", Napi::Number::New(env, params_->initial_padding));
    json.Set("trailingPadding", Napi::Number::New(env, params_->trailing_padding));
    json.Set("seekPreroll", Napi::Number::New(env, params_->seek_preroll));
  }
  
  // Subtitle parameters
  if (params_->codec_type == AVMEDIA_TYPE_SUBTITLE) {
    json.Set("width", Napi::Number::New(env, params_->width));
    json.Set("height", Napi::Number::New(env, params_->height));
  }
  
  return json;
}

Napi::Value CodecParameters::GetCodecType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVMEDIA_TYPE_UNKNOWN);
  }
  return Napi::Number::New(env, params_->codec_type);
}

void CodecParameters::SetCodecType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->codec_type = static_cast<AVMediaType>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetCodecId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AV_CODEC_ID_NONE);
  }
  return Napi::Number::New(env, params_->codec_id);
}

void CodecParameters::SetCodecId(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->codec_id = static_cast<AVCodecID>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetCodecTag(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, params_->codec_tag);
}

void CodecParameters::SetCodecTag(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->codec_tag = value.As<Napi::Number>().Uint32Value();
  }
}

Napi::Value CodecParameters::GetExtradata(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!params_ || !params_->extradata || params_->extradata_size <= 0) {
    return env.Null();
  }
  
  return Napi::Buffer<uint8_t>::Copy(env, params_->extradata, params_->extradata_size);
}

void CodecParameters::SetExtradata(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  if (!params_) {
    return;
  }
  
  // Free existing extradata
  if (params_->extradata) {
    av_freep(&params_->extradata);
    params_->extradata_size = 0;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    return;
  }
  
  if (!value.IsBuffer()) {
    Napi::TypeError::New(env, "Extradata must be a Buffer").ThrowAsJavaScriptException();
    return;
  }
  
  Napi::Buffer<uint8_t> buffer = value.As<Napi::Buffer<uint8_t>>();
  size_t size = buffer.Length();
  
  params_->extradata = static_cast<uint8_t*>(av_mallocz(size + AV_INPUT_BUFFER_PADDING_SIZE));
  if (!params_->extradata) {
    Napi::Error::New(env, "Failed to allocate extradata").ThrowAsJavaScriptException();
    return;
  }
  
  memcpy(params_->extradata, buffer.Data(), size);
  params_->extradata_size = size;
}

Napi::Value CodecParameters::GetExtradataSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, params_->extradata_size);
}

Napi::Value CodecParameters::GetFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, -1);
  }
  return Napi::Number::New(env, params_->format);
}

void CodecParameters::SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->format = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetBitRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  return Napi::BigInt::New(env, params_->bit_rate);
}

void CodecParameters::SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    bool lossless;
    params_->bit_rate = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value CodecParameters::GetProfile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, FF_PROFILE_UNKNOWN);
  }
  return Napi::Number::New(env, params_->profile);
}

void CodecParameters::SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->profile = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetLevel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, FF_LEVEL_UNKNOWN);
  }
  return Napi::Number::New(env, params_->level);
}

void CodecParameters::SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->level = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, params_->width);
}

void CodecParameters::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->width = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, params_->height);
}

void CodecParameters::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->height = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return RationalToJS(env, {0, 1});
  }
  return RationalToJS(env, params_->sample_aspect_ratio);
}

void CodecParameters::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_ && value.IsObject()) {
    params_->sample_aspect_ratio = JSToRational(value.As<Napi::Object>());
  }
}

Napi::Value CodecParameters::GetFrameRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return RationalToJS(env, {0, 1});
  }
  return RationalToJS(env, params_->framerate);
}

void CodecParameters::SetFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_ && value.IsObject()) {
    params_->framerate = JSToRational(value.As<Napi::Object>());
  }
}

Napi::Value CodecParameters::GetColorRange(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVCOL_RANGE_UNSPECIFIED);
  }
  return Napi::Number::New(env, params_->color_range);
}

void CodecParameters::SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->color_range = static_cast<AVColorRange>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetColorPrimaries(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVCOL_PRI_UNSPECIFIED);
  }
  return Napi::Number::New(env, params_->color_primaries);
}

void CodecParameters::SetColorPrimaries(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->color_primaries = static_cast<AVColorPrimaries>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetColorTrc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVCOL_TRC_UNSPECIFIED);
  }
  return Napi::Number::New(env, params_->color_trc);
}

void CodecParameters::SetColorTrc(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->color_trc = static_cast<AVColorTransferCharacteristic>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetColorSpace(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVCOL_SPC_UNSPECIFIED);
  }
  return Napi::Number::New(env, params_->color_space);
}

void CodecParameters::SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->color_space = static_cast<AVColorSpace>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetChromaLocation(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, AVCHROMA_LOC_UNSPECIFIED);
  }
  return Napi::Number::New(env, params_->chroma_location);
}

void CodecParameters::SetChromaLocation(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->chroma_location = static_cast<AVChromaLocation>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value CodecParameters::GetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("nbChannels", Napi::Number::New(env, 0));
    obj.Set("order", Napi::Number::New(env, 0));
    obj.Set("mask", Napi::BigInt::New(env, static_cast<uint64_t>(0)));
    return obj;
  }
  
  // Return AVChannelLayout as object
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("nbChannels", Napi::Number::New(env, params_->ch_layout.nb_channels));
  obj.Set("order", Napi::Number::New(env, params_->ch_layout.order));
  obj.Set("mask", Napi::BigInt::New(env, params_->ch_layout.u.mask));
  return obj;
}

void CodecParameters::SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_ && value.IsObject()) {
    Napi::Object obj = value.As<Napi::Object>();
    
    // Set AVChannelLayout from object
    if (obj.Has("nbChannels")) {
      params_->ch_layout.nb_channels = obj.Get("nbChannels").As<Napi::Number>().Int32Value();
    }
    if (obj.Has("order")) {
      params_->ch_layout.order = static_cast<AVChannelOrder>(obj.Get("order").As<Napi::Number>().Int32Value());
    }
    if (obj.Has("mask")) {
      bool lossless;
      params_->ch_layout.u.mask = obj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
    }
  }
}

Napi::Value CodecParameters::GetChannels(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  // channels is now derived from ch_layout
  return Napi::Number::New(env, params_->ch_layout.nb_channels);
}

void CodecParameters::SetChannels(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    // Set nb_channels in ch_layout
    params_->ch_layout.nb_channels = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::GetSampleRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!params_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, params_->sample_rate);
}

void CodecParameters::SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (params_) {
    params_->sample_rate = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value CodecParameters::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}


} // namespace ffmpeg