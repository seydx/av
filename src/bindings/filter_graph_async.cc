// Implementation of async FilterGraph operations using Napi::Promise

#include "filter_graph.h"
#include "filter_context.h"
#include "common.h"

namespace ffmpeg {

// Worker class for async Config operation
class ConfigWorker : public Napi::AsyncWorker {
public:
  ConfigWorker(Napi::Env env, AVFilterGraph* graph)
    : AsyncWorker(env),
      graph_(graph),
      result_(0) {}

  void Execute() override {
    result_ = avfilter_graph_config(graph_, nullptr);
    
    if (result_ < 0) {
      char errbuf[AV_ERROR_MAX_STRING_SIZE];
      av_strerror(result_, errbuf, sizeof(errbuf));
      SetError(errbuf);
    }
  }

  void OnOK() override {
    Napi::HandleScope scope(Env());
    deferred_.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& error) override {
    deferred_.Reject(error.Value());
  }

  Napi::Promise::Deferred GetDeferred() { return deferred_; }

private:
  AVFilterGraph* graph_;
  int result_;
  Napi::Promise::Deferred deferred_ = Napi::Promise::Deferred::New(Env());
};

// Async version of Config
Napi::Value FilterGraph::ConfigAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    auto deferred = Napi::Promise::Deferred::New(env);
    deferred.Reject(Napi::Error::New(env, "Filter graph not initialized").Value());
    return deferred.Promise();
  }
  
  auto* worker = new ConfigWorker(env, graph_);
  auto promise = worker->GetDeferred().Promise();
  worker->Queue();
  
  return promise;
}

} // namespace ffmpeg