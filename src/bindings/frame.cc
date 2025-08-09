#include "frame.h"

extern "C" {
#include <libavutil/hwcontext.h>
}
#include <cstring>

namespace ffmpeg {

Napi::FunctionReference Frame::constructor;

Napi::Object Frame::Init(Napi::Env env, Napi::Object exports) {
  // Get Symbol.dispose
  Napi::Symbol disposeSymbol = Napi::Symbol::WellKnown(env, "dispose");
  
  Napi::Function func = DefineClass(env, "Frame", {
    // Properties - Common
    InstanceAccessor<&Frame::GetPts, &Frame::SetPts>("pts"),
    InstanceAccessor<&Frame::GetPktDts, &Frame::SetPktDts>("pktDts"),
    InstanceAccessor<&Frame::GetBestEffortTimestamp>("bestEffortTimestamp"),
    InstanceAccessor<&Frame::GetPktPos, &Frame::SetPktPos>("pktPos"),
    InstanceAccessor<&Frame::GetPktDuration, &Frame::SetPktDuration>("pktDuration"),
    InstanceAccessor<&Frame::GetKeyFrame, &Frame::SetKeyFrame>("keyFrame"),
    InstanceAccessor<&Frame::GetPictType, &Frame::SetPictType>("pictType"),
    
    // Properties - Video
    InstanceAccessor<&Frame::GetWidth, &Frame::SetWidth>("width"),
    InstanceAccessor<&Frame::GetHeight, &Frame::SetHeight>("height"),
    InstanceAccessor<&Frame::GetFormat, &Frame::SetFormat>("format"),
    InstanceAccessor<&Frame::GetSampleAspectRatio, &Frame::SetSampleAspectRatio>("sampleAspectRatio"),
    InstanceAccessor<&Frame::GetColorRange, &Frame::SetColorRange>("colorRange"),
    InstanceAccessor<&Frame::GetColorSpace, &Frame::SetColorSpace>("colorSpace"),
    
    // Properties - Audio
    InstanceAccessor<&Frame::GetNbSamples, &Frame::SetNbSamples>("nbSamples"),
    InstanceAccessor<&Frame::GetSampleRate, &Frame::SetSampleRate>("sampleRate"),
    InstanceAccessor<&Frame::GetChannelLayout, &Frame::SetChannelLayout>("channelLayout"),
    
    // Data access
    InstanceAccessor<&Frame::GetData>("data"),
    InstanceAccessor<&Frame::GetLinesize>("linesize"),
    
    // Methods
    InstanceMethod<&Frame::AllocBuffer>("allocBuffer"),
    InstanceMethod<&Frame::Ref>("ref"),
    InstanceMethod<&Frame::Unref>("unref"),
    InstanceMethod<&Frame::Clone>("clone"),
    InstanceMethod<&Frame::MakeWritable>("makeWritable"),
    InstanceMethod<&Frame::GetBuffer>("getBuffer"),
    
    // Hardware acceleration
    InstanceMethod<&Frame::TransferDataTo>("transferDataTo"),
    InstanceMethod<&Frame::TransferDataFrom>("transferDataFrom"),
    InstanceAccessor<&Frame::GetHwFramesContext, &Frame::SetHwFramesContext>("hwFramesContext"),
    
    InstanceMethod<&Frame::Dispose>(disposeSymbol),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  exports.Set("Frame", func);
  return exports;
}

Frame::Frame(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Frame>(info) {
  Napi::Env env = info.Env();
  
  AVFrame* frame = av_frame_alloc();
  if (!frame) {
    throw Napi::Error::New(env, "Failed to allocate frame");
  }
  frame_.Reset(frame);
}

Frame::~Frame() {
  // Resource cleanup handled by FrameResource
}

// Common properties
Napi::Value Frame::GetPts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, frame_.Get()->pts);
}

void Frame::SetPts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  frame_.Get()->pts = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Frame::GetPktDts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, frame_.Get()->pkt_dts);
}

void Frame::SetPktDts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  frame_.Get()->pkt_dts = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Frame::GetBestEffortTimestamp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, frame_.Get()->best_effort_timestamp);
}

Napi::Value Frame::GetPktPos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef FF_API_FRAME_PKT
  // pkt_pos is deprecated but still available
  return Napi::BigInt::New(env, frame_.Get()->pkt_pos);
#else
  // pkt_pos not available in this FFmpeg version
  return Napi::BigInt::New(env, static_cast<int64_t>(0));
#endif
}

void Frame::SetPktPos(const Napi::CallbackInfo& info, const Napi::Value& value) {
#ifdef FF_API_FRAME_PKT
  // pkt_pos is deprecated but still available
  bool lossless;
  frame_.Get()->pkt_pos = value.As<Napi::BigInt>().Int64Value(&lossless);
#endif
  // If not available, silently ignore
}

Napi::Value Frame::GetPktDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, frame_.Get()->duration);
}

void Frame::SetPktDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  frame_.Get()->duration = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Frame::GetKeyFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef FF_API_FRAME_KEY
  // Use deprecated key_frame if available
  return Napi::Boolean::New(env, frame_.Get()->key_frame != 0);
#else
  // Use AV_FRAME_FLAG_KEY for newer FFmpeg versions
  return Napi::Boolean::New(env, (frame_.Get()->flags & AV_FRAME_FLAG_KEY) != 0);
#endif
}

void Frame::SetKeyFrame(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool is_key = value.As<Napi::Boolean>().Value();
#ifdef FF_API_FRAME_KEY
  // Set deprecated key_frame if available
  frame_.Get()->key_frame = is_key ? 1 : 0;
#endif
  // Always set the flag as well for forward compatibility
  if (is_key) {
    frame_.Get()->flags |= AV_FRAME_FLAG_KEY;
  } else {
    frame_.Get()->flags &= ~AV_FRAME_FLAG_KEY;
  }
}

Napi::Value Frame::GetPictType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->pict_type);
}

void Frame::SetPictType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->pict_type = static_cast<enum AVPictureType>(value.As<Napi::Number>().Int32Value());
}

// Video properties
Napi::Value Frame::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->width);
}

void Frame::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->width = value.As<Napi::Number>().Int32Value();
}

Napi::Value Frame::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->height);
}

void Frame::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->height = value.As<Napi::Number>().Int32Value();
}

Napi::Value Frame::GetFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->format);
}

void Frame::SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->format = value.As<Napi::Number>().Int32Value();
}

Napi::Value Frame::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return RationalToJS(env, frame_.Get()->sample_aspect_ratio);
}

void Frame::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->sample_aspect_ratio = JSToRational(value.As<Napi::Object>());
}

Napi::Value Frame::GetColorRange(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->color_range);
}

void Frame::SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->color_range = static_cast<enum AVColorRange>(value.As<Napi::Number>().Int32Value());
}

Napi::Value Frame::GetColorSpace(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->colorspace);
}

void Frame::SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->colorspace = static_cast<enum AVColorSpace>(value.As<Napi::Number>().Int32Value());
}

// Audio properties
Napi::Value Frame::GetNbSamples(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->nb_samples);
}

void Frame::SetNbSamples(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->nb_samples = value.As<Napi::Number>().Int32Value();
}

Napi::Value Frame::GetSampleRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, frame_.Get()->sample_rate);
}

void Frame::SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  frame_.Get()->sample_rate = value.As<Napi::Number>().Int32Value();
}

Napi::Value Frame::GetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFrame* frame = frame_.Get();
  
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("nbChannels", Napi::Number::New(env, frame->ch_layout.nb_channels));
  obj.Set("order", Napi::Number::New(env, frame->ch_layout.order));
  
  if (frame->ch_layout.order == AV_CHANNEL_ORDER_NATIVE) {
    obj.Set("mask", Napi::BigInt::New(env, frame->ch_layout.u.mask));
  }
  
  return obj;
}

void Frame::SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!value.IsObject()) {
    return;
  }
  
  Napi::Object obj = value.As<Napi::Object>();
  AVFrame* frame = frame_.Get();
  
  if (obj.Has("nbChannels")) {
    frame->ch_layout.nb_channels = obj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  
  if (obj.Has("order")) {
    frame->ch_layout.order = static_cast<enum AVChannelOrder>(
      obj.Get("order").As<Napi::Number>().Int32Value()
    );
  }
  
  if (obj.Has("mask") && frame->ch_layout.order == AV_CHANNEL_ORDER_NATIVE) {
    bool lossless;
    frame->ch_layout.u.mask = obj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
}

// Data access
Napi::Value Frame::GetData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFrame* frame = frame_.Get();
  
  Napi::Array dataArray = Napi::Array::New(env);
  
  for (int i = 0; i < AV_NUM_DATA_POINTERS; i++) {
    if (frame->data[i] && frame->linesize[i] > 0) {
      int size = 0;
      
      // Calculate buffer size based on frame type
      if (frame->width > 0 && frame->height > 0) {
        // Video frame
        if (i == 0) {
          size = frame->linesize[i] * frame->height;
        } else {
          // For planar formats, UV planes are often half height
          int h = frame->height;
          if (i == 1 || i == 2) {
            // This is simplified - actual calculation depends on pixel format
            h = (frame->height + 1) / 2;
          }
          size = frame->linesize[i] * h;
        }
      } else if (frame->nb_samples > 0) {
        // Audio frame
        size = frame->linesize[i];
      }
      
      if (size > 0) {
        dataArray.Set(i, Napi::Buffer<uint8_t>::Copy(env, frame->data[i], size));
      } else {
        dataArray.Set(i, env.Null());
      }
    } else {
      dataArray.Set(i, env.Null());
    }
  }
  
  return dataArray;
}

Napi::Value Frame::GetLinesize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFrame* frame = frame_.Get();
  
  Napi::Array linesizeArray = Napi::Array::New(env);
  
  for (int i = 0; i < AV_NUM_DATA_POINTERS; i++) {
    linesizeArray.Set(i, Napi::Number::New(env, frame->linesize[i]));
  }
  
  return linesizeArray;
}

// Methods
Napi::Value Frame::AllocBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int align = 0;
  if (info.Length() > 0 && info[0].IsNumber()) {
    align = info[0].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_frame_get_buffer(frame_.Get(), align);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to allocate frame buffer");
  }
  
  return env.Undefined();
}

Napi::Value Frame::Ref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // In FFmpeg, av_frame_ref() is used to create a new reference to a frame
  // from another frame. Since we're not copying from another frame here,
  // this is essentially a no-op. The frame's reference counting is handled
  // automatically by FFmpeg when frames are passed between contexts.
  // If we need to increase reference count, we would use av_frame_get_buffer()
  // or work with the underlying AVBufferRef.
  
  return env.Undefined();
}

Napi::Value Frame::Unref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  av_frame_unref(frame_.Get());
  return env.Undefined();
}

Napi::Value Frame::Clone(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFrame* newFrame = av_frame_clone(frame_.Get());
  if (!newFrame) {
    Napi::Error::New(env, "Failed to clone frame").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Create new JS Frame instance
  Napi::Object instance = constructor.New({});
  Frame* frame = Napi::ObjectWrap<Frame>::Unwrap(instance);
  frame->SetFrame(newFrame);
  
  return instance;
}

Napi::Value Frame::MakeWritable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  int ret = av_frame_make_writable(frame_.Get());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to make frame writable");
  }
  
  return env.Undefined();
}

Napi::Value Frame::GetBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVFrame* frame = frame_.Get();
  
  // For now, return the first data plane as a buffer
  if (frame->data[0] && frame->linesize[0] > 0) {
    int size = 0;
    
    if (frame->width > 0 && frame->height > 0) {
      // Video frame
      size = frame->linesize[0] * frame->height;
    } else if (frame->nb_samples > 0) {
      // Audio frame
      size = frame->linesize[0];
    }
    
    if (size > 0) {
      return Napi::Buffer<uint8_t>::Copy(env, frame->data[0], size);
    }
  }
  
  return env.Null();
}

// Hardware acceleration / Frame transfer
Napi::Value Frame::TransferDataTo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Destination frame required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  Frame* dst = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  if (!dst) {
    Napi::TypeError::New(env, "Invalid destination frame").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  AVFrame* src_frame = frame_.Get();
  AVFrame* dst_frame = dst->GetFrame();
  
  int ret = 0;
  
  // Check if this is a hardware frame transfer
  if (src_frame->hw_frames_ctx) {
    // Hardware to software transfer
    ret = av_hwframe_transfer_data(dst_frame, src_frame, 0);
  } else if (dst_frame->hw_frames_ctx) {
    // Software to hardware transfer
    ret = av_hwframe_transfer_data(dst_frame, src_frame, 0);
  } else {
    // Regular frame copy for software frames
    // First ensure destination has the same format
    dst_frame->format = src_frame->format;
    dst_frame->width = src_frame->width;
    dst_frame->height = src_frame->height;
    dst_frame->ch_layout = src_frame->ch_layout;
    dst_frame->sample_rate = src_frame->sample_rate;
    dst_frame->nb_samples = src_frame->nb_samples;
    
    // Allocate buffer if needed
    if (dst_frame->width > 0 && dst_frame->height > 0) {
      ret = av_frame_get_buffer(dst_frame, 0);
      if (ret >= 0) {
        ret = av_frame_copy(dst_frame, src_frame);
      }
    } else if (dst_frame->nb_samples > 0) {
      ret = av_frame_get_buffer(dst_frame, 0);
      if (ret >= 0) {
        ret = av_frame_copy(dst_frame, src_frame);
      }
    }
  }
  
  if (ret < 0) {
    return Napi::Number::New(env, ret);
  }
  
  // Copy properties
  av_frame_copy_props(dst_frame, src_frame);
  
  return Napi::Number::New(env, 0);
}

Napi::Value Frame::TransferDataFrom(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Source frame required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  Frame* src = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  if (!src) {
    Napi::TypeError::New(env, "Invalid source frame").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  AVFrame* src_frame = src->GetFrame();
  AVFrame* dst_frame = frame_.Get();
  
  int ret = 0;
  
  // Check if this is a hardware frame transfer
  if (src_frame->hw_frames_ctx) {
    // Hardware to software transfer
    ret = av_hwframe_transfer_data(dst_frame, src_frame, 0);
  } else if (dst_frame->hw_frames_ctx) {
    // Software to hardware transfer  
    ret = av_hwframe_transfer_data(dst_frame, src_frame, 0);
  } else {
    // Regular frame copy for software frames
    // First ensure destination has the same format
    dst_frame->format = src_frame->format;
    dst_frame->width = src_frame->width;
    dst_frame->height = src_frame->height;
    dst_frame->ch_layout = src_frame->ch_layout;
    dst_frame->sample_rate = src_frame->sample_rate;
    dst_frame->nb_samples = src_frame->nb_samples;
    
    // Allocate buffer if needed
    if (dst_frame->width > 0 && dst_frame->height > 0) {
      ret = av_frame_get_buffer(dst_frame, 0);
      if (ret >= 0) {
        ret = av_frame_copy(dst_frame, src_frame);
      }
    } else if (dst_frame->nb_samples > 0) {
      ret = av_frame_get_buffer(dst_frame, 0);
      if (ret >= 0) {
        ret = av_frame_copy(dst_frame, src_frame);
      }
    }
  }
  
  if (ret < 0) {
    return Napi::Number::New(env, ret);
  }
  
  // Copy properties
  av_frame_copy_props(dst_frame, src_frame);
  
  return Napi::Number::New(env, 0);
}

Napi::Value Frame::GetHwFramesContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  // For now, return undefined as we need to wrap AVBufferRef
  return env.Undefined();
}

void Frame::SetHwFramesContext(const Napi::CallbackInfo& info, const Napi::Value& value) {
  // For now, do nothing
  // TODO: Implement when we have proper AVBufferRef wrapper
}

Napi::Value Frame::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  frame_.Reset();
  return env.Undefined();
}

void Frame::SetFrame(AVFrame* frame) {
  frame_.Reset(frame);
}

}  // namespace ffmpeg