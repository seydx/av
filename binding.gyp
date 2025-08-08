{
  "targets": [
    {
      "target_name": "ffmpeg",
      "sources": [
        "src/bindings/index.cc",
        "src/bindings/packet.cc",
        "src/bindings/frame.cc",
        "src/bindings/codec.cc",
        "src/bindings/codec_context.cc",
        "src/bindings/codec_parameters.cc",
        "src/bindings/format_context.cc",
        "src/bindings/stream.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!@(pkg-config --cflags-only-I libavutil libavformat | sed s/-I//g)"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "libraries": [
        "<!@(pkg-config --libs libavutil libavcodec libavformat libswscale libswresample)"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}