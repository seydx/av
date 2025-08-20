import { Decoder, Encoder, FilterAPI, MediaInput, MediaOutput, pipeline } from '../src/api/index.js';
import { AV_CHANNEL_LAYOUT_STEREO, AV_PIX_FMT_YUV420P, AV_SAMPLE_FMT_FLTP, AV_SAMPLE_FMT_S16 } from '../src/index.js';

async function main() {
  // Open raw YUV video
  await using videoInput = await MediaInput.open({
    type: 'video',
    input: 'testdata/input.yuv',
    width: 1280,
    height: 720,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
  }); // No need to specify format, it will automatically use "rawvideo"

  // Open raw PCM audio
  await using audioInput = await MediaInput.open(
    {
      type: 'audio',
      input: 'testdata/audio.pcm',
      sampleRate: 48000,
      channels: 2,
      sampleFormat: AV_SAMPLE_FMT_S16,
    },
    {
      format: 's16le', // Specify raw audio format
    },
  );

  // Create output
  await using outputVideo = await MediaOutput.open('examples/.tmp/raw_output.h264');
  await using outputAudio = await MediaOutput.open('examples/.tmp/raw_output.aac');

  // For muxing into one output
  // await using output = await MediaOutput.open('examples/.tmp/raw_output.mp4');

  // Get streams
  const videoStream = videoInput.video();
  const audioStream = audioInput.audio();

  if (!videoStream || !audioStream) {
    throw new Error('Missing streams');
  }

  // Create decoders
  using videoDecoder = await Decoder.create(videoStream);
  using audioDecoder = await Decoder.create(audioStream);

  // Create encoders
  using videoEncoder = await Encoder.create('libx264', {
    type: 'video',
    width: 1280,
    height: 720,
    pixelFormat: AV_PIX_FMT_YUV420P,
    timeBase: { num: 1, den: 30 },
    frameRate: { num: 30, den: 1 },
  });

  using audioEncoder = await Encoder.create('aac', {
    type: 'audio',
    sampleRate: 48000,
    sampleFormat: AV_SAMPLE_FMT_FLTP,
    channelLayout: AV_CHANNEL_LAYOUT_STEREO,
    timeBase: { num: 1, den: 48000 },
  });

  // Create audio filter to handle frame size and format conversion
  using audioFilter = await FilterAPI.create('aformat=sample_fmts=fltp:channel_layouts=stereo,asetnsamples=n=1024:p=0', audioStream);

  // Process with pipeline
  const pipelineControl = pipeline(
    { video: videoInput, audio: audioInput },
    {
      video: [videoDecoder, videoEncoder],
      audio: [audioDecoder, audioFilter, audioEncoder],
    },
    {
      video: outputVideo,
      audio: outputAudio,
    },
    // Or if you want to mux into one output, use single output
    // output
  );

  await pipelineControl.completion;

  console.log('Successfully processed raw data!');
}

main().catch(console.error);
