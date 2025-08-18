import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { AVFilterThreadType } from './constants.js';
import type { FilterInOut } from './filter-inout.js';
import type { Filter } from './filter.js';
import type { NativeFilterGraph, NativeWrapper } from './native-types.js';

/**
 * Filter graph for media processing.
 *
 * Container for filters and their connections in a processing pipeline.
 * Manages the entire filtering system from sources to sinks.
 * Supports complex filter chains with multiple inputs and outputs.
 *
 * Direct mapping to FFmpeg's AVFilterGraph.
 *
 * @example
 * ```typescript
 * import { FilterGraph, Filter, FilterContext, FFmpegError } from '@seydx/ffmpeg';
 *
 * // Create and configure a simple filter graph
 * const graph = new FilterGraph();
 * graph.alloc();
 *
 * // Create buffer source
 * const bufferFilter = Filter.getByName('buffer');
 * if (!bufferFilter) throw new Error('Buffer filter not found');
 * const bufferSrc = graph.createFilter(
 *   bufferFilter,
 *   'in',
 *   'video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25'
 * );
 * if (!bufferSrc) throw new Error('Failed to create buffer source');
 *
 * // Create scale filter
 * const scaleFilter = Filter.getByName('scale');
 * if (!scaleFilter) throw new Error('Scale filter not found');
 * const scale = graph.createFilter(
 *   scaleFilter,
 *   'scale',
 *   '1280:720'
 * );
 * if (!scale) throw new Error('Failed to create scale filter');
 *
 * // Create buffer sink
 * const sinkFilter = Filter.getByName('buffersink');
 * if (!sinkFilter) throw new Error('Buffersink filter not found');
 * const bufferSink = graph.createFilter(
 *   sinkFilter,
 *   'out'
 * );
 * if (!bufferSink) throw new Error('Failed to create buffer sink');
 *
 * // Link filters
 * const linkRet1 = bufferSrc.link(0, scale, 0);
 * FFmpegError.throwIfError(linkRet1, 'link buffer to scale');
 *
 * const linkRet2 = scale.link(0, bufferSink, 0);
 * FFmpegError.throwIfError(linkRet2, 'link scale to sink');
 *
 * // Configure the graph
 * const configRet = graph.config();
 * FFmpegError.throwIfError(configRet, 'config');
 *
 * // Clean up
 * graph.free();
 * ```
 */
export class FilterGraph implements Disposable, NativeWrapper<NativeFilterGraph> {
  private native: NativeFilterGraph;

  /**
   * Create a new FilterGraph instance.
   *
   * The graph is uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVFilterGraph.
   *
   * @example
   * ```typescript
   * import { FilterGraph } from '@seydx/ffmpeg';
   *
   * const graph = new FilterGraph();
   * graph.alloc();
   * // Graph is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.FilterGraph();
  }

  /**
   * Number of filters in the graph.
   *
   * Direct mapping to AVFilterGraph->nb_filters
   *
   * The total count of filters currently in the graph.
   */
  get nbFilters(): number {
    return this.native.nbFilters;
  }

  /**
   * Array of all filters in the graph.
   *
   * Direct mapping to AVFilterGraph->filters
   *
   * All filter contexts currently in the graph.
   */
  get filters(): FilterContext[] | null {
    const natives = this.native.filters;
    if (!natives) return null;
    return natives.map((native) => new FilterContext(native));
  }

  /**
   * Thread type for graph processing.
   *
   * Direct mapping to AVFilterGraph->thread_type
   *
   * Controls threading behavior of the graph (0 = disabled, AV_FILTER_THREAD_SLICE = slice threading).
   */
  get threadType(): AVFilterThreadType {
    return this.native.threadType;
  }

  set threadType(value: AVFilterThreadType) {
    this.native.threadType = value;
  }

  /**
   * Number of threads for graph processing.
   *
   * Direct mapping to AVFilterGraph->nb_threads
   *
   * 0 means automatic detection based on CPU cores.
   */
  get nbThreads(): number {
    return this.native.nbThreads;
  }

  set nbThreads(value: number) {
    this.native.nbThreads = value;
  }

  /**
   * Software scaler options.
   *
   * Direct mapping to AVFilterGraph->scale_sws_opts
   *
   * Options string passed to the software scaler (e.g., "flags=bicubic").
   */
  get scaleSwsOpts(): string | null {
    return this.native.scaleSwsOpts;
  }

  set scaleSwsOpts(value: string | null) {
    this.native.scaleSwsOpts = value;
  }

  /**
   * Allocate the filter graph.
   *
   * Allocates the graph structure and initializes it.
   * Must be called before adding filters to the graph.
   *
   * Direct mapping to avfilter_graph_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { FilterGraph } from '@seydx/ffmpeg';
   *
   * const graph = new FilterGraph();
   * graph.alloc();
   * // Graph is now allocated and ready
   * ```
   *
   * @see {@link free} To free the graph
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the filter graph.
   *
   * Releases all resources associated with the graph.
   * All filters in the graph are also freed.
   *
   * Direct mapping to avfilter_graph_free()
   *
   * @example
   * ```typescript
   * graph.free();
   * // graph is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Create a filter instance in the graph.
   *
   * Direct mapping to avfilter_graph_create_filter()
   *
   * @param filter - The filter definition
   * @param name - Name for this filter instance (must be unique in the graph)
   * @param args - Optional initialization arguments (filter-specific format)
   *
   * @returns The created filter context or null on failure
   *
   * @example
   * ```typescript
   * // Create a scale filter
   * const scaleFilter = Filter.getByName('scale');
   * const scaleCtx = graph.createFilter(
   *   scaleFilter!,
   *   'my_scale',
   *   '1280:720'  // width:height
   * );
   *
   * // Create a buffer source for video
   * const bufferFilter = Filter.getByName('buffer');
   * const bufferCtx = graph.createFilter(
   *   bufferFilter!,
   *   'video_in',
   *   'video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25:pixel_aspect=1/1'
   * );
   * ```
   */
  createFilter(filter: Filter, name: string, args: string | null = null): FilterContext | null {
    const native = this.native.createFilter(filter.getNative(), name, args ?? null);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Allocate a filter instance in the graph without initializing it.
   *
   * Direct mapping to avfilter_graph_alloc_filter()
   *
   * This method allocates the filter but does not initialize it.
   * You must call filter.init() or filter.initStr() afterwards.
   *
   * @param filter - The filter definition
   * @param name - Name for this filter instance (must be unique in the graph)
   *
   * @returns The allocated filter context or null on failure
   *
   * @example
   * ```typescript
   * import { FilterGraph, Filter, FFmpegError } from '@seydx/ffmpeg';
   *
   * // Allocate a filter without initializing
   * const scaleFilter = Filter.getByName('scale');
   * if (!scaleFilter) throw new Error('Scale filter not found');
   * const scaleCtx = graph.allocFilter(scaleFilter, 'my_scale');
   * if (!scaleCtx) throw new Error('Failed to allocate filter');
   *
   * // Set options using setOpt
   * const ret1 = scaleCtx.setOpt('width', '1280');
   * FFmpegError.throwIfError(ret1, 'setOpt width');
   * const ret2 = scaleCtx.setOpt('height', '720');
   * FFmpegError.throwIfError(ret2, 'setOpt height');
   *
   * // Initialize the filter
   * const initRet = scaleCtx.init();
   * FFmpegError.throwIfError(initRet, 'init');
   * ```
   *
   * @note This provides an alternative workflow to createFilter,
   * allowing options to be set before initialization.
   */
  allocFilter(filter: Filter, name: string): FilterContext | null {
    const native = this.native.allocFilter(filter.getNative(), name);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Get a filter by name from the graph.
   *
   * Direct mapping to avfilter_graph_get_filter()
   *
   * @param name - The filter instance name
   *
   * @returns The filter context or null if not found
   *
   * @example
   * ```typescript
   * const scaleCtx = graph.getFilter('my_scale');
   * if (scaleCtx) {
   *   console.log('Found scale filter');
   * }
   * ```
   */
  getFilter(name: string): FilterContext | null {
    const native = this.native.getFilter(name);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Configure the filter graph.
   *
   * Direct mapping to avfilter_graph_config()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid graph configuration
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other configuration errors
   *
   * @example
   * ```typescript
   * import { FilterGraph, FFmpegError } from '@seydx/ffmpeg';
   *
   * // After creating and linking all filters
   * const ret = graph.config();
   * FFmpegError.throwIfError(ret, 'config');
   * // Graph is now ready for processing
   * ```
   *
   * @note Must be called after all filters are added and connected.
   */
  async config(): Promise<number> {
    return this.native.config();
  }

  /**
   * Parse a filtergraph description.
   *
   * Direct mapping to avfilter_graph_parse()
   *
   * @param filters - Filtergraph description string
   * @param inputs - Input pad list
   * @param outputs - Output pad list
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid filtergraph syntax
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other parsing errors
   *
   * @example
   * ```typescript
   * import { FilterGraph, FilterInOut, FFmpegError } from '@seydx/ffmpeg';
   *
   * const inputs = new FilterInOut();
   * inputs.alloc();
   * inputs.name = 'in';
   * inputs.filterCtx = bufferSrcCtx;
   * inputs.padIdx = 0;
   *
   * const outputs = new FilterInOut();
   * outputs.alloc();
   * outputs.name = 'out';
   * outputs.filterCtx = bufferSinkCtx;
   * outputs.padIdx = 0;
   *
   * const ret = graph.parse('[in] scale=1280:720 [out]', inputs, outputs);
   * FFmpegError.throwIfError(ret, 'parse');
   * ```
   */
  parse(filters: string, inputs: FilterInOut | null, outputs: FilterInOut | null): number {
    return this.native.parse(filters, inputs ? inputs.getNative() : null, outputs ? outputs.getNative() : null);
  }

  /**
   * Parse a filtergraph description (simplified).
   *
   * Direct mapping to avfilter_graph_parse2()
   *
   * @param filters - Filtergraph description string
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid filtergraph syntax
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other parsing errors
   *
   * @example
   * ```typescript
   * import { FilterGraph, FFmpegError } from '@seydx/ffmpeg';
   *
   * // Parse a simple filter chain
   * const ret = graph.parse2('scale=1280:720,format=yuv420p');
   * FFmpegError.throwIfError(ret, 'parse2');
   * ```
   *
   * @note Automatically handles inputs and outputs.
   */
  parse2(filters: string): number {
    return this.native.parse2(filters);
  }

  /**
   * Parse a filtergraph description (pointer version).
   *
   * Direct mapping to avfilter_graph_parse_ptr()
   *
   * @param filters - Filtergraph description string
   * @param inputs - Optional input pad list (FilterInOut)
   * @param outputs - Optional output pad list (FilterInOut)
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR(EINVAL): Invalid filtergraph syntax
   *   - AVERROR(ENOMEM): Memory allocation failure
   *   - <0: Other parsing errors
   *
   * @example
   * ```typescript
   * import { FilterGraph, FFmpegError } from '@seydx/ffmpeg';
   *
   * // Parse a complex filter graph
   * const ret = graph.parsePtr(
   *   '[0:v] scale=1280:720 [scaled]; [scaled] split [out1][out2]'
   * );
   * FFmpegError.throwIfError(ret, 'parsePtr');
   * ```
   *
   * @example
   * ```typescript
   * import { FilterGraph, FilterInOut, FFmpegError } from '@seydx/ffmpeg';
   *
   * // Parse with explicit inputs/outputs
   * const inputs = new FilterInOut();
   * inputs.name = 'in';
   * inputs.filterCtx = buffersrcCtx;
   * inputs.padIdx = 0;
   *
   * const outputs = new FilterInOut();
   * outputs.name = 'out';
   * outputs.filterCtx = buffersinkCtx;
   * outputs.padIdx = 0;
   *
   * const ret = graph.parsePtr(filtersDescr, inputs, outputs);
   * FFmpegError.throwIfError(ret, 'parsePtr');
   * ```
   *
   * @note Similar to parse2 but with different internal handling.
   */
  parsePtr(filters: string, inputs?: FilterInOut | null, outputs?: FilterInOut | null): number {
    return this.native.parsePtr(filters, inputs ? inputs.getNative() : null, outputs ? outputs.getNative() : null);
  }

  /**
   * Validate the filter graph.
   *
   * Direct mapping to avfilter_graph_validate()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Valid graph structure
   *   - AVERROR(EINVAL): Invalid graph structure
   *   - <0: Other validation errors
   *
   * @example
   * ```typescript
   * // Validate before configuring
   * const ret = graph.validate();
   * if (ret < 0) {
   *   console.error('Graph validation failed');
   * }
   * ```
   *
   * @note Checks that the graph structure is valid without configuring it.
   */
  validate(): number {
    return this.native.validate();
  }

  /**
   * Request a frame from the oldest sink.
   *
   * Direct mapping to avfilter_graph_request_oldest()
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - 0: Success
   *   - AVERROR_EOF: No more frames available
   *   - AVERROR(EAGAIN): Need more input data
   *   - <0: Other processing errors
   *
   * @example
   * ```typescript
   * import { FilterGraph, FFmpegError } from '@seydx/ffmpeg';
   * import { AVERROR_EOF, AVERROR_EAGAIN } from '@seydx/ffmpeg/constants';
   *
   * // Pull frames from the graph
   * while (true) {
   *   const ret = await graph.requestOldest();
   *   if (FFmpegError.is(ret, AVERROR_EOF)) {
   *     break; // No more frames
   *   }
   *   if (ret < 0 && !FFmpegError.is(ret, AVERROR_EAGAIN)) {
   *     FFmpegError.throwIfError(ret, 'requestOldest');
   *   }
   *   // Process output from sinks
   * }
   * ```
   *
   * @note Triggers processing in the graph to produce output.
   */
  async requestOldest(): Promise<number> {
    return this.native.requestOldest();
  }

  /**
   * Get the graph structure as a string.
   *
   * Returns a string representation of the filter graph in DOT format.
   * Uses avfilter_graph_dump() internally.
   *
   * @returns String representation of the filter graph or null if not allocated
   *
   * @example
   * ```typescript
   * const graphDescription = graph.dump();
   * console.log('Filter graph:', graphDescription);
   * ```
   */
  dump(): string | null {
    return this.native.dump();
  }

  /**
   * Get the native FFmpeg AVFilterGraph pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native filter graph object
   */
  getNative(): NativeFilterGraph {
    return this.native;
  }

  /**
   * Dispose of the filter graph.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using graph = new FilterGraph();
   *   graph.alloc();
   *   // ... use graph
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
