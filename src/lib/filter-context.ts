import type { NativeFilterContext, NativeWrapper } from './native-types.js';

/**
 * Filter context - represents a filter instance in a graph
 *
 * Minimal wrapper for advanced users who need direct access
 * to filter contexts. Most users should use FilterGraph methods.
 *
 * @internal
 */
export class FilterContext implements NativeWrapper<NativeFilterContext> {
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
   * Get native filter context for internal use
   * @internal
   */
  getNative(): NativeFilterContext {
    return this.context;
  }
}
