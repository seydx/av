#ifndef FFMPEG_AUDIO_FIFO_H
#define FFMPEG_AUDIO_FIFO_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/audio_fifo.h>
}

namespace ffmpeg {

class AudioFifo : public Napi::ObjectWrap<AudioFifo> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  AudioFifo(const Napi::CallbackInfo& info);
  ~AudioFifo();
  
  // Native access
  AVAudioFifo* Get() { return fifo_; }

private:
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVAudioFifo* fifo_ = nullptr;
  
  // Methods
  
  // Lifecycle
  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  
  // Operations
  // Async I/O operations (implemented in audio_fifo_async.cc)
  Napi::Value WriteAsync(const Napi::CallbackInfo& info);
  Napi::Value ReadAsync(const Napi::CallbackInfo& info);
  Napi::Value PeekAsync(const Napi::CallbackInfo& info);
  
  // Sync operations
  Napi::Value Drain(const Napi::CallbackInfo& info);
  Napi::Value Reset(const Napi::CallbackInfo& info);
  Napi::Value Realloc(const Napi::CallbackInfo& info);
  
  // Properties
  Napi::Value GetSize(const Napi::CallbackInfo& info);
  Napi::Value GetSpace(const Napi::CallbackInfo& info);
  
  // Utility
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_AUDIO_FIFO_H