import { Filter } from './filter.js';
import { Options } from './option.js';

import type { Frame } from './frame.js';
import type { NativeFilterContext, NativeWrapper } from './native-types.js';

/**
 * Filter context - an instance of a filter in a graph
 *
 * Represents an instantiated filter within a FilterGraph.
 * Each FilterContext is a specific instance of a Filter with its own configuration.
 *
 * @example
 * ```typescript
 * // Create a filter context in a graph
 * const graph = new FilterGraph();
 * const scaleFilter = Filter.findByName('scale');
 * const context = graph.createFilter(scaleFilter, 'scaler', '320:240');
 *
 * // Link filters together
 * sourceContext.link(context, 0, 0);
 * context.link(sinkContext, 0, 0);
 * ```
 */
export class FilterContext implements NativeWrapper<NativeFilterContext> {
  private context: any; // Native filter context binding
  private _options?: Options;

  // ==================== Constructor ====================

  /**
   * Create a FilterContext wrapper
   * @param context Native filter context object
   * @internal
   */
  constructor(context: any) {
    this.context = context;
  }

  // ==================== Getters/Setters ====================

  /**
   * Get filter instance name
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
   * Get number of input pads
   */
  get nbInputs(): number {
    return this.context.nbInputs;
  }

  /**
   * Get number of output pads
   */
  get nbOutputs(): number {
    return this.context.nbOutputs;
  }

  /**
   * Get AVOptions for this filter context
   * Allows runtime configuration of filter parameters
   */
  get options(): Options {
    this._options ??= new Options(this.context.options);
    return this._options;
  }

  // ==================== Public Methods ====================

  /**
   * Link this filter to another filter
   * @param dst Destination filter context
   * @param srcPad Output pad index of this filter
   * @param dstPad Input pad index of destination filter
   * @example
   * ```typescript
   * // Link output 0 of source to input 0 of destination
   * sourceContext.link(destContext, 0, 0);
   * ```
   */
  link(dst: FilterContext, srcPad: number, dstPad: number): void {
    this.context.link(dst.context, srcPad, dstPad);
  }

  /**
   * Unlink a filter pad
   * @param pad Pad index to unlink
   */
  unlink(pad: number): void {
    this.context.unlink(pad);
  }

  /**
   * Add a frame to a buffer source filter
   * @param frame Frame to add (null to signal end of stream)
   * @param flags Optional flags for the operation
   * @example
   * ```typescript
   * // Add a frame to buffer source
   * await bufferSrcContext.bufferSrcAddFrameAsync(frame);
   *
   * // Signal end of stream
   * await bufferSrcContext.bufferSrcAddFrameAsync(null);
   * ```
   */
  bufferSrcAddFrame(frame: Frame | null, flags = 0): void {
    this.context.bufferSrcAddFrame(frame?.getNative() ?? null, flags);
  }

  /**
   * Add a frame to a buffer source filter (async)
   * @param frame Frame to add (null to signal end of stream)
   * @param flags Optional flags for the operation
   * @returns Promise that resolves when frame is added
   */
  async bufferSrcAddFrameAsync(frame: Frame | null, flags = 0): Promise<void> {
    await this.context.bufferSrcAddFrameAsync(frame?.getNative() ?? null, flags);
  }

  /**
   * Get a frame from a buffer sink filter
   * @param frame Frame to receive the data
   * @param flags Optional flags for the operation
   * @returns 0 on success, negative on error
   * @example
   * ```typescript
   * const frame = new Frame();
   * const ret = bufferSinkContext.bufferSinkGetFrame(frame);
   * if (ret >= 0) {
   *   // Process frame
   * }
   * ```
   */
  bufferSinkGetFrame(frame: Frame, flags = 0): number {
    return this.context.bufferSinkGetFrame(frame.getNative(), flags);
  }

  /**
   * Get a frame from a buffer sink filter (async)
   * @param frame Frame to receive the data
   * @param flags Optional flags for the operation
   * @returns Promise that resolves when frame is retrieved
   */
  async bufferSinkGetFrameAsync(frame: Frame, flags = 0): Promise<number> {
    return await this.context.bufferSinkGetFrameAsync(frame.getNative(), flags);
  }

  // ==================== Internal Methods ====================

  /**
   * Get native filter context for internal use
   * @internal
   */
  getNative(): any {
    return this.context;
  }
}
