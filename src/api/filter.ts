import {
  AV_ERROR_EAGAIN,
  AV_ERROR_EOF,
  AV_MEDIA_TYPE_AUDIO,
  AV_MEDIA_TYPE_VIDEO,
  AV_OPT_SEARCH_CHILDREN,
  FFmpegError,
  Frame,
  Filter as LowLevelFilter,
  FilterGraph as LowLevelFilterGraph,
  FilterInOut as LowLevelFilterInOut,
  avGetPixFmtName,
  avGetSampleFmtName,
} from '../lib/index.js';

import type { AVMediaType, AVPixelFormat, AVSampleFormat } from '../lib/constants.js';
import type { CodecContext, FormatContext, FilterContext as LowLevelFilterContext, Stream } from '../lib/index.js';
import type { Decoder } from './decoder.js';
import type { Encoder } from './encoder.js';
import type { FilterConfig, FilterOptions, FilterOutputOptions, VideoFilterConfig } from './types.js';

/**
 * High-level filter API for media processing.
 *
 * Provides a simplified interface for FFmpeg's filter system.
 * Supports both simple filter chains and complex filter graphs.
 * Handles automatic format negotiation and buffer management.
 *
 * @example
 * ```typescript
 * import { Filter, Frame } from '@seydx/ffmpeg/api';
 *
 * // Create a simple video filter
 * const filter = await Filter.create('scale=1280:720,format=yuv420p', {
 *   width: 1920,
 *   height: 1080,
 *   pixelFormat: AV_PIX_FMT_YUV420P,
 *   timeBase: { num: 1, den: 30 }
 * });
 *
 * // Process frames
 * const outputFrame = await filter.process(inputFrame);
 * ```
 *
 * @example
 * ```typescript
 * // Create filter from decoder
 * const filter = await Filter.createFromDecoder(
 *   decoder,
 *   'scale=640:480,fps=30'
 * );
 * ```
 */
export class FilterAPI implements Disposable {
  private graph: LowLevelFilterGraph;
  private buffersrcCtx: LowLevelFilterContext | null = null;
  private buffersinkCtx: LowLevelFilterContext | null = null;
  private config: FilterConfig;
  private mediaType: AVMediaType;
  private initialized = false;

  /**
   * Create a new Filter instance.
   *
   * The filter is uninitialized until setup with a filter description.
   * Use the static factory methods for easier creation.
   *
   * @internal
   */
  private constructor(config: FilterConfig) {
    this.config = config;
    this.mediaType = config.type === 'video' ? AV_MEDIA_TYPE_VIDEO : AV_MEDIA_TYPE_AUDIO;
    this.graph = new LowLevelFilterGraph();
  }

  /**
   * Create a filter from a filter description string.
   *
   * Parses and initializes a filter graph from the description.
   * Automatically sets up buffer source and sink filters.
   *
   * @param description - Filter graph description (e.g., "scale=1280:720")
   * @param config - Input stream configuration
   * @param options - Optional filter options
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {FFmpegError} If filter creation or configuration fails
   *
   * @example
   * ```typescript
   * const filter = await Filter.create('scale=640:480,format=yuv420p', {
   *   type: 'video',
   *   width: 1920,
   *   height: 1080,
   *   pixelFormat: AV_PIX_FMT_YUV420P,
   *   timeBase: { num: 1, den: 30 }
   * });
   * ```
   */
  static async create(description: string, config: FilterConfig, options: FilterOptions = {}): Promise<FilterAPI> {
    const filter = new FilterAPI(config);
    await filter.initialize(description, options);
    return filter;
  }

  /**
   * Create a filter from a decoder context.
   *
   * Extracts configuration from the decoder and creates the filter.
   * Useful for applying filters during decoding pipelines.
   *
   * @param decoder - Decoder instance or CodecContext
   * @param description - Filter graph description
   * @param options - Optional filter options
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {Error} If decoder is not initialized or incompatible
   * @throws {FFmpegError} If filter creation fails
   *
   * @example
   * ```typescript
   * const filter = await Filter.createFromDecoder(
   *   decoder,
   *   'scale=1280:720,fps=30'
   * );
   * ```
   */
  static async createFromDecoder(decoder: Decoder | CodecContext, description: string, options: FilterOptions = {}): Promise<FilterAPI> {
    const codecCtx = 'getCodecContext' in decoder ? decoder.getCodecContext() : decoder;

    if (!codecCtx) {
      throw new Error('Decoder not initialized');
    }

    const config = FilterAPI.extractConfigFromCodecContext(codecCtx);
    return FilterAPI.create(description, config, options);
  }

  /**
   * Create a filter from an encoder context.
   *
   * Configures the filter to match encoder input requirements.
   * Ensures frames are in the correct format for encoding.
   *
   * @param encoder - Encoder instance or CodecContext
   * @param description - Filter graph description
   * @param inputConfig - Input stream configuration
   * @param options - Optional filter options
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {Error} If encoder is not initialized
   * @throws {FFmpegError} If filter creation fails
   *
   * @example
   * ```typescript
   * const filter = await Filter.createFromEncoder(
   *   encoder,
   *   'scale=1920:1080',
   *   inputConfig,
   *   {
   *     output: {
   *       pixelFormats: [encoder.pixelFormat]
   *     }
   *   }
   * );
   * ```
   */
  static async createFromEncoder(encoder: Encoder | CodecContext, description: string, inputConfig: FilterConfig, options: FilterOptions = {}): Promise<FilterAPI> {
    const codecCtx = 'getCodecContext' in encoder ? encoder.getCodecContext() : encoder;

    if (!codecCtx) {
      throw new Error('Encoder not initialized');
    }

    // Set output constraints to match encoder requirements
    options.output ??= {};

    if (codecCtx.codecType === AV_MEDIA_TYPE_VIDEO && codecCtx.pixelFormat >= 0) {
      options.output.pixelFormats = [codecCtx.pixelFormat];
    } else if (codecCtx.codecType === AV_MEDIA_TYPE_AUDIO && codecCtx.sampleFormat >= 0) {
      options.output.sampleFormats = [codecCtx.sampleFormat];
      if (codecCtx.sampleRate > 0) {
        options.output.sampleRates = [codecCtx.sampleRate];
      }
    }

    return FilterAPI.create(description, inputConfig, options);
  }

  /**
   * Create a filter from a stream in a format context.
   *
   * Extracts stream parameters and creates an appropriate filter.
   * Useful for processing streams directly from input files.
   *
   * @param formatCtx - Format context containing the stream
   * @param streamIndex - Index of the stream to use
   * @param description - Filter graph description
   * @param options - Optional filter options
   *
   * @returns Promise resolving to configured Filter instance
   *
   * @throws {Error} If stream not found or invalid
   * @throws {FFmpegError} If filter creation fails
   *
   * @example
   * ```typescript
   * const filter = await Filter.createFromStream(
   *   formatContext,
   *   videoStreamIndex,
   *   'scale=1280:720'
   * );
   * ```
   */
  static async createFromStream(formatCtx: FormatContext, streamIndex: number, description: string, options: FilterOptions = {}): Promise<FilterAPI> {
    const streams = formatCtx.streams;
    if (!streams || streamIndex < 0 || streamIndex >= streams.length) {
      throw new Error(`Invalid stream index: ${streamIndex}`);
    }

    const stream = streams[streamIndex];
    const config = FilterAPI.extractConfigFromStream(stream);
    return FilterAPI.create(description, config, options);
  }

  // Public Processing Methods

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
    } else if (FFmpegError.is(getRet, AV_ERROR_EAGAIN)) {
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
      if (FFmpegError.is(ret, AV_ERROR_EAGAIN) || FFmpegError.is(ret, AV_ERROR_EOF)) {
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
    if (ret < 0 && !FFmpegError.is(ret, AV_ERROR_EOF)) {
      FFmpegError.throwIfError(ret, 'Failed to flush filter');
    }
  }

  /**
   * Process frames as an async generator.
   *
   * Provides a convenient iterator interface for filtering.
   * Automatically handles buffering and draining.
   *
   * @param frames - Async generator of input frames
   *
   * @returns Async generator of filtered frames
   *
   * @example
   * ```typescript
   * for await (const filtered of filter.frames(decoder.frames())) {
   *   // Process filtered frame
   * }
   * ```
   */
  async *frames(frames: AsyncGenerator<Frame>): AsyncGenerator<Frame> {
    for await (const frame of frames) {
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
    }

    // Flush and get remaining frames
    await this.flush();
    while (true) {
      const remaining = await this.receive();
      if (!remaining) break;
      yield remaining;
    }
  }

  // Public Utility Methods

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

    // Create buffer sink with output constraints
    this.createBufferSink(options.output);

    // Parse filter description
    this.parseFilterDescription(description);

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
        const sampleFmtName = this.getSampleFormatName(cfg.sampleFormat);
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
  private createBufferSink(output?: FilterOutputOptions): void {
    const filterName = this.config.type === 'video' ? 'buffersink' : 'abuffersink';
    const sinkFilter = LowLevelFilter.getByName(filterName);
    if (!sinkFilter) {
      throw new Error(`${filterName} filter not found`);
    }

    // Allocate sink without initializing
    this.buffersinkCtx = this.graph.allocFilter(sinkFilter, 'out');
    if (!this.buffersinkCtx) {
      throw new Error('Failed to create buffer sink');
    }

    // Set output constraints if specified
    if (output) {
      if (this.config.type === 'video' && output.pixelFormats) {
        const ret = this.buffersinkCtx.optSetBin('pix_fmts', output.pixelFormats, AV_OPT_SEARCH_CHILDREN);
        FFmpegError.throwIfError(ret, 'Failed to set pixel formats');
      } else if (this.config.type === 'audio') {
        if (output.sampleFormats) {
          const ret = this.buffersinkCtx.optSetBin('sample_fmts', output.sampleFormats, AV_OPT_SEARCH_CHILDREN);
          FFmpegError.throwIfError(ret, 'Failed to set sample formats');
        }
        if (output.sampleRates) {
          const ret = this.buffersinkCtx.optSetBin('sample_rates', output.sampleRates, AV_OPT_SEARCH_CHILDREN);
          FFmpegError.throwIfError(ret, 'Failed to set sample rates');
        }
        if (output.channelLayouts) {
          // Convert bigint array to number array for optSetBin
          const layoutNumbers = output.channelLayouts.map((layout) => Number(layout));
          const ret = this.buffersinkCtx.optSetBin('channel_layouts', layoutNumbers, AV_OPT_SEARCH_CHILDREN);
          FFmpegError.throwIfError(ret, 'Failed to set channel layouts');
        }
      }
    }

    // Initialize the sink
    const ret = this.buffersinkCtx.init();
    FFmpegError.throwIfError(ret, 'Failed to initialize buffer sink');
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
   * Get pixel format name for filter string.
   *
   * @internal
   */
  private getPixelFormatName(format: AVPixelFormat): string {
    const name = avGetPixFmtName(format);
    if (!name) {
      throw new Error(`Unknown pixel format: ${format}`);
    }
    return name;
  }

  /**
   * Get sample format name for filter string.
   *
   * @internal
   */
  private getSampleFormatName(format: AVSampleFormat): string {
    const name = avGetSampleFmtName(format);
    if (!name) {
      throw new Error(`Unknown sample format: ${format}`);
    }
    return name;
  }

  /**
   * Extract filter configuration from a codec context.
   *
   * @internal
   */
  private static extractConfigFromCodecContext(codecCtx: CodecContext): FilterConfig {
    if (codecCtx.codecType === AV_MEDIA_TYPE_VIDEO) {
      // Use pktTimebase if timeBase is invalid
      let timeBase = codecCtx.timeBase;
      if (!timeBase || timeBase.num === 0 || timeBase.den === 0) {
        timeBase = codecCtx.pktTimebase || { num: 1, den: 25 };
      }
      return {
        type: 'video',
        width: codecCtx.width,
        height: codecCtx.height,
        pixelFormat: codecCtx.pixelFormat,
        timeBase,
        frameRate: codecCtx.framerate,
        sampleAspectRatio: codecCtx.sampleAspectRatio,
        hwFramesCtx: codecCtx.hwFramesCtx,
      };
    } else if (codecCtx.codecType === AV_MEDIA_TYPE_AUDIO) {
      // Use pktTimebase if timeBase is invalid
      let timeBase = codecCtx.timeBase;
      if (!timeBase || timeBase.num === 0 || timeBase.den === 0) {
        timeBase = codecCtx.pktTimebase || { num: 1, den: codecCtx.sampleRate || 48000 };
      }
      // Handle invalid channel layout (use stereo as default)
      const channelLayout = codecCtx.channelLayout?.mask || 3n; // 3n = stereo
      return {
        type: 'audio',
        sampleRate: codecCtx.sampleRate,
        sampleFormat: codecCtx.sampleFormat,
        channelLayout,
        timeBase,
      };
    } else {
      throw new Error('Unsupported codec type');
    }
  }

  /**
   * Extract filter configuration from a stream.
   *
   * @internal
   */
  private static extractConfigFromStream(stream: Stream): FilterConfig {
    const codecpar = stream.codecpar;
    if (!codecpar) {
      throw new Error('Stream has no codec parameters');
    }

    if (codecpar.codecType === AV_MEDIA_TYPE_VIDEO) {
      return {
        type: 'video',
        width: codecpar.width,
        height: codecpar.height,
        pixelFormat: codecpar.format as AVPixelFormat,
        timeBase: stream.timeBase,
        frameRate: stream.rFrameRate,
        sampleAspectRatio: codecpar.sampleAspectRatio,
      };
    } else if (codecpar.codecType === AV_MEDIA_TYPE_AUDIO) {
      return {
        type: 'audio',
        sampleRate: codecpar.sampleRate,
        sampleFormat: codecpar.format as AVSampleFormat,
        channelLayout: codecpar.channelLayout.mask,
        timeBase: stream.timeBase,
      };
    } else {
      throw new Error('Unsupported codec type');
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
