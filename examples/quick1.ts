import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P, Decoder, Encoder, FF_ENCODER_LIBX264, FilterAPI, FilterPresets, HardwareContext, MediaInput } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = resolve(__dirname, '../testdata/demux_perfect.mp4');

async function hw_decode_hw_filter_sw_encode() {
  console.log('\n--- HW Decode -> HW Filter -> SW Encode ---\n');

  console.log('Opening video input...');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream, { hardware: hw });

  const filterChain = hw.filterPresets.chain().scale(100, 100).hwdownload().format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });

  console.log(`Creating encoder: ${FF_ENCODER_LIBX264}...`);
  using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
    type: 'video',
    width: 100,
    height: 100,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
    timeBase: { num: 1, den: 30 },
    sampleAspectRatio: { num: 1, den: 1 },
  });

  console.log('Starting processing packets...\n');
  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function sw_decode_hw_filter_hw_encode() {
  console.log('\n--- SW Decode -> HW Filter -> HW Encode ---\n');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream);

  console.log('Creating hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  const filterChain = hw.filterPresets.chain().hwupload().scale(100, 100).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });

  console.log('Getting encoder codec...');
  const encoderCodec = hw.getEncoderCodec('h264');
  if (!encoderCodec) {
    throw new Error('No encoder codec available');
  }

  console.log(`Creating encoder: ${encoderCodec}...`);
  using encoder = await Encoder.create(
    encoderCodec,
    {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    },
    {
      hardware: hw,
    },
  );

  console.log('Starting processing packets...\n');

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function hw_decode_hw_filter_hw_encode() {
  console.log('\n--- HW Decode -> HW Filter -> HW Encode ---\n');

  console.log('Opening video input...');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream, { hardware: hw });

  const filterChain = hw.filterPresets.chain().scale(100, 100).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo(), { hardware: hw });

  console.log('Getting encoder codec...');
  const encoderCodec = hw.getEncoderCodec('h264');
  if (!encoderCodec) {
    throw new Error('No encoder codec available');
  }

  console.log(`Creating encoder: ${encoderCodec}...`);
  using encoder = await Encoder.create(
    encoderCodec,
    {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    },
    {
      hardware: hw,
    },
  );

  console.log('Starting processing packets...\n');

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function sw_decode_sw_filter_sw_encode() {
  console.log('\n--- SW Decode -> SW Filter -> SW Encode ---\n');

  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream);

  const filterChain = FilterPresets.chain().scale(100, 100).format(AV_PIX_FMT_YUV420P).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());

  console.log(`Creating encoder: ${FF_ENCODER_LIBX264}...`);
  using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
    type: 'video',
    width: 100,
    height: 100,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
    timeBase: { num: 1, den: 30 },
    sampleAspectRatio: { num: 1, den: 1 },
  });

  console.log('Starting processing packets...\n');
  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function sw_decode_sw_filter_hw_encode() {
  console.log('\n--- SW Decode -> SW Filter -> HW Encode ---\n');

  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream);

  const filterChain = FilterPresets.chain().scale(100, 100).format(AV_PIX_FMT_YUV420P).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Getting encoder codec...');
  const encoderCodec = hw.getEncoderCodec('h264');
  if (!encoderCodec) {
    throw new Error('No encoder codec available');
  }

  console.log(`Creating encoder: ${encoderCodec}...`);
  using encoder = await Encoder.create(
    encoderCodec,
    {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    },
    {
      hardware: hw,
    },
  );

  console.log('Starting processing packets...\n');
  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function hw_decode_hw_encode() {
  console.log('\n--- HW Decode -> HW Encode ---\n');

  console.log('Opening video input...');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream, { hardware: hw });

  console.log('Getting encoder codec...');
  const encoderCodec = hw.getEncoderCodec('h264');
  if (!encoderCodec) {
    throw new Error('No encoder codec available');
  }

  console.log(`Creating encoder: ${encoderCodec}...`);
  using encoder = await Encoder.create(
    encoderCodec,
    {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    },
    {
      hardware: hw,
    },
  );

  console.log('Starting processing packets...\n');

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using encodedPacket = await encoder.encode(decodedFrame);
        if (encodedPacket) {
          console.log('Encoded packet:', encodedPacket.size, 'bytes');
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function sw_decode_sw_encode() {
  console.log('\n--- SW Decode -> SW Encode ---\n');

  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream);

  console.log(`Creating encoder: ${FF_ENCODER_LIBX264}...`);
  using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
    type: 'video',
    width: 100,
    height: 100,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
    timeBase: { num: 1, den: 30 },
    sampleAspectRatio: { num: 1, den: 1 },
  });

  console.log('Starting processing packets...\n');
  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using encodedPacket = await encoder.encode(decodedFrame);
        if (encodedPacket) {
          console.log('Encoded packet:', encodedPacket.size, 'bytes');
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function sw_decode_hw_encode() {
  console.log('\n--- SW Decode -> HW Encode ---\n');

  console.log('Opening video input...');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream);

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Getting encoder codec...');
  const encoderCodec = hw.getEncoderCodec('h264');
  if (!encoderCodec) {
    throw new Error('No encoder codec available');
  }

  console.log(`Creating encoder: ${encoderCodec}...`);
  using encoder = await Encoder.create(
    encoderCodec,
    {
      type: 'video',
      width: 100,
      height: 100,
      pixelFormat: AV_PIX_FMT_YUV420P,
      frameRate: { num: 30, den: 1 },
      timeBase: { num: 1, den: 30 },
      sampleAspectRatio: { num: 1, den: 1 },
    },
    {
      hardware: hw,
    },
  );

  console.log('Starting processing packets...\n');

  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using encodedPacket = await encoder.encode(decodedFrame);
        if (encodedPacket) {
          console.log('Encoded packet:', encodedPacket.size, 'bytes');
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

// ERRORS?

async function hw_decode_hw_filter_sw_encode_fail() {
  console.log('\n--- HW Decode -> HW Filter -> SW Encode (ERROR) ---\n');

  console.log('Opening video input...');
  await using input = await MediaInput.open(inputFile);

  console.log('Retrieving video stream...');
  const videoStream = input.video();
  if (!videoStream) {
    throw new Error('Failed to retrieve video stream');
  }

  console.log('Setting up hardware context...');
  using hw = await HardwareContext.auto();
  if (!hw) {
    throw new Error('No hardware context available');
  }
  console.log(`Using hardware context: ${hw.deviceTypeName}`);

  console.log('Creating decoder...');
  using decoder = await Decoder.create(videoStream, { hardware: hw });

  const filterChain = hw.filterPresets.chain().scale(100, 100).hwdownload().format([AV_PIX_FMT_NV12, AV_PIX_FMT_YUV420P]).build();
  console.log(`Creating filter with: ${filterChain}`);

  console.log('Creating filter...');
  using filter = await FilterAPI.create(filterChain, decoder.getOutputStreamInfo());

  console.log(`Creating encoder: ${FF_ENCODER_LIBX264}...`);
  using encoder = await Encoder.create(FF_ENCODER_LIBX264, {
    type: 'video',
    width: 100,
    height: 100,
    pixelFormat: AV_PIX_FMT_YUV420P,
    frameRate: { num: 30, den: 1 },
    timeBase: { num: 1, den: 30 },
    sampleAspectRatio: { num: 1, den: 1 },
  });

  console.log('Starting processing packets...\n');
  for await (const packet of input.packets()) {
    if (packet.streamIndex === videoStream.index) {
      using decodedFrame = await decoder.decode(packet);
      if (decodedFrame) {
        using filteredFrame = await filter.process(decodedFrame);
        if (filteredFrame) {
          using encodedPacket = await encoder.encode(filteredFrame);
          if (encodedPacket) {
            console.log('Encoded packet:', encodedPacket.size, 'bytes');
          }
        }
      }
    }
  }

  console.log('\nProcessing complete.');
}

async function main() {
  try {
    await hw_decode_hw_filter_sw_encode();
    console.log('\nSuccessfully finished hw_decode_hw_filter_sw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during hw_decode_hw_filter_sw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await sw_decode_hw_filter_hw_encode();
    console.log('\nSuccessfully finished sw_decode_hw_filter_hw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during sw_decode_hw_filter_hw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await hw_decode_hw_filter_hw_encode();
    console.log('\nSuccessfully finished hw_decode_hw_filter_hw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during hw_decode_hw_filter_hw_encoder:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await sw_decode_sw_filter_sw_encode();
    console.log('\nSuccessfully finished sw_decode_sw_filter_sw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during sw_decode_sw_filter_sw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await sw_decode_sw_filter_hw_encode();
    console.log('\nSuccessfully finished sw_decode_sw_filter_hw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during sw_decode_sw_filter_hw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await hw_decode_hw_encode();
    console.log('\nSuccessfully finished hw_decode_hw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during hw_decode_hw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await sw_decode_sw_encode();
    console.log('\nSuccessfully finished sw_decode_sw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during sw_decode_sw_encode:', err);
    console.log('----------------------------------------\n');
  }

  try {
    await sw_decode_hw_encode();
    console.log('\nSuccessfully finished sw_decode_hw_encode');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during sw_decode_hw_encode:', err);
    console.log('----------------------------------------\n');
  }

  // ERRORS?

  try {
    await hw_decode_hw_filter_sw_encode_fail();
    console.log('\nSuccessfully finished hw_decode_hw_filter_sw_encode_fail - THIS SHOULD NOT HAPPEN');
    console.log('----------------------------------------\n');
  } catch (err) {
    console.error('\nError occurred during hw_decode_hw_filter_sw_encode_fail:', err);
    console.log('----------------------------------------\n');
  }
}

main();
