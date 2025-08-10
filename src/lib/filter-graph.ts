import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { AVPixelFormat, AVSampleFormat } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeFilterGraph, NativeHardwareDeviceContext, NativeHardwareFramesContext, NativeWrapper } from './native-types.js';
import type { Rational } from './rational.js';
import type { ChannelLayout } from './types.js';

/**
 * Options for creating a FilterGraph
 */
export interface FilterGraphOptions {
  /** Number of threads for parallel processing */
  threadCount?: number;
  /** Thread type for parallel processing (e.g., AV_FILTER_THREAD_SLICE) */
  threadType?: number;
}

/**
 * Input specification for filter pipeline
 */
export interface FilterInput {
  // Video parameters
  /** Frame width (required for video) */
  width?: number;
  /** Frame height (required for video) */
  height?: number;
  /** Pixel format (required for video) */
  pixelFormat?: AVPixelFormat;
  /** Time base for timestamps */
  timeBase?: Rational;
  /** Sample aspect ratio */
  sampleAspectRatio?: Rational;

  // Audio parameters
  /** Sample rate in Hz (required for audio) */
  sampleRate?: number;
  /** Sample format (required for audio) */
  sampleFormat?: AVSampleFormat;
  /** Channel layout (required for audio) */
  channelLayout?: ChannelLayout;

  // Hardware acceleration
  /** Hardware frames context for GPU filtering */
  hwFramesContext?: NativeHardwareFramesContext;
}

/**
 * Output specification for filter pipeline
 */
export interface FilterOutput {
  /** Allowed pixel formats for video */
  pixelFormats?: AVPixelFormat[];
  /** Allowed sample formats for audio */
  sampleFormats?: AVSampleFormat[];
}

/**
 * Hardware configuration for filter pipeline
 */
export interface HardwareConfig {
  /** Hardware device context (applied to filters with AVFILTER_FLAG_HWDEVICE) */
  deviceContext: NativeHardwareDeviceContext;
}

/**
 * Complete filter pipeline configuration
 */
export interface FilterPipelineConfig {
  /** Input specification */
  input: FilterInput;
  /** Filter chain string (e.g., "scale=640:480,format=yuv420p") */
  filters: string;
  /** Output specification (optional) */
  output?: FilterOutput;
  /** Hardware configuration (optional) */
  hardware?: HardwareConfig;
}

/**
 * Filter graph for audio/video processing pipelines
 *
 * Unified API for both CPU and GPU filtering with explicit control.
 *
 * @example CPU filtering
 * ```typescript
 * const graph = new FilterGraph();
 * await graph.buildPipeline({
 *   input: {
 *     width: 1920,
 *     height: 1080,
 *     pixelFormat: AV_PIX_FMT_YUV420P,
 *     timeBase: new Rational(1, 25)
 *   },
 *   filters: "scale=640:480,format=yuv420p"
 * });
 *
 * using outputFrame = new Frame();
 * const ret = await graph.processFrame(inputFrame, outputFrame);
 * if (ret === 0) {
 *   // Process filtered frame
 * }
 * ```
 *
 * @example GPU filtering
 * ```typescript
 * const graph = new FilterGraph();
 * await graph.buildPipeline({
 *   input: {
 *     width: 1920,
 *     height: 1080,
 *     pixelFormat: AV_PIX_FMT_VIDEOTOOLBOX,
 *     timeBase: new Rational(1, 25),
 *     hwFramesContext: decodedFrame
 *   },
 *   filters: "scale_vt=640:480",  // VideoToolbox filter
 *   hardware: {
 *     deviceContext: hwDevice
 *   }
 * });
 * ```
 */
export class FilterGraph implements Disposable, NativeWrapper<NativeFilterGraph> {
  private native: NativeFilterGraph;
  private inputContext?: FilterContext;
  private outputContext?: FilterContext;

  /**
   * Create a new filter graph
   * @param options Optional configuration
   */
  constructor(options?: FilterGraphOptions) {
    this.native = new bindings.FilterGraph();

    if (options?.threadCount !== undefined) {
      this.native.nbThreads = options.threadCount;
    }

    if (options?.threadType !== undefined) {
      this.native.threadType = options.threadType;
    }
  }

  /**
   * Get/set number of threads for parallel processing
   */
  get nbThreads(): number {
    return this.native.nbThreads;
  }

  set nbThreads(value: number) {
    this.native.nbThreads = value;
  }

  /**
   * Get/set thread type for parallel processing
   */
  get threadType(): number {
    return this.native.threadType;
  }

  set threadType(value: number) {
    this.native.threadType = value;
  }

  /**
   * Build complete filter pipeline
   *
   * Creates buffer source, applies filters, and creates buffer sink.
   * Must be called before processing frames.
   *
   * @param config Pipeline configuration
   * @throws FFmpegError if configuration fails
   */
  buildPipeline(config: FilterPipelineConfig): void {
    // Validate basic requirements
    this.validateConfig(config);

    // Build the pipeline (synchronous)
    this.native.buildPipeline(config);

    // Get input/output contexts for direct access
    const inputNative = this.native.getInputContext();
    const outputNative = this.native.getOutputContext();

    if (!inputNative || !outputNative) {
      throw new Error('Failed to create filter pipeline - contexts not initialized');
    }

    this.inputContext = new FilterContext(inputNative);
    this.outputContext = new FilterContext(outputNative);
  }

  /**
   * Process a single frame through the filter pipeline
   *
   * @param inputFrame Frame to filter (or null to flush the filter)
   * @param outputFrame Frame to receive filtered data (user manages allocation)
   * @returns 0 on success, AV_ERROR_EAGAIN if more input needed, AV_ERROR_EOF on end, negative on error
   *
   * @example
   * ```typescript
   * using outputFrame = new Frame();
   * const ret = await graph.processFrame(inputFrame, outputFrame);
   *
   * if (ret === 0) {
   *   // Success - process filtered frame
   *   await encoder.sendFrame(outputFrame);
   * } else if (ret === AV_ERROR_EAGAIN) {
   *   // Need more input frames
   * } else if (ret === AV_ERROR_EOF) {
   *   // Filter graph finished
   * } else {
   *   // Error occurred
   *   throw new FFmpegError("Filter processing failed", ret);
   * }
   * ```
   */
  async processFrame(inputFrame: Frame | null, outputFrame: Frame): Promise<number> {
    if (!this.inputContext || !this.outputContext) {
      throw new Error('Pipeline not configured. Call buildPipeline first.');
    }

    // Handle null frame for flushing
    const inputNative = inputFrame ? inputFrame.getNative() : null;
    return await this.native.processFrameAsync(inputNative, outputFrame.getNative());
  }

  /**
   * Get a filtered frame from the buffer sink without adding input
   *
   * Used after flushing to retrieve any remaining buffered frames.
   *
   * @param outputFrame Frame to receive filtered data (user manages allocation)
   * @returns 0 on success, AVERROR_EOF when no more frames, negative on error
   *
   * @example
   * ```typescript
   * // Flush the filter
   * await filterGraph.processFrame(null, frame);
   *
   * // Get remaining frames
   * while (true) {
   *   const ret = await filterGraph.getFilteredFrame(frame);
   *   if (ret < 0) break; // No more frames
   *   // Process frame...
   * }
   * ```
   */
  async getFilteredFrame(outputFrame: Frame): Promise<number> {
    if (!this.outputContext) {
      throw new Error('Pipeline not configured. Call buildPipeline first.');
    }

    return await this.native.getFilteredFrameAsync(outputFrame.getNative());
  }

  /**
   * Get input context for advanced control
   *
   * Allows direct access to buffer source for advanced users.
   *
   * @returns Input filter context
   * @throws Error if pipeline not configured
   */
  getInputContext(): FilterContext {
    if (!this.inputContext) {
      throw new Error('Pipeline not configured. Call buildPipeline first.');
    }
    return this.inputContext;
  }

  /**
   * Get output context for advanced control
   *
   * Allows direct access to buffer sink for advanced users.
   *
   * @returns Output filter context
   * @throws Error if pipeline not configured
   */
  getOutputContext(): FilterContext {
    if (!this.outputContext) {
      throw new Error('Pipeline not configured. Call buildPipeline first.');
    }
    return this.outputContext;
  }

  /**
   * Free filter graph resources
   */
  free(): void {
    this.native.free();
    this.inputContext = undefined;
    this.outputContext = undefined;
  }

  /**
   * Dispose of filter graph (for using statement)
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native filter graph for internal use
   * @internal
   */
  getNative(): NativeFilterGraph {
    return this.native;
  }

  /**
   * Validate pipeline configuration
   * @internal
   */
  private validateConfig(config: FilterPipelineConfig): void {
    if (!config.input) {
      throw new Error('Input configuration required');
    }

    if (!config.filters) {
      throw new Error('Filter string required');
    }

    const input = config.input;
    const isVideo = input.width !== undefined && input.height !== undefined;
    const isAudio = input.sampleRate !== undefined;

    if (!isVideo && !isAudio) {
      throw new Error('Either video (width/height) or audio (sampleRate) parameters required');
    }

    if (isVideo) {
      if (input.pixelFormat === undefined) {
        throw new Error('Pixel format required for video');
      }
    }

    if (isAudio) {
      if (input.sampleFormat === undefined) {
        throw new Error('Sample format required for audio');
      }
    }
  }
}
