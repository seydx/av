/**
 * Filter - High-level wrapper for media filtering
 *
 * Implements FFmpeg CLI's filter graph behavior with proper hardware context handling.
 * Uses lazy initialization for hardware inputs: graph is built when first frame arrives
 * with hw_frames_ctx. For software inputs, initializes immediately.
 *
 * Handles filter graph creation, frame processing, and format conversion.
 * Supports complex filter chains and hardware-accelerated filters.
 *
 * @module api/filter
 */

import { AVERROR_EOF, AVFILTER_FLAG_HWDEVICE, AVMEDIA_TYPE_AUDIO, AVMEDIA_TYPE_VIDEO } from '../constants/constants.js';
import { AVERROR_EAGAIN, avGetSampleFmtName, avIsHardwarePixelFormat, FFmpegError, Filter, FilterGraph, FilterInOut, Frame } from '../lib/index.js';

import type { AVFilterCmdFlag, AVMediaType } from '../constants/constants.js';
import type { FilterContext } from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { FilterOptions, StreamInfo, VideoInfo } from './types.js';

/**
 * High-level filter API for media processing.
 *
 * Provides a simplified interface for FFmpeg's filter system.
 * Supports both simple filter chains and complex filter graphs.
 * Handles automatic format negotiation and buffer management.
 *
 * The filter graph uses lazy initialization for hardware inputs - it's built when
 * the first frame arrives with hw_frames_ctx. This matches FFmpeg CLI behavior
 * for proper hardware context propagation.
 *
 * @example
 * ```typescript
 * import { FilterAPI, Frame } from '@seydx/av/api';
 *
 * // Simple video filter from a stream
 * const videoStream = media.video();
 * const filter = await FilterAPI.create('scale=1280:720,format=yuv420p', videoStream);
 *
 * // Process frames
 * const outputFrame = await filter.process(inputFrame);
 * ```
 *
 * @example
 * ```typescript
 * // Hardware acceleration (decoder -> hw filter -> encoder)
 * const hw = await HardwareContext.auto();
 * const decoder = await Decoder.create(stream, { hardware: hw });
 * const filter = await FilterAPI.create('scale_vt=640:480', decoder.getOutputStreamInfo(), {
 *   hardware: hw
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Software decode -> hardware encode pipeline with hwupload
 * const decoder = await Decoder.create(stream);
 * const hw = await HardwareContext.auto();
 * const filter = await FilterAPI.create('format=nv12,hwupload', decoder.getOutputStreamInfo(), {
 *   hardware: hw  // Required for hwupload to create hw_frames_ctx
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Hardware decode -> software encode pipeline with hwdownload
 * const hw = await HardwareContext.auto();
 * const decoder = await Decoder.create(stream, { hardware: hw });
 * const filter = await FilterAPI.create('hwdownload,format=yuv420p', decoder.getOutputStreamInfo());
 * ```
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
   * Create a new Filter instance.
   *
   * @param config - Stream information from input stream
   * @param description - Filter graph description
   * @param options - Filter options including hardware context
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
   * Create a filter from a filter description string.
   *
   * Accepts either a Stream (from MediaInput/Decoder) or StreamInfo (for raw data).
   * Automatically sets up buffer source and sink filters.
   *
   * For hardware input formats: Uses lazy initialization, waits for first frame
   * with hw_frames_ctx before configuring the filter graph.
   * For software formats: Initializes immediately.
   *
   * Hardware context handling:
   * - hwupload: Requires hardware context, creates its own hw_frames_ctx
   * - hwdownload: Uses hw_frames_ctx propagated from previous filters
   * - Other HW filters: Use propagated hw_frames_ctx or hwupload's output
   *
   * @param description - Filter graph description (e.g., "scale=1280:720" or complex chains)
   * @param input - Stream or StreamInfo describing the input
   * @param options - Optional filter options including hardware context
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {FFmpegError} If filter creation or configuration fails
   * @throws {Error} If hardware filter requires hardware context but none provided
   *
   * @example
   * ```typescript
   * // Simple filter
   * const filter = await FilterAPI.create('scale=640:480', videoStream);
   *
   * // Complex filter chain with hardware
   * const hw = await HardwareContext.auto();
   * const decoder = await Decoder.create(stream, { hardware: hw });
   * const filter = await FilterAPI.create(
   *   'scale_vt=640:480,hwdownload,format=yuv420p',
   *   decoder.getOutputStreamInfo(),
   *   { hardware: hw }
   * );
   *
   * // From StreamInfo (for raw data)
   * const filter = await FilterAPI.create('scale=640:480', {
   *   type: 'video',
   *   width: 1920,
   *   height: 1080,
   *   pixelFormat: AV_PIX_FMT_YUV420P,
   *   timeBase: { num: 1, den: 30 }
   * });
   * ```
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
   * Process a single frame through the filter.
   *
   * Sends a frame through the filter graph and returns the filtered result.
   * May return null if the filter needs more input frames.
   *
   * On first frame with hw_frames_ctx, initializes the filter graph (lazy initialization).
   * Subsequent frames are processed normally. FFmpeg automatically propagates
   * hw_frames_ctx through the filter chain.
   *
   * @param frame - Input frame to filter
   *
   * @returns Promise resolving to filtered frame or null if more input needed
   *
   * @throws {FFmpegError} If processing fails
   * @throws {Error} If filter not initialized or hardware frame required but not provided
   *
   * @example
   * ```typescript
   * const outputFrame = await filter.process(inputFrame);
   * if (outputFrame) {
   *   // Process the filtered frame
   * }
   * ```
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
    } else if (FFmpegError.is(getRet, AVERROR_EAGAIN)) {
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
   * Process multiple frames through the filter.
   *
   * Batch processing for better performance.
   * Returns all available output frames.
   *
   * @param frames - Array of input frames
   *
   * @returns Promise resolving to array of filtered frames
   *
   * @throws {FFmpegError} If processing fails
   *
   * @example
   * ```typescript
   * const outputFrames = await filter.processMultiple(inputFrames);
   * ```
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
   * Receive a filtered frame without sending input.
   *
   * Used to drain buffered frames from the filter.
   * Returns null when no more frames are available.
   *
   * @returns Promise resolving to filtered frame or null
   *
   * @throws {FFmpegError} If receiving fails
   *
   * @example
   * ```typescript
   * // Drain all buffered frames
   * while (true) {
   *   const frame = await filter.receive();
   *   if (!frame) break;
   *   // Process frame
   * }
   * ```
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
      if (FFmpegError.is(ret, AVERROR_EAGAIN) || FFmpegError.is(ret, AVERROR_EOF)) {
        return null;
      }
      FFmpegError.throwIfError(ret, 'Failed to receive frame from filter');
      return null;
    }
  }

  /**
   * Flush the filter by sending null frame.
   *
   * Signals end of stream to the filter.
   * Use receive() to get any remaining frames.
   *
   * @returns Promise resolving when flush is complete
   *
   * @throws {FFmpegError} If flush fails
   *
   * @example
   * ```typescript
   * await filter.flush();
   * // Get remaining frames
   * while (true) {
   *   const frame = await filter.receive();
   *   if (!frame) break;
   *   // Process final frames
   * }
   * ```
   */
  async flush(): Promise<void> {
    if (!this.initialized || !this.buffersrcCtx) {
      throw new Error('Filter not initialized');
    }

    const ret = await this.buffersrcCtx.buffersrcAddFrame(null);
    if (ret < 0 && !FFmpegError.is(ret, AVERROR_EOF)) {
      FFmpegError.throwIfError(ret, 'Failed to flush filter');
    }
  }

  /**
   * Flush filter and yield all remaining frames as a generator.
   *
   * More convenient than calling flush() + receive() in a loop.
   * Automatically sends flush signal and yields all buffered frames.
   *
   * @returns Async generator of remaining frames
   *
   * @throws {Error} If filter is not initialized
   *
   * @example
   * ```typescript
   * // Process all remaining frames with generator
   * for await (const frame of filter.flushFrames()) {
   *   // Process final frame
   *   using _ = frame; // Auto cleanup
   * }
   * ```
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
   * Process frames as an async generator.
   *
   * Provides a convenient iterator interface for filtering.
   * Automatically handles buffering and draining.
   * Input frames are automatically freed after processing.
   *
   * IMPORTANT: The yielded frames MUST be freed by the caller!
   * Input frames are automatically freed after processing.
   *
   * @param frames - Async generator of input frames (will be freed automatically)
   *
   * @returns Async generator of filtered frames (ownership transferred to caller)
   *
   * @example
   * ```typescript
   * for await (const filtered of filter.frames(decoder.frames())) {
   *   // Process filtered frame
   *   using _ = filtered; // Auto cleanup with using statement
   * }
   * ```
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
   * Send a command to a filter in the graph.
   *
   * Allows runtime modification of filter parameters without recreating the graph.
   * Not all filters support commands - check filter documentation.
   *
   * @param target - Filter name or "all" to send to all filters
   * @param cmd - Command name (e.g., "volume", "hue", "brightness")
   * @param arg - Command argument value
   * @param flags - Optional command flags
   *
   * @returns Command response
   *
   * @example
   * ```typescript
   * // Change volume dynamically
   * const response = filter.sendCommand('volume', 'volume', '0.5');
   * if (response) {
   *   console.log('Volume changed successfully');
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Enable/disable all filters at runtime
   * filter.sendCommand('all', 'enable', 'expr=gte(t,10)');
   * ```
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
   * Queue a command to be executed at a specific time.
   *
   * Commands are executed when processing frames with matching timestamps.
   * Useful for scripted filter changes synchronized with media playback.
   *
   * @param target - Filter name or "all" to send to all filters
   * @param cmd - Command name (e.g., "volume", "hue", "brightness")
   * @param arg - Command argument value
   * @param ts - Timestamp when command should execute (in seconds)
   * @param flags - Optional command flags
   *
   * @example
   * ```typescript
   * // Schedule volume changes at specific times
   * filter.queueCommand('volume', 'volume', '0.5', 5.0);  // At 5 seconds
   * filter.queueCommand('volume', 'volume', '0.8', 10.0); // At 10 seconds
   * filter.queueCommand('volume', 'volume', '0.2', 15.0); // At 15 seconds
   * ```
   */
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): void {
    if (!this.initialized || !this.graph) {
      throw new Error('Filter not initialized');
    }

    const ret = this.graph.queueCommand(target, cmd, arg, ts, flags);
    FFmpegError.throwIfError(ret, 'Failed to queue filter command');
  }

  /**
   * Get the filter graph description.
   *
   * Returns a string representation of the filter graph in DOT format.
   * Useful for debugging and visualization.
   *
   * @returns Graph description or null if not initialized
   *
   * @example
   * ```typescript
   * const description = filter.getGraphDescription();
   * console.log(description);
   * ```
   */
  getGraphDescription(): string | null {
    if (!this.initialized || !this.graph) {
      return null;
    }
    return this.graph.dump();
  }

  /**
   * Check if the filter is initialized and ready.
   *
   * @returns true if the filter is ready for processing
   */
  isReady(): boolean {
    return this.initialized && this.buffersrcCtx !== null && this.buffersinkCtx !== null;
  }

  /**
   * Get the media type of this filter.
   *
   * @returns The media type (video or audio)
   */
  getMediaType(): AVMediaType {
    return this.mediaType;
  }

  /**
   * Free all filter resources.
   *
   * Releases the filter graph and all associated filters.
   * The filter instance cannot be used after calling this.
   *
   * @example
   * ```typescript
   * filter.free();
   * // filter is now invalid
   * ```
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
   * Initialize the filter graph.
   *
   * Sets up buffer source, buffer sink, and parses the filter description.
   * Configures the graph for processing.
   *
   * For hardware inputs: Uses hw_frames_ctx from first frame
   * For software inputs: Initializes without hw_frames_ctx
   *
   * @internal
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
   * @internal
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
   * Create and configure the buffer source filter without hw_frames_ctx.
   *
   * @internal
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
   * Create and configure the buffer sink filter.
   *
   * @internal
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
   * Parse and connect the filter description.
   *
   * @internal
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
   * Check if hardware context is required for the filter chain.
   *
   * Validates that hardware context is provided when needed:
   * - hwupload: Always requires hardware context
   * - Hardware filters (AVFILTER_FLAG_HWDEVICE): Recommend hardware context
   * - hwdownload: Warns if input is not hardware format
   *
   * @internal
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

      // // Check if this is hwupload - always needs hardware context
      // if (filterName === 'hwupload' || filterName === 'hwupload_cuda') {
      //   if (!options.hardware) {
      //     throw new Error(`Filter '${filterName}' requires a hardware context`);
      //   }
      // } else if (filterName === 'hwdownload') {
      //   // Check if this is hwdownload - warn if input is not hardware format
      //   if (this.config.type === 'video' && !avIsHardwarePixelFormat(this.config.pixelFormat)) {
      //     // prettier-ignore
      //     console.warn(
      //       `Warning: 'hwdownload' filter used with software input format (${this.config.pixelFormat}). ` +
      //       'This will likely fail at runtime. hwdownload expects hardware frames as input. ' +
      //       'Consider removing hwdownload from your filter chain or ensuring hardware input.',
      //     );
      //   }
      // } else if ((lowLevelFilter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
      //   // Check if this is a hardware filter
      //   if (!options.hardware) {
      //     // prettier-ignore
      //     console.warn(
      //       `Warning: Hardware filter '${filterName}' used without hardware context. ` +
      //       "This may work if hw_frames_ctx is propagated from input, but it's recommended " +
      //       'to pass { hardware: HardwareContext } in filter options.',
      //     );
      //   }
      // }
    }
  }

  /**
   * Dispose of the filter.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using filter = await Filter.create('scale=1280:720', config);
   *   // ... use filter
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.free();
  }
}
