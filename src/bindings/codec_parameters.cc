#include "codec_parameters.h"
#include "codec_context.h"

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavutil/channel_layout.h>
}

Napi::FunctionReference CodecParameters::constructor;

Napi::Object CodecParameters::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "CodecParameters", {
        // Properties
        InstanceAccessor<&CodecParameters::GetCodecType, &CodecParameters::SetCodecType>("codecType"),
        InstanceAccessor<&CodecParameters::GetCodecId, &CodecParameters::SetCodecId>("codecId"),
        InstanceAccessor<&CodecParameters::GetBitRate, &CodecParameters::SetBitRate>("bitRate"),
        InstanceAccessor<&CodecParameters::GetWidth, &CodecParameters::SetWidth>("width"),
        InstanceAccessor<&CodecParameters::GetHeight, &CodecParameters::SetHeight>("height"),
        InstanceAccessor<&CodecParameters::GetFormat, &CodecParameters::SetFormat>("format"),
        InstanceAccessor<&CodecParameters::GetSampleRate, &CodecParameters::SetSampleRate>("sampleRate"),
        InstanceAccessor<&CodecParameters::GetChannelLayout, &CodecParameters::SetChannelLayout>("channelLayout"),
        InstanceAccessor<&CodecParameters::GetExtraData, &CodecParameters::SetExtraData>("extraData"),
        InstanceAccessor<&CodecParameters::GetProfile, &CodecParameters::SetProfile>("profile"),
        InstanceAccessor<&CodecParameters::GetLevel, &CodecParameters::SetLevel>("level"),
        InstanceAccessor<&CodecParameters::GetFrameSize, &CodecParameters::SetFrameSize>("frameSize"),
        InstanceAccessor<&CodecParameters::GetSampleAspectRatio, &CodecParameters::SetSampleAspectRatio>("sampleAspectRatio"),
        InstanceAccessor<&CodecParameters::GetColorRange, &CodecParameters::SetColorRange>("colorRange"),
        InstanceAccessor<&CodecParameters::GetColorSpace, &CodecParameters::SetColorSpace>("colorSpace"),
        InstanceAccessor<&CodecParameters::GetColorPrimaries, &CodecParameters::SetColorPrimaries>("colorPrimaries"),
        InstanceAccessor<&CodecParameters::GetColorTransferCharacteristic, &CodecParameters::SetColorTransferCharacteristic>("colorTransferCharacteristic"),
        InstanceAccessor<&CodecParameters::GetChromaLocation, &CodecParameters::SetChromaLocation>("chromaLocation"),
        InstanceAccessor<&CodecParameters::GetCodecTag, &CodecParameters::SetCodecTag>("codecTag"),
        
        // Methods
        InstanceMethod<&CodecParameters::Copy>("copy"),
        InstanceMethod<&CodecParameters::FromCodecContext>("fromCodecContext"),
        InstanceMethod<&CodecParameters::ToCodecContext>("toCodecContext"),
        
        // Symbol.dispose
        InstanceMethod<&CodecParameters::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
    });
    
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    
    exports.Set("CodecParameters", func);
    return exports;
}

CodecParameters::CodecParameters(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<CodecParameters>(info) {
    Napi::Env env = info.Env();
    
    AVCodecParameters* params = avcodec_parameters_alloc();
    if (!params) {
        Napi::Error::New(env, "Failed to allocate codec parameters").ThrowAsJavaScriptException();
        return;
    }
    
    params_.Reset(params);
}

CodecParameters::~CodecParameters() {
}

// Properties
Napi::Value CodecParameters::GetCodecType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->codec_type);
}

void CodecParameters::SetCodecType(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->codec_type = static_cast<AVMediaType>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetCodecId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->codec_id);
}

void CodecParameters::SetCodecId(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->codec_id = static_cast<AVCodecID>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetBitRate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::BigInt::New(env, params_.Get()->bit_rate);
}

void CodecParameters::SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
    bool lossless;
    params_.Get()->bit_rate = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value CodecParameters::GetWidth(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->width);
}

void CodecParameters::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->width = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetHeight(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->height);
}

void CodecParameters::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->height = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetFormat(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->format);
}

void CodecParameters::SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->format = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetSampleRate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->sample_rate);
}

void CodecParameters::SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->sample_rate = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetChannelLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object layout = Napi::Object::New(env);
    
    AVChannelLayout* ch_layout = &params_.Get()->ch_layout;
    layout.Set("nbChannels", Napi::Number::New(env, ch_layout->nb_channels));
    layout.Set("order", Napi::Number::New(env, ch_layout->order));
    layout.Set("mask", Napi::BigInt::New(env, ch_layout->u.mask));
    
    return layout;
}

void CodecParameters::SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsObject()) return;
    
    Napi::Object layout = value.As<Napi::Object>();
    AVChannelLayout* ch_layout = &params_.Get()->ch_layout;
    
    if (layout.Has("nbChannels")) {
        ch_layout->nb_channels = layout.Get("nbChannels").As<Napi::Number>().Int32Value();
    }
    if (layout.Has("order")) {
        ch_layout->order = static_cast<AVChannelOrder>(layout.Get("order").As<Napi::Number>().Int32Value());
    }
    if (layout.Has("mask")) {
        bool lossless;
        ch_layout->u.mask = layout.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
    }
}

Napi::Value CodecParameters::GetExtraData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!params_.Get()->extradata || params_.Get()->extradata_size <= 0) {
        return env.Null();
    }
    
    return Napi::Buffer<uint8_t>::Copy(env, params_.Get()->extradata, params_.Get()->extradata_size);
}

void CodecParameters::SetExtraData(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (value.IsNull() || value.IsUndefined()) {
        av_freep(&params_.Get()->extradata);
        params_.Get()->extradata_size = 0;
        return;
    }
    
    if (!value.IsBuffer()) return;
    
    Napi::Buffer<uint8_t> buffer = value.As<Napi::Buffer<uint8_t>>();
    
    // Free existing extra data
    av_freep(&params_.Get()->extradata);
    
    // Allocate new extra data
    params_.Get()->extradata_size = buffer.Length();
    params_.Get()->extradata = static_cast<uint8_t*>(av_malloc(params_.Get()->extradata_size + AV_INPUT_BUFFER_PADDING_SIZE));
    
    if (params_.Get()->extradata) {
        memcpy(params_.Get()->extradata, buffer.Data(), params_.Get()->extradata_size);
        memset(params_.Get()->extradata + params_.Get()->extradata_size, 0, AV_INPUT_BUFFER_PADDING_SIZE);
    } else {
        params_.Get()->extradata_size = 0;
    }
}

Napi::Value CodecParameters::GetProfile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->profile);
}

void CodecParameters::SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->profile = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetLevel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->level);
}

void CodecParameters::SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->level = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetFrameSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->frame_size);
}

void CodecParameters::SetFrameSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->frame_size = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecParameters::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object ratio = Napi::Object::New(env);
    ratio.Set("num", Napi::Number::New(env, params_.Get()->sample_aspect_ratio.num));
    ratio.Set("den", Napi::Number::New(env, params_.Get()->sample_aspect_ratio.den));
    return ratio;
}

void CodecParameters::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsObject()) return;
    
    Napi::Object ratio = value.As<Napi::Object>();
    if (ratio.Has("num")) {
        params_.Get()->sample_aspect_ratio.num = ratio.Get("num").As<Napi::Number>().Int32Value();
    }
    if (ratio.Has("den")) {
        params_.Get()->sample_aspect_ratio.den = ratio.Get("den").As<Napi::Number>().Int32Value();
    }
}

Napi::Value CodecParameters::GetColorRange(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->color_range);
}

void CodecParameters::SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->color_range = static_cast<AVColorRange>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetColorSpace(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->color_space);
}

void CodecParameters::SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->color_space = static_cast<AVColorSpace>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetColorPrimaries(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->color_primaries);
}

void CodecParameters::SetColorPrimaries(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->color_primaries = static_cast<AVColorPrimaries>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetColorTransferCharacteristic(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->color_trc);
}

void CodecParameters::SetColorTransferCharacteristic(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->color_trc = static_cast<AVColorTransferCharacteristic>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetChromaLocation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->chroma_location);
}

void CodecParameters::SetChromaLocation(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->chroma_location = static_cast<AVChromaLocation>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecParameters::GetCodecTag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, params_.Get()->codec_tag);
}

void CodecParameters::SetCodecTag(const Napi::CallbackInfo& info, const Napi::Value& value) {
    params_.Get()->codec_tag = value.As<Napi::Number>().Uint32Value();
}

// Methods
Napi::Value CodecParameters::Copy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected CodecParameters object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    CodecParameters* dst = Napi::ObjectWrap<CodecParameters>::Unwrap(info[0].As<Napi::Object>());
    int ret = avcodec_parameters_copy(dst->params_.Get(), params_.Get());
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
        Napi::Error::New(env, std::string("Failed to copy codec parameters: ") + errbuf).ThrowAsJavaScriptException();
    }
    
    return env.Undefined();
}

Napi::Value CodecParameters::FromCodecContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected CodecContext object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    ffmpeg::CodecContext* ctx = Napi::ObjectWrap<ffmpeg::CodecContext>::Unwrap(info[0].As<Napi::Object>());
    int ret = avcodec_parameters_from_context(params_.Get(), ctx->Get());
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
        Napi::Error::New(env, std::string("Failed to copy from codec context: ") + errbuf).ThrowAsJavaScriptException();
    }
    
    return env.Undefined();
}

Napi::Value CodecParameters::ToCodecContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected CodecContext object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    ffmpeg::CodecContext* ctx = Napi::ObjectWrap<ffmpeg::CodecContext>::Unwrap(info[0].As<Napi::Object>());
    int ret = avcodec_parameters_to_context(ctx->Get(), params_.Get());
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, AV_ERROR_MAX_STRING_SIZE);
        Napi::Error::New(env, std::string("Failed to copy to codec context: ") + errbuf).ThrowAsJavaScriptException();
    }
    
    return env.Undefined();
}

void CodecParameters::Dispose(const Napi::CallbackInfo& info) {
    params_.Reset(nullptr);
}

// Static factory
Napi::Object CodecParameters::FromNative(Napi::Env env, AVCodecParameters* params) {
    Napi::Object obj = constructor.New({});
    
    CodecParameters* wrapper = Napi::ObjectWrap<CodecParameters>::Unwrap(obj);
    
    // Make a copy of the parameters
    avcodec_parameters_copy(wrapper->params_.Get(), params);
    
    return obj;
}