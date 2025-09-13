import { AVERROR_EAGAIN, AVERROR_EOF, AVFILTER_FLAG_HWDEVICE } from '../constants/constants.js';
import { FFmpegError, Filter, FilterGraph, FilterInOut, Frame } from '../lib/index.js';
import { avGetSampleFmtName } from '../lib/utilities.js';

import type { AVFilterCmdFlag, AVSampleFormat } from '../constants/constants.js';
import type { FilterContext } from '../lib/index.js';
import type { FilterOptions } from './types.js';

/**
 * High-level filter API for audio and video processing.
 *
 * Provides simplified interface for applying FFmpeg filters to frames.
 * Handles filter graph construction, frame buffering, and command control.
 * Supports both software and hardware-accelerated filtering operations.
 * Essential component for effects, transformations, and format conversions.
 *
 * @example
 * ```typescript
 * import { FilterAPI } from 'node-av/api';
 *
 * // Create video filter - initializes on first frame
 * const filter = await FilterAPI.create('scale=1280:720', {
 *   timeBase: video.timeBase,
 * });
 *
 * // Process frame - first frame configures filter graph
 * const output = await filter.process(inputFrame);
 * if (output) {
 *   console.log(`Filtered frame: ${output.width}x${output.height}`);
 *   output.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Hardware-accelerated filtering - hw context detected from frame
 * const filter = await FilterAPI.create('hwupload,scale_cuda=1920:1080,hwdownload', {
 *   timeBase: video.timeBase,
 * });
 * // Hardware frames context will be automatically detected from first frame
 * ```
 *
 * @see {@link FilterGraph} For low-level filter graph API
 * @see {@link Frame} For frame operations
 */
export class FilterAPI implements Disposable {
  private graph: FilterGraph;
  private description: string;
  private options: FilterOptions;
  private buffersrcCtx: FilterContext | null = null;
  private buffersinkCtx: FilterContext | null = null;
  private initialized = false;
  private isClosed = false;

  /**
   * @param graph - Filter graph instance
   * @param description - Filter description string
   * @param options - Filter options
   * @internal
   */
  private constructor(graph: FilterGraph, description: string, options: FilterOptions) {
    this.graph = graph;
    this.description = description;
    this.options = options;
  }

  /**
   * Create a filter with specified description and configuration.
   *
   * Creates and allocates filter graph immediately.
   * Filter configuration is completed on first frame with frame properties.
   * Hardware frames context is automatically detected from input frames.
   *
   * Direct mapping to avfilter_graph_parse_ptr() and avfilter_graph_config().
   *
   * @param description - Filter graph description
   * @param options - Filter options including required timeBase
   * @returns Configured filter instance
   *
   * @throws {Error} If filter creation or configuration fails
   *
   * @throws {FFmpegError} If graph parsing or config fails
   *
   * @example
   * ```typescript
   * // Simple video filter
   * const filter = await FilterAPI.create('scale=640:480', {
   *   timeBase: video.timeBase
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Complex filter chain
   * const filter = await FilterAPI.create('crop=640:480:0:0,rotate=PI/4', {
   *   timeBase: video.timeBase
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Audio filter
   * const filter = await FilterAPI.create('volume=0.5,aecho=0.8:0.9:1000:0.3', {
   *   timeBase: audio.timeBase
   * });
   * ```
   *
   * @see {@link process} For frame processing
   * @see {@link FilterOptions} For configuration options
   */
  static async create(description: string, options: FilterOptions): Promise<FilterAPI> {
    // Create graph
    const graph = new FilterGraph();
    graph.alloc();

    // Configure threading
    if (options.threads !== undefined) {
      graph.nbThreads = options.threads;
    }

    // Configure scaler options
    if (options.scaleSwsOpts) {
      graph.scaleSwsOpts = options.scaleSwsOpts;
    }

    return new FilterAPI(graph, description, options);
  }

  /**
   * Check if filter is open.
   *
   * @example
   * ```typescript
   * if (filter.isFilterOpen) {
   *   const output = await filter.process(frame);
   * }
   * ```
   */
  get isFilterOpen(): boolean {
    return !this.isClosed;
  }

  /**
   * Check if filter has been initialized.
   *
   * Returns true after first frame has been processed and filter graph configured.
   * Useful for checking if filter has received frame properties.
   *
   * @returns true if filter graph has been built from first frame
   *
   * @example
   * ```typescript
   * if (!filter.isFilterInitialized) {
   *   console.log('Filter will initialize on first frame');
   * }
   * ```
   */
  get isFilterInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if filter is ready for processing.
   *
   * @returns true if initialized and ready
   *
   * @example
   * ```typescript
   * if (filter.isReady()) {
   *   const output = await filter.process(frame);
   * }
   * ```
   */
  isReady(): boolean {
    return this.initialized && this.buffersrcCtx !== null && this.buffersinkCtx !== null && !this.isClosed;
  }

  /**
   * Get filter graph description.
   *
   * Returns human-readable graph structure.
   * Useful for debugging filter chains.
   *
   * Direct mapping to avfilter_graph_dump().
   *
   * @returns Graph description or null if closed
   *
   * @example
   * ```typescript
   * const description = filter.getGraphDescription();
   * console.log('Filter graph:', description);
   * ```
   */
  getGraphDescription(): string | null {
    return !this.isClosed && this.initialized ? this.graph.dump() : null;
  }

  /**
   * Process a frame through the filter.
   *
   * Applies filter operations to input frame.
   * On first frame, automatically builds filter graph with frame properties.
   * May buffer frames internally before producing output.
   * Hardware frames context is automatically detected from frame.
   * Returns null if filter is closed and frame is null.
   *
   * Direct mapping to av_buffersrc_add_frame() and av_buffersink_get_frame().
   *
   * @param frame - Input frame to process (or null to flush)
   * @returns Filtered frame or null if buffered
   *
   * @throws {Error} If filter is closed with non-null frame
   *
   * @throws {FFmpegError} If processing fails
   *
   * @example
   * ```typescript
   * const output = await filter.process(inputFrame);
   * if (output) {
   *   console.log(`Got filtered frame: pts=${output.pts}`);
   *   output.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Process frame - may buffer internally
   * const output = await filter.process(frame);
   * if (output) {
   *   // Got output immediately
   *   yield output;
   * }
   * // For buffered frames, use the frames() async generator
   * ```
   *
   * @see {@link frames} For processing frame streams
   * @see {@link flush} For end-of-stream handling
   */
  async process(frame: Frame | null): Promise<Frame | null> {
    if (this.isClosed) {
      if (!frame) {
        return null;
      }

      throw new Error('Filter is closed');
    }

    // Open filter if not already done
    if (!this.initialized) {
      if (!frame) {
        return null;
      }

      await this.initialize(frame);
    }

    if (!this.buffersrcCtx || !this.buffersinkCtx) {
      throw new Error('Filter not initialized');
    }

    // Send frame to filter
    const addRet = await this.buffersrcCtx.buffersrcAddFrame(frame);
    FFmpegError.throwIfError(addRet, 'Failed to add frame to filter');

    // Try to get filtered frame
    const outputFrame = new Frame();
    outputFrame.alloc();

    const getRet = await this.buffersinkCtx.buffersinkGetFrame(outputFrame);

    if (getRet >= 0) {
      return outputFrame;
    } else if (getRet === AVERROR_EAGAIN) {
      // Need more input
      outputFrame.free();
      return null;
    } else {
      outputFrame.free();
      FFmpegError.throwIfError(getRet, 'Failed to get frame from filter');
      return null;
    }
  }

  /**
   * Process multiple frames at once.
   *
   * Processes batch of frames and drains all output.
   * Useful for filters that buffer multiple frames.
   *
   * @param frames - Array of input frames
   * @returns Array of all output frames
   *
   * @throws {Error} If filter not ready
   *
   * @throws {FFmpegError} If processing fails
   *
   * @example
   * ```typescript
   * const outputs = await filter.processMultiple([frame1, frame2, frame3]);
   * for (const output of outputs) {
   *   console.log(`Output frame: pts=${output.pts}`);
   *   output.free();
   * }
   * ```
   *
   * @see {@link process} For single frame processing
   */
  async processMultiple(frames: Frame[]): Promise<Frame[]> {
    const outputFrames: Frame[] = [];

    for (const frame of frames) {
      const output = await this.process(frame);
      if (output) {
        outputFrames.push(output);
      }

      // Drain any additional frames
      while (true) {
        const additional = await this.receive();
        if (!additional) break;
        outputFrames.push(additional);
      }
    }

    return outputFrames;
  }

  /**
   * Process frame stream through filter.
   *
   * High-level async generator for filtering frame streams.
   * Automatically handles buffering and flushing.
   * Frees input frames after processing.
   *
   * @param frames - Async generator of input frames
   * @yields {Frame} Filtered frames
   * @throws {Error} If filter not ready
   *
   * @throws {FFmpegError} If processing fails
   *
   * @example
   * ```typescript
   * // Filter decoded frames
   * for await (const frame of filter.frames(decoder.frames(packets))) {
   *   await encoder.encode(frame);
   *   frame.free();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Chain filters
   * const filter1 = await FilterAPI.create('scale=640:480', {
   *   timeBase: video.timeBase
   * });
   * const filter2 = await FilterAPI.create('rotate=PI/4', {
   *   timeBase: video.timeBase
   * });
   *
   * for await (const frame of filter2.frames(filter1.frames(input))) {
   *   // Process filtered frames
   *   frame.free();
   * }
   * ```
   *
   * @see {@link process} For single frame processing
   * @see {@link flush} For end-of-stream handling
   */
  async *frames(frames: AsyncGenerator<Frame>): AsyncGenerator<Frame> {
    for await (const frame of frames) {
      try {
        // Process input frame
        const output = await this.process(frame);
        if (output) {
          yield output;
        }

        // Drain any buffered frames
        while (true) {
          const buffered = await this.receive();
          if (!buffered) break;
          yield buffered;
        }
      } finally {
        // Free the input frame after processing
        frame.free();
      }
    }

    // Flush and get remaining frames
    await this.flush();
    while (true) {
      const remaining = await this.receive();
      if (!remaining) break;
      yield remaining;
    }
  }

  /**
   * Flush filter and signal end-of-stream.
   *
   * Sends null frame to flush buffered data.
   * Must call receive() to get flushed frames.
   * Does nothing if filter is closed or was never initialized.
   *
   * Direct mapping to av_buffersrc_add_frame(NULL).
   *
   * @throws {FFmpegError} If flush fails
   *
   * @example
   * ```typescript
   * await filter.flush();
   * // Get remaining frames
   * let frame;
   * while ((frame = await filter.receive()) !== null) {
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flushFrames} For async iteration
   * @see {@link frames} For complete pipeline
   */
  async flush(): Promise<void> {
    if (this.isClosed || !this.initialized || !this.buffersrcCtx) {
      return;
    }

    // Send flush frame (null)
    const ret = await this.buffersrcCtx.buffersrcAddFrame(null);
    if (ret < 0 && ret !== AVERROR_EOF) {
      FFmpegError.throwIfError(ret, 'Failed to flush filter');
    }
  }

  /**
   * Flush filter and yield remaining frames.
   *
   * Convenient async generator for flushing.
   * Combines flush and receive operations.
   * Returns immediately if filter is closed or was never initialized.
   *
   * @yields {Frame} Remaining frames from filter
   *
   * @throws {FFmpegError} If flush fails
   *
   * @example
   * ```typescript
   * for await (const frame of filter.flushFrames()) {
   *   console.log(`Flushed frame: pts=${frame.pts}`);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link flush} For manual flush
   * @see {@link frames} For complete pipeline
   */
  async *flushFrames(): AsyncGenerator<Frame> {
    // Send flush signal
    await this.flush();

    // Yield all remaining frames
    let frame;
    while ((frame = await this.receive()) !== null) {
      yield frame;
    }
  }

  /**
   * Receive buffered frame from filter.
   *
   * Drains frames buffered by the filter.
   * Call repeatedly until null to get all buffered frames.
   * Returns null if filter is closed, not initialized, or no frames available.
   *
   * Direct mapping to av_buffersink_get_frame().
   *
   * @returns Buffered frame or null if none available
   *
   * @throws {FFmpegError} If receiving fails
   *
   * @example
   * ```typescript
   * let frame;
   * while ((frame = await filter.receive()) !== null) {
   *   console.log(`Received frame: pts=${frame.pts}`);
   *   frame.free();
   * }
   * ```
   */
  async receive(): Promise<Frame | null> {
    if (this.isClosed || !this.initialized || !this.buffersinkCtx) {
      return null;
    }

    const frame = new Frame();
    frame.alloc();

    const ret = await this.buffersinkCtx.buffersinkGetFrame(frame);

    if (ret >= 0) {
      return frame;
    } else {
      frame.free();
      if (ret === AVERROR_EAGAIN || ret === AVERROR_EOF) {
        return null;
      }
      FFmpegError.throwIfError(ret, 'Failed to receive frame from filter');
      return null;
    }
  }

  /**
   * Send command to filter.
   *
   * Sends runtime command to specific filter in graph.
   * Allows dynamic parameter adjustment.
   *
   * Direct mapping to avfilter_graph_send_command().
   *
   * @param target - Target filter name
   * @param cmd - Command name
   * @param arg - Command argument
   * @param flags - Command flags
   * @returns Response string from filter
   *
   * @throws {Error} If filter not ready
   *
   * @throws {FFmpegError} If command fails
   *
   * @example
   * ```typescript
   * // Change volume at runtime
   * const response = filter.sendCommand('volume', 'volume', '0.5');
   * console.log(`Volume changed: ${response}`);
   * ```
   *
   * @see {@link queueCommand} For delayed commands
   */
  sendCommand(target: string, cmd: string, arg: string, flags?: AVFilterCmdFlag): string {
    if (this.isClosed) {
      throw new Error('Filter is closed');
    }

    if (!this.initialized) {
      throw new Error('Filter not initialized');
    }

    const result = this.graph.sendCommand(target, cmd, arg, flags);

    if (typeof result === 'number') {
      FFmpegError.throwIfError(result, 'Failed to send filter command');
    }

    return (result as any).response;
  }

  /**
   * Queue command for later execution.
   *
   * Schedules command to execute at specific timestamp.
   * Useful for synchronized parameter changes.
   *
   * Direct mapping to avfilter_graph_queue_command().
   *
   * @param target - Target filter name
   * @param cmd - Command name
   * @param arg - Command argument
   * @param ts - Timestamp for execution
   * @param flags - Command flags
   * @throws {Error} If filter not ready
   *
   * @throws {FFmpegError} If queue fails
   *
   * @example
   * ```typescript
   * // Queue volume change at 10 seconds
   * filter.queueCommand('volume', 'volume', '0.8', 10.0);
   * ```
   *
   * @see {@link sendCommand} For immediate commands
   */
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): void {
    if (this.isClosed) {
      throw new Error('Filter is closed');
    }

    if (!this.initialized) {
      throw new Error('Filter not initialized');
    }

    const ret = this.graph.queueCommand(target, cmd, arg, ts, flags);
    FFmpegError.throwIfError(ret, 'Failed to queue filter command');
  }

  /**
   * Free filter resources.
   *
   * Releases filter graph and contexts.
   * Safe to call multiple times.
   *
   * @example
   * ```typescript
   * filter.close();
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  close(): void {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    this.graph.free();
    this.buffersrcCtx = null;
    this.buffersinkCtx = null;

    this.initialized = false;
  }

  /**
   * Initialize filter graph from first frame.
   *
   * Creates and configures filter graph components.
   * Sets buffer source parameters from frame properties.
   * Automatically configures hardware frames context if present.
   *
   * @param frame - First frame to process, provides format and hw context
   *
   * @throws {Error} If initialization fails
   *
   * @throws {FFmpegError} If configuration fails
   *
   * @internal
   */
  private async initialize(frame: Frame): Promise<void> {
    // Create buffer source
    this.createBufferSource(frame);

    // Create buffer sink
    this.createBufferSink(frame);

    // Parse filter description
    this.parseFilterDescription(this.description);

    // Set hw_device_ctx on hardware filters
    const filters = this.graph.filters;
    if (filters) {
      for (const filterCtx of filters) {
        const filter = filterCtx.filter;
        if (filter && (filter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
          filterCtx.hwDeviceCtx = frame.hwFramesCtx?.deviceRef ?? this.options.hardware?.deviceContext ?? null;
        }
      }
    }

    // Configure the graph
    const ret = await this.graph.config();
    FFmpegError.throwIfError(ret, 'Failed to configure filter graph');

    this.initialized = true;
  }

  /**
   * Create buffer source with frame parameters.
   *
   * Configures buffer source with frame properties including hardware context.
   * Automatically detects video/audio and sets appropriate parameters.
   *
   * @param frame - Frame providing format, dimensions, and hw_frames_ctx
   *
   * @throws {Error} If creation fails
   *
   * @throws {FFmpegError} If configuration fails
   *
   * @internal
   */
  private createBufferSource(frame: Frame): void {
    const filterName = frame.isVideo() ? 'buffer' : 'abuffer';
    const bufferFilter = Filter.getByName(filterName);
    if (!bufferFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // For audio, create with args. For video, use allocFilter + buffersrcParametersSet
    if (frame.isVideo()) {
      // Allocate filter without args
      this.buffersrcCtx = this.graph.allocFilter(bufferFilter, 'in');
      if (!this.buffersrcCtx) {
        throw new Error('Failed to allocate buffer source');
      }

      const ret = this.buffersrcCtx.buffersrcParametersSet({
        width: frame.width,
        height: frame.height,
        format: frame.format,
        timeBase: this.options.timeBase,
        frameRate: this.options.frameRate ?? frame.timeBase,
        sampleAspectRatio: frame.sampleAspectRatio,
        colorRange: frame.colorRange,
        colorSpace: frame.colorSpace,
        hwFramesCtx: frame.hwFramesCtx,
      });
      FFmpegError.throwIfError(ret, 'Failed to set buffer source parameters');

      // Initialize filter
      const initRet = this.buffersrcCtx.init(null);
      FFmpegError.throwIfError(initRet, 'Failed to initialize buffer source');
    } else {
      // For audio, create with args string
      const formatName = avGetSampleFmtName(frame.format as AVSampleFormat);
      const channelLayout = frame.channelLayout.mask === 0n ? 'stereo' : frame.channelLayout.mask.toString();
      // eslint-disable-next-line @stylistic/max-len
      const args = `time_base=${this.options.timeBase.num}/${this.options.timeBase.den}:sample_rate=${frame.sampleRate}:sample_fmt=${formatName}:channel_layout=${channelLayout}`;
      this.buffersrcCtx = this.graph.createFilter(bufferFilter, 'in', args);
      if (!this.buffersrcCtx) {
        throw new Error('Failed to create audio buffer source');
      }
    }
  }

  /**
   * Create buffer sink.
   *
   * @param frame - Frame
   *
   * @throws {Error} If creation fails
   *
   * @internal
   */
  private createBufferSink(frame: Frame): void {
    const filterName = frame.isVideo() ? 'buffersink' : 'abuffersink';
    const sinkFilter = Filter.getByName(filterName);
    if (!sinkFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    this.buffersinkCtx = this.graph.createFilter(sinkFilter, 'out', null);
    if (!this.buffersinkCtx) {
      throw new Error('Failed to create buffer sink');
    }
  }

  /**
   * Parse filter description and build graph.
   *
   * @param description - Filter description string
   *
   * @throws {Error} If parsing fails
   *
   * @throws {FFmpegError} If graph construction fails
   *
   * @internal
   */
  private parseFilterDescription(description: string): void {
    if (!this.buffersrcCtx || !this.buffersinkCtx) {
      throw new Error('Buffer filters not initialized');
    }

    // Handle empty or simple passthrough
    if (!description || description === 'null' || description === 'anull') {
      // Direct connection for null filters
      const ret = this.buffersrcCtx.link(0, this.buffersinkCtx, 0);
      FFmpegError.throwIfError(ret, 'Failed to link buffer filters');
      return;
    }

    // Set up inputs and outputs for parsing
    const outputs = new FilterInOut();
    outputs.alloc();
    outputs.name = 'in';
    outputs.filterCtx = this.buffersrcCtx;
    outputs.padIdx = 0;

    const inputs = new FilterInOut();
    inputs.alloc();
    inputs.name = 'out';
    inputs.filterCtx = this.buffersinkCtx;
    inputs.padIdx = 0;

    // Parse the filter graph
    const ret = this.graph.parsePtr(description, inputs, outputs);
    FFmpegError.throwIfError(ret, 'Failed to parse filter description');

    // Clean up
    inputs.free();
    outputs.free();
  }

  /**
   * Dispose of filter.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling close().
   *
   * @example
   * ```typescript
   * {
   *   using filter = await FilterAPI.create('scale=640:480', { ... });
   *   // Use filter...
   * } // Automatically freed
   * ```
   *
   * @see {@link close} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.close();
  }
}
