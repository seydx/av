#pragma once

#include <napi.h>
#include "common.h"

namespace ffmpeg {

class Frame : public Napi::ObjectWrap<Frame> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  
  Frame(const Napi::CallbackInfo& info);
  ~Frame();
  
  // Properties - Common
  Napi::Value GetPts(const Napi::CallbackInfo& info);
  void SetPts(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetPktDts(const Napi::CallbackInfo& info);
  void SetPktDts(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetBestEffortTimestamp(const Napi::CallbackInfo& info);
  
  Napi::Value GetPktPos(const Napi::CallbackInfo& info);
  void SetPktPos(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetPktDuration(const Napi::CallbackInfo& info);
  void SetPktDuration(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetKeyFrame(const Napi::CallbackInfo& info);
  void SetKeyFrame(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetPictType(const Napi::CallbackInfo& info);
  void SetPictType(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetQuality(const Napi::CallbackInfo& info);
  void SetQuality(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Properties - Video
  Napi::Value GetWidth(const Napi::CallbackInfo& info);
  void SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetHeight(const Napi::CallbackInfo& info);
  void SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetFormat(const Napi::CallbackInfo& info);
  void SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetSampleAspectRatio(const Napi::CallbackInfo& info);
  void SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorRange(const Napi::CallbackInfo& info);
  void SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetColorSpace(const Napi::CallbackInfo& info);
  void SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Properties - Audio
  Napi::Value GetNbSamples(const Napi::CallbackInfo& info);
  void SetNbSamples(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetSampleRate(const Napi::CallbackInfo& info);
  void SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetChannelLayout(const Napi::CallbackInfo& info);
  void SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Data access
  Napi::Value GetData(const Napi::CallbackInfo& info);
  Napi::Value GetLinesize(const Napi::CallbackInfo& info);
  
  // Methods
  Napi::Value AllocBuffer(const Napi::CallbackInfo& info);
  Napi::Value Clone(const Napi::CallbackInfo& info);
  Napi::Value MakeWritable(const Napi::CallbackInfo& info);
  Napi::Value GetBuffer(const Napi::CallbackInfo& info);
  Napi::Value Unref(const Napi::CallbackInfo& info);  // Clear data but keep structure
  
  // Additional data access methods
  Napi::Value IsWritable(const Napi::CallbackInfo& info);
  Napi::Value GetBytes(const Napi::CallbackInfo& info);
  Napi::Value SetBytes(const Napi::CallbackInfo& info);
  Napi::Value GetDataSize(const Napi::CallbackInfo& info);
  
  // Hardware acceleration
  Napi::Value TransferDataTo(const Napi::CallbackInfo& info);
  Napi::Value TransferDataFrom(const Napi::CallbackInfo& info);
  Napi::Value GetHwFramesContext(const Napi::CallbackInfo& info);
  void SetHwFramesContext(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Internal
  AVFrame* GetFrame() { return frame_.Get(); }
  void SetFrame(AVFrame* frame);
  
 private:
  FrameResource frame_;
  
  static Napi::FunctionReference constructor;
};

}  // namespace ffmpeg