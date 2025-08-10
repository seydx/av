#ifndef FFMPEG_DICTIONARY_H
#define FFMPEG_DICTIONARY_H

#include "common.h"
extern "C" {
#include <libavutil/dict.h>
}

class Dictionary : public Napi::ObjectWrap<Dictionary> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Dictionary(const Napi::CallbackInfo& info);
    ~Dictionary();

    // Methods
    Napi::Value Set(const Napi::CallbackInfo& info);
    Napi::Value Get(const Napi::CallbackInfo& info);
    Napi::Value GetAll(const Napi::CallbackInfo& info);
    Napi::Value Has(const Napi::CallbackInfo& info);
    Napi::Value Delete(const Napi::CallbackInfo& info);
    Napi::Value Clear(const Napi::CallbackInfo& info);
    Napi::Value Copy(const Napi::CallbackInfo& info);
    Napi::Value ParseString(const Napi::CallbackInfo& info);
    Napi::Value ToString(const Napi::CallbackInfo& info);
    
    // Getters
    Napi::Value GetCount(const Napi::CallbackInfo& info);
    
    // Resource management
    Napi::Value Free(const Napi::CallbackInfo& info);
    Napi::Value Dispose(const Napi::CallbackInfo& info);

    AVDictionary* GetDict() { return dict_; }
    void SetDict(AVDictionary* dict);

private:
    static Napi::FunctionReference constructor;
    AVDictionary* dict_;
};

#endif // FFMPEG_DICTIONARY_H