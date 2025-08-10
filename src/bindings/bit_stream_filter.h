#ifndef BINDINGS_BIT_STREAM_FILTER_H
#define BINDINGS_BIT_STREAM_FILTER_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/bsf.h>
}

class BitStreamFilter : public Napi::ObjectWrap<BitStreamFilter> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    BitStreamFilter(const Napi::CallbackInfo& info);
    ~BitStreamFilter() = default;

    // Static methods
    static Napi::Value GetByName(const Napi::CallbackInfo& info);
    static Napi::Value Iterate(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetCodecIds(const Napi::CallbackInfo& info);

    const AVBitStreamFilter* GetNative() const { return bsf_; }

private:
    static Napi::FunctionReference constructor;
    const AVBitStreamFilter* bsf_;
};

class BitStreamFilterContext : public Napi::ObjectWrap<BitStreamFilterContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    BitStreamFilterContext(const Napi::CallbackInfo& info);
    ~BitStreamFilterContext();

    // Instance methods
    Napi::Value Init(const Napi::CallbackInfo& info);
    Napi::Value SendPacket(const Napi::CallbackInfo& info);
    Napi::Value ReceivePacket(const Napi::CallbackInfo& info);
    Napi::Value SendPacketAsync(const Napi::CallbackInfo& info);
    Napi::Value ReceivePacketAsync(const Napi::CallbackInfo& info);
    Napi::Value Flush(const Napi::CallbackInfo& info);
    Napi::Value Free(const Napi::CallbackInfo& info);
    Napi::Value Dispose(const Napi::CallbackInfo& info);

    // Properties
    Napi::Value GetFilter(const Napi::CallbackInfo& info);
    Napi::Value GetTimeBaseIn(const Napi::CallbackInfo& info);
    void SetTimeBaseIn(const Napi::CallbackInfo& info, const Napi::Value& value);
    Napi::Value GetTimeBaseOut(const Napi::CallbackInfo& info);
    void SetTimeBaseOut(const Napi::CallbackInfo& info, const Napi::Value& value);
    Napi::Value GetCodecParameters(const Napi::CallbackInfo& info);

    AVBSFContext* GetNative() { return ctx_; }

private:
    static Napi::FunctionReference constructor;
    AVBSFContext* ctx_;
    bool initialized_;
};

#endif // BINDINGS_BIT_STREAM_FILTER_H