import { AV_OPT_SEARCH_CHILDREN } from './constants.js';
import { Filter } from './filter.js';
import { Rational } from './rational.js';

import type { AVOptionSearchFlags } from './constants.js';
import type { Frame } from './frame.js';
import type { NativeDictionary, NativeFilterContext, NativeFilterGraph, NativeWrapper } from './native-types.js';

/**
 * FFmpeg filter context - Low Level API
 *
 * Direct mapping to FFmpeg's AVFilterContext.
 * Represents an instance of a filter in a filter graph.
 * Must be created through FilterGraph.createFilter() and properly initialized before use.
 *
 * @example
 * ```typescript
 * // Create filter context through FilterGraph
 * const filterGraph = new FilterGraph();
 * filterGraph.alloc();
 *
 * const bufferFilter = Filter.getByName('buffer');
 * const bufferCtx = filterGraph.createFilter(bufferFilter, 'in');
 * bufferCtx.initStr('video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25:pixel_aspect=1/1');
 *
 * // Link filters
 * const scaleFilter = Filter.getByName('scale');
 * const scaleCtx = filterGraph.createFilter(scaleFilter, 'scale');
 * scaleCtx.initStr('1280:720');
 *
 * bufferCtx.link(0, scaleCtx, 0);
 *
 * // Configure and use the graph
 * filterGraph.config();
 * ```
 */
export class FilterContext implements Disposable, NativeWrapper<NativeFilterContext> {
  private native: NativeFilterContext;

  // Constructor
  /**
   * Constructor is internal - use FilterGraph.createFilter().
   * FilterContexts are created and managed by FilterGraph.
   * @internal
   */
  constructor(native: NativeFilterContext) {
    this.native = native;
  }

  // Getter/Setter Properties

  /**
   * Filter instance name.
   *
   * Direct mapping to AVFilterContext->name
   *
   * The unique name of this filter instance in the graph.
   */
  get name(): string | null {
    return this.native.name;
  }

  set name(value: string | null) {
    this.native.name = value;
  }

  /**
   * The filter definition.
   *
   * Direct mapping to AVFilterContext->filter
   *
   * The AVFilter that this context is an instance of.
   */
  get filter(): Filter | null {
    const native = this.native.filter;
    return native ? new Filter(native) : null;
  }

  /**
   * The parent filter graph.
   *
   * Direct mapping to AVFilterContext->graph
   *
   * The filter graph that contains this filter context.
   */
  get graph(): NativeFilterGraph | null {
    return this.native.graph;
  }

  /**
   * Number of input pads.
   *
   * Direct mapping to AVFilterContext->nb_inputs
   *
   * The number of input connections this filter can accept.
   */
  get nbInputs(): number {
    return this.native.nbInputs;
  }

  /**
   * Number of output pads.
   *
   * Direct mapping to AVFilterContext->nb_outputs
   *
   * The number of output connections this filter can provide.
   */
  get nbOutputs(): number {
    return this.native.nbOutputs;
  }

  /**
   * Filter readiness status.
   *
   * Direct mapping to AVFilterContext->ready
   *
   * Non-zero when the filter has been properly initialized.
   */
  get ready(): number {
    return this.native.ready;
  }

  // Public Methods - Low Level API

  /**
   * Initialize the filter with options.
   *
   * Direct mapping to avfilter_init_dict()
   *
   * @param options - Optional dictionary of filter options
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid options
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other filter-specific errors
   *
   * @example
   * ```typescript
   * const options = new Dictionary();
   * options.set('width', '1280', 0);
   * options.set('height', '720', 0);
   * const ret = filterCtx.init(options.getNative());
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * options.free();
   * ```
   *
   * @see initStr() - Alternative initialization with string arguments
   */
  init(options?: NativeDictionary | null): number {
    return this.native.init(options ?? null);
  }

  /**
   * Initialize the filter with a string argument.
   *
   * Direct mapping to avfilter_init_str()
   *
   * @param args - Filter arguments string (format is filter-specific)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid arguments
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other filter-specific errors
   *
   * @example
   * ```typescript
   * // Initialize scale filter
   * const ret = scaleCtx.initStr('1280:720');
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Initialize buffer source
   * const ret = bufferCtx.initStr('video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25');
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @see init() - Alternative initialization with dictionary
   */
  initStr(args?: string | null): number {
    return this.native.initStr(args ?? null);
  }

  /**
   * Link this filter's output to another filter's input.
   *
   * Direct mapping to avfilter_link()
   *
   * @param srcPad - Output pad index on this filter
   * @param dst - Destination filter context
   * @param dstPad - Input pad index on destination filter
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid pad indices or incompatible formats
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other linking errors
   *
   * @example
   * ```typescript
   * // Link buffer source to scale filter
   * const ret = bufferCtx.link(0, scaleCtx, 0);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Link scale to sink
   * const ret2 = scaleCtx.link(0, sinkCtx, 0);
   * if (ret2 < 0) {
   *   throw new FFmpegError(ret2);
   * }
   * ```
   */
  link(srcPad: number, dst: FilterContext, dstPad: number): number {
    return this.native.link(srcPad, dst.native, dstPad);
  }

  /**
   * Unlink a filter pad.
   *
   * Removes the connection from the specified input pad.
   * Note: avfilter_link_free is deprecated, we set pointer to nullptr instead.
   *
   * @param pad - Input pad index to unlink
   *
   * @example
   * ```typescript
   * // Unlink the first input pad
   * filterCtx.unlink(0);
   * ```
   */
  unlink(pad: number): void {
    this.native.unlink(pad);
  }

  /**
   * Add a frame to a buffer source filter.
   *
   * Direct mapping to av_buffersrc_add_frame()
   *
   * This function is specific to buffer source filters and is used
   * to feed frames into the filter graph.
   *
   * @param frame - The frame to add (can be null to signal EOF)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EAGAIN): The buffer is full, try again later
   *   - AVERROR(EINVAL): Invalid parameters
   *   - AVERROR_EOF: The filter has been closed
   *
   * @example
   * ```typescript
   * // Feed a frame to the buffer source
   * const ret = srcCtx.buffersrcAddFrame(frame);
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   *
   * // Signal end of stream
   * srcCtx.buffersrcAddFrame(null);
   * ```
   */
  buffersrcAddFrame(frame: Frame | null): number {
    return this.native.buffersrcAddFrame(frame ? frame.getNative() : null);
  }

  /**
   * Get a frame from a buffer sink filter.
   *
   * Direct mapping to av_buffersink_get_frame()
   *
   * This function is specific to buffer sink filters and is used
   * to retrieve filtered frames from the filter graph.
   *
   * @param frame - The frame to receive the filtered data
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success, frame contains valid data
   *   - AVERROR(EAGAIN): No frame available, need more input
   *   - AVERROR_EOF: End of stream reached
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * // Get filtered frames
   * const frame = new Frame();
   * frame.alloc();
   *
   * let ret = sinkCtx.buffersinkGetFrame(frame);
   * while (ret >= 0) {
   *   // Process the filtered frame
   *   processFrame(frame);
   *   frame.unref();
   *
   *   // Try to get another frame
   *   ret = sinkCtx.buffersinkGetFrame(frame);
   * }
   *
   * if (ret !== AVERROR(EAGAIN) && ret !== AVERROR_EOF) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   */
  buffersinkGetFrame(frame: Frame): number {
    return this.native.buffersinkGetFrame(frame.getNative());
  }

  /**
   * Set an option on the filter context.
   *
   * Direct mapping to av_opt_set()
   *
   * @param key - The option name
   * @param value - The option value (as string)
   * @param searchFlags - Optional search flags (default: AV_OPT_SEARCH_CHILDREN)
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * // Set pixel format for a buffersink
   * const ret = buffersinkCtx.setOpt('pixel_formats', 'gray8');
   * if (ret < 0) {
   *   throw new FFmpegError(ret);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Set multiple options
   * buffersinkCtx.setOpt('sample_rates', '44100');
   * buffersinkCtx.setOpt('sample_fmts', 's16');
   * buffersinkCtx.setOpt('channel_layouts', 'stereo');
   * ```
   *
   * @example
   * ```typescript
   * // Set options with specific search flags
   * import { AV_OPT_SEARCH_CHILDREN, AV_OPT_SEARCH_FAKE_OBJ } from '../constants.js';
   * buffersinkCtx.setOpt('key', 'value', AV_OPT_SEARCH_CHILDREN | AV_OPT_SEARCH_FAKE_OBJ);
   * ```
   */
  setOpt(key: string, value: string, searchFlags: AVOptionSearchFlags = AV_OPT_SEARCH_CHILDREN): number {
    return this.native.setOpt(key, value, searchFlags);
  }

  /**
   * Set a binary option on the filter context.
   *
   * Direct mapping to av_opt_set_bin()
   *
   * Used for setting array values like pixel formats, sample formats etc.
   *
   * @param key - Option name
   * @param values - Array of integer values or single value
   * @param searchFlags - Flags for searching the option
   * @returns 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * // Set supported pixel formats
   * const ret = buffersinkCtx.optSetBin('pix_fmts', [AV_PIX_FMT_YUV420P, AV_PIX_FMT_YUV422P]);
   * if (ret < 0) throw new FFmpegError(ret);
   * ```
   */
  optSetBin(key: string, values: number[] | number, searchFlags: AVOptionSearchFlags = AV_OPT_SEARCH_CHILDREN): number {
    return this.native.optSetBin(key, values, searchFlags);
  }

  /**
   * Set the frame size for a buffersink filter.
   *
   * Direct mapping to av_buffersink_set_frame_size()
   *
   * For audio encoders that require a specific frame size.
   *
   * @param frameSize - The frame size to set
   *
   * @example
   * ```typescript
   * if (encCtx.frameSize > 0) {
   *   buffersinkCtx.buffersinkSetFrameSize(encCtx.frameSize);
   * }
   * ```
   */
  buffersinkSetFrameSize(frameSize: number): void {
    this.native.buffersinkSetFrameSize(frameSize);
  }

  /**
   * Get the time base from a buffersink filter.
   *
   * Direct mapping to av_buffersink_get_time_base()
   *
   * Returns the time base of the buffersink filter.
   *
   * @returns The time base as a Rational
   *
   * @example
   * ```typescript
   * const timeBase = buffersinkCtx.buffersinkGetTimeBase();
   * console.log(`Time base: ${timeBase.num}/${timeBase.den}`);
   * ```
   */
  buffersinkGetTimeBase(): Rational {
    const tb = this.native.buffersinkGetTimeBase();
    return new Rational(tb.num, tb.den);
  }

  /**
   * Free the filter context.
   *
   * Direct mapping to avfilter_free()
   *
   * @example
   * ```typescript
   * filterCtx.free();
   * // filterCtx is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Check if this is a source filter context.
   *
   * Source filters have no inputs and generate data.
   *
   * @returns true if the filter has no input pads, false otherwise
   *
   * @example
   * ```typescript
   * if (filterCtx.isSource()) {
   *   console.log('This is a source filter');
   * }
   * ```
   */
  isSource(): boolean {
    return this.nbInputs === 0;
  }

  /**
   * Check if this is a sink filter context.
   *
   * Sink filters have no outputs and consume data.
   *
   * @returns true if the filter has no output pads, false otherwise
   *
   * @example
   * ```typescript
   * if (filterCtx.isSink()) {
   *   console.log('This is a sink filter');
   * }
   * ```
   */
  isSink(): boolean {
    return this.nbOutputs === 0;
  }

  /**
   * Check if the filter is ready for processing.
   *
   * Filters must be initialized before they can process data.
   *
   * @returns true if the filter has been properly initialized, false otherwise
   *
   * @example
   * ```typescript
   * filterCtx.initStr('1280:720');
   * if (filterCtx.isReady()) {
   *   console.log('Filter is ready for processing');
   * }
   * ```
   */
  isReady(): boolean {
    return this.ready !== 0;
  }

  // Internal Methods

  /**
   * Get the native FFmpeg AVFilterContext pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native filter context object
   */
  getNative(): NativeFilterContext {
    return this.native;
  }

  /**
   * Dispose of the filter context.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using filterCtx = filterGraph.createFilter(filter, 'my_filter');
   *   filterCtx.initStr('args');
   *   // ... use filter context
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
