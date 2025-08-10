import { Filter } from './filter.js';
import type { Frame } from './frame.js';
import type { NativeFilterContext, NativeWrapper } from './native-types.js';

/**
 * Filter context - represents a filter instance in a graph
 *
 * Provides access to filter instance properties and operations.
 * Most users should use FilterGraph methods instead of direct FilterContext access.
 */
export class FilterContext implements Disposable, NativeWrapper<NativeFilterContext> {
  private context: NativeFilterContext;

  /**
   * Create a FilterContext wrapper
   * @param context Native filter context
   * @internal
   */
  constructor(context: NativeFilterContext) {
    this.context = context;
  }

  /**
   * Get filter instance name
   */
  get name(): string | null {
    return this.context.name;
  }

  /**
   * Get filter type name
   */
  get filterName(): string | null {
    return this.context.filterName;
  }

  /**
   * Get the filter definition
   */
  get filter(): Filter {
    // Create a Filter wrapper from the native filter
    return new (Filter as any)(this.context.filter);
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
   * Add a frame to buffer source
   * @param frame Frame to add (null to signal EOF)
   * @returns 0 on success, negative on error
   */
  addFrame(frame: Frame | null): number {
    return this.context.addFrame(frame ? frame.getNative() : null);
  }

  /**
   * Add a frame to buffer source (async)
   * @param frame Frame to add (null to signal EOF)
   * @returns Promise resolving to 0 on success, negative on error
   */
  async addFrameAsync(frame: Frame | null): Promise<number> {
    return this.context.addFrameAsync(frame ? frame.getNative() : null);
  }

  /**
   * Get a frame from buffer sink
   * @param frame Frame to receive data
   * @returns 0 on success, AVERROR_EOF on end, AVERROR_EAGAIN if no frame available
   */
  getFrame(frame: Frame): number {
    return this.context.getFrame(frame.getNative());
  }

  /**
   * Get a frame from buffer sink (async)
   * @param frame Frame to receive data
   * @returns Promise resolving to 0 on success, negative on error
   */
  async getFrameAsync(frame: Frame): Promise<number> {
    return this.context.getFrameAsync(frame.getNative());
  }

  /**
   * Set frame size for audio filters
   * @param frameSize Number of samples per frame
   */
  setFrameSize(frameSize: number): void {
    this.context.setFrameSize(frameSize);
  }

  /**
   * Free filter context resources
   */
  free(): void {
    this.context.free();
  }

  /**
   * Dispose of filter context (for using statement)
   */
  [Symbol.dispose](): void {
    this.free();
  }

  /**
   * Get native filter context for internal use
   * @internal
   */
  getNative(): NativeFilterContext {
    return this.context;
  }
}
