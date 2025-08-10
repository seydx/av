#include "packet.h"
#include <cstring>

namespace ffmpeg {

Napi::FunctionReference Packet::constructor;

Napi::Object Packet::Init(Napi::Env env, Napi::Object exports) {
  // Get Symbol.dispose
  Napi::Symbol disposeSymbol = Napi::Symbol::WellKnown(env, "dispose");
  
  Napi::Function func = DefineClass(env, "Packet", {
    // Properties
    InstanceAccessor<&Packet::GetStreamIndex, &Packet::SetStreamIndex>("streamIndex"),
    InstanceAccessor<&Packet::GetPts, &Packet::SetPts>("pts"),
    InstanceAccessor<&Packet::GetDts, &Packet::SetDts>("dts"),
    InstanceAccessor<&Packet::GetDuration, &Packet::SetDuration>("duration"),
    InstanceAccessor<&Packet::GetPos, &Packet::SetPos>("pos"),
    InstanceAccessor<&Packet::GetSize>("size"),
    InstanceAccessor<&Packet::GetFlags, &Packet::SetFlags>("flags"),
    InstanceAccessor<&Packet::GetData, &Packet::SetData>("data"),
    
    // Methods
    InstanceMethod<&Packet::RescaleTs>("rescaleTs"),
    InstanceMethod<&Packet::Clone>("clone"),
    InstanceMethod<&Packet::Unref>("unref"),
    InstanceMethod<&Packet::Free>("free"),
    InstanceMethod<&Packet::Dispose>(disposeSymbol),
  });
  
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  exports.Set("Packet", func);
  return exports;
}

Packet::Packet(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Packet>(info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = av_packet_alloc();
  if (!pkt) {
    throw Napi::Error::New(env, "Failed to allocate packet");
  }
  packet_.Reset(pkt);
  
  // Initialize to defaults
  pkt->stream_index = -1;
}

Packet::~Packet() {
  // Resource cleanup handled by PacketResource
}

Napi::Value Packet::GetStreamIndex(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, packet_.Get()->stream_index);
}

void Packet::SetStreamIndex(const Napi::CallbackInfo& info, const Napi::Value& value) {
  packet_.Get()->stream_index = value.As<Napi::Number>().Int32Value();
}

Napi::Value Packet::GetPts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, packet_.Get()->pts);
}

void Packet::SetPts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  packet_.Get()->pts = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Packet::GetDts(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, packet_.Get()->dts);
}

void Packet::SetDts(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  packet_.Get()->dts = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Packet::GetDuration(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, packet_.Get()->duration);
}

void Packet::SetDuration(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  packet_.Get()->duration = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Packet::GetPos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::BigInt::New(env, packet_.Get()->pos);
}

void Packet::SetPos(const Napi::CallbackInfo& info, const Napi::Value& value) {
  bool lossless;
  packet_.Get()->pos = value.As<Napi::BigInt>().Int64Value(&lossless);
}

Napi::Value Packet::GetSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, packet_.Get()->size);
}

Napi::Value Packet::GetFlags(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Number::New(env, packet_.Get()->flags);
}

void Packet::SetFlags(const Napi::CallbackInfo& info, const Napi::Value& value) {
  packet_.Get()->flags = value.As<Napi::Number>().Int32Value();
}

Napi::Value Packet::GetData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  AVPacket* pkt = packet_.Get();
  
  if (!pkt->data || pkt->size <= 0) {
    return env.Null();
  }
  
  // Create a buffer from packet data (copy)
  return Napi::Buffer<uint8_t>::Copy(env, pkt->data, pkt->size);
}

void Packet::SetData(const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();
  AVPacket* pkt = packet_.Get();
  
  // Handle null case - clear packet data
  if (value.IsNull() || value.IsUndefined()) {
    av_packet_unref(pkt);
    return;
  }
  
  if (!value.IsBuffer()) {
    throw Napi::TypeError::New(env, "Expected Buffer or null");
  }
  
  Napi::Buffer<uint8_t> buffer = value.As<Napi::Buffer<uint8_t>>();
  
  // Free existing data
  av_packet_unref(pkt);
  
  // Allocate new buffer and copy data
  int ret = av_new_packet(pkt, buffer.Length());
  if (ret < 0) {
    CheckFFmpegError(env, ret, "Failed to allocate packet data");
    return;
  }
  
  std::memcpy(pkt->data, buffer.Data(), buffer.Length());
}

Napi::Value Packet::RescaleTs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
    throw Napi::TypeError::New(env, "Expected two Rational objects");
  }
  
  AVRational src = JSToRational(info[0].As<Napi::Object>());
  AVRational dst = JSToRational(info[1].As<Napi::Object>());
  
  av_packet_rescale_ts(packet_.Get(), src, dst);
  
  return env.Undefined();
}

Napi::Value Packet::Clone(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* newPkt = av_packet_clone(packet_.Get());
  if (!newPkt) {
    throw Napi::Error::New(env, "Failed to clone packet");
  }
  
  // Create new JS Packet instance
  Napi::Object instance = constructor.New({});
  Packet* packet = Napi::ObjectWrap<Packet>::Unwrap(instance);
  packet->SetPacket(newPkt);
  
  return instance;
}

Napi::Value Packet::Unref(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  AVPacket* pkt = packet_.Get();
  if (pkt) {
    av_packet_unref(pkt);
  }
  
  return env.Undefined();
}

Napi::Value Packet::Free(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  packet_.Reset();
  return env.Undefined();
}

Napi::Value Packet::Dispose(const Napi::CallbackInfo& info) {
  return Free(info);
}

void Packet::SetPacket(AVPacket* pkt) {
  packet_.Reset(pkt);
}

}  // namespace ffmpeg