import { AV_PIX_FMT_YUV420P, Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput } from '../src/index.js';

let stop = false;

async function mainRtsp() {
  console.log('Opening input...');

  await using input = await MediaInput.open({
    // Specify expected input parameters
    type: 'video',
    input: 'testdata/input.yuv',
    width: 1280,
    height: 720,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
  }); // No need to specify format, it will automatically use "rawvideo"

  await using output = await MediaOutput.open('examples/.tmp/raw-video.mp4');

  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('No video stream found');
  }

  console.log(`Input video: ${videoStream.codecpar.width}x${videoStream.codecpar.height} codecId=${videoStream.codecpar.codecId} format=${videoStream.codecpar.format}`);
  console.log(`Input timeBase: ${videoStream.timeBase.num}/${videoStream.timeBase.den}`);
  console.log(`Input frameRate: ${videoStream.avgFrameRate.num}/${videoStream.avgFrameRate.den} (avg), ${videoStream.rFrameRate.num}/${videoStream.rFrameRate.den} (r)`);

  using hardware = await HardwareContext.auto();

  using decoder = await Decoder.create(videoStream, {
    hardware, // Will be ignored automatically for software decoder because of "rawvideo"
  });

  using filter = await FilterAPI.create('hwupload,scale_vt=640:360,setpts=N/FRAME_RATE/TB', videoStream, {
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

  await output.writeHeader();

  const videoInputGenerator = input.packets(videoStream.index);
  const videoDecoderGenerator = decoder.frames(videoInputGenerator);
  const videoFilterGenerator = filter.frames(videoDecoderGenerator);
  const videoEncoderGenerator = encoder.packets(videoFilterGenerator);

  for await (const packet of videoEncoderGenerator) {
    await output.writePacket(packet, videoOutputIndex);

    if (stop) {
      console.log('Stopping processing');
      break;
    }
  }

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
