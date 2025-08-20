#include <napi.h>
#include "packet.h"
#include "frame.h"
#include "codec.h"
#include "codec_context.h"
#include "codec_parameters.h"
#include "codec_parser.h"
#include "format_context.h"
#include "stream.h"
#include "dictionary.h"
#include "input_format.h"
#include "output_format.h"
#include "io_context.h"
#include "error.h"
#include "software_scale_context.h"
#include "software_resample_context.h"
#include "audio_fifo.h"
#include "utilities.h"
#include "filter.h"
#include "filter_context.h"
#include "filter_graph.h"
#include "filter_inout.h"
#include "bitstream_filter.h"
#include "bitstream_filter_context.h"
#include "hardware_device_context.h"
#include "hardware_frames_context.h"
#include "log.h"

namespace ffmpeg {

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Core Types
  Packet::Init(env, exports);
  Frame::Init(env, exports);
  
  // Codec System
  Codec::Init(env, exports);
  CodecContext::Init(env, exports);
  CodecParameters::Init(env, exports);
  CodecParser::Init(env, exports);
  
  // Format System
  FormatContext::Init(env, exports);
  Stream::Init(env, exports);
  InputFormat::Init(env, exports);
  OutputFormat::Init(env, exports);
  
  // I/O System
  IOContext::Init(env, exports);
  
  // Utility
  Dictionary::Init(env, exports);
  FFmpegError::Init(env, exports);
  Utilities::Init(env, exports);
  
  // Processing
  SoftwareScaleContext::Init(env, exports);
  SoftwareResampleContext::Init(env, exports);
  AudioFifo::Init(env, exports);
  
  // Filter System
  Filter::Init(env, exports);
  FilterContext::Init(env, exports);
  FilterGraph::Init(env, exports);
  FilterInOut::Init(env, exports);
  
  // Bitstream Filters
  BitStreamFilter::Init(env, exports);
  BitStreamFilterContext::Init(env, exports);
  
  // Hardware Acceleration
  HardwareDeviceContext::Init(env, exports);
  HardwareFramesContext::Init(env, exports);
  
  // Logging
  Log::Init(env, exports);
  
  return exports;
}

NODE_API_MODULE(ffmpeg, Init)

} // namespace ffmpeg