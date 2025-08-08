#ifndef INPUT_FORMAT_H
#define INPUT_FORMAT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
}

class InputFormat : public Napi::ObjectWrap<InputFormat> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    InputFormat(const Napi::CallbackInfo& info);
    ~InputFormat() = default;

    // Static methods
    static Napi::Value Find(const Napi::CallbackInfo& info);
    static Napi::Value GetAll(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetLongName(const Napi::CallbackInfo& info);
    Napi::Value GetFlags(const Napi::CallbackInfo& info);
    Napi::Value GetExtensions(const Napi::CallbackInfo& info);
    Napi::Value GetMimeType(const Napi::CallbackInfo& info);

    // Internal use
    void SetFormat(const AVInputFormat* fmt) { format_ = fmt; }
    const AVInputFormat* GetFormat() const { return format_; }

private:
    static Napi::FunctionReference constructor;
    const AVInputFormat* format_;
};

#endif // INPUT_FORMAT_H