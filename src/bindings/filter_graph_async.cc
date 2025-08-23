#include "filter_graph.h"
#include <napi.h>

extern "C" {
#include <libavfilter/avfilter.h>
}

namespace ffmpeg {

// ============================================================================
// Async Worker Classes for FilterGraph Operations
// ============================================================================

/**
 * Worker for avfilter_graph_config - Configures the filter graph
 */
class FGConfigWorker : public Napi::AsyncWorker {
public:
  FGConfigWorker(Napi::Env env, FilterGraph* graph)
    : Napi::AsyncWorker(env), 
      graph_(graph), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = avfilter_graph_config(graph_->Get(), nullptr);
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), ret_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  FilterGraph* graph_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

/**
 * Worker for avfilter_graph_request_oldest - Requests frame from oldest sink
 */
class FGRequestOldestWorker : public Napi::AsyncWorker {
public:
  FGRequestOldestWorker(Napi::Env env, FilterGraph* graph)
    : Napi::AsyncWorker(env), 
      graph_(graph), 
      ret_(0),
      deferred_(Napi::Promise::Deferred::New(env)) {}

  void Execute() override {
    ret_ = avfilter_graph_request_oldest(graph_->Get());
  }

  void OnOK() override {
    deferred_.Resolve(Napi::Number::New(Env(), ret_));
  }

  void OnError(const Napi::Error& e) override {
    deferred_.Reject(e.Value());
  }

  Napi::Promise GetPromise() {
    return deferred_.Promise();
  }

private:
  FilterGraph* graph_;
  int ret_;
  Napi::Promise::Deferred deferred_;
};

// ============================================================================
// FilterGraph Async Method Implementations
// ============================================================================

Napi::Value FilterGraph::ConfigAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  auto* worker = new FGConfigWorker(env, this);
  worker->Queue();
  return worker->GetPromise();
}

Napi::Value FilterGraph::RequestOldestAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    Napi::TypeError::New(env, "FilterGraph is not initialized").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  auto* worker = new FGRequestOldestWorker(env, this);
  worker->Queue();
  return worker->GetPromise();
}

} // namespace ffmpeg