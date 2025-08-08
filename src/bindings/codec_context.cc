#include "codec_context.h"
#include "packet.h"
#include "frame.h"

namespace ffmpeg {

Napi::FunctionReference CodecContext::constructor;

Napi::Object CodecContext::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "CodecContext", {
    // Lifecycle
    InstanceMethod<&CodecContext::Open>("open"),
    InstanceMethod<&CodecContext::Close>("close"),
    
    // Encoding/Decoding
    InstanceMethod<&CodecContext::SendPacket>("sendPacket"),
    InstanceMethod<&CodecContext::ReceiveFrame>("receiveFrame"),
    InstanceMethod<&CodecContext::SendFrame>("sendFrame"),
    InstanceMethod<&CodecContext::ReceivePacket>("receivePacket"),
    InstanceMethod<&CodecContext::FlushBuffers>("flushBuffers"),
    
    // Properties - General
    InstanceAccessor<&CodecContext::GetCodecID, &CodecContext::SetCodecID>("codecID"),
    InstanceAccessor<&CodecContext::GetMediaType, &CodecContext::SetMediaType>("mediaType"),
    InstanceAccessor<&CodecContext::GetBitRate, &CodecContext::SetBitRate>("bitRate"),
    InstanceAccessor<&CodecContext::GetTimeBase, &CodecContext::SetTimeBase>("timeBase"),
    InstanceAccessor<&CodecContext::GetLevel, &CodecContext::SetLevel>("level"),
    InstanceAccessor<&CodecContext::GetProfile, &CodecContext::SetProfile>("profile"),
    InstanceAccessor<&CodecContext::GetThreadCount, &CodecContext::SetThreadCount>("threadCount"),
    InstanceAccessor<&CodecContext::GetThreadType, &CodecContext::SetThreadType>("threadType"),
    InstanceAccessor<&CodecContext::GetFlags, &CodecContext::SetFlags>("flags"),
    InstanceAccessor<&CodecContext::GetFlags2, &CodecContext::SetFlags2>("flags2"),
    InstanceAccessor<&CodecContext::GetExtraData, &CodecContext::SetExtraData>("extraData"),
    
    // Properties - Video
    InstanceAccessor<&CodecContext::GetWidth, &CodecContext::SetWidth>("width"),
    InstanceAccessor<&CodecContext::GetHeight, &CodecContext::SetHeight>("height"),
    InstanceAccessor<&CodecContext::GetPixelFormat, &CodecContext::SetPixelFormat>("pixelFormat"),
    InstanceAccessor<&CodecContext::GetFramerate, &CodecContext::SetFramerate>("framerate"),
    InstanceAccessor<&CodecContext::GetSampleAspectRatio, &CodecContext::SetSampleAspectRatio>("sampleAspectRatio"),
    InstanceAccessor<&CodecContext::GetGopSize, &CodecContext::SetGopSize>("gopSize"),
    InstanceAccessor<&CodecContext::GetMaxBFrames, &CodecContext::SetMaxBFrames>("maxBFrames"),
    InstanceAccessor<&CodecContext::GetColorSpace, &CodecContext::SetColorSpace>("colorSpace"),
    InstanceAccessor<&CodecContext::GetColorRange, &CodecContext::SetColorRange>("colorRange"),
    
    // Properties - Audio
    InstanceAccessor<&CodecContext::GetSampleRate, &CodecContext::SetSampleRate>("sampleRate"),
    InstanceAccessor<&CodecContext::GetSampleFormat, &CodecContext::SetSampleFormat>("sampleFormat"),
    InstanceAccessor<&CodecContext::GetChannelLayout, &CodecContext::SetChannelLayout>("channelLayout"),
    InstanceAccessor<&CodecContext::GetChannels>("channels"),
    InstanceAccessor<&CodecContext::GetFrameSize, &CodecContext::SetFrameSize>("frameSize"),
    
    // Properties - Rate Control
    InstanceAccessor<&CodecContext::GetRateControlMaxRate, &CodecContext::SetRateControlMaxRate>("rcMaxRate"),
    InstanceAccessor<&CodecContext::GetRateControlMinRate, &CodecContext::SetRateControlMinRate>("rcMinRate"),
    InstanceAccessor<&CodecContext::GetRateControlBufferSize, &CodecContext::SetRateControlBufferSize>("rcBufferSize"),
    
    // Utility
    InstanceAccessor<&CodecContext::IsEncoder>("isEncoder"),
    InstanceAccessor<&CodecContext::IsDecoder>("isDecoder"),
    
    // Symbol.dispose
    InstanceMethod<&CodecContext::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("CodecContext", func);
  return exports;
}

CodecContext::CodecContext(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<CodecContext>(info) {
  Napi::Env env = info.Env();
  
  if (info.Length() > 0 && info[0].IsObject()) {
    // Initialize from existing codec
    // This will be implemented when we add Codec support
  } else {
    // Allocate new context
    AVCodecContext* ctx = avcodec_alloc_context3(nullptr);
    if (!ctx) {
      Napi::Error::New(env, "Failed to allocate codec context").ThrowAsJavaScriptException();
      return;
    }
    context_.Reset(ctx);
  }
}

void CodecContext::SetContext(AVCodecContext* ctx) {
  context_.Reset(ctx);
}

// Lifecycle
Napi::Value CodecContext::Open(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // TODO: Add dictionary support for options
  int ret = avcodec_open2(context_.Get(), context_.Get()->codec, nullptr);
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to open codec context");
  }
  
  return env.Undefined();
}

Napi::Value CodecContext::Close(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // avcodec_close is deprecated, just reset the context
  // The actual cleanup happens in the destructor via avcodec_free_context
  context_.Reset();
  
  return env.Undefined();
}

Napi::Value CodecContext::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  context_.Reset();
  return env.Undefined();
}

// Encoding/Decoding
Napi::Value CodecContext::SendPacket(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object packetObj = info[0].As<Napi::Object>();
    Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(packetObj);
    pkt = packet->GetPacket();
  }
  
  int ret = avcodec_send_packet(context_.Get(), pkt);
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to send packet to decoder");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value CodecContext::ReceiveFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Frame object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object frameObj = info[0].As<Napi::Object>();
  Frame* frame = Napi::ObjectWrap<Frame>::Unwrap(frameObj);
  
  int ret = avcodec_receive_frame(context_.Get(), frame->GetFrame());
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to receive frame from decoder");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value CodecContext::SendFrame(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVFrame* frame = nullptr;
  if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
    Napi::Object frameObj = info[0].As<Napi::Object>();
    Frame* f = Napi::ObjectWrap<Frame>::Unwrap(frameObj);
    frame = f->GetFrame();
  }
  
  int ret = avcodec_send_frame(context_.Get(), frame);
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to send frame to encoder");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value CodecContext::ReceivePacket(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Packet object required").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object packetObj = info[0].As<Napi::Object>();
  Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(packetObj);
  
  int ret = avcodec_receive_packet(context_.Get(), packet->GetPacket());
  if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF) {
    CheckFFmpegError(env, ret, "Failed to receive packet from encoder");
  }
  
  return Napi::Number::New(env, ret);
}

Napi::Value CodecContext::FlushBuffers(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  avcodec_flush_buffers(context_.Get());
  return env.Undefined();
}

// Properties - General
Napi::Value CodecContext::GetCodecID(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->codec_id);
}

void CodecContext::SetCodecID(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->codec_id = static_cast<AVCodecID>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecContext::GetMediaType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->codec_type);
}

void CodecContext::SetMediaType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->codec_type = static_cast<AVMediaType>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecContext::GetBitRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->bit_rate);
}

void CodecContext::SetBitRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_.Get()->bit_rate = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value CodecContext::GetTimeBase(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return RationalToJS(env, context_.Get()->time_base);
}

void CodecContext::SetTimeBase(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->time_base = JSToRational(value.As<Napi::Object>());
}

Napi::Value CodecContext::GetLevel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->level);
}

void CodecContext::SetLevel(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->level = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetProfile(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->profile);
}

void CodecContext::SetProfile(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->profile = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetThreadCount(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->thread_count);
}

void CodecContext::SetThreadCount(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->thread_count = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetThreadType(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->thread_type);
}

void CodecContext::SetThreadType(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->thread_type = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->flags);
}

void CodecContext::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->flags = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetFlags2(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->flags2);
}

void CodecContext::SetFlags2(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->flags2 = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetExtraData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVCodecContext* ctx = context_.Get();
  
  if (ctx->extradata && ctx->extradata_size > 0) {
    return Napi::Buffer<uint8_t>::Copy(env, ctx->extradata, ctx->extradata_size);
  }
  
  return env.Null();
}

void CodecContext::SetExtraData(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  AVCodecContext* ctx = context_.Get();
  
  if (value.IsNull() || value.IsUndefined()) {
    if (ctx->extradata) {
      av_free(ctx->extradata);
      ctx->extradata = nullptr;
      ctx->extradata_size = 0;
    }
    return;
  }
  
  if (!value.IsBuffer()) {
    Napi::TypeError::New(env, "Extra data must be a Buffer").ThrowAsJavaScriptException();
    return;
  }
  
  Napi::Buffer<uint8_t> buffer = value.As<Napi::Buffer<uint8_t>>();
  size_t size = buffer.Length();
  
  // Free old extra data
  if (ctx->extradata) {
    av_free(ctx->extradata);
  }
  
  // Allocate and copy new extra data
  ctx->extradata = static_cast<uint8_t*>(av_mallocz(size + AV_INPUT_BUFFER_PADDING_SIZE));
  if (!ctx->extradata) {
    Napi::Error::New(env, "Failed to allocate extra data").ThrowAsJavaScriptException();
    return;
  }
  
  memcpy(ctx->extradata, buffer.Data(), size);
  ctx->extradata_size = size;
}

// Properties - Video
Napi::Value CodecContext::GetWidth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->width);
}

void CodecContext::SetWidth(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->width = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetHeight(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->height);
}

void CodecContext::SetHeight(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->height = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetPixelFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->pix_fmt);
}

void CodecContext::SetPixelFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->pix_fmt = static_cast<AVPixelFormat>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecContext::GetFramerate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return RationalToJS(env, context_.Get()->framerate);
}

void CodecContext::SetFramerate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->framerate = JSToRational(value.As<Napi::Object>());
}

Napi::Value CodecContext::GetSampleAspectRatio(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return RationalToJS(env, context_.Get()->sample_aspect_ratio);
}

void CodecContext::SetSampleAspectRatio(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->sample_aspect_ratio = JSToRational(value.As<Napi::Object>());
}

Napi::Value CodecContext::GetGopSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->gop_size);
}

void CodecContext::SetGopSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->gop_size = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetMaxBFrames(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->max_b_frames);
}

void CodecContext::SetMaxBFrames(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->max_b_frames = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetColorSpace(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->colorspace);
}

void CodecContext::SetColorSpace(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->colorspace = static_cast<AVColorSpace>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecContext::GetColorRange(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->color_range);
}

void CodecContext::SetColorRange(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->color_range = static_cast<AVColorRange>(value.As<Napi::Number>().Int32Value());
}

// Properties - Audio
Napi::Value CodecContext::GetSampleRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->sample_rate);
}

void CodecContext::SetSampleRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->sample_rate = value.As<Napi::Number>().Int32Value();
}

Napi::Value CodecContext::GetSampleFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->sample_fmt);
}

void CodecContext::SetSampleFormat(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->sample_fmt = static_cast<AVSampleFormat>(value.As<Napi::Number>().Int32Value());
}

Napi::Value CodecContext::GetChannelLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVCodecContext* ctx = context_.Get();
  
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("nbChannels", Napi::Number::New(env, ctx->ch_layout.nb_channels));
  obj.Set("order", Napi::Number::New(env, ctx->ch_layout.order));
  obj.Set("mask", Napi::BigInt::New(env, ctx->ch_layout.u.mask));
  
  return obj;
}

void CodecContext::SetChannelLayout(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (!value.IsObject()) {
    return;
  }
  
  Napi::Object obj = value.As<Napi::Object>();
  AVCodecContext* ctx = context_.Get();
  
  if (obj.Has("nbChannels")) {
    ctx->ch_layout.nb_channels = obj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  if (obj.Has("order")) {
    ctx->ch_layout.order = static_cast<AVChannelOrder>(obj.Get("order").As<Napi::Number>().Int32Value());
  }
  if (obj.Has("mask")) {
    bool lossless;
    ctx->ch_layout.u.mask = obj.Get("mask").As<Napi::BigInt>().Uint64Value(&lossless);
  }
}

Napi::Value CodecContext::GetChannels(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->ch_layout.nb_channels);
}

Napi::Value CodecContext::GetFrameSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->frame_size);
}

void CodecContext::SetFrameSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->frame_size = value.As<Napi::Number>().Int32Value();
}

// Properties - Rate Control
Napi::Value CodecContext::GetRateControlMaxRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->rc_max_rate);
}

void CodecContext::SetRateControlMaxRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_.Get()->rc_max_rate = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value CodecContext::GetRateControlMinRate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, context_.Get()->rc_min_rate);
}

void CodecContext::SetRateControlMinRate(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  context_.Get()->rc_min_rate = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value CodecContext::GetRateControlBufferSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, context_.Get()->rc_buffer_size);
}

void CodecContext::SetRateControlBufferSize(const Napi::CallbackInfo& info, const Napi::Value& value) {
  context_.Get()->rc_buffer_size = value.As<Napi::Number>().Int32Value();
}

// Utility
Napi::Value CodecContext::IsEncoder(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const AVCodec* codec = context_.Get()->codec;
  return Napi::Boolean::New(env, codec && av_codec_is_encoder(codec));
}

Napi::Value CodecContext::IsDecoder(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const AVCodec* codec = context_.Get()->codec;
  return Napi::Boolean::New(env, codec && av_codec_is_decoder(codec));
}

}  // namespace ffmpeg