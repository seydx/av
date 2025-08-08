import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { Filter } from './filter.js';
import type { NativeFilterGraph, NativeWrapper } from './native-types.js';

/**
 * Filter graph for complex audio/video processing pipelines
 *
 * FilterGraph manages a collection of connected filters that process
 * audio or video data. Filters are connected in a directed graph where
 * data flows from sources through processing filters to sinks.
 *
 * @example
 * ```typescript
 * // Create a simple scaling filter graph
 * const graph = new FilterGraph();
 *
 * // Create filters
 * const bufferSrc = graph.createFilter(
 *   Filter.findByName('buffer'),
 *   'src',
 *   'video_size=1920x1080:pix_fmt=0:time_base=1/25:pixel_aspect=1/1'
 * );
 *
 * const scale = graph.createFilter(
 *   Filter.findByName('scale'),
 *   'scale',
 *   '640:480'
 * );
 *
 * const bufferSink = graph.createFilter(
 *   Filter.findByName('buffersink'),
 *   'sink'
 * );
 *
 * // Link filters
 * bufferSrc.link(scale, 0, 0);
 * scale.link(bufferSink, 0, 0);
 *
 * // Configure the graph
 * graph.config();
 * ```
 */
export class FilterGraph implements Disposable, NativeWrapper<NativeFilterGraph> {
  private graph: any; // Native filter graph binding

  // ==================== Constructor ====================

  /**
   * Create a new filter graph
   */
  constructor() {
    this.graph = new bindings.FilterGraph();
  }

  // ==================== Getters/Setters ====================

  /**
   * Get number of filters in the graph
   */
  get nbFilters(): number {
    return this.graph.nbFilters;
  }

  /**
   * Get all filters in the graph
   */
  get filters(): FilterContext[] {
    return this.graph.filters.map((f: any) => new FilterContext(f));
  }

  /**
   * Get/set thread type for parallel processing
   */
  get threadType(): number {
    return this.graph.threadType;
  }

  set threadType(value: number) {
    this.graph.threadType = value;
  }

  /**
   * Get/set number of threads for parallel processing
   */
  get nbThreads(): number {
    return this.graph.nbThreads;
  }

  set nbThreads(value: number) {
    this.graph.nbThreads = value;
  }

  // ==================== Public Methods ====================

  /**
   * Configure the filter graph
   * Must be called after all filters are created and linked
   * @throws Error if the graph configuration is invalid
   * @example
   * ```typescript
   * // After creating and linking filters
   * graph.config();
   * ```
   */
  config(): void {
    this.graph.config();
  }

  /**
   * Create and initialize a filter in this graph
   *
   * This method creates and initializes the filter in one step.
   *
   * @param filter The filter type to create
   * @param name Unique name for this filter instance
   * @param args Optional initialization arguments (e.g., "320:240" for scale filter)
   * @returns Initialized FilterContext ready to use
   * @example
   * ```typescript
   * const scale = graph.createFilter(
   *   Filter.findByName('scale'),
   *   'scaler',
   *   '640:480'
   * );
   * ```
   */
  createFilter(filter: Filter, name: string, args?: string): FilterContext {
    const ctx = this.graph.createFilter(filter.getNative(), name, args);
    return new FilterContext(ctx);
  }

  /**
   * Parse a filter graph description string
   *
   * @param filters Filter graph description string
   * @param inputs Optional input filter context to connect
   * @param outputs Optional output filter context to connect
   * @example
   * ```typescript
   * // Parse a simple filter chain
   * graph.parse('scale=640:480,format=yuv420p');
   *
   * // Parse with named inputs/outputs
   * graph.parse(
   *   '[in] scale=640:480 [scaled]; [scaled] format=yuv420p [out]',
   *   inputContext,
   *   outputContext
   * );
   * ```
   */
  parse(filters: string, inputs?: FilterContext, outputs?: FilterContext): void {
    this.graph.parse(filters, inputs?.getNative(), outputs?.getNative());
  }

  /**
   * Parse a filter graph description with complex routing
   * @param filters Filter graph description string
   * @param inputs Optional input filter context to connect
   * @param outputs Optional output filter context to connect
   */
  parsePtr(filters: string, inputs?: FilterContext, outputs?: FilterContext): void {
    this.graph.parsePtr(filters, inputs?.getNative(), outputs?.getNative());
  }

  /**
   * Dump the graph structure as a string
   * @returns String representation of the filter graph for debugging
   * @example
   * ```typescript
   * console.log(graph.dump());
   * // Outputs the graph structure for debugging
   * ```
   */
  dump(): string {
    return this.graph.dump();
  }

  /**
   * Dispose of the filter graph and free resources
   */
  [Symbol.dispose](): void {
    this.graph[Symbol.dispose]();
  }

  // ==================== Internal Methods ====================

  /**
   * Get native filter graph for internal use
   * @internal
   */
  getNative(): any {
    return this.graph;
  }
}
