#include "audio_fifo.h"
#include <napi.h>

extern "C" {
#include <libavutil/audio_fifo.h>
#include <libavutil/mem.h>
}

namespace ffmpeg {

class AudioFifoWriteWorker : public Napi::AsyncWorker {
public:
  AudioFifoWriteWorker(Napi::Env env, AVAudioFifo* fifo, void** data, 
                       int nb_channels, int nb_samples)
    : AsyncWorker(env),
      fifo_(fifo),
      nb_samples_(nb_samples),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {
    // Copy data pointers
    data_ = static_cast<void**>(av_malloc(nb_channels * sizeof(void*)));
    for (int i = 0; i < nb_channels; i++) {
      data_[i] = data[i];
    }
  }
  
  ~AudioFifoWriteWorker() {
    if (data_) {
      av_free(data_);
    }
  }
  
  void Execute() override {
    result_ = av_audio_fifo_write(fifo_, data_, nb_samples_);
  }
  
  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }
  
  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }
  
  Napi::Promise GetPromise() { return deferred_.Promise(); }
  
private:
  AVAudioFifo* fifo_;
  void** data_;
  int nb_samples_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

class AudioFifoReadWorker : public Napi::AsyncWorker {
public:
  AudioFifoReadWorker(Napi::Env env, AVAudioFifo* fifo, void** data,
                      int nb_channels, int nb_samples)
    : AsyncWorker(env),
      fifo_(fifo),
      nb_samples_(nb_samples),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {
    // Copy data pointers
    data_ = static_cast<void**>(av_malloc(nb_channels * sizeof(void*)));
    for (int i = 0; i < nb_channels; i++) {
      data_[i] = data[i];
    }
  }
  
  ~AudioFifoReadWorker() {
    if (data_) {
      av_free(data_);
    }
  }
  
  void Execute() override {
    result_ = av_audio_fifo_read(fifo_, data_, nb_samples_);
  }
  
  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }
  
  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }
  
  Napi::Promise GetPromise() { return deferred_.Promise(); }
  
private:
  AVAudioFifo* fifo_;
  void** data_;
  int nb_samples_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

class AudioFifoPeekWorker : public Napi::AsyncWorker {
public:
  AudioFifoPeekWorker(Napi::Env env, AVAudioFifo* fifo, void** data,
                      int nb_channels, int nb_samples)
    : AsyncWorker(env),
      fifo_(fifo),
      nb_samples_(nb_samples),
      result_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {
    // Copy data pointers
    data_ = static_cast<void**>(av_malloc(nb_channels * sizeof(void*)));
    for (int i = 0; i < nb_channels; i++) {
      data_[i] = data[i];
    }
  }
  
  ~AudioFifoPeekWorker() {
    if (data_) {
      av_free(data_);
    }
  }
  
  void Execute() override {
    result_ = av_audio_fifo_peek(fifo_, data_, nb_samples_);
  }
  
  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), result_));
  }
  
  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }
  
  Napi::Promise GetPromise() { return deferred_.Promise(); }
  
private:
  AVAudioFifo* fifo_;
  void** data_;
  int nb_samples_;
  int result_;
  Napi::Promise::Deferred deferred_;
};

Napi::Value AudioFifo::WriteAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!fifo_) {
    Napi::Error::New(env, "AudioFifo not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (data, nb_samples)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int nb_samples = info[1].As<Napi::Number>().Int32Value();
  
  // Handle array of buffers (one per channel for planar formats)
  if (info[0].IsArray()) {
    Napi::Array dataArray = info[0].As<Napi::Array>();
    
    void** data = static_cast<void**>(av_malloc(dataArray.Length() * sizeof(void*)));
    if (!data) {
      Napi::Error::New(env, "Out of memory").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    for (uint32_t i = 0; i < dataArray.Length(); i++) {
      if (dataArray.Get(i).IsBuffer()) {
        Napi::Buffer<uint8_t> buf = dataArray.Get(i).As<Napi::Buffer<uint8_t>>();
        data[i] = buf.Data();
      } else {
        data[i] = nullptr;
      }
    }
    
    auto* worker = new AudioFifoWriteWorker(env, fifo_, data, dataArray.Length(), nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    av_free(data);
    return promise;
  }
  // Handle single buffer (interleaved format)
  else if (info[0].IsBuffer()) {
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    void* data[1] = { buffer.Data() };
    
    auto* worker = new AudioFifoWriteWorker(env, fifo_, data, 1, nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    return promise;
  }
  
  Napi::TypeError::New(env, "Expected Buffer or Array of Buffers").ThrowAsJavaScriptException();
  return env.Undefined();
}

Napi::Value AudioFifo::ReadAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!fifo_) {
    Napi::Error::New(env, "AudioFifo not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (data, nb_samples)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int nb_samples = info[1].As<Napi::Number>().Int32Value();
  
  // Handle array of buffers (one per channel for planar formats)
  if (info[0].IsArray()) {
    Napi::Array dataArray = info[0].As<Napi::Array>();
    
    void** data = static_cast<void**>(av_malloc(dataArray.Length() * sizeof(void*)));
    if (!data) {
      Napi::Error::New(env, "Out of memory").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    for (uint32_t i = 0; i < dataArray.Length(); i++) {
      if (dataArray.Get(i).IsBuffer()) {
        Napi::Buffer<uint8_t> buf = dataArray.Get(i).As<Napi::Buffer<uint8_t>>();
        data[i] = buf.Data();
      } else {
        data[i] = nullptr;
      }
    }
    
    auto* worker = new AudioFifoReadWorker(env, fifo_, data, dataArray.Length(), nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    av_free(data);
    return promise;
  }
  // Handle single buffer (interleaved format)
  else if (info[0].IsBuffer()) {
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    void* data[1] = { buffer.Data() };
    
    auto* worker = new AudioFifoReadWorker(env, fifo_, data, 1, nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    return promise;
  }
  
  Napi::TypeError::New(env, "Expected Buffer or Array of Buffers").ThrowAsJavaScriptException();
  return env.Undefined();
}

Napi::Value AudioFifo::PeekAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!fifo_) {
    Napi::Error::New(env, "AudioFifo not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (data, nb_samples)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int nb_samples = info[1].As<Napi::Number>().Int32Value();
  
  // Handle array of buffers (one per channel for planar formats)
  if (info[0].IsArray()) {
    Napi::Array dataArray = info[0].As<Napi::Array>();
    
    void** data = static_cast<void**>(av_malloc(dataArray.Length() * sizeof(void*)));
    if (!data) {
      Napi::Error::New(env, "Out of memory").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    for (uint32_t i = 0; i < dataArray.Length(); i++) {
      if (dataArray.Get(i).IsBuffer()) {
        Napi::Buffer<uint8_t> buf = dataArray.Get(i).As<Napi::Buffer<uint8_t>>();
        data[i] = buf.Data();
      } else {
        data[i] = nullptr;
      }
    }
    
    auto* worker = new AudioFifoPeekWorker(env, fifo_, data, dataArray.Length(), nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    av_free(data);
    return promise;
  }
  // Handle single buffer (interleaved format)
  else if (info[0].IsBuffer()) {
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    void* data[1] = { buffer.Data() };
    
    auto* worker = new AudioFifoPeekWorker(env, fifo_, data, 1, nb_samples);
    auto promise = worker->GetPromise();
    worker->Queue();
    
    return promise;
  }
  
  Napi::TypeError::New(env, "Expected Buffer or Array of Buffers").ThrowAsJavaScriptException();
  return env.Undefined();
}

} // namespace ffmpeg