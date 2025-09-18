import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';
import { OptionMember } from './option.js';

import type { AVFilterCmdFlag, AVFilterConstants } from '../constants/constants.js';
import type { FilterInOut } from './filter-inout.js';
import type { Filter } from './filter.js';
import type { NativeFilterGraph, NativeWrapper } from './native-types.js';

/**
 * Filter graph for audio/video processing pipelines.
 *
 * Manages a collection of interconnected filters forming a processing pipeline.
 * Filters are connected through their input/output pads to create complex
 * audio/video transformations. Supports both simple linear chains and complex
 * graphs with multiple inputs/outputs. Essential for effects, format conversions,
 * scaling, and other media processing operations.
 *
 * Direct mapping to FFmpeg's AVFilterGraph.
 *
 * @example
 * ```typescript
 * import { FilterGraph, Filter, FilterInOut, FFmpegError } from 'node-av';
 *
 * // Create and configure filter graph
 * const graph = new FilterGraph();
 * graph.alloc();
 *
 * // Create filters
 * const bufferSrc = graph.createFilter(
 *   Filter.getByName('buffer')!,
 *   'src',
 *   'video_size=1920x1080:pix_fmt=yuv420p'
 * );
 *
 * const scale = graph.createFilter(
 *   Filter.getByName('scale')!,
 *   'scale',
 *   '640:480'
 * );
 *
 * const bufferSink = graph.createFilter(
 *   Filter.getByName('buffersink')!,
 *   'sink'
 * );
 *
 * // Link filters
 * bufferSrc.link(0, scale, 0);
 * scale.link(0, bufferSink, 0);
 *
 * // Configure graph
 * const ret = await graph.config();
 * FFmpegError.throwIfError(ret, 'config');
 *
 * // Parse filter string
 * const ret2 = graph.parse2('[in]scale=640:480[out]');
 * FFmpegError.throwIfError(ret2, 'parse2');
 * ```
 *
 * @see [AVFilterGraph](https://ffmpeg.org/doxygen/trunk/structAVFilterGraph.html) - FFmpeg Doxygen
 * @see {@link FilterContext} For filter instances
 * @see {@link Filter} For filter descriptors
 */
export class FilterGraph extends OptionMember<NativeFilterGraph> implements Disposable, NativeWrapper<NativeFilterGraph> {
  constructor() {
    super(new bindings.FilterGraph());
  }

  /**
   * Number of filters in the graph.
   *
   * Total count of filter contexts in this graph.
   *
   * Direct mapping to AVFilterGraph->nb_filters.
   */
  get nbFilters(): number {
    return this.native.nbFilters;
  }

  /**
   * Array of filters in the graph.
   *
   * All filter contexts currently in the graph.
   *
   * Direct mapping to AVFilterGraph->filters.
   */
  get filters(): FilterContext[] | null {
    const natives = this.native.filters;
    if (!natives) return null;
    return natives.map((native) => new FilterContext(native));
  }

  /**
   * Threading type for graph execution.
   *
   * Controls how filters are executed in parallel.
   * Use AVFILTER_THREAD_SLICE for slice-based threading.
   *
   * Direct mapping to AVFilterGraph->thread_type.
   */
  get threadType(): AVFilterConstants {
    return this.native.threadType;
  }

  set threadType(value: AVFilterConstants) {
    this.native.threadType = value;
  }

  /**
   * Number of threads for parallel processing.
   *
   * Number of threads used for filter execution.
   * 0 means automatic detection.
   *
   * Direct mapping to AVFilterGraph->nb_threads.
   */
  get nbThreads(): number {
    return this.native.nbThreads;
  }

  set nbThreads(value: number) {
    this.native.nbThreads = value;
  }

  /**
   * Swscale options for scale filter.
   *
   * Options string passed to swscale for scaling operations.
   *
   * Direct mapping to AVFilterGraph->scale_sws_opts.
   */
  get scaleSwsOpts(): string | null {
    return this.native.scaleSwsOpts;
  }

  set scaleSwsOpts(value: string | null) {
    this.native.scaleSwsOpts = value;
  }

  /**
   * Allocate a filter graph.
   *
   * Allocates memory for the filter graph structure.
   * Must be called before using the graph.
   *
   * Direct mapping to avfilter_graph_alloc().
   *
   * @throws {Error} If allocation fails (ENOMEM)
   *
   * @example
   * ```typescript
   * const graph = new FilterGraph();
   * graph.alloc();
   * // Graph is now ready for filter creation
   * ```
   *
   * @see {@link free} To deallocate
   * @see {@link config} To configure after building
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the filter graph.
   *
   * Releases all resources associated with the graph,
   * including all contained filters.
   *
   * Direct mapping to avfilter_graph_free().
   *
   * @example
   * ```typescript
   * graph.free();
   * // Graph is now invalid
   * ```
   *
   * @see {@link alloc} To allocate
   * @see {@link Symbol.dispose} For automatic cleanup
   */
  free(): void {
    this.native.free();
  }

  /**
   * Create and initialize a filter in the graph.
   *
   * Creates a new filter context, adds it to the graph,
   * and initializes it with the provided arguments.
   *
   * Direct mapping to avfilter_graph_create_filter().
   *
   * @param filter - Filter descriptor to instantiate
   *
   * @param name - Name for this filter instance
   *
   * @param args - Initialization arguments (filter-specific)
   *
   * @returns Created filter context, or null on failure
   *
   * @example
   * ```typescript
   * // Create a scale filter
   * const scale = graph.createFilter(
   *   Filter.getByName('scale')!,
   *   'scaler',
   *   '640:480'  // width:height
   * );
   *
   * // Create a buffer source
   * const src = graph.createFilter(
   *   Filter.getByName('buffer')!,
   *   'source',
   *   'video_size=1920x1080:pix_fmt=yuv420p:time_base=1/25'
   * );
   * ```
   *
   * @see {@link allocFilter} To allocate without initializing
   * @see {@link getFilter} To retrieve by name
   */
  createFilter(filter: Filter, name: string, args: string | null = null): FilterContext | null {
    const native = this.native.createFilter(filter.getNative(), name, args ?? null);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Allocate a filter in the graph.
   *
   * Creates a new filter context and adds it to the graph,
   * but does not initialize it. Call init() on the context afterwards.
   *
   * Direct mapping to avfilter_graph_alloc_filter().
   *
   * @param filter - Filter descriptor to instantiate
   *
   * @param name - Name for this filter instance
   *
   * @returns Allocated filter context, or null on failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const filter = graph.allocFilter(
   *   Filter.getByName('scale')!,
   *   'scaler'
   * );
   * if (filter) {
   *   // Initialize separately
   *   const ret = filter.initStr('640:480');
   *   FFmpegError.throwIfError(ret, 'initStr');
   * }
   * ```
   *
   * @see {@link createFilter} To allocate and initialize
   */
  allocFilter(filter: Filter, name: string): FilterContext | null {
    const native = this.native.allocFilter(filter.getNative(), name);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Get a filter by name from the graph.
   *
   * Retrieves an existing filter context by its instance name.
   *
   * Direct mapping to avfilter_graph_get_filter().
   *
   * @param name - Name of the filter instance
   *
   * @returns Filter context if found, null otherwise
   *
   * @example
   * ```typescript
   * // Find a previously created filter
   * const scaler = graph.getFilter('scaler');
   * if (scaler) {
   *   console.log('Found scaler filter');
   * }
   * ```
   *
   * @see {@link createFilter} To create new filters
   */
  getFilter(name: string): FilterContext | null {
    const native = this.native.getFilter(name);
    return native ? new FilterContext(native) : null;
  }

  /**
   * Configure the filter graph.
   *
   * Validates and finalizes the graph configuration.
   * Must be called after all filters are created and linked.
   *
   * Direct mapping to avfilter_graph_config().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid graph configuration
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Build graph...
   * // Link filters...
   *
   * // Configure the complete graph
   * const ret = await graph.config();
   * FFmpegError.throwIfError(ret, 'config');
   * // Graph is now ready for processing
   * ```
   *
   * @see {@link validate} To check configuration
   */
  async config(): Promise<number> {
    return await this.native.config();
  }

  /**
   * Configure the filter graph synchronously.
   * Synchronous version of config.
   *
   * Validates and finalizes the graph structure after all filters
   * have been added and connected. Must be called before processing.
   *
   * Direct mapping to avfilter_graph_config().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid graph structure
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Configure graph after building
   * const ret = graph.configSync();
   * FFmpegError.throwIfError(ret, 'configSync');
   * // Graph is now ready for processing
   * ```
   *
   * @see {@link config} For async version
   */
  configSync(): number {
    return this.native.configSync();
  }

  /**
   * Parse a filter graph description.
   *
   * Parses a textual representation of a filter graph and adds
   * filters to this graph. Handles labeled inputs and outputs.
   *
   * Direct mapping to avfilter_graph_parse().
   *
   * @param filters - Filter graph description string
   *
   * @param inputs - Linked list of graph inputs
   *
   * @param outputs - Linked list of graph outputs
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Parse error
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError, FilterInOut } from 'node-av';
   *
   * const inputs = FilterInOut.createList([
   *   { name: 'in', filterCtx: bufferSrc, padIdx: 0 }
   * ]);
   * const outputs = FilterInOut.createList([
   *   { name: 'out', filterCtx: bufferSink, padIdx: 0 }
   * ]);
   *
   * const ret = graph.parse(
   *   '[in]scale=640:480,format=yuv420p[out]',
   *   inputs,
   *   outputs
   * );
   * FFmpegError.throwIfError(ret, 'parse');
   * ```
   *
   * @see {@link parse2} For simpler syntax
   * @see {@link parsePtr} For alternative parsing
   */
  parse(filters: string, inputs: FilterInOut | null, outputs: FilterInOut | null): number {
    return this.native.parse(filters, inputs ? inputs.getNative() : null, outputs ? outputs.getNative() : null);
  }

  /**
   * Parse a filter graph description (simplified).
   *
   * Parses a textual filter description with automatic input/output handling.
   * Simpler than parse() but less flexible.
   *
   * Direct mapping to avfilter_graph_parse2().
   *
   * @param filters - Filter graph description string
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Parse error
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Parse a simple filter chain
   * const ret = graph.parse2(
   *   'scale=640:480,format=yuv420p'
   * );
   * FFmpegError.throwIfError(ret, 'parse2');
   * ```
   *
   * @see {@link parse} For labeled inputs/outputs
   */
  parse2(filters: string): number {
    return this.native.parse2(filters);
  }

  /**
   * Parse a filter graph description with pointer.
   *
   * Alternative parsing method with different parameter handling.
   *
   * Direct mapping to avfilter_graph_parse_ptr().
   *
   * @param filters - Filter graph description string
   *
   * @param inputs - Optional linked list of inputs
   *
   * @param outputs - Optional linked list of outputs
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Parse error
   *   - AVERROR_ENOMEM: Memory allocation failure
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = graph.parsePtr(
   *   '[in]scale=w=640:h=480[out]'
   * );
   * FFmpegError.throwIfError(ret, 'parsePtr');
   * ```
   *
   * @see {@link parse} For standard parsing
   * @see {@link parse2} For simplified parsing
   */
  parsePtr(filters: string, inputs?: FilterInOut | null, outputs?: FilterInOut | null): number {
    return this.native.parsePtr(filters, inputs ? inputs.getNative() : null, outputs ? outputs.getNative() : null);
  }

  /**
   * Validate the filter graph configuration.
   *
   * Checks if the graph is valid and properly configured.
   * Does not finalize the graph like config() does.
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EINVAL: Invalid configuration
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * const ret = graph.validate();
   * FFmpegError.throwIfError(ret, 'validate');
   * ```
   *
   * @see {@link config} To configure and finalize
   */
  validate(): number {
    return this.native.validate();
  }

  /**
   * Request a frame from the oldest sink.
   *
   * Requests that a frame be output from the oldest sink in the graph.
   * Used to drive the filter graph processing.
   *
   * Direct mapping to avfilter_graph_request_oldest().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EOF: End of stream reached
   *   - AVERROR_EAGAIN: Need more input
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EOF, AVERROR_EAGAIN } from 'node-av/constants';
   *
   * const ret = await graph.requestOldest();
   * if (ret === AVERROR_EOF) {
   *   // No more frames
   * } else if (ret === AVERROR_EAGAIN) {
   *   // Need to provide more input
   * } else {
   *   FFmpegError.throwIfError(ret, 'requestOldest');
   * }
   * ```
   */
  async requestOldest(): Promise<number> {
    return await this.native.requestOldest();
  }

  /**
   * Request the oldest queued frame from filters synchronously.
   * Synchronous version of requestOldest.
   *
   * Requests a frame from the oldest sink in the graph.
   * Used for pulling frames through the filter pipeline.
   *
   * Direct mapping to avfilter_graph_request_oldest().
   *
   * @returns 0 on success, negative AVERROR on error:
   *   - AVERROR_EOF: No more frames
   *   - AVERROR_EAGAIN: Need more input
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   * import { AVERROR_EOF, AVERROR_EAGAIN } from 'node-av/constants';
   *
   * // Pull frames through the graph
   * const ret = graph.requestOldestSync();
   * if (ret === AVERROR_EOF) {
   *   // All frames processed
   * } else if (ret === AVERROR_EAGAIN) {
   *   // Need more input frames
   * } else {
   *   FFmpegError.throwIfError(ret, 'requestOldestSync');
   * }
   * ```
   *
   * @see {@link requestOldest} For async version
   */
  requestOldestSync(): number {
    return this.native.requestOldestSync();
  }

  /**
   * Dump the filter graph to a string.
   *
   * Returns a textual representation of the graph structure.
   * Useful for debugging and visualization.
   *
   * Direct mapping to avfilter_graph_dump().
   *
   * @returns Graph description string, or null on failure
   *
   * @example
   * ```typescript
   * const graphStr = graph.dump();
   * if (graphStr) {
   *   console.log('Graph structure:');
   *   console.log(graphStr);
   * }
   * ```
   */
  dump(): string | null {
    return this.native.dump();
  }

  /**
   * Send a command to filters in the graph.
   *
   * Sends a command to one or more filters for immediate execution.
   * Target can be a specific filter name or "all" for all filters.
   *
   * Direct mapping to avfilter_graph_send_command().
   *
   * @param target - Filter name or "all"
   *
   * @param cmd - Command to send
   *
   * @param arg - Command argument
   *
   * @param flags - Command flags
   *
   * @returns Error code or response object
   *
   * @example
   * ```typescript
   * // Send command to specific filter
   * const result = graph.sendCommand(
   *   'volume',
   *   'volume',
   *   '0.5'
   * );
   *
   * // Send to all filters
   * const result2 = graph.sendCommand(
   *   'all',
   *   'enable',
   *   'timeline'
   * );
   * ```
   *
   * @see {@link queueCommand} For delayed execution
   */
  sendCommand(target: string, cmd: string, arg: string, flags?: AVFilterCmdFlag): number | { response: string | null } {
    return this.native.sendCommand(target, cmd, arg, flags);
  }

  /**
   * Queue a command for delayed execution.
   *
   * Schedules a command to be executed at a specific timestamp.
   * The command is executed when the filter processes a frame with that timestamp.
   *
   * Direct mapping to avfilter_graph_queue_command().
   *
   * @param target - Filter name or "all"
   *
   * @param cmd - Command to queue
   *
   * @param arg - Command argument
   *
   * @param ts - Timestamp for execution
   *
   * @param flags - Command flags
   *
   * @returns 0 on success, negative AVERROR on error
   *
   * @example
   * ```typescript
   * import { FFmpegError } from 'node-av';
   *
   * // Queue volume change at 5 seconds
   * const ret = graph.queueCommand(
   *   'volume',
   *   'volume',
   *   '0.2',
   *   5000000,  // microseconds
   *   0
   * );
   * FFmpegError.throwIfError(ret, 'queueCommand');
   * ```
   *
   * @see {@link sendCommand} For immediate execution
   */
  queueCommand(target: string, cmd: string, arg: string, ts: number, flags?: AVFilterCmdFlag): number {
    return this.native.queueCommand(target, cmd, arg, ts, flags);
  }

  /**
   * Get the underlying native FilterGraph object.
   *
   * @returns The native FilterGraph binding object
   *
   * @internal
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
   *   // Build and use graph...
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
