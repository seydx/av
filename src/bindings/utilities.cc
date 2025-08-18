#include "utilities.h"
#include <cstring>

namespace ffmpeg {

Napi::Object Utilities::Init(Napi::Env env, Napi::Object exports) {
  // Export static functions directly
  exports.Set("avGetBytesPerSample", Napi::Function::New(env, GetBytesPerSample));
  exports.Set("avGetSampleFmtName", Napi::Function::New(env, GetSampleFmtName));
  exports.Set("avGetPackedSampleFmt", Napi::Function::New(env, GetPackedSampleFmt));
  exports.Set("avGetPlanarSampleFmt", Napi::Function::New(env, GetPlanarSampleFmt));
  exports.Set("avSampleFmtIsPlanar", Napi::Function::New(env, SampleFmtIsPlanar));
  
  exports.Set("avGetPixFmtName", Napi::Function::New(env, GetPixFmtName));
  exports.Set("avGetPixFmtFromName", Napi::Function::New(env, GetPixFmtFromName));
  exports.Set("avIsHardwarePixelFormat", Napi::Function::New(env, IsHardwarePixelFormat));
  
  exports.Set("avGetMediaTypeString", Napi::Function::New(env, GetMediaTypeString));
  
  exports.Set("avImageAlloc", Napi::Function::New(env, ImageAlloc));
  exports.Set("avImageCopy2", Napi::Function::New(env, ImageCopy2));
  exports.Set("avImageGetBufferSize", Napi::Function::New(env, ImageGetBufferSize));
  exports.Set("avImageCopyToBuffer", Napi::Function::New(env, ImageCopyToBuffer));
  
  exports.Set("avTs2Str", Napi::Function::New(env, Ts2Str));
  exports.Set("avTs2TimeStr", Napi::Function::New(env, Ts2TimeStr));
  exports.Set("avCompareTs", Napi::Function::New(env, CompareTs));
  exports.Set("avRescaleQ", Napi::Function::New(env, RescaleQ));
  exports.Set("avRescaleRnd", Napi::Function::New(env, RescaleRnd));

  exports.Set("avUsleep", Napi::Function::New(env, Usleep));
  
  exports.Set("avSamplesAlloc", Napi::Function::New(env, SamplesAlloc));
  exports.Set("avSamplesGetBufferSize", Napi::Function::New(env, SamplesGetBufferSize));
  
  exports.Set("avChannelLayoutDescribe", Napi::Function::New(env, ChannelLayoutDescribe));

  return exports;
}

Utilities::Utilities(const Napi::CallbackInfo& info) 
  : Napi::ObjectWrap<Utilities>(info) {
  // No instance creation needed for utilities
}

// === Sample format utilities ===

Napi::Value Utilities::GetBytesPerSample(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected sample format as number").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  int sample_fmt = info[0].As<Napi::Number>().Int32Value();
  int bytes = av_get_bytes_per_sample(static_cast<AVSampleFormat>(sample_fmt));
  
  return Napi::Number::New(env, bytes);
}

Napi::Value Utilities::GetSampleFmtName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected sample format as number").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int sample_fmt = info[0].As<Napi::Number>().Int32Value();
  const char* name = av_get_sample_fmt_name(static_cast<AVSampleFormat>(sample_fmt));
  
  if (name) {
    return Napi::String::New(env, name);
  }
  return env.Null();
}

Napi::Value Utilities::GetPackedSampleFmt(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected sample format as number").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  int sample_fmt = info[0].As<Napi::Number>().Int32Value();
  AVSampleFormat packed = av_get_packed_sample_fmt(static_cast<AVSampleFormat>(sample_fmt));
  
  return Napi::Number::New(env, static_cast<int>(packed));
}

Napi::Value Utilities::GetPlanarSampleFmt(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected sample format as number").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }
  
  int sample_fmt = info[0].As<Napi::Number>().Int32Value();
  AVSampleFormat planar = av_get_planar_sample_fmt(static_cast<AVSampleFormat>(sample_fmt));
  
  return Napi::Number::New(env, static_cast<int>(planar));
}

Napi::Value Utilities::SampleFmtIsPlanar(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected sample format as number").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }
  
  int sample_fmt = info[0].As<Napi::Number>().Int32Value();
  int is_planar = av_sample_fmt_is_planar(static_cast<AVSampleFormat>(sample_fmt));
  
  return Napi::Boolean::New(env, is_planar != 0);
}

// === Pixel format utilities ===

Napi::Value Utilities::GetPixFmtName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected pixel format as number").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int pix_fmt = info[0].As<Napi::Number>().Int32Value();
  const char* name = av_get_pix_fmt_name(static_cast<AVPixelFormat>(pix_fmt));
  
  if (name) {
    return Napi::String::New(env, name);
  }
  return env.Null();
}

Napi::Value Utilities::GetPixFmtFromName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected pixel format name as string").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AV_PIX_FMT_NONE);
  }
  
  std::string name = info[0].As<Napi::String>().Utf8Value();
  AVPixelFormat pix_fmt = av_get_pix_fmt(name.c_str());
  
  return Napi::Number::New(env, static_cast<int>(pix_fmt));
}

Napi::Value Utilities::IsHardwarePixelFormat(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected pixel format as number").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }
  
  int pix_fmt = info[0].As<Napi::Number>().Int32Value();
  const AVPixFmtDescriptor* desc = av_pix_fmt_desc_get(static_cast<AVPixelFormat>(pix_fmt));
  
  if (!desc) {
    return Napi::Boolean::New(env, false);
  }
  
  // Check if the pixel format has the HWACCEL flag
  bool is_hw = (desc->flags & AV_PIX_FMT_FLAG_HWACCEL) != 0;
  return Napi::Boolean::New(env, is_hw);
}

// === Media type utilities ===

Napi::Value Utilities::GetMediaTypeString(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected media type as number").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int media_type = info[0].As<Napi::Number>().Int32Value();
  const char* name = av_get_media_type_string(static_cast<AVMediaType>(media_type));
  
  if (name) {
    return Napi::String::New(env, name);
  }
  return env.Null();
}

// === Image utilities ===

Napi::Value Utilities::ImageAlloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (width, height, pixFmt, align)").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int width = info[0].As<Napi::Number>().Int32Value();
  int height = info[1].As<Napi::Number>().Int32Value();
  int pix_fmt = info[2].As<Napi::Number>().Int32Value();
  int align = info[3].As<Napi::Number>().Int32Value();
  
  uint8_t* pointers[4] = {nullptr};
  int linesizes[4] = {0};
  
  int ret = av_image_alloc(pointers, linesizes, width, height, 
                           static_cast<AVPixelFormat>(pix_fmt), align);
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("av_image_alloc failed: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Create result object with buffer and linesize info
  Napi::Object result = Napi::Object::New(env);
  result.Set("size", Napi::Number::New(env, ret));
  
  // Create buffer from allocated memory
  Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, pointers[0], ret,
    [](Napi::Env, uint8_t* data) {
      av_freep(&data);
    });
  result.Set("buffer", buffer);
  
  // Add linesizes
  Napi::Array linesizeArray = Napi::Array::New(env, 4);
  for (int i = 0; i < 4; i++) {
    linesizeArray[i] = Napi::Number::New(env, linesizes[i]);
  }
  result.Set("linesizes", linesizeArray);
  
  return result;
}

Napi::Value Utilities::ImageCopy2(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 7) {
    Napi::TypeError::New(env, "Expected 7 arguments (dstData, dstLinesizes, srcData, srcLinesizes, pixFmt, width, height)")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Parse destination data
  if (!info[0].IsArray() || !info[1].IsArray()) {
    Napi::TypeError::New(env, "dstData and dstLinesizes must be arrays").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Array dstDataArray = info[0].As<Napi::Array>();
  Napi::Array dstLinesizeArray = info[1].As<Napi::Array>();
  
  uint8_t* dst_data[4] = {nullptr};
  int dst_linesizes[4] = {0};
  
  for (uint32_t i = 0; i < 4 && i < dstDataArray.Length(); i++) {
    Napi::Value val = dstDataArray[i];
    if (val.IsBuffer()) {
      Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
      dst_data[i] = buf.Data();
    }
  }
  
  for (uint32_t i = 0; i < 4 && i < dstLinesizeArray.Length(); i++) {
    Napi::Value val = dstLinesizeArray[i];
    dst_linesizes[i] = val.As<Napi::Number>().Int32Value();
  }
  
  // Parse source data
  if (!info[2].IsArray() || !info[3].IsArray()) {
    Napi::TypeError::New(env, "srcData and srcLinesizes must be arrays").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  Napi::Array srcDataArray = info[2].As<Napi::Array>();
  Napi::Array srcLinesizeArray = info[3].As<Napi::Array>();
  
  uint8_t* src_data[4] = {nullptr};
  int src_linesizes[4] = {0};
  
  for (uint32_t i = 0; i < 4 && i < srcDataArray.Length(); i++) {
    Napi::Value val = srcDataArray[i];
    if (val.IsBuffer()) {
      Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
      src_data[i] = buf.Data();
    }
  }
  
  for (uint32_t i = 0; i < 4 && i < srcLinesizeArray.Length(); i++) {
    Napi::Value val = srcLinesizeArray[i];
    src_linesizes[i] = val.As<Napi::Number>().Int32Value();
  }
  
  int pix_fmt = info[4].As<Napi::Number>().Int32Value();
  int width = info[5].As<Napi::Number>().Int32Value();
  int height = info[6].As<Napi::Number>().Int32Value();
  
  av_image_copy2(dst_data, dst_linesizes, src_data, src_linesizes,
                 static_cast<AVPixelFormat>(pix_fmt), width, height);
  
  return env.Undefined();
}

Napi::Value Utilities::ImageGetBufferSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (pixFmt, width, height, align)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int pix_fmt = info[0].As<Napi::Number>().Int32Value();
  int width = info[1].As<Napi::Number>().Int32Value();
  int height = info[2].As<Napi::Number>().Int32Value();
  int align = info[3].As<Napi::Number>().Int32Value();
  
  int size = av_image_get_buffer_size(static_cast<AVPixelFormat>(pix_fmt), 
                                      width, height, align);
  
  return Napi::Number::New(env, size);
}

Napi::Value Utilities::ImageCopyToBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 8) {
    Napi::TypeError::New(env, "Expected 8 arguments (dst, dstSize, srcData, srcLinesize, pixFmt, width, height, align)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  // Get destination buffer
  if (!info[0].IsBuffer()) {
    Napi::TypeError::New(env, "First argument must be a buffer").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  Napi::Buffer<uint8_t> dstBuffer = info[0].As<Napi::Buffer<uint8_t>>();
  uint8_t* dst = dstBuffer.Data();
  
  int dst_size = info[1].As<Napi::Number>().Int32Value();
  
  // Get source data planes
  if (!info[2].IsArray()) {
    Napi::TypeError::New(env, "srcData must be an array").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  Napi::Array srcDataArray = info[2].As<Napi::Array>();
  
  // Get source linesizes
  if (!info[3].IsArray()) {
    Napi::TypeError::New(env, "srcLinesize must be an array").ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  Napi::Array srcLinesizeArray = info[3].As<Napi::Array>();
  
  const uint8_t* src_data[4] = {nullptr};
  int src_linesize[4] = {0};
  
  // Fill source data pointers
  for (uint32_t i = 0; i < 4 && i < srcDataArray.Length(); i++) {
    Napi::Value val = srcDataArray[i];
    if (val.IsBuffer()) {
      Napi::Buffer<uint8_t> buf = val.As<Napi::Buffer<uint8_t>>();
      src_data[i] = buf.Data();
    }
  }
  
  // Fill source linesizes
  for (uint32_t i = 0; i < 4 && i < srcLinesizeArray.Length(); i++) {
    Napi::Value val = srcLinesizeArray[i];
    if (val.IsNumber()) {
      src_linesize[i] = val.As<Napi::Number>().Int32Value();
    }
  }
  
  int pix_fmt = info[4].As<Napi::Number>().Int32Value();
  int width = info[5].As<Napi::Number>().Int32Value();
  int height = info[6].As<Napi::Number>().Int32Value();
  int align = info[7].As<Napi::Number>().Int32Value();
  
  int ret = av_image_copy_to_buffer(dst, dst_size, src_data, src_linesize,
                                    static_cast<AVPixelFormat>(pix_fmt), 
                                    width, height, align);
  
  return Napi::Number::New(env, ret);
}

// === Timestamp utilities ===

Napi::Value Utilities::Ts2Str(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Expected timestamp").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int64_t ts;
  if (info[0].IsBigInt()) {
    bool lossless;
    ts = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  } else if (info[0].IsNull() || info[0].IsUndefined()) {
    ts = AV_NOPTS_VALUE;
  } else {
    ts = info[0].As<Napi::Number>().Int64Value();
  }
  
  char buf[AV_TS_MAX_STRING_SIZE];
  av_ts_make_string(buf, ts);
  
  return Napi::String::New(env, buf);
}

Napi::Value Utilities::Ts2TimeStr(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments (timestamp, timebase)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int64_t ts;
  if (info[0].IsBigInt()) {
    bool lossless;
    ts = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  } else if (info[0].IsNull() || info[0].IsUndefined()) {
    ts = AV_NOPTS_VALUE;
  } else {
    ts = info[0].As<Napi::Number>().Int64Value();
  }
  
  // Parse timebase as rational
  if (!info[1].IsObject()) {
    Napi::TypeError::New(env, "timebase must be an object with num and den").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object tb = info[1].As<Napi::Object>();
  AVRational time_base;
  time_base.num = tb.Get("num").As<Napi::Number>().Int32Value();
  time_base.den = tb.Get("den").As<Napi::Number>().Int32Value();
  
  char buf[AV_TS_MAX_STRING_SIZE];
  av_ts_make_time_string(buf, ts, &time_base);
  
  return Napi::String::New(env, buf);
}

Napi::Value Utilities::CompareTs(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (ts_a, tb_a, ts_b, tb_b)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse first timestamp
  int64_t ts_a;
  if (info[0].IsBigInt()) {
    bool lossless;
    ts_a = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  } else if (info[0].IsNull() || info[0].IsUndefined()) {
    ts_a = AV_NOPTS_VALUE;
  } else {
    ts_a = info[0].As<Napi::Number>().Int64Value();
  }
  
  // Parse first timebase
  AVRational tb_a = {1, 1}; // default
  if (info[1].IsNull() || info[1].IsUndefined()) {
    // Use default 1/1 for null timebase
  } else if (info[1].IsObject()) {
    Napi::Object tb_a_obj = info[1].As<Napi::Object>();
    tb_a.num = tb_a_obj.Get("num").As<Napi::Number>().Int32Value();
    tb_a.den = tb_a_obj.Get("den").As<Napi::Number>().Int32Value();
  } else {
    Napi::TypeError::New(env, "tb_a must be an object with num and den or null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse second timestamp
  int64_t ts_b;
  if (info[2].IsBigInt()) {
    bool lossless;
    ts_b = info[2].As<Napi::BigInt>().Int64Value(&lossless);
  } else if (info[2].IsNull() || info[2].IsUndefined()) {
    ts_b = AV_NOPTS_VALUE;
  } else {
    ts_b = info[2].As<Napi::Number>().Int64Value();
  }
  
  // Parse second timebase
  AVRational tb_b = {1, 1}; // default
  if (info[3].IsNull() || info[3].IsUndefined()) {
    // Use default 1/1 for null timebase
  } else if (info[3].IsObject()) {
    Napi::Object tb_b_obj = info[3].As<Napi::Object>();
    tb_b.num = tb_b_obj.Get("num").As<Napi::Number>().Int32Value();
    tb_b.den = tb_b_obj.Get("den").As<Napi::Number>().Int32Value();
  } else {
    Napi::TypeError::New(env, "tb_b must be an object with num and den or null").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  int result = av_compare_ts(ts_a, tb_a, ts_b, tb_b);
  
  return Napi::Number::New(env, result);
}

Napi::Value Utilities::RescaleQ(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3) {
    Napi::TypeError::New(env, "Expected 3 arguments (a, bq, cq)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse timestamp
  int64_t a;
  if (info[0].IsBigInt()) {
    bool lossless;
    a = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  } else if (info[0].IsNull() || info[0].IsUndefined()) {
    a = AV_NOPTS_VALUE;
  } else {
    a = info[0].As<Napi::Number>().Int64Value();
  }
  
  // Parse source timebase
  if (!info[1].IsObject()) {
    Napi::TypeError::New(env, "bq must be an object with num and den").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Object bq_obj = info[1].As<Napi::Object>();
  AVRational bq;
  bq.num = bq_obj.Get("num").As<Napi::Number>().Int32Value();
  bq.den = bq_obj.Get("den").As<Napi::Number>().Int32Value();
  
  // Parse destination timebase
  if (!info[2].IsObject()) {
    Napi::TypeError::New(env, "cq must be an object with num and den").ThrowAsJavaScriptException();
    return env.Null();
  }
  Napi::Object cq_obj = info[2].As<Napi::Object>();
  AVRational cq;
  cq.num = cq_obj.Get("num").As<Napi::Number>().Int32Value();
  cq.den = cq_obj.Get("den").As<Napi::Number>().Int32Value();
  
  int64_t result = av_rescale_q(a, bq, cq);
  
  // Return as BigInt for large values
  return Napi::BigInt::New(env, result);
}

Napi::Value Utilities::RescaleRnd(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (a, b, c, rnd)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Parse a
  int64_t a;
  if (info[0].IsBigInt()) {
    bool lossless;
    a = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  } else {
    a = info[0].As<Napi::Number>().Int64Value();
  }
  
  // Parse b
  int64_t b;
  if (info[1].IsBigInt()) {
    bool lossless;
    b = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  } else {
    b = info[1].As<Napi::Number>().Int64Value();
  }
  
  // Parse c
  int64_t c;
  if (info[2].IsBigInt()) {
    bool lossless;
    c = info[2].As<Napi::BigInt>().Int64Value(&lossless);
  } else {
    c = info[2].As<Napi::Number>().Int64Value();
  }
  
  // Parse rounding mode
  if (!info[3].IsNumber()) {
    Napi::TypeError::New(env, "rnd must be a number (AVRounding enum)")
        .ThrowAsJavaScriptException();
    return env.Null();
  }
  int rnd = info[3].As<Napi::Number>().Int32Value();
  
  int64_t result = av_rescale_rnd(a, b, c, static_cast<AVRounding>(rnd));
  
  // Return as BigInt for large values
  return Napi::BigInt::New(env, result);
}

Napi::Value Utilities::Usleep(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected microseconds as number").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  unsigned usec = info[0].As<Napi::Number>().Uint32Value();
  
  // Call FFmpeg's av_usleep function
  av_usleep(usec);
  
  return env.Undefined();
}

Napi::Value Utilities::SamplesAlloc(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (nbChannels, nbSamples, sampleFmt, align)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int nb_channels = info[0].As<Napi::Number>().Int32Value();
  int nb_samples = info[1].As<Napi::Number>().Int32Value();
  int sample_fmt = info[2].As<Napi::Number>().Int32Value();
  int align = info[3].As<Napi::Number>().Int32Value();
  
  uint8_t* audio_data[8] = {nullptr};
  int linesize = 0;
  
  int ret = av_samples_alloc(audio_data, &linesize, nb_channels, nb_samples,
                             static_cast<AVSampleFormat>(sample_fmt), align);
  
  if (ret < 0) {
    char errbuf[AV_ERROR_MAX_STRING_SIZE];
    av_strerror(ret, errbuf, sizeof(errbuf));
    Napi::Error::New(env, std::string("av_samples_alloc failed: ") + errbuf).ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Create result object with buffer and linesize info
  Napi::Object result = Napi::Object::New(env);
  result.Set("size", Napi::Number::New(env, ret));
  result.Set("linesize", Napi::Number::New(env, linesize));
  
  // Check if format is planar
  bool is_planar = av_sample_fmt_is_planar(static_cast<AVSampleFormat>(sample_fmt));
  int planes = is_planar ? nb_channels : 1;
  
  // Create array of buffers for planar formats
  Napi::Array dataArray = Napi::Array::New(env, planes);
  
  if (is_planar) {
    // For planar formats, each channel gets its own buffer
    // IMPORTANT: av_samples_alloc allocates all channels in a single block
    // Only the first pointer should be freed
    for (int i = 0; i < planes; i++) {
      if (audio_data[i]) {
        // Only attach finalizer to first buffer
        if (i == 0) {
          Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, audio_data[i], linesize,
            [](Napi::Env, uint8_t* data) {
              av_freep(&data);
            });
          dataArray[i] = buffer;
        } else {
          // For subsequent channels, create buffer without finalizer
          // as they point into the same allocation
          Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, audio_data[i], linesize,
            [](Napi::Env, uint8_t*) {
              // No-op - memory will be freed with first buffer
            });
          dataArray[i] = buffer;
        }
      }
    }
  } else {
    // For packed formats, all data is in the first buffer
    Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, audio_data[0], ret,
      [](Napi::Env, uint8_t* data) {
        av_freep(&data);
      });
    dataArray[uint32_t(0)] = buffer;
  }
  
  result.Set("data", dataArray);
  
  return result;
}

Napi::Value Utilities::SamplesGetBufferSize(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) {
    Napi::TypeError::New(env, "Expected 4 arguments (nbChannels, nbSamples, sampleFmt, align)")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, AVERROR(EINVAL));
  }
  
  int nb_channels = info[0].As<Napi::Number>().Int32Value();
  int nb_samples = info[1].As<Napi::Number>().Int32Value();
  int sample_fmt = info[2].As<Napi::Number>().Int32Value();
  int align = info[3].As<Napi::Number>().Int32Value();
  
  int linesize = 0;
  int size = av_samples_get_buffer_size(&linesize, nb_channels, nb_samples,
                                        static_cast<AVSampleFormat>(sample_fmt), align);
  
  if (size < 0) {
    return Napi::Number::New(env, size);
  }
  
  // Return object with both size and linesize
  Napi::Object result = Napi::Object::New(env);
  result.Set("size", Napi::Number::New(env, size));
  result.Set("linesize", Napi::Number::New(env, linesize));
  
  return result;
}

Napi::Value Utilities::ChannelLayoutDescribe(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected channel layout object").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  Napi::Object channelLayoutObj = info[0].As<Napi::Object>();
  
  // Create AVChannelLayout from the JS object
  AVChannelLayout ch_layout;
  memset(&ch_layout, 0, sizeof(AVChannelLayout));
  
  if (channelLayoutObj.Has("order")) {
    ch_layout.order = static_cast<AVChannelOrder>(channelLayoutObj.Get("order").As<Napi::Number>().Int32Value());
  }
  
  if (channelLayoutObj.Has("nbChannels")) {
    ch_layout.nb_channels = channelLayoutObj.Get("nbChannels").As<Napi::Number>().Int32Value();
  }
  
  if (channelLayoutObj.Has("mask")) {
    Napi::Value maskValue = channelLayoutObj.Get("mask");
    if (maskValue.IsBigInt()) {
      bool lossless;
      ch_layout.u.mask = maskValue.As<Napi::BigInt>().Uint64Value(&lossless);
    } else if (maskValue.IsNumber()) {
      ch_layout.u.mask = maskValue.As<Napi::Number>().Int64Value();
    }
  }
  
  // Describe the channel layout
  char buf[256];
  int ret = av_channel_layout_describe(&ch_layout, buf, sizeof(buf));
  
  if (ret < 0) {
    return env.Null();
  }
  
  return Napi::String::New(env, buf);
}

} // namespace ffmpeg