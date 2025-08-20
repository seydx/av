import type { PipelineControl } from '../src/api/pipeline.js';
import { AV_PIX_FMT_YUV420P, Decoder, Encoder, FilterAPI, HardwareContext, MediaInput, MediaOutput, pipeline } from '../src/index.js';

let pipelineControl: PipelineControl | undefined;

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

  pipelineControl = pipeline(input, decoder, filter, encoder, output);
  await pipelineControl.completion;
}

async function main() {
  const timeout = setTimeout(async () => {
    console.error('Timeout reached, exiting...');
    pipelineControl?.stop();
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
