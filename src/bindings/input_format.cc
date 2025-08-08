#include "input_format.h"
#include <vector>
#include <string>

Napi::FunctionReference InputFormat::constructor;

Napi::Object InputFormat::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "InputFormat", {
        StaticMethod("find", &InputFormat::Find),
        StaticMethod("getAll", &InputFormat::GetAll),
        InstanceAccessor("name", &InputFormat::GetName, nullptr),
        InstanceAccessor("longName", &InputFormat::GetLongName, nullptr),
        InstanceAccessor("flags", &InputFormat::GetFlags, nullptr),
        InstanceAccessor("extensions", &InputFormat::GetExtensions, nullptr),
        InstanceAccessor("mimeType", &InputFormat::GetMimeType, nullptr),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("InputFormat", func);
    return exports;
}

InputFormat::InputFormat(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<InputFormat>(info), format_(nullptr) {
}

Napi::Value InputFormat::Find(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected format name as string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();
    const AVInputFormat* fmt = av_find_input_format(name.c_str());
    
    if (!fmt) {
        return env.Null();
    }

    Napi::Object instance = constructor.New({});
    InputFormat* obj = Napi::ObjectWrap<InputFormat>::Unwrap(instance);
    obj->SetFormat(fmt);
    
    return instance;
}

Napi::Value InputFormat::GetAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array result = Napi::Array::New(env);
    
    void* opaque = nullptr;
    const AVInputFormat* fmt = nullptr;
    uint32_t index = 0;
    
    while ((fmt = av_demuxer_iterate(&opaque))) {
        Napi::Object instance = constructor.New({});
        InputFormat* obj = Napi::ObjectWrap<InputFormat>::Unwrap(instance);
        obj->SetFormat(fmt);
        result.Set(index++, instance);
    }
    
    return result;
}

Napi::Value InputFormat::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->name) {
        return env.Null();
    }
    return Napi::String::New(env, format_->name);
}

Napi::Value InputFormat::GetLongName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->long_name) {
        return env.Null();
    }
    return Napi::String::New(env, format_->long_name);
}

Napi::Value InputFormat::GetFlags(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_) {
        return Napi::Number::New(env, 0);
    }
    return Napi::Number::New(env, format_->flags);
}

Napi::Value InputFormat::GetExtensions(const Napi::CallbackInfo& info) {
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

Napi::Value InputFormat::GetMimeType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!format_ || !format_->mime_type) {
        return env.Null();
    }
    return Napi::String::New(env, format_->mime_type);
}