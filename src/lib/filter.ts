import { bindings } from './binding.js';
import { AV_FILTER_FLAG_HWDEVICE } from './constants.js';

import type { NativeFilter, NativeWrapper } from './native-types.js';

/**
 * Filter type for discovery purposes
 *
 * Used to discover available filters and check their capabilities.
 * Most users should just pass filter strings to FilterGraph.buildPipeline().
 *
 * @example
 * ```typescript
 * // Check if a filter exists and supports hardware
 * const filter = Filter.findByName('scale_cuda');
 * if (filter && filter.supportsHardwareDevice) {
 *   console.log('CUDA scaling available');
 * }
 * ```
 */
export class Filter implements NativeWrapper<NativeFilter> {
  private filter: NativeFilter;

  /**
   * @internal
   */
  constructor(filter: NativeFilter) {
    this.filter = filter;
  }

  /**
   * Find a filter by name
   * @param name Filter name (e.g., 'scale', 'scale_cuda', 'format')
   * @returns Filter instance or null if not found
   */
  static findByName(name: string): Filter | null {
    const native = bindings.Filter.findByName(name);
    return native ? new Filter(native) : null;
  }

  /**
   * Get filter name
   */
  get name(): string | null {
    return this.filter.name;
  }

  /**
   * Get filter description
   */
  get description(): string | null {
    return this.filter.description;
  }

  /**
   * Get filter flags
   */
  get flags(): number {
    return this.filter.flags;
  }

  /**
   * Check if filter supports hardware device contexts
   */
  get supportsHardwareDevice(): boolean {
    return (this.flags & AV_FILTER_FLAG_HWDEVICE) !== 0;
  }

  /**
   * Get native filter for internal use
   * @internal
   */
  getNative(): NativeFilter {
    return this.filter;
  }
}
