#ifndef FFMPEG_CODEC_PARSER_H
#define FFMPEG_CODEC_PARSER_H

#include <napi.h>

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace ffmpeg {

class CodecParser : public Napi::ObjectWrap<CodecParser> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  
  CodecParser(const Napi::CallbackInfo& info);
  ~CodecParser();
  
  AVCodecParserContext* Get() { return parser_ctx_; }

private:
  static Napi::FunctionReference constructor;

  AVCodecParserContext* parser_ctx_ = nullptr;

  Napi::Value InitParser(const Napi::CallbackInfo& info);
  Napi::Value Parse2(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_CODEC_PARSER_H