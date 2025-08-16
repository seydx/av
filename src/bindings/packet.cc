#include "packet.h"

namespace ffmpeg {

Napi::FunctionReference Packet::constructor;

// === Init ===

Napi::Object Packet::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(env, "Packet", {
    // Lifecycle
    InstanceMethod<&Packet::Alloc>("alloc"),
    InstanceMethod<&Packet::Free>("free"),
    InstanceMethod<&Packet::Ref>("ref"),
    InstanceMethod<&Packet::Unref>("unref"),
    InstanceMethod<&Packet::Clone>("clone"),
    InstanceMethod<&Packet::RescaleTs>("rescaleTs"),
    InstanceMethod<&Packet::MakeRefcounted>("makeRefcounted"),
    InstanceMethod<&Packet::MakeWritable>("makeWritable"),
    
    // Properties
    InstanceAccessor<&Packet::GetStreamIndex, &Packet::SetStreamIndex>("streamIndex"),
    InstanceAccessor<&Packet::GetPts, &Packet::SetPts>("pts"),
    InstanceAccessor<&Packet::GetDts, &Packet::SetDts>("dts"),
    InstanceAccessor<&Packet::GetDuration, &Packet::SetDuration>("duration"),
    InstanceAccessor<&Packet::GetPos, &Packet::SetPos>("pos"),
    InstanceAccessor<&Packet::GetSize>("size"),
    InstanceAccessor<&Packet::GetFlags, &Packet::SetFlags>("flags"),
    InstanceAccessor<&Packet::GetData, &Packet::SetData>("data"),
    InstanceAccessor<&Packet::GetIsKeyframe, &Packet::SetIsKeyframe>("isKeyframe"),
    
    // Utility
    InstanceMethod<&Packet::Dispose>(Napi::Symbol::WellKnown(env, "dispose")),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  
  exports.Set("Packet", func);
  return exports;
}

// === Lifecycle ===

Packet::Packet(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<Packet>(info) {
  // Constructor does nothing - user must explicitly call alloc()
}

Packet::~Packet() {
  // Manual cleanup if not already done
  if (!is_freed_ && packet_) {
    av_packet_free(&packet_);
    packet_ = nullptr;
  }
}

// === Methods ===

Napi::Value Packet::Alloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = av_packet_alloc();
  if (!pkt) {
    Napi::Error::New(env, "Failed to allocate packet (ENOMEM)").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Free old packet if exists
  if (packet_ && !is_freed_) {
    av_packet_free(&packet_);
  }
  
  packet_ = pkt;
  is_freed_ = false;
  return env.Undefined();
}

Napi::Value Packet::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (packet_ && !is_freed_) {
    av_packet_free(&packet_);
    packet_ = nullptr;
    is_freed_ = true;
  }
  
  return env.Undefined();
}

Napi::Value Packet::Ref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Source packet required").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  Packet* src = UnwrapNativeObject<Packet>(env, info[0], "Packet");
  if (!src || !src->Get()) {
    Napi::TypeError::New(env, "Invalid source packet").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_packet_ref(packet_, src->Get());
  return Napi::Number::New(env, ret);
}

Napi::Value Packet::Unref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (packet_) {
    av_packet_unref(packet_);
  }
  
  return env.Undefined();
}

Napi::Value Packet::Clone(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return env.Null();
  }
  
  AVPacket* cloned = av_packet_clone(packet_);
  if (!cloned) {
    return env.Null();
  }
  
  // Create new Packet object
  Napi::Object newPacket = constructor.New({});
  Packet* wrapper = Napi::ObjectWrap<Packet>::Unwrap(newPacket);
  wrapper->packet_ = cloned;
  wrapper->is_freed_ = false;
  
  return newPacket;
}

Napi::Value Packet::RescaleTs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return env.Undefined();
  }
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Source and destination timebases required").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  AVRational src_tb = JSToRational(info[0].As<Napi::Object>());
  AVRational dst_tb = JSToRational(info[1].As<Napi::Object>());
  
  av_packet_rescale_ts(packet_, src_tb, dst_tb);
  
  return env.Undefined();
}

Napi::Value Packet::MakeRefcounted(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_packet_make_refcounted(packet_);
  return Napi::Number::New(env, ret);
}

Napi::Value Packet::MakeWritable(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int ret = av_packet_make_writable(packet_);
  return Napi::Number::New(env, ret);
}

// === Properties ===

Napi::Value Packet::GetStreamIndex(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::Number::New(env, -1);
  }
  return Napi::Number::New(env, packet_->stream_index);
}

void Packet::SetStreamIndex(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    packet_->stream_index = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Packet::GetPts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::BigInt::New(env, AV_NOPTS_VALUE);
  }
  return Napi::BigInt::New(env, packet_->pts);
}

void Packet::SetPts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    bool lossless;
    packet_->pts = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Packet::GetDts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::BigInt::New(env, AV_NOPTS_VALUE);
  }
  return Napi::BigInt::New(env, packet_->dts);
}

void Packet::SetDts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    bool lossless;
    packet_->dts = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Packet::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::BigInt::New(env, static_cast<int64_t>(0));
  }
  return Napi::BigInt::New(env, packet_->duration);
}

void Packet::SetDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    bool lossless;
    packet_->duration = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Packet::GetPos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::BigInt::New(env, static_cast<int64_t>(-1));
  }
  return Napi::BigInt::New(env, packet_->pos);
}

void Packet::SetPos(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    bool lossless;
    packet_->pos = value.As<Napi::BigInt>().Int64Value(&lossless);
  }
}

Napi::Value Packet::GetSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, packet_->size);
}

Napi::Value Packet::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::Number::New(env, 0);
  }
  return Napi::Number::New(env, packet_->flags);
}

void Packet::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    packet_->flags = value.As<Napi::Number>().Int32Value();
  }
}

Napi::Value Packet::GetData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!packet_ || !packet_->data || packet_->size <= 0) {
    return env.Null();
  }
  
  // Return a copy of the data as Buffer
  return Napi::Buffer<uint8_t>::Copy(env, packet_->data, packet_->size);
}

void Packet::SetData(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  
  if (!packet_) {
    return;
  }
  
  if (value.IsNull() || value.IsUndefined()) {
    // Clear data
    av_packet_unref(packet_);
    return;
  }
  
  if (!value.IsBuffer()) {
    Napi::TypeError::New(env, "Data must be a Buffer").ThrowAsJavaScriptException();
    return;
  }
  
  Napi::Buffer<uint8_t> buffer = value.As<Napi::Buffer<uint8_t>>();
  size_t size = buffer.Length();
  
  // Allocate new buffer for packet
  int ret = av_new_packet(packet_, size);
  if (ret < 0) {
    Napi::Error::New(env, "Failed to allocate packet data").ThrowAsJavaScriptException();
    return;
  }
  
  // Copy data
  memcpy(packet_->data, buffer.Data(), size);
}

// === Utility ===

Napi::Value Packet::GetIsKeyframe(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!packet_) {
    return Napi::Boolean::New(env, false);
  }
  return Napi::Boolean::New(env, (packet_->flags & AV_PKT_FLAG_KEY) != 0);
}

void Packet::SetIsKeyframe(const Napi::CallbackInfo& info, const Napi::Value& value) {
  if (packet_) {
    if (value.As<Napi::Boolean>().Value()) {
      packet_->flags |= AV_PKT_FLAG_KEY;
    } else {
      packet_->flags &= ~AV_PKT_FLAG_KEY;
    }
  }
}

Napi::Value Packet::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

} // namespace ffmpeg