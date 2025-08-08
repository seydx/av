#include <napi.h>
#include "common.h"
#include "packet.h"
#include "frame.h"
#include "codec.h"
#include "codec_context.h"
#include "codec_parameters.h"
#include "format_context.h"
#include "stream.h"
#include "dictionary.h"
#include "input_format.h"
#include "output_format.h"
#include "filter.h"
#include "filter_context.h"
#include "filter_graph.h"
#include "software_scale_context.h"
#include "software_resample_context.h"
#include "hardware_device_context.h"
#include "hardware_frames_context.h"
#include "audio_fifo.h"
#include "option.h"
#include "bit_stream_filter.h"

extern "C" {
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>
#include <libavutil/log.h>
}

namespace ffmpeg {

// Global initialization
class FFmpegInit {
 public:
  FFmpegInit() {
    // Initialize FFmpeg libraries (not needed in FFmpeg 4.0+, but harmless)
    // av_register_all() is deprecated and removed in newer versions
    
    // Set log level
    av_log_set_level(AV_LOG_ERROR);
  }
  
  static void SetLogLevel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
      throw Napi::TypeError::New(env, "Expected number argument");
    }
    
    int level = info[0].As<Napi::Number>().Int32Value();
    av_log_set_level(level);
  }
  
  static Napi::Value GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object versions = Napi::Object::New(env);
    
    versions.Set("avcodec", Napi::Number::New(env, avcodec_version()));
    versions.Set("avformat", Napi::Number::New(env, avformat_version()));
    versions.Set("avutil", Napi::Number::New(env, avutil_version()));
    versions.Set("swscale", Napi::Number::New(env, swscale_version()));
    versions.Set("swresample", Napi::Number::New(env, swresample_version()));
    
    return versions;
  }
  
  static Napi::Value GetConfiguration(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object config = Napi::Object::New(env);
    
    config.Set("avcodec", Napi::String::New(env, avcodec_configuration()));
    config.Set("avformat", Napi::String::New(env, avformat_configuration()));
    config.Set("avutil", Napi::String::New(env, avutil_configuration()));
    config.Set("swscale", Napi::String::New(env, swscale_configuration()));
    config.Set("swresample", Napi::String::New(env, swresample_configuration()));
    
    return config;
  }
  
  static Napi::Value GetLicense(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, avcodec_license());
  }
};

// Static initialization
static FFmpegInit ffmpeg_init;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Export utility functions
  exports.Set("setLogLevel", Napi::Function::New(env, FFmpegInit::SetLogLevel));
  exports.Set("getVersion", Napi::Function::New(env, FFmpegInit::GetVersion));
  exports.Set("getConfiguration", Napi::Function::New(env, FFmpegInit::GetConfiguration));
  exports.Set("getLicense", Napi::Function::New(env, FFmpegInit::GetLicense));
  
  // Initialize and export wrapper classes
  // Basic types first
  Dictionary::Init(env, exports);
  Packet::Init(env, exports);
  Frame::Init(env, exports);
  
  // Codec types
  Codec::Init(env, exports);
  CodecParameters::Init(env, exports);
  CodecContext::Init(env, exports);
  
  // BitStream Filter
  BitStreamFilter::Init(env, exports);
  BitStreamFilterContext::Init(env, exports);
  
  // Format types
  InputFormat::Init(env, exports);
  OutputFormat::Init(env, exports);
  Stream::Init(env, exports);
  FormatContext::Init(env, exports);
  
  // Filter types
  Filter::Init(env, exports);
  FilterContext::Init(env, exports);
  FilterGraph::Init(env, exports);
  
  // Software scaling/resampling
  SoftwareScaleContext::Init(env, exports);
  SoftwareResampleContext::Init(env, exports);
  
  // Hardware acceleration
  HardwareDeviceContext::Init(env, exports);
  HardwareFramesContext::Init(env, exports);
  
  // Audio FIFO
  AudioFifo::Init(env, exports);
  
  // Options
  Option::Init(env, exports);
  Options::Init(env, exports);

  return exports;
}

NODE_API_MODULE(ffmpeg, Init)

}  // namespace ffmpeg