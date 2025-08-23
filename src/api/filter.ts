import {
  AVERROR_EAGAIN,
  AVERROR_EOF,
  AVFILTER_FLAG_HWDEVICE,
  avGetPixFmtName,
  avGetSampleFmtName,
  AVMEDIA_TYPE_AUDIO,
  AVMEDIA_TYPE_VIDEO,
  FFmpegError,
  Frame,
  Filter as LowLevelFilter,
  FilterGraph as LowLevelFilterGraph,
  FilterInOut as LowLevelFilterInOut,
  Stream,
} from '../lib/index.js';

import type {
  AVFilterCmdFlag,
  AVMediaType,
  AVPixelFormat,
  AVSampleFormat,
  HardwareFramesContext,
  IRational,
  FilterContext as LowLevelFilterContext,
} from '../lib/index.js';
import type { HardwareContext } from './hardware.js';
import type { FilterOptions, StreamInfo } from './types.js';

// Internal filter configuration types
interface VideoFilterConfig {
  type: 'video';
  width: number;
  height: number;
  pixelFormat: AVPixelFormat;
  timeBase: IRational;
  frameRate?: IRational;
  sampleAspectRatio?: IRational;
  hwFramesCtx?: HardwareFramesContext | null;
}

interface AudioFilterConfig {
  type: 'audio';
  sampleRate: number;
  sampleFormat: AVSampleFormat;
  channelLayout: bigint;
  timeBase: IRational;
}

type FilterConfig = VideoFilterConfig | AudioFilterConfig;

/**
 * High-level filter API for media processing.
 *
 * Provides a simplified interface for FFmpeg's filter system.
 * Supports both simple filter chains and complex filter graphs.
 * Handles automatic format negotiation and buffer management.
 *
 * @example
 * ```typescript
 * import { FilterAPI, Frame } from '@seydx/av/api';
 *
 * // Create a simple video filter from a stream
 * const videoStream = media.video();
 * const filter = await FilterAPI.create('scale=1280:720,format=yuv420p', videoStream);
 *
 * // Process frames
 * const outputFrame = await filter.process(inputFrame);
 * ```
 *
 * @example
 * ```typescript
 * // Create filter with hardware acceleration
 * const hw = await HardwareContext.auto();
 * const filter = await FilterAPI.create('scale_vt=640:480', videoStream, {
 *   hardware: hw
 * });
 * ```
 */
export class FilterAPI implements Disposable {
  private graph: LowLevelFilterGraph;
  private buffersrcCtx: LowLevelFilterContext | null = null;
  private buffersinkCtx: LowLevelFilterContext | null = null;
  private config: FilterConfig;
  private mediaType: AVMediaType;
  private initialized = false;
  private needsHardware = false; // Track if this filter REQUIRES hardware
  private hardware?: HardwareContext | null; // Store reference for hardware context
  private pendingInit?: { description: string; options: FilterOptions }; // For delayed init

  /**
   * Create a new Filter instance.
   *
   * The filter is uninitialized until setup with a filter description.
   * Use the static factory methods for easier creation.
   *
   * @param config - Filter configuration
   * @param hardware - Optional hardware context for late framesContext binding
   * @internal
   */
  private constructor(config: FilterConfig, hardware?: HardwareContext | null) {
    this.config = config;
    this.hardware = hardware;
    this.mediaType = config.type === 'video' ? AVMEDIA_TYPE_VIDEO : AVMEDIA_TYPE_AUDIO;
    this.graph = new LowLevelFilterGraph();
  }

  /**
   * Create a filter from a filter description string.
   *
   * Accepts either a Stream (from MediaInput/Decoder) or StreamInfo (for raw data).
   * Automatically sets up buffer source and sink filters.
   *
   * Handles complex filter chains with multiple filters. Automatically detects if ANY
   * filter in the chain requires hardware acceleration (e.g., scale_vt in
   * "format=nv12,hwupload,scale_vt=640:480").
   *
   * @param description - Filter graph description (e.g., "scale=1280:720" or complex chains)
   * @param input - Stream or StreamInfo describing the input
   * @param options - Optional filter options including hardware context
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {FFmpegError} If filter creation or configuration fails
   *
   * @example
   * ```typescript
   * // Simple filter
   * const filter = await FilterAPI.create('scale=640:480', videoStream);
   *
   * // Complex filter chain with hardware
   * const hw = await HardwareContext.auto();
   * const filter = await FilterAPI.create(
   *   'format=nv12,hwupload,scale_vt=640:480,hwdownload,format=yuv420p',
   *   videoStream,
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
  static async create(description: string, input: Stream | StreamInfo, options: FilterOptions = {}): Promise<FilterAPI> {
    let config: FilterConfig;

    if (input instanceof Stream) {
      if (input.codecpar.codecType === AVMEDIA_TYPE_VIDEO) {
        config = {
          type: 'video',
          width: input.codecpar.width,
          height: input.codecpar.height,
          pixelFormat: input.codecpar.format as AVPixelFormat,
          timeBase: input.timeBase,
          frameRate: input.rFrameRate,
          sampleAspectRatio: input.codecpar.sampleAspectRatio,
        };
      } else if (input.codecpar.codecType === AVMEDIA_TYPE_AUDIO) {
        config = {
          type: 'audio',
          sampleRate: input.codecpar.sampleRate,
          sampleFormat: input.codecpar.format as AVSampleFormat,
          channelLayout: input.codecpar.channelLayout.mask,
          timeBase: input.timeBase,
        };
      } else {
        throw new Error('Unsupported codec type');
      }
    } else {
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
          channelLayout: typeof input.channelLayout === 'bigint' ? input.channelLayout : input.channelLayout.mask || 3n,
          timeBase: input.timeBase,
        };
      }
    }

    const filter = new FilterAPI(config, options.hardware);

    // Parse the entire filter chain to check if ANY filter requires hardware
    // Split by comma to get individual filters, handle complex chains like:
    // "format=nv12,hwupload,scale_vt=100:100,hwdownload,format=yuv420p"
    const filterNames = description
      .split(',')
      .map((f) => {
        // Extract filter name (before = or : or whitespace)
        const match = /^([a-zA-Z0-9_]+)/.exec(f.trim());
        return match ? match[1] : null;
      })
      .filter(Boolean);

    // Check if chain contains hwupload (which creates hw frames context)
    const hasHwDownload = filterNames.some((name) => name === 'hwdownload');
    const hasHwUpload = filterNames.some((name) => name === 'hwupload');
    // Check each filter in the chain
    let needsHardwareFramesContext = false;
    let needsHardwareDevice = false;

    for (const filterName of filterNames) {
      if (!filterName) continue;

      const lowLevelFilter = LowLevelFilter.getByName(filterName);
      if (lowLevelFilter) {
        // Check if this filter needs hardware
        if ((lowLevelFilter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
          needsHardwareDevice = true;
          // Only non-hwupload filters need frames context from decoder
          if (filterName !== 'hwupload' && filterName !== 'hwdownload') {
            needsHardwareFramesContext = true;
          }
        }
      }
    }

    // If we have hwupload, we don't need hardware frames context from decoder
    filter.needsHardware = hasHwDownload || (needsHardwareFramesContext && !hasHwUpload);

    // Validation: Hardware filter MUST have HardwareContext
    if (needsHardwareDevice && !options.hardware) {
      throw new Error('Hardware filter in chain requires a hardware context. ' + 'Please provide one via options.hardware');
    }

    // Check if we can initialize immediately
    // Initialize if: (1) we don't need hardware, OR (2) we need hardware AND have framesContext
    if (!filter.needsHardware || (filter.needsHardware && options.hardware?.framesContext)) {
      // Can initialize now
      if (options.hardware?.framesContext && config.type === 'video') {
        config.hwFramesCtx = options.hardware.framesContext;
      }
      await filter.initialize(description, options);
      filter.initialized = true;
    } else {
      // Delay initialization until first frame (hardware needed but no framesContext yet)
      filter.pendingInit = { description, options };
    }

    return filter;
  }

  /**
   * Process a single frame through the filter.
   *
   * Sends a frame through the filter graph and returns the filtered result.
   * May return null if the filter needs more input frames.
   *
   * @param frame - Input frame to filter
   *
   * @returns Promise resolving to filtered frame or null
   *
   * @throws {FFmpegError} If processing fails
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
    // Check for delayed initialization
    if (!this.initialized && this.pendingInit) {
      // Check if hardware frames context became available
      if (this.hardware?.framesContext && this.config.type === 'video') {
        this.config.hwFramesCtx = this.hardware.framesContext;
        // Update pixel format to match hardware frames if using hardware
        if (this.needsHardware) {
          this.config.pixelFormat = this.hardware.getHardwarePixelFormat();
        }
        // Now we can initialize
        await this.initialize(this.pendingInit.description, this.pendingInit.options);
        this.pendingInit = undefined;
        this.initialized = true;
      } else if (this.needsHardware) {
        throw new Error('Hardware filter requires frames context which is not yet available');
      } else {
        // Software filter or hardware not required, can initialize now
        await this.initialize(this.pendingInit.description, this.pendingInit.options);
        this.pendingInit = undefined;
        this.initialized = true;
      }
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
   *   filtered.free(); // Must free output frame
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
    if (!this.initialized) {
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
   * Get the filter configuration.
   *
   * @returns The filter configuration used to create this instance
   */
  getConfig(): FilterConfig {
    return this.config;
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
   * @internal
   */
  private async initialize(description: string, options: FilterOptions): Promise<void> {
    // Allocate graph
    this.graph.alloc();

    // Configure threading
    if (options.threads !== undefined) {
      this.graph.nbThreads = options.threads;
    }

    // Configure scaler options
    if (options.scaleSwsOpts) {
      this.graph.scaleSwsOpts = options.scaleSwsOpts;
    }

    // Create buffer source
    this.createBufferSource();

    // Create buffer sink
    this.createBufferSink();

    // Parse filter description
    this.parseFilterDescription(description);

    // Set hw_device_ctx on hardware filters if we have hardware context
    if (this.hardware?.deviceContext) {
      const filters = this.graph.filters;
      if (filters) {
        for (const filterCtx of filters) {
          // Check if this filter needs hardware device context
          const filter = filterCtx.filter;
          if (filter && (filter.flags & AVFILTER_FLAG_HWDEVICE) !== 0) {
            // Set hardware device context on this filter
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
   * Create and configure the buffer source filter.
   *
   * @internal
   */
  private createBufferSource(): void {
    const filterName = this.config.type === 'video' ? 'buffer' : 'abuffer';
    const bufferFilter = LowLevelFilter.getByName(filterName);
    if (!bufferFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // Check if we have hardware frames context for video
    const hasHwFrames = this.config.type === 'video' && this.config.hwFramesCtx;

    if (hasHwFrames) {
      // For hardware frames, allocate filter without initialization
      this.buffersrcCtx = this.graph.allocFilter(bufferFilter, 'in');
      if (!this.buffersrcCtx) {
        throw new Error('Failed to allocate buffer source');
      }

      // Set parameters including hardware frames context (BEFORE init)
      const videoConfig = this.config as VideoFilterConfig;
      const ret = this.buffersrcCtx.buffersrcParametersSet({
        width: videoConfig.width,
        height: videoConfig.height,
        format: videoConfig.pixelFormat,
        timeBase: videoConfig.timeBase,
        frameRate: videoConfig.frameRate,
        sampleAspectRatio: videoConfig.sampleAspectRatio,
        hwFramesCtx: videoConfig.hwFramesCtx,
      });
      FFmpegError.throwIfError(ret, 'Failed to set buffer source parameters with hardware frames context');

      // Initialize filter AFTER setting parameters
      const initRet = this.buffersrcCtx.init(null);
      FFmpegError.throwIfError(initRet, 'Failed to initialize buffer source');
    } else {
      // Build initialization string based on media type
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
        // Use sample format name from utilities
        const sampleFmtName = avGetSampleFmtName(cfg.sampleFormat);
        // Handle invalid channel layout (0) by using stereo as default
        const channelLayout = cfg.channelLayout === 0n ? 'stereo' : cfg.channelLayout.toString();
        args = `sample_rate=${cfg.sampleRate}:sample_fmt=${sampleFmtName}:channel_layout=${channelLayout}:time_base=${cfg.timeBase.num}/${cfg.timeBase.den}`;
      }

      this.buffersrcCtx = this.graph.createFilter(bufferFilter, 'in', args);
      if (!this.buffersrcCtx) {
        throw new Error('Failed to create buffer source');
      }
    }
  }

  /**
   * Create and configure the buffer sink filter.
   *
   * @internal
   */
  private createBufferSink(): void {
    const filterName = this.config.type === 'video' ? 'buffersink' : 'abuffersink';
    const sinkFilter = LowLevelFilter.getByName(filterName);
    if (!sinkFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // Create sink filter - no automatic format conversion
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
    const outputs = new LowLevelFilterInOut();
    outputs.alloc();
    outputs.name = 'in';
    outputs.filterCtx = this.buffersrcCtx;
    outputs.padIdx = 0;

    const inputs = new LowLevelFilterInOut();
    inputs.alloc();
    inputs.name = 'out';
    inputs.filterCtx = this.buffersinkCtx;
    inputs.padIdx = 0;

    // Parse the filter graph
    const ret = this.graph.parsePtr(description, inputs, outputs);
    FFmpegError.throwIfError(ret, 'Failed to parse filter description');

    // Clean up FilterInOut structures
    inputs.free();
    outputs.free();
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
   *
   * @example
   * ```typescript
   * // Fade effect at specific timestamp
   * filter.queueCommand('fade', 'alpha', '0.5', 30.0);
   * ```
   */
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): void {
    if (!this.initialized) {
      throw new Error('Filter not initialized');
    }

    const ret = this.graph.queueCommand(target, cmd, arg, ts, flags);
    FFmpegError.throwIfError(ret, 'Failed to queue filter command');
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

/**
 * Common filter presets for convenience.
 *
 * Provides pre-defined filter strings for common operations.
 * Can be used with Filter.create() for quick setup.
 *
 * @example
 * ```typescript
 * const filter = await Filter.create(
 *   FilterPresets.scale(1280, 720),
 *   config
 * );
 * ```
 */
export class FilterPresets {
  /**
   * Scale video to specified dimensions.
   */
  static scale(width: number, height: number, flags?: string): string {
    const base = `scale=${width}:${height}`;
    return flags ? `${base}:flags=${flags}` : base;
  }

  /**
   * Crop video to specified dimensions.
   */
  static crop(width: number, height: number, x = 0, y = 0): string {
    return `crop=${width}:${height}:${x}:${y}`;
  }

  /**
   * Change frame rate.
   */
  static fps(fps: number): string {
    return `fps=${fps}`;
  }

  /**
   * Convert pixel format.
   * Can accept either format name string or AVPixelFormat enum.
   */
  static format(pixelFormat: string | AVPixelFormat): string {
    const formatName = typeof pixelFormat === 'string' ? pixelFormat : (avGetPixFmtName(pixelFormat) ?? 'yuv420p');
    return `format=${formatName}`;
  }

  /**
   * Rotate video by angle.
   */
  static rotate(angle: number): string {
    return `rotate=${angle}*PI/180`;
  }

  /**
   * Flip video horizontally.
   */
  static hflip(): string {
    return 'hflip';
  }

  /**
   * Flip video vertically.
   */
  static vflip(): string {
    return 'vflip';
  }

  /**
   * Apply fade effect.
   */
  static fade(type: 'in' | 'out', start: number, duration: number): string {
    return `fade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Overlay one video on another.
   */
  static overlay(x = 0, y = 0): string {
    return `overlay=${x}:${y}`;
  }

  /**
   * Adjust audio volume.
   */
  static volume(factor: number): string {
    return `volume=${factor}`;
  }

  /**
   * Convert audio sample format.
   * Can accept either format name string or AVSampleFormat enum.
   */
  static aformat(sampleFormat: string | AVSampleFormat, sampleRate?: number, channelLayout?: string): string {
    const formatName = typeof sampleFormat === 'string' ? sampleFormat : (avGetSampleFmtName(sampleFormat) ?? 's16');
    let filter = `aformat=sample_fmts=${formatName}`;
    if (sampleRate) filter += `:sample_rates=${sampleRate}`;
    if (channelLayout) filter += `:channel_layouts=${channelLayout}`;
    return filter;
  }

  /**
   * Change audio tempo without changing pitch.
   */
  static atempo(factor: number): string {
    return `atempo=${factor}`;
  }

  /**
   * Apply audio fade.
   */
  static afade(type: 'in' | 'out', start: number, duration: number): string {
    return `afade=t=${type}:st=${start}:d=${duration}`;
  }

  /**
   * Mix multiple audio streams.
   */
  static amix(inputs = 2, duration: 'first' | 'longest' | 'shortest' = 'longest'): string {
    return `amix=inputs=${inputs}:duration=${duration}`;
  }
}
