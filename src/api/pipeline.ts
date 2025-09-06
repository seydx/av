/**
 * @module pipeline
 * High-level media processing pipeline for FFmpeg operations.
 * Provides a fluent API for building transcoding, filtering, and stream processing pipelines.
 */

import type { Frame, Packet } from '../lib/index.js';
import type { Stream } from '../lib/stream.js';
import type { BitStreamFilterAPI } from './bitstream-filter.js';
import type { Decoder } from './decoder.js';
import type { Encoder } from './encoder.js';
import type { FilterAPI } from './filter.js';
import type { MediaInput } from './media-input.js';
import type { MediaOutput } from './media-output.js';

// Restrict stream names to known types
export type StreamName = 'video' | 'audio';

// Better type definitions with proper inference
export type NamedInputs<K extends StreamName = StreamName> = Pick<Record<StreamName, MediaInput>, K>;
export type NamedStages<K extends StreamName = StreamName> = Pick<
  Record<StreamName, (Decoder | FilterAPI | FilterAPI[] | Encoder | BitStreamFilterAPI | BitStreamFilterAPI[])[] | 'passthrough'>,
  K
>;
export type NamedOutputs<K extends StreamName = StreamName> = Pick<Record<StreamName, MediaOutput>, K>;

/**
 * Internal metadata for tracking stream components.
 *
 * @internal
 */
interface StreamMetadata {
  encoder?: Encoder;
  decoder?: Decoder;
  bitStreamFilter?: BitStreamFilterAPI;
  streamIndex?: number;
  type?: 'video' | 'audio';
  mediaInput?: MediaInput; // Track source MediaInput for stream copy
}

/**
 * Pipeline control interface for managing pipeline execution.
 * Allows graceful stopping and completion tracking of running pipelines.
 *
 * @example
 * ```typescript
 * const control = pipeline(input, decoder, encoder, output);
 *
 * // Stop after 10 seconds
 * setTimeout(() => control.stop(), 10000);
 *
 * // Wait for completion
 * await control.completion;
 * ```
 */
export interface PipelineControl {
  /**
   * Stop the pipeline gracefully.
   * The pipeline will stop processing after the current operation completes.
   */
  stop(): void;

  /**
   * Check if the pipeline has been stopped.
   *
   * @returns True if stop() has been called
   */
  isStopped(): boolean;

  /**
   * Promise that resolves when the pipeline completes.
   * Resolves when all processing is finished or the pipeline is stopped.
   */
  readonly completion: Promise<void>;
}

// ============================================================================
// Simple Pipeline Overloads (single stream, variable parameters)
// ============================================================================

/**
 * Full transcoding pipeline: input → decoder → encoder → output.
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets to frames
 * @param encoder - Encoder for encoding frames to packets
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * const control = pipeline(input, decoder, encoder, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Full transcoding pipeline with filter: input → decoder → filter → encoder → output.
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets to frames
 * @param filter - Filter or filter chain for processing frames
 * @param encoder - Encoder for encoding frames to packets
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * const control = pipeline(input, decoder, scaleFilter, encoder, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[], encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Transcoding with bitstream filter: input → decoder → encoder → bsf → output.
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param encoder - Encoder for encoding frames
 * @param bsf - Bitstream filter for packet processing
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * const decoder = await Decoder.create(input.video());
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo());
 * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb');
 * const control = pipeline(input, decoder, encoder, bsf, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, encoder: Encoder, bsf: BitStreamFilterAPI | BitStreamFilterAPI[], output: MediaOutput): PipelineControl;

/**
 * Full pipeline with filter and bsf: input → decoder → filter → encoder → bsf → output.
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param filter - Filter or filter chain
 * @param encoder - Encoder for encoding frames
 * @param bsf - Bitstream filter
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * const decoder = await Decoder.create(input.video());
 * const filter = await FilterAPI.create('scale=640:480');
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo());
 * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb');
 * const control = pipeline(input, decoder, filter, encoder, bsf, output);
 * await control.completion;
 * ```
 */
export function pipeline(
  source: MediaInput,
  decoder: Decoder,
  filter: FilterAPI | FilterAPI[],
  encoder: Encoder,
  bsf: BitStreamFilterAPI | BitStreamFilterAPI[],
  output: MediaOutput,
): PipelineControl;

/**
 * Decode + multiple filters + encode: input → decoder → filter1 → filter2 → encoder → output.
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param filter1 - First filter
 * @param filter2 - Second filter
 * @param encoder - Encoder for encoding frames
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * const decoder = await Decoder.create(input.video());
 * const scaleFilter = await FilterAPI.create('scale=640:480');
 * const cropFilter = await FilterAPI.create('crop=640:360');
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo());
 * const control = pipeline(input, decoder, scaleFilter, cropFilter, encoder, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter1: FilterAPI, filter2: FilterAPI, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Stream copy pipeline: input → output (copies all streams).
 *
 * @param source - Media input source
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Copy all streams without re-encoding
 * const control = pipeline(input, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, output: MediaOutput): PipelineControl;

/**
 * Stream copy with bitstream filter: input → bsf → output.
 *
 * @param source - Media input source
 * @param bsf - Bitstream filter for packet processing
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Convert H.264 stream format while copying
 * const bsf = await BitStreamFilterAPI.create('h264_mp4toannexb');
 * const control = pipeline(input, bsf, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: MediaInput, bsf: BitStreamFilterAPI | BitStreamFilterAPI[], output: MediaOutput): PipelineControl;

/**
 * Filter + encode + output: frames → filter → encoder → output.
 *
 * @param source - Frame source (async iterable)
 * @param filter - Filter or filter chain
 * @param encoder - Encoder for encoding frames
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Process frames from custom source
 * const frameSource = generateFrames(); // Your async frame generator
 * const filter = await FilterAPI.create('scale=1920:1080');
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, streamInfo);
 * const control = pipeline(frameSource, filter, encoder, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[], encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Encode + output: frames → encoder → output.
 *
 * @param source - Frame source (async iterable)
 * @param encoder - Encoder for encoding frames
 * @param output - Media output destination
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Encode raw frames directly
 * const frameSource = generateFrames(); // Your async frame generator
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, streamInfo);
 * const control = pipeline(frameSource, encoder, output);
 * await control.completion;
 * ```
 */
export function pipeline(source: AsyncIterable<Frame>, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Partial pipeline: input → decoder (returns frames).
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @returns Async generator of frames
 *
 * @example
 * ```typescript
 * // Get decoded frames for custom processing
 * const decoder = await Decoder.create(input.video());
 * const frames = pipeline(input, decoder);
 * for await (const frame of frames) {
 *   // Process frame
 *   frame.free();
 * }
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder): AsyncGenerator<Frame>;

/**
 * Partial pipeline: input → decoder → filter (returns frames).
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param filter - Filter or filter chain
 * @returns Async generator of frames
 *
 * @example
 * ```typescript
 * // Get filtered frames for custom processing
 * const decoder = await Decoder.create(input.video());
 * const filter = await FilterAPI.create('scale=640:480');
 * const frames = pipeline(input, decoder, filter);
 * for await (const frame of frames) {
 *   // Process filtered frame
 *   frame.free();
 * }
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[]): AsyncGenerator<Frame>;

/**
 * Partial pipeline: input → decoder → filter → encoder (returns packets).
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param filter - Filter or filter chain
 * @param encoder - Encoder for encoding frames
 * @returns Async generator of packets
 *
 * @example
 * ```typescript
 * // Get encoded packets for custom output handling
 * const decoder = await Decoder.create(input.video());
 * const filter = await FilterAPI.create('scale=640:480');
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo());
 * const packets = pipeline(input, decoder, filter, encoder);
 * for await (const packet of packets) {
 *   // Handle encoded packet
 *   packet.free();
 * }
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[], encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: input → decoder → encoder (returns packets).
 *
 * @param source - Media input source
 * @param decoder - Decoder for decoding packets
 * @param encoder - Encoder for encoding frames
 * @returns Async generator of packets
 *
 * @example
 * ```typescript
 * // Transcode to packets for custom output
 * const decoder = await Decoder.create(input.video());
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, decoder.getOutputStreamInfo());
 * const packets = pipeline(input, decoder, encoder);
 * for await (const packet of packets) {
 *   // Handle transcoded packet
 *   packet.free();
 * }
 * ```
 */
export function pipeline(source: MediaInput, decoder: Decoder, encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: frames → filter (returns frames).
 *
 * @param source - Frame source (async iterable)
 * @param filter - Filter or filter chain
 * @returns Async generator of filtered frames
 *
 * @example
 * ```typescript
 * // Filter frames from custom source
 * const frameSource = generateFrames();
 * const filter = await FilterAPI.create('scale=640:480');
 * const filteredFrames = pipeline(frameSource, filter);
 * for await (const frame of filteredFrames) {
 *   // Process filtered frame
 *   frame.free();
 * }
 * ```
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[]): AsyncGenerator<Frame>;

/**
 * Partial pipeline: frames → encoder (returns packets).
 *
 * @param source - Frame source (async iterable)
 * @param encoder - Encoder for encoding frames
 * @returns Async generator of packets
 *
 * @example
 * ```typescript
 * // Encode frames to packets
 * const frameSource = generateFrames();
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, streamInfo);
 * const packets = pipeline(frameSource, encoder);
 * for await (const packet of packets) {
 *   // Handle encoded packet
 *   packet.free();
 * }
 * ```
 */
export function pipeline(source: AsyncIterable<Frame>, encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: frames → filter → encoder (returns packets).
 *
 * @param source - Frame source (async iterable)
 * @param filter - Filter or filter chain
 * @param encoder - Encoder for encoding frames
 * @returns Async generator of packets
 *
 * @example
 * ```typescript
 * // Process frames with filter and encode to packets
 * const frameSource = generateFrames();
 * const filter = await FilterAPI.create('scale=640:480');
 * const encoder = await Encoder.create(FF_ENCODER_LIBX264, streamInfo);
 * const packets = pipeline(frameSource, filter, encoder);
 * for await (const packet of packets) {
 *   // Handle encoded packet
 *   packet.free();
 * }
 * ```
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[], encoder: Encoder): AsyncGenerator<Packet>;

// ============================================================================
// Named Pipeline Overloads (multiple streams, variable parameters)
// ============================================================================

/**
 * Named pipeline with single output - all streams go to the same output.
 *
 * @param inputs - Named input sources (video/audio)
 * @param stages - Named processing stages for each stream
 * @param output - Single output destination for all streams
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Named pipeline for muxing
 * const control = pipeline(
 *   { video: videoInput, audio: audioInput },
 *   {
 *     video: [videoDecoder, scaleFilter, videoEncoder],
 *     audio: [audioDecoder, volumeFilter, audioEncoder]
 *   },
 *   output
 * );
 * await control.completion;
 * ```
 */
export function pipeline<K extends StreamName>(inputs: NamedInputs<K>, stages: NamedStages<K>, output: MediaOutput): PipelineControl;

/**
 * Named pipeline with multiple outputs - each stream has its own output.
 *
 * @param inputs - Named input sources (video/audio)
 * @param stages - Named processing stages for each stream
 * @param outputs - Named output destinations
 * @returns Pipeline control for managing execution
 *
 * @example
 * ```typescript
 * // Named pipeline for audio/video processing
 * const control = pipeline(
 *   { video: videoInput, audio: audioInput },
 *   {
 *     video: [videoDecoder, scaleFilter, videoEncoder],
 *     audio: [audioDecoder, volumeFilter, audioEncoder]
 *   },
 *   { video: videoOutput, audio: audioOutput }
 * );
 * await control.completion;
 * ```
 */
export function pipeline<K extends StreamName>(inputs: NamedInputs<K>, stages: NamedStages<K>, outputs: NamedOutputs<K>): PipelineControl;

/**
 * Partial named pipeline (returns generators for further processing).
 *
 * @param inputs - Named input sources
 * @param stages - Named processing stages
 * @returns Record of async generators for each stream
 *
 * @example
 * ```typescript
 * // Partial named pipeline
 * const generators = pipeline(
 *   { video: videoInput, audio: audioInput },
 *   {
 *     video: [videoDecoder, scaleFilter, videoEncoder],
 *     audio: [audioDecoder, volumeFilter, audioEncoder]
 *   }
 * );
 *
 * // Access individual generators
 * const videoGenerator = generators.video;
 * const audioGenerator = generators.audio;
 *
 * // Use the generators
 * for await (const packet of videoGenerator) {
 *   // Process video packet
 * }
 * for await (const packet of audioGenerator) {
 *   // Process audio packet
 * }
 * ```
 */
export function pipeline<K extends StreamName, T extends Packet | Frame = Packet | Frame>(inputs: NamedInputs<K>, stages: NamedStages<K>): Record<K, AsyncGenerator<T>>;

// ============================================================================
// Implementation
// ============================================================================

/**
 * Pipeline implementation.
 *
 * Creates a processing pipeline from media components.
 * Automatically handles type conversions and proper flushing order.
 *
 * @param args - Variable arguments depending on pipeline type
 * @returns PipelineControl if output is present, AsyncGenerator otherwise
 *
 * @example
 * ```typescript
 * // Simple pipeline
 * const control = pipeline(
 *   input,
 *   decoder,
 *   filter,
 *   encoder,
 *   output
 * );
 * await control.completion;
 *
 * // Named pipeline for muxing
 * const control = pipeline(
 *   { video: videoInput, audio: audioInput },
 *   {
 *     video: [videoDecoder, scaleFilter, videoEncoder],
 *     audio: [audioDecoder, volumeFilter, audioEncoder]
 *   },
 *   output
 * );
 * await control.completion;
 * ```
 */
export function pipeline(...args: any[]): PipelineControl | AsyncGenerator<Packet | Frame> | Record<StreamName, AsyncGenerator<Packet | Frame>> {
  // Detect pipeline type based on first argument
  const firstArg = args[0];

  if (isNamedInputs(firstArg)) {
    // Named pipeline (2 or 3 arguments)
    if (args.length === 2) {
      // Partial named pipeline - return generators
      return runNamedPartialPipeline(args[0], args[1]);
    } else {
      // Full named pipeline with output
      return runNamedPipeline(args[0], args[1], args[2]);
    }
  } else if (isMediaInput(firstArg)) {
    // Check if this is a stream copy (MediaInput → MediaOutput)
    if (args.length === 2 && isMediaOutput(args[1])) {
      // Stream copy all streams
      return runMediaInputPipeline(args[0], args[1]);
    } else {
      // Simple pipeline starting with MediaInput
      return runSimplePipeline(args);
    }
  } else {
    // Simple pipeline (variable arguments)
    return runSimplePipeline(args);
  }
}

// ============================================================================
// PipelineControl Implementation
// ============================================================================

/**
 * Pipeline control implementation.
 *
 * @internal
 */
class PipelineControlImpl implements PipelineControl {
  private _stopped = false;
  private _completion: Promise<void>;

  /**
   * @param executionPromise - Promise that resolves when pipeline completes
   * @internal
   */
  constructor(executionPromise: Promise<void>) {
    // Don't resolve immediately on stop, wait for the actual pipeline to finish
    this._completion = executionPromise;
  }

  /**
   * Stop the pipeline.
   *
   * @example
   * ```typescript
   * const control = pipeline(input, decoder, filter, encoder, output);
   * control.stop();
   * ```
   *
   * @see {@link PipelineControl.isStopped}
   */
  stop(): void {
    this._stopped = true;
  }

  /**
   * Check if pipeline is stopped.
   *
   * @returns True if stopped
   *
   * @example
   * ```typescript
   * const control = pipeline(input, decoder, filter, encoder, output);
   * const isStopped = control.isStopped();
   * ```
   *
   * @see {@link PipelineControl.stop}
   */
  isStopped(): boolean {
    return this._stopped;
  }

  /**
   * Get completion promise.
   */
  get completion(): Promise<void> {
    return this._completion;
  }
}

// ============================================================================
// MediaInput Pipeline Implementation
// ============================================================================

/**
 * Run a media input pipeline for stream copy.
 *
 * @param input - Media input source
 * @param output - Media output destination
 * @returns Pipeline control interface
 *
 * @internal
 */
function runMediaInputPipeline(input: MediaInput, output: MediaOutput): PipelineControl {
  let control: PipelineControl;
  // eslint-disable-next-line prefer-const
  control = new PipelineControlImpl(runMediaInputPipelineAsync(input, output, () => control.isStopped()));
  return control;
}

/**
 * Run media input pipeline asynchronously.
 *
 * @param input - Media input source
 * @param output - Media output destination
 * @param shouldStop - Function to check if pipeline should stop
 * @internal
 */
async function runMediaInputPipelineAsync(input: MediaInput, output: MediaOutput, shouldStop: () => boolean): Promise<void> {
  // Get all streams from input
  const videoStream = input.video();
  const audioStream = input.audio();
  const streams: { stream: any; index: number }[] = [];

  // Add video stream if present
  if (videoStream) {
    const outputIndex = output.addStream(videoStream);
    streams.push({ stream: videoStream, index: outputIndex });
  }

  // Add audio stream if present
  if (audioStream) {
    const outputIndex = output.addStream(audioStream);
    streams.push({ stream: audioStream, index: outputIndex });
  }

  // Add any other streams
  const allStreams = input.streams;
  for (const stream of allStreams) {
    // Skip if already added
    if (stream !== videoStream && stream !== audioStream) {
      const outputIndex = output.addStream(stream);
      streams.push({ stream, index: outputIndex });
    }
  }

  // Write header
  if (!output.isHeaderWritten()) {
    await output.writeHeader();
  }

  // Copy all packets
  for await (const packet of input.packets()) {
    // Check if we should stop
    if (shouldStop()) {
      packet.free();
      break;
    }

    // Find the corresponding output stream index
    const mapping = streams.find((s) => s.stream.index === packet.streamIndex);
    if (mapping) {
      await output.writePacket(packet, mapping.index);
    }
    packet.free(); // Free packet after processing
  }

  // Write trailer
  if (!output.isTrailerWritten()) {
    await output.writeTrailer();
  }
}

// ============================================================================
// Simple Pipeline Implementation
// ============================================================================

/**
 * Run a simple linear pipeline.
 *
 * @param args - Pipeline arguments
 * @returns Pipeline control or async generator
 *
 * @internal
 */
function runSimplePipeline(args: any[]): PipelineControl | AsyncGenerator<Packet | Frame> {
  const [source, ...stages] = args;

  // Check if last stage is MediaOutput (consumes stream)
  const lastStage = stages[stages.length - 1];
  const isOutput = isMediaOutput(lastStage);

  // Track metadata through pipeline
  const metadata: StreamMetadata = {};

  // Store MediaInput reference if we have one
  if (isMediaInput(source)) {
    metadata.mediaInput = source;
  }

  // Build the pipeline generator
  // If output is present, exclude it from stages for processing
  const processStages = isOutput ? stages.slice(0, -1) : stages;

  // Process metadata first by walking through stages
  for (const stage of processStages) {
    if (isDecoder(stage)) {
      metadata.decoder = stage;
    } else if (isEncoder(stage)) {
      metadata.encoder = stage;
    } else if (isBitStreamFilterAPI(stage)) {
      metadata.bitStreamFilter = stage;
    }
  }

  // Convert MediaInput to packet stream if needed
  // If we have a decoder or BSF, filter packets by stream index
  let actualSource: AsyncIterable<Packet | Frame>;
  if (isMediaInput(source)) {
    if (metadata.decoder) {
      // Filter packets for the decoder's stream
      const streamIndex = metadata.decoder.getStream().index;
      actualSource = source.packets(streamIndex);
    } else if (metadata.bitStreamFilter) {
      // Filter packets for the BSF's stream
      const streamIndex = metadata.bitStreamFilter.getStream().index;
      actualSource = source.packets(streamIndex);
    } else {
      // No decoder or BSF, pass all packets
      actualSource = source.packets();
    }
  } else {
    actualSource = source;
  }

  const generator = buildSimplePipeline(actualSource, processStages);

  // If output, consume the generator
  if (isOutput) {
    let control: PipelineControl;
    // eslint-disable-next-line prefer-const
    control = new PipelineControlImpl(consumeSimplePipeline(generator, lastStage, metadata, () => control.isStopped()));
    return control;
  }

  // Otherwise return the generator for further processing
  return generator;
}

/**
 * Build a simple pipeline generator.
 *
 * @param source - Source of packets or frames
 * @param stages - Processing stages
 * @yields Processed packets or frames
 * @internal
 */
async function* buildSimplePipeline(
  source: AsyncIterable<Packet | Frame>,
  stages: (Decoder | Encoder | FilterAPI | FilterAPI[] | BitStreamFilterAPI | BitStreamFilterAPI[] | MediaOutput)[],
): AsyncGenerator<Packet | Frame> {
  let stream: AsyncIterable<any> = source;

  for (const stage of stages) {
    if (isDecoder(stage)) {
      stream = decodeStream(stream as AsyncIterable<Packet>, stage);
    } else if (isEncoder(stage)) {
      stream = encodeStream(stream as AsyncIterable<Frame>, stage);
    } else if (isFilterAPI(stage)) {
      stream = filterStream(stream as AsyncIterable<Frame>, stage);
    } else if (isBitStreamFilterAPI(stage)) {
      stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, stage);
    } else if (Array.isArray(stage)) {
      // Chain multiple filters or BSFs
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
        } else if (isBitStreamFilterAPI(filter)) {
          stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, filter);
        }
      }
    }
  }

  yield* stream;
}

/**
 * Consume a simple pipeline stream and write to output.
 *
 * @param stream - Stream of packets or frames
 * @param output - Media output destination
 * @param metadata - Stream metadata
 * @param shouldStop - Function to check if pipeline should stop
 * @internal
 */
async function consumeSimplePipeline(stream: AsyncIterable<Packet | Frame>, output: MediaOutput, metadata: StreamMetadata, shouldStop: () => boolean): Promise<void> {
  // Add stream to output if we have encoder or decoder info
  let streamIndex = 0;

  if (metadata.encoder) {
    streamIndex = output.addStream(metadata.encoder);
  } else if (metadata.decoder) {
    // Stream copy - use decoder's original stream
    const originalStream = metadata.decoder.getStream();
    streamIndex = output.addStream(originalStream);
  } else if (metadata.bitStreamFilter) {
    // BSF without encoder/decoder - use BSF's original stream
    const originalStream = metadata.bitStreamFilter.getStream();
    streamIndex = output.addStream(originalStream);
  } else {
    // For direct MediaInput → MediaOutput, we redirect to runMediaInputPipeline
    // This case shouldn't happen in simple pipeline
    throw new Error('Cannot determine stream configuration. This is likely a bug in the pipeline.');
  }

  // Write header if needed
  if (!output.isHeaderWritten()) {
    await output.writeHeader();
  }

  // Process stream
  for await (const item of stream) {
    // Check if we should stop
    if (shouldStop()) {
      if (isPacket(item)) {
        item.free();
      } else {
        item.free();
      }
      break;
    }

    if (isPacket(item)) {
      await output.writePacket(item, streamIndex);
      // Free the packet after writing
      item.free();
    } else {
      throw new Error('Cannot write frames directly to MediaOutput. Use an encoder first.');
    }
  }

  // Write trailer if needed
  if (!output.isTrailerWritten()) {
    await output.writeTrailer();
  }
}

// ============================================================================
// Named Pipeline Implementation
// ============================================================================

/**
 * Run a named partial pipeline.
 *
 * @param inputs - Named input sources
 * @param stages - Named processing stages
 * @returns Record of async generators
 *
 * @internal
 */
function runNamedPartialPipeline<K extends StreamName>(inputs: NamedInputs<K>, stages: NamedStages<K>): Record<K, AsyncGenerator<Packet | Frame>> {
  const result = {} as Record<K, AsyncGenerator<Packet | Frame>>;

  for (const [streamName, streamStages] of Object.entries(stages) as [
    StreamName,
    (Decoder | FilterAPI | FilterAPI[] | Encoder | BitStreamFilterAPI | BitStreamFilterAPI[])[] | 'passthrough',
  ][]) {
    const input = (inputs as any)[streamName] as MediaInput;
    if (!input) {
      throw new Error(`No input found for stream: ${streamName}`);
    }

    // Get the appropriate stream based on the stream name
    let stream: Stream | null = null;
    switch (streamName) {
      case 'video':
        stream = input.video() ?? null;
        break;
      case 'audio':
        stream = input.audio() ?? null;
        break;
      default:
        // This should never happen
        throw new Error(`Invalid stream name: ${streamName}. Must be 'video' or 'audio'.`);
    }

    if (!stream) {
      throw new Error(`No ${streamName} stream found in input.`);
    }

    if (streamStages === 'passthrough') {
      // Direct passthrough - return input packets for this specific stream
      (result as any)[streamName] = (async function* () {
        for await (const packet of input.packets(stream.index)) {
          yield packet;
        }
      })();
    } else {
      // Process the stream - pass packets for this specific stream only
      // Build pipeline for this stream (can return frames or packets)
      const metadata: StreamMetadata = {};
      (result as any)[streamName] = buildFlexibleNamedStreamPipeline(input.packets(stream.index), streamStages, metadata);
    }
  }

  return result;
}

/**
 * Run a named pipeline with outputs.
 *
 * @param inputs - Named input sources
 * @param stages - Named processing stages
 * @param output - Output destination(s)
 * @returns Pipeline control interface
 *
 * @internal
 */
function runNamedPipeline<K extends StreamName>(inputs: NamedInputs<K>, stages: NamedStages<K>, output: MediaOutput | NamedOutputs<K>): PipelineControl {
  let control: PipelineControl;
  // eslint-disable-next-line prefer-const
  control = new PipelineControlImpl(runNamedPipelineAsync(inputs, stages, output, () => control.isStopped()));
  return control;
}

/**
 * Run named pipeline asynchronously.
 *
 * @param inputs - Named input sources
 * @param stages - Named processing stages
 * @param output - Output destination(s)
 * @param shouldStop - Function to check if pipeline should stop
 * @internal
 */
async function runNamedPipelineAsync<K extends StreamName>(
  inputs: NamedInputs<K>,
  stages: NamedStages<K>,
  output: MediaOutput | NamedOutputs<K>,
  shouldStop: () => boolean,
): Promise<void> {
  // Track metadata for each stream
  const streamMetadata: Record<StreamName, StreamMetadata> = {} as any;

  // Process each named stream into generators
  const processedStreams: Record<StreamName, AsyncIterable<Packet>> = {} as any;

  for (const [streamName, streamStages] of Object.entries(stages) as [
    StreamName,
    (Decoder | FilterAPI | FilterAPI[] | Encoder | BitStreamFilterAPI | BitStreamFilterAPI[])[] | 'passthrough',
  ][]) {
    const metadata: StreamMetadata = {};
    (streamMetadata as any)[streamName] = metadata;

    const input = (inputs as any)[streamName] as MediaInput;
    if (!input) {
      throw new Error(`No input found for stream: ${streamName}`);
    }

    if (streamStages === 'passthrough') {
      // Direct passthrough - no processing
      let stream: Stream | null = null;

      switch (streamName) {
        case 'video':
          stream = input.video() ?? null;
          metadata.type = 'video';
          break;
        case 'audio':
          stream = input.audio() ?? null;
          metadata.type = 'audio';
          break;
      }

      if (!stream) {
        throw new Error(`No ${streamName} stream found in input for passthrough.`);
      }

      (processedStreams as any)[streamName] = input.packets(stream.index);
      metadata.mediaInput = input; // Track MediaInput for passthrough
    } else {
      // Process the stream
      // Pre-populate metadata by walking through stages
      for (const stage of streamStages) {
        if (isDecoder(stage)) {
          metadata.decoder = stage;
        } else if (isEncoder(stage)) {
          metadata.encoder = stage;
        } else if (isBitStreamFilterAPI(stage)) {
          metadata.bitStreamFilter = stage;
        }
      }

      // Get packets - filter by stream index based on decoder, BSF, or stream type
      let packets: AsyncIterable<Packet>;
      if (metadata.decoder) {
        const streamIndex = metadata.decoder.getStream().index;
        packets = input.packets(streamIndex);
      } else if (metadata.bitStreamFilter) {
        const streamIndex = metadata.bitStreamFilter.getStream().index;
        packets = input.packets(streamIndex);
      } else {
        // No decoder or BSF - determine stream by name
        let stream: Stream | null = null;
        switch (streamName) {
          case 'video':
            stream = input.video() ?? null;
            break;
          case 'audio':
            stream = input.audio() ?? null;
            break;
        }

        if (!stream) {
          throw new Error(`No ${streamName} stream found in input.`);
        }

        packets = input.packets(stream.index);
      }

      // Build pipeline for this stream
      (processedStreams as any)[streamName] = buildNamedStreamPipeline(packets, streamStages, metadata);
    }
  }

  // Write to output(s)
  if (isMediaOutput(output)) {
    // Single output - properly interleave all streams
    await interleaveToOutput(processedStreams, output, streamMetadata, shouldStop);
  } else {
    // Multiple outputs - write each stream to its output
    const outputs = output;
    const promises: Promise<void>[] = [];

    for (const [streamName, stream] of Object.entries(processedStreams) as [StreamName, AsyncIterable<Packet>][]) {
      const streamOutput = (outputs as any)[streamName] as MediaOutput | undefined;
      if (streamOutput) {
        const metadata = streamMetadata[streamName];
        promises.push(consumeNamedStream(stream, streamOutput, metadata, shouldStop));
      }
    }

    await Promise.all(promises);
  }
}

/**
 * Build a flexible named stream pipeline.
 *
 * @param source - Source packets
 * @param stages - Processing stages
 * @param metadata - Stream metadata
 * @yields Processed packets or frames
 * @internal
 */
async function* buildFlexibleNamedStreamPipeline(
  source: AsyncIterable<Packet>,
  stages: (Decoder | FilterAPI | FilterAPI[] | Encoder | BitStreamFilterAPI | BitStreamFilterAPI[])[],
  metadata: StreamMetadata,
): AsyncGenerator<Packet | Frame> {
  let stream: AsyncIterable<any> = source;

  for (const stage of stages) {
    if (isDecoder(stage)) {
      metadata.decoder = stage;
      stream = decodeStream(stream as AsyncIterable<Packet>, stage);
    } else if (isEncoder(stage)) {
      metadata.encoder = stage;
      stream = encodeStream(stream as AsyncIterable<Frame>, stage);
    } else if (isFilterAPI(stage)) {
      stream = filterStream(stream as AsyncIterable<Frame>, stage);
    } else if (isBitStreamFilterAPI(stage)) {
      metadata.bitStreamFilter = stage;
      stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, stage);
    } else if (Array.isArray(stage)) {
      // Chain multiple filters or BSFs
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
        } else if (isBitStreamFilterAPI(filter)) {
          stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, filter);
        }
      }
    }
  }

  // Yield whatever the pipeline produces (frames or packets)
  yield* stream;
}

/**
 * Build a named stream pipeline.
 *
 * @param source - Source packets
 * @param stages - Processing stages
 * @param metadata - Stream metadata
 * @yields Processed packets
 * @internal
 */
async function* buildNamedStreamPipeline(
  source: AsyncIterable<Packet>,
  stages: (Decoder | FilterAPI | FilterAPI[] | Encoder | BitStreamFilterAPI | BitStreamFilterAPI[])[],
  metadata: StreamMetadata,
): AsyncGenerator<Packet> {
  let stream: AsyncIterable<any> = source;

  for (const stage of stages) {
    if (isDecoder(stage)) {
      metadata.decoder = stage;
      stream = decodeStream(stream as AsyncIterable<Packet>, stage);
    } else if (isEncoder(stage)) {
      metadata.encoder = stage;
      stream = encodeStream(stream as AsyncIterable<Frame>, stage);
    } else if (isFilterAPI(stage)) {
      stream = filterStream(stream as AsyncIterable<Frame>, stage);
    } else if (isBitStreamFilterAPI(stage)) {
      metadata.bitStreamFilter = stage;
      stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, stage);
    } else if (Array.isArray(stage)) {
      // Chain multiple filters or BSFs
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
        } else if (isBitStreamFilterAPI(filter)) {
          stream = bitStreamFilterStream(stream as AsyncIterable<Packet>, filter);
        }
      }
    }
  }

  // Ensure we're yielding packets
  for await (const item of stream) {
    if (isPacket(item)) {
      yield item;
    } else {
      throw new Error('Named pipeline must end with packets (use encoder after filters)');
    }
  }
}

/**
 * Consume a named stream and write to output.
 *
 * @param stream - Stream of packets
 * @param output - Media output destination
 * @param metadata - Stream metadata
 * @param shouldStop - Function to check if pipeline should stop
 * @internal
 */
async function consumeNamedStream(stream: AsyncIterable<Packet>, output: MediaOutput, metadata: StreamMetadata, shouldStop: () => boolean): Promise<void> {
  // Add stream to output
  let streamIndex = 0;

  if (metadata.encoder) {
    streamIndex = output.addStream(metadata.encoder);
  } else if (metadata.decoder) {
    // Stream copy - use decoder's original stream
    const originalStream = metadata.decoder.getStream();
    streamIndex = output.addStream(originalStream);
  } else if (metadata.bitStreamFilter) {
    // BSF - use BSF's original stream
    const originalStream = metadata.bitStreamFilter.getStream();
    streamIndex = output.addStream(originalStream);
  } else if (metadata.mediaInput) {
    // Passthrough from MediaInput - use type hint from metadata
    const inputStream = metadata.type === 'video' ? metadata.mediaInput.video() : metadata.mediaInput.audio();
    if (!inputStream) {
      throw new Error(`No ${metadata.type} stream found in MediaInput`);
    }
    streamIndex = output.addStream(inputStream);
  } else {
    // This should not happen with the new API
    throw new Error('Cannot determine stream configuration. This is likely a bug in the pipeline.');
  }

  // Store for later use
  metadata.streamIndex = streamIndex;

  // Write header if needed
  if (!output.isHeaderWritten()) {
    await output.writeHeader();
  }

  // Write all packets
  for await (const packet of stream) {
    // Check if we should stop
    if (shouldStop()) {
      packet.free();
      break;
    }

    try {
      await output.writePacket(packet, streamIndex);
    } finally {
      packet.free(); // Free packet after writing
    }
  }

  // Note: Trailer will be written by interleaveToOutput
}

/**
 * Interleave multiple streams to a single output.
 *
 * @param streams - Record of packet streams
 * @param output - Media output destination
 * @param metadata - Stream metadata for each stream
 * @param shouldStop - Function to check if pipeline should stop
 * @internal
 */
async function interleaveToOutput(
  streams: Record<StreamName, AsyncIterable<Packet>>,
  output: MediaOutput,
  metadata: Record<StreamName, StreamMetadata>,
  shouldStop: () => boolean,
): Promise<void> {
  // Add all streams to output first
  const streamIndices: Record<StreamName, number> = {} as any;

  for (const [name, meta] of Object.entries(metadata) as [StreamName, StreamMetadata][]) {
    if (meta.encoder) {
      streamIndices[name] = output.addStream(meta.encoder);
    } else if (meta.decoder) {
      // Stream copy - use decoder's original stream
      const originalStream = meta.decoder.getStream();
      streamIndices[name] = output.addStream(originalStream);
    } else if (meta.bitStreamFilter) {
      // BSF - use BSF's original stream
      const originalStream = meta.bitStreamFilter.getStream();
      streamIndices[name] = output.addStream(originalStream);
    } else if (meta.mediaInput) {
      // Passthrough from MediaInput - use stream name to determine which stream
      const stream = name.includes('video') ? meta.mediaInput.video() : meta.mediaInput.audio();
      if (!stream) {
        throw new Error(`No matching stream found in MediaInput for ${name}`);
      }
      streamIndices[name] = output.addStream(stream);
    } else {
      // This should not happen
      throw new Error(`Cannot determine stream configuration for ${name}. This is likely a bug in the pipeline.`);
    }
  }

  // Write header
  if (!output.isHeaderWritten()) {
    await output.writeHeader();
  }

  // Create packet queues for each stream
  interface PacketWithStream extends Packet {
    _streamName: string;
  }

  const queues = new Map<StreamName, PacketWithStream[]>();
  const iterators = new Map<StreamName, AsyncIterator<Packet>>();
  const done = new Set<StreamName>();

  // Initialize iterators
  for (const [name, stream] of Object.entries(streams) as [StreamName, AsyncIterable<Packet>][]) {
    queues.set(name, []);
    iterators.set(name, stream[Symbol.asyncIterator]());
  }

  // Read initial packet from each stream
  for (const [name, iterator] of iterators) {
    const result = await iterator.next();
    if (!result.done && result.value) {
      const packet = result.value as PacketWithStream;
      packet._streamName = name;
      queues.get(name)!.push(packet);
    } else {
      done.add(name);
    }
  }

  // Interleave packets based on DTS/PTS
  while (done.size < Object.keys(streams).length && !shouldStop()) {
    // Find packet with smallest DTS/PTS
    let minPacket: PacketWithStream | null = null;
    let minStreamName: StreamName | null = null;
    let minTime = BigInt(Number.MAX_SAFE_INTEGER);

    for (const [name, queue] of queues) {
      if (queue.length > 0) {
        const packet = queue[0];
        const time = packet.dts ?? packet.pts ?? BigInt(0);
        if (time < minTime) {
          minTime = time;
          minPacket = packet;
          minStreamName = name;
        }
      }
    }

    if (!minPacket || !minStreamName) {
      // All queues empty, read more
      for (const [name, iterator] of iterators) {
        if (!done.has(name)) {
          const result = await iterator.next();
          if (!result.done && result.value) {
            const packet = result.value as PacketWithStream;
            packet._streamName = name;
            queues.get(name)!.push(packet);
          } else {
            done.add(name);
          }
        }
      }
      continue;
    }

    // Write the packet with smallest timestamp
    const streamIndex = streamIndices[minStreamName];
    await output.writePacket(minPacket, streamIndex);

    // Free the packet after writing
    minPacket.free();

    // Remove from queue
    queues.get(minStreamName)!.shift();

    // Read next packet from that stream
    const iterator = iterators.get(minStreamName)!;
    const result = await iterator.next();
    if (!result.done && result.value) {
      const packet = result.value as PacketWithStream;
      packet._streamName = minStreamName;
      queues.get(minStreamName)!.push(packet);
    } else {
      done.add(minStreamName);
    }
  }

  // If stopped, free all remaining packets in queues
  if (shouldStop()) {
    for (const [, queue] of queues) {
      for (const packet of queue) {
        packet.free();
      }
    }
  } else {
    // Write any remaining packets
    for (const [name, queue] of queues) {
      const streamIndex = streamIndices[name];
      for (const packet of queue) {
        await output.writePacket(packet, streamIndex);
        packet.free(); // Free packet after writing
      }
    }
  }

  // Write trailer
  if (!output.isTrailerWritten()) {
    await output.writeTrailer();
  }
}

// ============================================================================
// Stream Processing Functions
// ============================================================================

/**
 * Decode a stream of packets to frames.
 *
 * @param packets - Input packets
 * @param decoder - Decoder instance
 * @yields Decoded frames
 * @internal
 */
async function* decodeStream(packets: AsyncIterable<Packet>, decoder: Decoder): AsyncGenerator<Frame> {
  // Process all packets
  for await (const packet of packets) {
    try {
      const frame = await decoder.decode(packet);
      if (frame) {
        yield frame;
      }
    } finally {
      // Free packet after decoding
      packet.free();
    }
  }

  // Flush decoder
  if ('flushFrames' in decoder && typeof decoder.flushFrames === 'function') {
    // Use generator method if available
    for await (const frame of decoder.flushFrames()) {
      yield frame;
    }
  } else {
    // Fallback to loop
    let frame;
    while ((frame = await decoder.flush()) !== null) {
      yield frame;
    }
  }
}

/**
 * Encode a stream of frames to packets.
 *
 * @param frames - Input frames
 * @param encoder - Encoder instance
 * @yields Encoded packets
 * @internal
 */
async function* encodeStream(frames: AsyncIterable<Frame>, encoder: Encoder): AsyncGenerator<Packet> {
  // Process all frames
  for await (const frame of frames) {
    try {
      const packet = await encoder.encode(frame);
      if (packet) {
        yield packet;
      }
    } finally {
      // Free the input frame after encoding
      frame.free();
    }
  }

  // Flush encoder
  if ('flushPackets' in encoder && typeof encoder.flushPackets === 'function') {
    // Use generator method if available
    for await (const packet of encoder.flushPackets()) {
      yield packet;
    }
  } else {
    // Fallback to loop
    let packet;
    while ((packet = await encoder.flush()) !== null) {
      yield packet;
    }
  }
}

/**
 * Filter a stream of frames.
 *
 * @param frames - Input frames
 * @param filter - Filter instance
 * @yields Filtered frames
 * @internal
 */
async function* filterStream(frames: AsyncIterable<Frame>, filter: FilterAPI): AsyncGenerator<Frame> {
  // Process all frames
  for await (const frame of frames) {
    try {
      const filtered = await filter.process(frame);
      if (filtered) {
        yield filtered;
      }

      // Check for buffered frames
      let buffered;
      while ((buffered = await filter.receive()) !== null) {
        yield buffered;
      }
    } finally {
      // Free the input frame after filtering
      frame.free();
    }
  }

  // Flush filter
  if ('flushFrames' in filter && typeof filter.flushFrames === 'function') {
    // Use generator method if available
    for await (const frame of filter.flushFrames()) {
      yield frame;
    }
  } else {
    // Fallback to manual flush + receive
    await filter.flush();
    let frame;
    while ((frame = await filter.receive()) !== null) {
      yield frame;
    }
  }
}

/**
 * Process packets through a bitstream filter.
 *
 * @param packets - Input packets
 * @param bsf - Bitstream filter instance
 * @yields Filtered packets
 * @internal
 */
async function* bitStreamFilterStream(packets: AsyncIterable<Packet>, bsf: BitStreamFilterAPI): AsyncGenerator<Packet> {
  // Process all packets through bitstream filter
  for await (const packet of packets) {
    try {
      const filtered = await bsf.process(packet);
      for (const outPacket of filtered) {
        yield outPacket;
      }
    } finally {
      // Free the input packet after filtering
      packet.free();
    }
  }

  // Flush bitstream filter
  for await (const packet of bsf.flushPackets()) {
    yield packet;
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if object is named inputs.
 *
 * @param obj - Object to check
 * @returns True if object is NamedInputs
 *
 * @internal
 */
function isNamedInputs(obj: any): obj is NamedInputs<any> {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && !isAsyncIterable(obj) && !isMediaInput(obj);
}

/**
 * Check if object is async iterable.
 *
 * @param obj - Object to check
 * @returns True if object is AsyncIterable
 *
 * @internal
 */
function isAsyncIterable(obj: any): obj is AsyncIterable<any> {
  return obj && typeof obj[Symbol.asyncIterator] === 'function';
}

/**
 * Check if object is MediaInput.
 *
 * @param obj - Object to check
 * @returns True if object is MediaInput
 *
 * @internal
 */
function isMediaInput(obj: any): obj is MediaInput {
  return obj && typeof obj.packets === 'function' && typeof obj.video === 'function' && typeof obj.audio === 'function';
}

/**
 * Check if object is Decoder.
 *
 * @param obj - Object to check
 * @returns True if object is Decoder
 *
 * @internal
 */
function isDecoder(obj: any): obj is Decoder {
  return obj && typeof obj.decode === 'function' && typeof obj.flush === 'function';
}

/**
 * Check if object is Encoder.
 *
 * @param obj - Object to check
 * @returns True if object is Encoder
 *
 * @internal
 */
function isEncoder(obj: any): obj is Encoder {
  return obj && typeof obj.encode === 'function' && typeof obj.flush === 'function';
}

/**
 * Check if object is FilterAPI.
 *
 * @param obj - Object to check
 * @returns True if object is FilterAPI
 *
 * @internal
 */
function isFilterAPI(obj: any): obj is FilterAPI {
  return obj && typeof obj.process === 'function' && typeof obj.receive === 'function';
}

/**
 * Check if object is BitStreamFilterAPI.
 *
 * @param obj - Object to check
 * @returns True if object is BitStreamFilterAPI
 *
 * @internal
 */
function isBitStreamFilterAPI(obj: any): obj is BitStreamFilterAPI {
  return obj && typeof obj.process === 'function' && typeof obj.flushPackets === 'function' && typeof obj.reset === 'function';
}

/**
 * Check if object is MediaOutput.
 *
 * @param obj - Object to check
 * @returns True if object is MediaOutput
 *
 * @internal
 */
function isMediaOutput(obj: any): obj is MediaOutput {
  return obj && typeof obj.writePacket === 'function' && typeof obj.writeHeader === 'function';
}

/**
 * Check if object is Packet.
 *
 * @param obj - Object to check
 * @returns True if object is Packet
 *
 * @internal
 */
function isPacket(obj: any): obj is Packet {
  return obj && 'streamIndex' in obj && 'pts' in obj && 'dts' in obj;
}
