#ifndef FFMPEG_IO_CONTEXT_H
#define FFMPEG_IO_CONTEXT_H

#include <napi.h>
#include <memory>
#include <atomic>
#include "common.h"

extern "C" {
#include <libavformat/avio.h>
#include <libavutil/mem.h>
}

namespace ffmpeg {

class IOContext : public Napi::ObjectWrap<IOContext> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  IOContext(const Napi::CallbackInfo& info);
  ~IOContext();
  
  // Native access
  AVIOContext* Get() { return ctx_; }
  
  // Static factory
  Napi::Value FreeContext(const Napi::CallbackInfo& info);
  Napi::Value ClosepAsync(const Napi::CallbackInfo& info);
  Napi::Value ReadAsync(const Napi::CallbackInfo& info);
  Napi::Value WriteAsync(const Napi::CallbackInfo& info);
  Napi::Value SeekAsync(const Napi::CallbackInfo& info);
  Napi::Value SizeAsync(const Napi::CallbackInfo& info);
  Napi::Value FlushAsync(const Napi::CallbackInfo& info);
  Napi::Value SkipAsync(const Napi::CallbackInfo& info);
  Napi::Value Tell(const Napi::CallbackInfo& info);
  
  Napi::Value GetEof(const Napi::CallbackInfo& info);
  Napi::Value GetError(const Napi::CallbackInfo& info);
  Napi::Value GetSeekable(const Napi::CallbackInfo& info);
  Napi::Value GetMaxPacketSize(const Napi::CallbackInfo& info);
  void SetMaxPacketSize(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetDirect(const Napi::CallbackInfo& info);
  void SetDirect(const Napi::CallbackInfo& info, const Napi::Value& value);
  Napi::Value GetPos(const Napi::CallbackInfo& info);
  Napi::Value GetBufferSize(const Napi::CallbackInfo& info);
  Napi::Value GetWriteFlag(const Napi::CallbackInfo& info);

private:
  // Friend classes
  friend class FormatContext;
  friend class IOOpen2Worker;
  friend class IOClosepWorker;
  friend class IOReadWorker;
  friend class IOWriteWorker;
  friend class IOSeekWorker;
  friend class IOSizeWorker;
  friend class IOFlushWorker;
  friend class IOSkipWorker;
  
  // Static members
  static Napi::FunctionReference constructor;
  
  // Resources
  AVIOContext* ctx_ = nullptr;  // The AVIOContext we manage
  
  // Custom I/O callback support
  struct CallbackData {
    IOContext* io_context;
    Napi::ThreadSafeFunction read_callback;
    Napi::ThreadSafeFunction write_callback;
    Napi::ThreadSafeFunction seek_callback;
    bool has_read_callback = false;
    bool has_write_callback = false;
    bool has_seek_callback = false;
    void* opaque_data;  // User data passed to callbacks
    std::atomic<bool> active{false};
  };
  
  std::unique_ptr<CallbackData> callback_data_;
  uint8_t* buffer_ = nullptr;  // Buffer for custom I/O
  
  // Helper to clean up callbacks
  void CleanupCallbacks();
  
  // Static callback functions for FFmpeg
  static int ReadPacket(void* opaque, uint8_t* buf, int buf_size);
  static int WritePacket(void* opaque, const uint8_t* buf, int buf_size);
  static int64_t Seek(void* opaque, int64_t offset, int whence);
  
  // === Methods ===
  
  // Lifecycle
  Napi::Value AllocContext(const Napi::CallbackInfo& info);
  Napi::Value AllocContextWithCallbacks(const Napi::CallbackInfo& info);
  
  // Operations
  Napi::Value Open2Async(const Napi::CallbackInfo& info);
  
  // === Properties ===
  
  // === Utility ===
  
  Napi::Value AsyncDispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_IO_CONTEXT_H