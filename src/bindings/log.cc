// FFmpeg logging implementation for Node.js bindings

#include <napi.h>
#include <mutex>
#include <string>
#include <cstdio>
#include <cstdarg>

extern "C" {
#include <libavutil/log.h>
}

namespace ffmpeg {

// Structure to pass log data to JavaScript
struct LogData {
  int level;
  std::string message;
};

// Global callback reference
static Napi::ThreadSafeFunction tsfn;
static std::mutex callback_mutex;
static bool callback_active = false;

// FFmpeg log callback that forwards to Node.js
static void LogCallback(void* avcl, int level, const char* fmt, va_list vl) {
  // Check log level first (like go-astiav does)
  if (level > av_log_get_level()) {
    return;
  }
  
  // Quick check without lock
  if (!callback_active) {
    return;
  }
  
  // Format the message
  char buffer[2048];
  vsnprintf(buffer, sizeof(buffer), fmt, vl);
  
  // Remove trailing newline if present
  std::string message(buffer);
  if (!message.empty() && message.back() == '\n') {
    message.pop_back();
  }
  
  // Create log data
  auto* data = new LogData{level, message};
  
  // Call JavaScript callback asynchronously
  // BlockingCall would deadlock, NonBlockingCall might drop messages, so we use NonBlockingCall
  napi_status status = tsfn.NonBlockingCall(data, [](Napi::Env env, Napi::Function jsCallback, LogData* data) {
    if (data != nullptr) {
      // Call the JavaScript callback with proper error handling
      napi_value result;
      napi_value args[2];
      args[0] = Napi::Number::New(env, data->level);
      args[1] = Napi::String::New(env, data->message);
      
      // Use napi_make_callback for proper async context
      napi_status status = napi_make_callback(
        env,
        nullptr,  // async_context
        env.Global(),
        jsCallback,
        2,
        args,
        &result
      );
      
      // If there was an exception, clear it
      if (status != napi_ok) {
        bool has_exception = false;
        napi_is_exception_pending(env, &has_exception);
        if (has_exception) {
          napi_value exception;
          napi_get_and_clear_last_exception(env, &exception);
        }
      }
      
      delete data;
    }
  });
  
  // If the call failed (queue full), clean up
  if (status != napi_ok) {
    delete data;
  }
}

class Log {
public:
  // Set the log level
  static Napi::Value SetLogLevel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
      Napi::TypeError::New(env, "Expected number argument").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    int level = info[0].As<Napi::Number>().Int32Value();
    av_log_set_level(level);
    
    return env.Undefined();
  }
  
  // Get the current log level
  static Napi::Value GetLogLevel(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int level = av_log_get_level();
    return Napi::Number::New(env, level);
  }
  
  // Set the log callback
  static Napi::Value SetLogCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    std::lock_guard<std::mutex> lock(callback_mutex);
    
    // If null or undefined is passed, remove the callback
    if (info.Length() < 1 || info[0].IsNull() || info[0].IsUndefined()) {
      if (callback_active) {
        callback_active = false;
        av_log_set_callback(av_log_default_callback);
        // Abort the thread-safe function to ensure it stops
        tsfn.Abort();
      }
      return env.Undefined();
    }
    
    // Validate callback function
    if (!info[0].IsFunction()) {
      Napi::TypeError::New(env, "Expected function argument").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    
    // Clean up previous callback if any
    if (callback_active) {
      callback_active = false;
      tsfn.Abort();
    }
    
    // Create new thread-safe function
    tsfn = Napi::ThreadSafeFunction::New(
      env,
      info[0].As<Napi::Function>(),
      "FFmpegLogCallback",
      0,  // Unlimited queue
      1   // One thread
    );
    
    // Activate callback
    callback_active = true;
    
    // Set the FFmpeg callback
    av_log_set_callback(LogCallback);
    
    return env.Undefined();
  }
  
  // Initialize exports
  static void Init(Napi::Env env, Napi::Object exports) {
    exports.Set("setLogLevel", Napi::Function::New(env, SetLogLevel));
    exports.Set("getLogLevel", Napi::Function::New(env, GetLogLevel));
    exports.Set("setLogCallback", Napi::Function::New(env, SetLogCallback));
  }
};

} // namespace ffmpeg

// Export the initialization function
namespace ffmpeg {
  void InitLog(Napi::Env env, Napi::Object exports) {
    Log::Init(env, exports);
  }
}