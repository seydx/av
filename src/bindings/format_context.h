#ifndef FFMPEG_FORMAT_CONTEXT_H
#define FFMPEG_FORMAT_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

class FormatContext : public Napi::ObjectWrap<FormatContext> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  FormatContext(const Napi::CallbackInfo& info);
  
  AVFormatContext* Get() { return context_.Get(); }
  void SetContext(AVFormatContext* ctx);

 private:
  static Napi::FunctionReference constructor;
  FormatContextResource context_;
  
  // Lifecycle
  Napi::Value OpenInput(const Napi::CallbackInfo& info);
  Napi::Value CloseInput(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Stream Discovery
  Napi::Value FindStreamInfo(const Napi::CallbackInfo& info);
  Napi::Value FindBestStream(const Napi::CallbackInfo& info);
  
  // Reading
  Napi::Value ReadFrame(const Napi::CallbackInfo& info);
  Napi::Value SeekFrame(const Napi::CallbackInfo& info);
  Napi::Value SeekFile(const Napi::CallbackInfo& info);
  Napi::Value Flush(const Napi::CallbackInfo& info);
  
  // Writing
  Napi::Value WriteHeader(const Napi::CallbackInfo& info);
  Napi::Value WriteFrame(const Napi::CallbackInfo& info);
  Napi::Value WriteInterleavedFrame(const Napi::CallbackInfo& info);
  Napi::Value WriteTrailer(const Napi::CallbackInfo& info);
  
  // Stream Management
  Napi::Value GetStreams(const Napi::CallbackInfo& info);
  Napi::Value GetNbStreams(const Napi::CallbackInfo& info);
  Napi::Value NewStream(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetUrl(const Napi::CallbackInfo& info);
  Napi::Value GetDuration(const Napi::CallbackInfo& info);
  Napi::Value GetStartTime(const Napi::CallbackInfo& info);
  Napi::Value GetBitRate(const Napi::CallbackInfo& info);
  Napi::Value GetMetadata(const Napi::CallbackInfo& info);
  void SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  void SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetMaxAnalyzeDuration(const Napi::CallbackInfo& info);
  void SetMaxAnalyzeDuration(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetProbesize(const Napi::CallbackInfo& info);
  void SetProbesize(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Format Info
  Napi::Value GetInputFormat(const Napi::CallbackInfo& info);
  Napi::Value GetOutputFormat(const Napi::CallbackInfo& info);
  
  // Utility
  Napi::Value Dump(const Napi::CallbackInfo& info);
  
  // Static factory methods
  static Napi::Value AllocFormatContext(const Napi::CallbackInfo& info);
  static Napi::Value AllocOutputFormatContext(const Napi::CallbackInfo& info);
};

}  // namespace ffmpeg

#endif  // FFMPEG_FORMAT_CONTEXT_H