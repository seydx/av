{
  "targets": [
    {
      "target_name": "ffmpeg",
      "sources": [
        "src/bindings/index.cc",
        "src/bindings/packet.cc",
        "src/bindings/frame.cc",
        "src/bindings/frame_async.cc",
        "src/bindings/codec.cc",
        "src/bindings/codec_context.cc",
        "src/bindings/codec_context_async.cc",
        "src/bindings/codec_parameters.cc",
        "src/bindings/codec_parser.cc",
        "src/bindings/format_context.cc",
        "src/bindings/format_context_async.cc",
        "src/bindings/stream.cc",
        "src/bindings/dictionary.cc",
        "src/bindings/input_format.cc",
        "src/bindings/output_format.cc",
        "src/bindings/io_context.cc",
        "src/bindings/io_context_async.cc",
        "src/bindings/error.cc",
        "src/bindings/software_scale_context.cc",
        "src/bindings/software_scale_context_async.cc",
        "src/bindings/software_resample_context.cc",
        "src/bindings/software_resample_context_async.cc",
        "src/bindings/filter.cc",
        "src/bindings/filter_context.cc",
        "src/bindings/filter_context_async.cc",
        "src/bindings/filter_graph.cc",
        "src/bindings/filter_graph_async.cc",
        "src/bindings/filter_inout.cc",
        "src/bindings/hardware_device_context.cc",
        "src/bindings/hardware_frames_context.cc",
        "src/bindings/hardware_frames_context_async.cc",
        "src/bindings/log.cc",
        "src/bindings/utilities.cc",
        "src/bindings/audio_fifo.cc",
        "src/bindings/audio_fifo_async.cc",
        "src/bindings/bitstream_filter.cc",
        "src/bindings/bitstream_filter_context.cc",
        "src/bindings/bitstream_filter_context_async.cc",
        "src/bindings/option.cc"
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
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
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
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
