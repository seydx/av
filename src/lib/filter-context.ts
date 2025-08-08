import { Filter } from './filter.js';

import type { Dictionary } from './dictionary.js';
import type { Frame } from './frame.js';

/**
 * AVFilterContext wrapper - represents an instance of a filter in a graph
 */
export class FilterContext {
  private context: any;

  constructor(context: any) {
    this.context = context;
  }

  /**
   * Initialize the filter with arguments
   *
   * WARNING: Only call this if the FilterContext was created with allocFilter()!
   * Do NOT call this if the FilterContext was created with createFilter() -
   * it's already initialized in that case and calling init() again will cause an error.
   *
   * @param args Optional initialization arguments
   * @param options Optional dictionary with additional options
   */
  init(args?: string, options?: Dictionary): void {
    this.context.init(args, options?.nativeDict);
  }

  /**
   * Link this filter to another
   */
  link(dst: FilterContext, srcPad: number, dstPad: number): void {
    this.context.link(dst.context, srcPad, dstPad);
  }

  /**
   * Unlink filter
   */
  unlink(pad: number): void {
    this.context.unlink(pad);
  }

  /**
   * Add frame to buffer source filter
   */
  bufferSrcAddFrame(frame: Frame | null, flags = 0): number {
    return this.context.bufferSrcAddFrame(frame?.nativeFrame, flags);
  }

  /**
   * Get frame from buffer sink filter
   */
  bufferSinkGetFrame(frame: Frame): number {
    return this.context.bufferSinkGetFrame(frame.nativeFrame);
  }

  /**
   * Get filter name
   */
  get name(): string | null {
    return this.context.name;
  }

  /**
   * Get the filter this context is an instance of
   */
  get filter(): Filter | null {
    const f = this.context.filter;
    return f ? new Filter(f) : null;
  }

  /**
   * Get number of inputs
   */
  get nbInputs(): number {
    return this.context.nbInputs;
  }

  /**
   * Get number of outputs
   */
  get nbOutputs(): number {
    return this.context.nbOutputs;
  }

  /**
   * Get native context object
   */
  get native(): any {
    return this.context;
  }
}
