#ifndef FFMPEG_INPUT_FORMAT_H
#define FFMPEG_INPUT_FORMAT_H

#include <napi.h>

extern "C" {
#include <libavformat/avformat.h>
}

namespace ffmpeg {

// Forward declarations
class IOContext;
class InputFormatProbeBufferWorker;

class InputFormat : public Napi::ObjectWrap<InputFormat> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  InputFormat(const Napi::CallbackInfo& info);
  ~InputFormat() = default;
  
  // Native access
  const AVInputFormat* Get() const { return format_; }
  void Set(const AVInputFormat* fmt) { format_ = fmt; }

  // Friend classes
  friend class FormatContext;
  friend class InputFormatProbeBufferWorker;
  
  // Static members
  static Napi::FunctionReference constructor;

private:
  
  // Resources
  const AVInputFormat* format_ = nullptr; // NOT owned - these are static definitions
  
  // === Static Methods ===
  
  static Napi::Value FindInputFormat(const Napi::CallbackInfo& info);
  static Napi::Value Probe(const Napi::CallbackInfo& info);
  static Napi::Value ProbeBuffer(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  Napi::Value GetName(const Napi::CallbackInfo& info);
  Napi::Value GetLongName(const Napi::CallbackInfo& info);
  Napi::Value GetExtensions(const Napi::CallbackInfo& info);
  Napi::Value GetMimeType(const Napi::CallbackInfo& info);
  Napi::Value GetFlags(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_INPUT_FORMAT_H