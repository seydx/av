#ifndef OUTPUT_FORMAT_H
#define OUTPUT_FORMAT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
}

class OutputFormat : public Napi::ObjectWrap<OutputFormat> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    OutputFormat(const Napi::CallbackInfo& info);
    ~OutputFormat() = default;

    // Static methods
    static Napi::Value Find(const Napi::CallbackInfo& info);
    static Napi::Value Guess(const Napi::CallbackInfo& info);
    static Napi::Value GetAll(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetLongName(const Napi::CallbackInfo& info);
    Napi::Value GetFlags(const Napi::CallbackInfo& info);
    Napi::Value GetExtensions(const Napi::CallbackInfo& info);
    Napi::Value GetMimeType(const Napi::CallbackInfo& info);
    Napi::Value GetAudioCodec(const Napi::CallbackInfo& info);
    Napi::Value GetVideoCodec(const Napi::CallbackInfo& info);
    Napi::Value GetSubtitleCodec(const Napi::CallbackInfo& info);

    // Internal use
    void SetFormat(const AVOutputFormat* fmt) { format_ = fmt; }
    const AVOutputFormat* GetFormat() const { return format_; }

private:
    static Napi::FunctionReference constructor;
    const AVOutputFormat* format_;
};

#endif // OUTPUT_FORMAT_H