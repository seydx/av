#pragma once

#include <napi.h>
#include <vector>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavutil/pixfmt.h>
}

namespace ffmpeg {

// Hardware configuration for codec context
struct HardwareConfig {
  AVPixelFormat preferred_format = AV_PIX_FMT_NONE;
  std::vector<AVPixelFormat> fallback_formats;
  bool require_hardware = false;
};

// Static callback function for hardware pixel format selection
AVPixelFormat SelectHardwarePixelFormat(AVCodecContext* ctx, const AVPixelFormat* pix_fmts);

// Set hardware configuration for a codec context
void SetHardwareConfig(AVCodecContext* ctx, const HardwareConfig& config);

// Clear hardware configuration
void ClearHardwareConfig(AVCodecContext* ctx);

} // namespace ffmpeg