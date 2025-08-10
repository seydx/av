#ifndef FFMPEG_IO_CONTEXT_H
#define FFMPEG_IO_CONTEXT_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavformat/avformat.h>
#include <libavformat/avio.h>
}

namespace ffmpeg {

// Forward declaration for friend class
class OpenIOWorker;

class IOContext : public Napi::ObjectWrap<IOContext> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  IOContext(const Napi::CallbackInfo& info);
  ~IOContext();
  
  AVIOContext* Get() { return context_; }

 private:
  friend class OpenIOWorker;  // Allow OpenIOWorker to access private members
  static Napi::FunctionReference constructor;
  AVIOContext* context_;
  
  // Methods
  Napi::Value Open(const Napi::CallbackInfo& info);
  Napi::Value OpenAsync(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
  Napi::Value Flush(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetSize(const Napi::CallbackInfo& info);
  Napi::Value GetPos(const Napi::CallbackInfo& info);
  Napi::Value GetEof(const Napi::CallbackInfo& info);
  Napi::Value GetSeekable(const Napi::CallbackInfo& info);
  
  // Resource management
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
  
  // Static methods
  static Napi::Value StaticOpen(const Napi::CallbackInfo& info);
};

}  // namespace ffmpeg

#endif  // FFMPEG_IO_CONTEXT_H