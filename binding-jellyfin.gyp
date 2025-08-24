{
  "targets": [
    {
      "target_name": "av",
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
        "src/bindings/input_format_async.cc",
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
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["OS=='mac'", {
          "include_dirs": [
            "/opt/ffbuild/prefix/include"
          ],
          "library_dirs": [
            "/opt/ffbuild/prefix/lib"
          ],
          "libraries": [
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libavformat.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libavcodec.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libavfilter.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libavutil.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libswscale.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libswresample.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libavdevice.a",
            "-Wl,-force_load,/opt/ffbuild/prefix/lib/libpostproc.a",
            "-L/opt/ffbuild/prefix/lib",
            "-lx264",
            "-lx265",
            "-lvpx",
            "-lopus",
            "-lmp3lame",
            "-lfdk-aac",
            "-ldav1d",
            "-lSvtAv1Enc",
            "-logg",
            "-lvorbis",
            "-lvorbisenc",
            "-ltheora",
            "-ltheoraenc",
            "-ltheoradec",
            "-lwebp",
            "-lwebpmux",
            "-lwebpdemux",
            "-lsrt",
            "-lass",
            "-lharfbuzz",
            "-lfontconfig",
            "-lfreetype",
            "-lfribidi",
            "-lbluray",
            "-ludfread",
            "-lxml2",
            "-lz",
            "-lbz2",
            "-llzma",
            "-liconv",
            "-framework CoreFoundation",
            "-framework CoreVideo",
            "-framework CoreMedia",
            "-framework CoreServices",
            "-framework AudioToolbox",
            "-framework VideoToolbox",
            "-framework Security",
            "-framework IOKit",
            "-framework OpenGL",
            "-framework Metal",
            "-framework OpenCL"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_LDFLAGS": [
              "-Wl,-dead_strip"
            ]
          }
        }],
        ["OS=='linux'", {
          "include_dirs": [
            "/opt/ffbuild/prefix/include"
          ],
          "library_dirs": [
            "/opt/ffbuild/prefix/lib"
          ],
          "libraries": [
            "-L/opt/ffbuild/prefix/lib",
            "-Wl,--whole-archive",
            "/opt/ffbuild/prefix/lib/libavformat.a",
            "/opt/ffbuild/prefix/lib/libavcodec.a",
            "/opt/ffbuild/prefix/lib/libavfilter.a",
            "/opt/ffbuild/prefix/lib/libavutil.a",
            "/opt/ffbuild/prefix/lib/libswscale.a",
            "/opt/ffbuild/prefix/lib/libswresample.a",
            "/opt/ffbuild/prefix/lib/libavdevice.a",
            "/opt/ffbuild/prefix/lib/libpostproc.a",
            "-Wl,--no-whole-archive",
            "-lx264",
            "-lx265",
            "-lvpx",
            "-lopus",
            "-lmp3lame",
            "-lfdk-aac",
            "-ldav1d",
            "-lSvtAv1Enc",
            "-logg",
            "-lvorbis",
            "-lvorbisenc",
            "-ltheora",
            "-ltheoraenc",
            "-ltheoradec",
            "-lwebp",
            "-lwebpmux",
            "-lwebpdemux",
            "-lsrt",
            "-lass",
            "-lharfbuzz",
            "-lfontconfig",
            "-lfreetype",
            "-lfribidi",
            "-lbluray",
            "-ludfread",
            "-lxml2",
            "-lz",
            "-lbz2",
            "-llzma",
            "-lpthread",
            "-lm",
            "-ldl",
            "-lrt"
          ],
          "cflags": [
            "-fPIC",
            "-O3"
          ],
          "ldflags": [
            "-Wl,--gc-sections",
            "-Wl,--as-needed"
          ]
        }],
        ["OS=='win'", {
          "include_dirs": [
            "C:/ffbuild/prefix/include"
          ],
          "library_dirs": [
            "C:/ffbuild/prefix/lib"
          ],
          "libraries": [
            "C:/ffbuild/prefix/lib/avformat.lib",
            "C:/ffbuild/prefix/lib/avcodec.lib",
            "C:/ffbuild/prefix/lib/avfilter.lib",
            "C:/ffbuild/prefix/lib/avutil.lib",
            "C:/ffbuild/prefix/lib/swscale.lib",
            "C:/ffbuild/prefix/lib/swresample.lib",
            "C:/ffbuild/prefix/lib/avdevice.lib",
            "C:/ffbuild/prefix/lib/postproc.lib",
            "C:/ffbuild/prefix/lib/x264.lib",
            "C:/ffbuild/prefix/lib/x265.lib",
            "C:/ffbuild/prefix/lib/vpx.lib",
            "C:/ffbuild/prefix/lib/opus.lib",
            "C:/ffbuild/prefix/lib/mp3lame.lib",
            "C:/ffbuild/prefix/lib/fdk-aac.lib",
            "C:/ffbuild/prefix/lib/dav1d.lib",
            "C:/ffbuild/prefix/lib/SvtAv1Enc.lib",
            "C:/ffbuild/prefix/lib/SvtAv1Dec.lib",
            "ws2_32.lib",
            "secur32.lib",
            "bcrypt.lib",
            "strmiids.lib",
            "mfuuid.lib",
            "ole32.lib",
            "user32.lib",
            "advapi32.lib",
            "shell32.lib"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "RuntimeLibrary": 0
            },
            "VCLinkerTool": {
              "GenerateDebugInformation": "false",
              "LinkTimeCodeGeneration": 1
            }
          }
        }]
      ]
    }
  ]
}