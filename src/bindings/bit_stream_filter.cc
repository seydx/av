#include "bit_stream_filter.h"
#include "packet.h"
#include "codec_parameters.h"
#include "common.h"
#include <cstring>

using namespace ffmpeg;

Napi::FunctionReference BitStreamFilter::constructor;
Napi::FunctionReference BitStreamFilterContext::constructor;

// BitStreamFilter implementation
Napi::Object BitStreamFilter::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "BitStreamFilter", {
        StaticMethod("getByName", &BitStreamFilter::GetByName),
        StaticMethod("iterate", &BitStreamFilter::Iterate),
        InstanceMethod("getName", &BitStreamFilter::GetName),
        InstanceMethod("getCodecIds", &BitStreamFilter::GetCodecIds),
        InstanceMethod("getPrivClass", &BitStreamFilter::GetPrivClass),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("BitStreamFilter", func);
    return exports;
}

BitStreamFilter::BitStreamFilter(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<BitStreamFilter>(info), bsf_(nullptr) {
    Napi::Env env = info.Env();

    if (info.Length() > 0 && info[0].IsExternal()) {
        bsf_ = static_cast<const AVBitStreamFilter*>(info[0].As<Napi::External<void>>().Data());
    }
}

Napi::Value BitStreamFilter::GetByName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();
    const AVBitStreamFilter* bsf = av_bsf_get_by_name(name.c_str());

    if (!bsf) {
        return env.Null();
    }

    Napi::External<void> external = Napi::External<void>::New(env, const_cast<AVBitStreamFilter*>(bsf));
    return constructor.New({ external });
}

Napi::Value BitStreamFilter::Iterate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    void** opaque = nullptr;
    if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
        opaque = static_cast<void**>(info[0].As<Napi::External<void*>>().Data());
    }

    const AVBitStreamFilter* bsf = av_bsf_iterate(opaque);

    if (!bsf) {
        return env.Null();
    }

    Napi::External<void> external = Napi::External<void>::New(env, const_cast<AVBitStreamFilter*>(bsf));
    return constructor.New({ external });
}

Napi::Value BitStreamFilter::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!bsf_ || !bsf_->name) {
        return env.Null();
    }

    return Napi::String::New(env, bsf_->name);
}

Napi::Value BitStreamFilter::GetCodecIds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!bsf_ || !bsf_->codec_ids) {
        return env.Null();
    }

    Napi::Array result = Napi::Array::New(env);
    size_t index = 0;
    const AVCodecID* codec_ids = bsf_->codec_ids;
    
    while (*codec_ids != AV_CODEC_ID_NONE) {
        result.Set(index++, Napi::Number::New(env, *codec_ids));
        codec_ids++;
    }

    return result;
}

Napi::Value BitStreamFilter::GetPrivClass(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!bsf_ || !bsf_->priv_class) {
        return env.Null();
    }

    // Return the class name for now
    return Napi::String::New(env, bsf_->priv_class->class_name);
}

// BitStreamFilterContext implementation
Napi::Object BitStreamFilterContext::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "BitStreamFilterContext", {
        StaticMethod("alloc", &BitStreamFilterContext::Alloc),
        InstanceMethod("init", &BitStreamFilterContext::Init),
        InstanceMethod("sendPacket", &BitStreamFilterContext::SendPacket),
        InstanceMethod("receivePacket", &BitStreamFilterContext::ReceivePacket),
        InstanceMethod("flush", &BitStreamFilterContext::Flush),
        InstanceMethod("free", &BitStreamFilterContext::Free),
        InstanceAccessor("filter", &BitStreamFilterContext::GetFilter, nullptr),
        InstanceAccessor("timeBaseIn", &BitStreamFilterContext::GetTimeBaseIn, &BitStreamFilterContext::SetTimeBaseIn),
        InstanceAccessor("timeBaseOut", &BitStreamFilterContext::GetTimeBaseOut, &BitStreamFilterContext::SetTimeBaseOut),
        InstanceAccessor("codecParameters", &BitStreamFilterContext::GetCodecParameters, nullptr),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("BitStreamFilterContext", func);
    return exports;
}

BitStreamFilterContext::BitStreamFilterContext(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<BitStreamFilterContext>(info), ctx_(nullptr), initialized_(false) {
}

BitStreamFilterContext::~BitStreamFilterContext() {
    if (ctx_) {
        av_bsf_free(&ctx_);
    }
}

Napi::Value BitStreamFilterContext::Alloc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "BitStreamFilter expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    BitStreamFilter* filter = ffmpeg::UnwrapNativeObjectRequired<BitStreamFilter>(env, info[0], "BitStreamFilter");
    if (!filter) return env.Null();
    if (!filter->GetNative()) {
        Napi::Error::New(env, "Invalid BitStreamFilter").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object instance = constructor.New({});
    BitStreamFilterContext* context = Napi::ObjectWrap<BitStreamFilterContext>::Unwrap(instance);

    int ret = av_bsf_alloc(filter->GetNative(), &context->ctx_);
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, sizeof(errbuf));
        Napi::Error::New(env, std::string("Failed to allocate BSF context: ") + errbuf).ThrowAsJavaScriptException();
        return env.Null();
    }

    return instance;
}

Napi::Value BitStreamFilterContext::Init(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_) {
        Napi::Error::New(env, "Context not allocated").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (initialized_) {
        Napi::Error::New(env, "Context already initialized").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    int ret = av_bsf_init(ctx_);
    if (ret < 0) {
        char errbuf[AV_ERROR_MAX_STRING_SIZE];
        av_strerror(ret, errbuf, sizeof(errbuf));
        Napi::Error::New(env, std::string("Failed to initialize BSF context: ") + errbuf).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    initialized_ = true;
    return env.Undefined();
}

Napi::Value BitStreamFilterContext::SendPacket(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_ || !initialized_) {
        Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    AVPacket* packet = nullptr;
    if (info.Length() > 0 && !info[0].IsNull() && !info[0].IsUndefined()) {
        if (!info[0].IsObject()) {
            Napi::TypeError::New(env, "Packet expected").ThrowAsJavaScriptException();
            return Napi::Number::New(env, -1);
        }
        Packet* packetWrapper = ffmpeg::UnwrapNativeObject<Packet>(env, info[0], "Packet");
        if (packetWrapper) {
            packet = packetWrapper->GetPacket();
        }
    }

    int ret = av_bsf_send_packet(ctx_, packet);
    return Napi::Number::New(env, ret);
}

Napi::Value BitStreamFilterContext::ReceivePacket(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_ || !initialized_) {
        Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Packet expected").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    Packet* packetWrapper = ffmpeg::UnwrapNativeObjectRequired<Packet>(env, info[0], "Packet");
    if (!packetWrapper) return Napi::Number::New(env, -1);
    AVPacket* packet = packetWrapper->GetPacket();

    int ret = av_bsf_receive_packet(ctx_, packet);
    return Napi::Number::New(env, ret);
}

Napi::Value BitStreamFilterContext::Flush(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_ || !initialized_) {
        Napi::Error::New(env, "Context not initialized").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    av_bsf_flush(ctx_);
    return env.Undefined();
}

Napi::Value BitStreamFilterContext::Free(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (ctx_) {
        av_bsf_free(&ctx_);
        ctx_ = nullptr;
        initialized_ = false;
    }

    return env.Undefined();
}

Napi::Value BitStreamFilterContext::GetFilter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_ || !ctx_->filter) {
        return env.Null();
    }

    Napi::External<void> external = Napi::External<void>::New(env, const_cast<AVBitStreamFilter*>(ctx_->filter));
    return constructor.New({ external });
}

Napi::Value BitStreamFilterContext::GetTimeBaseIn(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_) {
        return env.Null();
    }

    Napi::Object rational = Napi::Object::New(env);
    rational.Set("num", Napi::Number::New(env, ctx_->time_base_in.num));
    rational.Set("den", Napi::Number::New(env, ctx_->time_base_in.den));
    return rational;
}

void BitStreamFilterContext::SetTimeBaseIn(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!ctx_ || !value.IsObject()) {
        return;
    }

    Napi::Object rational = value.As<Napi::Object>();
    if (rational.Has("num") && rational.Has("den")) {
        ctx_->time_base_in.num = rational.Get("num").As<Napi::Number>().Int32Value();
        ctx_->time_base_in.den = rational.Get("den").As<Napi::Number>().Int32Value();
    }
}

Napi::Value BitStreamFilterContext::GetTimeBaseOut(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_) {
        return env.Null();
    }

    Napi::Object rational = Napi::Object::New(env);
    rational.Set("num", Napi::Number::New(env, ctx_->time_base_out.num));
    rational.Set("den", Napi::Number::New(env, ctx_->time_base_out.den));
    return rational;
}

void BitStreamFilterContext::SetTimeBaseOut(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!ctx_ || !value.IsObject()) {
        return;
    }

    Napi::Object rational = value.As<Napi::Object>();
    if (rational.Has("num") && rational.Has("den")) {
        ctx_->time_base_out.num = rational.Get("num").As<Napi::Number>().Int32Value();
        ctx_->time_base_out.den = rational.Get("den").As<Napi::Number>().Int32Value();
    }
}

Napi::Value BitStreamFilterContext::GetCodecParameters(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!ctx_ || !ctx_->par_in) {
        return env.Null();
    }

    // Create a CodecParameters wrapper for the par_in
    Napi::External<void> external = Napi::External<void>::New(env, ctx_->par_in);
    return CodecParameters::constructor.New({ external });
}