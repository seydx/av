#ifndef FFMPEG_CODEC_PARAMETERS_H
#define FFMPEG_CODEC_PARAMETERS_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

class CodecParameters : public Napi::ObjectWrap<CodecParameters> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  CodecParameters(const Napi::CallbackInfo& info);
  ~CodecParameters();
  
  // Native access
  AVCodecParameters* Get() { return params_; }
  const AVCodecParameters* Get() const { return params_; }
  
  void SetParameters(AVCodecParameters* params, bool owned) {
    // Free old parameters if exists AND we owned them
    if (params_ && !is_freed_ && is_owned_) {
      avcodec_parameters_free(&params_);
    }
    params_ = params;
    is_owned_ = owned;
    is_freed_ = false;
  }
  

private:
  // Friend classes
  friend class Stream;
  friend class BitStreamFilterContext;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVCodecParameters* params_ = nullptr;  // Manual RAII
  bool is_freed_ = false;
  bool is_owned_ = true;  // Whether we own the params and should free them
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Copy(const Napi::CallbackInfo& info);
  Napi::Value FromContext(const Napi::CallbackInfo& info);
  Napi::Value ToContext(const Napi::CallbackInfo& info);
  Napi::Value ToJSON(const Napi::CallbackInfo& info);
  
  // === Properties ===
  Napi::Value GetCodecType(const Napi::CallbackInfo& info);
  void SetCodecType(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetCodecId(const Napi::CallbackInfo& info);
  void SetCodecId(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetCodecTag(const Napi::CallbackInfo& info);
  void SetCodecTag(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetExtradata(const Napi::CallbackInfo& info);
  void SetExtradata(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetExtradataSize(const Napi::CallbackInfo& info);
  
  Napi::Value GetFormat(const Napi::CallbackInfo& info);
  void SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetBitRate(const Napi::CallbackInfo& info);
  void SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetProfile(const Napi::CallbackInfo& info);
  void SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetLevel(const Napi::CallbackInfo& info);
  void SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetWidth(const Napi::CallbackInfo& info);
  void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetHeight(const Napi::CallbackInfo& info);
  void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
  void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetFrameRate(const Napi::CallbackInfo& info);
  void SetFrameRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorRange(const Napi::CallbackInfo& info);
  void SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorPrimaries(const Napi::CallbackInfo& info);
  void SetColorPrimaries(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorTrc(const Napi::CallbackInfo& info);
  void SetColorTrc(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorSpace(const Napi::CallbackInfo& info);
  void SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetChromaLocation(const Napi::CallbackInfo& info);
  void SetChromaLocation(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetChannelLayout(const Napi::CallbackInfo& info);
  void SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetChannels(const Napi::CallbackInfo& info);
  void SetChannels(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetSampleRate(const Napi::CallbackInfo& info);
  void SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Utility
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_CODEC_PARAMETERS_H