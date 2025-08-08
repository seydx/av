import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { Filter } from './filter.js';

/**
 * AVFilterGraph wrapper - manages a graph of filters
 */
export class FilterGraph implements Disposable {
  private graph: any;

  constructor() {
    this.graph = new bindings.FilterGraph();
  }

  /**
   * Configure the filter graph
   */
  config(): void {
    this.graph.config();
  }

  /**
   * Create and initialize a filter in this graph
   *
   * This method creates AND initializes the filter in one step.
   * Do NOT call init() on the returned FilterContext - it's already initialized!
   *
   * @param filter The filter type to create
   * @param name Unique name for this filter instance
   * @param args Optional initialization arguments (e.g., "320:240" for scale filter)
   * @returns Initialized FilterContext ready to use
   */
  createFilter(filter: Filter, name: string, args?: string): FilterContext {
    const ctx = this.graph.createFilter(filter.native, name, args);
    return new FilterContext(ctx);
  }

  /**
   * Parse a filter graph description
   *
   * @param filters Filter graph description string
   * @param inputs Optional input filter context to connect
   * @param outputs Optional output filter context to connect
   */
  parse(filters: string, inputs?: FilterContext, outputs?: FilterContext): void {
    this.graph.parse(filters, inputs?.native, outputs?.native);
  }

  /**
   * Parse a filter graph description with complex routing
   */
  parsePtr(filters: string, inputs?: FilterContext, outputs?: FilterContext): void {
    this.graph.parsePtr(filters, inputs?.native, outputs?.native);
  }

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
   * Get/set thread type
   */
  get threadType(): number {
    return this.graph.threadType;
  }

  set threadType(value: number) {
    this.graph.threadType = value;
  }

  /**
   * Get/set number of threads
   */
  get nbThreads(): number {
    return this.graph.nbThreads;
  }

  set nbThreads(value: number) {
    this.graph.nbThreads = value;
  }

  /**
   * Dump the graph structure as a string
   */
  dump(): string {
    return this.graph.dump();
  }

  /**
   * Dispose of the filter graph
   */
  [Symbol.dispose](): void {
    this.graph[Symbol.dispose]();
  }
}
