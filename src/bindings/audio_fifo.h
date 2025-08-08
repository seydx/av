#ifndef BINDINGS_AUDIO_FIFO_H
#define BINDINGS_AUDIO_FIFO_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/audio_fifo.h>
}

namespace ffmpeg {

struct AudioFifoDeleter {
    static void Free(AVAudioFifo** fifo) {
        if (fifo && *fifo) {
            av_audio_fifo_free(*fifo);
            *fifo = nullptr;
        }
    }
};

using AudioFifoResource = FFmpegResource<AVAudioFifo, AudioFifoDeleter>;

class AudioFifo : public Napi::ObjectWrap<AudioFifo> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    
    // Static factory methods
    static Napi::Value Alloc(const Napi::CallbackInfo& info);
    
    AudioFifo(const Napi::CallbackInfo& info);
    ~AudioFifo() override = default;
    
    // Instance methods
    Napi::Value Realloc(const Napi::CallbackInfo& info);
    Napi::Value GetSize(const Napi::CallbackInfo& info);
    Napi::Value GetSpace(const Napi::CallbackInfo& info);
    Napi::Value Write(const Napi::CallbackInfo& info);
    Napi::Value Read(const Napi::CallbackInfo& info);
    void Dispose(const Napi::CallbackInfo& info);
    
    AVAudioFifo* GetFifo() const { 
        return resource.Get(); 
    }
    
private:
    AudioFifoResource resource;
};

} // namespace ffmpeg

#endif // BINDINGS_AUDIO_FIFO_H