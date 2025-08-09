#include "codec_context_hw.h"
#include <map>
#include <mutex>
#include <iostream>

namespace ffmpeg {

// Global storage for hardware configurations
static std::mutex hw_config_mutex;
static std::map<AVCodecContext*, HardwareConfig> hw_configs;

AVPixelFormat SelectHardwarePixelFormat(AVCodecContext* ctx, const AVPixelFormat* pix_fmts) {
  std::lock_guard<std::mutex> lock(hw_config_mutex);
  
  // Find configuration for this context
  auto it = hw_configs.find(ctx);
  if (it == hw_configs.end()) {
    // No configuration, use default
    return avcodec_default_get_format(ctx, pix_fmts);
  }
  
  const HardwareConfig& config = it->second;
  
  // Build list of available formats
  std::vector<AVPixelFormat> available;
  for (int i = 0; pix_fmts[i] != AV_PIX_FMT_NONE; i++) {
    available.push_back(pix_fmts[i]);
  }
  
  // Check if preferred format is available
  if (config.preferred_format != AV_PIX_FMT_NONE) {
    for (const auto& fmt : available) {
      if (fmt == config.preferred_format) {
        return config.preferred_format;
      }
    }
  }
  
  // Try fallback formats
  for (const auto& fallback : config.fallback_formats) {
    for (const auto& fmt : available) {
      if (fmt == fallback) {
        return fallback;
      }
    }
  }
  
  // If hardware is required and not found, fail
  if (config.require_hardware) {
    std::cerr << "Hardware pixel format required but not available" << std::endl;
    return AV_PIX_FMT_NONE;
  }
  
  // Use default behavior
  return avcodec_default_get_format(ctx, pix_fmts);
}

void SetHardwareConfig(AVCodecContext* ctx, const HardwareConfig& config) {
  std::lock_guard<std::mutex> lock(hw_config_mutex);
  
  // Store configuration
  hw_configs[ctx] = config;
  
  // Set the callback
  ctx->get_format = SelectHardwarePixelFormat;
}

void ClearHardwareConfig(AVCodecContext* ctx) {
  std::lock_guard<std::mutex> lock(hw_config_mutex);
  
  // Remove configuration
  hw_configs.erase(ctx);
  
  // Reset callback to default
  ctx->get_format = avcodec_default_get_format;
}

} // namespace ffmpeg