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
        "src/bindings/dictionary.cc",
        "src/bindings/format_context.cc",
        "src/bindings/stream.cc",
        "src/bindings/input_format.cc",
        "src/bindings/output_format.cc",
        "src/bindings/filter.cc",
        "src/bindings/filter_context.cc",
        "src/bindings/filter_graph.cc",
        "src/bindings/software_scale_context.cc",
        "src/bindings/software_resample_context.cc",
        "src/bindings/hardware_device_context.cc",
        "src/bindings/hardware_frames_context.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!@(pkg-config --cflags-only-I libavutil libavformat libavfilter | sed s/-I//g)"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "libraries": [
        "<!@(pkg-config --libs libavutil libavcodec libavformat libavfilter libswscale libswresample)"
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