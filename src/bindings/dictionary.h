#ifndef FFMPEG_DICTIONARY_H
#define FFMPEG_DICTIONARY_H

#include <napi.h>
#include "common.h"

extern "C" {
#include <libavutil/dict.h>
#include <libavutil/mem.h>
}

namespace ffmpeg {

class Dictionary : public Napi::ObjectWrap<Dictionary> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Dictionary(const Napi::CallbackInfo& info);
  ~Dictionary();

  AVDictionary* Get() { return dict_; }
  void SetOwned(AVDictionary* dict) { 
    // Free old dictionary if exists
    if (dict_ && !is_freed_) {
      av_dict_free(&dict_);
    }
    dict_ = dict;
    is_freed_ = false;
  }
  
  // For operations that need direct pointer access (like av_dict_set)
  AVDictionary** GetDirectPtr() { return &dict_; }
  
private:
  friend class FormatContext;
  friend class Stream;

  static Napi::FunctionReference constructor;

  AVDictionary* dict_ = nullptr;
  bool is_freed_ = false;

  Napi::Value Alloc(const Napi::CallbackInfo& info);
  Napi::Value Free(const Napi::CallbackInfo& info);
  Napi::Value Copy(const Napi::CallbackInfo& info);
  Napi::Value Set(const Napi::CallbackInfo& info);
  Napi::Value Get(const Napi::CallbackInfo& info);
  Napi::Value Count(const Napi::CallbackInfo& info);
  Napi::Value GetAll(const Napi::CallbackInfo& info);
  Napi::Value ParseString(const Napi::CallbackInfo& info);
  Napi::Value GetString(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);
};

} // namespace ffmpeg

#endif // FFMPEG_DICTIONARY_H