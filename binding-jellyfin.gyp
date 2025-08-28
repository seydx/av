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
              "<!@(ls /opt/ffbuild/prefix/lib/libchromaprint.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libopenmpt.a 2>/dev/null || echo '')",
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
              "<!@(ls /opt/ffbuild/prefix/lib/libzvbi.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libzimg.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libgmp.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libssl.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libcrypto.a 2>/dev/null || echo '')",
              "-liconv",
              "-lxml2",
              "-lbz2",
              "-framework CoreFoundation",
              "-framework CoreVideo",
              "-framework CoreMedia",
              "-framework CoreServices",
              "-framework AudioToolbox",
              "-framework VideoToolbox",
              "-framework AVFoundation",
              "-framework AppKit",
              "-framework Accelerate",
              "-framework Security",
              "-framework IOKit",
              "-framework OpenGL",
              "-framework Metal",
              "-framework OpenCL"
            ],
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "14.0",
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
              "-Wl,--start-group",
              "/opt/ffbuild/prefix/lib/libavformat.a",
              "/opt/ffbuild/prefix/lib/libavcodec.a",
              "/opt/ffbuild/prefix/lib/libavfilter.a",
              "/opt/ffbuild/prefix/lib/libavdevice.a",
              "/opt/ffbuild/prefix/lib/libswscale.a",
              "/opt/ffbuild/prefix/lib/libswresample.a",
              "/opt/ffbuild/prefix/lib/libavutil.a",
              "-Wl,--end-group",
              "-Wl,--no-whole-archive",
              "<!@(ls /opt/ffbuild/prefix/lib/libx264.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libx265.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libvpx.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libopus.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libmp3lame.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libfdk-aac.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libdav1d.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libSvtAv1Enc.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libogg.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libvorbis.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libvorbisenc.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libtheora.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libtheoraenc.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libtheoradec.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libwebp.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libwebpmux.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libwebpdemux.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libsharpyuv.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libsrt.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libchromaprint.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libopenmpt.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libmpg123.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libvorbisfile.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libass.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libharfbuzz.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libfontconfig.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libfreetype.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libfribidi.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libpng.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libpng16.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libbluray.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libudfread.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libxml2.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libexpat.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libz.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libbz2.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/liblzma.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libzvbi.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libzimg.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libgmp.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libssl.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libcrypto.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libshaderc_combined.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libplacebo.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libglslang.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libMachineIndependent.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libGenericCodeGen.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libSPIRV.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libOGLCompiler.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libOSDependent.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/libglslang-default-resource-limits.a 2>/dev/null || echo '')",
              "<!@(ls /opt/ffbuild/prefix/lib/liblcms2.a 2>/dev/null || echo '')",
              "-lpthread",
              "-lm",
              "-ldl",
              "-lrt",
              "-latomic",
              "-lstdc++"
            ],
            "cflags": [
              "-fPIC",
              "-O3"
            ],
            "cflags_cc": [
              "-fPIC",
              "-O3"
            ],
            "ldflags": [
              "-Wl,--gc-sections",
              "-Wl,--allow-multiple-definition",
              "-Wl,-rpath,'$$ORIGIN'",
              "-Wl,-z,origin"
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
                    "/clang64/ffbuild/include",
                    "C:/msys64/clang64/ffbuild/include"
                  ],
                  "library_dirs": [
                    "/clang64/ffbuild/lib",
                    "C:/msys64/clang64/ffbuild/lib"
                  ]
                }
              ],
              [
                "target_arch=='arm64'",
                {
                  "include_dirs": [
                    "/clangarm64/ffbuild/include",
                    "C:/msys64/clangarm64/ffbuild/include"
                  ],
                  "library_dirs": [
                    "/clangarm64/ffbuild/lib",
                    "C:/msys64/clangarm64/ffbuild/lib"
                  ]
                }
              ]
            ],
            "libraries": [
              "-Wl,--whole-archive",
              "-lavformat",
              "-lavcodec",
              "-lavfilter",
              "-lavdevice",
              "-lavutil",
              "-lswscale",
              "-lswresample",
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
              "-static",
              "-lws2_32",
              "-lsecur32",
              "-lbcrypt",
              "-lstrmiids",
              "-lmfuuid",
              "-lole32",
              "-luser32",
              "-ladvapi32",
              "-lshell32",
              "-lgdi32",
              "-lpsapi"
            ],
            "cflags": [
              "-fPIC",
              "-O3",
              "-fexceptions"
            ],
            "cflags_cc": [
              "-fPIC",
              "-O3",
              "-fexceptions",
              "-std=c++17"
            ],
            "ldflags": [
              "-static-libgcc",
              "-static-libstdc++",
              "-Wl,--gc-sections"
            ]
          }
        ]
      ]
    }
  ]
}
