#include "output_format.h"
#include <vector>
#include <string>

Napi::FunctionReference OutputFormat::constructor;

Napi::Object OutputFormat::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "OutputFormat", {
        StaticMethod("find", &OutputFormat::Find),
        StaticMethod("guess", &OutputFormat::Guess),
        StaticMethod("getAll", &OutputFormat::GetAll),
        InstanceAccessor("name", &OutputFormat::GetName, nullptr),
        InstanceAccessor("longName", &OutputFormat::GetLongName, nullptr),
        InstanceAccessor("flags", &OutputFormat::GetFlags, nullptr),
        InstanceAccessor("extensions", &OutputFormat::GetExtensions, nullptr),
        InstanceAccessor("mimeType", &OutputFormat::GetMimeType, nullptr),
        InstanceAccessor("audioCodec", &OutputFormat::GetAudioCodec, nullptr),
        InstanceAccessor("videoCodec", &OutputFormat::GetVideoCodec, nullptr),
        InstanceAccessor("subtitleCodec", &OutputFormat::GetSubtitleCodec, nullptr),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("OutputFormat", func);
    return exports;
}

OutputFormat::OutputFormat(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<OutputFormat>(info), format_(nullptr) {
}

Napi::Value OutputFormat::Find(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected format name as string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();
    
    // Try to find by short name first
    void* opaque = nullptr;
    const AVOutputFormat* fmt = nullptr;
    
    while ((fmt = av_muxer_iterate(&opaque))) {
        if (fmt->name && name == fmt->name) {
            Napi::Object instance = constructor.New({});
            OutputFormat* obj = Napi::ObjectWrap<OutputFormat>::Unwrap(instance);
            obj->SetFormat(fmt);
            return instance;
        }
    }
    
    return env.Null();
}

Napi::Value OutputFormat::Guess(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Store strings at function scope so they remain valid
    std::string short_name_str;
    std::string filename_str;
    std::string mime_type_str;
    
    const char* short_name = nullptr;
    const char* filename = nullptr;
    const char* mime_type = nullptr;
    
    if (info.Length() > 0 && info[0].IsObject()) {
        Napi::Object options = info[0].As<Napi::Object>();
        
        if (options.Has("shortName") && options.Get("shortName").IsString()) {
            short_name_str = options.Get("shortName").As<Napi::String>().Utf8Value();
            short_name = short_name_str.c_str();
        }
        
        if (options.Has("filename") && options.Get("filename").IsString()) {
            filename_str = options.Get("filename").As<Napi::String>().Utf8Value();
            filename = filename_str.c_str();
        }
        
        if (options.Has("mimeType") && options.Get("mimeType").IsString()) {
            mime_type_str = options.Get("mimeType").As<Napi::String>().Utf8Value();
            mime_type = mime_type_str.c_str();
        }
    }
    
    const AVOutputFormat* fmt = av_guess_format(short_name, filename, mime_type);
    
    if (!fmt) {
        return env.Null();
    }

    Napi::Object instance = constructor.New({});
    OutputFormat* obj = Napi::ObjectWrap<OutputFormat>::Unwrap(instance);
    obj->SetFormat(fmt);
    
    return instance;
}

Napi::Value OutputFormat::GetAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array result = Napi::Array::New(env);
    
    void* opaque = nullptr;
    const AVOutputFormat* fmt = nullptr;
    uint32_t index = 0;
    
    while ((fmt = av_muxer_iterate(&opaque))) {
        Napi::Object instance = constructor.New({});
        OutputFormat* obj = Napi::ObjectWrap<OutputFormat>::Unwrap(instance);
        obj->SetFormat(fmt);
        result.Set(index++, instance);
    }
    
    return result;
}

Napi::Value OutputFormat::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->name) {
        return env.Null();
    }
    return Napi::String::New(env, format_->name);
}

Napi::Value OutputFormat::GetLongName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->long_name) {
        return env.Null();
    }
    return Napi::String::New(env, format_->long_name);
}

Napi::Value OutputFormat::GetFlags(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_) {
        return Napi::Number::New(env, 0);
    }
    return Napi::Number::New(env, format_->flags);
}

Napi::Value OutputFormat::GetExtensions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->extensions) {
        return env.Null();
    }
    
    // Split extensions by comma
    std::string extensions(format_->extensions);
    Napi::Array result = Napi::Array::New(env);
    size_t start = 0;
    size_t end = 0;
    uint32_t index = 0;
    
    while ((end = extensions.find(',', start)) != std::string::npos) {
        result.Set(index++, Napi::String::New(env, extensions.substr(start, end - start)));
        start = end + 1;
    }
    if (start < extensions.length()) {
        result.Set(index, Napi::String::New(env, extensions.substr(start)));
    }
    
    return result;
}

Napi::Value OutputFormat::GetMimeType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->mime_type) {
        return env.Null();
    }
    return Napi::String::New(env, format_->mime_type);
}

Napi::Value OutputFormat::GetAudioCodec(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_) {
        return Napi::Number::New(env, AV_CODEC_ID_NONE);
    }
    return Napi::Number::New(env, format_->audio_codec);
}

Napi::Value OutputFormat::GetVideoCodec(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_) {
        return Napi::Number::New(env, AV_CODEC_ID_NONE);
    }
    return Napi::Number::New(env, format_->video_codec);
}

Napi::Value OutputFormat::GetSubtitleCodec(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_) {
        return Napi::Number::New(env, AV_CODEC_ID_NONE);
    }
    return Napi::Number::New(env, format_->subtitle_codec);
}