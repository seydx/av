#ifndef CODEC_PARAMETERS_H
#define CODEC_PARAMETERS_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/avcodec.h>
}

class CodecParameters : public Napi::ObjectWrap<CodecParameters> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::FunctionReference constructor;
    
    CodecParameters(const Napi::CallbackInfo& info);
    ~CodecParameters();

    // Properties
    Napi::Value GetCodecType(const Napi::CallbackInfo& info);
    void SetCodecType(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetCodecId(const Napi::CallbackInfo& info);
    void SetCodecId(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetBitRate(const Napi::CallbackInfo& info);
    void SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetHeight(const Napi::CallbackInfo& info);
    void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetFormat(const Napi::CallbackInfo& info);
    void SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetSampleRate(const Napi::CallbackInfo& info);
    void SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetChannelLayout(const Napi::CallbackInfo& info);
    void SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetExtraData(const Napi::CallbackInfo& info);
    void SetExtraData(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetProfile(const Napi::CallbackInfo& info);
    void SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetLevel(const Napi::CallbackInfo& info);
    void SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetFrameSize(const Napi::CallbackInfo& info);
    void SetFrameSize(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
    void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetColorRange(const Napi::CallbackInfo& info);
    void SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetColorSpace(const Napi::CallbackInfo& info);
    void SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetColorPrimaries(const Napi::CallbackInfo& info);
    void SetColorPrimaries(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetColorTransferCharacteristic(const Napi::CallbackInfo& info);
    void SetColorTransferCharacteristic(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetChromaLocation(const Napi::CallbackInfo& info);
    void SetChromaLocation(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    Napi::Value GetCodecTag(const Napi::CallbackInfo& info);
    void SetCodecTag(const Napi::CallbackInfo& info, const Napi::Value& value);
    
    // Methods
    Napi::Value Copy(const Napi::CallbackInfo& info);
    Napi::Value FromCodecContext(const Napi::CallbackInfo& info);
    Napi::Value ToCodecContext(const Napi::CallbackInfo& info);
    void Dispose(const Napi::CallbackInfo& info);
    
    // Get native pointer
    AVCodecParameters* Get() const { return params_.Get(); }
    
    // Static factory method
    static Napi::Object FromNative(Napi::Env env, AVCodecParameters* params);

private:
    struct CodecParametersDeleter {
        static void Free(AVCodecParameters** p) {
            if (p && *p) {
                avcodec_parameters_free(p);
            }
        }
    };
    
    using CodecParametersResource = ffmpeg::FFmpegResource<AVCodecParameters, CodecParametersDeleter>;
    CodecParametersResource params_;
};

#endif // CODEC_PARAMETERS_H