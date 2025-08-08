#include "codec.h"

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavutil/channel_layout.h>
}

Napi::FunctionReference Codec::constructor;

Napi::Object Codec::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Codec", {
        // Properties
        InstanceAccessor<&Codec::GetName>("name"),
        InstanceAccessor<&Codec::GetLongName>("longName"),
        InstanceAccessor<&Codec::GetId>("id"),
        InstanceAccessor<&Codec::GetType>("type"),
        InstanceAccessor<&Codec::GetCapabilities>("capabilities"),
        
        // Methods
        InstanceMethod<&Codec::IsDecoder>("isDecoder"),
        InstanceMethod<&Codec::IsEncoder>("isEncoder"),
        InstanceMethod<&Codec::GetPixelFormats>("getPixelFormats"),
        InstanceMethod<&Codec::GetSampleFormats>("getSampleFormats"),
        InstanceMethod<&Codec::GetSampleRates>("getSampleRates"),
        InstanceMethod<&Codec::GetChannelLayouts>("getChannelLayouts"),
        InstanceMethod<&Codec::GetProfiles>("getProfiles"),
        
        // Static methods
        StaticMethod<&Codec::FindDecoder>("findDecoder"),
        StaticMethod<&Codec::FindDecoderByName>("findDecoderByName"),
        StaticMethod<&Codec::FindEncoder>("findEncoder"),
        StaticMethod<&Codec::FindEncoderByName>("findEncoderByName"),
        StaticMethod<&Codec::GetAllCodecs>("getAllCodecs"),
    });
    
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    
    exports.Set("Codec", func);
    return exports;
}

Codec::Codec(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<Codec>(info), codec_(nullptr) {
    // Codec is typically obtained via find methods, not created directly
}

Codec::~Codec() {
    // AVCodec is not owned, no cleanup needed
}

// Properties
Napi::Value Codec::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_ || !codec_->name) {
        return env.Null();
    }
    return Napi::String::New(env, codec_->name);
}

Napi::Value Codec::GetLongName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_ || !codec_->long_name) {
        return env.Null();
    }
    return Napi::String::New(env, codec_->long_name);
}

Napi::Value Codec::GetId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_) {
        return env.Null();
    }
    return Napi::Number::New(env, codec_->id);
}

Napi::Value Codec::GetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_) {
        return env.Null();
    }
    return Napi::Number::New(env, codec_->type);
}

Napi::Value Codec::GetCapabilities(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_) {
        return env.Null();
    }
    return Napi::Number::New(env, codec_->capabilities);
}

// Methods
Napi::Value Codec::IsDecoder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_) {
        return Napi::Boolean::New(env, false);
    }
    return Napi::Boolean::New(env, av_codec_is_decoder(codec_) != 0);
}

Napi::Value Codec::IsEncoder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!codec_) {
        return Napi::Boolean::New(env, false);
    }
    return Napi::Boolean::New(env, av_codec_is_encoder(codec_) != 0);
}

Napi::Value Codec::GetPixelFormats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array formats = Napi::Array::New(env);
    
    if (!codec_ || !codec_->pix_fmts) {
        return formats;
    }
    
    uint32_t index = 0;
    for (int i = 0; codec_->pix_fmts[i] != AV_PIX_FMT_NONE; i++) {
        formats.Set(index++, Napi::Number::New(env, codec_->pix_fmts[i]));
    }
    
    return formats;
}

Napi::Value Codec::GetSampleFormats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array formats = Napi::Array::New(env);
    
    if (!codec_ || !codec_->sample_fmts) {
        return formats;
    }
    
    uint32_t index = 0;
    for (int i = 0; codec_->sample_fmts[i] != AV_SAMPLE_FMT_NONE; i++) {
        formats.Set(index++, Napi::Number::New(env, codec_->sample_fmts[i]));
    }
    
    return formats;
}

Napi::Value Codec::GetSampleRates(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array rates = Napi::Array::New(env);
    
    if (!codec_ || !codec_->supported_samplerates) {
        return rates;
    }
    
    uint32_t index = 0;
    for (int i = 0; codec_->supported_samplerates[i] != 0; i++) {
        rates.Set(index++, Napi::Number::New(env, codec_->supported_samplerates[i]));
    }
    
    return rates;
}

Napi::Value Codec::GetChannelLayouts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array layouts = Napi::Array::New(env);
    
    if (!codec_ || !codec_->ch_layouts) {
        return layouts;
    }
    
    uint32_t index = 0;
    for (int i = 0; av_channel_layout_check(&codec_->ch_layouts[i]); i++) {
        Napi::Object layout = Napi::Object::New(env);
        layout.Set("nbChannels", Napi::Number::New(env, codec_->ch_layouts[i].nb_channels));
        layout.Set("order", Napi::Number::New(env, codec_->ch_layouts[i].order));
        layout.Set("mask", Napi::BigInt::New(env, codec_->ch_layouts[i].u.mask));
        layouts.Set(index++, layout);
    }
    
    return layouts;
}

Napi::Value Codec::GetProfiles(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array profiles = Napi::Array::New(env);
    
    if (!codec_ || !codec_->profiles) {
        return profiles;
    }
    
    uint32_t index = 0;
    for (int i = 0; codec_->profiles[i].profile != AV_PROFILE_UNKNOWN; i++) {
        Napi::Object profile = Napi::Object::New(env);
        profile.Set("profile", Napi::Number::New(env, codec_->profiles[i].profile));
        if (codec_->profiles[i].name) {
            profile.Set("name", Napi::String::New(env, codec_->profiles[i].name));
        }
        profiles.Set(index++, profile);
    }
    
    return profiles;
}

// Static methods
Napi::Value Codec::FindDecoder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected codec ID number").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    AVCodecID id = static_cast<AVCodecID>(info[0].As<Napi::Number>().Int32Value());
    const AVCodec* codec = avcodec_find_decoder(id);
    
    if (!codec) {
        return env.Null();
    }
    
    return FromNative(env, codec);
}

Napi::Value Codec::FindDecoderByName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected codec name string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string name = info[0].As<Napi::String>().Utf8Value();
    const AVCodec* codec = avcodec_find_decoder_by_name(name.c_str());
    
    if (!codec) {
        return env.Null();
    }
    
    return FromNative(env, codec);
}

Napi::Value Codec::FindEncoder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected codec ID number").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    AVCodecID id = static_cast<AVCodecID>(info[0].As<Napi::Number>().Int32Value());
    const AVCodec* codec = avcodec_find_encoder(id);
    
    if (!codec) {
        return env.Null();
    }
    
    return FromNative(env, codec);
}

Napi::Value Codec::FindEncoderByName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected codec name string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string name = info[0].As<Napi::String>().Utf8Value();
    const AVCodec* codec = avcodec_find_encoder_by_name(name.c_str());
    
    if (!codec) {
        return env.Null();
    }
    
    return FromNative(env, codec);
}

Napi::Value Codec::GetAllCodecs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array codecs = Napi::Array::New(env);
    
    void* opaque = nullptr;
    uint32_t index = 0;
    
    const AVCodec* codec = nullptr;
    while ((codec = av_codec_iterate(&opaque)) != nullptr) {
        codecs.Set(index++, FromNative(env, codec));
    }
    
    return codecs;
}

// Static factory
Napi::Object Codec::FromNative(Napi::Env env, const AVCodec* codec) {
    if (!codec) {
        return env.Null().As<Napi::Object>();
    }
    
    Napi::Object obj = constructor.New({});
    
    Codec* wrapper = Napi::ObjectWrap<Codec>::Unwrap(obj);
    wrapper->SetCodec(codec);
    
    return obj;
}