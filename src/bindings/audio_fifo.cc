#include "audio_fifo.h"
#include "frame.h"
#include "common.h"
#include <stdexcept>

namespace ffmpeg {

Napi::Object AudioFifo::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "AudioFifo", {
        StaticMethod("alloc", &AudioFifo::Alloc),
        InstanceMethod("realloc", &AudioFifo::Realloc),
        InstanceMethod("size", &AudioFifo::GetSize),
        InstanceMethod("space", &AudioFifo::GetSpace),
        InstanceMethod("write", &AudioFifo::Write),
        InstanceMethod("read", &AudioFifo::Read),
        InstanceMethod("free", &AudioFifo::Free),
        InstanceMethod(Napi::Symbol::WellKnown(env, "dispose"), &AudioFifo::Dispose),
    });
    
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);
    
    exports.Set("AudioFifo", func);
    return exports;
}

Napi::Value AudioFifo::Alloc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: sampleFormat, channels, nbSamples")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "All arguments must be numbers")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    AVSampleFormat sampleFormat = static_cast<AVSampleFormat>(info[0].As<Napi::Number>().Int32Value());
    int channels = info[1].As<Napi::Number>().Int32Value();
    int nbSamples = info[2].As<Napi::Number>().Int32Value();
    
    AVAudioFifo* fifo = av_audio_fifo_alloc(sampleFormat, channels, nbSamples);
    if (!fifo) {
        Napi::Error::New(env, "Failed to allocate audio FIFO")
            .ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Create instance with the allocated FIFO
    auto* constructor = env.GetInstanceData<Napi::FunctionReference>();
    Napi::Object instance = constructor->New({});
    
    AudioFifo* audioFifo = Napi::ObjectWrap<AudioFifo>::Unwrap(instance);
    audioFifo->resource.Reset(fifo);
    
    return instance;
}

AudioFifo::AudioFifo(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<AudioFifo>(info), resource(nullptr) {
    Napi::Env env = info.Env();
    
    // Constructor now handles allocation directly
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: sampleFormat, channels, nbSamples")
            .ThrowAsJavaScriptException();
        return;
    }
    
    if (!info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "All arguments must be numbers")
            .ThrowAsJavaScriptException();
        return;
    }
    
    AVSampleFormat sampleFormat = static_cast<AVSampleFormat>(info[0].As<Napi::Number>().Int32Value());
    int channels = info[1].As<Napi::Number>().Int32Value();
    int nbSamples = info[2].As<Napi::Number>().Int32Value();
    
    AVAudioFifo* fifo = av_audio_fifo_alloc(sampleFormat, channels, nbSamples);
    if (!fifo) {
        Napi::Error::New(env, "Failed to allocate audio FIFO")
            .ThrowAsJavaScriptException();
        return;
    }
    
    resource.Reset(fifo);
}

Napi::Value AudioFifo::Realloc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!resource.Get()) {
        Napi::Error::New(env, "AudioFifo is not initialized")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected nbSamples as number")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    int nbSamples = info[0].As<Napi::Number>().Int32Value();
    int ret = av_audio_fifo_realloc(resource.Get(), nbSamples);
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, sizeof(errbuf));
        Napi::Error::New(env, std::string("Failed to realloc audio FIFO: ") + errbuf)
            .ThrowAsJavaScriptException();
    }
    
    return env.Undefined();
}

Napi::Value AudioFifo::GetSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!resource.Get()) {
        return Napi::Number::New(env, 0);
    }
    
    return Napi::Number::New(env, av_audio_fifo_size(resource.Get()));
}

Napi::Value AudioFifo::GetSpace(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!resource.Get()) {
        return Napi::Number::New(env, 0);
    }
    
    return Napi::Number::New(env, av_audio_fifo_space(resource.Get()));
}

Napi::Value AudioFifo::Write(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!resource.Get()) {
        Napi::Error::New(env, "AudioFifo is not initialized")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Frame object")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Frame* frame = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
    if (!frame) return env.Undefined();
    if (!frame->GetFrame()) {
        Napi::Error::New(env, "Invalid Frame object")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    AVFrame* avFrame = frame->GetFrame();
    void** data = reinterpret_cast<void**>(avFrame->data);
    int ret = av_audio_fifo_write(resource.Get(), data, avFrame->nb_samples);
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, sizeof(errbuf));
        Napi::Error::New(env, std::string("Failed to write to audio FIFO: ") + errbuf)
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    return Napi::Number::New(env, ret);
}

Napi::Value AudioFifo::Read(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!resource.Get()) {
        Napi::Error::New(env, "AudioFifo is not initialized")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Frame object")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Frame* frame = ffmpeg::UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
    if (!frame) return env.Undefined();
    if (!frame->GetFrame()) {
        Napi::Error::New(env, "Invalid Frame object")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    AVFrame* avFrame = frame->GetFrame();
    void** data = reinterpret_cast<void**>(avFrame->data);
    int ret = av_audio_fifo_read(resource.Get(), data, avFrame->nb_samples);
    
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, sizeof(errbuf));
        Napi::Error::New(env, std::string("Failed to read from audio FIFO: ") + errbuf)
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    return Napi::Number::New(env, ret);
}

Napi::Value AudioFifo::Free(const Napi::CallbackInfo& info) {
    resource.Reset();
    return info.Env().Undefined();
}

Napi::Value AudioFifo::Dispose(const Napi::CallbackInfo& info) {
    return Free(info);
}

} // namespace ffmpeg