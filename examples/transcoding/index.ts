/**
 * Transcoding Example
 *
 * This example demonstrates complete transcoding:
 * 1. Decode video and audio from input file
 * 2. Apply filters for format conversion and processing
 * 3. Re-encode with different codecs and settings
 * 4. Write to output file with new format
 *
 * Transcoding vs Remuxing:
 * - Remuxing: Just copies packets (fast, no quality loss)
 * - Transcoding: Decodes and re-encodes (slower, allows format changes)
 *
 * Use cases:
 * - Change video/audio codecs
 * - Reduce file size (compression)
 * - Change resolution or aspect ratio
 * - Convert between incompatible formats
 * - Apply filters and effects
 *
 * Pipeline:
 * Input -> Decode -> Filter -> Encode -> Output
 */

import {
  AV_CODEC_FLAG_GLOBAL_HEADER,
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_IO_FLAG_WRITE,
  AV_LOG_DEBUG,
  AV_LOG_INFO,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_PIX_FMT_YUV420P,
  AV_SAMPLE_FMT_FLTP,
  Codec,
  CodecContext,
  FilterGraph,
  FormatContext,
  Frame,
  IOContext,
  OutputFormat,
  Packet,
  Rational,
} from '@seydx/ffmpeg';

import { config, ffmpegLog } from '../index.js';

import type { FilterContext, Stream } from '@seydx/ffmpeg';

// Stream processing context
interface StreamContext {
  // Input
  inputStream: Stream;
  decoder: Codec;
  decoderContext: CodecContext;

  // Filtering
  filterGraph: FilterGraph;
  buffersrcContext: FilterContext;
  buffersinkContext: FilterContext;

  // Output
  encoder: Codec;
  encoderContext: CodecContext;
  outputStream: Stream;

  // Frames
  decodeFrame: Frame;
  filterFrame: Frame;

  // Stats
  decodedFrames: number;
  encodedFrames: number;
}

async function main() {
  // Setup FFmpeg logging
  ffmpegLog('transcoding', config.verbose ? AV_LOG_DEBUG : AV_LOG_INFO);

  // Resources with automatic cleanup
  using inputFormat = new FormatContext();
  using packet = new Packet();
  using encodePacket = new Packet();

  // Output resources
  let outputFormat: FormatContext | null = null;
  let ioContext: IOContext | null = null;

  // Stream contexts (one per stream)
  const streamContexts = new Map<number, StreamContext>();

  try {
    const outputFile = config.outputFile('transcoded');

    console.log(`📂 Input: ${config.inputFile}`);
    console.log(`💾 Output: ${outputFile}`);
    console.log('');
    console.log('🎬 Transcoding settings:');
    console.log(`  Video: ${config.transcoding.videoCodec} @ ${config.transcoding.videoBitrate / 1000000n} Mbps`);
    console.log(`  Audio: ${config.transcoding.audioCodec} @ ${config.transcoding.audioBitrate / 1000n} kbps`);
    console.log(`  Resolution: ${config.transcoding.outputWidth}x${config.transcoding.outputHeight}`);
    console.log('');

    // Step 1: Open input file
    console.log('📖 Opening input file...');
    await inputFormat.openInputAsync(config.inputFile);
    await inputFormat.findStreamInfoAsync();

    console.log(`📦 Format: ${inputFormat.inputFormat?.name ?? 'unknown'}`);
    console.log(`⏱️  Duration: ${inputFormat.duration / 1000000n}s`);
    console.log('');

    // Step 2: Setup output format
    console.log('📤 Setting up output...');
    const outputFormatType = OutputFormat.guess({ filename: outputFile });
    if (!outputFormatType) {
      throw new Error('❌ Could not determine output format');
    }

    outputFormat = new FormatContext('output', outputFormatType, undefined, outputFile);

    // Step 3: Process each stream
    console.log('🔧 Setting up streams...');

    for (const inputStream of inputFormat.streams) {
      if (!inputStream.codecParameters) continue;

      const mediaType = inputStream.codecParameters.codecType;

      // Only process audio and video
      if (mediaType !== AV_MEDIA_TYPE_VIDEO && mediaType !== AV_MEDIA_TYPE_AUDIO) {
        continue;
      }

      // Setup decoder
      const decoder = Codec.findDecoder(inputStream.codecParameters.codecId);
      if (!decoder) {
        console.warn(`  ⚠️  No decoder for stream ${inputStream.index}`);
        continue;
      }

      const decoderContext = new CodecContext(decoder);
      inputStream.codecParameters.toCodecContext(decoderContext);
      await decoderContext.openAsync();

      // Create output stream
      const outputStream = outputFormat.newStream();
      if (!outputStream) {
        throw new Error('❌ Failed to create output stream');
      }

      // Setup encoder based on media type
      let encoder: Codec | null = null;
      let encoderContext: CodecContext;
      let filterGraph: FilterGraph | null = null;
      let buffersrcContext: FilterContext | null = null;
      let buffersinkContext: FilterContext | null = null;

      if (mediaType === AV_MEDIA_TYPE_VIDEO) {
        // Video encoder setup
        encoder = Codec.findEncoderByName(config.transcoding.videoCodec);
        if (!encoder) {
          throw new Error(`❌ Video encoder '${config.transcoding.videoCodec}' not found`);
        }

        // Create encoder context with the encoder
        encoderContext = new CodecContext(encoder);
        encoderContext.width = config.transcoding.outputWidth;
        encoderContext.height = config.transcoding.outputHeight;
        encoderContext.pixelFormat = AV_PIX_FMT_YUV420P;
        encoderContext.bitRate = config.transcoding.videoBitrate;
        encoderContext.timeBase = new Rational(1, 25);
        encoderContext.framerate = new Rational(25, 1);
        encoderContext.gopSize = 12;
        encoderContext.maxBFrames = 2;

        // Set encoder options
        if (config.transcoding.videoPreset) {
          encoderContext.options.set('preset', config.transcoding.videoPreset);
        }
        if (config.transcoding.videoCrf) {
          encoderContext.options.set('crf', String(config.transcoding.videoCrf));
        }

        // Create video filter graph
        filterGraph = new FilterGraph();

        // Input buffer
        buffersrcContext = filterGraph.createBuffersrcFilter('in', {
          width: decoderContext.width,
          height: decoderContext.height,
          pixelFormat: decoderContext.pixelFormat,
          timeBase: inputStream.timeBase,
          sampleAspectRatio: decoderContext.sampleAspectRatio,
        });

        // Output buffer
        buffersinkContext = filterGraph.createBuffersinkFilter('out', false);

        // Build filter string for scaling and format conversion
        const filterStr = `scale=${config.transcoding.outputWidth}:${config.transcoding.outputHeight},format=yuv420p`;

        filterGraph.parseWithInOut(filterStr, { name: 'in', filterContext: buffersrcContext, padIdx: 0 }, { name: 'out', filterContext: buffersinkContext, padIdx: 0 });

        await filterGraph.configAsync();

        console.log(`  🎬 Video: ${decoder.name} -> ${encoder.name}`);
        console.log(`     ${decoderContext.width}x${decoderContext.height} -> ${encoderContext.width}x${encoderContext.height}`);
      } else if (mediaType === AV_MEDIA_TYPE_AUDIO) {
        // Audio encoder setup
        encoder = Codec.findEncoderByName(config.transcoding.audioCodec);
        if (!encoder) {
          throw new Error(`❌ Audio encoder '${config.transcoding.audioCodec}' not found`);
        }

        // Create encoder context with the encoder
        encoderContext = new CodecContext(encoder);
        encoderContext.sampleRate = config.transcoding.audioSampleRate;
        encoderContext.sampleFormat = AV_SAMPLE_FMT_FLTP;
        encoderContext.channelLayout = {
          nbChannels: config.transcoding.audioChannels,
          order: 1,
          mask: config.transcoding.audioChannels === 2 ? 3n : 1n, // Stereo or Mono
        };
        encoderContext.bitRate = config.transcoding.audioBitrate;
        encoderContext.timeBase = new Rational(1, config.transcoding.audioSampleRate);

        // Create audio filter graph
        filterGraph = new FilterGraph();

        // Input buffer
        const inputLayout = decoderContext.channelLayout;
        buffersrcContext = filterGraph.createBuffersrcFilter('in', {
          sampleRate: decoderContext.sampleRate,
          sampleFormat: decoderContext.sampleFormat,
          channelLayout: inputLayout,
          timeBase: inputStream.timeBase,
        });

        // Output buffer
        buffersinkContext = filterGraph.createBuffersinkFilter('out');

        // Build filter string for audio format conversion
        const filterStr = `aformat=sample_rates=${config.transcoding.audioSampleRate}:sample_fmts=fltp:channel_layouts=stereo`;

        filterGraph.parseWithInOut(filterStr, { name: 'in', filterContext: buffersrcContext, padIdx: 0 }, { name: 'out', filterContext: buffersinkContext, padIdx: 0 });

        await filterGraph.configAsync();

        console.log(`  🎵 Audio: ${decoder.name} -> ${encoder.name}`);
        console.log(`     ${decoderContext.sampleRate} Hz -> ${encoderContext.sampleRate} Hz`);
      } else {
        throw new Error('Unsupported media type');
      }

      // Set global header flag if needed
      if (outputFormat.outputFormat && outputFormat.outputFormat.flags & 0x0040) {
        encoderContext.flags = AV_CODEC_FLAG_GLOBAL_HEADER;
      }

      // Open encoder
      await encoderContext.openAsync();

      // Copy parameters to output stream
      outputStream.codecParameters?.fromCodecContext(encoderContext);
      outputStream.timeBase = encoderContext.timeBase;

      // Store context
      const streamContext: StreamContext = {
        inputStream,
        decoder,
        decoderContext,
        filterGraph: filterGraph,
        buffersrcContext: buffersrcContext,
        buffersinkContext: buffersinkContext,
        encoder: encoder,
        encoderContext,
        outputStream,
        decodeFrame: new Frame(),
        filterFrame: new Frame(),
        decodedFrames: 0,
        encodedFrames: 0,
      };

      streamContexts.set(inputStream.index, streamContext);
    }

    if (streamContexts.size === 0) {
      throw new Error('❌ No streams to transcode');
    }

    // Step 4: Open output file
    if (outputFormat.outputFormat?.needsFile) {
      ioContext = new IOContext();
      await ioContext.openAsync(outputFile, AV_IO_FLAG_WRITE);
      outputFormat.pb = ioContext;
    }

    // Write header
    await outputFormat.writeHeaderAsync();

    // Step 5: Main transcoding loop
    console.log('\n▶️  Transcoding...\n');
    const startTime = Date.now();

    while (true) {
      // Read packet from input
      const ret = await inputFormat.readFrameAsync(packet);
      if (ret === AV_ERROR_EOF) {
        break;
      }

      // Get stream context
      const streamCtx = streamContexts.get(packet.streamIndex);
      if (!streamCtx) {
        packet.unref();
        continue;
      }

      // Decode packet
      await streamCtx.decoderContext.sendPacketAsync(packet);
      packet.unref();

      // Process decoded frames
      while (true) {
        const ret = await streamCtx.decoderContext.receiveFrameAsync(streamCtx.decodeFrame);
        if (ret === AV_ERROR_EAGAIN || ret === AV_ERROR_EOF) {
          break;
        }

        streamCtx.decodedFrames++;

        // Send through filter
        await streamCtx.buffersrcContext.bufferSrcAddFrameAsync(streamCtx.decodeFrame);
        streamCtx.decodeFrame.unref();

        // Get filtered frames
        while (true) {
          const ret = await streamCtx.buffersinkContext.bufferSinkGetFrameAsync(streamCtx.filterFrame);
          if (ret < 0) {
            break;
          }

          // Encode frame
          await streamCtx.encoderContext.sendFrameAsync(streamCtx.filterFrame);
          streamCtx.filterFrame.unref();

          // Get encoded packets
          while (true) {
            const ret = await streamCtx.encoderContext.receivePacketAsync(encodePacket);
            if (ret < 0) {
              break;
            }

            // Write to output
            encodePacket.streamIndex = streamCtx.outputStream.index;
            encodePacket.rescaleTs(streamCtx.encoderContext.timeBase, streamCtx.outputStream.timeBase);

            await outputFormat.writeInterleavedFrameAsync(encodePacket);
            streamCtx.encodedFrames++;
            encodePacket.unref();
          }
        }
      }

      // Show progress
      const totalDecoded = Array.from(streamContexts.values()).reduce((sum, ctx) => sum + ctx.decodedFrames, 0);
      if (totalDecoded % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`  ⏳ Progress: ${totalDecoded} frames decoded (${(totalDecoded / elapsed).toFixed(1)} fps)`);
      }
    }

    // Step 6: Flush all streams
    console.log('\n🚿 Flushing...');

    for (const streamCtx of streamContexts.values()) {
      // Flush decoder
      await streamCtx.decoderContext.sendPacketAsync(null);
      while (true) {
        const ret = await streamCtx.decoderContext.receiveFrameAsync(streamCtx.decodeFrame);
        if (ret < 0) break;

        await streamCtx.buffersrcContext.bufferSrcAddFrameAsync(streamCtx.decodeFrame);
        streamCtx.decodeFrame.unref();
      }

      // Flush filter
      await streamCtx.buffersrcContext.bufferSrcAddFrameAsync(null);
      while (true) {
        const ret = await streamCtx.buffersinkContext.bufferSinkGetFrameAsync(streamCtx.filterFrame);
        if (ret < 0) break;

        await streamCtx.encoderContext.sendFrameAsync(streamCtx.filterFrame);
        streamCtx.filterFrame.unref();
      }

      // Flush encoder
      await streamCtx.encoderContext.sendFrameAsync(null);
      while (true) {
        const ret = await streamCtx.encoderContext.receivePacketAsync(encodePacket);
        if (ret < 0) break;

        encodePacket.streamIndex = streamCtx.outputStream.index;
        encodePacket.rescaleTs(streamCtx.encoderContext.timeBase, streamCtx.outputStream.timeBase);

        await outputFormat.writeInterleavedFrameAsync(encodePacket);
        streamCtx.encodedFrames++;
        encodePacket.unref();
      }
    }

    // Write trailer
    await outputFormat.writeTrailerAsync();

    // Calculate statistics
    const elapsed = (Date.now() - startTime) / 1000;

    // Summary
    console.log('\n📊 === Summary ===');
    for (const [index, ctx] of streamContexts) {
      const type = ctx.inputStream.codecParameters?.codecType === AV_MEDIA_TYPE_VIDEO ? '🎬 Video' : '🎵 Audio';
      console.log(`${type} stream ${index}:`);
      console.log(`  Decoded: ${ctx.decodedFrames} frames`);
      console.log(`  Encoded: ${ctx.encodedFrames} frames`);
    }
    console.log(`⏱️  Time: ${elapsed.toFixed(2)}s`);
    console.log(`💾 Output: ${outputFile}`);
    console.log('✅ Transcoding completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    for (const ctx of streamContexts.values()) {
      ctx.decoderContext.close();
      ctx.decoderContext[Symbol.dispose]();
      ctx.encoderContext.close();
      ctx.encoderContext[Symbol.dispose]();
      ctx.decodeFrame[Symbol.dispose]();
      ctx.filterFrame[Symbol.dispose]();
      ctx.filterGraph[Symbol.dispose]();
    }

    inputFormat.closeInput();

    if (outputFormat) {
      outputFormat[Symbol.dispose]();
    }
    if (ioContext) {
      ioContext[Symbol.dispose]();
    }
  }
}

// Run the example
main().catch(console.error);
