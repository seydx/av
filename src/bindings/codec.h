#ifndef CODEC_H
#define CODEC_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/avcodec.h>
}

class Codec : public Napi::ObjectWrap<Codec> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::FunctionReference constructor;
    
    Codec(const Napi::CallbackInfo& info);
    ~Codec();

    // Properties
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetLongName(const Napi::CallbackInfo& info);
    Napi::Value GetId(const Napi::CallbackInfo& info);
    Napi::Value GetType(const Napi::CallbackInfo& info);
    Napi::Value GetCapabilities(const Napi::CallbackInfo& info);
    
    // Methods
    Napi::Value IsDecoder(const Napi::CallbackInfo& info);
    Napi::Value IsEncoder(const Napi::CallbackInfo& info);
    Napi::Value GetPixelFormats(const Napi::CallbackInfo& info);
    Napi::Value GetSampleFormats(const Napi::CallbackInfo& info);
    Napi::Value GetSampleRates(const Napi::CallbackInfo& info);
    Napi::Value GetChannelLayouts(const Napi::CallbackInfo& info);
    Napi::Value GetProfiles(const Napi::CallbackInfo& info);
    Napi::Value GetHardwareConfigs(const Napi::CallbackInfo& info);
    
    // Static methods
    static Napi::Value FindDecoder(const Napi::CallbackInfo& info);
    static Napi::Value FindDecoderByName(const Napi::CallbackInfo& info);
    static Napi::Value FindEncoder(const Napi::CallbackInfo& info);
    static Napi::Value FindEncoderByName(const Napi::CallbackInfo& info);
    static Napi::Value GetAllCodecs(const Napi::CallbackInfo& info);
    
    // Get native pointer
    const AVCodec* Get() const { return codec_; }
    
    // Set codec (for internal use)
    void SetCodec(const AVCodec* codec) { codec_ = codec; }
    
    // Static factory method
    static Napi::Object FromNative(Napi::Env env, const AVCodec* codec);

private:
    const AVCodec* codec_;  // Not owned, points to static codec
};

#endif // CODEC_H