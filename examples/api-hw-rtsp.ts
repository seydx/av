/* eslint-disable @stylistic/max-len */
import { AV_PIX_FMT_YUV420P, Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput } from '../src/index.js';

let stop = false;

async function mainRtsp() {
  console.log('Opening input...');

  await using input = await MediaInput.open('rtsp://admin:password@192.168.178.142/Streaming/channels/101', {
    options: {
      rtsp_transport: 'tcp',
    },
  });

  await using output = await MediaOutput.open('examples/.tmp/rtsp-video.mp4');

  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  const audioStream = input.audio();
  if (!audioStream) {
    console.warn('No audio stream found, disabling audio');
  }

  console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} codecId=${videoStream.codecpar.codecId} format=${videoStream.codecpar.format}`);
  console.log(`Input timeBase: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
  console.log(`Input frameRate: ${videoStream.avgFrameRate.num}/${videoStream.avgFrameRate.den} (avg), ${videoStream.rFrameRate.num}/${videoStream.rFrameRate.den} (r)`);
  if (audioStream) {
    console.log(`Input audio: ${audioStream.codecpar.sampleRate}Hz ${audioStream.codecpar.channels}ch ${audioStream.codecpar.codecId}`);
  }

  using hardware = await HardwareContext.auto();

  using decoder = await Decoder.create(videoStream, {
    hardware,
  });

  using filter = await FilterAPI.create('scale_vt=640:360,setpts=N/FRAME_RATE/TB', videoStream, {
    hardware,
  });

  using encoder = await Encoder.create(
    'hevc_videotoolbox',
    {
      // After filter, we have different dimensions due to scaling through "scale_vt"
      type: 'video',
      width: 640,
      height: 360,
      pixelFormat: AV_PIX_FMT_YUV420P,
      timeBase: videoStream.timeBase,
      frameRate: videoStream.avgFrameRate,
      sampleAspectRatio: videoStream.sampleAspectRatio,
    },
    {
      hardware,
    },
  );

  const videoOutputIndex = output.addStream(encoder);
  const audioOutputIndex = audioStream ? output.addStream(audioStream) : -1;

  console.log('Writing header...');

  await output.writeHeader();

  // Nested Generator pattern with auto flush

  // const inputGenerator = input.packets(videoStream.index);
  // const decoderGenerator = decoder.frames(inputGenerator);
  // const filterGenerator = filter.frames(decoderGenerator);
  // const encoderGenerator = encoder.packets(filterGenerator);

  // console.log('Processing packets...');

  // let count = 0;
  // for await (const packet of encoderGenerator) {
  //   count++;
  //   console.log(`[${count}] Encoded packet: ${packet.size} bytes`);

  //   await output.writePacket(packet, videoStream.index);
  //   console.log(`[${count}] Packet written`);

  //   if (stop) {
  //     console.log('Stopping processing');
  //     break;
  //   }
  // }

  // Iterate manually for better control or time manipulation

  let audioPacketCount = 0;
  let videoPacketCount = 0;
  let videoFrameCount = 0;

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      console.log(`Processing video packet ${videoPacketCount}: keyframe=${packet.isKeyframe}, size=${packet.size}, pts=${packet.pts}, dts=${packet.dts}`);

      using frame = await decoder.decode(packet);
      if (frame) {
        console.log(`Decoded frame ${videoFrameCount}: size=${frame.width}x${frame.height}, format=${frame.format}, keyframe=${frame.keyFrame === 1} pts=${frame.pts}`);

        using filteredFrame = await filter.process(frame);
        if (filteredFrame) {
          console.log(
            `Filtered frame ${videoFrameCount}: size=${filteredFrame.width}x${filteredFrame.height}, format=${filteredFrame.format}, keyframe=${filteredFrame.keyFrame === 1} pts=${filteredFrame.pts}`,
          );

          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log(
              `Encoded packet ${videoFrameCount}: keyframe=${encodedPacket.isKeyframe}, size=${encodedPacket.size}, dts=${encodedPacket.dts}, pts=${encodedPacket.pts}`,
            );

            await output.writePacket(encodedPacket, videoOutputIndex);
          }
        }

        videoFrameCount++;
      }

      videoPacketCount++;
    } else if (packet.streamIndex === audioStream?.index) {
      console.log(`Processing audio packet ${audioPacketCount}: size=${packet.size}, pts=${packet.pts}, dts=${packet.dts}`);
      output.writePacket(packet, audioOutputIndex);
      audioPacketCount++;
    } else {
      console.error(`Unknown packet stream index: ${packet.streamIndex}, skipping...`);
    }

    if (stop) {
      break;
    }
  }

  // Complete flush pipeline: Decoder → Filter → Encoder
  console.log('Flushing pipeline...');

  // 1. Flush decoder to get remaining frames
  console.log('Flushing decoder...');
  for await (const decoderFrame of decoder.flushFrames()) {
    using frame = decoderFrame;
    console.log(`Decoder flush frame: size=${frame.width}x${frame.height}, pts=${frame.pts}`);

    // Process through filter
    using filteredFrame = await filter.process(frame);
    if (filteredFrame) {
      console.log(`Filter flush frame: size=${filteredFrame.width}x${filteredFrame.height}, pts=${filteredFrame.pts}`);

      // Encode the frame
      using encodedPacket = await encoder.encode(filteredFrame);
      if (encodedPacket) {
        console.log(`Encode flush packet: size=${encodedPacket.size}, pts=${encodedPacket.pts}`);
        await output.writePacket(encodedPacket, videoOutputIndex);
      }
    }
  }

  // 2. Flush filter to get remaining frames
  console.log('Flushing filter...');
  for await (const filterFrame of filter.flushFrames()) {
    using frame = filterFrame;
    console.log(`Filter flush output: size=${frame.width}x${frame.height}, pts=${frame.pts}`);

    // Encode the frame
    using encodedPacket = await encoder.encode(frame);
    if (encodedPacket) {
      console.log(`Encode filter-flush packet: size=${encodedPacket.size}, pts=${encodedPacket.pts}`);
      await output.writePacket(encodedPacket, videoOutputIndex);
    }
  }

  // 3. Flush encoder to get remaining packets
  console.log('Flushing encoder...');
  for await (const encoderPacket of encoder.flushPackets()) {
    using packet = encoderPacket;
    console.log(`Encoder flush packet: size=${packet.size}, pts=${packet.pts}, dts=${packet.dts}`);
    await output.writePacket(packet, videoOutputIndex);
  }

  console.log('Writing trailer...');
  await output.writeTrailer();
}

async function main() {
  const timeout = setTimeout(() => {
    stop = true;
  }, 10000);

  try {
    await mainRtsp();
  } catch (error) {
    console.error('Error occurred in RTSP processing:', error);
  } finally {
    clearTimeout(timeout);
  }
}

main();
