#include "dictionary.h"
#include <string>
#include <vector>

Napi::FunctionReference Dictionary::constructor;

Napi::Object Dictionary::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Dictionary", {
        InstanceMethod("set", &Dictionary::Set),
        InstanceMethod("get", &Dictionary::Get),
        InstanceMethod("getAll", &Dictionary::GetAll),
        InstanceMethod("has", &Dictionary::Has),
        InstanceMethod("delete", &Dictionary::Delete),
        InstanceMethod("clear", &Dictionary::Clear),
        InstanceMethod("copy", &Dictionary::Copy),
        InstanceMethod("parseString", &Dictionary::ParseString),
        InstanceMethod("toString", &Dictionary::ToString),
        InstanceAccessor("count", &Dictionary::GetCount, nullptr),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Dictionary", func);
    return exports;
}

Dictionary::Dictionary(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<Dictionary>(info), dict_(nullptr) {
}

Dictionary::~Dictionary() {
    if (dict_) {
        av_dict_free(&dict_);
    }
}

void Dictionary::SetDict(AVDictionary* dict) {
    if (dict_) {
        av_dict_free(&dict_);
    }
    dict_ = dict;
}

Napi::Value Dictionary::Set(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (key: string, value: string, flags?: number)")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string key = info[0].As<Napi::String>().Utf8Value();
    std::string value = info[1].As<Napi::String>().Utf8Value();
    
    int flags = 0;
    if (info.Length() > 2 && info[2].IsNumber()) {
        flags = info[2].As<Napi::Number>().Int32Value();
    }

    int ret = av_dict_set(&dict_, key.c_str(), value.c_str(), flags);
    ffmpeg::CheckFFmpegError(env, ret, "Failed to set dictionary entry");

    return env.Undefined();
}

Napi::Value Dictionary::Get(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected key as string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string key = info[0].As<Napi::String>().Utf8Value();
    
    int flags = 0;
    if (info.Length() > 1 && info[1].IsNumber()) {
        flags = info[1].As<Napi::Number>().Int32Value();
    }

    AVDictionaryEntry* entry = av_dict_get(dict_, key.c_str(), nullptr, flags);
    if (!entry) {
        return env.Null();
    }

    return Napi::String::New(env, entry->value);
}

Napi::Value Dictionary::GetAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);

    AVDictionaryEntry* entry = nullptr;
    while ((entry = av_dict_get(dict_, "", entry, AV_DICT_IGNORE_SUFFIX))) {
        result.Set(entry->key, entry->value);
    }

    return result;
}

Napi::Value Dictionary::Has(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected key as string").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    std::string key = info[0].As<Napi::String>().Utf8Value();
    AVDictionaryEntry* entry = av_dict_get(dict_, key.c_str(), nullptr, 0);
    
    return Napi::Boolean::New(env, entry != nullptr);
}

Napi::Value Dictionary::Delete(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected key as string").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string key = info[0].As<Napi::String>().Utf8Value();
    
    // Set to null to delete the entry
    int ret = av_dict_set(&dict_, key.c_str(), nullptr, 0);
    ffmpeg::CheckFFmpegError(env, ret, "Failed to delete dictionary entry");

    return env.Undefined();
}

Napi::Value Dictionary::Clear(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (dict_) {
        av_dict_free(&dict_);
        dict_ = nullptr;
    }
    
    return env.Undefined();
}

Napi::Value Dictionary::Copy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    int flags = 0;
    if (info.Length() > 0 && info[0].IsNumber()) {
        flags = info[0].As<Napi::Number>().Int32Value();
    }

    Napi::Object newDict = constructor.New({});
    Dictionary* dict = Napi::ObjectWrap<Dictionary>::Unwrap(newDict);
    
    if (dict_) {
        int ret = av_dict_copy(&dict->dict_, dict_, flags);
        ffmpeg::CheckFFmpegError(env, ret, "Failed to copy dictionary");
    }

    return newDict;
}

Napi::Value Dictionary::ParseString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string to parse").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string str = info[0].As<Napi::String>().Utf8Value();
    
    std::string keyValSep = "=";
    if (info.Length() > 1 && info[1].IsString()) {
        keyValSep = info[1].As<Napi::String>().Utf8Value();
    }
    
    std::string pairsSep = " ";
    if (info.Length() > 2 && info[2].IsString()) {
        pairsSep = info[2].As<Napi::String>().Utf8Value();
    }
    
    int flags = 0;
    if (info.Length() > 3 && info[3].IsNumber()) {
        flags = info[3].As<Napi::Number>().Int32Value();
    }

    int ret = av_dict_parse_string(&dict_, str.c_str(), keyValSep.c_str(), pairsSep.c_str(), flags);
    ffmpeg::CheckFFmpegError(env, ret, "Failed to parse dictionary string");

    return env.Undefined();
}

Napi::Value Dictionary::ToString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    char keyValSep = '=';
    if (info.Length() > 0 && info[0].IsString()) {
        std::string sep = info[0].As<Napi::String>().Utf8Value();
        if (!sep.empty()) {
            keyValSep = sep[0];
        }
    }
    
    char pairsSep = ' ';
    if (info.Length() > 1 && info[1].IsString()) {
        std::string sep = info[1].As<Napi::String>().Utf8Value();
        if (!sep.empty()) {
            pairsSep = sep[0];
        }
    }

    char* buffer = nullptr;
    int ret = av_dict_get_string(dict_, &buffer, keyValSep, pairsSep);
    ffmpeg::CheckFFmpegError(env, ret, "Failed to convert dictionary to string");

    std::string result;
    if (buffer) {
        result = buffer;
        av_free(buffer);
    }

    return Napi::String::New(env, result);
}

Napi::Value Dictionary::GetCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int count = av_dict_count(dict_);
    return Napi::Number::New(env, count);
}