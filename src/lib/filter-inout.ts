import { bindings } from './binding.js';
import { FilterContext } from './filter-context.js';

import type { NativeFilterInOut, NativeWrapper } from './native-types.js';

/**
 * Filter input/output helper for graph parsing.
 *
 * Helper structure for parsing filter graphs with named inputs and outputs.
 * Used to connect external sources/sinks to specific points in a filter graph.
 * Supports linked lists for multiple I/O points in complex graphs.
 *
 * Direct mapping to FFmpeg's AVFilterInOut.
 *
 * @example
 * ```typescript
 * import { FilterInOut, FilterGraph, FFmpegError } from 'node-av';
 *
 * // Create input/output points for filter graph
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
 * // Parse filter graph string
 * const ret = filterGraph.parsePtr(
 *   '[in] scale=1280:720 [out]',
 *   inputs,
 *   outputs
 * );
 * FFmpegError.throwIfError(ret, 'parsePtr');
 *
 * // Clean up
 * inputs.free();
 * outputs.free();
 * ```
 */
export class FilterInOut implements Disposable, NativeWrapper<NativeFilterInOut> {
  private native: NativeFilterInOut;

  /**
   * Create a new FilterInOut instance.
   *
   * The structure is uninitialized - you must call alloc() before use.
   * No FFmpeg resources are allocated until alloc() is called.
   *
   * Direct wrapper around AVFilterInOut.
   *
   * @example
   * ```typescript
   * import { FilterInOut } from 'node-av';
   *
   * const inout = new FilterInOut();
   * inout.alloc();
   * // Structure is now ready for use
   * ```
   */
  constructor() {
    this.native = new bindings.FilterInOut();
  }

  /**
   * Create a linked list of FilterInOut structures.
   *
   * Helper method to create a chain of inputs or outputs.
   * Useful for complex filter graphs with multiple I/O points.
   *
   * @param items - Array of {name, filterCtx, padIdx} objects
   *
   * @returns The head of the linked list, or null if items is empty
   *
   * @example
   * ```typescript
   * import { FilterInOut, FilterGraph, FFmpegError } from 'node-av';
   *
   * // Create multiple inputs
   * const inputs = FilterInOut.createList([
   *   { name: 'video_in', filterCtx: videoBufferCtx, padIdx: 0 },
   *   { name: 'audio_in', filterCtx: audioBufferCtx, padIdx: 0 }
   * ]);
   *
   * // Use in filter graph
   * const ret = filterGraph.parsePtr(filterString, inputs, outputs);
   * FFmpegError.throwIfError(ret, 'parsePtr');
   *
   * // Free the entire list
   * inputs?.free();
   * ```
   */
  static createList(
    items: {
      name: string;
      filterCtx: FilterContext;
      padIdx: number;
    }[],
  ): FilterInOut | null {
    if (items.length === 0) return null;

    let head: FilterInOut | null = null;
    let current: FilterInOut | null = null;

    for (const item of items) {
      const inout = new FilterInOut();
      inout.alloc();
      inout.name = item.name;
      inout.filterCtx = item.filterCtx;
      inout.padIdx = item.padIdx;

      if (!head) {
        head = inout;
        current = inout;
      } else if (current) {
        current.next = inout;
        current = inout;
      }
    }

    return head;
  }

  /**
   * Name of this input/output point.
   *
   * Direct mapping to AVFilterInOut->name
   *
   * Used to reference this pad in filtergraph strings.
   */
  get name(): string | null {
    return this.native.name;
  }

  set name(value: string | null) {
    this.native.name = value;
  }

  /**
   * Associated filter context.
   *
   * Direct mapping to AVFilterInOut->filter_ctx
   *
   * The filter context this pad connects to.
   */
  get filterCtx(): FilterContext | null {
    const native = this.native.filterCtx;
    return native ? new FilterContext(native) : null;
  }

  set filterCtx(value: FilterContext | null) {
    this.native.filterCtx = value ? value.getNative() : null;
  }

  /**
   * Pad index.
   *
   * Direct mapping to AVFilterInOut->pad_idx
   *
   * The input or output pad index on the filter context.
   */
  get padIdx(): number {
    return this.native.padIdx;
  }

  set padIdx(value: number) {
    this.native.padIdx = value;
  }

  /**
   * Next element in the linked list.
   *
   * Direct mapping to AVFilterInOut->next
   *
   * Used to chain multiple inputs or outputs together.
   */
  get next(): FilterInOut | null {
    const native = this.native.next;
    if (!native) {
      return null;
    }

    const filterInOut = Object.create(FilterInOut.prototype) as FilterInOut;
    (filterInOut as any).native = native;
    return filterInOut;
  }

  set next(value: FilterInOut | null) {
    this.native.next = value ? value.getNative() : null;
  }

  /**
   * Allocate the FilterInOut structure.
   *
   * Allocates the structure and initializes it.
   * Must be called before setting properties or using the structure.
   *
   * Direct mapping to avfilter_inout_alloc()
   *
   * @throws {Error} Memory allocation failure (ENOMEM)
   *
   * @example
   * ```typescript
   * import { FilterInOut } from 'node-av';
   *
   * const inout = new FilterInOut();
   * inout.alloc();
   * // Structure is now allocated and ready
   * ```
   *
   * @see {@link free} To free the structure
   */
  alloc(): void {
    this.native.alloc();
  }

  /**
   * Free the FilterInOut structure.
   *
   * Releases all resources associated with the structure.
   * Also frees any linked structures in the chain.
   *
   * Direct mapping to avfilter_inout_free()
   *
   * @example
   * ```typescript
   * inout.free();
   * // inout is now invalid and should not be used
   * ```
   */
  free(): void {
    this.native.free();
  }

  /**
   * Count elements in the linked list.
   *
   * Helper method to count all elements starting from this one.
   *
   * @returns Number of elements including this one
   *
   * @example
   * ```typescript
   * const inputs = FilterInOut.createList([...]);
   * console.log(`Total inputs: ${inputs?.count()}`); // e.g., "Total inputs: 3"
   * ```
   */
  count(): number {
    let count = 1;
    let current: FilterInOut | null = this.next;

    while (current) {
      count++;
      current = current.next;
    }

    return count;
  }

  /**
   * Get the native FFmpeg AVFilterInOut pointer.
   *
   * @internal For use by other wrapper classes
   * @returns The underlying native FilterInOut object
   */
  getNative(): NativeFilterInOut {
    return this.native;
  }

  /**
   * Dispose of the FilterInOut structure.
   *
   * Implements the Disposable interface for automatic cleanup.
   * Equivalent to calling free().
   *
   * @example
   * ```typescript
   * {
   *   using inout = new FilterInOut();
   *   inout.alloc();
   *   // ... use structure
   * } // Automatically freed when leaving scope
   * ```
   */
  [Symbol.dispose](): void {
    this.native[Symbol.dispose]();
  }
}
