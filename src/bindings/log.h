#ifndef FFMPEG_LOG_H
#define FFMPEG_LOG_H

#include <napi.h>

namespace ffmpeg {

void InitLog(Napi::Env env, Napi::Object exports);

} // namespace ffmpeg

#endif // FFMPEG_LOG_H