import { AV_OPT_SEARCH_CHILDREN } from './constants.js';
import { Filter } from './filter.js';
import { HardwareDeviceContext } from './hardware-device-context.js';
import { Rational } from './rational.js';

import type { AVOptionSearchFlags } from './constants.js';
import type { Frame } from './frame.js';
import type { HardwareFramesContext } from './hardware-frames-context.js';
import type { NativeDictionary, NativeFilterContext, NativeFilterGraph, NativeWrapper } from './native-types.js';
import type { IRational } from './types.js';

/**
 * Filter context for media processing.
 *
 * Represents an instance of a filter in a filter graph.
 * Manages filter configuration, parameters, and connections.
 * Must be created through FilterGraph.createFilter() and properly initialized before use.
 *
 * Direct mapping to FFmpeg's AVFilterContext.
 *
 * @example
 * ```typescript
 * import { FilterGraph, Filter, FFmpegError } from '@seydx/av';
 *
 * // Create filter context through FilterGraph
 * const filterGraph = new FilterGraph();
 * filterGraph.alloc();
 *
 * const bufferFilter = Filter.getByName('buffer');
 * const bufferCtx = filterGraph.createFilter(bufferFilter, 'in');
 * const initRet = bufferCtx.initStr('video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25:pixel_aspect=1/1');
 * FFmpegError.throwIfError(initRet, 'initStr buffer');
 *
 * // Link filters
 * const scaleFilter = Filter.getByName('scale');
 * const scaleCtx = filterGraph.createFilter(scaleFilter, 'scale');
 * const scaleRet = scaleCtx.initStr('1280:720');
 * FFmpegError.throwIfError(scaleRet, 'initStr scale');
 *
 * const linkRet = bufferCtx.link(0, scaleCtx, 0);
 * FFmpegError.throwIfError(linkRet, 'link');
 *
 * // Configure and use the graph
 * const configRet = filterGraph.config();
 * FFmpegError.throwIfError(configRet, 'config');
 * ```
 */
export class FilterContext implements Disposable, NativeWrapper<NativeFilterContext> {
  private native: NativeFilterContext;
  private _hwDeviceCtx?: HardwareDeviceContext; // Cache for hardware device context wrapper

  /**
   * Constructor is internal - use FilterGraph.createFilter().
   *
   * FilterContexts are created and managed by FilterGraph.
   * Do not instantiate directly.
   *
   * @internal
   *
   * @param native - Native AVFilterContext to wrap
   */
  constructor(native: NativeFilterContext) {
    this.native = native;
  }

  /**
   * Filter instance name.
   *
   * The unique name of this filter instance in the graph.
   *
   * Direct mapping to AVFilterContext->name
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
   * The AVFilter that this context is an instance of.
   *
   * Direct mapping to AVFilterContext->filter
   *
   * @readonly
   */
  get filter(): Filter | null {
    const native = this.native.filter;
    return native ? new Filter(native) : null;
  }

  /**
   * The parent filter graph.
   *
   * The filter graph that contains this filter context.
   *
   * Direct mapping to AVFilterContext->graph
   *
   * @readonly
   */
  get graph(): NativeFilterGraph | null {
    return this.native.graph;
  }

  /**
   * Number of input pads.
   *
   * The number of input connections this filter can accept.
   *
   * Direct mapping to AVFilterContext->nb_inputs
   *
   * @readonly
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

  /**
   * Get or set the hardware device context.
   *
   * Direct mapping to AVFilterContext->hw_device_ctx
   *
   * Used for hardware-accelerated filters that need device context.
   * Must be set before filter initialization for hardware filters.
   */
  get hwDeviceCtx(): HardwareDeviceContext | null {
    const native = this.native.hwDeviceCtx;
    if (!native) {
      // Clear cache if native is null
      this._hwDeviceCtx = undefined;
      return null;
    }

    // Return cached wrapper if available and still valid
    if (this._hwDeviceCtx && (this._hwDeviceCtx as any).native === native) {
      return this._hwDeviceCtx;
    }

    // Create and cache new wrapper
    const device = Object.create(HardwareDeviceContext.prototype) as HardwareDeviceContext;
    (device as any).native = native;
    this._hwDeviceCtx = device;
    return device;
  }

  set hwDeviceCtx(value: HardwareDeviceContext | null) {
    this.native.hwDeviceCtx = value?.getNative() ?? null;
    // Clear cache when setting new value
    this._hwDeviceCtx = undefined;
  }

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
   * import { Dictionary, FilterContext, FFmpegError } from '@seydx/av';
   *
   * const options = new Dictionary();
   * const ret1 = options.set('width', '1280', 0);
   * FFmpegError.throwIfError(ret1, 'set width');
   * const ret2 = options.set('height', '720', 0);
   * FFmpegError.throwIfError(ret2, 'set height');
   *
   * const initRet = filterCtx.init(options.getNative());
   * FFmpegError.throwIfError(initRet, 'init');
   * options.free();
   * ```
   *
   * @see initStr() - Alternative initialization with string arguments
   */
  init(options: NativeDictionary | null = null): number {
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
   * import { FilterContext, FFmpegError } from '@seydx/av';
   *
   * // Initialize scale filter
   * const scaleRet = scaleCtx.initStr('1280:720');
   * FFmpegError.throwIfError(scaleRet, 'initStr scale');
   *
   * // Initialize buffer source
   * const bufferRet = bufferCtx.initStr('video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25');
   * FFmpegError.throwIfError(bufferRet, 'initStr buffer');
   * ```
   *
   * @see init() - Alternative initialization with dictionary
   */
  initStr(args: string | null = null): number {
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
   * import { FilterContext, FFmpegError } from '@seydx/av';
   *
   * // Link buffer source to scale filter
   * const linkRet1 = bufferCtx.link(0, scaleCtx, 0);
   * FFmpegError.throwIfError(linkRet1, 'link buffer to scale');
   *
   * // Link scale to sink
   * const linkRet2 = scaleCtx.link(0, sinkCtx, 0);
   * FFmpegError.throwIfError(linkRet2, 'link scale to sink');
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
   *   - AV_ERROR_EOF: The filter has been closed
   *
   * @example
   * ```typescript
   * import { Frame, FilterContext, FFmpegError } from '@seydx/av';
   *
   * // Feed a frame to the buffer source
   * const addRet = srcCtx.buffersrcAddFrame(frame);
   * FFmpegError.throwIfError(addRet, 'buffersrcAddFrame');
   *
   * // Signal end of stream
   * const eofRet = srcCtx.buffersrcAddFrame(null);
   * FFmpegError.throwIfError(eofRet, 'buffersrcAddFrame EOF');
   * ```
   */
  async buffersrcAddFrame(frame: Frame | null): Promise<number> {
    return this.native.buffersrcAddFrame(frame ? frame.getNative() : null);
  }

  /**
   * Set parameters for a buffer source filter.
   *
   * Direct mapping to av_buffersrc_parameters_set()
   *
   * This function configures a buffer source filter with specific parameters,
   * including hardware frames context for hardware-accelerated filtering.
   *
   * @param params - Parameters for the buffer source
   * @returns 0 on success, negative error code on failure
   *
   * @example
   * ```typescript
   * const ret = srcCtx.buffersrcParametersSet({
   *   width: 1920,
   *   height: 1080,
   *   format: AV_PIX_FMT_YUV420P,
   *   timeBase: { num: 1, den: 30 },
   *   hwFramesCtx: hardware.framesContext
   * });
   * FFmpegError.throwIfError(ret, 'buffersrcParametersSet');
   * ```
   */
  buffersrcParametersSet(params: {
    width?: number;
    height?: number;
    format?: number;
    timeBase?: IRational;
    frameRate?: IRational;
    sampleAspectRatio?: IRational;
    hwFramesCtx?: HardwareFramesContext | null;
    sampleRate?: number;
    channelLayout?: bigint;
  }): number {
    const nativeParams: any = { ...params };
    if (params.hwFramesCtx) {
      nativeParams.hwFramesCtx = params.hwFramesCtx.getNative();
    }
    return this.native.buffersrcParametersSet(nativeParams);
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
   *   - AV_ERROR_EOF: End of stream reached
   *   - AVERROR(EINVAL): Invalid parameters
   *
   * @example
   * ```typescript
   * import { Frame, FilterContext, FFmpegError } from '@seydx/av';
   * import { AVERROR_EAGAIN, AV_ERROR_EOF } from '@seydx/av/constants';
   *
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
   * if (!FFmpegError.is(ret, AVERROR_EAGAIN) && !FFmpegError.is(ret, AV_ERROR_EOF)) {
   *   FFmpegError.throwIfError(ret, 'buffersinkGetFrame');
   * }
   * ```
   */
  async buffersinkGetFrame(frame: Frame): Promise<number> {
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
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Option not found
   *   - AVERROR(ERANGE): Value out of range
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FilterContext, FFmpegError } from '@seydx/av';
   *
   * // Set pixel format for a buffersink
   * const ret = buffersinkCtx.setOpt('pixel_formats', 'gray8');
   * FFmpegError.throwIfError(ret, 'setOpt pixel_formats');
   * ```
   *
   * @example
   * ```typescript
   * import { FilterContext, FFmpegError } from '@seydx/av';
   *
   * // Set multiple options
   * const ret1 = buffersinkCtx.setOpt('sample_rates', '44100');
   * FFmpegError.throwIfError(ret1, 'setOpt sample_rates');
   *
   * const ret2 = buffersinkCtx.setOpt('sample_fmts', 's16');
   * FFmpegError.throwIfError(ret2, 'setOpt sample_fmts');
   *
   * const ret3 = buffersinkCtx.setOpt('channel_layouts', 'stereo');
   * FFmpegError.throwIfError(ret3, 'setOpt channel_layouts');
   * ```
   *
   * @example
   * ```typescript
   * import { FilterContext, FFmpegError } from '@seydx/av';
   * import { AV_OPT_SEARCH_CHILDREN, AV_OPT_SEARCH_FAKE_OBJ } from '@seydx/av/constants';
   *
   * const ret = buffersinkCtx.setOpt('key', 'value', AV_OPT_SEARCH_CHILDREN | AV_OPT_SEARCH_FAKE_OBJ);
   * FFmpegError.throwIfError(ret, 'setOpt');
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
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Option not found
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other errors
   *
   * @example
   * ```typescript
   * import { FilterContext, FFmpegError } from '@seydx/av';
   * import { AV_PIX_FMT_YUV420P, AV_PIX_FMT_YUV422P } from '@seydx/av/constants';
   *
   * // Set supported pixel formats
   * const ret = buffersinkCtx.optSetBin('pix_fmts', [AV_PIX_FMT_YUV420P, AV_PIX_FMT_YUV422P]);
   * FFmpegError.throwIfError(ret, 'optSetBin pix_fmts');
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
  // buffersinkSetFrameSize(frameSize: number): void {
  //   this.native.buffersinkSetFrameSize(frameSize);
  // }

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
