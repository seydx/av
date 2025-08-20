/**
 * Pipeline - Stream-based media processing pipeline
 *
 * Provides a Node.js-style pipeline function for chaining media processing components.
 * Automatically handles type conversions, buffering, and flushing.
 *
 * Supports two modes:
 * 1. Simple: Single stream with variable parameters
 * 2. Named: Multiple streams with named routing (always 3 parameters)
 *
 * @module api/pipeline
 */

import type { Frame, Packet } from '../lib/index.js';
import type { Decoder } from './decoder.js';
import type { Encoder } from './encoder.js';
import type { FilterAPI } from './filter.js';
import type { MediaInput } from './media-input.js';
import type { MediaOutput } from './media-output.js';

// ============================================================================
// Types
// ============================================================================

type NamedInputs = Record<string, MediaInput>;
type NamedStages = Record<string, (Decoder | FilterAPI | FilterAPI[] | Encoder)[] | 'passthrough'>;

interface StreamMetadata {
  encoder?: Encoder;
  decoder?: Decoder;
  streamIndex?: number;
  type?: 'video' | 'audio';
  mediaInput?: MediaInput; // Track source MediaInput for stream copy
}

/**
 * Pipeline control interface for managing pipeline execution
 */
export interface PipelineControl {
  /**
   * Stop the pipeline gracefully
   */
  stop(): void;

  /**
   * Check if the pipeline has been stopped
   */
  isStopped(): boolean;

  /**
   * Promise that resolves when the pipeline completes
   */
  readonly completion: Promise<void>;
}

// ============================================================================
// Simple Pipeline Overloads (single stream, variable parameters)
// ============================================================================

/**
 * Full transcoding pipeline: input → decoder → encoder → output
 */
export function pipeline(source: MediaInput, decoder: Decoder, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Full transcoding pipeline with filter: input → decoder → filter → encoder → output
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[], encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Decode + multiple filters + encode: input → decoder → filter1 → filter2 → encoder → output
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter1: FilterAPI, filter2: FilterAPI, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Stream copy pipeline: input → output (copies all streams)
 */
export function pipeline(source: MediaInput, output: MediaOutput): PipelineControl;

/**
 * Filter + encode + output: frames → filter → encoder → output
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[], encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Encode + output: frames → encoder → output
 */
export function pipeline(source: AsyncIterable<Frame>, encoder: Encoder, output: MediaOutput): PipelineControl;

/**
 * Partial pipeline: input → decoder (returns frames)
 */
export function pipeline(source: MediaInput, decoder: Decoder): AsyncGenerator<Frame>;

/**
 * Partial pipeline: input → decoder → filter (returns frames)
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[]): AsyncGenerator<Frame>;

/**
 * Partial pipeline: input → decoder → filter → encoder (returns packets)
 */
export function pipeline(source: MediaInput, decoder: Decoder, filter: FilterAPI | FilterAPI[], encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: input → decoder → encoder (returns packets)
 */
export function pipeline(source: MediaInput, decoder: Decoder, encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: frames → filter (returns frames)
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[]): AsyncGenerator<Frame>;

/**
 * Partial pipeline: frames → encoder (returns packets)
 */
export function pipeline(source: AsyncIterable<Frame>, encoder: Encoder): AsyncGenerator<Packet>;

/**
 * Partial pipeline: frames → filter → encoder (returns packets)
 */
export function pipeline(source: AsyncIterable<Frame>, filter: FilterAPI | FilterAPI[], encoder: Encoder): AsyncGenerator<Packet>;

// ============================================================================
// Named Pipeline Overloads (multiple streams, variable parameters)
// ============================================================================

/**
 * Named pipeline with single output
 */
export function pipeline(inputs: NamedInputs, stages: NamedStages, output: MediaOutput): PipelineControl;

/**
 * Named pipeline with multiple outputs
 */
export function pipeline(inputs: NamedInputs, stages: NamedStages, outputs: Record<string, MediaOutput>): PipelineControl;

/**
 * Partial named pipeline (returns generators for further processing)
 */
export function pipeline<T extends Packet | Frame = Packet | Frame>(inputs: NamedInputs, stages: NamedStages): Record<string, AsyncGenerator<T>>;

// ============================================================================
// Implementation
// ============================================================================

/**
 * Pipeline implementation
 *
 * Creates a processing pipeline from media components.
 * Automatically handles type conversions and proper flushing order.
 *
 * @param args - Variable arguments depending on pipeline type
 * @returns Promise<void> if output is present, AsyncGenerator otherwise
 *
 * @example
 * ```typescript
 * // Simple pipeline
 * await pipeline(
 *   input,
 *   decoder,
 *   filter,
 *   encoder,
 *   output
 * );
 *
 * // Named pipeline for muxing
 * await pipeline(
 *   { video: videoInput, audio: audioInput },
 *   {
 *     video: [videoDecoder, scaleFilter, videoEncoder],
 *     audio: [audioDecoder, volumeFilter, audioEncoder]
 *   },
 *   output
 * );
 * ```
 */
export function pipeline(...args: any[]): PipelineControl | AsyncGenerator<Packet | Frame> | Record<string, AsyncGenerator<Packet | Frame>> {
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

class PipelineControlImpl implements PipelineControl {
  private _stopped = false;
  private _completion: Promise<void>;
  private _resolve?: () => void;

  constructor(executionPromise: Promise<void>) {
    // Wrap the execution promise to handle stopping
    this._completion = new Promise<void>((resolve) => {
      this._resolve = resolve;
      executionPromise.then(resolve).catch(resolve);
    });
  }

  stop(): void {
    this._stopped = true;
    if (this._resolve) {
      this._resolve();
    }
  }

  isStopped(): boolean {
    return this._stopped;
  }

  get completion(): Promise<void> {
    return this._completion;
  }
}

// ============================================================================
// MediaInput Pipeline Implementation
// ============================================================================

function runMediaInputPipeline(input: MediaInput, output: MediaOutput): PipelineControl {
  let control: PipelineControl;
  // eslint-disable-next-line prefer-const
  control = new PipelineControlImpl(runMediaInputPipelineAsync(input, output, () => control.isStopped()));
  return control;
}

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

    try {
      // Find the corresponding output stream index
      const mapping = streams.find((s) => s.stream.index === packet.streamIndex);
      if (mapping) {
        await output.writePacket(packet, mapping.index);
      }
    } finally {
      packet.free(); // Always free packet, even if not written
    }
  }

  // Write trailer
  if (!output.isTrailerWritten()) {
    await output.writeTrailer();
  }
}

// ============================================================================
// Simple Pipeline Implementation
// ============================================================================

function runSimplePipeline(args: any[]): PipelineControl | AsyncGenerator<Packet | Frame> {
  const [source, ...stages] = args;

  // Convert MediaInput to packet stream if needed
  const actualSource = isMediaInput(source) ? source.packets() : source;

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
    }
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

async function* buildSimplePipeline(
  source: AsyncIterable<Packet | Frame>,
  stages: (Decoder | Encoder | FilterAPI | FilterAPI[] | MediaOutput)[],
): AsyncGenerator<Packet | Frame> {
  let stream: AsyncIterable<any> = source;

  for (const stage of stages) {
    if (isDecoder(stage)) {
      stream = decodeStream(stream as AsyncIterable<Packet>, stage);
    } else if (isEncoder(stage)) {
      stream = encodeStream(stream as AsyncIterable<Frame>, stage);
    } else if (isFilterAPI(stage)) {
      stream = filterStream(stream as AsyncIterable<Frame>, stage);
    } else if (Array.isArray(stage)) {
      // Chain multiple filters
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
        }
      }
    }
  }

  yield* stream;
}

async function consumeSimplePipeline(stream: AsyncIterable<Packet | Frame>, output: MediaOutput, metadata: StreamMetadata, shouldStop: () => boolean): Promise<void> {
  // Add stream to output if we have encoder or decoder info
  let streamIndex = 0;

  if (metadata.encoder) {
    streamIndex = output.addStream(metadata.encoder);
  } else if (metadata.decoder) {
    // Stream copy - use decoder's original stream
    const originalStream = metadata.decoder.getStream();
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
      try {
        await output.writePacket(item, streamIndex);
      } finally {
        // Free the packet after writing
        item.free();
      }
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

function runNamedPartialPipeline(inputs: NamedInputs, stages: NamedStages): Record<string, AsyncGenerator<Packet | Frame>> {
  const result: Record<string, AsyncGenerator<Packet | Frame>> = {};

  for (const [streamName, streamStages] of Object.entries(stages)) {
    const input = inputs[streamName];
    if (!input) {
      throw new Error(`No input found for stream: ${streamName}`);
    }

    if (streamStages === 'passthrough') {
      // Direct passthrough - return input packets as-is
      result[streamName] = (async function* () {
        for await (const packet of input.packets()) {
          yield packet;
        }
      })();
    } else {
      // Process the stream
      // Build pipeline for this stream (can return frames or packets)
      const metadata: StreamMetadata = {};
      result[streamName] = buildFlexibleNamedStreamPipeline(input.packets(), streamStages, metadata);
    }
  }

  return result;
}

function runNamedPipeline(inputs: NamedInputs, stages: NamedStages, output: MediaOutput | Record<string, MediaOutput>): PipelineControl {
  let control: PipelineControl;
  // eslint-disable-next-line prefer-const
  control = new PipelineControlImpl(runNamedPipelineAsync(inputs, stages, output, () => control.isStopped()));
  return control;
}

async function runNamedPipelineAsync(
  inputs: NamedInputs,
  stages: NamedStages,
  output: MediaOutput | Record<string, MediaOutput>,
  shouldStop: () => boolean,
): Promise<void> {
  // Track metadata for each stream
  const streamMetadata: Record<string, StreamMetadata> = {};

  // Process each named stream into generators
  const processedStreams: Record<string, AsyncIterable<Packet>> = {};

  for (const [streamName, streamStages] of Object.entries(stages)) {
    const metadata: StreamMetadata = {};
    streamMetadata[streamName] = metadata;

    const input = inputs[streamName];
    if (!input) {
      throw new Error(`No input found for stream: ${streamName}`);
    }

    if (streamStages === 'passthrough') {
      // Direct passthrough - no processing
      processedStreams[streamName] = input.packets();
      metadata.type = streamName.startsWith('video') ? 'video' : 'audio';
      metadata.mediaInput = input; // Track MediaInput for passthrough
    } else {
      // Process the stream
      // Pre-populate metadata by walking through stages
      for (const stage of streamStages) {
        if (isDecoder(stage)) {
          metadata.decoder = stage;
        } else if (isEncoder(stage)) {
          metadata.encoder = stage;
        }
      }
      // Build pipeline for this stream
      processedStreams[streamName] = buildNamedStreamPipeline(input.packets(), streamStages, metadata);
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

    for (const [streamName, stream] of Object.entries(processedStreams)) {
      const streamOutput = outputs[streamName];
      if (streamOutput) {
        const metadata = streamMetadata[streamName];
        promises.push(consumeNamedStream(stream, streamOutput, metadata, shouldStop));
      }
    }

    await Promise.all(promises);
  }
}

async function* buildFlexibleNamedStreamPipeline(
  source: AsyncIterable<Packet>,
  stages: (Decoder | FilterAPI | FilterAPI[] | Encoder)[],
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
    } else if (Array.isArray(stage)) {
      // Chain multiple filters
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
        }
      }
    }
  }

  // Yield whatever the pipeline produces (frames or packets)
  yield* stream;
}

async function* buildNamedStreamPipeline(
  source: AsyncIterable<Packet>,
  stages: (Decoder | FilterAPI | FilterAPI[] | Encoder)[],
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
    } else if (Array.isArray(stage)) {
      // Chain multiple filters
      for (const filter of stage) {
        if (isFilterAPI(filter)) {
          stream = filterStream(stream as AsyncIterable<Frame>, filter);
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

async function consumeNamedStream(stream: AsyncIterable<Packet>, output: MediaOutput, metadata: StreamMetadata, shouldStop: () => boolean): Promise<void> {
  // Add stream to output
  let streamIndex = 0;

  if (metadata.encoder) {
    streamIndex = output.addStream(metadata.encoder);
  } else if (metadata.decoder) {
    // Stream copy - use decoder's original stream
    const originalStream = metadata.decoder.getStream();
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

async function interleaveToOutput(
  streams: Record<string, AsyncIterable<Packet>>,
  output: MediaOutput,
  metadata: Record<string, StreamMetadata>,
  shouldStop: () => boolean,
): Promise<void> {
  // Add all streams to output first
  const streamIndices: Record<string, number> = {};

  for (const [name, meta] of Object.entries(metadata)) {
    if (meta.encoder) {
      streamIndices[name] = output.addStream(meta.encoder);
    } else if (meta.decoder) {
      // Stream copy - use decoder's original stream
      const originalStream = meta.decoder.getStream();
      streamIndices[name] = output.addStream(originalStream);
    } else if (meta.mediaInput) {
      // Passthrough from MediaInput - use stream name to determine which stream
      const stream = name.includes('video') ? meta.mediaInput.video() : meta.mediaInput.audio();
      if (!stream) {
        throw new Error(`No matching stream found in MediaInput for ${name}`);
      }
      streamIndices[name] = output.addStream(stream);
    } else {
      // This should not happen with the new API
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

  const queues = new Map<string, PacketWithStream[]>();
  const iterators = new Map<string, AsyncIterator<Packet>>();
  const done = new Set<string>();

  // Initialize iterators
  for (const [name, stream] of Object.entries(streams)) {
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
    let minStreamName: string | null = null;
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

async function* decodeStream(packets: AsyncIterable<Packet>, decoder: Decoder): AsyncGenerator<Frame> {
  // Process all packets
  for await (const packet of packets) {
    const frame = await decoder.decode(packet);
    if (frame) {
      yield frame;
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

// ============================================================================
// Type Guards
// ============================================================================

function isNamedInputs(obj: any): obj is NamedInputs {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && !isAsyncIterable(obj) && !isMediaInput(obj);
}

function isAsyncIterable(obj: any): obj is AsyncIterable<any> {
  return obj && typeof obj[Symbol.asyncIterator] === 'function';
}

function isMediaInput(obj: any): obj is MediaInput {
  return obj && typeof obj.packets === 'function' && typeof obj.video === 'function' && typeof obj.audio === 'function';
}

function isDecoder(obj: any): obj is Decoder {
  return obj && typeof obj.decode === 'function' && typeof obj.flush === 'function';
}

function isEncoder(obj: any): obj is Encoder {
  return obj && typeof obj.encode === 'function' && typeof obj.flush === 'function';
}

function isFilterAPI(obj: any): obj is FilterAPI {
  return obj && typeof obj.process === 'function' && typeof obj.receive === 'function';
}

function isMediaOutput(obj: any): obj is MediaOutput {
  return obj && typeof obj.writePacket === 'function' && typeof obj.writeHeader === 'function';
}

function isPacket(obj: any): obj is Packet {
  return obj && 'streamIndex' in obj && 'pts' in obj && 'dts' in obj;
}
