{
  "targets": [
    {
      "target_name": "node-av",
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
        "<!@(node -p \"require('node-addon-api').include\")",
        "/opt/ffbuild/prefix/include"
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
        [
          "OS=='mac'",
          {
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
              "-L/opt/ffbuild/prefix/lib",
              "/opt/ffbuild/prefix/lib/libx264.a",
              "/opt/ffbuild/prefix/lib/libx265.a",
              "/opt/ffbuild/prefix/lib/libvpx.a",
              "/opt/ffbuild/prefix/lib/libopus.a",
              "<!@(ls /opt/ffbuild/prefix/lib/libNE10.a 2>/dev/null || echo '')",
              "/opt/ffbuild/prefix/lib/libmp3lame.a",
              "/opt/ffbuild/prefix/lib/libdav1d.a",
              "/opt/ffbuild/prefix/lib/libSvtAv1Enc.a",
              "/opt/ffbuild/prefix/lib/libogg.a",
              "/opt/ffbuild/prefix/lib/libvorbis.a",
              "/opt/ffbuild/prefix/lib/libvorbisenc.a",
              "/opt/ffbuild/prefix/lib/libtheora.a",
              "/opt/ffbuild/prefix/lib/libtheoraenc.a",
              "/opt/ffbuild/prefix/lib/libtheoradec.a",
              "/opt/ffbuild/prefix/lib/libwebp.a",
              "/opt/ffbuild/prefix/lib/libwebpmux.a",
              "<!@(ls /opt/ffbuild/prefix/lib/libwebpdemux.a 2>/dev/null || echo '')",
              "/opt/ffbuild/prefix/lib/libsrt.a",
              "/opt/ffbuild/prefix/lib/libass.a",
              "/opt/ffbuild/prefix/lib/libharfbuzz.a",
              "/opt/ffbuild/prefix/lib/libfontconfig.a",
              "/opt/ffbuild/prefix/lib/libfreetype.a",
              "/opt/ffbuild/prefix/lib/libfribidi.a",
              "/opt/ffbuild/prefix/lib/libbluray.a",
              "/opt/ffbuild/prefix/lib/libudfread.a",
              "<!@(ls /opt/ffbuild/prefix/lib/libxml2.a 2>/dev/null || echo '')",
              "/opt/ffbuild/prefix/lib/libz.a",
              "<!@(ls /opt/ffbuild/prefix/lib/libbz2.a 2>/dev/null || echo '')",
              "/opt/ffbuild/prefix/lib/liblzma.a",
              "-liconv",
              "-lxml2",
              "-lbz2",
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
          }
        ],
        [
          "OS=='linux'",
          {
            "library_dirs": [
              "/opt/ffbuild/prefix/lib"
            ],
            "libraries": [
              "-L/opt/ffbuild/prefix/lib",
              "-Wl,--whole-archive",
              "/opt/ffbuild/prefix/lib/libavformat.a",
              "/opt/ffbuild/prefix/lib/libavcodec.a",
              "/opt/ffbuild/prefix/lib/libavfilter.a",
              "/opt/ffbuild/prefix/lib/libswscale.a",
              "/opt/ffbuild/prefix/lib/libswresample.a",
              "/opt/ffbuild/prefix/lib/libavdevice.a",
              "/opt/ffbuild/prefix/lib/libavutil.a",
              "-Wl,--no-whole-archive",
              "/opt/ffbuild/prefix/lib/libx264.a",
              "/opt/ffbuild/prefix/lib/libx265.a",
              "/opt/ffbuild/prefix/lib/libvpx.a",
              "/opt/ffbuild/prefix/lib/libopus.a",
              "/opt/ffbuild/prefix/lib/libmp3lame.a",
              "/opt/ffbuild/prefix/lib/libfdk-aac.a",
              "/opt/ffbuild/prefix/lib/libdav1d.a",
              "/opt/ffbuild/prefix/lib/libSvtAv1Enc.a",
              "/opt/ffbuild/prefix/lib/libogg.a",
              "/opt/ffbuild/prefix/lib/libvorbis.a",
              "/opt/ffbuild/prefix/lib/libvorbisenc.a",
              "/opt/ffbuild/prefix/lib/libtheora.a",
              "/opt/ffbuild/prefix/lib/libtheoraenc.a",
              "/opt/ffbuild/prefix/lib/libtheoradec.a",
              "/opt/ffbuild/prefix/lib/libwebp.a",
              "/opt/ffbuild/prefix/lib/libwebpmux.a",
              "/opt/ffbuild/prefix/lib/libwebpdemux.a",
              "/opt/ffbuild/prefix/lib/libsrt.a",
              "/opt/ffbuild/prefix/lib/libass.a",
              "/opt/ffbuild/prefix/lib/libharfbuzz.a",
              "/opt/ffbuild/prefix/lib/libfontconfig.a",
              "/opt/ffbuild/prefix/lib/libfreetype.a",
              "/opt/ffbuild/prefix/lib/libfribidi.a",
              "/opt/ffbuild/prefix/lib/libbluray.a",
              "/opt/ffbuild/prefix/lib/libudfread.a",
              "/opt/ffbuild/prefix/lib/libxml2.a",
              "/opt/ffbuild/prefix/lib/libz.a",
              "/opt/ffbuild/prefix/lib/libbz2.a",
              "/opt/ffbuild/prefix/lib/liblzma.a",
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
          }
        ],
        [
          "OS=='win'",
          {
            "conditions": [
              [
                "target_arch=='x64'",
                {
                  "include_dirs": [
                    "/clang64/ffbuild/include"
                  ],
                  "library_dirs": [
                    "/clang64/ffbuild/lib"
                  ]
                }
              ],
              [
                "target_arch=='arm64'",
                {
                  "include_dirs": [
                    "/clangarm64/ffbuild/include"
                  ],
                  "library_dirs": [
                    "/clangarm64/ffbuild/lib"
                  ]
                }
              ]
            ],
            "libraries": [
              "-lavformat",
              "-lavcodec",
              "-lavfilter",
              "-lswscale",
              "-lswresample",
              "-lavdevice",
              "-lavutil",
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
              "-lzimg",
              "-lxml2",
              "-lfontconfig",
              "-lfreetype",
              "-lharfbuzz",
              "-lfribidi",
              "-lass",
              "-lbluray",
              "-lopenmpt",
              "-lchromaprint",
              "-lfftw3",
              "-lz",
              "-lbz2",
              "-llzma",
              "-liconv",
              "-lc++",
              "ws2_32.lib",
              "secur32.lib",
              "bcrypt.lib",
              "strmiids.lib",
              "mfuuid.lib",
              "ole32.lib",
              "user32.lib",
              "advapi32.lib",
              "shell32.lib",
              "gdi32.lib",
              "psapi.lib"
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
          }
        ]
      ]
    }
  ]
}
