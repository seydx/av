#ifndef FFMPEG_FORMAT_CONTEXT_H
#define FFMPEG_FORMAT_CONTEXT_H

#include <napi.h>
#include <atomic>
#include <mutex>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

class FormatContext : public Napi::ObjectWrap<FormatContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  FormatContext(const Napi::CallbackInfo& info);
  ~FormatContext();
  
  // Native access
  AVFormatContext* Get() { return ctx_; }
  const AVFormatContext* Get() const { return ctx_; }
  bool IsOutput() const { return is_output_; }

private:
  friend class AVOption; // For option unwrapping  // Friend classes
  friend class FCOpenInputWorker;
  friend class FCFindStreamInfoWorker;
  friend class FCReadFrameWorker;
  friend class FCSeekFrameWorker;
  friend class FCSeekFileWorker;
  friend class FCWriteHeaderWorker;
  friend class FCWriteFrameWorker;
  friend class FCInterleavedWriteFrameWorker;
  friend class FCWriteTrailerWorker;
  friend class FCOpenOutputWorker;
  friend class FCCloseOutputWorker;
  friend class FCCloseInputWorker;

  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVFormatContext* ctx_ = nullptr;  // The format context we manage
  bool is_output_ = false;          // Whether this is an output context
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value AllocContext(const Napi::CallbackInfo& info);
  Napi::Value AllocOutputContext2(const Napi::CallbackInfo& info);
  Napi::Value FreeContext(const Napi::CallbackInfo& info);
  Napi::Value CloseInput(const Napi::CallbackInfo& info);
  Napi::Value OpenOutput(const Napi::CallbackInfo& info);
  Napi::Value CloseOutput(const Napi::CallbackInfo& info);
  
  // Input Operations
  Napi::Value OpenInputAsync(const Napi::CallbackInfo& info);
  Napi::Value FindStreamInfoAsync(const Napi::CallbackInfo& info);
  Napi::Value ReadFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value SeekFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value SeekFileAsync(const Napi::CallbackInfo& info);
  
  // Output Operations
  Napi::Value WriteHeaderAsync(const Napi::CallbackInfo& info);
  Napi::Value WriteFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value InterleavedWriteFrameAsync(const Napi::CallbackInfo& info);
  Napi::Value WriteTrailerAsync(const Napi::CallbackInfo& info);
  Napi::Value Flush(const Napi::CallbackInfo& info);
  Napi::Value NewStream(const Napi::CallbackInfo& info);
  Napi::Value GetStreams(const Napi::CallbackInfo& info);
  Napi::Value GetNbStreams(const Napi::CallbackInfo& info);
  
  // Utility Methods
  Napi::Value DumpFormat(const Napi::CallbackInfo& info);
  Napi::Value FindBestStream(const Napi::CallbackInfo& info);
  
  // === Properties ===
  Napi::Value GetUrl(const Napi::CallbackInfo& info);
  void SetUrl(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetStartTime(const Napi::CallbackInfo& info);
  Napi::Value GetDuration(const Napi::CallbackInfo& info);
  Napi::Value GetBitRate(const Napi::CallbackInfo& info);
  
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
  void SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetProbesize(const Napi::CallbackInfo& info);
  void SetProbesize(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetMaxAnalyzeDuration(const Napi::CallbackInfo& info);
  void SetMaxAnalyzeDuration(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetMetadata(const Napi::CallbackInfo& info);
  void SetMetadata(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetIformat(const Napi::CallbackInfo& info);
  Napi::Value GetOformat(const Napi::CallbackInfo& info);
  void SetOformat(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetStrictStdCompliance(const Napi::CallbackInfo& info);
  void SetStrictStdCompliance(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  Napi::Value GetMaxStreams(const Napi::CallbackInfo& info);
  void SetMaxStreams(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  void SetPb(const Napi::CallbackInfo& info, const Napi::Value& value);
  
  // Utility
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_FORMAT_CONTEXT_H