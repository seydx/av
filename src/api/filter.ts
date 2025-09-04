import { AVERROR_EOF, AVFILTER_FLAG_HWDEVICE, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO } from '../constants/constants.js';
import { AVERROR_EAGAIN, avGetSampleFmtName, avIsHardwarePixelFormat, FFmpegError, Filter, FilterGraph, FilterInOut, Frame } from '../lib/index.js';

import type { AVFilterCmdFlag, AVMediaType } from '../constants/constants.js';
import type { FilterContext } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { FilterOptions, StreamInfo, VideoInfo } from './types.js';

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
 * // Create video filter
 * const filter = await FilterAPI.create('scale=1280:720', videoInfo);
 *
 * // Process frame
 * const output = await filter.process(inputFrame);
 * if (output) {
 *   console.log(`Filtered frame: ${output.width}x${output.height}`);
 *   output.free();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Hardware-accelerated filtering
 * const hw = await HardwareContext.auto();
 * const filter = await FilterAPI.create(
 *   'hwupload,scale_cuda=1920:1080,hwdownload',
 *   videoInfo,
 *   { hardware: hw }
 * );
 * ```
 *
 * @see {@link FilterGraph} For low-level filter graph API
 * @see {@link HardwareContext} For hardware acceleration
 * @see {@link Frame} For frame operations
 */
export class FilterAPI implements Disposable {
  private graph: FilterGraph | null = null;
  private buffersrcCtx: FilterContext | null = null;
  private buffersinkCtx: FilterContext | null = null;
  private config: StreamInfo;
  private mediaType: AVMediaType;
  private initialized = false;
  private hardware?: HardwareContext | null;
  private description: string;
  private options: FilterOptions;

  /**
   * @param config - Stream configuration
   * @param description - Filter description string
   * @param options - Filter options
   * @internal
   */
  private constructor(config: StreamInfo, description: string, options: FilterOptions) {
    this.config = config;
    this.description = description;
    this.options = options;
    this.hardware = options.hardware;
    this.mediaType = config.type === 'video' ? AVMEDIA_TYPE_VIDEO : AVMEDIA_TYPE_AUDIO;
  }

  /**
   * Create a filter with specified description and configuration.
   *
   * Constructs filter graph from description string.
   * Configures input/output buffers and threading.
   * For video filters, uses lazy initialization to detect hardware frames.
   *
   * Direct mapping to avfilter_graph_parse_ptr() and avfilter_graph_config().
   *
   * @param description - Filter graph description
   * @param input - Input stream configuration
   * @param options - Filter options
   * @returns Configured filter instance
   *
   * @throws {Error} If filter creation or configuration fails
   * @throws {FFmpegError} If graph parsing or config fails
   *
   * @example
   * ```typescript
   * // Simple video filter
   * const filter = await FilterAPI.create('scale=640:480', videoInfo);
   * ```
   *
   * @example
   * ```typescript
   * // Complex filter chain
   * const filter = await FilterAPI.create(
   *   'crop=640:480:0:0,rotate=PI/4',
   *   videoInfo
   * );
   * ```
   *
   * @example
   * ```typescript
   * // Audio filter
   * const filter = await FilterAPI.create(
   *   'volume=0.5,aecho=0.8:0.9:1000:0.3',
   *   audioInfo
   * );
   * ```
   *
   * @see {@link process} For frame processing
   * @see {@link FilterOptions} For configuration options
   */
  static async create(description: string, input: StreamInfo, options: FilterOptions = {}): Promise<FilterAPI> {
    let config: StreamInfo;

    if (input.type === 'video') {
      config = {
        type: 'video',
        width: input.width,
        height: input.height,
        pixelFormat: input.pixelFormat,
        timeBase: input.timeBase,
        frameRate: input.frameRate,
        sampleAspectRatio: input.sampleAspectRatio,
      };
    } else {
      config = {
        type: 'audio',
        sampleRate: input.sampleRate,
        sampleFormat: input.sampleFormat,
        channelLayout: input.channelLayout,
        timeBase: input.timeBase,
      };
    }

    const filter = new FilterAPI(config, description, options);

    // Check if any filters in the chain require hardware context
    if (config.type === 'video') {
      filter.checkHardwareRequirements(description, options);
    }

    // For video filters, always use lazy initialization to properly detect hardware requirements
    // For audio filters, initialize immediately (no hardware audio processing)
    if (config.type === 'audio') {
      await filter.initialize(null);
    }
    // For video: wait for first frame to detect if hw_frames_ctx is present

    return filter;
  }

  /**
   * Process a frame through the filter.
   *
   * Applies filter operations to input frame.
   * May buffer frames internally before producing output.
   * For video, performs lazy initialization on first frame.
   *
   * Direct mapping to av_buffersrc_add_frame() and av_buffersink_get_frame().
   *
   * @param frame - Input frame to process
   * @returns Filtered frame or null if buffered
   *
   * @throws {Error} If filter not ready
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
   * // Process and drain
   * const output = await filter.process(frame);
   * if (output) yield output;
   *
   * // Drain buffered frames
   * let buffered;
   * while ((buffered = await filter.receive()) !== null) {
   *   yield buffered;
   * }
   * ```
   *
   * @see {@link receive} For draining buffered frames
   * @see {@link frames} For stream processing
   */
  async process(frame: Frame): Promise<Frame | null> {
    // Lazy initialization for video filters (detect hardware from first frame)
    if (!this.initialized && this.config.type === 'video') {
      await this.initialize(frame);
    }

    if (!this.initialized || !this.buffersrcCtx || !this.buffersinkCtx) {
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
   * Receive buffered frame from filter.
   *
   * Drains frames buffered by the filter.
   * Call repeatedly until null to get all buffered frames.
   *
   * Direct mapping to av_buffersink_get_frame().
   *
   * @returns Buffered frame or null if none available
   *
   * @throws {Error} If filter not ready
   * @throws {FFmpegError} If receive fails
   *
   * @example
   * ```typescript
   * // Drain buffered frames
   * let frame;
   * while ((frame = await filter.receive()) !== null) {
   *   console.log(`Buffered frame: pts=${frame.pts}`);
   *   frame.free();
   * }
   * ```
   *
   * @see {@link process} For input processing
   * @see {@link flush} For end-of-stream
   */
  async receive(): Promise<Frame | null> {
    if (!this.initialized || !this.buffersinkCtx) {
      throw new Error('Filter not initialized');
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
   * Flush filter and signal end-of-stream.
   *
   * Sends null frame to flush buffered data.
   * Must call receive() to get flushed frames.
   *
   * Direct mapping to av_buffersrc_add_frame(NULL).
   *
   * @throws {Error} If filter not ready
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
   * @see {@link receive} For draining frames
   */
  async flush(): Promise<void> {
    if (!this.initialized || !this.buffersrcCtx) {
      throw new Error('Filter not initialized');
    }

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
   *
   * @yields Remaining frames from filter
   * @throws {Error} If filter not ready
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
    if (!this.initialized || !this.buffersrcCtx) {
      throw new Error('Filter not initialized');
    }

    // Send flush signal
    await this.flush();

    // Yield all remaining frames
    let frame;
    while ((frame = await this.receive()) !== null) {
      yield frame;
    }
  }

  /**
   * Process frame stream through filter.
   *
   * High-level async generator for filtering frame streams.
   * Automatically handles buffering and flushing.
   * Frees input frames after processing.
   *
   * @param frames - Async generator of input frames
   * @yields Filtered frames
   * @throws {Error} If filter not ready
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
   * const filter1 = await FilterAPI.create('scale=640:480', info);
   * const filter2 = await FilterAPI.create('rotate=PI/4', info);
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
    if (!this.initialized || !this.graph) {
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
    if (!this.initialized || !this.graph) {
      throw new Error('Filter not initialized');
    }

    const ret = this.graph.queueCommand(target, cmd, arg, ts, flags);
    FFmpegError.throwIfError(ret, 'Failed to queue filter command');
  }

  /**
   * Get filter graph description.
   *
   * Returns human-readable graph structure.
   * Useful for debugging filter chains.
   *
   * Direct mapping to avfilter_graph_dump().
   *
   * @returns Graph description or null if not initialized
   *
   * @example
   * ```typescript
   * const description = filter.getGraphDescription();
   * console.log('Filter graph:', description);
   * ```
   */
  getGraphDescription(): string | null {
    if (!this.initialized || !this.graph) {
      return null;
    }
    return this.graph.dump();
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
    return this.initialized && this.buffersrcCtx !== null && this.buffersinkCtx !== null;
  }

  /**
   * Get media type of filter.
   *
   * @returns AVMEDIA_TYPE_VIDEO or AVMEDIA_TYPE_AUDIO
   *
   * @example
   * ```typescript
   * if (filter.getMediaType() === AVMEDIA_TYPE_VIDEO) {
   *   console.log('Video filter');
   * }
   * ```
   */
  getMediaType(): AVMediaType {
    return this.mediaType;
  }

  /**
   * Free filter resources.
   *
   * Releases filter graph and contexts.
   * Safe to call multiple times.
   *
   * @example
   * ```typescript
   * filter.free();
   * ```
   *
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    if (this.graph) {
      this.graph.free();
      this.graph = null;
    }
    this.buffersrcCtx = null;
    this.buffersinkCtx = null;
    this.initialized = false;
  }

  /**
   * Initialize filter graph.
   *
   * Creates and configures filter graph components.
   * For video, may use hardware frames context from first frame.
   *
   * @param firstFrame - First frame for hardware detection (video only)
   * @throws {Error} If initialization fails
   * @throws {FFmpegError} If configuration fails
   */
  private async initialize(firstFrame: Frame | null): Promise<void> {
    // Create graph
    this.graph = new FilterGraph();
    this.graph.alloc();

    // Configure threading
    if (this.options.threads !== undefined) {
      this.graph.nbThreads = this.options.threads;
    }

    // Configure scaler options
    if (this.options.scaleSwsOpts) {
      this.graph.scaleSwsOpts = this.options.scaleSwsOpts;
    }

    // Create buffer source with hw_frames_ctx if needed
    if (firstFrame?.hwFramesCtx && this.config.type === 'video') {
      this.createBufferSourceWithHwFrames(firstFrame);
    } else {
      this.createBufferSource();
    }

    // Create buffer sink
    this.createBufferSink();

    // Parse filter description
    this.parseFilterDescription(this.description);

    // Set hw_device_ctx on hardware filters
    if (this.hardware?.deviceContext) {
      const filters = this.graph.filters;
      if (filters) {
        for (const filterCtx of filters) {
          const filter = filterCtx.filter;
          if (filter && (filter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
            filterCtx.hwDeviceCtx = this.hardware.deviceContext;
          }
        }
      }
    }

    // Configure the graph
    const ret = await this.graph.config();
    FFmpegError.throwIfError(ret, 'Failed to configure filter graph');

    this.initialized = true;
  }

  /**
   * Create buffer source with hardware frames context.
   *
   * @param frame - Frame with hw_frames_ctx
   * @throws {Error} If creation fails
   * @throws {FFmpegError} If configuration fails
   */
  private createBufferSourceWithHwFrames(frame: Frame): void {
    const filterName = 'buffer';
    const bufferFilter = Filter.getByName(filterName);
    if (!bufferFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // Allocate filter without args
    this.buffersrcCtx = this.graph!.allocFilter(bufferFilter, 'in');
    if (!this.buffersrcCtx) {
      throw new Error('Failed to allocate buffer source');
    }

    // Set parameters including hw_frames_ctx
    const cfg = this.config as VideoInfo;
    const ret = this.buffersrcCtx.buffersrcParametersSet({
      width: cfg.width,
      height: cfg.height,
      format: cfg.pixelFormat,
      timeBase: cfg.timeBase,
      frameRate: cfg.frameRate,
      sampleAspectRatio: cfg.sampleAspectRatio,
      hwFramesCtx: frame.hwFramesCtx ?? undefined,
    });
    FFmpegError.throwIfError(ret, 'Failed to set buffer source parameters');

    // Initialize filter
    const initRet = this.buffersrcCtx.init(null);
    FFmpegError.throwIfError(initRet, 'Failed to initialize buffer source');
  }

  /**
   * Create standard buffer source.
   *
   * @throws {Error} If creation fails
   */
  private createBufferSource(): void {
    const filterName = this.config.type === 'video' ? 'buffer' : 'abuffer';
    const bufferFilter = Filter.getByName(filterName);
    if (!bufferFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // Build args string
    let args: string;
    if (this.config.type === 'video') {
      const cfg = this.config;
      args = `video_size=${cfg.width}x${cfg.height}:pix_fmt=${cfg.pixelFormat}:time_base=${cfg.timeBase.num}/${cfg.timeBase.den}`;

      if (cfg.frameRate) {
        args += `:frame_rate=${cfg.frameRate.num}/${cfg.frameRate.den}`;
      }

      if (cfg.sampleAspectRatio) {
        args += `:pixel_aspect=${cfg.sampleAspectRatio.num}/${cfg.sampleAspectRatio.den}`;
      }
    } else {
      const cfg = this.config;
      const sampleFmtName = avGetSampleFmtName(cfg.sampleFormat);
      const channelLayout = cfg.channelLayout.mask === 0n ? 'stereo' : cfg.channelLayout.mask.toString();
      args = `sample_rate=${cfg.sampleRate}:sample_fmt=${sampleFmtName}:channel_layout=${channelLayout}:time_base=${cfg.timeBase.num}/${cfg.timeBase.den}`;
    }

    this.buffersrcCtx = this.graph!.createFilter(bufferFilter, 'in', args);
    if (!this.buffersrcCtx) {
      throw new Error('Failed to create buffer source');
    }
  }

  /**
   * Create buffer sink.
   *
   * @throws {Error} If creation fails
   */
  private createBufferSink(): void {
    if (!this.graph) {
      throw new Error('Filter graph not initialized');
    }

    const filterName = this.config.type === 'video' ? 'buffersink' : 'abuffersink';
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
   * @throws {Error} If parsing fails
   * @throws {FFmpegError} If graph construction fails
   */
  private parseFilterDescription(description: string): void {
    if (!this.graph) {
      throw new Error('Filter graph not initialized');
    }

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
   * Check hardware requirements for filters.
   *
   * @param description - Filter description
   * @param options - Filter options
   * @throws {Error} If hardware requirements not met
   */
  private checkHardwareRequirements(description: string, options: FilterOptions): void {
    if (this.config.type !== 'video') {
      return;
    }

    // Parse filter names from description
    const filterNames = description
      .split(',')
      .map((f) => {
        // Extract filter name (before = or : or whitespace)
        const match = /^([a-zA-Z0-9_]+)/.exec(f.trim());
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    for (const filterName of filterNames) {
      const lowLevelFilter = Filter.getByName(filterName);
      if (!lowLevelFilter) {
        // Filter will be validated later during graph parsing
        continue;
      }

      if (!options.hardware) {
        if (filterName === 'hwupload' || filterName === 'hwupload_cuda' || (lowLevelFilter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
          throw new Error(`Filter '${filterName}' requires a hardware context`);
        } else if (filterName === 'hwdownload' && !avIsHardwarePixelFormat(this.config.pixelFormat)) {
          throw new Error(`Pixel Format '${this.config.pixelFormat}' is not hardware compatible`);
        }
      }
    }
  }

  /**
   * Dispose of filter.
   *
   * Implements Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using filter = await FilterAPI.create('scale=640:480', info);
   *   // Use filter...
   * } // Automatically freed
   * ```
   *
   * @see {@link free} For manual cleanup
   */
  [Symbol.dispose](): void {
    this.free();
  }
}
