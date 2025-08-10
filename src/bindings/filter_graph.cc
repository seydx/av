#include "filter_graph.h"
#include "filter_context.h"
#include "frame.h"
#include "hardware_device_context.h"
#include "hardware_frames_context.h"
#include "common.h"

#include <sstream>

extern "C" {
#include <libavutil/opt.h>
#include <libavutil/pixdesc.h>
#include <libavutil/channel_layout.h>
#include <libavfilter/buffersink.h>
}

namespace ffmpeg {

Napi::FunctionReference FilterGraph::constructor;

Napi::Object FilterGraph::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "FilterGraph", {
    // Main API
    InstanceMethod<&FilterGraph::BuildPipeline>("buildPipeline"),
    InstanceMethod<&FilterGraph::ProcessFrame>("processFrame"),
    InstanceMethod<&FilterGraph::ProcessFrameAsync>("processFrameAsync"),
    InstanceMethod<&FilterGraph::GetFilteredFrame>("getFilteredFrame"),
    InstanceMethod<&FilterGraph::GetFilteredFrameAsync>("getFilteredFrameAsync"),
    
    // Context access
    InstanceMethod<&FilterGraph::GetInputContext>("getInputContext"),
    InstanceMethod<&FilterGraph::GetOutputContext>("getOutputContext"),
    
    // Properties
    InstanceAccessor<&FilterGraph::GetNbThreads, &FilterGraph::SetNbThreads>("nbThreads"),
    InstanceAccessor<&FilterGraph::GetThreadType, &FilterGraph::SetThreadType>("threadType"),
    
    // Resource management
    InstanceMethod<&FilterGraph::Free>("free"),
    InstanceMethod<&FilterGraph::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("FilterGraph", func);
  return exports;
}

FilterGraph::FilterGraph(const Napi::CallbackInfo& info)
  : Napi::ObjectWrap<FilterGraph>(info), 
    graph_(nullptr),
    buffersrc_ctx_(nullptr),
    buffersink_ctx_(nullptr) {
  
  graph_ = avfilter_graph_alloc();
  if (!graph_) {
    Napi::Error::New(info.Env(), "Failed to allocate filter graph").ThrowAsJavaScriptException();
  }
}

FilterGraph::~FilterGraph() {
  if (graph_) {
    avfilter_graph_free(&graph_);
  }
}

Napi::Value FilterGraph::BuildPipeline(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!graph_) {
    Napi::Error::New(env, "Filter graph not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Configuration object required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Object config = info[0].As<Napi::Object>();
  
  // Extract configuration
  if (!config.Has("input") || !config.Get("input").IsObject()) {
    Napi::TypeError::New(env, "Input configuration required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!config.Has("filters") || !config.Get("filters").IsString()) {
    Napi::TypeError::New(env, "Filter string required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Object input = config.Get("input").As<Napi::Object>();
  std::string filters = config.Get("filters").As<Napi::String>().Utf8Value();
  
  // Create buffer source
  int ret = CreateBufferSource(input);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create buffer source");
    return env.Undefined();
  }
  
  // Hardware frames context is now handled in CreateBufferSource
  
  // Create buffer sink
  Napi::Object output = config.Has("output") && config.Get("output").IsObject() 
    ? config.Get("output").As<Napi::Object>() 
    : Napi::Object::New(env);
  
  ret = CreateBufferSink(output);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to create buffer sink");
    return env.Undefined();
  }
  
  // Parse filter string
  ret = ParseFilterString(filters);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to parse filter string");
    return env.Undefined();
  }
  
  // Apply hardware device context if provided
  if (config.Has("hardware") && config.Get("hardware").IsObject()) {
    Napi::Object hardware = config.Get("hardware").As<Napi::Object>();
    
    if (hardware.Has("deviceContext") && hardware.Get("deviceContext").IsObject()) {
      Napi::Object deviceCtxObj = hardware.Get("deviceContext").As<Napi::Object>();
      
      HardwareDeviceContext* hwDeviceCtx = UnwrapNativeObject<HardwareDeviceContext>(
        env, deviceCtxObj, "HardwareDeviceContext");
      if (hwDeviceCtx && hwDeviceCtx->GetContext()) {
        ret = ApplyHardwareContext(hwDeviceCtx->GetContext());
        if (ret < 0) {
          CheckFFmpegError(env, ret, "Failed to apply hardware device context");
          return env.Undefined();
        }
      }
    }
  }
  
  // Configure the graph
  ret = avfilter_graph_config(graph_, nullptr);
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    CheckFFmpegError(env, ret, "Failed to configure filter graph");
    return env.Undefined();
  }
  
  return env.Undefined();
}

Napi::Value FilterGraph::ProcessFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!buffersrc_ctx_ || !buffersink_ctx_) {
    Napi::Error::New(env, "Pipeline not configured. Call buildPipeline first.").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Input and output frames required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Input frame can be null for flushing
  AVFrame* inputAVFrame = nullptr;
  if (!info[0].IsNull() && !info[0].IsUndefined()) {
    if (!info[0].IsObject()) {
      Napi::TypeError::New(env, "Input must be a Frame object or null").ThrowAsJavaScriptException();
      return Napi::Number::New(env, AVERROR(EINVAL));
    }
    Frame* inputFrame = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
    if (!inputFrame) {
      return Napi::Number::New(env, AVERROR(EINVAL));
    }
    inputAVFrame = inputFrame->GetFrame();
  }
  
  // Output frame is required
  Frame* outputFrame = UnwrapNativeObjectRequired<Frame>(env, info[1], "Frame");
  if (!outputFrame) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // If we have an input frame, add it to buffer source
  if (inputAVFrame) {
    int ret = av_buffersrc_add_frame_flags(buffersrc_ctx_, inputAVFrame, AV_BUFFERSRC_FLAG_KEEP_REF);
    if (ret < 0) {
      return Napi::Number::New(env, ret);
    }
    
    // Try to get frame from buffer sink
    ret = av_buffersink_get_frame(buffersink_ctx_, outputFrame->GetFrame());
    return Napi::Number::New(env, ret);
  } else {
    // Signal EOF to the filter (only once)
    int ret = av_buffersrc_add_frame(buffersrc_ctx_, nullptr);
    if (ret < 0 && ret != AVERROR_EOF) {
      return Napi::Number::New(env, ret);
    }
    
    // After signaling EOF, try to get any remaining frames
    ret = av_buffersink_get_frame(buffersink_ctx_, outputFrame->GetFrame());
    
    // Validate frame after flush
    if (ret == 0 && outputFrame->GetFrame()) {
      AVFrame* frame = outputFrame->GetFrame();
      bool hasValidData = false;
      
      if (frame->width > 0 && frame->height > 0 && frame->format >= 0) {
        // Video frame - check for buffer
        if (frame->buf[0] != nullptr) {
          hasValidData = true;
        }
      } else if (frame->nb_samples > 0 && frame->format >= 0) {
        // Audio frame - check for buffer
        if (frame->buf[0] != nullptr) {
          hasValidData = true;
        }
      }
      
      if (!hasValidData) {
        av_frame_unref(frame);
        return Napi::Number::New(env, AVERROR(EAGAIN));
      }
    }
    
    return Napi::Number::New(env, ret);
  }
}

Napi::Value FilterGraph::ProcessFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Input and output frames required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Input frame can be null for flushing
  Frame* inputFrame = nullptr;
  if (!info[0].IsNull() && !info[0].IsUndefined()) {
    if (!info[0].IsObject()) {
      Napi::TypeError::New(env, "Input must be a Frame object or null").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    inputFrame = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
    if (!inputFrame) {
      return env.Undefined();
    }
  }
  
  // Output frame is required
  Frame* outputFrame = UnwrapNativeObjectRequired<Frame>(env, info[1], "Frame");
  
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  
  // Create promise callback
  Napi::Function callback = Napi::Function::New(env, [deferred](const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() > 0 && !info[0].IsNull()) {
      // Error occurred (first arg is error)
      deferred.Reject(info[0]);
    } else if (info.Length() > 1 && info[1].IsNumber()) {
      // Success with return code (second arg is result)
      deferred.Resolve(info[1]);
    } else {
      deferred.Resolve(Napi::Number::New(env, 0));
    }
  });
  
  ProcessFrameWorker* worker = new ProcessFrameWorker(callback, this, inputFrame, outputFrame);
  worker->Queue();
  
  return deferred.Promise();
}

Napi::Value FilterGraph::GetFilteredFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Output frame required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* outputFrame = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!outputFrame) {
    return env.Undefined();
  }
  
  if (!buffersink_ctx_) {
    Napi::Error::New(env, "Pipeline not configured").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Get frame from buffer sink without adding input
  AVFrame* frame = outputFrame->GetFrame();
  if (!frame) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Clear any existing frame data first
  av_frame_unref(frame);
  
  // Try to get a frame from the buffer sink
  int ret = av_buffersink_get_frame(buffersink_ctx_, frame);
  
  // Validate frame if av_buffersink_get_frame returned success
  if (ret == 0) {
    // Check for completely empty frame
    if (frame->width == 0 && frame->height == 0 && frame->nb_samples == 0) {
      av_frame_unref(frame);
      return Napi::Number::New(env, AVERROR(EAGAIN));
    }
    
    // Verify frame has actual data buffer
    bool hasValidData = false;
    
    if (frame->width > 0 && frame->height > 0 && frame->format >= 0) {
      // Video frame - check for buffer
      if (frame->buf[0] != nullptr) {
        hasValidData = true;
      }
    } else if (frame->nb_samples > 0 && frame->format >= 0) {
      // Audio frame - check for buffer
      if (frame->buf[0] != nullptr) {
        hasValidData = true;
      }
    }
    
    if (!hasValidData) {
      av_frame_unref(frame);
      return Napi::Number::New(env, AVERROR(EAGAIN));
    }
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value FilterGraph::GetFilteredFrameAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Output frame required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* outputFrame = UnwrapNativeObjectRequired<Frame>(env, info[0], "Frame");
  if (!outputFrame) {
    return env.Undefined();
  }
  
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  
  // Create promise callback
  Napi::Function callback = Napi::Function::New(env, [deferred](const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() > 0 && !info[0].IsNull()) {
      // Error occurred (first arg is error)
      deferred.Reject(info[0]);
    } else if (info.Length() > 1 && info[1].IsNumber()) {
      // Success with return code (second arg is result)
      deferred.Resolve(info[1]);
    } else {
      deferred.Resolve(Napi::Number::New(env, 0));
    }
  });
  
  GetFilteredFrameWorker* worker = new GetFilteredFrameWorker(callback, this, outputFrame);
  worker->Queue();
  
  return deferred.Promise();
}

Napi::Value FilterGraph::GetInputContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!buffersrc_ctx_) {
    Napi::Error::New(env, "Pipeline not configured").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create FilterContext wrapper
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  ctx->SetContext(buffersrc_ctx_);
  
  return ctxObj;
}

Napi::Value FilterGraph::GetOutputContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!buffersink_ctx_) {
    Napi::Error::New(env, "Pipeline not configured").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create FilterContext wrapper
  Napi::Object ctxObj = FilterContext::constructor.New({});
  FilterContext* ctx = Napi::ObjectWrap<FilterContext>::Unwrap(ctxObj);
  ctx->SetContext(buffersink_ctx_);
  
  return ctxObj;
}

Napi::Value FilterGraph::GetNbThreads(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, graph_ ? graph_->nb_threads : 0);
}

void FilterGraph::SetNbThreads(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (graph_ && value.IsNumber()) {
    graph_->nb_threads = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FilterGraph::GetThreadType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, graph_ ? graph_->thread_type : 0);
}

void FilterGraph::SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (graph_ && value.IsNumber()) {
    graph_->thread_type = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value FilterGraph::Free(const Napi::CallbackInfo& info) {
  if (graph_) {
    avfilter_graph_free(&graph_);
    graph_ = nullptr;
    buffersrc_ctx_ = nullptr;
    buffersink_ctx_ = nullptr;
  }
  return info.Env().Undefined();
}

Napi::Value FilterGraph::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

// Helper methods
int FilterGraph::CreateBufferSource(const Napi::Object& input) {
  const AVFilter* buffersrc = nullptr;
  std::stringstream args;
  AVBufferRef* hw_frames_ctx = nullptr;
  
  // Check for hardware frames context first
  if (input.Has("hwFramesContext")) {
    Napi::Value hwFramesCtxValue = input.Get("hwFramesContext");
    HardwareFramesContext* hwFramesContext = UnwrapNativeObject<HardwareFramesContext>(
      input.Env(), hwFramesCtxValue, "HardwareFramesContext");
    if (hwFramesContext && hwFramesContext->GetContext()) {
      hw_frames_ctx = hwFramesContext->GetContext();
    }
  }
  
  // Determine if this is video or audio
  bool isVideo = input.Has("width") && input.Has("height");
  
  if (isVideo) {
    buffersrc = avfilter_get_by_name("buffer");
    
    // Build video parameters
    int width = input.Get("width").As<Napi::Number>().Int32Value();
    int height = input.Get("height").As<Napi::Number>().Int32Value();
    int pixelFormat = input.Get("pixelFormat").As<Napi::Number>().Int32Value();
    
    // Get time base
    AVRational timeBase = {1, 25}; // Default
    if (input.Has("timeBase") && input.Get("timeBase").IsObject()) {
      Napi::Object tb = input.Get("timeBase").As<Napi::Object>();
      if (tb.Has("num") && tb.Has("den")) {
        timeBase.num = tb.Get("num").As<Napi::Number>().Int32Value();
        timeBase.den = tb.Get("den").As<Napi::Number>().Int32Value();
      }
    }
    
    // Get sample aspect ratio
    AVRational sar = {1, 1}; // Default
    if (input.Has("sampleAspectRatio") && input.Get("sampleAspectRatio").IsObject()) {
      Napi::Object sarObj = input.Get("sampleAspectRatio").As<Napi::Object>();
      if (sarObj.Has("num") && sarObj.Has("den")) {
        sar.num = sarObj.Get("num").As<Napi::Number>().Int32Value();
        sar.den = sarObj.Get("den").As<Napi::Number>().Int32Value();
      }
    }
    
    // For hardware frames, we use the pixel format number directly if name is not available
    const char* pixFmtName = av_get_pix_fmt_name((AVPixelFormat)pixelFormat);
    if (pixFmtName) {
      args << "video_size=" << width << "x" << height
           << ":pix_fmt=" << pixFmtName
           << ":time_base=" << timeBase.num << "/" << timeBase.den
           << ":pixel_aspect=" << sar.num << "/" << sar.den;
    } else {
      // Use the pixel format number directly
      args << "video_size=" << width << "x" << height
           << ":pix_fmt=" << pixelFormat
           << ":time_base=" << timeBase.num << "/" << timeBase.den
           << ":pixel_aspect=" << sar.num << "/" << sar.den;
    }
  } else {
    // Audio buffer source
    buffersrc = avfilter_get_by_name("abuffer");
    
    int sampleRate = input.Get("sampleRate").As<Napi::Number>().Int32Value();
    int sampleFormat = input.Get("sampleFormat").As<Napi::Number>().Int32Value();
    
    args << "sample_rate=" << sampleRate
         << ":sample_fmt=" << av_get_sample_fmt_name((AVSampleFormat)sampleFormat)
         << ":channel_layout=stereo"; // Default, should be configurable
  }
  
  if (!buffersrc) {
    return AVERROR_FILTER_NOT_FOUND;
  }
  
  int ret = avfilter_graph_create_filter(&buffersrc_ctx_, buffersrc, "in",
                                         args.str().c_str(), nullptr, graph_);
  if (ret < 0) {
    return ret;
  }
  
  // Set hardware frames context if provided
  if (hw_frames_ctx && buffersrc_ctx_) {
    AVBufferSrcParameters* params = av_buffersrc_parameters_alloc();
    if (!params) {
      return AVERROR(ENOMEM);
    }
    
    params->hw_frames_ctx = av_buffer_ref(hw_frames_ctx);
    if (!params->hw_frames_ctx) {
      av_free(params);
      return AVERROR(ENOMEM);
    }
    
    ret = av_buffersrc_parameters_set(buffersrc_ctx_, params);
    av_buffer_unref(&params->hw_frames_ctx);
    av_free(params);
    
    if (ret < 0) {
      return ret;
    }
  } else {
  }
  
  return 0;
}

int FilterGraph::CreateBufferSink(const Napi::Object& output) {
  const AVFilter* buffersink = nullptr;
  
  // Determine if this is video or audio based on the source
  bool isVideo = buffersrc_ctx_ && 
                 strcmp(buffersrc_ctx_->filter->name, "buffer") == 0;
  
  if (isVideo) {
    buffersink = avfilter_get_by_name("buffersink");
  } else {
    buffersink = avfilter_get_by_name("abuffersink");
  }
  
  if (!buffersink) {
    return AVERROR_FILTER_NOT_FOUND;
  }
  
  int ret = avfilter_graph_create_filter(&buffersink_ctx_, buffersink, "out",
                                         nullptr, nullptr, graph_);
  if (ret < 0) {
    return ret;
  }
  
  // Set output constraints if provided
  if (output.Has("pixelFormats") && output.Get("pixelFormats").IsArray()) {
    Napi::Array formats = output.Get("pixelFormats").As<Napi::Array>();
    if (formats.Length() > 0) {
      // Create array of pixel formats
      std::vector<AVPixelFormat> pix_fmts;
      for (uint32_t i = 0; i < formats.Length(); i++) {
        if (formats.Get(i).IsNumber()) {
          pix_fmts.push_back(static_cast<AVPixelFormat>(formats.Get(i).As<Napi::Number>().Int32Value()));
        }
      }
      
      if (!pix_fmts.empty()) {
        // Add AV_PIX_FMT_NONE terminator
        pix_fmts.push_back(AV_PIX_FMT_NONE);
        
        // Set pixel formats on buffer sink
        ret = av_opt_set_bin(buffersink_ctx_, "pix_fmts",
                            (uint8_t*)pix_fmts.data(),
                            pix_fmts.size() * sizeof(AVPixelFormat),
                            AV_OPT_SEARCH_CHILDREN);
        if (ret < 0) {
          return ret;
        }
      }
    }
  }
  
  // Similarly for sample formats (audio)
  if (output.Has("sampleFormats") && output.Get("sampleFormats").IsArray()) {
    Napi::Array formats = output.Get("sampleFormats").As<Napi::Array>();
    if (formats.Length() > 0) {
      // Create array of sample formats
      std::vector<AVSampleFormat> sample_fmts;
      for (uint32_t i = 0; i < formats.Length(); i++) {
        if (formats.Get(i).IsNumber()) {
          sample_fmts.push_back(static_cast<AVSampleFormat>(formats.Get(i).As<Napi::Number>().Int32Value()));
        }
      }
      
      if (!sample_fmts.empty()) {
        // Add AV_SAMPLE_FMT_NONE terminator
        sample_fmts.push_back(AV_SAMPLE_FMT_NONE);
        
        // Set sample formats on buffer sink
        ret = av_opt_set_bin(buffersink_ctx_, "sample_fmts",
                            (uint8_t*)sample_fmts.data(),
                            sample_fmts.size() * sizeof(AVSampleFormat),
                            AV_OPT_SEARCH_CHILDREN);
        if (ret < 0) {
          return ret;
        }
      }
    }
  }
  
  return 0;
}

int FilterGraph::ParseFilterString(const std::string& filters) {
  if (!buffersrc_ctx_ || !buffersink_ctx_) {
    return AVERROR(EINVAL);
  }
  
  AVFilterInOut* outputs = avfilter_inout_alloc();
  AVFilterInOut* inputs = avfilter_inout_alloc();
  
  if (!outputs || !inputs) {
    avfilter_inout_free(&outputs);
    avfilter_inout_free(&inputs);
    return AVERROR(ENOMEM);
  }
  
  outputs->name = av_strdup("in");
  outputs->filter_ctx = buffersrc_ctx_;
  outputs->pad_idx = 0;
  outputs->next = nullptr;
  
  inputs->name = av_strdup("out");
  inputs->filter_ctx = buffersink_ctx_;
  inputs->pad_idx = 0;
  inputs->next = nullptr;
  
  int ret = avfilter_graph_parse_ptr(graph_, filters.c_str(),
                                     &inputs, &outputs, nullptr);
  
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);
  
  return ret;
}

int FilterGraph::ApplyHardwareContext(AVBufferRef* hw_device_ctx) {
  if (!graph_ || !hw_device_ctx) {
    return AVERROR(EINVAL);
  }
  
  // Apply hardware device context to all filters that support it
  for (unsigned int i = 0; i < graph_->nb_filters; i++) {
    AVFilterContext* filter = graph_->filters[i];
    if (filter->filter->flags & AVFILTER_FLAG_HWDEVICE) {
      filter->hw_device_ctx = av_buffer_ref(hw_device_ctx);
      if (!filter->hw_device_ctx) {
        return AVERROR(ENOMEM);
      }
    }
  }
  
  return 0;
}


// Async workers

ProcessFrameWorker::ProcessFrameWorker(
  Napi::Function& callback,
  FilterGraph* graph,
  Frame* inputFrame,
  Frame* outputFrame
) : Napi::AsyncWorker(callback), 
    graph_(graph), 
    inputFrame_(inputFrame), 
    outputFrame_(outputFrame),
    result_(0) {}

void ProcessFrameWorker::Execute() {
  // Process frame in worker thread
  AVFilterContext* src = graph_->GetBufferSrcContext();
  AVFilterContext* sink = graph_->GetBufferSinkContext();
  
  if (!src || !sink) {
    result_ = AVERROR(EINVAL);
    return;
  }
  
  // Handle input frame or flush
  if (inputFrame_) {
    AVFrame* inputAVFrame = inputFrame_->GetFrame();
    result_ = av_buffersrc_add_frame_flags(src, inputAVFrame, AV_BUFFERSRC_FLAG_KEEP_REF);
    if (result_ < 0) {
      return;
    }
    
    // Try to get frame from buffer sink
    result_ = av_buffersink_get_frame(sink, outputFrame_->GetFrame());
  } else {
    // Signal EOF to the filter
    result_ = av_buffersrc_add_frame(src, nullptr);
    if (result_ < 0 && result_ != AVERROR_EOF) {
      return;
    }
    
    // After signaling EOF, try to get any remaining frames
    result_ = av_buffersink_get_frame(sink, outputFrame_->GetFrame());
    
    // Validate frame after flush
    if (result_ == 0 && outputFrame_->GetFrame()) {
      AVFrame* frame = outputFrame_->GetFrame();
      bool hasValidData = false;
      
      if (frame->width > 0 && frame->height > 0 && frame->format >= 0) {
        // Video frame - check for buffer
        if (frame->buf[0] != nullptr) {
          hasValidData = true;
        }
      } else if (frame->nb_samples > 0 && frame->format >= 0) {
        // Audio frame - check for buffer
        if (frame->buf[0] != nullptr) {
          hasValidData = true;
        }
      }
      
      if (!hasValidData) {
        av_frame_unref(frame);
        result_ = AVERROR(EAGAIN);
      }
    }
  }
}

void ProcessFrameWorker::OnOK() {
  Napi::HandleScope scope(Env());
  Callback().Call({Env().Null(), Napi::Number::New(Env(), result_)});
}

void ProcessFrameWorker::OnError(const Napi::Error& error) {
  Callback().Call({error.Value()});
}

GetFilteredFrameWorker::GetFilteredFrameWorker(
  Napi::Function& callback,
  FilterGraph* graph,
  Frame* outputFrame
) : Napi::AsyncWorker(callback), 
    graph_(graph), 
    outputFrame_(outputFrame),
    result_(0) {}

void GetFilteredFrameWorker::Execute() {
  // Get frame from buffer sink without adding input
  AVFilterContext* sink = graph_->GetBufferSinkContext();
  
  if (!sink) {
    result_ = AVERROR(EINVAL);
    return;
  }
  
  AVFrame* frame = outputFrame_->GetFrame();
  if (!frame) {
    result_ = AVERROR(EINVAL);
    return;
  }
  
  // Clear any existing frame data first
  av_frame_unref(frame);
  
  // Try to get a frame from the buffer sink
  result_ = av_buffersink_get_frame(sink, frame);
  
  // Validate frame if av_buffersink_get_frame returned success
  if (result_ == 0) {
    // Check for completely empty frame
    if (frame->width == 0 && frame->height == 0 && frame->nb_samples == 0) {
      av_frame_unref(frame);
      result_ = AVERROR(EAGAIN);
      return;
    }
    
    // Verify frame has actual data buffer
    bool hasValidData = false;
    
    if (frame->width > 0 && frame->height > 0 && frame->format >= 0) {
      // Video frame - check for buffer
      if (frame->buf[0] != nullptr) {
        hasValidData = true;
      }
    } else if (frame->nb_samples > 0 && frame->format >= 0) {
      // Audio frame - check for buffer
      if (frame->buf[0] != nullptr) {
        hasValidData = true;
      }
    }
    
    if (!hasValidData) {
      av_frame_unref(frame);
      result_ = AVERROR(EAGAIN);
    }
  }
}

void GetFilteredFrameWorker::OnOK() {
  Napi::HandleScope scope(Env());
  Callback().Call({Env().Null(), Napi::Number::New(Env(), result_)});
}

void GetFilteredFrameWorker::OnError(const Napi::Error& error) {
  Callback().Call({error.Value()});
}

} // namespace ffmpeg