#include "frame.h"
#include "hardware_frames_context.h"

namespace ffmpeg {

Napi::FunctionReference Frame::constructor;

// === Init ===

Napi::Object Frame::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Frame", {
    // Lifecycle
    InstanceMethod<&Frame::Alloc>("alloc"),
    InstanceMethod<&Frame::Free>("free"),
    InstanceMethod<&Frame::Ref>("ref"),
    InstanceMethod<&Frame::Unref>("unref"),
    InstanceMethod<&Frame::Clone>("clone"),
    InstanceMethod<&Frame::GetBuffer>("getBuffer"),
    InstanceMethod<&Frame::AllocBuffer>("allocBuffer"),
    InstanceMethod<&Frame::MakeWritable>("makeWritable"),
    InstanceMethod<&Frame::CopyProps>("copyProps"),
    InstanceMethod<&Frame::Copy>("copy"),
    
    // Properties
    InstanceAccessor<&Frame::GetFormat, &Frame::SetFormat>("format"),
    InstanceAccessor<&Frame::GetWidth, &Frame::SetWidth>("width"),
    InstanceAccessor<&Frame::GetHeight, &Frame::SetHeight>("height"),
    InstanceAccessor<&Frame::GetNbSamples, &Frame::SetNbSamples>("nbSamples"),
    InstanceAccessor<&Frame::GetPts, &Frame::SetPts>("pts"),
    InstanceAccessor<&Frame::GetPktDts, &Frame::SetPktDts>("pktDts"),
    InstanceAccessor<&Frame::GetBestEffortTimestamp, &Frame::SetBestEffortTimestamp>("bestEffortTimestamp"),
    InstanceAccessor<&Frame::GetTimeBase, &Frame::SetTimeBase>("timeBase"),
    InstanceAccessor<&Frame::GetKeyFrame, &Frame::SetKeyFrame>("keyFrame"),
    InstanceAccessor<&Frame::GetPictType, &Frame::SetPictType>("pictType"),
    InstanceAccessor<&Frame::GetSampleAspectRatio, &Frame::SetSampleAspectRatio>("sampleAspectRatio"),
    InstanceAccessor<&Frame::GetSampleRate, &Frame::SetSampleRate>("sampleRate"),
    InstanceAccessor<&Frame::GetChannelLayout, &Frame::SetChannelLayout>("channelLayout"),
    InstanceAccessor<&Frame::GetChannels>("channels"),
    InstanceAccessor<&Frame::GetLinesize>("linesize"),
    InstanceAccessor<&Frame::GetColorRange, &Frame::SetColorRange>("colorRange"),
    InstanceAccessor<&Frame::GetColorPrimaries, &Frame::SetColorPrimaries>("colorPrimaries"),
    InstanceAccessor<&Frame::GetColorTrc, &Frame::SetColorTrc>("colorTrc"),
    InstanceAccessor<&Frame::GetColorSpace, &Frame::SetColorSpace>("colorSpace"),
    InstanceAccessor<&Frame::GetChromaLocation, &Frame::SetChromaLocation>("chromaLocation"),
    InstanceAccessor<&Frame::GetData>("data"),
    InstanceAccessor<&Frame::GetExtendedData>("extendedData"),
    InstanceAccessor<&Frame::GetIsWritable>("isWritable"),
    
    // Hardware Acceleration
    InstanceAccessor<&Frame::GetHwFramesCtx, &Frame::SetHwFramesCtx>("hwFramesCtx"),
    InstanceMethod<&Frame::HwframeTransferData>("hwframeTransferData"),
    InstanceMethod<&Frame::IsHwFrame>("isHwFrame"),
    InstanceMethod<&Frame::IsSwFrame>("isSwFrame"),
    
    // Utility
    InstanceMethod<&Frame::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Frame", func);
  return exports;
}

// === Lifecycle ===

Frame::Frame(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<Frame>(info) {
  // Constructor does nothing - user must explicitly call alloc()
}

Frame::~Frame() {
  // Manual cleanup if not already done
  if (!is_freed_ && frame_) {
    av_frame_free(&frame_);
    frame_ = nullptr;
  }
}

// === Methods ===

Napi::Value Frame::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFrame* frame = av_frame_alloc();
  if (!frame) {
    Napi::Error::New(env, "Failed to allocate frame (ENOMEM)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Free old frame if exists
  if (frame_ && !is_freed_) {
    av_frame_free(&frame_);
  }
  
  frame_ = frame;
  is_freed_ = false;
  return env.Undefined();
}

Napi::Value Frame::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (frame_ && !is_freed_) {
    av_frame_free(&frame_);
    frame_ = nullptr;
    is_freed_ = true;
  }
  
  return env.Undefined();
}

Napi::Value Frame::Ref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Source frame required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* src = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  if (!src || !src->Get()) {
    Napi::TypeError::New(env, "Invalid source frame").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_frame_ref(frame_, src->Get());
  return Napi::Number::New(env, ret);
}

Napi::Value Frame::Unref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (frame_) {
    av_frame_unref(frame_);
  }
  
  return env.Undefined();
}

Napi::Value Frame::Clone(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return env.Null();
  }
  
  AVFrame* cloned = av_frame_clone(frame_);
  if (!cloned) {
    return env.Null();
  }
  
  // Create new Frame object
  Napi::Object newFrame = constructor.New({});
  Frame* wrapper = Napi::ObjectWrap<Frame>::Unwrap(newFrame);
  wrapper->frame_ = cloned;
  wrapper->is_freed_ = false;
  
  return newFrame;
}

Napi::Value Frame::GetBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int align = 0;
  if (info.Length() > 0 && info[0].IsNumber()) {
    align = info[0].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_frame_get_buffer(frame_, align);
  return Napi::Number::New(env, ret);
}

Napi::Value Frame::AllocBuffer(const Napi::CallbackInfo& info) {
  // Alias for getBuffer with default alignment
  return GetBuffer(info);
}

Napi::Value Frame::MakeWritable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_frame_make_writable(frame_);
  return Napi::Number::New(env, ret);
}

Napi::Value Frame::CopyProps(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Source frame required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* src = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  if (!src || !src->Get()) {
    Napi::TypeError::New(env, "Invalid source frame").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_frame_copy_props(frame_, src->Get());
  return Napi::Number::New(env, ret);
}

Napi::Value Frame::Copy(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Source frame required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Frame* src = UnwrapNativeObject<Frame>(env, info[0], "Frame");
  if (!src || !src->Get()) {
    Napi::TypeError::New(env, "Invalid source frame").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_frame_copy(frame_, src->Get());
  return Napi::Number::New(env, ret);
}

// === Properties ===

Napi::Value Frame::GetFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, -1);
  }
  return Napi::Number::New(env, frame_->format);
}

void Frame::SetFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->format = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Frame::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, frame_->width);
}

void Frame::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->width = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Frame::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, frame_->height);
}

void Frame::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->height = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Frame::GetNbSamples(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, frame_->nb_samples);
}

void Frame::SetNbSamples(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->nb_samples = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Frame::GetPts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::BigInt::New(env, AV_NOPTS_VALUE);
  }
  return Napi::BigInt::New(env, frame_->pts);
}

void Frame::SetPts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    bool lossless;
    frame_->pts = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Frame::GetPktDts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::BigInt::New(env, AV_NOPTS_VALUE);
  }
  return Napi::BigInt::New(env, frame_->pkt_dts);
}

void Frame::SetPktDts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    bool lossless;
    frame_->pkt_dts = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Frame::GetBestEffortTimestamp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::BigInt::New(env, AV_NOPTS_VALUE);
  }
  // best_effort_timestamp is deprecated in newer FFmpeg versions
  // Use pts if available, otherwise use dts
  int64_t best_effort = frame_->pts;
  if (best_effort == AV_NOPTS_VALUE) {
    best_effort = frame_->pkt_dts;
  }
  return Napi::BigInt::New(env, best_effort);
}

void Frame::SetBestEffortTimestamp(const Napi::CallbackInfo& info, const Napi::Value& value) {
  // This is typically a read-only computed value
  // Setting it doesn't make much sense, but we'll allow it for compatibility
  if (frame_) {
    bool lossless;
    frame_->pts = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Frame::GetTimeBase(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    AVRational tb = {0, 1};
    return RationalToJS(env, tb);
  }
  return RationalToJS(env, frame_->time_base);
}

void Frame::SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->time_base = JSToRational(value.As<Napi::Object>());
  }
}

Napi::Value Frame::GetKeyFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  // Use AV_FRAME_FLAG_KEY instead of deprecated key_frame field
  // Return 1 or 0 for compatibility with FFmpeg API
  return Napi::Number::New(env, (frame_->flags & AV_FRAME_FLAG_KEY) ? 1 : 0);
}

void Frame::SetKeyFrame(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    // Use AV_FRAME_FLAG_KEY instead of deprecated key_frame field
    // Accept number (0 or 1) for compatibility with FFmpeg API
    int keyFrame = value.As<Napi::Number>().Int32Value();
    if (keyFrame) {
      frame_->flags |= AV_FRAME_FLAG_KEY;
    } else {
      frame_->flags &= ~AV_FRAME_FLAG_KEY;
    }
  }
}

Napi::Value Frame::GetPictType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AV_PICTURE_TYPE_NONE);
  }
  return Napi::Number::New(env, frame_->pict_type);
}

void Frame::SetPictType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->pict_type = static_cast<AVPictureType>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    AVRational sar = {0, 1};
    return RationalToJS(env, sar);
  }
  return RationalToJS(env, frame_->sample_aspect_ratio);
}

void Frame::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->sample_aspect_ratio = JSToRational(value.As<Napi::Object>());
  }
}

Napi::Value Frame::GetSampleRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, frame_->sample_rate);
}

void Frame::SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->sample_rate = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Frame::GetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return env.Null();
  }
  
  AVFrame* f = frame_;
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("nbChannels", Napi::Number::New(env, f->ch_layout.nb_channels));
  obj.Set("order", Napi::Number::New(env, f->ch_layout.order));
  obj.Set("mask", Napi::BigInt::New(env, f->ch_layout.u.mask));
  
  return obj;
}

void Frame::SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!frame_ || !value.IsObject()) {
    return;
  }
  
  Napi::Object obj = value.As<Napi::Object>();
  AVFrame* f = frame_;
  
  // Clean up any existing channel layout
  av_channel_layout_uninit(&f->ch_layout);
  
  // Initialize to default state
  memset(&f->ch_layout, 0, sizeof(AVChannelLayout));
  
  if (obj.Has("order")) {
    f->ch_layout.order = static_cast<AVChannelOrder>(obj.Get("order").As<Napi::Number>().Int32Value());
  }
  if (obj.Has("nbChannels")) {
    f->ch_layout.nb_channels = obj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  if (obj.Has("mask")) {
    bool lossless;
    f->ch_layout.u.mask = obj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
}

Napi::Value Frame::GetChannels(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, frame_->ch_layout.nb_channels);
}

Napi::Value Frame::GetLinesize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return env.Null();
  }
  
  Napi::Array arr = Napi::Array::New(env, AV_NUM_DATA_POINTERS);
  for (int i = 0; i < AV_NUM_DATA_POINTERS; i++) {
    arr.Set(i, Napi::Number::New(env, frame_->linesize[i]));
  }
  return arr;
}

Napi::Value Frame::GetColorRange(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AVCOL_RANGE_UNSPECIFIED);
  }
  return Napi::Number::New(env, frame_->color_range);
}

void Frame::SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->color_range = static_cast<AVColorRange>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetColorPrimaries(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AVCOL_PRI_UNSPECIFIED);
  }
  return Napi::Number::New(env, frame_->color_primaries);
}

void Frame::SetColorPrimaries(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->color_primaries = static_cast<AVColorPrimaries>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetColorTrc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AVCOL_TRC_UNSPECIFIED);
  }
  return Napi::Number::New(env, frame_->color_trc);
}

void Frame::SetColorTrc(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->color_trc = static_cast<AVColorTransferCharacteristic>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetColorSpace(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AVCOL_SPC_UNSPECIFIED);
  }
  return Napi::Number::New(env, frame_->colorspace);
}

void Frame::SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->colorspace = static_cast<AVColorSpace>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetChromaLocation(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Number::New(env, AVCHROMA_LOC_UNSPECIFIED);
  }
  return Napi::Number::New(env, frame_->chroma_location);
}

void Frame::SetChromaLocation(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (frame_) {
    frame_->chroma_location = static_cast<AVChromaLocation>(value.As<Napi::Number>().Int32Value());
  }
}

Napi::Value Frame::GetData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return env.Null();
  }
  
  AVFrame* f = frame_;
  
  // Check if there's any data
  if (!f->data[0]) {
    return env.Null();
  }
  
  // Return array of data planes for video/audio
  Napi::Array planes = Napi::Array::New(env);
  
  // Check if this is an audio frame
  if (f->nb_samples > 0) {
    // Audio frame
    AVSampleFormat sample_fmt = static_cast<AVSampleFormat>(f->format);
    int nb_channels = f->ch_layout.nb_channels;
    int bytes_per_sample = av_get_bytes_per_sample(sample_fmt);
    
    if (av_sample_fmt_is_planar(sample_fmt)) {
      // Planar audio - one plane per channel
      for (int i = 0; i < nb_channels && f->data[i]; i++) {
        size_t plane_size = f->nb_samples * bytes_per_sample;
        planes.Set(static_cast<uint32_t>(i), Napi::Buffer<uint8_t>::New(env, f->data[i], plane_size));
      }
    } else {
      // Interleaved audio - all channels in one plane
      if (f->data[0]) {
        size_t plane_size = f->nb_samples * nb_channels * bytes_per_sample;
        planes.Set(static_cast<uint32_t>(0), Napi::Buffer<uint8_t>::New(env, f->data[0], plane_size));
      }
    }
  } else {
    // Video frame
    for (int i = 0; i < AV_NUM_DATA_POINTERS && f->data[i]; i++) {
      if (f->linesize[i] > 0) {
        // Calculate plane size
        int planeHeight = f->height;
        if (i > 0) {
          // For chroma planes in YUV formats, they might be subsampled
          const AVPixFmtDescriptor* desc = av_pix_fmt_desc_get(static_cast<AVPixelFormat>(f->format));
          if (desc && i < 3) {
            planeHeight = AV_CEIL_RSHIFT(f->height, desc->log2_chroma_h);
          }
        }
        size_t planeSize = f->linesize[i] * planeHeight;
        
        // Create buffer view (not a copy)
        planes.Set(static_cast<uint32_t>(i), Napi::Buffer<uint8_t>::New(env, f->data[i], planeSize));
      }
    }
  }
  
  return planes;
}

Napi::Value Frame::GetExtendedData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFrame* f = frame_;
  if (!f || !f->extended_data) {
    return env.Null();
  }
  
  // For audio with more than 8 channels, extended_data contains all channel data
  // For video and audio with <= 8 channels, extended_data == data
  Napi::Array extData = Napi::Array::New(env);
  
  // Check if this is an audio frame by checking nb_samples
  if (f->nb_samples > 0) {
    // Audio frame
    int nb_channels = f->ch_layout.nb_channels;
    int nb_samples = f->nb_samples;
    int bytes_per_sample = av_get_bytes_per_sample(static_cast<AVSampleFormat>(f->format));
    
    if (bytes_per_sample <= 0 || nb_samples <= 0) {
      return env.Null();
    }
    
    // For planar audio, each channel is in a separate buffer
    bool is_planar = av_sample_fmt_is_planar(static_cast<AVSampleFormat>(f->format));
    
    if (is_planar) {
      // Each channel in separate buffer
      for (int ch = 0; ch < nb_channels; ch++) {
        if (!f->extended_data[ch]) break;
        
        size_t channel_size = nb_samples * bytes_per_sample;
        extData.Set(ch, Napi::Buffer<uint8_t>::New(env, f->extended_data[ch], channel_size));
      }
    } else {
      // All channels interleaved in single buffer
      size_t total_size = nb_samples * nb_channels * bytes_per_sample;
      if (f->extended_data[0]) {
        extData.Set(0u, Napi::Buffer<uint8_t>::New(env, f->extended_data[0], total_size));
      }
    }
  } else {
    // Video frame or no audio channels - use same logic as GetData
    for (int i = 0; i < AV_NUM_DATA_POINTERS && f->extended_data[i]; i++) {
      if (f->linesize[i] <= 0) break;
      
      // Calculate plane size based on format and dimensions
      int planeHeight = f->height;
      if (i > 0) {
        // For chroma planes in YUV formats
        const AVPixFmtDescriptor* desc = av_pix_fmt_desc_get(static_cast<AVPixelFormat>(f->format));
        if (desc) {
          planeHeight = AV_CEIL_RSHIFT(f->height, desc->log2_chroma_h);
        }
      }
      
      size_t planeSize = f->linesize[i] * planeHeight;
      extData.Set(i, Napi::Buffer<uint8_t>::New(env, f->extended_data[i], planeSize));
    }
  }
  
  return extData;
}

Napi::Value Frame::GetIsWritable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_) {
    return Napi::Boolean::New(env, false);
  }
  return Napi::Boolean::New(env, av_frame_is_writable(frame_) > 0);
}

// Hardware Acceleration
Napi::Value Frame::GetHwFramesCtx(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!frame_ || !frame_->hw_frames_ctx) {
    return env.Null();
  }
  
  // Wrap the existing AVBufferRef in a HardwareFramesContext object
  return HardwareFramesContext::Wrap(env, frame_->hw_frames_ctx);
}

void Frame::SetHwFramesCtx(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!frame_) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    // Unref existing context
    if (frame_->hw_frames_ctx) {
      av_buffer_unref(&frame_->hw_frames_ctx);
    }
    return;
  }
  
  // Extract the HardwareFramesContext and get its AVBufferRef
  if (!value.IsObject()) {
    Napi::Error::New(info.Env(), "hwFramesCtx must be a HardwareFramesContext object").ThrowAsJavaScriptException();
    return;
  }
  
  HardwareFramesContext* frames = Napi::ObjectWrap<HardwareFramesContext>::Unwrap(value.As<Napi::Object>());
  if (!frames || !frames->Get()) {
    Napi::Error::New(info.Env(), "Invalid HardwareFramesContext").ThrowAsJavaScriptException();
    return;
  }
  
  // Unref old context if exists
  if (frame_->hw_frames_ctx) {
    av_buffer_unref(&frame_->hw_frames_ctx);
  }
  
  // Reference the new context
  frame_->hw_frames_ctx = av_buffer_ref(frames->Get());
}

Napi::Value Frame::HwframeTransferData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    Napi::Error::New(env, "Frame not allocated").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected destination frame").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  if (!info[0].IsObject()) {
    Napi::TypeError::New(env, "Destination must be a Frame object").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Frame* dst = Napi::ObjectWrap<Frame>::Unwrap(info[0].As<Napi::Object>());
  if (!dst || !dst->frame_) {
    Napi::Error::New(env, "Invalid destination frame").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  int flags = 0;
  if (info.Length() >= 2 && info[1].IsNumber()) {
    flags = info[1].As<Napi::Number>().Int32Value();
  }
  
  int ret = av_hwframe_transfer_data(dst->frame_, frame_, flags);
  
  return Napi::Number::New(env, ret);
}

Napi::Value Frame::IsHwFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Boolean::New(env, false);
  }
  
  // A frame is a hardware frame if it has hw_frames_ctx set
  bool isHw = (frame_->hw_frames_ctx != nullptr);
  return Napi::Boolean::New(env, isHw);
}

Napi::Value Frame::IsSwFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!frame_) {
    return Napi::Boolean::New(env, false);
  }
  
  // A frame is a software frame if it doesn't have hw_frames_ctx 
  // but has actual data in the first plane
  bool isSw = (frame_->hw_frames_ctx == nullptr) && (frame_->data[0] != nullptr);
  return Napi::Boolean::New(env, isSw);
}

Napi::Value Frame::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg